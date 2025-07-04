import { beforeEach, describe, expect, it } from 'vitest';
import { ConversionWorkflow } from '../../src/figma-to-weweb/simple-converter';

describe('container Node Conversion', () => {
    let workflow: ConversionWorkflow;

    beforeEach(() => {
        workflow = new ConversionWorkflow();
        Object.assign(figma, {
            currentPage: {
                selection: [],
            },
        });
    });

    describe('container with maxWidth and responsive padding', () => {
        it('should convert Container node with maxWidth and responsive styles', async () => {
            // Given: A nested structure with Container as child of Header
            const figmaNode = {
                id: 'I1647:388494;1296:1034',
                name: 'Dropdown header navigation',
                type: 'INSTANCE',
                visible: true,
                width: 1440,
                height: 76,
                layoutMode: 'NONE',
                children: [
                    {
                        id: 'I1647:388494;1296:1034;7582:193427',
                        name: 'Header',
                        type: 'FRAME',
                        visible: true,
                        width: 1440,
                        height: 76,
                        layoutMode: 'VERTICAL',
                        layoutSizingHorizontal: 'FIXED',
                        layoutSizingVertical: 'HUG',
                        primaryAxisAlignItems: 'CENTER',
                        counterAxisAlignItems: 'CENTER',
                        paddingTop: 12,
                        paddingBottom: 0,
                        paddingLeft: 0,
                        paddingRight: 0,
                        children: [
                            {
                                id: 'I1647:388494;1296:1034;7582:193428',
                                name: 'Container',
                                type: 'FRAME',
                                visible: true,
                                width: 1280,
                                height: 64,
                                x: 80,
                                y: 12,
                                layoutMode: 'HORIZONTAL',
                                layoutSizingHorizontal: 'FILL',
                                layoutSizingVertical: 'HUG',
                                primaryAxisAlignItems: 'SPACE_BETWEEN',
                                counterAxisAlignItems: 'CENTER',
                                itemSpacing: 0,
                                layoutPositioning: 'AUTO',
                                maxWidth: 1280,
                                cornerRadius: 0,
                                paddingLeft: 32,
                                paddingRight: 32,
                                paddingTop: 0,
                                paddingBottom: 0,
                                children: [],
                            },
                        ],
                    },
                ],
            };

            figma.currentPage.selection = [figmaNode as any];

            // When: Converting to WeWeb
            const result = await workflow.convertSelection();

            // Then: Navigate to Container
            const header = result.component.slots?.children[0];
            expect(header.slots?.children).toHaveLength(1);

            const container = header.slots?.children[0];

            // Check basic structure
            expect(container).toMatchObject({
                tag: 'ww-div',
                name: 'Container',
                attrs: {
                    'data-figma-id': 'I1647:388494;1296:1034;7582:193428',
                    'data-figma-name': 'Container',
                    'data-figma-type': 'FRAME',
                },
            });

            // Check default styles
            expect(container.styles?.default).toMatchObject({
                display: 'flex',
                width: '100%',
                maxWidth: '1280px',
                paddingLeft: '32px',
                paddingRight: '32px',
                alignItems: 'center',
                justifyContent: 'space-between',
            });

            // Check tablet styles
            expect(container.styles?.tablet).toMatchObject({
                maxWidth: '100%',
                paddingLeft: '20px',
                paddingRight: '20px',
            });
        });

        it('should handle maxWidth property correctly', async () => {
            // Given: Nodes with different maxWidth values
            const figmaNode = {
                id: 'root',
                name: 'Root',
                type: 'FRAME',
                visible: true,
                width: 1920,
                height: 1080,
                layoutMode: 'VERTICAL',
                children: [
                    {
                        id: 'constrained',
                        name: 'Constrained Container',
                        type: 'FRAME',
                        visible: true,
                        width: 1200,
                        height: 100,
                        maxWidth: 960,
                        layoutMode: 'HORIZONTAL',
                        children: [],
                    },
                    {
                        id: 'unconstrained',
                        name: 'Unconstrained Container',
                        type: 'FRAME',
                        visible: true,
                        width: 800,
                        height: 100,
                        layoutMode: 'HORIZONTAL',
                        children: [],
                    },
                ],
            };

            figma.currentPage.selection = [figmaNode as any];

            const result = await workflow.convertSelection();

            const constrained = result.component.slots?.children[0];
            const unconstrained = result.component.slots?.children[1];

            // Constrained should have maxWidth
            expect(constrained.styles?.default?.maxWidth).toBe('960px');

            // Unconstrained should not have maxWidth
            expect(unconstrained.styles?.default?.maxWidth).toBeUndefined();
        });

        it('should add responsive padding reduction for tablet', async () => {
            // Given: A container with padding
            const figmaNode = {
                id: 'container',
                name: 'Padded Container',
                type: 'FRAME',
                visible: true,
                width: 1200,
                height: 500,
                layoutMode: 'HORIZONTAL',
                paddingLeft: 40,
                paddingRight: 40,
                paddingTop: 24,
                paddingBottom: 24,
                children: [],
            };

            figma.currentPage.selection = [figmaNode as any];

            const result = await workflow.convertSelection();

            // Check default padding
            expect(result.component.styles?.default).toMatchObject({
                paddingLeft: '40px',
                paddingRight: '40px',
                paddingTop: '24px',
                paddingBottom: '24px',
            });

            // Check tablet padding reduction
            expect(result.component.styles?.tablet?.paddingLeft).toBeDefined();
            expect(result.component.styles?.tablet?.paddingRight).toBeDefined();

            // Padding should be reduced for tablet
            const defaultPadding = Number.parseInt(result.component.styles.default.paddingLeft);
            const tabletPadding = Number.parseInt(result.component.styles.tablet.paddingLeft);
            expect(tabletPadding).toBeLessThan(defaultPadding);
        });

        it('should handle FILL width with parent context', async () => {
            // Given: Container with FILL width inside a parent
            const figmaNode = {
                id: 'parent',
                name: 'Parent',
                type: 'FRAME',
                visible: true,
                width: 1440,
                height: 800,
                layoutMode: 'VERTICAL',
                children: [
                    {
                        id: 'fill-child',
                        name: 'Fill Container',
                        type: 'FRAME',
                        visible: true,
                        width: 1440,
                        height: 100,
                        layoutSizingHorizontal: 'FILL',
                        layoutMode: 'HORIZONTAL',
                        maxWidth: 1200,
                        paddingLeft: 24,
                        paddingRight: 24,
                        children: [],
                    },
                ],
            };

            figma.currentPage.selection = [figmaNode as any];

            const result = await workflow.convertSelection();

            const fillChild = result.component.slots?.children[0];

            // FILL should result in 100% width
            expect(fillChild.styles?.default?.width).toBe('100%');

            // maxWidth should be preserved
            expect(fillChild.styles?.default?.maxWidth).toBe('1200px');
        });
    });
});
