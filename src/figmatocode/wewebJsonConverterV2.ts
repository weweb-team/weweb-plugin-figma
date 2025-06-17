import { HtmlDefaultBuilder } from "./htmlDefaultBuilder";
import { HtmlTextBuilder } from "./htmlTextBuilder";
import { HTMLSettings } from "./types";
import { htmlAutoLayoutProps } from "./builderImpl/htmlAutoLayout";
import { nodeHasImageFill } from "./common/images";

interface WewebElement {
  tag: string;
  name: string;
  slots?: {
    children?: WewebElement[];
  };
  styles: {
    default: Record<string, any>;
  };
  props?: {
    default: Record<string, any>;
  };
}

/**
 * Parse style string from HTML builder into WeWeb JSON format
 */
function parseStyleString(styleString: string): Record<string, any> {
  if (!styleString) return {};
  
  const styles: Record<string, any> = {};
  const declarations = styleString.split(';').filter(d => d.trim());
  
  for (const declaration of declarations) {
    const [property, value] = declaration.split(':').map(s => s.trim());
    if (property && value) {
      const camelCaseProperty = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      
      // Convert pixel values to numbers for WeWeb
      if (value.endsWith('px')) {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          styles[camelCaseProperty] = numValue;
          continue;
        }
      }
      
      // Keep other values as strings
      styles[camelCaseProperty] = value;
    }
  }
  
  return styles;
}

/**
 * Convert HTML builder output to WeWeb element
 * This follows EXACTLY the same logic as htmlContainer
 */
async function htmlContainerToWeweb(
  node: SceneNode,
  settings: HTMLSettings,
  additionalStyles: string[] = []
): Promise<WewebElement | null> {
  console.log('htmlContainerToWeweb:', node.name, node.type);
  
  // EXACT COPY OF htmlContainer logic - ignore zero size
  if ('width' in node && 'height' in node && (node.width <= 0 || node.height <= 0)) {
    console.log('Skipping zero-size node:', node.name);
    return null;
  }

  // Use the SAME builder as HTML
  const builder = new HtmlDefaultBuilder(node, settings);
  
  console.log('Before builder methods:');
  console.log('Node parent:', node.parent);
  console.log('IsPreviewGlobal:', (await import("./htmlShared")).getIsPreviewGlobal());
  
  builder.commonPositionStyles();
  builder.commonShapeStyles();
  
  console.log('After builder methods:');
  console.log('Builder styles:', builder.styles);

  let tag = "ww-div";
  const props: Record<string, any> = {};

  // Handle image fills
  if (nodeHasImageFill(node)) {
    tag = "ww-image";
    props.url = "https://cdn.weweb.app/public/images/no_image_selected.png";
    props.alt = node.name || "Image";
    props.loading = "lazy";
    props.objectFit = "cover";
  }

  // Build all styles
  const allStyles = [...builder.styles, ...additionalStyles];
  const styleString = allStyles.join('; ');
  const styles = parseStyleString(styleString);

  // Process children
  const children: WewebElement[] = [];
  if ('children' in node && node.children) {
    for (const child of node.children) {
      if (child.visible !== false) {
        const childElement = await convertNodeToWeweb(child, settings);
        if (childElement) {
          children.push(childElement);
        }
      }
    }
  }

  // Create element
  const element: WewebElement = {
    tag,
    name: node.name || node.type,
    styles: { default: styles }
  };

  if (children.length > 0) {
    element.slots = { children };
  }

  if (Object.keys(props).length > 0) {
    element.props = { default: props };
  }

  return element;
}

/**
 * Convert text node - follows htmlText logic
 */
async function htmlTextToWeweb(node: TextNode, settings: HTMLSettings): Promise<WewebElement> {
  const builder = new HtmlTextBuilder(node, settings);
  
  // EXACT same order as htmlText
  builder
    .commonPositionStyles()
    .textTrim()
    .textAlignHorizontal()
    .textAlignVertical();
  
  // Get font styles from segments - CRITICAL for text appearance
  const segments = builder.getTextSegments(node);
  if (segments.length > 0 && segments[0].style) {
    // Add the segment styles (font-family, font-weight, etc)
    const segmentStyles = segments[0].style.split(';').filter(s => s.trim());
    builder.styles.push(...segmentStyles);
  }

  const styleString = builder.styles.join('; ');
  const styles = parseStyleString(styleString);

  // Text specific props
  const props: Record<string, any> = {
    text: node.characters || "",
    tag: "p" // Default tag
  };

  // Infer tag from name
  const nodeName = node.name.toLowerCase();
  if (nodeName.includes("h1") || nodeName.includes("heading 1")) props.tag = "h1";
  else if (nodeName.includes("h2") || nodeName.includes("heading 2")) props.tag = "h2";
  else if (nodeName.includes("h3") || nodeName.includes("heading 3")) props.tag = "h3";
  else if (nodeName.includes("h4") || nodeName.includes("heading 4")) props.tag = "h4";
  else if (nodeName.includes("h5") || nodeName.includes("heading 5")) props.tag = "h5";
  else if (nodeName.includes("h6") || nodeName.includes("heading 6")) props.tag = "h6";

  return {
    tag: "ww-text",
    name: node.name || "Text",
    styles: { default: styles },
    props: { default: props }
  };
}

