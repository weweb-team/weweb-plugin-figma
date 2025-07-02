// Variable extraction functionality for Figma tokens
import pLimit from 'p-limit';

interface WeWebVariable {
    id: string;
    name: string;
    type: 'color' | 'spacing' | 'typography' | 'radius' | 'shadow' | 'number' | 'string';
    category?: string;
    values: {
        [theme: string]: any;
    };
    figmaId?: string;
    description?: string;
}

export class VariableExtractor {
    private variables: Map<string, WeWebVariable> = new Map();
    private figmaToWeWebIdMap: Map<string, string> = new Map();
    private processedVariableIds: Set<string> = new Set();
    private progressCallback?: (message: string) => void;

    // Tracking counters
    private colorFromVariables = 0;
    private colorFromLocalStyles = 0;
    private colorFromRemoteStyles = 0;

    // Error tracking
    private variableImportErrors = 0;
    private styleImportErrors = 0;

    constructor(progressCallback?: (message: string) => void) {
        this.progressCallback = progressCallback;
    }

    private reportProgress(message: string) {
        if (this.progressCallback) {
            this.progressCallback(message);
        }
    }

    async extractAllVariables(): Promise<WeWebVariable[]> {
        try {
            this.reportProgress('Starting variable extraction...');

            // Step 1: Get all LOCAL variables directly (no scanning needed!)
            this.reportProgress('Getting all local variables...');
            const localVariables = await figma.variables.getLocalVariablesAsync();
            this.reportProgress(`Found ${localVariables.length} local variables`);

            // Process each local variable
            let localVariableCount = 0;
            for (const variable of localVariables) {
                // Get the variable's collection to access modes
                const collection = await figma.variables.getVariableCollectionByIdAsync(variable.variableCollectionId);
                if (collection) {
                    const wewebVariable = this.convertVariable(variable, collection, collection.modes);
                    if (wewebVariable) {
                        this.variables.set(wewebVariable.id, wewebVariable);
                        this.figmaToWeWebIdMap.set(variable.id, wewebVariable.id);
                        localVariableCount++;
                        if (wewebVariable.type === 'color') {
                            this.colorFromVariables++;
                        }
                    }
                }
            }
            this.reportProgress(`✅ Extracted ${localVariableCount} local variables`);

            // Step 2: Get all LIBRARY variable collections
            this.reportProgress('Getting library variable collections...');
            try {
                const libraryCollections = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();
                this.reportProgress(`Found ${libraryCollections.length} library variable collections`);

                // Create a concurrency limiter for collections
                const collectionLimit = pLimit(3); // Process up to 3 collections concurrently

                // Process library collections concurrently
                const collectionPromises = libraryCollections.map((libCollection) =>
                    collectionLimit(async () => {
                        this.reportProgress(`Processing library collection: ${libCollection.name} from ${libCollection.libraryName}`);

                        try {
                            // Get variables in this library collection
                            const libraryVariables = await figma.teamLibrary.getVariablesInLibraryCollectionAsync(libCollection.key);
                            this.reportProgress(`Found ${libraryVariables.length} variables in collection ${libCollection.name}`);

                            // Create a limiter for variables within this collection
                            const variableLimit = pLimit(5); // Process up to 5 variables concurrently

                            // Process variables concurrently
                            const variablePromises = libraryVariables.map((libVariable) =>
                                variableLimit(async () => {
                                    try {
                                        // Import the variable to get full access
                                        const importedVariable = await figma.variables.importVariableByKeyAsync(libVariable.key);
                                        if (importedVariable) {
                                            // Get the collection
                                            const collection = await figma.variables.getVariableCollectionByIdAsync(importedVariable.variableCollectionId);
                                            if (collection) {
                                                const wewebVariable = this.convertVariable(importedVariable, collection, collection.modes);
                                                if (wewebVariable) {
                                                    this.variables.set(wewebVariable.id, wewebVariable);
                                                    this.figmaToWeWebIdMap.set(importedVariable.id, wewebVariable.id);
                                                    if (wewebVariable.type === 'color') {
                                                        this.colorFromVariables++;
                                                    }
                                                }
                                            }
                                        }
                                    } catch (varErr: any) {
                                        this.reportProgress(`⚠️ Error importing variable ${libVariable.name}: ${varErr.message || varErr}`);
                                        this.variableImportErrors++;
                                    }
                                }),
                            );

                            await Promise.all(variablePromises);
                        } catch (err: any) {
                            this.reportProgress(`⚠️ Error processing library collection ${libCollection.name}: ${err.message || err}`);
                        }
                    }),
                );

                await Promise.all(collectionPromises);
                const libraryVariableCount = this.variables.size - localVariableCount;
                this.reportProgress(`✅ Extracted ${libraryVariableCount} library variables`);
                this.reportProgress('Finished processing library collections');
            } catch (err) {
                this.reportProgress(`⚠️ Error getting library collections: ${err}`);
                this.reportProgress('This might be because no libraries are enabled for this file');
            }

            // Step 3: Extract color styles if no color variables found
            const hasColorVariables = Array.from(this.variables.values()).some((v) => v.type === 'color');
            const variableCountBeforeStyles = this.variables.size;
            if (!hasColorVariables) {
                this.reportProgress('No color variables found, extracting color styles...');
                await this.extractColorStyles();
                const colorStyleCount = this.variables.size - variableCountBeforeStyles;
                this.reportProgress(`✅ Extracted ${colorStyleCount} color styles`);
            }

            // Step 4: Extract text styles
            const variableCountBeforeTextStyles = this.variables.size;
            this.reportProgress('Extracting text styles...');
            await this.extractTextStyles();
            const textStyleCount = this.variables.size - variableCountBeforeTextStyles;
            this.reportProgress(`✅ Extracted ${textStyleCount} text styles`);

            // Step 5: Resolve variable aliases (variables that reference other variables)
            this.reportProgress('Resolving variable aliases...');
            await this.resolveVariableAliases();

            const result = Array.from(this.variables.values());

            // Breakdown by type
            const breakdown: Record<string, number> = {};
            for (const variable of result) {
                breakdown[variable.type] = (breakdown[variable.type] || 0) + 1;
            }

            this.reportProgress('=== EXTRACTION SUMMARY ===');
            this.reportProgress(`Total variables: ${result.length}`);

            // Detailed color breakdown
            this.reportProgress(`\nColor variables (${breakdown.color || 0} total):`);
            this.reportProgress(`  - From Figma Variables API: ${this.colorFromVariables}`);
            this.reportProgress(`  - From Local Paint Styles: ${this.colorFromLocalStyles}`);
            this.reportProgress(`  - From Remote Paint Styles (via scan): ${this.colorFromRemoteStyles}`);

            this.reportProgress(`\nAll types:`);
            for (const [type, count] of Object.entries(breakdown)) {
                this.reportProgress(`  - ${type}: ${count}`);
            }

            // Error summary
            const totalErrors = this.variableImportErrors + this.styleImportErrors;
            if (totalErrors > 0) {
                this.reportProgress(`\nErrors encountered:`);
                if (this.variableImportErrors > 0) {
                    this.reportProgress(`  - Variable import errors: ${this.variableImportErrors}`);
                }
                if (this.styleImportErrors > 0) {
                    this.reportProgress(`  - Style import errors: ${this.styleImportErrors}`);
                }
                this.reportProgress(`  - Total errors: ${totalErrors}`);
            }

            this.reportProgress('========================');

            return result;
        } catch (error) {
            this.reportProgress(`⚠️ Error extracting variables: ${error}`);
            throw error;
        }
    }

