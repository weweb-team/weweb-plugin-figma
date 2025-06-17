// Color utility functions adapted from FigmaToCode

export function retrieveFill(fill: Paint): string {
  if (fill.type === "SOLID") {
    const solidFill = fill as SolidPaint;
    return rgbToHex(solidFill.color, solidFill.opacity);
  }
  return "";
}

export function rgbToHex(color: RGB, opacity?: number): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  
  if (opacity !== undefined && opacity < 1) {
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  return `rgb(${r}, ${g}, ${b})`;
}

export function htmlColorFromFills(fills: readonly Paint[] | undefined): string {
  if (!fills || fills.length === 0) return "";
  
  const visibleFills = fills.filter(fill => fill.visible !== false);
  if (visibleFills.length === 0) return "";
  
  // For now, just use the first solid fill
  const solidFill = visibleFills.find(fill => fill.type === "SOLID") as SolidPaint;
  if (solidFill) {
    return rgbToHex(solidFill.color, solidFill.opacity);
  }
  
  return "";
}

export function buildBackgroundValues(fills: readonly Paint[] | undefined): string {
  if (!fills || fills.length === 0) return "";
  
  const visibleFills = fills.filter(fill => fill.visible !== false);
  if (visibleFills.length === 0) return "";
  
  const backgrounds: string[] = [];
  
  for (const fill of visibleFills.reverse()) {
    if (fill.type === "SOLID") {
      const solidFill = fill as SolidPaint;
      backgrounds.push(rgbToHex(solidFill.color, solidFill.opacity));
    } else if (fill.type === "GRADIENT_LINEAR") {
      const gradient = extractLinearGradient(fill as GradientPaint);
      if (gradient) backgrounds.push(gradient);
    }
  }
  
  return backgrounds.join(", ");
}

function extractLinearGradient(gradient: GradientPaint): string | null {
  if (!gradient.gradientStops || gradient.gradientStops.length < 2) return null;
  
  const stops = gradient.gradientStops
    .map(stop => `${rgbToHex(stop.color)} ${Math.round(stop.position * 100)}%`)
    .join(", ");
  
  // Calculate angle (simplified)
  const angle = calculateGradientAngle(gradient.gradientTransform);
  return `linear-gradient(${angle}deg, ${stops})`;
}

function calculateGradientAngle(transform: Transform): number {
  // Simplified angle calculation - just return 90 for now
  return 90;
}