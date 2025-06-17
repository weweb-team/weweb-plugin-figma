// WeWeb JSON converter using FigmaToCode logic
import { buildBackgroundValues, htmlColorFromFills } from './color-utils';
import { commonIsAbsolutePosition, getCommonPositionValue } from './position-utils';
import { commonStroke } from './stroke-utils';
import { extractShadow } from './shadow-utils';
import { numberToFixedString, convertFontWeight } from './common-utils';

export interface WeWebComponent {
  tag: string;
  props?: Record<string, any>;
  styles: {
    default: Record<string, string>;
    tablet?: Record<string, string>;
    mobile?: Record<string, string>;
  };
  slots?: {
    children?: WeWebComponent[];
  };
}

export interface WeWebTextComponent extends WeWebComponent {
  tag: 'ww-text';
  props: {
    text: { en: string };
    tag?: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'button' | 'div';
  };
}

export interface WeWebImageComponent extends WeWebComponent {
  tag: 'ww-image';
  props: {
    url: string;
    objectFit: 'cover' | 'contain' | null;
    overlay?: string | null;
    filter?: string;
    alt: { en: string };
    loading: 'lazy' | 'eager';
  };
}

export interface WeWebDivComponent extends WeWebComponent {
  tag: 'ww-div';
  slots?: {
    children?: WeWebComponent[];
  };
}

class WeWebDefaultBuilder {
  node: SceneNode;
  styles: Record<string, string> = {};

  constructor(node: SceneNode) {
    this.node = node;
  }

  commonPositionStyles(): this {
    this.size();
    this.autoLayoutPadding();
    this.position();
    this.blend();
    return this;
  }

  commonShapeStyles(): this {
    if ('fills' in this.node) {
      this.applyFillsToStyle(
        this.node.fills,
        this.node.type === 'TEXT' ? 'text' : 'background'
      );
    }
    this.shadow();
    this.border();
    this.blur();
    return this;
  }

  size(): this {
    if ('width' in this.node && 'height' in this.node) {
      if (this.node.type === 'TEXT') {
        const textNode = this.node as TextNode;
        switch (textNode.textAutoResize) {
          case 'WIDTH_AND_HEIGHT':
            // Don't set width/height for auto-resize text
            break;
          case 'HEIGHT':
            this.styles.width = `${numberToFixedString(this.node.width)}px`;
            break;
          case 'NONE':
          case 'TRUNCATE':
            this.styles.width = `${numberToFixedString(this.node.width)}px`;
            this.styles.height = `${numberToFixedString(this.node.height)}px`;
            break;
        }
      } else {
        this.styles.width = `${numberToFixedString(this.node.width)}px`;
        this.styles.height = `${numberToFixedString(this.node.height)}px`;
      }
    }
    return this;
  }

  position(): this {
    const isAbsolute = commonIsAbsolutePosition(this.node);
    if (isAbsolute) {
      const { x, y } = getCommonPositionValue(this.node);
      this.styles.position = 'absolute';
      this.styles.left = x;
      this.styles.top = y;
    } else {
      if (this.node.type === 'GROUP' || (this.node as any).isRelative) {
        this.styles.position = 'relative';
      }
    }
    return this;
  }

  blend(): this {
    // Visibility
    if (!this.node.visible) {
      this.styles.display = 'none';
    }

    // Opacity
    if ('opacity' in this.node && this.node.opacity !== undefined && this.node.opacity < 1) {
      this.styles.opacity = this.node.opacity.toString();
    }

    // Rotation (simplified)
    if ('rotation' in this.node && this.node.rotation && this.node.rotation !== 0) {
      this.styles.transform = `rotate(${this.node.rotation}rad)`;
    }

    return this;
  }

  applyFillsToStyle(
    paintArray: readonly Paint[] | PluginAPI['mixed'],
    property: 'text' | 'background'
  ): this {
    if (property === 'text') {
      const color = htmlColorFromFills(paintArray as readonly Paint[]);
      if (color) {
        this.styles.color = color;
      }
    } else {
      const background = buildBackgroundValues(paintArray as readonly Paint[]);
      if (background) {
        this.styles.background = background;
      }
    }
    return this;
  }

