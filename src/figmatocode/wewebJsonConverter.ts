import { HtmlDefaultBuilder } from "./htmlDefaultBuilder";
import { HtmlTextBuilder } from "./htmlTextBuilder";
import { WewebBuilder } from "./wewebBuilder";
import { HTMLSettings } from "./types";
import { htmlColorFromFills, buildBackgroundValues } from "./builderImpl/htmlColor";
import { retrieveTopFill } from "./common/retrieveFill";
import { nodeHasImageFill } from "./common/images";
import { htmlAutoLayoutProps } from "./builderImpl/htmlAutoLayout";

interface WewebStyle {
  default?: Record<string, any>;
  tablet?: Record<string, any>;
  mobile?: Record<string, any>;
}

interface WewebProps {
  default?: Record<string, any>;
  tablet?: Record<string, any>;
  mobile?: Record<string, any>;
}

interface WewebElement {
  tag: string;
  name: string;
  slots?: {
    children?: WewebElement[];
  };
  styles: {
    default: Record<string, any>;
    tablet?: Record<string, any>;
    mobile?: Record<string, any>;
  };
  props?: WewebProps;
  attributes?: Record<string, string>; // For data-* attributes
}

/**
 * Convert CSS property names to camelCase for WeWeb
 */
function cssPropertyToCamelCase(property: string): string {
  return property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Parse CSS styles string and convert to WeWeb style object
 */
function parseStyleString(styleString: string): Record<string, any> {
  if (!styleString) return {};
  
  const styles: Record<string, any> = {};
  const declarations = styleString.split(';').filter(d => d.trim());
  
  for (const declaration of declarations) {
    const [property, value] = declaration.split(':').map(s => s.trim());
    if (property && value) {
      const camelCaseProperty = cssPropertyToCamelCase(property);
      
      // Convert pixel values to numbers where appropriate
      if (value.endsWith('px')) {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          styles[camelCaseProperty] = numValue;
          continue;
        }
      }
      
      // Keep other values as strings
      styles[camelCaseProperty] = value.replace(/['"]/g, '');
    }
  }
  
  return styles;
}

/**
 * Create a WeWeb element structure
 */
function createWewebElement(
  tag: string,
  name: string,
  children: WewebElement[] = [],
  styles: Record<string, any> = {},
  props: Record<string, any> = {},
  attributes: Record<string, string> = {}
): WewebElement {
  const element: WewebElement = {
    tag,
    name,
  };

  if (children.length > 0) {
    element.slots = { children };
  }

  // Always add styles object, even if empty
  element.styles = { default: styles };

  if (Object.keys(props).length > 0) {
    element.props = { default: props };
  }

  if (Object.keys(attributes).length > 0) {
    element.attributes = attributes;
  }

  return element;
}

/**
 * Convert Figma node to WeWeb element
 */
export async function convertToWewebElement(
  node: SceneNode,
  settings: HTMLSettings,
  isRootNode: boolean = false
): Promise<WewebElement> {
  const name = node.name || node.type.toLowerCase();

  switch (node.type) {
    case "TEXT":
      return convertTextNode(node, settings);
    
    case "RECTANGLE":
    case "ELLIPSE":
      if ("fills" in node && nodeHasImageFill(node as any)) {
        return convertImageNode(node, settings);
      }
      return convertFrameNode(node, settings, isRootNode);
    
    case "FRAME":
    case "COMPONENT":
    case "INSTANCE":
    case "COMPONENT_SET":
    case "SECTION":
      return convertFrameNode(node, settings, isRootNode);
    
    case "GROUP":
      return convertGroupNode(node, settings);
    
    default:
      // Fallback to div for unsupported types
      return convertFrameNode(node, settings, isRootNode);
  }
}

/**
 * Convert TEXT node to ww-text element
 */
function convertTextNode(node: TextNode, settings: HTMLSettings): WewebElement {
  // Now we can use HtmlTextBuilder properly (circular dependency fixed)
  const builder = new HtmlTextBuilder(node, settings);
  
  // EXACT SAME LOGIC AS HTML TEXT CONVERTER
  builder.commonPositionStyles();
  builder.commonShapeStyles();
  builder.textTrim();
  builder.textAlignHorizontal();
  builder.textAlignVertical();
  builder.fontSize(node);
  
  // TEXT NODES ALWAYS USE ABSOLUTE POSITIONING (like HTML)
  builder.size();
  builder.position();
  builder.blend();
  
  // Background and effects
  if ('fills' in node && node.fills) {
    builder.applyFillsToStyle(node.fills, "background");
  }
  builder.border(settings);
  builder.shadow();
  builder.blur();
  
  // ADD MISSING: Get text segment styles for font properties
  const textSegments = builder.getTextSegments(node);
  if (textSegments.length > 0) {
    // Parse the segment style and add it to builder
    const segmentStyleString = textSegments[0].style;
    if (segmentStyleString) {
      // Add the segment styles to the builder
      const segmentStyles = segmentStyleString.split(';').filter(s => s.trim());
      builder.styles.push(...segmentStyles);
    }
  }
  
  const styleString = builder.styles.join('; ');
  const styles = parseStyleString(styleString);
  
  // Get text content
  const text = node.characters || "";
  
  // Determine HTML tag based on styling or name
  let tag = "p";
  const nodeName = node.name.toLowerCase();
  if (nodeName.includes("h1") || nodeName.includes("heading 1")) tag = "h1";
  else if (nodeName.includes("h2") || nodeName.includes("heading 2")) tag = "h2";
  else if (nodeName.includes("h3") || nodeName.includes("heading 3")) tag = "h3";
  else if (nodeName.includes("h4") || nodeName.includes("heading 4")) tag = "h4";
  else if (nodeName.includes("button")) tag = "button";
  
  const props = {
    text: text,
    tag
  };

  return createWewebElement("ww-text", node.name, [], styles, props);
}

/**
 * Convert image node to ww-image element
 */
function convertImageNode(node: SceneNode, settings: HTMLSettings): WewebElement {
  const builder = new HtmlDefaultBuilder(node, settings);
  builder.commonPositionStyles();
  builder.commonShapeStyles();
  const styleString = builder.styles.join('; ');
  const styles = parseStyleString(styleString);
  
  // Default image props
  const props = {
    url: "https://cdn.weweb.app/public/images/no_image_selected.png",
    objectFit: "cover",
    alt: node.name || "Image",
    loading: "lazy"
  };

  return createWewebElement("ww-image", node.name, [], styles, props);
}

/**
 * Convert frame/container node to ww-div element
 */
async function convertFrameNode(node: SceneNode, settings: HTMLSettings, isRootNode: boolean = false): Promise<WewebElement> {
  // Use WewebBuilder for better size handling
  const builder = new WewebBuilder(node, settings, isRootNode);
  
  // ALWAYS call these - exactly like HTML does
  builder.commonPositionStyles();
  builder.commonShapeStyles();
  
  // The rest of the common styles
  if ('fills' in node && node.fills) {
    builder.applyFillsToStyle(node.fills, "background");
  }
  builder.border(settings);
  builder.shadow();
  builder.blur();
  
  // Additional styles array - same as htmlContainer
  const additionalStyles: string[] = [];
  
  // If it has layout mode, add the auto-layout props
  if ('layoutMode' in node && node.layoutMode !== 'NONE') {
    try {
      const autoLayoutStyles = htmlAutoLayoutProps(node as any, settings);
      additionalStyles.push(...autoLayoutStyles);
    } catch (error) {
      console.warn(`Could not generate auto-layout styles for ${node.name}:`, error);
    }
    
    // Also add padding for layout containers
    builder.autoLayoutPadding();
  }
  
  // Build with additional styles - same as htmlContainer
  const allStyles = [...builder.styles, ...additionalStyles];
  const styleString = allStyles.join('; ');
  const styles = parseStyleString(styleString);
  
  // Convert children if they exist
  const children: WewebElement[] = [];
  if ("children" in node && node.children) {
    for (const child of node.children) {
      if (child.visible !== false) {
        const childElement = await convertToWewebElement(child, settings, false); // children are never root
        children.push(childElement);
      }
    }
  }

  return createWewebElement("ww-div", node.name, children, styles);
}

/**
 * Convert group node to ww-div element
 */
async function convertGroupNode(node: GroupNode, settings: HTMLSettings): Promise<WewebElement> {
  const builder = new HtmlDefaultBuilder(node, settings);
  
  // EXACT SAME LOGIC AS HTML GROUP CONVERTER
  builder.commonPositionStyles();
  builder.commonShapeStyles();
  builder.blend();
  
  // GROUPS ALWAYS USE ABSOLUTE POSITIONING (like HTML)
  builder.size();
  builder.position();
  
  // Background and effects
  if ('fills' in node && node.fills) {
    builder.applyFillsToStyle(node.fills, "background");
  }
  builder.border(settings);
  builder.shadow();
  builder.blur();
  
  const styleString = builder.styles.join('; ');
  const styles = parseStyleString(styleString);
  
  // Convert children
  const children: WewebElement[] = [];
  for (const child of node.children) {
    if (child.visible !== false) {
      const childElement = await convertToWewebElement(child, settings, false); // children are never root
      children.push(childElement);
    }
  }

  return createWewebElement("ww-div", node.name, children, styles);
}

/**
 * Main conversion function that takes selected nodes and returns WeWeb JSON
 */
export async function convertNodesToWeweb(
  nodes: SceneNode[],
  settings: HTMLSettings = {
    htmlGenerationMode: "html",
    showLayerNames: true,
    embedVectors: false,
    embedImages: false
  }
): Promise<WewebElement[]> {
  const results: WewebElement[] = [];
  
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.visible !== false) {
      // First node in the array is considered root (like HTML converter)
      const isRoot = i === 0;
      const element = await convertToWewebElement(node, settings, isRoot);
      results.push(element);
    }
  }
  
  return results;
}