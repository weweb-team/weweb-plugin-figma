import { HtmlDefaultBuilder } from "./htmlDefaultBuilder";
import { HtmlTextBuilder } from "./htmlTextBuilder";
import { HTMLSettings } from "./types";
import { htmlColorFromFills, buildBackgroundValues } from "./builderImpl/htmlColor";
import { retrieveTopFill } from "./common/retrieveFill";
import { nodeHasImageFill } from "./common/images";

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
  style?: WewebStyle;
  props?: WewebProps;
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
  props: Record<string, any> = {}
): WewebElement {
  const element: WewebElement = {
    tag,
    name,
  };

  if (children.length > 0) {
    element.slots = { children };
  }

  if (Object.keys(styles).length > 0) {
    element.style = { default: styles };
  }

  if (Object.keys(props).length > 0) {
    element.props = { default: props };
  }

  return element;
}

/**
 * Convert Figma node to WeWeb element
 */
export async function convertToWewebElement(
  node: SceneNode,
  settings: HTMLSettings
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
      return convertFrameNode(node, settings);
    
    case "FRAME":
    case "COMPONENT":
    case "INSTANCE":
    case "COMPONENT_SET":
    case "SECTION":
      return convertFrameNode(node, settings);
    
    case "GROUP":
      return convertGroupNode(node, settings);
    
    default:
      // Fallback to div for unsupported types
      return convertFrameNode(node, settings);
  }
}

/**
 * Convert TEXT node to ww-text element
 */
function convertTextNode(node: TextNode, settings: HTMLSettings): WewebElement {
  const textBuilder = new HtmlTextBuilder(node, settings);
  
  // Get common styles
  textBuilder.commonPositionStyles().commonShapeStyles();
  const styleString = textBuilder.styles.join('; ');
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
    text: { en: text },
    tag
  };

  return createWewebElement("ww-text", node.name, [], styles, props);
}

/**
 * Convert image node to ww-image element
 */
function convertImageNode(node: SceneNode, settings: HTMLSettings): WewebElement {
  const builder = new HtmlDefaultBuilder(node, settings);
  builder.commonPositionStyles().commonShapeStyles();
  const styleString = builder.styles.join('; ');
  const styles = parseStyleString(styleString);
  
  // Default image props
  const props = {
    url: "https://cdn.weweb.app/public/images/no_image_selected.png",
    objectFit: "cover",
    alt: { en: node.name || "Image" },
    loading: "lazy"
  };

  return createWewebElement("ww-image", node.name, [], styles, props);
}

/**
 * Convert frame/container node to ww-div element
 */
async function convertFrameNode(node: SceneNode, settings: HTMLSettings): Promise<WewebElement> {
  const builder = new HtmlDefaultBuilder(node, settings);
  builder.commonPositionStyles().commonShapeStyles();
  const styleString = builder.styles.join('; ');
  const styles = parseStyleString(styleString);
  
  // Convert children if they exist
  const children: WewebElement[] = [];
  if ("children" in node && node.children) {
    for (const child of node.children) {
      if (child.visible !== false) {
        const childElement = await convertToWewebElement(child, settings);
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
  builder.commonPositionStyles();
  const styleString = builder.styles.join('; ');
  const styles = parseStyleString(styleString);
  
  // Convert children
  const children: WewebElement[] = [];
  for (const child of node.children) {
    if (child.visible !== false) {
      const childElement = await convertToWewebElement(child, settings);
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
  
  for (const node of nodes) {
    if (node.visible !== false) {
      const element = await convertToWewebElement(node, settings);
      results.push(element);
    }
  }
  
  return results;
}