  shadow(): this {
    if ('effects' in this.node) {
      const shadow = extractShadow(this.node);
      if (shadow) {
        this.styles.boxShadow = shadow;
      }
    }
    return this;
  }

  border(): this {
    const strokeResult = commonStroke(this.node);
    if (!strokeResult) return this;

    const strokes = ('strokes' in this.node && this.node.strokes) || undefined;
    const color = htmlColorFromFills(strokes as any);
    if (!color) return this;

    const borderStyle = ('dashPattern' in this.node && this.node.dashPattern && this.node.dashPattern.length > 0) 
      ? 'dotted' : 'solid';

    if ('all' in strokeResult && strokeResult.all) {
      this.styles.border = `${numberToFixedString(strokeResult.all)}px ${borderStyle} ${color}`;
    } else {
      if (strokeResult.left) {
        this.styles.borderLeft = `${numberToFixedString(strokeResult.left)}px ${borderStyle} ${color}`;
      }
      if (strokeResult.top) {
        this.styles.borderTop = `${numberToFixedString(strokeResult.top)}px ${borderStyle} ${color}`;
      }
      if (strokeResult.right) {
        this.styles.borderRight = `${numberToFixedString(strokeResult.right)}px ${borderStyle} ${color}`;
      }
      if (strokeResult.bottom) {
        this.styles.borderBottom = `${numberToFixedString(strokeResult.bottom)}px ${borderStyle} ${color}`;
      }
    }

    // Border radius
    if ('cornerRadius' in this.node && this.node.cornerRadius) {
      this.styles.borderRadius = `${numberToFixedString(this.node.cornerRadius)}px`;
    } else if ('topLeftRadius' in this.node) {
      const radii = [
        this.node.topLeftRadius || 0,
        this.node.topRightRadius || 0,
        this.node.bottomRightRadius || 0,
        this.node.bottomLeftRadius || 0
      ];
      if (radii.some(r => r > 0)) {
        this.styles.borderRadius = radii.map(r => `${numberToFixedString(r)}px`).join(' ');
      }
    }

    return this;
  }

  blur(): this {
    if ('effects' in this.node && this.node.effects.length > 0) {
      const blur = this.node.effects.find(e => e.type === 'LAYER_BLUR' && e.visible);
      if (blur) {
        this.styles.filter = `blur(${numberToFixedString(blur.radius / 2)}px)`;
      }

      const backgroundBlur = this.node.effects.find(e => e.type === 'BACKGROUND_BLUR' && e.visible);
      if (backgroundBlur) {
        this.styles.backdropFilter = `blur(${numberToFixedString(backgroundBlur.radius / 2)}px)`;
      }
    }
    return this;
  }

  autoLayoutPadding(): this {
    if ('paddingLeft' in this.node) {
      const paddings = [
        this.node.paddingTop || 0,
        this.node.paddingRight || 0,
        this.node.paddingBottom || 0,
        this.node.paddingLeft || 0
      ];
      
      if (paddings.some(p => p > 0)) {
        if (paddings.every(p => p === paddings[0])) {
          // All paddings are the same
          this.styles.padding = `${numberToFixedString(paddings[0])}px`;
        } else {
          // Different paddings
          this.styles.padding = paddings.map(p => `${numberToFixedString(p)}px`).join(' ');
        }
      }
    }
    return this;
  }

  getStyles(): Record<string, string> {
    return { ...this.styles };
  }
}

class WeWebTextBuilder extends WeWebDefaultBuilder {
  textTrim(): this {
    // Add text-specific trimming logic if needed
    return this;
  }

  textAlignHorizontal(): this {
    if (this.node.type === 'TEXT') {
      const textNode = this.node as TextNode;
      if (textNode.textAlignHorizontal) {
        this.styles.textAlign = textNode.textAlignHorizontal.toLowerCase();
      }
    }
    return this;
  }