/**
 * Convert frame node - follows htmlFrame logic
 */
async function htmlFrameToWeweb(
  node: SceneNode & BaseFrameMixin,
  settings: HTMLSettings
): Promise<WewebElement | null> {
  console.log('htmlFrameToWeweb called for:', node.name);
  console.log('Layout mode:', node.layoutMode);
  
  // Check if it has auto-layout
  const additionalStyles: string[] = [];
  
  if (node.layoutMode !== "NONE") {
    // Get auto-layout styles EXACTLY like HTML does
    console.log('Getting auto-layout styles...');
    try {
      const autoLayoutStyles = htmlAutoLayoutProps(node, settings);
      console.log('Auto-layout styles:', autoLayoutStyles);
      additionalStyles.push(...autoLayoutStyles);
    } catch (error) {
      console.error('Error getting auto-layout styles:', error);
    }
  }

  // Use htmlContainer logic
  return await htmlContainerToWeweb(node, settings, additionalStyles);
}

/**
 * Convert group node - follows htmlGroup logic
 */
async function htmlGroupToWeweb(
  node: GroupNode,
  settings: HTMLSettings
): Promise<WewebElement | null> {
  // Groups are just containers with no additional styles
  return await htmlContainerToWeweb(node, settings, []);
}

/**
 * Main converter - follows htmlWidgetGenerator logic
 */
async function convertNodeToWeweb(
  node: SceneNode,
  settings: HTMLSettings
): Promise<WewebElement | null> {
  console.log('convertNodeToWeweb called for:', node.name, node.type);
  console.log('Node visible:', node.visible);
  console.log('Node width:', node.width);
  console.log('Node height:', node.height);
  
  // Skip invisible nodes
  if (!node.visible) {
    console.log('Skipping invisible node');
    return null;
  }

  // Follow EXACT same switch logic as htmlWidgetGenerator
  switch (node.type) {
    case "TEXT":
      return await htmlTextToWeweb(node as TextNode, settings);
    
    case "FRAME":
    case "COMPONENT":
    case "INSTANCE":
    case "COMPONENT_SET":
      return await htmlFrameToWeweb(node as SceneNode & BaseFrameMixin, settings);
    
    case "GROUP":
      return await htmlGroupToWeweb(node as GroupNode, settings);
    
    case "RECTANGLE":
    case "ELLIPSE":
      // These are treated as frames
      return await htmlContainerToWeweb(node, settings, []);
    
    case "SECTION":
      // Section gets special handling
      return await htmlContainerToWeweb(node, settings, []);
    
    default:
      // Everything else is a container
      return await htmlContainerToWeweb(node, settings, []);
  }
}

/**
 * Main entry point - exactly like htmlMain
 */
export async function convertNodesToWewebV2(
  nodes: SceneNode[],
  settings: HTMLSettings = {
    htmlGenerationMode: "html",
    showLayerNames: true,
    embedVectors: false,
    embedImages: false
  },
  isPreview: boolean = true  // Set to true like HTML converter
): Promise<WewebElement[]> {
  console.log('convertNodesToWewebV2 called');
  console.log('Nodes:', nodes);
  console.log('Settings:', settings);
  console.log('isPreview:', isPreview);
  
  const results: WewebElement[] = [];
  
  // Set preview mode to get responsive sizing
  const htmlShared = await import("./htmlShared");
  htmlShared.setIsPreviewGlobal(isPreview);
  console.log('Preview mode set to:', htmlShared.getIsPreviewGlobal());
  
  for (const node of nodes) {
    console.log('Processing node:', node.name, node.type);
    const element = await convertNodeToWeweb(node, settings);
    console.log('Converted element:', element);
    if (element) {
      results.push(element);
    }
  }
  
  console.log('Final results:', results);
  return results;
}