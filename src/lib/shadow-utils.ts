// Shadow utility functions adapted from FigmaToCode
import { rgbToHex } from './color-utils';

export function extractShadow(node: any): string {
  if (!('effects' in node) || !node.effects || node.effects.length === 0) {
    return "";
  }
  
  const shadows: string[] = [];
  
  for (const effect of node.effects) {
    if (!effect.visible) continue;
    
    if (effect.type === "DROP_SHADOW") {
      const shadow = effect as DropShadowEffect;
      const color = rgbToHex(shadow.color, shadow.color.a || 1);
      shadows.push(`${shadow.offset.x}px ${shadow.offset.y}px ${shadow.radius}px ${color}`);
    } else if (effect.type === "INNER_SHADOW") {
      const shadow = effect as DropShadowEffect;
      const color = rgbToHex(shadow.color, shadow.color.a || 1);
      shadows.push(`inset ${shadow.offset.x}px ${shadow.offset.y}px ${shadow.radius}px ${color}`);
    }
  }
  
  return shadows.join(", ");
}