import type { ConversionResult } from '../types/conversion';
import { extractColorWithVariable } from './utils/color-utils';

export class ConversionWorkflow {
    private collectedVariables: Record<string, any> = {};
    private collectedFonts: Map<string, any> = new Map();

    async convertSelection(
        _variables: Record<string, any> = {},
        _fonts: any[] = [],
        onProgress?: (message: string) => void,
    ): Promise<ConversionResult> {
        // Reset collections
        this.collectedVariables = {};
        this.collectedFonts.clear();

        onProgress?.('Starting conversion...');

        // Get current selection
        const selection = figma.currentPage.selection;
        if (selection.length === 0) {
            throw new Error('No selection found');
        }

        const node = selection[0];
        onProgress?.(`Converting ${node.type} node: ${node.name}`);

        // Use visitor pattern for conversion
        const component = this.visitNode(node, onProgress);

        onProgress?.('Conversion complete!');

        // Convert collected fonts to array format
        const collectedFontsArray = Array.from(this.collectedFonts.values());

        const result: ConversionResult = {
            component,
            usedVariables: this.collectedVariables,
            fonts: collectedFontsArray,
            assets: {},
            context: {
                variables: this.collectedVariables,
                fonts: collectedFontsArray,
                assets: {},
                selectedNodeIds: new Set([node.id]),
                usedVariableIds: new Set(Object.keys(this.collectedVariables)),
                breakpoints: [
                    { name: 'default' as const },
                ],
            },
        };

        return result;
    }

    // Visitor pattern method that handles traversal
    private visitNode(node: any, onProgress?: (message: string) => void, parent?: any): any {
        const component = this.createBaseComponent(node);

        // For nodes that have a parent property, use it as the parent context
        const effectiveParent = parent || node.parent;

        // Apply all conversion rules with parent context
        this.applyStyles(component, node, effectiveParent);
        this.applyProps(component, node);

        // Recursive traversal - pass current node as parent
        if ('children' in node && node.children && node.children.length > 0) {
            onProgress?.(`Converting ${node.children.length} children of ${node.name}...`);
            component.slots = {
                children: node.children.map((child: any) => this.visitNode(child, onProgress, node)),
            };
        } else if (this.isContainer(node)) {
            // Empty containers still get slots
            component.slots = { children: [] };
        }

        return component;
    }

    // Creates the base structure for any node
    private createBaseComponent(node: any): any {
        return {
            tag: this.getTag(node),
            ...(node.name && { name: node.name }),
            attrs: this.generateAttrs(node),
            props: { default: {} },
            styles: { default: {} },
        };
    }

    // Determines the appropriate tag for a node
    private getTag(node: any): 'ww-div' | 'ww-text' | 'ww-img' {
        if (node.type === 'TEXT')
            return 'ww-text';
        // TODO: Add image detection logic
        return 'ww-div';
    }

    // Generates data attributes
    private generateAttrs(node: any): Record<string, any> {
        return {
            'data-figma-id': node.id,
            'data-figma-name': node.name,
            'data-figma-type': node.type,
        };
    }

    // Checks if a node is a container type
    private isContainer(node: any): boolean {
        return ['FRAME', 'COMPONENT', 'INSTANCE', 'GROUP'].includes(node.type);
    }

    // Applies all style rules to a component
    private applyStyles(component: any, node: any, parent?: any): void {
        Object.assign(component.styles.default, {
            ...this.extractSizeStyles(node, parent),
            ...this.extractPaddingStyles(node),
            ...this.extractLayoutStyles(node, parent),
            ...this.extractBackgroundStyles(node),
            ...this.extractBorderStyles(node),
            ...this.extractBoxShadowStyles(node),
            ...this.extractMarginStyles(node, parent),
            ...this.extractTextStyles(node),
        });

        // Apply responsive styles if needed
        const responsiveStyles = this.extractResponsiveStyles(node);
        if (responsiveStyles.tablet && Object.keys(responsiveStyles.tablet).length > 0) {
            component.styles.tablet = responsiveStyles.tablet;
        }
    }

    // Applies all prop rules to a component
    private applyProps(component: any, node: any): void {
        if (node.type === 'TEXT') {
            const textNode = node as TextNode;
            component.props.default.text = textNode.characters || '';

            // Track fonts
            if (textNode.fontName && typeof textNode.fontName === 'object') {
                this.trackFont(textNode.fontName.family, textNode.fontName.style);
            }
        }
    }

