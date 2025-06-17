import { htmlMain } from "./htmlMain";
import { nodesToJSON } from "./altNodes/jsonNodeConversion";
import { HTMLSettings } from "./types";

interface WewebElement {
  tag: string;
  name: string;
  styles: {
    default: Record<string, any>;
  };
  props?: {
    default: Record<string, any>;
  };
  slots?: {
    children?: WewebElement[];
  };
}

/**
 * Parse inline style string to object
 */
function parseInlineStyles(styleString: string): Record<string, any> {
  const styles: Record<string, any> = {};
  if (!styleString) return styles;
  
  const declarations = styleString.split(';').filter(s => s.trim());
  
  for (const declaration of declarations) {
    const colonIndex = declaration.indexOf(':');
    if (colonIndex === -1) continue;
    
    const property = declaration.substring(0, colonIndex).trim();
    const value = declaration.substring(colonIndex + 1).trim();
    
    if (property && value) {
      // Convert to camelCase
      const camelProperty = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      
      // Convert pixel values to numbers
      if (value.endsWith('px')) {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          styles[camelProperty] = numValue;
          continue;
        }
      }
      
      // Keep other values as strings
      styles[camelProperty] = value;
    }
  }
  
  return styles;
}

/**
 * Simple HTML parser using regex (works in Figma environment)
 */
function parseHtmlToElements(html: string): WewebElement[] {
  const elements: WewebElement[] = [];
  
  // Stack to track nested elements
  const stack: { element: WewebElement; depth: number }[] = [];
  let currentDepth = 0;
  
  // Regex to match HTML tags
  const tagRegex = /<(\/?)([\w-]+)([^>]*)>/g;
  let lastIndex = 0;
  let match;
  
  while ((match = tagRegex.exec(html)) !== null) {
    const [fullMatch, isClosing, tagName, attributes] = match;
    const textBefore = html.substring(lastIndex, match.index).trim();
    
    // Add text content to current element if any
    if (textBefore && stack.length > 0) {
      const current = stack[stack.length - 1].element;
      if (current.tag === 'ww-text' && !current.props) {
        current.props = { default: { text: textBefore, tag: tagName } };
      }
    }
    
    if (!isClosing) {
      // Opening tag
      const isVoid = ['img', 'br', 'hr', 'input'].includes(tagName);
      
      // Parse attributes
      const attrMap: Record<string, string> = {};
      const attrRegex = /(\w+)(?:="([^"]*)")?/g;
      let attrMatch;
      while ((attrMatch = attrRegex.exec(attributes)) !== null) {
        attrMap[attrMatch[1]] = attrMatch[2] || '';
      }
      
      // Get style
      const styleMatch = attributes.match(/style="([^"]*)"/);
      const styles = styleMatch ? parseInlineStyles(styleMatch[1]) : {};
      
      // Get data-layer name
      const nameMatch = attributes.match(/data-layer="([^"]*)"/);
      const name = nameMatch ? nameMatch[1] : tagName;
      
      // Determine WeWeb tag
      let tag = 'ww-div';
      if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span'].includes(tagName)) {
        tag = 'ww-text';
      } else if (tagName === 'img') {
        tag = 'ww-image';
      }
      
      // Create element
      const element: WewebElement = {
        tag,
        name,
        styles: { default: styles }
      };
      
      // Handle image
      if (tag === 'ww-image') {
        const srcMatch = attributes.match(/src="([^"]*)"/);
        element.props = {
          default: {
            url: srcMatch ? srcMatch[1] : "https://cdn.weweb.app/public/images/no_image_selected.png",
            alt: name,
            loading: 'lazy',
            objectFit: 'cover'
          }
        };
      }
      
      // Add to stack or parent
      if (stack.length === 0) {
        elements.push(element);
      } else {
        const parent = stack[stack.length - 1].element;
        if (!parent.slots) parent.slots = { children: [] };
        if (!parent.slots.children) parent.slots.children = [];
        parent.slots.children.push(element);
      }
      
      // Push to stack if not void element
      if (!isVoid) {
        stack.push({ element, depth: currentDepth });
        currentDepth++;
      }
    } else {
      // Closing tag - pop from stack
      if (stack.length > 0 && stack[stack.length - 1].element.tag === 'ww-text') {
        // Get text content for text elements
        const textMatch = html.substring(lastIndex, match.index);
        if (textMatch.trim() && !stack[stack.length - 1].element.props) {
          stack[stack.length - 1].element.props = {
            default: { 
              text: textMatch.trim(), 
              tag: tagName 
            }
          };
        }
      }
      
      stack.pop();
      currentDepth--;
    }
    
    lastIndex = tagRegex.lastIndex;
  }
  
  return elements;
}

/**
 * Convert Figma nodes to WeWeb by going through HTML first
 */
export async function convertToWewebViaHtml(
  nodes: SceneNode[],
  settings: HTMLSettings = {
    htmlGenerationMode: "html",
    showLayerNames: true,
    embedVectors: false,
    embedImages: false
  }
): Promise<WewebElement[]> {
  console.log('Converting to WeWeb via HTML...');
  
  // First, convert to HTML using the exact same settings as the HTML button
  const pluginSettings = {
    framework: "HTML",
    showLayerNames: false, // HTML uses false
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
  } as any;
  
  // Convert nodes to JSON first (like HTML button does)
  const convertedNodes = await nodesToJSON(nodes, pluginSettings);
  
  // Convert to HTML with preview mode
  const htmlResult = await htmlMain(convertedNodes, pluginSettings, true);
  console.log('HTML result:', htmlResult.html.substring(0, 500) + '...');
  
  // Parse HTML to WeWeb elements
  const wewebElements = parseHtmlToElements(htmlResult.html);
  console.log('WeWeb elements:', wewebElements);
  
  return wewebElements;
}