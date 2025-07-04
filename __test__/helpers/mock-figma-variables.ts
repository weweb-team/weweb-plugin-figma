import { afterEach, beforeEach, vi } from 'vitest';

interface MockVariable {
    id: string;
    name: string;
    resolvedType: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
    valuesByMode: {
        default: any;
        [mode: string]: any;
    };
}

let mockVariablesMap: Map<string, MockVariable> = new Map();

/**
 * Mock Figma variables for testing
 * @param variables Array of mock variables to set up
 * @example
 * mockFigmaVariables([
 *   {
 *     id: 'VariableID:color/gray-200',
 *     name: 'Gray-200',
 *     resolvedType: 'COLOR',
 *     valuesByMode: {
 *       default: { r: 0.91, g: 0.92, b: 0.92, a: 1 }
 *     }
 *   }
 * ]);
 */
export function mockFigmaVariables(variables: MockVariable[]): void {
    beforeEach(() => {
        // Clear previous variables
        mockVariablesMap.clear();
        
        // Add new variables to map
        for (const variable of variables) {
            mockVariablesMap.set(variable.id, variable);
        }

        // Override the getVariableById function
        // @ts-expect-error - Figma types are readonly but we need to mock them in tests
        figma.variables = {
            getVariableById: vi.fn((id: string) => {
                return mockVariablesMap.get(id) || null;
            }),
        };
    });

    afterEach(() => {
        // Clean up
        mockVariablesMap.clear();
    });
}

/**
 * Add or update a variable in the current test context
 * @param variable Variable to add or update
 */
export function addMockVariable(variable: MockVariable): void {
    mockVariablesMap.set(variable.id, variable);
}

/**
 * Remove a variable from the current test context
 * @param id Variable ID to remove
 */
export function removeMockVariable(id: string): void {
    mockVariablesMap.delete(id);
}

/**
 * Get the current mock variables map (for debugging)
 */
export function getMockVariables(): Map<string, MockVariable> {
    return new Map(mockVariablesMap);
}