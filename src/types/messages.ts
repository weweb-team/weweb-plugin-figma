// Type definitions for plugin messages

export interface WeWebVariable {
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

export interface FontInfo {
    type: 'google' | 'system' | 'custom';
    url?: string;
    family: string;
    weights: number[];
}

export interface ExtractionResult {
    variables: WeWebVariable[];
    fonts: FontInfo[];
}

export interface VariablesExtractedMessage {
    type: 'VARIABLES_EXTRACTED';
    variables: WeWebVariable[] | null;
    fonts?: FontInfo[];
    error?: string;
}

export interface ExtractionProgressMessage {
    type: 'EXTRACTION_PROGRESS';
    message: string;
}

export interface SelectionChangedMessage {
    type: 'SELECTION_CHANGED';
    hasSelection: boolean;
    selectedNode: {
        id: string;
        name: string;
        type: string;
    } | null;
}

export interface RawNodeCopiedMessage {
    type: 'RAW_NODE_COPIED';
    rawNode: any;
    error?: string;
}

export type PluginMessage
    = | VariablesExtractedMessage
        | ExtractionProgressMessage
        | SelectionChangedMessage
        | RawNodeCopiedMessage;
