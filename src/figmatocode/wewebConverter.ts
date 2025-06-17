// WeWeb converter that adapts FigmaToCode logic
// Import HtmlDefaultBuilder first to ensure proper class inheritance order
import { HtmlDefaultBuilder } from './htmlDefaultBuilder';
// TESTING: Comment out HtmlTextBuilder to isolate error
// import { HtmlTextBuilder } from './htmlTextBuilder';
// TESTING: Comment out htmlAutoLayout to isolate error
// import { htmlAutoLayoutProps } from './builderImpl/htmlAutoLayout';
import { getVisibleNodes } from './common/nodeVisibility';
import { indentString } from './common/indentString';

// WeWeb component interface
interface WeWebComponent {
  tag: string;
  name: string;
  props?: {
    default?: Record<string, any>;
    tablet?: Record<string, any>;
    mobile?: Record<string, any>;
  };
  styles: {
    default: Record<string, string>;
    tablet?: Record<string, string>;
    mobile?: Record<string, string>;
  };
  slots?: {
    children?: WeWebComponent[];
  };
}

// Settings interface for WeWeb conversion
interface WeWebSettings {
  htmlGenerationMode: 'html';
  showLayerNames: boolean;
  embedVectors: boolean;
  embedImages: boolean;
}

// Main conversion function
export const convertToWeWeb = async (
  sceneNode: ReadonlyArray<SceneNode>,
  settings: WeWebSettings = {
    htmlGenerationMode: 'html',
    showLayerNames: true,
    embedVectors: false,
    embedImages: false,
  }
): Promise<WeWebComponent[]> => {
  // Filter visible nodes and convert them
  const visibleNodes = getVisibleNodes(sceneNode);
  const convertedNodes = await Promise.all(
    visibleNodes.map(node => convertNode(node, settings))
  );
  
  return convertedNodes.filter(Boolean) as WeWebComponent[];
};

// Convert a single node to WeWeb format
const convertNode = async (node: SceneNode, settings: WeWebSettings): Promise<WeWebComponent | null> => {
  switch (node.type) {
    case "RECTANGLE":
    case "ELLIPSE":
      return await convertContainer(node, settings);
    case "GROUP":
      return await convertGroup(node as GroupNode, settings);
    case "FRAME":
    case "COMPONENT":
    case "INSTANCE":
    case "COMPONENT_SET":
      return await convertFrame(node as FrameNode, settings);
    case "SECTION":
      return await convertSection(node as SectionNode, settings);
    case "TEXT":
      return convertText(node as TextNode, settings);
    case "LINE":
      return convertLine(node as LineNode, settings);
    default:
      return null;
  }
};

// Convert children nodes
const convertChildren = async (node: SceneNode, settings: WeWebSettings): Promise<WeWebComponent[]> => {
  if (!('children' in node) || !node.children) {
    return [];
  }
  
  const children = await Promise.all(
    node.children.map(child => convertNode(child, settings))
  );
  
  return children.filter(Boolean) as WeWebComponent[];
};

// Convert text node using simplified logic to avoid circular imports
const convertText = (node: TextNode, settings: WeWebSettings): WeWebComponent => {
  // Use HtmlDefaultBuilder for basic positioning and styling
  const builder = new HtmlDefaultBuilder(node, settings)
    .commonPositionStyles();

  // Get basic text content
  let textContent = node.characters || '';
  
  // Apply basic text styling inline to avoid circular imports
  const textStyles: string[] = [];
  
  // Font size
  if (node.fontSize && typeof node.fontSize === 'number') {
    textStyles.push(`font-size: ${node.fontSize}px`);
  }
  
  // Font family
  if (node.fontName && typeof node.fontName === 'object') {
    textStyles.push(`font-family: ${node.fontName.family}`);
  }
  
  // Text alignment
  if (node.textAlignHorizontal && node.textAlignHorizontal !== 'LEFT') {
    let align = 'left';
    switch (node.textAlignHorizontal) {
      case 'CENTER': align = 'center'; break;
      case 'RIGHT': align = 'right'; break;
      case 'JUSTIFIED': align = 'justify'; break;
    }
    textStyles.push(`text-align: ${align}`);
  }
  
  // Text color from fills
  if (node.fills && Array.isArray(node.fills) && node.fills.length > 0) {
    const fill = node.fills[0];
    if (fill.type === 'SOLID' && fill.color) {
      const r = Math.round(fill.color.r * 255);
      const g = Math.round(fill.color.g * 255);
      const b = Math.round(fill.color.b * 255);
      textStyles.push(`color: rgb(${r}, ${g}, ${b})`);
    }
  }

  // Extract styles from builder and merge with text styles
  const baseStyles = extractStylesFromBuilder(builder, textStyles);

  return {
    tag: 'ww-text',
    name: node.name,
    props: {
      default: {
        text: { en: textContent },
        tag: inferTextTag(node)
      }
    },
    styles: {
      default: baseStyles
    }
  };
};

// Convert container (rectangle, ellipse) using FigmaToCode logic
const convertContainer = async (node: SceneNode, settings: WeWebSettings): Promise<WeWebComponent> => {
  const builder = new HtmlDefaultBuilder(node, settings)
    .commonPositionStyles()
    .commonShapeStyles();

  const styles = extractStylesFromBuilder(builder);
  
  // Check if it's an image
  const hasImageFill = 'fills' in node && node.fills && 
    (node.fills as readonly Paint[]).some(fill => fill.type === 'IMAGE');

  if (hasImageFill) {
    return {
      tag: 'ww-image',
      name: node.name,
      props: {
        default: {
          url: "https://cdn.weweb.app/public/images/no_image_selected.png",
          objectFit: 'cover',
          overlay: null,
          filter: "",
          alt: { en: node.name || "" },
          loading: 'lazy'
        }
      },
      styles: {
        default: styles
      }
    };
  }

  return {
    tag: 'ww-div',
    name: node.name,
    styles: {
      default: styles
    }
  };
};

