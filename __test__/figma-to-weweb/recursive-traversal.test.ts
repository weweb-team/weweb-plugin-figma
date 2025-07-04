import { beforeEach, describe, expect, it } from 'vitest';
import { ConversionWorkflow } from '../../src/figma-to-weweb/simple-converter';

describe('recursive Tree Traversal', () => {
    let workflow: ConversionWorkflow;

    beforeEach(() => {
        workflow = new ConversionWorkflow();
        Object.assign(figma, {
            currentPage: {
                selection: [],
            },
        });
    });

    describe('deep nested structure', () => {
        it('should traverse and convert all nested children recursively', async () => {
            // Given: A deeply nested structure
            const figmaNode = {
                id: 'root',
                name: 'Root Container',
                type: 'FRAME',
                visible: true,
                width: 1440,
                height: 800,
                layoutMode: 'VERTICAL',
                children: [
                    {
                        id: 'level-1',
                        name: 'Level 1 Container',
                        type: 'FRAME',
                        visible: true,
                        width: 1440,
                        height: 400,
                        layoutMode: 'HORIZONTAL',
                        children: [
                            {
                                id: 'level-2-a',
                                name: 'Level 2A',
                                type: 'FRAME',
                                visible: true,
                                width: 720,
                                height: 400,
                                layoutMode: 'VERTICAL',
                                children: [
                                    {
                                        id: 'text-1',
                                        name: 'Deep Text 1',
                                        type: 'TEXT',
                                        visible: true,
                                        characters: 'Hello from deep level',
                                        fontSize: 16,
                                        width: 200,
                                        height: 24,
                                    },
                                    {
                                        id: 'level-3',
                                        name: 'Level 3 Container',
                                        type: 'FRAME',
                                        visible: true,
                                        width: 720,
                                        height: 100,
                                        layoutMode: 'HORIZONTAL',
                                        children: [
                                            {
                                                id: 'text-2',
                                                name: 'Deeper Text',
                                                type: 'TEXT',
                                                visible: true,
                                                characters: 'Even deeper text',
                                                fontSize: 14,
                                                width: 150,
                                                height: 20,
                                            },
                                        ],
                                    },
                                ],
                            },
                            {
                                id: 'level-2-b',
                                name: 'Level 2B',
                                type: 'FRAME',
                                visible: true,
                                width: 720,
                                height: 400,
                                layoutMode: 'NONE',
                                children: [
                                    {
                                        id: 'text-3',
                                        name: 'Side Text',
                                        type: 'TEXT',
                                        visible: true,
                                        characters: 'Side content',
                                        fontSize: 16,
                                        width: 100,
                                        height: 24,
                                    },
                                ],
                            },
                        ],
                    },
                ],
            };

            figma.currentPage.selection = [figmaNode as any];

            // When: Converting to WeWeb
            const result = await workflow.convertSelection();

            // Then: Root should be converted
            expect(result.component.name).toBe('Root Container');
            expect(result.component.tag).toBe('ww-div');

            // Then: Should have Level 1 as child
            expect(result.component.slots?.children).toBeDefined();
            expect(Array.isArray(result.component.slots?.children)).toBe(true);
            expect(result.component.slots?.children).toHaveLength(1);

            const level1 = result.component.slots?.children[0];
            expect(level1.name).toBe('Level 1 Container');
            expect(level1.tag).toBe('ww-div');
            expect(level1.styles?.default?.flexDirection).toBe('row');

            // Then: Level 1 should have 2 children (Level 2A and 2B)
            expect(level1.slots?.children).toHaveLength(2);

            const level2a = level1.slots?.children[0];
            const level2b = level1.slots?.children[1];

            expect(level2a.name).toBe('Level 2A');
            expect(level2b.name).toBe('Level 2B');

            // Then: Level 2A should have 2 children (text and Level 3)
            expect(level2a.slots?.children).toHaveLength(2);

            const text1 = level2a.slots?.children[0];
            const level3 = level2a.slots?.children[1];

            expect(text1.tag).toBe('ww-text');
            expect(text1.props?.default?.text).toBe('Hello from deep level');

            expect(level3.name).toBe('Level 3 Container');
            expect(level3.slots?.children).toHaveLength(1);

            // Then: Level 3 should have the deepest text
            const deepestText = level3.slots?.children[0];
            expect(deepestText.tag).toBe('ww-text');
            expect(deepestText.props?.default?.text).toBe('Even deeper text');

            // Then: Level 2B should have its text
            expect(level2b.slots?.children).toHaveLength(1);
            const sideText = level2b.slots?.children[0];
            expect(sideText.tag).toBe('ww-text');
            expect(sideText.props?.default?.text).toBe('Side content');
        });

        it('should handle empty containers', async () => {
            // Given: Containers with no children
            const figmaNode = {
                id: 'root',
                name: 'Root',
                type: 'FRAME',
                visible: true,
                width: 100,
                height: 100,
                layoutMode: 'VERTICAL',
                children: [
                    {
                        id: 'empty-1',
                        name: 'Empty Container',
                        type: 'FRAME',
                        visible: true,
                        width: 100,
                        height: 50,
                        layoutMode: 'HORIZONTAL',
                        children: [],
                    },
                    {
                        id: 'with-nested-empty',
                        name: 'Has Empty Child',
                        type: 'FRAME',
                        visible: true,
                        width: 100,
                        height: 50,
                        layoutMode: 'VERTICAL',
                        children: [
                            {
                                id: 'empty-nested',
                                name: 'Nested Empty',
                                type: 'FRAME',
                                visible: true,
                                width: 100,
                                height: 25,
                                layoutMode: 'NONE',
                                children: [],
                            },
                        ],
                    },
                ],
            };

            figma.currentPage.selection = [figmaNode as any];

            const result = await workflow.convertSelection();

            // Root should have 2 children
            expect(result.component.slots?.children).toHaveLength(2);

            // First child should be empty
            const emptyContainer = result.component.slots?.children[0];
            expect(emptyContainer.name).toBe('Empty Container');
            expect(emptyContainer.slots?.children).toEqual([]);

            // Second child should have one empty nested child
            const hasEmptyChild = result.component.slots?.children[1];
            expect(hasEmptyChild.slots?.children).toHaveLength(1);
            expect(hasEmptyChild.slots?.children[0].name).toBe('Nested Empty');
            expect(hasEmptyChild.slots?.children[0].slots?.children).toEqual([]);
        });
    });
});
