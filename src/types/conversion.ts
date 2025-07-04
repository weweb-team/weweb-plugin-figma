// Types for the export conversion functionality

export interface ConversionSettings {
    responsive: boolean;
    optimizeAssets: boolean;
    trackPerformance: boolean;
}

export interface ConversionResult {
    component: WeWebComponent;
    usedVariables: Record<string, any>;
    fonts: FontInfo[];
    assets: Record<string, string>;
    context?: {
        variables: Record<string, any>;
        fonts: FontInfo[];
        assets: Record<string, string>;
        selectedNodeIds: Set<string>;
        usedVariableIds: Set<string>;
        breakpoints: Array<{ name: 'default' | 'tablet' | 'mobile' }>;
    };
    performance?: PerformanceMetrics;
}

export interface WeWebComponent {
    tag: 'ww-div' | 'ww-text' | 'ww-img';
    name?: string;
    props?: Record<string, Record<string, any>>;
    attrs?: Record<string, any>;
    styles?: Record<string, Record<string, any>>;
    slots?: Record<string, WeWebComponent | WeWebComponent[]>;
}

export interface FontInfo {
    type: 'google' | 'system' | 'custom';
    url?: string;
    family: string;
    weights: number[];
}

export interface PerformanceMetrics {
    totalTime: number;
    nodeCount: number;
    variableResolutions: number;
    imageExtractions: number;
    cacheHitRate: number;
}
