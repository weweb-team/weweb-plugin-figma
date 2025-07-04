// Advanced layout detection and conversion utilities inspired by FigmaToCode

export interface LayoutInfo {
    isAutoLayout: boolean;
    flexDirection: 'row' | 'column';
    justifyContent: string;
    alignItems: string;
    gap: number;
    wrap: boolean;
    alignment: {
        horizontal: string;
        vertical: string;
    };
}

export interface PositionInfo {
    isAbsolute: boolean;
    x: number;
    y: number;
    relativeTo: 'parent' | 'viewport';
    constraints: {
        horizontal: string;
        vertical: string;
    };
}

export class LayoutUtils {
    /**
     * Analyze node layout properties and return comprehensive layout info
     */
    static analyzeLayout(node: SceneNode): LayoutInfo {
        const layoutInfo: LayoutInfo = {
            isAutoLayout: false,
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            gap: 0,
            wrap: false,
            alignment: {
                horizontal: 'left',
                vertical: 'top',
            },
        };

        // Check for Auto Layout
        if ('layoutMode' in node && node.layoutMode !== 'NONE') {
            layoutInfo.isAutoLayout = true;
            layoutInfo.flexDirection = node.layoutMode === 'HORIZONTAL' ? 'row' : 'column';

            // Primary axis alignment (justify-content)
            if ('primaryAxisAlignItems' in node) {
                layoutInfo.justifyContent = this.convertPrimaryAxisAlignment(node.primaryAxisAlignItems);
            }

            // Counter axis alignment (align-items)
            if ('counterAxisAlignItems' in node) {
                layoutInfo.alignItems = this.convertCounterAxisAlignment(node.counterAxisAlignItems);
            }

            // Gap
            if ('itemSpacing' in node && typeof node.itemSpacing === 'number') {
                layoutInfo.gap = node.itemSpacing;
            }

            // Wrap
            if ('layoutWrap' in node) {
                layoutInfo.wrap = node.layoutWrap === 'WRAP';
            }
        }

        return layoutInfo;
    }

    /**
     * Analyze node positioning relative to its parent
     */
    static analyzePosition(node: SceneNode): PositionInfo {
        const positionInfo: PositionInfo = {
            isAbsolute: false,
            x: 0,
            y: 0,
            relativeTo: 'parent',
            constraints: {
                horizontal: 'left',
                vertical: 'top',
            },
        };

        if ('x' in node && 'y' in node) {
            positionInfo.x = node.x;
            positionInfo.y = node.y;

            // Determine if positioning is absolute
            positionInfo.isAbsolute = this.isAbsolutePosition(node);

            // Analyze constraints
            if ('constraints' in node && node.constraints) {
                positionInfo.constraints.horizontal = node.constraints.horizontal;
                positionInfo.constraints.vertical = node.constraints.vertical;
            }

            // Calculate relative position
            if (node.parent) {
                const parentPos = this.getParentPosition(node.parent);
                positionInfo.x = node.x - parentPos.x;
                positionInfo.y = node.y - parentPos.y;
            }
        }

        return positionInfo;
    }

    /**
     * Convert Figma primary axis alignment to CSS justify-content
     */
    private static convertPrimaryAxisAlignment(alignment: string): string {
        const alignmentMap: Record<string, string> = {
            MIN: 'flex-start',
            CENTER: 'center',
            MAX: 'flex-end',
            SPACE_BETWEEN: 'space-between',
            SPACE_AROUND: 'space-around',
            SPACE_EVENLY: 'space-evenly',
        };
        return alignmentMap[alignment] || 'flex-start';
    }

    /**
     * Convert Figma counter axis alignment to CSS align-items
     */
    private static convertCounterAxisAlignment(alignment: string): string {
        const alignmentMap: Record<string, string> = {
            MIN: 'flex-start',
            CENTER: 'center',
            MAX: 'flex-end',
            BASELINE: 'baseline',
            STRETCH: 'stretch',
        };
        return alignmentMap[alignment] || 'flex-start';
    }

    /**
     * Determine if a node should use absolute positioning
     */
    static isAbsolutePosition(node: SceneNode): boolean {
        // If parent has auto layout, children are positioned by flexbox
        if (node.parent && 'layoutMode' in node.parent && node.parent.layoutMode !== 'NONE') {
            return false;
        }

        // If parent is a group, use relative positioning within the group
        if (node.parent && node.parent.type === 'GROUP') {
            return false;
        }

        // Default to absolute positioning for free-form layouts
        return true;
    }

    /**
     * Get effective position of a parent node
     */
    private static getParentPosition(parent: BaseNode): { x: number; y: number } {
        if ('x' in parent && 'y' in parent) {
            return { x: parent.x, y: parent.y };
        }
        return { x: 0, y: 0 };
    }

