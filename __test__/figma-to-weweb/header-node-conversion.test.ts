import { beforeEach, describe, expect, it } from 'vitest';
import { ConversionWorkflow } from '../../src/figma-to-weweb/simple-converter';

describe('header Node Conversion', () => {
    let workflow: ConversionWorkflow;

    beforeEach(() => {
        workflow = new ConversionWorkflow();
        Object.assign(figma, {
            currentPage: {
                selection: [],
            },
        });
    });

    describe('header with vertical layout and padding', () => {
        it('should convert Header node with proper flexbox and padding styles', async () => {
            // Given: A navigation structure with Header as first child
            const figmaNode = {
                id: 'I1647:388494;1296:1034',
                name: 'Dropdown header navigation',
                type: 'INSTANCE',
                visible: true,
                width: 1440,
                height: 76,
                x: 0,
                y: 0,
                layoutMode: 'NONE',
                layoutSizingHorizontal: 'FILL',
                layoutSizingVertical: 'FIXED',
                primaryAxisAlignItems: 'MIN',
                counterAxisAlignItems: 'CENTER',
                itemSpacing: 0,
                layoutPositioning: 'AUTO',
                cornerRadius: 0,
                paddingLeft: 0,
                paddingRight: 0,
                paddingTop: 0,
                paddingBottom: 0,
                children: [
                    {
                        id: 'I1647:388494;1296:1034;7582:193427',
                        name: 'Header',
                        type: 'FRAME',
                        visible: true,
                        width: 1440,
                        height: 76,
                        x: 0,
                        y: 0,
                        layoutMode: 'VERTICAL',
                        layoutSizingHorizontal: 'FIXED',
                        layoutSizingVertical: 'HUG',
                        primaryAxisAlignItems: 'CENTER',
                        counterAxisAlignItems: 'CENTER',
                        itemSpacing: 0,
                        layoutPositioning: 'AUTO',
                        cornerRadius: 0,
                        paddingLeft: 0,
                        paddingRight: 0,
                        paddingTop: 12,
                        paddingBottom: 0,
                        children: [],
                    },
                ],
            };

            figma.currentPage.selection = [figmaNode as any];

            // When: Converting to WeWeb
            const result = await workflow.convertSelection();

            // Then: Root should have the Header as first child
            expect(result.component.slots?.children).toHaveLength(1);

            const headerComponent = result.component.slots?.children[0];

            // Check basic structure
            expect(headerComponent).toMatchObject({
                tag: 'ww-div',
                name: 'Header',
                attrs: {
                    'data-figma-id': 'I1647:388494;1296:1034;7582:193427',
                    'data-figma-name': 'Header',
                    'data-figma-type': 'FRAME',
                },
            });

            // Check default styles
            expect(headerComponent.styles?.default).toMatchObject({
                display: 'flex',
                width: '100%',
                paddingTop: '12px',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
            });

            // Check that tablet styles are present
            expect(headerComponent.styles?.tablet).toMatchObject({
                maxWidth: '100%',
            });
        });

        it('should handle different padding values correctly', async () => {
            // Given: A frame with all padding values set
            const figmaNode = {
                id: 'frame-1',
                name: 'Padded Frame',
                type: 'FRAME',
                visible: true,
                width: 500,
                height: 300,
                layoutMode: 'HORIZONTAL',
                primaryAxisAlignItems: 'SPACE_BETWEEN',
                counterAxisAlignItems: 'CENTER',
                paddingLeft: 24,
                paddingRight: 32,
                paddingTop: 16,
                paddingBottom: 20,
                children: [],
            };

            figma.currentPage.selection = [figmaNode as any];

            const result = await workflow.convertSelection();

            expect(result.component.styles?.default).toMatchObject({
                paddingTop: '16px',
                paddingRight: '32px',
                paddingBottom: '20px',
                paddingLeft: '24px',
            });
        });

        it('should handle width 100% conversion for layoutSizingHorizontal FILL', async () => {
            // Given: Nodes with different layoutSizingHorizontal values
            const figmaNode = {
                id: 'root',
                name: 'Root',
                type: 'FRAME',
                visible: true,
                width: 1000,
                height: 500,
                layoutMode: 'VERTICAL',
                children: [
                    {
                        id: 'fill-width',
                        name: 'Fill Width',
                        type: 'FRAME',
                        visible: true,
                        width: 1000,
                        height: 100,
                        layoutSizingHorizontal: 'FILL',
                        layoutSizingVertical: 'FIXED',
                        layoutMode: 'NONE',
                        children: [],
                    },
                    {
                        id: 'fixed-width',
                        name: 'Fixed Width',
                        type: 'FRAME',
                        visible: true,
                        width: 500,
                        height: 100,
                        layoutSizingHorizontal: 'FIXED',
                        layoutSizingVertical: 'FIXED',
                        layoutMode: 'NONE',
                        children: [],
                    },
                ],
            };

            figma.currentPage.selection = [figmaNode as any];

            const result = await workflow.convertSelection();

            const fillChild = result.component.slots?.children[0];
            const fixedChild = result.component.slots?.children[1];

            // FILL should be converted to 100%
            expect(fillChild.styles?.default?.width).toBe('100%');

            // FIXED should keep pixel value
            expect(fixedChild.styles?.default?.width).toBe('500px');
        });
    });
});