    private convertVariable(
        variable: Variable,
        _collection: VariableCollection,
        modes: Mode[],
    ): WeWebVariable | null {
        const wewebId = this.generateUUID();
        const values: Record<string, any> = {};

        // Log variable details for debugging
        this.reportProgress(`Converting variable: ${variable.name} (${variable.resolvedType})`);

        // Extract values for each mode
        for (const mode of modes) {
            const value = variable.valuesByMode[mode.modeId];
            const themeName = this.normalizeModeName(mode.name);

            // Check if value is a variable alias (reference to another variable)
            if (value && typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS') {
                this.reportProgress(`Variable ${variable.name} references another variable: ${value.id}`);
                // For now, store the reference - we'll resolve these in a second pass
                values[themeName] = value;
                continue;
            }

            switch (variable.resolvedType) {
                case 'COLOR':
                    if (value && typeof value === 'object' && 'r' in value) {
                        values[themeName] = this.rgbaToHex(value as RGBA);
                    } else {
                        console.warn(`Unexpected color format for ${variable.name}:`, value);
                    }
                    break;

                case 'FLOAT':
                    // Make sure we have a number value
                    if (typeof value === 'number') {
                        // Check if it's a spacing value based on name
                        const name = variable.name.toLowerCase();
                        if (name.includes('spacing') || name.includes('padding') || name.includes('margin') || name.includes('gap') || name.includes('width') || name.includes('height')) {
                            values[themeName] = `${value}px`;
                        } else {
                            values[themeName] = value;
                        }
                    } else {
                        console.warn(`Unexpected float format for ${variable.name}:`, value);
                        values[themeName] = value; // Store as-is for debugging
                    }
                    break;

                case 'STRING':
                    values[themeName] = value;
                    break;

                case 'BOOLEAN':
                    values[themeName] = value;
                    break;

                default:
                    console.warn(`Unknown variable type ${variable.resolvedType} for ${variable.name}`);
                    values[themeName] = value;
            }
        }

        return {
            id: wewebId,
            name: this.sanitizeVariableName(variable.name),
            type: this.getVariableType(variable),
            category: this.extractCategory(variable.name),
            values,
            figmaId: variable.id,
            description: variable.description || undefined,
        };
    }