    /**
     * Generate responsive layout styles
     */
    static generateResponsiveLayout(
        node: SceneNode,
        breakpoint: 'tablet' | 'mobile',
    ): Record<string, any> {
        const styles: Record<string, any> = {};
        const layoutInfo = this.analyzeLayout(node);

        if (layoutInfo.isAutoLayout) {
            // Adjust flex direction for mobile
            if (breakpoint === 'mobile' && layoutInfo.flexDirection === 'row') {
                // Stack horizontally laid out items vertically on mobile
                if ('children' in node && node.children && node.children.length > 2) {
                    styles.flexDirection = 'column';
                    styles.alignItems = 'stretch';
                }
            }

            // Adjust gap for smaller screens
            if (layoutInfo.gap > 16) {
                styles.gap = breakpoint === 'mobile' ? '8px' : '12px';
            }
        }

        // Adjust absolute positioning for smaller screens
        const positionInfo = this.analyzePosition(node);
        if (positionInfo.isAbsolute && breakpoint === 'mobile') {
            // Convert to relative positioning on mobile for better flow
            if (positionInfo.x > 100 || positionInfo.y > 100) {
                styles.position = 'relative';
                styles.left = 'auto';
                styles.top = 'auto';
                styles.marginBottom = '16px';
            }
        }

        return styles;
    }

    /**
     * Detect common layout patterns
     */
    static detectLayoutPattern(node: SceneNode): {
        pattern: 'stack' | 'grid' | 'sidebar' | 'header' | 'card' | 'button' | 'free-form';
        confidence: number;
        recommendations: string[];
    } {
        const name = node.name.toLowerCase();
        const layoutInfo = this.analyzeLayout(node);

        // Pattern detection based on name and structure
        if (name.includes('stack') || (layoutInfo.isAutoLayout && layoutInfo.gap > 0)) {
            return {
                pattern: 'stack',
                confidence: 0.9,
                recommendations: ['Use flex layout', 'Consider responsive gap scaling'],
            };
        }

        if (name.includes('grid') || this.looksLikeGrid(node)) {
            return {
                pattern: 'grid',
                confidence: 0.8,
                recommendations: ['Use CSS Grid', 'Add responsive column adjustments'],
            };
        }

        if (name.includes('button') || name.includes('btn') || this.looksLikeButton(node)) {
            return {
                pattern: 'button',
                confidence: 0.9,
                recommendations: [
                    'Add hover states',
                    'Include focus styles',
                    'Consider touch targets for mobile',
                ],
            };
        }

        if (name.includes('card') || this.looksLikeCard(node)) {
            return {
                pattern: 'card',
                confidence: 0.8,
                recommendations: [
                    'Add shadow for depth',
                    'Consider hover animations',
                    'Ensure proper spacing',
                ],
            };
        }

        if (name.includes('header') || name.includes('nav')) {
            return {
                pattern: 'header',
                confidence: 0.9,
                recommendations: [
                    'Make responsive navigation',
                    'Add mobile menu toggle',
                    'Consider sticky positioning',
                ],
            };
        }

        return {
            pattern: 'free-form',
            confidence: 0.5,
            recommendations: ['Consider using layout patterns for better maintainability'],
        };
    }

    /**
     * Generate CSS Grid properties for grid-like layouts
     */
    static generateGridLayout(node: SceneNode): Record<string, any> | null {
        if (!('children' in node) || !node.children)
            return null;

        const children = Array.from(node.children);
        if (children.length < 4)
            return null; // Need at least 4 items for grid detection

        // Analyze child positions to detect grid pattern
        const positions = children.map((child) => ({
            x: 'x' in child ? child.x : 0,
            y: 'y' in child ? child.y : 0,
            width: 'width' in child ? child.width : 0,
            height: 'height' in child ? child.height : 0,
        }));

        // Detect columns by grouping items with similar x positions
        const columns = this.detectGridColumns(positions);
        const rows = this.detectGridRows(positions);

        if (columns.length >= 2 && rows.length >= 2) {
            const gap = this.calculateGridGap(positions);

            return {
                'display': 'grid',
                'gridTemplateColumns': `repeat(${columns.length}, 1fr)`,
                'gridTemplateRows': `repeat(${rows.length}, auto)`,
                'gap': `${gap}px`,
                // Responsive adjustments
                '@media (max-width: 768px)': {
                    gridTemplateColumns: 'repeat(2, 1fr)',
                },
                '@media (max-width: 480px)': {
                    gridTemplateColumns: '1fr',
                },
            };
        }

        return null;
    }

    /**
     * Check if node structure looks like a grid
     */
    private static looksLikeGrid(node: SceneNode): boolean {
        if (!('children' in node) || !node.children || node.children.length < 4) {
            return false;
        }

        const children = Array.from(node.children);
        const positions = children.map((child) => ({
            x: 'x' in child ? child.x : 0,
            y: 'y' in child ? child.y : 0,
            width: 'width' in child ? child.width : 0,
            height: 'height' in child ? child.height : 0,
        }));

        // Check for regular spacing patterns
        const columns = this.detectGridColumns(positions);
        const rows = this.detectGridRows(positions);

        return columns.length >= 2 && rows.length >= 2;
    }