    // Extracts size styles
    private extractSizeStyles(node: any, parent?: any): Record<string, any> {
        const styles: Record<string, any> = {};

        // Handle width - check for FILL layout sizing
        if ('layoutSizingHorizontal' in node && node.layoutSizingHorizontal === 'FILL') {
            styles.width = '100%';
        } else if ('width' in node) {
            // Rule 3: If node width equals parent width, use 100%
            // Also use 100% if width is >= 95% of parent width
            if (parent && 'width' in parent) {
                const widthRatio = node.width / parent.width;
                if (widthRatio === 1 || widthRatio >= 0.95) {
                    styles.width = '100%';
                } else {
                    styles.width = `${node.width}px`;
                }
            } else {
                styles.width = `${node.width}px`;
            }
        }

        // Handle maxWidth
        if ('maxWidth' in node && node.maxWidth > 0) {
            styles.maxWidth = `${node.maxWidth}px`;
        }

        // Handle minWidth
        if ('minWidth' in node && node.minWidth > 0) {
            styles.minWidth = `${node.minWidth}px`;
        }

        // Handle height - check for HUG layout sizing
        if ('layoutSizingVertical' in node && node.layoutSizingVertical === 'HUG') {
            // HUG means height adjusts to content, so we don't set a fixed height
            // Let the content determine the height
        } else if ('height' in node) {
            styles.height = `${node.height}px`;
        }

        return styles;
    }

    // Extracts padding styles
    private extractPaddingStyles(node: any): Record<string, any> {
        const styles: Record<string, any> = {};

        if ('paddingTop' in node && node.paddingTop > 0) {
            styles.paddingTop = `${node.paddingTop}px`;
        }
        if ('paddingRight' in node && node.paddingRight > 0) {
            styles.paddingRight = `${node.paddingRight}px`;
        }
        if ('paddingBottom' in node && node.paddingBottom > 0) {
            styles.paddingBottom = `${node.paddingBottom}px`;
        }
        if ('paddingLeft' in node && node.paddingLeft > 0) {
            styles.paddingLeft = `${node.paddingLeft}px`;
        }

        return styles;
    }

    // Extracts background styles
    private extractBackgroundStyles(node: any): Record<string, any> {
        const styles: Record<string, any> = {};

        if (node.type !== 'TEXT' && 'fills' in node && node.fills && Array.isArray(node.fills) && node.fills.length > 0) {
            const fill = node.fills[0];
            if (fill.type === 'SOLID' && fill.visible !== false) {
                // Use the variable-aware color extraction
                const color = this.extractColorWithVariable(fill);
                styles.background = color;
            }
        }

        return styles;
    }

    // Extracts text-specific styles
    private extractTextStyles(node: any): Record<string, any> {
        const styles: Record<string, any> = {};

        if (node.type === 'TEXT') {
            const textNode = node as TextNode;

            if (typeof textNode.fontSize === 'number') {
                styles.fontSize = `${textNode.fontSize}px`;
            }

            if (textNode.fontName && typeof textNode.fontName === 'object') {
                styles.fontFamily = `"${textNode.fontName.family}"`;
            }

            styles.color = this.extractTextColor(textNode);
        }

        return styles;
    }

    // Extracts border styles from strokes
    private extractBorderStyles(node: any): Record<string, any> {
        const styles: Record<string, any> = {};

        if ('strokes' in node && node.strokes && Array.isArray(node.strokes) && node.strokes.length > 0) {
            const stroke = node.strokes[0]; // Use first stroke
            if (stroke.type === 'SOLID' && stroke.visible !== false) {
                const strokeWeight = node.strokeWeight || 1;
                const color = this.extractColorWithVariable(stroke);
                styles.border = `${strokeWeight}px solid ${color}`;
            }
        }

        // Handle border radius
        if ('cornerRadius' in node && node.cornerRadius > 0) {
            styles.borderRadius = `${node.cornerRadius}px`;
        }

        return styles;
    }

    // Extracts box shadow from effects
    private extractBoxShadowStyles(node: any): Record<string, any> {
        const styles: Record<string, any> = {};

        if ('effects' in node && node.effects && Array.isArray(node.effects)) {
            const shadows = node.effects
                .filter((effect: any) => effect.type === 'DROP_SHADOW' && effect.visible !== false)
                .map((shadow: any) => {
                    const x = shadow.offset?.x || 0;
                    const y = shadow.offset?.y || 0;
                    const blur = shadow.radius || 0;
                    const spread = shadow.spread || 0;
                    const color = this.extractColorWithVariable(shadow);

                    return `${x}px ${y}px ${blur}px ${spread}px ${color}`;
                });

            if (shadows.length > 0) {
                styles.boxShadow = shadows.join(', ');
            }
        }

        return styles;
    }

