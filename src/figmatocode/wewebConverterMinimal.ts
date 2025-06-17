// Minimal WeWeb converter to test for temporal dead zone issues
interface WeWebComponent {
  tag: string;
  name: string;
  props?: { default?: Record<string, any> };
  styles: { default: Record<string, string> };
  slots?: { children?: WeWebComponent[] };
}

export const convertToWeWeb = async (sceneNode: ReadonlyArray<SceneNode>): Promise<WeWebComponent[]> => {
  console.log('Starting conversion with minimal converter');
  
  const results: WeWebComponent[] = [];
  
  for (const node of sceneNode) {
    try {
      const component = convertSingleNode(node);
      if (component) {
        results.push(component);
      }
    } catch (error) {
      console.error('Error converting node:', error);
      // Return a fallback component
      results.push({
        tag: 'ww-div',
        name: node.name || 'Unknown',
        styles: { default: {} }
      });
    }
  }
  
  return results;
};

function convertSingleNode(node: SceneNode): WeWebComponent | null {
  const styles: Record<string, string> = {};
  
  // Basic positioning and sizing
  if ('x' in node && 'y' in node) {
    styles.position = 'absolute';
    styles.left = node.x + 'px';
    styles.top = node.y + 'px';
  }
  
  if ('width' in node && 'height' in node) {
    styles.width = node.width + 'px';
    styles.height = node.height + 'px';
  }
  
  // Handle different node types
  switch (node.type) {
    case 'TEXT':
      const textNode = node as TextNode;
      return {
        tag: 'ww-text',
        name: textNode.name,
        props: {
          default: {
            text: { en: textNode.characters || '' }
          }
        },
        styles: { default: styles }
      };
      
    case 'RECTANGLE':
    case 'ELLIPSE':
    case 'FRAME':
    case 'COMPONENT':
    case 'INSTANCE':
      return {
        tag: 'ww-div',
        name: node.name,
        styles: { default: styles }
      };
      
    default:
      return null;
  }
}