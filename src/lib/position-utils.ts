// Position utility functions adapted from FigmaToCode

export function commonIsAbsolutePosition(node: SceneNode): boolean {
  if (!('parent' in node) || !node.parent) return false;
  
  // Don't make page children absolute
  if (node.parent.type === 'PAGE') return false;
  
  // If parent has no auto-layout, children should be absolute
  if ('layoutMode' in node.parent && node.parent.layoutMode === 'NONE') {
    return true;
  }
  
  return false;
}

export function getCommonPositionValue(node: SceneNode): { x: string; y: string } {
  if (!('x' in node) || !('y' in node)) {
    return { x: '0px', y: '0px' };
  }
  
  return {
    x: `${Math.round(node.x)}px`,
    y: `${Math.round(node.y)}px`
  };
}