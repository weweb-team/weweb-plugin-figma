// Common utility functions from FigmaToCode
export function numToAutoFixed(num: number): string {
  return num % 1 === 0 ? num.toString() : num.toFixed(2);
}

export function numberToFixedString(num: number): string {
  return numToAutoFixed(num);
}

export function stringToClassName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function indentString(str: string, spaces: number = 2): string {
  const indent = ' '.repeat(spaces);
  return str.split('\n').map(line => line ? indent + line : line).join('\n');
}

// Convert font weight from Figma style to CSS value
export function convertFontWeight(fontStyle: string): string {
  const weightMap: Record<string, string> = {
    'Thin': '100',
    'ExtraLight': '200',
    'Extra Light': '200',
    'Light': '300',
    'Regular': '400',
    'Normal': '400',
    'Medium': '500',
    'SemiBold': '600',
    'Semi Bold': '600',
    'Bold': '700',
    'ExtraBold': '800',
    'Extra Bold': '800',
    'Black': '900',
    'Heavy': '900'
  };
  
  return weightMap[fontStyle] || '400';
}