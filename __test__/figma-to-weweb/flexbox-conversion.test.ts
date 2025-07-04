import { beforeEach, describe, expect, it } from 'vitest';
import { ConversionWorkflow } from '../../src/figma-to-weweb/simple-converter';

describe('flexbox Conversion', () => {
    let workflow: ConversionWorkflow;

    beforeEach(() => {
        workflow = new ConversionWorkflow();
        Object.assign(figma, {
            currentPage: {
                selection: [],
            },
        });
    });

    describe('iNSTANCE node with NONE layout mode', () => {
        it('should convert to flex column with stretch alignment', async () => {
            // Given: An INSTANCE node with layoutMode="NONE"
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
                children: [],
            };

            figma.currentPage.selection = [figmaNode as any];

            // When: Converting to WeWeb
            const result = await workflow.convertSelection();

            // Then: Should have correct structure and styles
            expect(result.component).toMatchObject({
                tag: 'ww-div',
                name: 'Dropdown header navigation',
                attrs: {
                    'data-figma-id': 'I1647:388494;1296:1034',
                    'data-figma-name': 'Dropdown header navigation',
                    'data-figma-type': 'INSTANCE',
                },
                styles: {
                    default: {
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                    },
                },
            });
        });
    });
});
