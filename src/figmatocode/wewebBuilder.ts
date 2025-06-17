import { HtmlDefaultBuilder } from "./htmlDefaultBuilder";
import { HTMLSettings } from "./types";
import { wewebSizePartial } from "./builderImpl/wewebSize";
import { formatWithJSX } from "./common/parseJSX";

export class WewebBuilder extends HtmlDefaultBuilder {
  private isRootNode: boolean;

  constructor(node: SceneNode, settings: HTMLSettings, isRootNode: boolean = false) {
    super(node, settings);
    this.isRootNode = isRootNode;
  }

  // Override size method for WeWeb-specific logic
  size(): this {
    const { node } = this;
    const { width, height } = wewebSizePartial(node, this.isRootNode);

    // For WeWeb, we handle sizing differently
    if (width !== undefined) {
      if (typeof width === 'string') {
        // Keep percentage values as strings for WeWeb
        this.addStyles(`width: ${width}`);
      } else {
        // Numeric values stay as pixels
        this.addStyles(formatWithJSX("width", this.isJSX, width));
      }
    }

    if (height !== undefined) {
      if (typeof height === 'string') {
        // Keep percentage values as strings for WeWeb
        this.addStyles(`height: ${height}`);
      } else {
        // Numeric values stay as pixels
        this.addStyles(formatWithJSX("height", this.isJSX, height));
      }
    }

    // Handle flex property for fill containers
    const nodeParent = node.parent;
    if (nodeParent && "layoutMode" in nodeParent) {
      const size = node.width === figma.mixed ? null : 
        node.layoutSizingHorizontal === "FILL" || node.layoutSizingVertical === "FILL" ? "fill" : null;
      
      if (size === "fill") {
        if (nodeParent.layoutMode === "HORIZONTAL" && node.layoutSizingHorizontal === "FILL") {
          this.addStyles("flex: 1 1 0");
        } else if (nodeParent.layoutMode === "VERTICAL" && node.layoutSizingVertical === "FILL") {
          this.addStyles("flex: 1 1 0");
        }
      }
    }

    // Handle min/max constraints
    if (node.maxWidth !== undefined && node.maxWidth !== null) {
      this.addStyles(formatWithJSX("max-width", this.isJSX, node.maxWidth));
    }
    if (node.minWidth !== undefined && node.minWidth !== null) {
      this.addStyles(formatWithJSX("min-width", this.isJSX, node.minWidth));
    }
    if (node.maxHeight !== undefined && node.maxHeight !== null) {
      this.addStyles(formatWithJSX("max-height", this.isJSX, node.maxHeight));
    }
    if (node.minHeight !== undefined && node.minHeight !== null) {
      this.addStyles(formatWithJSX("min-height", this.isJSX, node.minHeight));
    }

    return this;
  }
}