// Vitest setup file
import { vi } from 'vitest';

// Mock Figma API
vi.stubGlobal('figma', {
    showUI: vi.fn(),
    ui: {
        postMessage: vi.fn(),
        onmessage: vi.fn(),
    },
    currentPage: {
        selection: [],
    },
    on: vi.fn(),
    off: vi.fn(),
});

// Mock parent.postMessage for UI tests
vi.stubGlobal('parent', {
    postMessage: vi.fn(),
});

// Mock window.addEventListener
vi.stubGlobal('addEventListener', vi.fn());
