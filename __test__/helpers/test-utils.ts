import type { WeWebComponent } from '../../src/types/conversion';

/**
 * Helper to get children array from a component's slots
 * Handles the union type WeWebComponent | WeWebComponent[]
 */
export function getChildrenArray(component: WeWebComponent): WeWebComponent[] {
    if (!component.slots?.children) {
        return [];
    }
    
    const children = component.slots.children;
    return Array.isArray(children) ? children : [children];
}

/**
 * Helper to get a specific child by index
 * Returns undefined if the child doesn't exist
 */
export function getChildAt(component: WeWebComponent, index: number): WeWebComponent | undefined {
    const children = getChildrenArray(component);
    return children[index];
}

/**
 * Helper to find a child by name
 */
export function findChildByName(component: WeWebComponent, name: string): WeWebComponent | undefined {
    const children = getChildrenArray(component);
    return children.find(child => child.name === name);
}

/**
 * Helper to assert that a component has children
 */
export function assertHasChildren(component: WeWebComponent): asserts component is WeWebComponent & { slots: { children: WeWebComponent[] } } {
    if (!component.slots?.children) {
        throw new Error('Component has no children');
    }
}