  textAlignVertical(): this {
    if (this.node.type === 'TEXT') {
      const textNode = this.node as TextNode;
      if (textNode.textAlignVertical) {
        // Convert Figma vertical alignment to CSS
        switch (textNode.textAlignVertical) {
          case 'TOP':
            this.styles.alignItems = 'flex-start';
            break;
          case 'CENTER':
            this.styles.alignItems = 'center';
            break;
          case 'BOTTOM':
            this.styles.alignItems = 'flex-end';
            break;
        }
      }
    }
    return this;
  }

  getTextContent(): string {
    if (this.node.type === 'TEXT') {
      return (this.node as TextNode).characters || '';
    }
    return '';
  }

  getTextStyles(): Record<string, string> {
    if (this.node.type !== 'TEXT') return {};
    
    const textNode = this.node as TextNode;
    const textStyles: Record<string, string> = {};

    // Font family
    if (textNode.fontName && typeof textNode.fontName === 'object' && 'family' in textNode.fontName) {
      textStyles.fontFamily = `"${textNode.fontName.family}"`;
    }

    // Font size
    if (textNode.fontSize && typeof textNode.fontSize === 'number') {
      textStyles.fontSize = `${numberToFixedString(textNode.fontSize)}px`;
    }

    // Font weight
    if (textNode.fontName && typeof textNode.fontName === 'object' && 'style' in textNode.fontName) {
      const weight = convertFontWeight(textNode.fontName.style);
      textStyles.fontWeight = weight;
    }

    // Line height
    if (textNode.lineHeight && typeof textNode.lineHeight === 'object') {
      if (textNode.lineHeight.unit === 'PIXELS') {
        textStyles.lineHeight = `${numberToFixedString(textNode.lineHeight.value)}px`;
      } else if (textNode.lineHeight.unit === 'PERCENT') {
        textStyles.lineHeight = `${textNode.lineHeight.value / 100}`;
      }
    }

    // Letter spacing
    if (textNode.letterSpacing && typeof textNode.letterSpacing === 'object' && textNode.letterSpacing.unit === 'PIXELS') {
      textStyles.letterSpacing = `${numberToFixedString(textNode.letterSpacing.value)}px`;
    }

    return textStyles;
  }
}

class WeWebConverter {
  convertNodeToWeWeb(node: SceneNode): WeWebComponent {
    switch (node.type) {
      case 'TEXT':
        return this.convertTextNode(node as TextNode);
      case 'RECTANGLE':
      case 'ELLIPSE':
        return this.convertShapeNode(node);
      case 'FRAME':
      case 'COMPONENT':
      case 'INSTANCE':
      case 'COMPONENT_SET':
        return this.convertFrameNode(node);
      case 'GROUP':
        return this.convertGroupNode(node as GroupNode);
      case 'SECTION':
        return this.convertSectionNode(node as SectionNode);
      case 'LINE':
        return this.convertLineNode(node as LineNode);
      default:
        return this.convertDefaultNode(node);
    }
  }

  private convertTextNode(node: TextNode): WeWebTextComponent {
    const builder = new WeWebTextBuilder(node)
      .commonPositionStyles()
      .textTrim()
      .textAlignHorizontal()
      .textAlignVertical();

    const styles = {
      ...builder.getStyles(),
      ...builder.getTextStyles()
    };

    return {
      tag: 'ww-text',
      props: {
        text: { en: builder.getTextContent() },
        tag: this.inferTextTag(node)
      },
      styles: {
        default: styles
      }
    };
  }

  private convertShapeNode(node: SceneNode): WeWebComponent {
    // Check if it's an image
    if (this.hasImageFill(node)) {
      return this.convertImageNode(node);
    }

    const builder = new WeWebDefaultBuilder(node)
      .commonPositionStyles()
      .commonShapeStyles();

    return {
      tag: 'ww-div',
      styles: {
        default: builder.getStyles()
      }
    };
  }

  private convertImageNode(node: SceneNode): WeWebImageComponent {
    const builder = new WeWebDefaultBuilder(node)
      .commonPositionStyles()
      .commonShapeStyles();

    return {
      tag: 'ww-image',
      props: {
        url: "https://cdn.weweb.app/public/images/no_image_selected.png",
        objectFit: 'cover',
        overlay: null,
        filter: "",
        alt: { en: node.name || "" },
        loading: 'lazy'
      },
      styles: {
        default: builder.getStyles()
      }
    };
  }

