// WeWeb Figma Plugin - Convert Figma designs to WeWeb components
import { HtmlDefaultBuilder } from './figmatocode/htmlDefaultBuilder';
import { HtmlTextBuilder } from './figmatocode/htmlTextBuilder';
import { htmlMain } from './figmatocode/htmlMain';

export default function () {
    figma.showUI(__html__, { 
        width: 400, 
        height: 600, 
        themeColors: true,
        title: "WeWeb Plugin for Figma"
    });

    figma.ui.onmessage = async (message) => {
        if (message.type === 'CONVERT_TO_WEWEB') {
            const selection = figma.currentPage.selection;
            if (selection.length > 0) {
                try {
                    const htmlResult = await htmlMain([selection[0]], {
                        htmlGenerationMode: 'html',
                        showLayerNames: true,
                        embedVectors: false,
                        embedImages: false,
                    });
                    figma.ui.postMessage({
                        type: 'WEWEB_CONVERTED',
                        component: htmlResult,
                    });
                } catch (error) {
                    console.error('Conversion error:', error);
                    figma.ui.postMessage({
                        type: 'WEWEB_CONVERTED',
                        component: null,
                        error: error.message,
                    });
                }
            }
        }
        
        if (message.type === 'COPY_RAW_NODE') {
            const selection = figma.currentPage.selection;
            if (selection.length > 0) {
                const rawNode = extractRawNodeData(selection[0]);
                figma.ui.postMessage({
                    type: 'RAW_NODE_COPIED',
                    rawNode: rawNode,
                });
            }
        }
    };

    function extractRawNodeData(node: SceneNode): any {
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

        // Add constraints
        if ('maxWidth' in node) rawData.maxWidth = node.maxWidth;
        if ('maxHeight' in node) rawData.maxHeight = node.maxHeight;
        if ('minWidth' in node) rawData.minWidth = node.minWidth;
        if ('minHeight' in node) rawData.minHeight = node.minHeight;

        // Add fills if available
        if ('fills' in node) {
            rawData.fills = node.fills;
        }

        // Add text properties if it's a text node
        if (node.type === 'TEXT') {
            const textNode = node as TextNode;
            rawData.characters = textNode.characters;
            rawData.fontSize = textNode.fontSize;
            rawData.fontName = textNode.fontName;
            rawData.textAutoResize = textNode.textAutoResize;
            rawData.textAlignHorizontal = textNode.textAlignHorizontal;
            rawData.textAlignVertical = textNode.textAlignVertical;
        }

        // Add parent info if available
        if (node.parent) {
            rawData.parent = {
                id: node.parent.id,
                name: node.parent.name,
                type: node.parent.type,
                layoutMode: 'layoutMode' in node.parent ? node.parent.layoutMode : undefined,
            };
        }

        return rawData;
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
