import { beforeEach, describe, expect, it } from 'vitest';
import { ConversionWorkflow } from '../../src/figma-to-weweb/simple-converter';
import dropdownNavigation from './fixtures/dropdown-navigation.json';

describe('conversionWorkflow - Snapshot Tests', () => {
    let workflow: ConversionWorkflow;

    beforeEach(() => {
        workflow = new ConversionWorkflow();
        // Mock Figma API
        Object.assign(figma, {
            currentPage: {
                selection: [],
            },
        });
    });

    describe('dropdown Navigation Component', () => {
        it('should convert dropdown navigation correctly', async () => {
            // Mock the selection with our fixture data
            figma.currentPage.selection = [dropdownNavigation as any];

            const result = await workflow.convertSelection();

            // Snapshot test the entire conversion result
            expect(result).toMatchSnapshot();
        });

        it('should extract component structure correctly', async () => {
            figma.currentPage.selection = [dropdownNavigation as any];

            const result = await workflow.convertSelection();

            // Test specific aspects
            expect(result.component.tag).toBe('ww-div');
            expect(result.component.name).toBe('Dropdown header navigation');
            expect(result.component.attrs).toMatchObject({
                'data-figma-id': 'I1647:388494;1296:1034',
                'data-figma-name': 'Dropdown header navigation',
                'data-figma-type': 'INSTANCE',
            });

            // Snapshot just the component structure
            expect(result.component).toMatchSnapshot('component-structure');
        });

        it('should handle layout properties correctly', async () => {
            figma.currentPage.selection = [dropdownNavigation as any];

            const result = await workflow.convertSelection();

            // Check main container styles
            expect(result.component.styles?.default).toMatchObject({
                width: '100%', // Changed because of Rule 3: node width equals parent width
                height: '76px',
            });

            // Snapshot the styles
            expect(result.component.styles).toMatchSnapshot('component-styles');
        });

        it('should handle nested children correctly', async () => {
            figma.currentPage.selection = [dropdownNavigation as any];

            const result = await workflow.convertSelection();

            // Check that children are processed
            expect(result.component.slots?.children).toBeDefined();
            expect(Array.isArray(result.component.slots?.children)).toBe(true);

            // Snapshot the children structure
            expect(result.component.slots).toMatchSnapshot('component-children');
        });

        it('should extract text content correctly', async () => {
            figma.currentPage.selection = [dropdownNavigation as any];

            const result = await workflow.convertSelection();

            // Extract all text from the component tree
            const extractText = (component: any): string[] => {
                const texts: string[] = [];

                if (component.tag === 'ww-text' && component.props?.default?.text) {
                    texts.push(component.props.default.text);
                }

                if (component.slots?.children) {
                    const children = Array.isArray(component.slots.children)
                        ? component.slots.children
                        : [component.slots.children];

                    for (const child of children) {
                        texts.push(...extractText(child));
                    }
                }

                return texts;
            };

            const allTexts = extractText(result.component);

            // Should contain the navigation text
            expect(allTexts).toContain('Resources');
            expect(allTexts).toContain('Sign up');

            // Snapshot all extracted texts
            expect(allTexts).toMatchSnapshot('extracted-texts');
        });

        it('should collect fonts correctly', async () => {
            figma.currentPage.selection = [dropdownNavigation as any];

            const result = await workflow.convertSelection();

            // Check fonts collection
            expect(result.fonts).toBeDefined();
            expect(Array.isArray(result.fonts)).toBe(true);

            // Snapshot fonts
            expect(result.fonts).toMatchSnapshot('collected-fonts');
        });
    });

    describe('edge Cases', () => {
        it('should handle nodes without children', async () => {
            const simpleNode = {
                id: 'simple-1',
                name: 'Simple Rectangle',
                type: 'RECTANGLE',
                visible: true,
                width: 100,
                height: 50,
                x: 0,
                y: 0,
                fills: [{
                    type: 'SOLID',
                    color: { r: 1, g: 0, b: 0 },
                    opacity: 1,
                    visible: true,
                }],
            };

            figma.currentPage.selection = [simpleNode as any];

            const result = await workflow.convertSelection();

            expect(result.component).toMatchSnapshot('simple-rectangle');
        });

        it('should handle text nodes with special characters', async () => {
            const textNode = {
                id: 'text-1',
                name: 'Special Text',
                type: 'TEXT',
                visible: true,
                characters: 'Hello "World" & <Friends>!',
                fontSize: 16,
                fontName: { family: 'Inter', style: 'Regular' },
                fills: [{
                    type: 'SOLID',
                    color: { r: 0, g: 0, b: 0 },
                    opacity: 1,
                    visible: true,
                }],
            };

            figma.currentPage.selection = [textNode as any];

            const result = await workflow.convertSelection();

            expect(result.component.props?.default?.text).toBe('Hello "World" & <Friends>!');
            expect(result.component).toMatchSnapshot('text-with-special-chars');
        });
    });
});