  private convertFrameNode(node: SceneNode): WeWebDivComponent {
    const children = this.convertChildren(node);
    const builder = new WeWebDefaultBuilder(node).commonPositionStyles();

    // Handle auto-layout
    if ('layoutMode' in node && node.layoutMode !== 'NONE') {
      if (node.layoutMode === 'HORIZONTAL') {
        builder.styles.display = 'flex';
        builder.styles.flexDirection = 'row';
      } else if (node.layoutMode === 'VERTICAL') {
        builder.styles.display = 'flex';
        builder.styles.flexDirection = 'column';
      }

      // Gap
      if ('itemSpacing' in node && node.itemSpacing > 0) {
        builder.styles.gap = `${numberToFixedString(node.itemSpacing)}px`;
      }

      // Alignment
      if ('primaryAxisAlignItems' in node) {
        const alignment = this.mapAlignment(node.primaryAxisAlignItems);
        if (node.layoutMode === 'HORIZONTAL') {
          builder.styles.justifyContent = alignment;
        } else {
          builder.styles.alignItems = alignment;
        }
      }

      if ('counterAxisAlignItems' in node) {
        const alignment = this.mapAlignment(node.counterAxisAlignItems);
        if (node.layoutMode === 'HORIZONTAL') {
          builder.styles.alignItems = alignment;
        } else {
          builder.styles.justifyContent = alignment;
        }
      }
    }

    builder.commonShapeStyles();

    return {
      tag: 'ww-div',
      styles: {
        default: builder.getStyles()
      },
      slots: children.length > 0 ? { children } : undefined
    };
  }

  private convertGroupNode(node: GroupNode): WeWebDivComponent {
    if (node.width <= 0 || node.height <= 0 || node.children.length === 0) {
      return {
        tag: 'ww-div',
        styles: { default: {} }
      };
    }

    const children = this.convertChildren(node);
    const builder = new WeWebDefaultBuilder(node).commonPositionStyles();

    return {
      tag: 'ww-div',
      styles: {
        default: builder.getStyles()
      },
      slots: children.length > 0 ? { children } : undefined
    };
  }

  private convertSectionNode(node: SectionNode): WeWebDivComponent {
    const children = this.convertChildren(node);
    const builder = new WeWebDefaultBuilder(node)
      .size()
      .position();

    if ('fills' in node) {
      builder.applyFillsToStyle(node.fills, 'background');
    }

    return {
      tag: 'ww-div',
      styles: {
        default: builder.getStyles()
      },
      slots: children.length > 0 ? { children } : undefined
    };
  }

  private convertLineNode(node: LineNode): WeWebDivComponent {
    const builder = new WeWebDefaultBuilder(node)
      .commonPositionStyles()
      .commonShapeStyles();

    return {
      tag: 'ww-div',
      styles: {
        default: builder.getStyles()
      }
    };
  }

  private convertDefaultNode(node: SceneNode): WeWebDivComponent {
    const children = this.convertChildren(node);
    const builder = new WeWebDefaultBuilder(node).commonPositionStyles();

    return {
      tag: 'ww-div',
      styles: {
        default: builder.getStyles()
      },
      slots: children.length > 0 ? { children } : undefined
    };
  }

  private convertChildren(node: SceneNode): WeWebComponent[] {
    if (!('children' in node) || !node.children) {
      return [];
    }

    return node.children
      .filter(child => child.visible !== false)
      .map(child => this.convertNodeToWeWeb(child));
  }

  private hasImageFill(node: SceneNode): boolean {
    if (!('fills' in node) || !node.fills) return false;
    return node.fills.some(fill => fill.type === 'IMAGE');
  }

  private inferTextTag(node: TextNode): 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'button' | 'div' {
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
  }

  private mapAlignment(alignment: string): string {
    switch (alignment) {
      case 'MIN': return 'flex-start';
      case 'CENTER': return 'center';
      case 'MAX': return 'flex-end';
      case 'SPACE_BETWEEN': return 'space-between';
      default: return 'flex-start';
    }
  }
}

export const wewebConverter = new WeWebConverter();