    private getVariableType(variable: Variable): WeWebVariable['type'] {
        const name = variable.name.toLowerCase();

        if (variable.resolvedType === 'COLOR')
            return 'color';

        // Check name patterns for better type inference
        if (name.includes('spacing') || name.includes('padding') || name.includes('margin') || name.includes('gap')) {
            return 'spacing';
        }
        if (name.includes('radius') || name.includes('corner')) {
            return 'radius';
        }
        if (name.includes('font') || name.includes('text') || name.includes('typography')) {
            return 'typography';
        }
        if (name.includes('shadow') || name.includes('elevation')) {
            return 'shadow';
        }

        // Default based on resolved type
        if (variable.resolvedType === 'FLOAT')
            return 'number';
        if (variable.resolvedType === 'STRING')
            return 'string';

        return 'string';
    }

    private extractCategory(name: string): string | undefined {
    // Extract category from naming convention (e.g., "color/primary/500" -> "color/primary")
        const parts = name.split('/');
        if (parts.length > 1) {
            return parts.slice(0, -1).join('/');
        }

        // Or extract from common patterns
        const patterns = [
            { pattern: /^(primary|secondary|tertiary|neutral)/, category: 'color' },
            { pattern: /^(spacing|padding|margin)/, category: 'spacing' },
            { pattern: /^(heading|body|caption)/, category: 'typography' },
            { pattern: /^(small|medium|large|xl)/, category: 'size' },
        ];

        for (const { pattern, category } of patterns) {
            if (pattern.test(name.toLowerCase())) {
                return category;
            }
        }

        return undefined;
    }

