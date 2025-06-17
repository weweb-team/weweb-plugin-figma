// WeWeb Figma Plugin - Convert Figma designs to WeWeb components
import { convertToWewebViaHtml } from './figmatocode/htmlToWewebConverter';
import { htmlMain } from './figmatocode/htmlMain';
import { nodesToJSON } from './figmatocode/altNodes/jsonNodeConversion';

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
                    console.log('WEWEB CONVERSION START');
                    console.log('Selected node:', selection[0].name, selection[0].type);
                    
                    // Convert via HTML to ensure we get the same beautiful output
                    console.log('Converting to WeWeb via HTML...');
                    const wewebElements = await convertToWewebViaHtml([selection[0]]);
                    console.log('WeWeb elements:', wewebElements);
                    console.log('WeWeb elements length:', wewebElements.length);
                    
                    figma.ui.postMessage({
                        type: 'WEWEB_CONVERTED',
                        component: wewebElements.length > 0 ? wewebElements[0] : null,
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
        
        if (message.type === 'CONVERT_TO_HTML') {
            const selection = figma.currentPage.selection;
            if (selection.length > 0) {
                try {
                    // Use comprehensive settings like the original FigmaToCode
                    const pluginSettings = {
                        framework: "HTML",
                        showLayerNames: false,          // Original uses false for cleaner output
                        useOldPluginVersion2025: false,
                        responsiveRoot: false,
                        flutterGenerationMode: "snippet",
                        swiftUIGenerationMode: "snippet",
                        roundTailwindValues: true,
                        roundTailwindColors: true,
                        useColorVariables: true,
                        customTailwindPrefix: "",
                        embedImages: false,
                        embedVectors: false,
                        htmlGenerationMode: "html",
                        tailwindGenerationMode: "jsx",
                        baseFontSize: 16,
                        useTailwind4: false,
                    };
                    
                    // Convert nodes to JSON format first like the original FigmaToCode
                    const convertedNodes = await nodesToJSON([selection[0]], pluginSettings);
                    const htmlResult = await htmlMain(convertedNodes, pluginSettings, true);  // isPreview = true like the original
                    figma.ui.postMessage({
                        type: 'HTML_CONVERTED',
                        html: htmlResult.html,
                        css: htmlResult.css,
                    });
                } catch (error) {
                    console.error('HTML conversion error:', error);
                    figma.ui.postMessage({
                        type: 'HTML_CONVERTED',
                        html: null,
                        css: null,
                        error: error.message,
                    });
                }
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
                        rawNode: rawNode,
                    });
                } catch (error) {
                    console.error('Error extracting raw node data:', error);
                    figma.ui.postMessage({
                        type: 'RAW_NODE_COPIED',
                        rawNode: null,
                        error: error.message,
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
            if ('maxWidth' in node && typeof node.maxWidth === 'number') rawData.maxWidth = node.maxWidth;
            if ('maxHeight' in node && typeof node.maxHeight === 'number') rawData.maxHeight = node.maxHeight;
            if ('minWidth' in node && typeof node.minWidth === 'number') rawData.minWidth = node.minWidth;
            if ('minHeight' in node && typeof node.minHeight === 'number') rawData.minHeight = node.minHeight;

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
                rawData.children = node.children.map(child => extractRawNodeData(child));
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
                error: 'Failed to extract full node data: ' + error.message
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
