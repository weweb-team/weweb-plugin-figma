// Figma Plugin - Copy Figma Nodes
import { VariableExtractor } from './variable-extractor';

export default function () {
    figma.showUI(__html__, {
        width: 400,
        height: 600,
        themeColors: true,
        title: 'WeWeb Figma Plugin',
    });

    figma.ui.onmessage = async (message) => {
        if (message.type === 'GET_SELECTION') {
            postSelection();
        }

        if (message.type === 'EXTRACT_VARIABLES') {
            try {
                // Create extractor with progress callback
                const extractor = new VariableExtractor((progressMessage: string) => {
                    figma.ui.postMessage({
                        type: 'EXTRACTION_PROGRESS',
                        message: progressMessage,
                    });
                });

                const variables = await extractor.extractAllVariables();

                figma.ui.postMessage({
                    type: 'VARIABLES_EXTRACTED',
                    variables,
                });
            } catch (error) {
                figma.ui.postMessage({
                    type: 'VARIABLES_EXTRACTED',
                    variables: null,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }

        if (message.type === 'COPY_RAW_NODE') {
            console.log('Received COPY_RAW_NODE message');
            const selection = figma.currentPage.selection;
            console.log('Current selection:', selection.length, 'items');
            if (selection.length > 0) {
                console.log('Extracting raw data for node:', selection[0].name);
                try {
                    const rawNode = extractRawNodeData(selection[0]);
                    console.log('Raw node extracted successfully, posting message back');
                    figma.ui.postMessage({
                        type: 'RAW_NODE_COPIED',
                        rawNode,
                    });
                } catch (error) {
                    console.error('Error extracting raw node data:', error);
                    figma.ui.postMessage({
                        type: 'RAW_NODE_COPIED',
                        rawNode: null,
                        error: error instanceof Error ? error.message : String(error),
                    });
                }
            } else {
                console.log('No selection found');
            }
        }
    };

    function extractRawNodeData(node: SceneNode): any {
        try {
            // Extract key properties from the Figma node for debugging
            const rawData: any = {
                id: node.id,
                name: node.name,
                type: node.type,
                visible: node.visible,
            };

            // Add dimensions if available
            if ('width' in node && 'height' in node) {
                rawData.width = node.width;
                rawData.height = node.height;
            }

            // Add position if available
            if ('x' in node && 'y' in node) {
                rawData.x = node.x;
                rawData.y = node.y;
            }

            // Add layout properties if available
            if ('layoutMode' in node) {
                rawData.layoutMode = node.layoutMode;
                rawData.layoutSizingHorizontal = node.layoutSizingHorizontal;
                rawData.layoutSizingVertical = node.layoutSizingVertical;
                rawData.primaryAxisAlignItems = node.primaryAxisAlignItems;
                rawData.counterAxisAlignItems = node.counterAxisAlignItems;
                rawData.itemSpacing = node.itemSpacing;
            }

            // Add layout positioning if available
            if ('layoutPositioning' in node) {
                rawData.layoutPositioning = node.layoutPositioning;
            }

            // Add constraints (primitive values only)
            if ('maxWidth' in node && typeof node.maxWidth === 'number')
                rawData.maxWidth = node.maxWidth;
            if ('maxHeight' in node && typeof node.maxHeight === 'number')
                rawData.maxHeight = node.maxHeight;
            if ('minWidth' in node && typeof node.minWidth === 'number')
                rawData.minWidth = node.minWidth;
            if ('minHeight' in node && typeof node.minHeight === 'number')
                rawData.minHeight = node.minHeight;

            // Add corner radius if available
            if ('cornerRadius' in node && typeof node.cornerRadius === 'number') {
                rawData.cornerRadius = node.cornerRadius;
            }

            // Add padding if available (primitive values only)
            if ('paddingLeft' in node && typeof node.paddingLeft === 'number') {
                rawData.paddingLeft = node.paddingLeft;
                rawData.paddingRight = node.paddingRight;
                rawData.paddingTop = node.paddingTop;
                rawData.paddingBottom = node.paddingBottom;
            }

            // Add text properties if it's a text node (primitives only)
            if (node.type === 'TEXT') {
                const textNode = node as TextNode;
                rawData.characters = textNode.characters;
                if (typeof textNode.fontSize === 'number') {
                    rawData.fontSize = textNode.fontSize;
                }
                rawData.textAutoResize = textNode.textAutoResize;
                rawData.textAlignHorizontal = textNode.textAlignHorizontal;
                rawData.textAlignVertical = textNode.textAlignVertical;
            }

            // Add parent info if available (but not full parent data to avoid circular references)
            if (node.parent) {
                rawData.parent = {
                    id: node.parent.id,
                    name: node.parent.name,
                    type: node.parent.type,
                    layoutMode: 'layoutMode' in node.parent ? node.parent.layoutMode : undefined,
                };
            }

            // Recursively extract children if they exist
            if ('children' in node && node.children && node.children.length > 0) {
                rawData.children = node.children.map((child) => extractRawNodeData(child));
            }

            return rawData;
        } catch (error) {
            console.error('Error in extractRawNodeData:', error);
            // Return a safe fallback
            return {
                id: node.id,
                name: node.name,
                type: node.type,
                visible: node.visible,
                error: `Failed to extract full node data: ${error instanceof Error ? error.message : String(error)}`,
            };
        }
    }

    figma.on('selectionchange', postSelection);
    postSelection(); // Initial call

    function postSelection() {
        const selection = figma.currentPage.selection;
        figma.ui.postMessage({
            type: 'SELECTION_CHANGED',
            hasSelection: selection.length > 0,
            selectedNode: selection.length > 0
                ? {
                        id: selection[0].id,
                        name: selection[0].name,
                        type: selection[0].type,
                    }
                : null,
        });
    }
}