    // Extracts margin styles including auto margins
    private extractMarginStyles(node: any, parent?: any): Record<string, any> {
        const styles: Record<string, any> = {};

        // Check for auto margins based on positioning and layout mode
        if (parent && 'layoutMode' in parent) {
            // For nodes in auto-layout parents, check if they need centering
            if (parent.layoutMode === 'HORIZONTAL' && node.layoutAlign === 'CENTER') {
                // Vertical centering in horizontal layout
                styles.marginTop = 'auto';
                styles.marginBottom = 'auto';
            } else if (parent.layoutMode === 'VERTICAL' && node.layoutAlign === 'CENTER') {
                // Horizontal centering in vertical layout
                styles.marginLeft = 'auto';
                styles.marginRight = 'auto';
            } else if (parent.layoutMode === 'HORIZONTAL' && 'x' in node && 'width' in node && 'width' in parent) {
                // Check if the node is horizontally centered by position
                const parentCenter = parent.width / 2;
                const nodeCenter = node.x + (node.width / 2);
                const threshold = 5; // Allow small differences

                if (Math.abs(parentCenter - nodeCenter) < threshold) {
                    styles.marginLeft = 'auto';
                    styles.marginRight = 'auto';
                }
            }

            // Special case for nodes that should always have auto margins
            if (node.layoutPositioning === 'AUTO' && parent.layoutMode === 'HORIZONTAL') {
                styles.marginTop = 'auto';
                styles.marginBottom = 'auto';
            }
        }

        return styles;
    }

    // Helper to extract color with variable support
    private extractColorWithVariable(paintOrEffect: any): string {
        return extractColorWithVariable(
            paintOrEffect,
            (id) => figma.variables.getVariableById(id),
            (variableId, variable) => {
                // Track the variable
                this.collectedVariables[variableId] = {
                    id: variableId,
                    name: variable.name,
                    type: 'color',
                    value: variable.valuesByMode?.default || paintOrEffect.color,
                };
            },
        );
    }

    private extractLayoutStyles(node: any, _parent?: any): Record<string, any> {
        const styles: Record<string, any> = {};

        // All containers get flex by default
        if (['FRAME', 'COMPONENT', 'INSTANCE'].includes(node.type)) {
            styles.display = 'flex';
            styles.flexDirection = 'column';
            styles.alignItems = 'stretch';
        }

        // Override if there's actual auto-layout
        if ('layoutMode' in node && node.layoutMode !== 'NONE') {
            styles.flexDirection = node.layoutMode === 'HORIZONTAL' ? 'row' : 'column';

            // Handle primary axis alignment (justifyContent in CSS)
            if ('primaryAxisAlignItems' in node) {
                switch (node.primaryAxisAlignItems) {
                    case 'MIN':
                        styles.justifyContent = 'flex-start';
                        break;
                    case 'CENTER':
                        styles.justifyContent = 'center';
                        break;
                    case 'MAX':
                        styles.justifyContent = 'flex-end';
                        break;
                    case 'SPACE_BETWEEN':
                        styles.justifyContent = 'space-between';
                        break;
                }
            }

            // Handle counter axis alignment (alignItems in CSS)
            if ('counterAxisAlignItems' in node) {
                switch (node.counterAxisAlignItems) {
                    case 'MIN':
                        styles.alignItems = 'flex-start';
                        break;
                    case 'CENTER':
                        styles.alignItems = 'center';
                        break;
                    case 'MAX':
                        styles.alignItems = 'flex-end';
                        break;
                    case 'STRETCH':
                        styles.alignItems = 'stretch';
                        break;
                }
            }

            // Handle flex wrap
            if ('layoutWrap' in node && node.layoutWrap === 'WRAP') {
                styles.flexWrap = 'wrap';
            }

            // Handle gap - check for wrapped layouts with different spacing
            if ('layoutWrap' in node && node.layoutWrap === 'WRAP') {
                // For wrapped layouts, use primaryAxisSpacing and counterAxisSpacing
                const primarySpacing = node.primaryAxisSpacing || node.itemSpacing || 0;
                const counterSpacing = node.counterAxisSpacing || 0;
                if (primarySpacing > 0 || counterSpacing > 0) {
                    styles.gap = `${primarySpacing}px ${counterSpacing}px`;
                }
            } else if ('itemSpacing' in node && node.itemSpacing > 0) {
                styles.gap = `${node.itemSpacing}px`;
            }
        }

        // Handle flex grow/shrink/basis
        if ('layoutGrow' in node && node.layoutGrow === 1) {
            styles.flex = '1';
            styles.flexShrink = '1';
            styles.flexBasis = '0%';
        }

        // Handle layout align (alignSelf)
        if ('layoutAlign' in node) {
            switch (node.layoutAlign) {
                case 'MIN':
                    styles.alignSelf = 'flex-start';
                    break;
                case 'CENTER':
                    styles.alignSelf = 'center';
                    break;
                case 'MAX':
                    styles.alignSelf = 'flex-end';
                    break;
                case 'STRETCH':
                    styles.alignSelf = 'stretch';
                    break;
            }
        }

        return styles;
    }

