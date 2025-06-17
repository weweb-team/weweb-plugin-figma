// Test setup file
import { vi } from 'vitest'

// Mock Figma API for testing
global.figma = {
  ui: {
    postMessage: vi.fn(),
    onmessage: null,
  },
  currentPage: {
    selection: [],
  },
  showUI: vi.fn(),
  on: vi.fn(),
  // Add other Figma API methods as needed
} as any

// Mock console methods to avoid test output noise
const originalConsole = console
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  // Keep original console for test debugging
  debug: originalConsole.log,
}