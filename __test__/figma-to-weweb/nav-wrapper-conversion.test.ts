import { beforeEach, describe, expect, it } from 'vitest';
import { ConversionWorkflow } from '../../src/figma-to-weweb/simple-converter';

describe('nav Wrapper Conversion', () => {
    let workflow: ConversionWorkflow;

    beforeEach(() => {
        workflow = new ConversionWorkflow();
        // Extend the figma mock with variables API
        figma.currentPage.selection = [];
        figma.variables = {
            getVariableById: (id: string) => {
                // Mock variable data
                const variables = {
                    'VariableID:color/gray-200': {
                        id: 'VariableID:color/gray-200',
                        name: 'Gray-200',
                        resolvedType: 'COLOR',
                        valuesByMode: {
                            default: { r: 0.91, g: 0.92, b: 0.92, a: 1 },
                        },
                    },
                    'VariableID:shadow/xs': {
                        id: 'VariableID:shadow/xs',
                        name: 'shadow-xs',
                        resolvedType: 'COLOR',
                        valuesByMode: {
                            default: { r: 0.04, g: 0.05, b: 0.07, a: 0.05 },
                        },
                    },
                    'VariableID:color/white': {
                        id: 'VariableID:color/white',
                        name: 'Base-White',
                        resolvedType: 'COLOR',
                        valuesByMode: {
                            default: { r: 1, g: 1, b: 1, a: 1 },
                        },
                    },
                };
                return variables[id];
            },
        };
    });

    describe('nav wrapper with border, shadow and flex properties', () => {
        it('should convert Nav wrapper with all required styles', async () => {
            // Given: Exact Nav wrapper from fixture with additional style properties
            const navWrapper = {
                id: 'I1647:388494;1296:1034;7582:193429',
                name: 'Nav wrapper',
                type: 'FRAME',
                visible: true,
                width: 1216,
                height: 64,
                x: 32,
                y: 0,
                layoutMode: 'HORIZONTAL',
                layoutSizingHorizontal: 'FIXED',
                layoutSizingVertical: 'HUG',
                primaryAxisAlignItems: 'SPACE_BETWEEN',
                counterAxisAlignItems: 'CENTER',
                itemSpacing: 0,
                layoutPositioning: 'AUTO',
                cornerRadius: 16,
                paddingLeft: 16,
                paddingRight: 12,
                paddingTop: 12,
                paddingBottom: 12,
                // Additional properties needed for the expected styles
                layoutGrow: 1,
                layoutAlign: 'STRETCH',
                minWidth: 240,
                layoutWrap: 'WRAP',
                counterAxisSpacing: 100,
                // Primary spacing for wrapped layouts
                primaryAxisSpacing: 40,
                // Stroke for border
                strokes: [{
                    type: 'SOLID',
                    visible: true,
                    color: { r: 0.91, g: 0.92, b: 0.92, a: 1 },
                    opacity: 1,
                    boundVariables: {
                        color: { id: 'VariableID:color/gray-200' },
                    },
                }],
                strokeWeight: 1,
                strokeAlign: 'INSIDE',
                // Effects for shadow
                effects: [{
                    type: 'DROP_SHADOW',
                    visible: true,
                    color: { r: 0.04, g: 0.05, b: 0.07, a: 0.05 },
                    offset: { x: 0, y: 1 },
                    radius: 2,
                    spread: 0,
                    boundVariables: {
                        color: { id: 'VariableID:shadow/xs' },
                    },
                }],
                // Fills for background
                fills: [{
                    type: 'SOLID',
                    visible: true,
                    color: { r: 1, g: 1, b: 1, a: 1 },
                    opacity: 1,
                    boundVariables: {
                        color: { id: 'VariableID:color/white' },
                    },
                }],
                parent: {
                    id: 'I1647:388494;1296:1034;7582:193428',
                    name: 'Container',
                    type: 'FRAME',
                    layoutMode: 'HORIZONTAL',
                    width: 1280,
                },
                children: [],
            };

            // Create the full navigation structure
            const navigation = {
                id: 'I1647:388494;1296:1034',
                name: 'Dropdown header navigation',
                type: 'INSTANCE',
                visible: true,
                width: 1440,
                height: 76,
                children: [{
                    id: 'I1647:388494;1296:1034;7582:193427',
                    name: 'Header',
                    type: 'FRAME',
                    visible: true,
                    width: 1440,
                    height: 76,
                    children: [{
                        id: 'I1647:388494;1296:1034;7582:193428',
                        name: 'Container',
                        type: 'FRAME',
                        visible: true,
                        width: 1280,
                        height: 64,
                        layoutMode: 'HORIZONTAL',
                        children: [navWrapper],
                    }],
                }],
            };

            figma.currentPage.selection = [navigation as any];

            // When: Converting to WeWeb
            const result = await workflow.convertSelection();

            // Then: Navigate to Nav wrapper
            const header = result.component.slots?.children[0];
            const container = header.slots?.children[0];
            const navWrapperComponent = container.slots?.children[0];

            // Check basic structure
            expect(navWrapperComponent).toMatchObject({
                tag: 'ww-div',
                name: 'Nav wrapper',
                attrs: {
                    'data-figma-id': 'I1647:388494;1296:1034;7582:193429',
                    'data-figma-name': 'Nav wrapper',
                    'data-figma-type': 'FRAME',
                },
            });

            // Check all required styles exactly as specified
            expect(navWrapperComponent.styles?.default).toMatchObject({
                justifyContent: 'space-between',
                alignItems: 'center',
                borderRadius: '16px',
                border: '1px solid var(--Gray-200, #E8EBEB)',
                boxShadow: '0px 1px 2px 0px var(--shadow-xs, rgba(10, 13, 18, 0.05))',
                alignSelf: 'stretch',
                display: 'flex',
                minWidth: '240px',
                marginTop: 'auto',
                marginBottom: 'auto',
                width: '100%',
                paddingLeft: '16px',
                paddingRight: '12px',
                paddingTop: '12px',
                paddingBottom: '12px',
                gap: '40px 100px',
                flexWrap: 'wrap',
                flex: '1',
                flexShrink: '1',
                flexBasis: '0%',
                background: 'var(--Base-White, #FFF)',
            });

            // Check tablet styles
            expect(navWrapperComponent.styles?.tablet).toMatchObject({
                maxWidth: '100%',
            });

            // Check that variables are collected
            expect(result.usedVariables).toHaveProperty('VariableID:color/gray-200');
            expect(result.usedVariables).toHaveProperty('VariableID:shadow/xs');
            expect(result.usedVariables).toHaveProperty('VariableID:color/white');
        });

        it('should extract border styles from strokes', async () => {
            const nodeWithBorder = {
                id: 'border-node',
                name: 'Border Test',
                type: 'FRAME',
                visible: true,
                width: 200,
                height: 100,
                strokes: [{
                    type: 'SOLID',
                    visible: true,
                    color: { r: 0.91, g: 0.92, b: 0.92, a: 1 },
                    opacity: 1,
                    boundVariables: {
                        color: { id: 'VariableID:color/gray-200' },
                    },
                }],
                strokeWeight: 1,
                strokeAlign: 'INSIDE',
                children: [],
            };

            figma.currentPage.selection = [nodeWithBorder as any];

            const result = await workflow.convertSelection();

            expect(result.component.styles?.default?.border).toBe('1px solid var(--Gray-200, #E8EBEB)');
        });

        it('should extract box shadow from effects', async () => {
            const nodeWithShadow = {
                id: 'shadow-node',
                name: 'Shadow Test',
                type: 'FRAME',
                visible: true,
                width: 200,
                height: 100,
                effects: [{
                    type: 'DROP_SHADOW',
                    visible: true,
                    color: { r: 0.04, g: 0.05, b: 0.07, a: 0.05 },
                    offset: { x: 0, y: 1 },
                    radius: 2,
                    spread: 0,
                    boundVariables: {
                        color: { id: 'VariableID:shadow/xs' },
                    },
                }],
                children: [],
            };

            figma.currentPage.selection = [nodeWithShadow as any];

            const result = await workflow.convertSelection();

            expect(result.component.styles?.default?.boxShadow).toBe('0px 1px 2px 0px var(--shadow-xs, rgba(10, 13, 18, 0.05))');
        });

        it('should extract flex properties', async () => {
            const nodeWithFlex = {
                id: 'flex-node',
                name: 'Flex Test',
                type: 'FRAME',
                visible: true,
                width: 200,
                height: 100,
                layoutMode: 'HORIZONTAL',
                layoutGrow: 1,
                layoutAlign: 'STRETCH',
                minWidth: 240,
                children: [],
            };

            figma.currentPage.selection = [nodeWithFlex as any];

            const result = await workflow.convertSelection();

            expect(result.component.styles?.default).toMatchObject({
                flex: '1',
                flexShrink: '1',
                flexBasis: '0%',
                alignSelf: 'stretch',
                minWidth: '240px',
            });
        });

        it('should extract dual-value gap for wrapped layouts', async () => {
            const nodeWithWrap = {
                id: 'wrap-node',
                name: 'Wrap Test',
                type: 'FRAME',
                visible: true,
                width: 400,
                height: 200,
                layoutMode: 'HORIZONTAL',
                layoutWrap: 'WRAP',
                primaryAxisSpacing: 40,
                counterAxisSpacing: 100,
                children: [],
            };

            figma.currentPage.selection = [nodeWithWrap as any];

            const result = await workflow.convertSelection();

            expect(result.component.styles?.default).toMatchObject({
                flexWrap: 'wrap',
                gap: '40px 100px',
            });
        });

        it('should handle background fills with variables', async () => {
            const nodeWithBackground = {
                id: 'bg-node',
                name: 'Background Test',
                type: 'FRAME',
                visible: true,
                width: 200,
                height: 100,
                fills: [{
                    type: 'SOLID',
                    visible: true,
                    color: { r: 1, g: 1, b: 1, a: 1 },
                    opacity: 1,
                    boundVariables: {
                        color: { id: 'VariableID:color/white' },
                    },
                }],
                children: [],
            };

            figma.currentPage.selection = [nodeWithBackground as any];

            const result = await workflow.convertSelection();

            expect(result.component.styles?.default?.background).toBe('var(--Base-White, #FFF)');
        });

        it('should handle auto margins for centered nodes', async () => {
            const centeredNode = {
                id: 'centered-node',
                name: 'Centered Node',
                type: 'FRAME',
                visible: true,
                width: 1216,
                height: 64,
                x: 32, // (1280 - 1216) / 2 = 32
                layoutMode: 'HORIZONTAL',
                layoutPositioning: 'AUTO',
                parent: {
                    width: 1280,
                    layoutMode: 'HORIZONTAL',
                },
                children: [],
            };

            figma.currentPage.selection = [centeredNode as any];

            const result = await workflow.convertSelection();

            expect(result.component.styles?.default).toMatchObject({
                marginTop: 'auto',
                marginBottom: 'auto',
            });
        });

        it('should convert with width 100% when node width is close to parent width', async () => {
            const almostFullWidth = {
                id: 'almost-full',
                name: 'Almost Full Width',
                type: 'FRAME',
                visible: true,
                width: 1216, // Parent is 1280, this is 95%
                height: 64,
                layoutMode: 'HORIZONTAL',
                parent: {
                    width: 1280,
                    layoutMode: 'HORIZONTAL',
                },
                children: [],
            };

            figma.currentPage.selection = [almostFullWidth as any];

            const result = await workflow.convertSelection();

            // Should use 100% when width is > 95% of parent
            expect(result.component.styles?.default?.width).toBe('100%');
        });
    });
});