    private trackFont(family: string, style: string): void {
        if (!this.collectedFonts.has(family)) {
            // Simple font tracking - determine if it's a Google Font
            const googleFonts = new Set([
                'Roboto',
                'Open Sans',
                'Inter',
                'Poppins',
                'Montserrat',
                'Lato',
                'Raleway',
                'Nunito',
                'Work Sans',
                'Playfair Display',
            ]);

            const fontInfo: any = {
                type: googleFonts.has(family) ? 'google' as const : 'system' as const,
                family,
                weights: [this.mapFontWeight(style)],
            };

            if (fontInfo.type === 'google') {
                fontInfo.url = `https://fonts.googleapis.com/css2?family=${family.replace(/\s+/g, '+')}:wght@${fontInfo.weights.join(',')}&display=swap`;
            }

            this.collectedFonts.set(family, fontInfo);
        } else {
            // Add weight if not already present
            const fontInfo = this.collectedFonts.get(family);
            const weight = this.mapFontWeight(style);
            if (!fontInfo.weights.includes(weight)) {
                fontInfo.weights.push(weight);
                fontInfo.weights.sort((a: number, b: number) => a - b);

                // Update Google Fonts URL with new weights
                if (fontInfo.type === 'google') {
                    fontInfo.url = `https://fonts.googleapis.com/css2?family=${family.replace(/\s+/g, '+')}:wght@${fontInfo.weights.join(',')}&display=swap`;
                }
            }
        }
    }

    private mapFontWeight(style: string): number {
        const weightMap: Record<string, number> = {
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

        // Check for exact match
        if (weightMap[style]) {
            return weightMap[style];
        }

        // Check if style contains weight keywords
        for (const [key, value] of Object.entries(weightMap)) {
            if (style.toLowerCase().includes(key.toLowerCase())) {
                return value;
            }
        }

        return 400; // Default to regular
    }

    // Extracts responsive styles (tablet, mobile breakpoints)
    private extractResponsiveStyles(node: any): Record<string, any> {
        const responsive: Record<string, any> = {};

        // Initialize tablet styles
        const tabletStyles: Record<string, any> = {};

        // Add responsive maxWidth for large containers
        if (this.shouldAddResponsiveMaxWidth(node)) {
            tabletStyles.maxWidth = '100%';
        }

        // Add responsive padding reduction
        const paddingSides = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'];
        for (const side of paddingSides) {
            if (side in node && node[side] > 0) {
                const responsivePadding = this.getResponsivePadding(node[side]);
                if (responsivePadding !== null) {
                    tabletStyles[side] = responsivePadding;
                }
            }
        }

        // Only add tablet styles if there are any
        if (Object.keys(tabletStyles).length > 0) {
            responsive.tablet = tabletStyles;
        }

        return responsive;
    }

    // Determines if a node should have responsive max-width
    private shouldAddResponsiveMaxWidth(node: any): boolean {
        // Add responsive maxWidth for large fixed-width containers
        if ('width' in node && node.width > 768) {
            return true;
        }

        // Add responsive maxWidth when container has explicit maxWidth
        if ('maxWidth' in node && node.maxWidth > 0) {
            return true;
        }

        // Add responsive maxWidth for containers that use FILL width
        // This ensures they don't overflow on smaller screens
        if ('layoutSizingHorizontal' in node && node.layoutSizingHorizontal === 'FILL') {
            return true;
        }

        return false;
    }

    // Gets responsive padding value using step-based reduction
    private getResponsivePadding(defaultPadding: number): string | null {
        let tabletPadding: string;

        if (defaultPadding >= 40) {
            tabletPadding = '24px';
        } else if (defaultPadding >= 32) {
            tabletPadding = '20px';
        } else if (defaultPadding >= 24) {
            tabletPadding = '16px';
        } else if (defaultPadding >= 16) {
            tabletPadding = '12px';
        } else {
            // Less than 16px - no change needed
            return null;
        }

        // Only return if it's different from default
        if (tabletPadding === `${defaultPadding}px`) {
            return null;
        }

        return tabletPadding;
    }

    private extractTextColor(node: TextNode): string {
        if (node.fills && Array.isArray(node.fills) && node.fills.length > 0) {
            const fill = node.fills[0];
            if (fill.type === 'SOLID') {
                return this.extractColorWithVariable(fill);
            }
        }
        return 'inherit';
    }
}
