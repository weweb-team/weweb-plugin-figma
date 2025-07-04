// Color utility functions for Figma to WeWeb conversion

export interface FigmaColor {
    r: number;
    g: number;
    b: number;
    a?: number;
}

/**
 * Converts a Figma color (0-1 range) to hex format
 * Uses short format when possible (e.g., #FFF instead of #FFFFFF)
 */
export function figmaColorToHex(color: FigmaColor): string {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);

    const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
    const hex = `${toHex(r)}${toHex(g)}${toHex(b)}`;

    // Check if we can use short format
    if (hex[0] === hex[1] && hex[2] === hex[3] && hex[4] === hex[5]) {
        return `#${hex[0]}${hex[2]}${hex[4]}`;
    }

    return `#${hex}`;
}

/**
 * Converts a Figma color to CSS rgba format
 */
export function figmaColorToRgba(color: FigmaColor, opacity: number = 1): string {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    const a = opacity !== undefined ? opacity : (color.a !== undefined ? color.a : 1);

    return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Formats a Figma color to CSS, using hex for solid colors and rgba for transparent
 */
export function formatFigmaColor(color: FigmaColor | null | undefined, opacity?: number): string {
    if (!color)
        return 'transparent';

    const a = opacity !== undefined ? opacity : (color.a !== undefined ? color.a : 1);

    if (a < 1) {
        return figmaColorToRgba(color, a);
    }

    return figmaColorToHex(color);
}

/**
 * Extracts color with variable support
 */
export function extractColorWithVariable(
    paintOrEffect: any,
    getVariableById: (id: string) => any,
    onVariableFound?: (id: string, variable: any) => void,
): string {
    // Check for bound variable
    if (paintOrEffect.boundVariables?.color) {
        const variableId = paintOrEffect.boundVariables.color.id;
        const variable = getVariableById(variableId);

        if (variable) {
            // Notify about found variable
            if (onVariableFound) {
                onVariableFound(variableId, variable);
            }

            // Format the color with CSS variable
            const fallbackColor = formatFigmaColor(paintOrEffect.color, paintOrEffect.opacity);
            return `var(--${variable.name}, ${fallbackColor})`;
        }
    }

    // No variable, just return the formatted color
    return formatFigmaColor(paintOrEffect.color, paintOrEffect.opacity);
}
