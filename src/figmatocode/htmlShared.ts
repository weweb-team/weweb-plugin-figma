// CSS Collection for external stylesheet or styled-components
interface CSSCollection {
  [className: string]: {
    styles: string[];
    nodeName?: string;
    nodeType?: string;
    element?: string; // Base HTML element to use
  };
}

export let cssCollection: CSSCollection = {};

// Instance counters for class name generation - we keep this but primarily as a fallback
const classNameCounters: Map<string, number> = new Map();

// Generate a class name - prefer direct uniqueId, but fall back to counter-based if needed
export function generateUniqueClassName(prefix = "figma"): string {
  // Sanitize the prefix to ensure valid CSS class
  const sanitizedPrefix =
    prefix.replace(/[^a-zA-Z0-9_-]/g, "").replace(/^[0-9_-]/, "f") || // Ensure it doesn't start with a number or special char
    "figma";

  // Most of the time, we'll just use the prefix directly as it's pre-generated to be unique
  // But keep the counter logic as a fallback
  const count = classNameCounters.get(sanitizedPrefix) || 0;
  classNameCounters.set(sanitizedPrefix, count + 1);

  // Only add suffix if this isn't the first instance
  return count === 0
    ? sanitizedPrefix
    : `${sanitizedPrefix}_${count.toString().padStart(2, "0")}`;
}

// Reset all class name counters - call this at the start of processing
export function resetClassNameCounters(): void {
  classNameCounters.clear();
}

// Reset CSS collection - call this at the start of processing
export function resetCssCollection(): void {
  cssCollection = {};
}

// Convert styles to CSS format
export function stylesToCSS(styles: string[], isJSX: boolean): string[] {
  return styles
    .map((style) => {
      // Skip empty styles
      if (!style.trim()) return "";

      // Handle JSX format if needed
      if (isJSX) {
        return style.replace(/^([a-zA-Z0-9]+):/, (match, prop) => {
          // Convert camelCase to kebab-case for CSS
          return (
            prop
              .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2")
              .toLowerCase() + ":"
          );
        });
      }
      return style;
    })
    .filter(Boolean); // Remove empty entries
}

// Get proper component name from node info
export function getComponentName(
  node: any,
  className?: string,
  nodeType = "div",
): string {
  // Start with Styled prefix
  let name = "Styled";

  // Use uniqueName if available, otherwise use name
  const nodeName: string = node.uniqueName || node.name;

  // Try to use node name first
  if (nodeName && nodeName.length > 0) {
    // Clean up the node name and capitalize first letter
    const cleanName = nodeName
      .replace(/[^a-zA-Z0-9]/g, "")
      .replace(/^[a-z]/, (match) => match.toUpperCase());

    name += cleanName || nodeType.charAt(0).toUpperCase() + nodeType.slice(1);
  }
  // Fall back to className if provided
  else if (className) {
    const parts = className.split("-");
    if (parts.length > 0 && parts[0]) {
      name += parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    } else {
      name += nodeType.charAt(0).toUpperCase() + nodeType.slice(1);
    }
  }
  // Last resort
  else {
    name += nodeType.charAt(0).toUpperCase() + nodeType.slice(1);
  }

  return name;
}

// Global preview state
export let isPreviewGlobal = false;

export function setIsPreviewGlobal(value: boolean): void {
  isPreviewGlobal = value;
}

export function getIsPreviewGlobal(): boolean {
  return isPreviewGlobal;
}