    private sanitizeVariableName(name: string): string {
    // Convert Figma variable names to web-friendly format
        return name
            .replace(/\s+/g, '-')
            .replace(/\//g, '-')
            .replace(/[^\w-]/g, '')
            .toLowerCase();
    }

    private normalizeModeName(modeName: string): string {
    // Normalize mode names to standard theme names
        const normalized = modeName.toLowerCase().replace(/\s+/g, '-');

        // Map common mode names
        const modeMap: Record<string, string> = {
            light: 'default',
            dark: 'dark',
            default: 'default',
            mobile: 'mobile',
            tablet: 'tablet',
            desktop: 'desktop',
        };

        return modeMap[normalized] || normalized;
    }

    private rgbaToHex(color: RGB | RGBA): string {
        const toHex = (value: number) => {
            const hex = Math.round(value * 255).toString(16);
            return hex.length === 1 ? `0${hex}` : hex;
        };

        const hex = `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;

        // Add alpha if not fully opaque
        if ('a' in color && color.a !== undefined && color.a < 1) {
            return hex + toHex(color.a);
        }

        return hex;
    }

    private generateUUID(): string {
    // Generate a UUID v4
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    private async extractColorStyles(): Promise<void> {
        try {
            // Get all local paint styles
            const localStyles = await figma.getLocalPaintStylesAsync();
            this.reportProgress(`Found ${localStyles.length} local paint styles`);

            let localColorStyleCount = 0;
            for (const style of localStyles) {
                this.reportProgress(`Processing paint style: ${style.name}`);

                // Check if style has paints
                if (style.paints && style.paints.length > 0) {
                    const paint = style.paints[0];
                    if (paint.type === 'SOLID') {
                        // Create a variable-like object for the style
                        const wewebId = this.generateUUID();
                        const styleVariable: WeWebVariable = {
                            id: wewebId,
                            name: this.sanitizeVariableName(style.name),
                            type: 'color',
                            category: this.extractCategory(style.name),
                            values: {
                                default: this.rgbaToHex(paint.color),
                            },
                            figmaId: style.id,
                            description: style.description || `Color style: ${style.name}`,
                        };

                        this.variables.set(wewebId, styleVariable);
                        this.reportProgress(`Added color style as variable: ${style.name}`);
                        localColorStyleCount++;
                        this.colorFromLocalStyles++;
                    }
                }
            }
            this.reportProgress(`Found ${localColorStyleCount} local color styles`);

            // STEP 2: SCAN FOR REMOTE/LIBRARY STYLES
            // This is needed because Figma doesn't provide an API to list all library paint styles
            // We have to scan the entire document to find what styles are actually being used
            this.reportProgress('Scanning for remote color styles in use...');
            const usedStyleIds = new Set<string>();

            // Recursive function to scan every single node in the document
            const collectStyleIds = async (node: BaseNode) => {
                // Check if this node has a fill style applied
                // fillStyleId exists when a color style is applied to the fill
                if ('fillStyleId' in node && node.fillStyleId && typeof node.fillStyleId === 'string') {
                    usedStyleIds.add(node.fillStyleId);
                    // Example: A rectangle with "Brand/Primary Blue" fill style
                }

                // Check if this node has a stroke style applied
                // strokeStyleId exists when a color style is applied to the stroke/border
                if ('strokeStyleId' in node && node.strokeStyleId && typeof node.strokeStyleId === 'string') {
                    usedStyleIds.add(node.strokeStyleId);
                    // Example: A button with "Border/Default" stroke style
                }

                // IMPORTANT: We're NOT collecting:
                // - effectStyleId (shadow/blur styles)
                // - textStyleId (typography styles) - handled separately
                // - gridStyleId (layout grid styles)
                // - Direct color fills (non-styled colors like #FF0000)

                // Recursively scan all children nodes
                if ('children' in node && node.children) {
                    for (const child of node.children) {
                        await collectStyleIds(child);
                    }
                }
            };

            // Scan EVERY page in the document
            // figma.root.children contains all pages (Page1, Page2, etc.)
            for (const page of figma.root.children) {
                await collectStyleIds(page);
                // This will scan every frame, group, component, text, etc. on each page
            }

            this.reportProgress(`Found ${usedStyleIds.size} unique style IDs in use`);

            // Track error types
            let notFoundErrors = 0;
            let accessErrors = 0;
            let otherErrors = 0;
            let successCount = 0;
            let paintStylesChecked = 0;
            let localStylesFound = 0;
            let remoteStylesFound = 0;

            // Create a concurrency limiter
            const limit = pLimit(5); // Process up to 5 styles concurrently

            // Process remote styles concurrently
            const styleProcessingPromises = Array.from(usedStyleIds).map((styleId) =>
                limit(async () => {
                    try {
                        const style = await figma.getStyleByIdAsync(styleId);
                        if (style && style.type === 'PAINT' && !this.processedVariableIds.has(styleId)) {
                            paintStylesChecked++;

                            // Check if it's actually remote
                            if (!style.remote) {
                                localStylesFound++;
                                // Skip local styles - we already processed them
                                return;
                            }

                            remoteStylesFound++;

                            // Only log first few to avoid spam
                            if (remoteStylesFound <= 3) {
                                this.reportProgress(`Processing remote style: ${style.name} (key: ${style.key})`);
                            }
                            this.processedVariableIds.add(styleId);

                            try {
                                // Debug: Log the style details
                                if (paintStylesChecked <= 3) {
                                    this.reportProgress(`  Style details: id=${style.id}, name="${style.name}", key="${style.key}"`);
                                    this.reportProgress(`  Style type: ${style.type}, remote: ${style.remote}`);
                                }

                                // Get the style's paints
                                const paintStyle = await figma.importStyleByKeyAsync(style.key);
                                if (paintStyle && 'paints' in paintStyle && paintStyle.paints.length > 0) {
                                    const paint = paintStyle.paints[0];
                                    if (paint.type === 'SOLID') {
                                        const wewebId = this.generateUUID();
                                        const styleVariable: WeWebVariable = {
                                            id: wewebId,
                                            name: this.sanitizeVariableName(style.name),
                                            type: 'color',
                                            category: this.extractCategory(style.name),
                                            values: {
                                                default: this.rgbaToHex(paint.color),
                                            },
                                            figmaId: style.id,
                                            description: `Library color style: ${style.name}`,
                                        };

                                        this.variables.set(wewebId, styleVariable);
                                        if (successCount < 3) {
                                            this.reportProgress(`✅ Successfully imported library style: ${style.name}`);
                                        }
                                        this.colorFromRemoteStyles++;
                                        successCount++;
                                    }
                                }
                            } catch (importErr: any) {
                                // Handle 404 errors gracefully
                                if (importErr.message?.includes('404') || importErr.message?.includes('Not found')) {
                                    notFoundErrors++;
                                    if (notFoundErrors <= 3) {
                                        this.reportProgress(`⚠️ Style "${style.name}" not found (404) - key: ${style.key}`);
                                    }
                                } else if (importErr.message?.includes('access') || importErr.message?.includes('permission')) {
                                    accessErrors++;
                                    if (accessErrors <= 3) {
                                        this.reportProgress(`⚠️ No access to style "${style.name}": ${importErr.message}`);
                                    }
                                } else {
                                    otherErrors++;
                                    if (otherErrors <= 3) {
                                        this.reportProgress(`⚠️ Could not import style "${style.name}": ${importErr.message || importErr}`);
                                    }
                                }
                                this.styleImportErrors++;
                            }
                        }
                    } catch (err: any) {
                        this.reportProgress(`⚠️ Could not fetch style ${styleId}: ${err.message || err}`);
                        this.styleImportErrors++;
                    }
                }),
            );

            // Wait for all style processing to complete
            await Promise.all(styleProcessingPromises);

            this.reportProgress(`\nRemote style scan results:`);
            this.reportProgress(`  - Total style IDs found in scan: ${usedStyleIds.size}`);
            this.reportProgress(`  - Local styles in scan (skipped): ${localStylesFound}`);
            this.reportProgress(`  - Remote styles in scan: ${remoteStylesFound}`);
            this.reportProgress(`  - Successfully imported: ${successCount}`);
            this.reportProgress(`  - 404 Not Found errors: ${notFoundErrors}`);
            this.reportProgress(`  - Access/Permission errors: ${accessErrors}`);
            this.reportProgress(`  - Other errors: ${otherErrors}`);

            if (otherErrors > 100) {
                this.reportProgress(`\n⚠️ High number of import errors! Possible causes:`);
                this.reportProgress(`  - Plugin needs to be reloaded after adding permissions`);
                this.reportProgress(`  - Libraries require re-enabling in this file`);
                this.reportProgress(`  - Figma API key issue with importStyleByKeyAsync`);
            }

            this.reportProgress('Finished processing remote styles');
        } catch (error) {
            this.reportProgress(`⚠️ Error extracting color styles: ${error}`);
        }
    }

    private async resolveVariableAliases(): Promise<void> {
    // Multiple passes to resolve nested aliases
        let hasUnresolvedAliases = true;
        let passes = 0;
        const maxPasses = 10; // Prevent infinite loops

        while (hasUnresolvedAliases && passes < maxPasses) {
            hasUnresolvedAliases = false;
            passes++;

            for (const variable of this.variables.values()) {
                for (const [theme, value] of Object.entries(variable.values)) {
                    // Check if this value is an unresolved alias
                    if (value && typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS') {
                        hasUnresolvedAliases = true;

                        // Try to resolve the alias
                        const referencedVar = await this.getResolvedVariable(value.id);
                        if (referencedVar) {
                            // Replace the alias with the actual value
                            variable.values[theme] = referencedVar;
                            this.reportProgress(`Resolved alias for ${variable.name}[${theme}] to: ${referencedVar}`);
                        } else {
                            console.warn(`Could not resolve alias ${value.id} for ${variable.name}[${theme}]`);
                        }
                    }
                }
            }
        }

        if (hasUnresolvedAliases) {
            console.warn(`Still have unresolved aliases after ${maxPasses} passes`);
        }
    }

    private async getResolvedVariable(variableId: string): Promise<any> {
        try {
            // First check if we already have this variable
            const wewebId = this.figmaToWeWebIdMap.get(variableId);
            if (wewebId) {
                const wewebVar = this.variables.get(wewebId);
                if (wewebVar) {
                    // Return the first available value
                    const firstValue = Object.values(wewebVar.values)[0];
                    return firstValue;
                }
            }

            // If not found, try to fetch it
            const figmaVar = await figma.variables.getVariableByIdAsync(variableId);
            if (figmaVar) {
                // Get the first mode's value
                const firstModeValue = Object.values(figmaVar.valuesByMode)[0];

                // Convert based on type
                if (figmaVar.resolvedType === 'COLOR' && typeof firstModeValue === 'object' && 'r' in firstModeValue) {
                    return this.rgbaToHex(firstModeValue as RGBA);
                } else if (figmaVar.resolvedType === 'FLOAT' && typeof firstModeValue === 'number') {
                    const name = figmaVar.name.toLowerCase();
                    if (name.includes('spacing') || name.includes('padding') || name.includes('margin') || name.includes('width')) {
                        return `${firstModeValue}px`;
                    }
                    return firstModeValue;
                }

                return firstModeValue;
            }
        } catch (error) {
            this.reportProgress(`⚠️ Error resolving variable ${variableId}: ${error}`);
        }

        return null;
    }

    private async extractTextStyles(): Promise<void> {
        try {
            // Extract local text styles
            const localTextStyles = figma.getLocalTextStyles();
            this.reportProgress(`Found ${localTextStyles.length} local text styles`);

            let textStyleCount = 0;
            for (const style of localTextStyles) {
                this.reportProgress(`Processing text style: ${style.name}`);

                const wewebId = `text-style-${style.id}`;

                // Get the text style properties
                const fontSize = style.fontSize;
                const fontName = style.fontName;
                const letterSpacing = style.letterSpacing;
                const lineHeight = style.lineHeight;
                const textDecoration = style.textDecoration;

                const typographyValue = {
                    fontFamily: fontName.family,
                    fontWeight: this.mapFontWeight(fontName.style),
                    fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize,
                    lineHeight: this.formatLineHeight(lineHeight),
                    letterSpacing: this.formatLetterSpacing(letterSpacing),
                    textDecoration: textDecoration === 'NONE' ? undefined : textDecoration?.toLowerCase(),
                };

                const wewebVariable: WeWebVariable = {
                    id: wewebId,
                    name: this.sanitizeVariableName(style.name),
                    type: 'typography',
                    category: this.extractCategory(style.name),
                    values: {
                        default: typographyValue,
                    },
                    figmaId: style.id,
                    description: style.description || undefined,
                };

                this.variables.set(wewebId, wewebVariable);
                this.reportProgress(`Added text style as variable: ${style.name}`);
                textStyleCount++;
            }
            this.reportProgress(`Total text styles extracted: ${textStyleCount}`);

            this.reportProgress('Finished extracting text styles');
        } catch (error) {
            this.reportProgress(`⚠️ Error extracting text styles: ${error}`);
        }
    }

    private mapFontWeight(fontStyle: string): number {
        const styleMap: Record<string, number> = {
            Thin: 100,
            ExtraLight: 200,
            Light: 300,
            Regular: 400,
            Medium: 500,
            SemiBold: 600,
            Semibold: 600,
            Bold: 700,
            ExtraBold: 800,
            Black: 900,
        };

        // Check for exact matches first
        if (styleMap[fontStyle]) {
            return styleMap[fontStyle];
        }

        // Check if style contains weight keywords
        const lowerStyle = fontStyle.toLowerCase();
        for (const [key, value] of Object.entries(styleMap)) {
            if (lowerStyle.includes(key.toLowerCase())) {
                return value;
            }
        }

        // Default to regular
        return 400;
    }

    private formatLineHeight(lineHeight: LineHeight): string | undefined {
        if (lineHeight.unit === 'AUTO') {
            return 'normal';
        } else if (lineHeight.unit === 'PIXELS') {
            return `${lineHeight.value}px`;
        } else if (lineHeight.unit === 'PERCENT') {
            return `${lineHeight.value}%`;
        }
        return undefined;
    }

    private formatLetterSpacing(letterSpacing: LetterSpacing): string | undefined {
        if (letterSpacing.unit === 'PIXELS') {
            return `${letterSpacing.value}px`;
        } else if (letterSpacing.unit === 'PERCENT') {
            return `${letterSpacing.value / 100}em`;
        }
        return undefined;
    }
}

// Type definitions for Figma API
interface RGBA {
    r: number;
    g: number;
    b: number;
    a: number;
}

interface Mode {
    modeId: string;
    name: string;
}

interface VariableCollection {
    id: string;
    name: string;
    modes: Mode[];
    variableIds: string[];
}

interface Variable {
    id: string;
    name: string;
    description: string;
    resolvedType: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
    valuesByMode: Record<string, any>;
    variableCollectionId: string;
}

type LineHeight
    = | { readonly value: number; readonly unit: 'PIXELS' | 'PERCENT' }
        | { readonly unit: 'AUTO' };

interface LetterSpacing {
    readonly value: number;
    readonly unit: 'PIXELS' | 'PERCENT';
}
