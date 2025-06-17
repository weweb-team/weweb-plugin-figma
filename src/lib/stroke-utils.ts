// Stroke utility functions adapted from FigmaToCode

export interface StrokeResult {
  all?: number;
  left?: number;
  top?: number;
  right?: number;
  bottom?: number;
}

export function commonStroke(node: any): StrokeResult | null {
  if (!('strokes' in node) || !node.strokes || node.strokes.length === 0) {
    return null;
  }
  
  const strokeWeight = node.strokeWeight || 0;
  if (strokeWeight === 0) return null;
  
  // Check if it's individual strokes
  if ('individualStrokes' in node && node.individualStrokes) {
    return {
      left: node.strokeLeftWeight || 0,
      top: node.strokeTopWeight || 0,
      right: node.strokeRightWeight || 0,
      bottom: node.strokeBottomWeight || 0
    };
  }
  
  // Uniform stroke
  return {
    all: strokeWeight
  };
}