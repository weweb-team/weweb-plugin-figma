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

    async extractAllVariables(): Promise<WeWebVariable[]> {
        try {
            console.log('Starting variable extraction...');

            // Step 1: Get all LOCAL variables directly (no scanning needed!)
            console.log('Getting all local variables...');
            const localVariables = await figma.variables.getLocalVariablesAsync();
            console.log(`Found ${localVariables.length} local variables`);

            // Process each local variable
            for (const variable of localVariables) {
                // Get the variable's collection to access modes
                const collection = await figma.variables.getVariableCollectionByIdAsync(variable.variableCollectionId);
                if (collection) {
                    const wewebVariable = this.convertVariable(variable, collection, collection.modes);
                    if (wewebVariable) {
                        this.variables.set(wewebVariable.id, wewebVariable);
                        this.figmaToWeWebIdMap.set(variable.id, wewebVariable.id);
                    }
                }
            }

            // Step 2: Get all LIBRARY variable collections
            console.log('Getting library variable collections...');
            try {
                const libraryCollections = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();
                console.log(`Found ${libraryCollections.length} library variable collections`);

                // Create a concurrency limiter for collections
                const collectionLimit = pLimit(3); // Process up to 3 collections concurrently

                // Process library collections concurrently
                const collectionPromises = libraryCollections.map((libCollection) =>
                    collectionLimit(async () => {
                        console.log(`Processing library collection: ${libCollection.name} from ${libCollection.libraryName}`);

                        try {
                            // Get variables in this library collection
                            const libraryVariables = await figma.teamLibrary.getVariablesInLibraryCollectionAsync(libCollection.key);
                            console.log(`Found ${libraryVariables.length} variables in collection ${libCollection.name}`);

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
                                                }
                                            }
                                        }
                                    } catch (varErr: any) {
                                        console.error(`Error importing variable ${libVariable.name}: ${varErr.message || varErr}`);
                                    }
                                }),
                            );

                            await Promise.all(variablePromises);
                        } catch (err: any) {
                            console.error(`Error processing library collection ${libCollection.name}: ${err.message || err}`);
                        }
                    }),
                );

                await Promise.all(collectionPromises);
                console.log('Finished processing library collections');
            } catch (err) {
                console.error('Error getting library collections:', err);
                console.log('This might be because no libraries are enabled for this file');
            }

            // Step 3: Extract color styles if no color variables found
            const hasColorVariables = Array.from(this.variables.values()).some((v) => v.type === 'color');
            if (!hasColorVariables) {
                console.log('No color variables found, extracting color styles...');
                await this.extractColorStyles();
            }

            // Step 4: Resolve variable aliases (variables that reference other variables)
            console.log('Resolving variable aliases...');
            await this.resolveVariableAliases();

            const result = Array.from(this.variables.values());
            console.log(`Extracted ${result.length} variables total`);
            return result;
        } catch (error) {
            console.error('Error extracting variables:', error);
            throw error;
        }
    }

    private async scanNodeForVariables(node: BaseNode): Promise<void> {
    // Check if this node has bound variables
        if ('boundVariables' in node && node.boundVariables) {
            const boundVars = node.boundVariables as Record<string, VariableAlias | VariableAlias[]>;

            // Log node with variables
            if (Object.keys(boundVars).length > 0) {
                console.log(`Found node with variables: ${node.name || node.type}`, boundVars);
            }

            for (const [property, binding] of Object.entries(boundVars)) {
                if (!binding)
                    continue;

                // Handle both single bindings and arrays
                const bindings = Array.isArray(binding) ? binding : [binding];

                for (const varBinding of bindings) {
                    if (varBinding && varBinding.type === 'VARIABLE_ALIAS' && varBinding.id) {
                        console.log(`Extracting variable from property "${property}" with ID: ${varBinding.id}`);
                        await this.extractVariableById(varBinding.id);
                    } else if (varBinding && typeof varBinding === 'object' && 'id' in varBinding) {
                        // Handle potential different format
                        console.log(`Extracting variable from property "${property}" with ID (alt format): ${varBinding.id}`);
                        await this.extractVariableById(varBinding.id as string);
                    }
                }
            }
        }

        // Check for fills that might have bound variables or use color styles
        if ('fills' in node && node.fills && node.fills !== figma.mixed) {
            for (const fill of node.fills) {
                if (fill.type === 'SOLID') {
                    // Check for bound variables in the fill
                    if ('boundVariables' in fill && fill.boundVariables?.color?.id) {
                        console.log(`Found color variable in fill: ${fill.boundVariables.color.id}`);
                        await this.extractVariableById(fill.boundVariables.color.id);
                    }

                    // Also check if the node uses fillStyleId (color styles)
                    if ('fillStyleId' in node && node.fillStyleId) {
                        console.log(`Found fill style ID: ${node.fillStyleId}`);
                        // Try to get the style and see if it has variables
                        try {
                            const style = await figma.getStyleByIdAsync(node.fillStyleId);
                            if (style && style.type === 'PAINT') {
                                console.log(`Found color style: ${style.name}`);
                                // Check if the style has bound variables
                                if ('boundVariables' in style && style.boundVariables) {
                                    console.log(`Style has bound variables:`, style.boundVariables);
                                }
                            }
                        } catch {
                            console.log(`Could not fetch style ${node.fillStyleId}`);
                        }
                    }
                }
            }
        }

        // Check for strokes that might have bound variables
        if ('strokes' in node && node.strokes) {
            for (const stroke of node.strokes) {
                if (stroke.type === 'SOLID') {
                    if ('boundVariables' in stroke && stroke.boundVariables?.color?.id) {
                        console.log(`Found color variable in stroke: ${stroke.boundVariables.color.id}`);
                        await this.extractVariableById(stroke.boundVariables.color.id);
                    }
                }
            }
        }

        // Also check for strokeStyleId
        if ('strokeStyleId' in node && node.strokeStyleId) {
            console.log(`Found stroke style ID: ${node.strokeStyleId}`);
        }

        // Recursively scan children
        if ('children' in node && node.children) {
            for (const child of node.children) {
                await this.scanNodeForVariables(child);
            }
        }
    }

    private async extractVariableById(variableId: string): Promise<void> {
    // Skip if already processed
        if (this.processedVariableIds.has(variableId)) {
            return;
        }

        this.processedVariableIds.add(variableId);

        try {
            const variable = await figma.variables.getVariableByIdAsync(variableId);
            if (!variable) {
                console.warn(`Could not find variable with ID: ${variableId}`);
                return;
            }

            console.log(`Found library variable: ${variable.name}`);

            // Get the variable's collection to access modes
            const collection = await figma.variables.getVariableCollectionByIdAsync(variable.variableCollectionId);
            if (!collection) {
                console.warn(`Could not find collection for variable: ${variable.name}`);
                return;
            }

            const wewebVariable = this.convertVariable(variable, collection, collection.modes);
            if (wewebVariable) {
                this.variables.set(wewebVariable.id, wewebVariable);
                this.figmaToWeWebIdMap.set(variable.id, wewebVariable.id);
            }
        } catch (error) {
            console.error(`Error extracting variable ${variableId}:`, error);
        }
    }

    private async extractCollectionVariables(collection: VariableCollection): Promise<WeWebVariable[]> {
        const variables: WeWebVariable[] = [];
        const modes = collection.modes;

        console.log(`Collection has ${collection.variableIds.length} variables and ${modes.length} modes`);

        // Get all variables in this collection
        for (const variableId of collection.variableIds) {
            try {
                const figmaVariable = await figma.variables.getVariableByIdAsync(variableId);
                if (!figmaVariable) {
                    console.warn(`Could not find variable with ID: ${variableId}`);
                    continue;
                }

                const wewebVariable = this.convertVariable(figmaVariable, collection, modes);
                if (wewebVariable) {
                    variables.push(wewebVariable);
                    this.figmaToWeWebIdMap.set(figmaVariable.id, wewebVariable.id);
                }
            } catch (error) {
                console.error(`Error processing variable ${variableId}:`, error);
            }
        }

        return variables;
    }

    private convertVariable(
        variable: Variable,
        collection: VariableCollection,
        modes: Mode[],
    ): WeWebVariable | null {
        const wewebId = this.generateUUID();
        const values: Record<string, any> = {};

        console.log(`Converting variable: ${variable.name} (${variable.resolvedType})`);

        // Extract values for each mode
        for (const mode of modes) {
            const value = variable.valuesByMode[mode.modeId];
            const themeName = this.normalizeModeName(mode.name);

            // Check if value is a variable alias (reference to another variable)
            if (value && typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS') {
                console.log(`Variable ${variable.name} references another variable: ${value.id}`);
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

    private rgbaToHex(rgba: RGBA): string {
        const toHex = (value: number) => {
            const hex = Math.round(value * 255).toString(16);
            return hex.length === 1 ? `0${hex}` : hex;
        };

        const hex = `#${toHex(rgba.r)}${toHex(rgba.g)}${toHex(rgba.b)}`;

        // Add alpha if not fully opaque
        if (rgba.a !== undefined && rgba.a < 1) {
            return hex + toHex(rgba.a);
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
            console.log(`Found ${localStyles.length} local paint styles`);

            for (const style of localStyles) {
                console.log(`Processing paint style: ${style.name}`);

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
                        console.log(`Added color style as variable: ${style.name}`);
                    }
                }
            }

            // Also scan for remote styles being used
            console.log('Scanning for remote color styles in use...');
            const usedStyleIds = new Set<string>();

            // Function to collect style IDs from a node
            const collectStyleIds = async (node: BaseNode) => {
                if ('fillStyleId' in node && node.fillStyleId && typeof node.fillStyleId === 'string') {
                    usedStyleIds.add(node.fillStyleId);
                }
                if ('strokeStyleId' in node && node.strokeStyleId && typeof node.strokeStyleId === 'string') {
                    usedStyleIds.add(node.strokeStyleId);
                }
                if ('children' in node && node.children) {
                    for (const child of node.children) {
                        await collectStyleIds(child);
                    }
                }
            };

            // Collect all used style IDs
            for (const page of figma.root.children) {
                await collectStyleIds(page);
            }

            console.log(`Found ${usedStyleIds.size} unique style IDs in use`);

            // Create a concurrency limiter
            const limit = pLimit(5); // Process up to 5 styles concurrently

            // Process remote styles concurrently
            const styleProcessingPromises = Array.from(usedStyleIds).map((styleId) =>
                limit(async () => {
                    try {
                        const style = await figma.getStyleByIdAsync(styleId);
                        if (style && style.type === 'PAINT' && !this.processedVariableIds.has(styleId)) {
                            console.log(`Processing remote style: ${style.name}`);
                            this.processedVariableIds.add(styleId);

                            try {
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
                                        console.log(`Added library color style as variable: ${style.name}`);
                                    }
                                }
                            } catch (importErr: any) {
                                // Handle 404 errors gracefully
                                if (importErr.message?.includes('404') || importErr.message?.includes('Not found')) {
                                    console.log(`Style ${style.name} not accessible (404) - likely unpublished or requires Professional Team`);
                                } else {
                                    console.log(`Could not import style ${style.name}: ${importErr.message || importErr}`);
                                }
                            }
                        }
                    } catch (err: any) {
                        console.log(`Could not fetch style ${styleId}: ${err.message || err}`);
                    }
                }),
            );

            // Wait for all style processing to complete
            await Promise.all(styleProcessingPromises);
            console.log('Finished processing remote styles');
        } catch (error) {
            console.error('Error extracting color styles:', error);
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
                            console.log(`Resolved alias for ${variable.name}[${theme}] to: ${referencedVar}`);
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
            console.error(`Error resolving variable ${variableId}:`, error);
        }

        return null;
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

interface VariableAlias {
    type: 'VARIABLE_ALIAS';
    id: string;
}