    /**
     * Check if node looks like a button
     */
    private static looksLikeButton(node: SceneNode): boolean {
        // Check for button-like characteristics
        if (node.type !== 'FRAME' && node.type !== 'COMPONENT')
            return false;

        // Has background fill
        const hasFill = 'fills' in node && node.fills && Array.isArray(node.fills) && node.fills.length > 0;

        // Has text child
        const hasText = 'children' in node && node.children
            && node.children.some((child) => child.type === 'TEXT');

        // Reasonable button dimensions
        const hasButtonSize = 'width' in node && 'height' in node
            && node.width >= 60 && node.width <= 300
            && node.height >= 24 && node.height <= 80;

        return hasFill && hasText && hasButtonSize;
    }

    /**
     * Check if node looks like a card
     */
    private static looksLikeCard(node: SceneNode): boolean {
        if (node.type !== 'FRAME')
            return false;

        // Has background and border radius
        const hasFill = 'fills' in node && node.fills && Array.isArray(node.fills) && node.fills.length > 0;
        const hasRadius = 'cornerRadius' in node && typeof node.cornerRadius === 'number' && node.cornerRadius > 0;

        // Has multiple children (content)
        const hasContent = 'children' in node && node.children && node.children.length >= 2;

        // Reasonable card size
        const hasCardSize = 'width' in node && 'height' in node
            && node.width >= 150 && node.height >= 100;

        return hasFill && hasRadius && hasContent && hasCardSize;
    }

    /**
     * Detect grid columns by analyzing x positions
     */
    private static detectGridColumns(positions: Array<{ x: number; y: number; width: number; height: number }>): number[] {
        const xPositions = positions.map((p) => p.x);
        const uniqueX = [...new Set(xPositions)].sort((a, b) => a - b);

        // Group similar x positions (within tolerance)
        const tolerance = 10;
        const columns: number[] = [];

        for (const x of uniqueX) {
            const existing = columns.find((col) => Math.abs(col - x) <= tolerance);
            if (!existing) {
                columns.push(x);
            }
        }

        return columns;
    }

    /**
     * Detect grid rows by analyzing y positions
     */
    private static detectGridRows(positions: Array<{ x: number; y: number; width: number; height: number }>): number[] {
        const yPositions = positions.map((p) => p.y);
        const uniqueY = [...new Set(yPositions)].sort((a, b) => a - b);

        // Group similar y positions (within tolerance)
        const tolerance = 10;
        const rows: number[] = [];

        for (const y of uniqueY) {
            const existing = rows.find((row) => Math.abs(row - y) <= tolerance);
            if (!existing) {
                rows.push(y);
            }
        }

        return rows;
    }

    /**
     * Calculate average gap between grid items
     */
    private static calculateGridGap(positions: Array<{ x: number; y: number; width: number; height: number }>): number {
        if (positions.length < 2)
            return 16;

        const gaps: number[] = [];

        // Calculate horizontal gaps
        for (let i = 0; i < positions.length; i++) {
            for (let j = i + 1; j < positions.length; j++) {
                const pos1 = positions[i];
                const pos2 = positions[j];

                // Check if they're on the same row (similar y)
                if (Math.abs(pos1.y - pos2.y) <= 10) {
                    const gap = Math.abs(pos2.x - (pos1.x + pos1.width));
                    if (gap > 0 && gap < 100) { // Reasonable gap range
                        gaps.push(gap);
                    }
                }
            }
        }

        // Return median gap or default
        if (gaps.length === 0)
            return 16;
        gaps.sort((a, b) => a - b);
        return gaps[Math.floor(gaps.length / 2)] || 16;
    }

    /**
     * Generate layout hints for improved conversion
     */
    static generateLayoutHints(node: SceneNode): {
        suggestions: string[];
        optimizations: string[];
        warnings: string[];
    } {
        const suggestions: string[] = [];
        const optimizations: string[] = [];
        const warnings: string[] = [];

        const layoutInfo = this.analyzeLayout(node);

        // Auto Layout suggestions
        if (!layoutInfo.isAutoLayout && 'children' in node && node.children && node.children.length > 1) {
            suggestions.push('Consider converting to Auto Layout for better responsive behavior');
        }

        // Performance optimizations
        if ('effects' in node && node.effects && node.effects.length > 3) {
            optimizations.push('Multiple effects detected - consider simplifying for better performance');
        }

        // Layout warnings
        if (layoutInfo.isAutoLayout && layoutInfo.gap === 0 && 'children' in node && node.children && node.children.length > 1) {
            warnings.push('Auto Layout with no gap - items may appear cramped');
        }

        return { suggestions, optimizations, warnings };
    }
}