// Convert frame using FigmaToCode logic
const convertFrame = async (node: FrameNode, settings: WeWebSettings): Promise<WeWebComponent> => {
  const children = await convertChildren(node, settings);
  
  let additionalStyles: string[] = [];
  
  // Initialize builder with default setup
  let builder = new HtmlDefaultBuilder(node, settings)
    .commonPositionStyles()
    .commonShapeStyles();

  if (node.layoutMode !== "NONE") {
    // TEMPORARY: Inline auto-layout logic to avoid circular import issues
    const layoutStyles: string[] = [];
    
    // Flex direction
    if (node.layoutMode === "VERTICAL") {
      layoutStyles.push("flex-direction: column");
    }
    
    // Display
    layoutStyles.push("display: flex");
    
    // Gap
    if (node.itemSpacing > 0 && node.primaryAxisAlignItems !== "SPACE_BETWEEN") {
      layoutStyles.push(`gap: ${node.itemSpacing}px`);
    }
    
    // Justify content
    let justifyContent = "flex-start";
    switch (node.primaryAxisAlignItems) {
      case "CENTER":
        justifyContent = "center";
        break;
      case "MAX":
        justifyContent = "flex-end";
        break;
      case "SPACE_BETWEEN":
        justifyContent = "space-between";
        break;
    }
    if (justifyContent !== "flex-start") {
      layoutStyles.push(`justify-content: ${justifyContent}`);
    }
    
    // Align items
    let alignItems = "flex-start";
    switch (node.counterAxisAlignItems) {
      case "CENTER":
        alignItems = "center";
        break;
      case "MAX":
        alignItems = "flex-end";
        break;
      case "BASELINE":
        alignItems = "baseline";
        break;
    }
    if (alignItems !== "flex-start") {
      layoutStyles.push(`align-items: ${alignItems}`);
    }
    
    additionalStyles = layoutStyles;
  }

  const styles = extractStylesFromBuilder(builder, additionalStyles);

  return {
    tag: 'ww-div',
    name: node.name,
    styles: {
      default: styles
    },
    slots: children.length > 0 ? { children } : undefined
  };
};

// Convert group using FigmaToCode logic
const convertGroup = async (node: GroupNode, settings: WeWebSettings): Promise<WeWebComponent | null> => {
  // Ignore invalid groups (same logic as FigmaToCode)
  if (node.width < 0 || node.height <= 0 || node.children.length === 0) {
    return null;
  }

  const children = await convertChildren(node, settings);
  const builder = new HtmlDefaultBuilder(node, settings).commonPositionStyles();
  const styles = extractStylesFromBuilder(builder);

  return {
    tag: 'ww-div',
    name: node.name,
    styles: {
      default: styles
    },
    slots: children.length > 0 ? { children } : undefined
  };
};

// Convert section using FigmaToCode logic
const convertSection = async (node: SectionNode, settings: WeWebSettings): Promise<WeWebComponent> => {
  const children = await convertChildren(node, settings);
  const builder = new HtmlDefaultBuilder(node, settings)
    .size()
    .position()
    .applyFillsToStyle(node.fills, "background");

  const styles = extractStylesFromBuilder(builder);

  return {
    tag: 'ww-div',
    name: node.name,
    styles: {
      default: styles
    },
    slots: children.length > 0 ? { children } : undefined
  };
};

// Convert line using FigmaToCode logic
const convertLine = (node: LineNode, settings: WeWebSettings): WeWebComponent => {
  const builder = new HtmlDefaultBuilder(node, settings)
    .commonPositionStyles()
    .commonShapeStyles();

  const styles = extractStylesFromBuilder(builder);

  return {
    tag: 'ww-div',
    name: node.name,
    styles: {
      default: styles
    }
  };
};

// Extract styles from builder and convert to WeWeb format
const extractStylesFromBuilder = (builder: HtmlDefaultBuilder, additionalStyles: string[] = []): Record<string, string> => {
  const allStyles = [...builder.styles, ...additionalStyles];
  const styleObj: Record<string, string> = {};

  allStyles.forEach(style => {
    if (!style) return;
    
    // Parse CSS style string
    const colonIndex = style.indexOf(':');
    if (colonIndex === -1) return;
    
    const property = style.substring(0, colonIndex).trim();
    const value = style.substring(colonIndex + 1).trim();
    
    // Convert CSS property to camelCase for WeWeb
    const camelProperty = property.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
    styleObj[camelProperty] = value;
  });

  return styleObj;
};

// Infer text tag based on node properties (same logic as before)
const inferTextTag = (node: TextNode): 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'button' | 'div' => {
  const name = node.name.toLowerCase();
  
  if (name.includes('button') || name.includes('btn')) return 'button';
  if (name.includes('h1') || name.includes('heading 1')) return 'h1';
  if (name.includes('h2') || name.includes('heading 2')) return 'h2';
  if (name.includes('h3') || name.includes('heading 3')) return 'h3';
  if (name.includes('h4') || name.includes('heading 4')) return 'h4';
  
  // Check font size to infer heading level
  if (node.fontSize && typeof node.fontSize === 'number') {
    if (node.fontSize >= 32) return 'h1';
    if (node.fontSize >= 24) return 'h2';
    if (node.fontSize >= 20) return 'h3';
    if (node.fontSize >= 18) return 'h4';
  }
  
  return 'p';
};