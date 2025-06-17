# Complete Guide to Figma Plugin API Capabilities (2024-2025)

## Core Architecture

**Plugin Environment:**
- Runs in two threads: Main (Figma API access) + UI (iframe with browser APIs)
- Communication via `postMessage` between threads
- JavaScript/TypeScript execution with full node manipulation

## Latest Updates (2025)

### Config 2025 Major Feature Releases

#### **Figma Draw**
Revolutionary illustration tools integrated directly into Figma Design:
- **Enhanced Vector Editing**: Shape builder, lasso, and multi-edit tools for precise vector control
- **Text on Path**: Create text layers that follow any vector path programmatically
- **Pattern Fills**: Add repeating patterns to fills and strokes
- **Brushes**: Variety of artistic brush strokes with dynamic properties
- **Variable Stroke Width**: Create organic, hand-drawn line variations
- **Texture & Noise Effects**: Add subtle grainy textures to designs
- **Progressive Blur**: Advanced blur effects with gradient controls
- **Rotation Origin**: Precise control over transformation centers

#### **Grid Auto Layout**
New two-dimensional layout system:
- **Responsive Grids**: Create gallery layouts, bento boxes, and complex web patterns
- **Spanning Tracks**: Elements can span multiple grid columns/rows
- **Fixed Track Sizing**: Precise control over grid dimensions
- **Bidirectional Flow**: Content flows both horizontally and vertically

#### **Figma Sites**
Complete website design and publishing platform:
- **Design-to-Web**: Publish Figma designs directly as functional websites
- **Advanced Interactions**: Marquee, scroll parallax, and custom animations
- **Live HTML Preview**: Real-time preview of generated web code
- **Responsive Design**: Automatic mobile and desktop optimization
- **Custom Code Integration**: Merge design with custom HTML/CSS/JS

#### **Figma Make**
AI-powered prompt-to-code functionality:
- **Design-to-Code**: Convert Figma designs into functional prototypes
- **Interactive Prototyping**: Generate working web applications
- **Direct Code Editing**: Modify generated code within Figma
- **Multiple Frameworks**: Support for React, Vue, and vanilla JavaScript

#### **Figma Buzz**
Marketing automation and content generation:
- **Template Automation**: Bulk generate design assets from templates
- **Spreadsheet Integration**: Mail-merge functionality for design content
- **Brand Consistency**: Automated on-brand asset creation
- **Scale Operations**: Generate hundreds of variations efficiently

### Plugin API Enhancements (2025)

#### **Annotation Categories (April 2025)**
Complete annotation organization system:
```typescript
// Create annotation categories
figma.annotations.createCategory({
  name: "Design System",
  color: "red",
  description: "Components and tokens"
});

// Manage categories
figma.annotations.getCategories()
figma.annotations.assignCategoryToAnnotation(annotationId, categoryId)
figma.annotations.removeCategoryFromAnnotation(annotationId)

// Category customization
category.setColor('blue')
category.setLabel('Updated Name')
```

#### **Extended Codegen Timeout**
- Increased from 3 seconds to 15 seconds for complex code generation
- Better support for AI-powered code generation plugins
- Reduced timeout errors for heavy processing tasks

#### **Draw API Integration**
Access to new Figma Draw features through plugin API:
```typescript
// Text on path manipulation
textNode.setTextOnPath(vectorPath)
textNode.getTextPath()

// Pattern fills
node.fills = [{
  type: 'PATTERN',
  patternTransform: transform,
  patternId: patternHash
}]

// Brush strokes
vectorNode.strokeCap = 'VARIABLE_WIDTH'
vectorNode.strokeWeight = { min: 2, max: 10 }

// Texture effects
node.effects.push({
  type: 'TEXTURE',
  intensity: 0.3,
  blendMode: 'MULTIPLY'
})
```

## Complete API Capabilities

### 1. File & Document Access
```typescript
figma.currentPage              // Active page access
figma.root                     // Document root
figma.getLocalVariables()      // Local variables
figma.getLocalVariableCollections()  // Variable collections
figma.importComponentByKeyAsync()    // Import external components
figma.importStyleByKeyAsync()        // Import external styles
```

### 2. Node Creation & Manipulation
```typescript
// Create nodes
figma.createRectangle()
figma.createFrame()
figma.createComponent()
figma.createText()
figma.createVector()
figma.createStar()
figma.createPolygon()
figma.createEllipse()
figma.createLine()
figma.createSlice()
figma.createSticky()
figma.createConnector()
figma.createShapeWithText()

// Node operations
figma.group(nodes, parent)
figma.flatten(nodes)
figma.union(nodes, parent)
figma.subtract(nodes, parent)
figma.intersect(nodes, parent)
figma.exclude(nodes, parent)
```

### 3. User Interface
```typescript
// UI Management
figma.showUI(html, options)
figma.closePlugin(message)
figma.ui.postMessage(message)
figma.ui.onmessage = handler
figma.ui.resize(width, height)
figma.ui.close()

// Quick Actions
figma.parameters.on('input', handler)
figma.parameters.on('run', handler)
```

### 4. Selection & Interaction
```typescript
figma.currentPage.selection     // Current selection
figma.viewport.center          // Viewport center
figma.viewport.zoom            // Current zoom level
figma.viewport.scrollAndZoomIntoView(nodes)
```

### 5. Styles & Variables
```typescript
// Paint styles
figma.createPaintStyle()
figma.getLocalPaintStyles()

// Text styles
figma.createTextStyle()
figma.getLocalTextStyles()

// Effect styles
figma.createEffectStyle()
figma.getLocalEffectStyles()

// Variables
figma.variables.createVariable()
figma.variables.createVariableCollection()
```

### 6. Storage & Persistence
```typescript
// Client storage (persistent)
figma.clientStorage.getAsync(key)
figma.clientStorage.setAsync(key, value)
figma.clientStorage.deleteAsync(key)
figma.clientStorage.keysAsync()

// Plugin data (per-node)
node.setPluginData(key, value)
node.getPluginData(key)
node.setSharedPluginData(namespace, key, value)
node.getSharedPluginData(namespace, key)
```

### 7. Media & Assets
```typescript
// Images
figma.createImage(data)
figma.getImageAsync(hash)

// Videos (FigJam only)
figma.createVideo(data)

// Fonts
figma.loadFontAsync(font)
figma.listAvailableFontsAsync()
```

### 8. Dev Mode & Code Generation
```typescript
// Code generation
figma.codegen.on('generate', handler)
figma.codegen.on('preferenceschange', handler)

// Color selection
figma.colorPicker.show()
figma.colorPicker.hide()
```

### 9. Event System
```typescript
// Selection changes
figma.on('selectionchange', handler)

// Document changes
figma.on('documentchange', handler)

// Current page changes
figma.on('currentpagechange', handler)

// Plugin execution
figma.on('run', handler)
```

### 10. Notifications & Feedback
```typescript
figma.notify(message, options)
figma.notify(message, { timeout: 3000, error: true })
```

## Advanced Features

### **Team Libraries**
- Import components and styles from team libraries
- Access shared design tokens and variables
- Sync with external design systems

### **Annotations (New)**
- Create structured annotations with categories
- Organize plugin-generated documentation
- Enhanced collaboration features

### **Multi-Editor Support**
- Figma Design
- FigJam (whiteboards)
- Figma Slides (presentations)

### **Plugin Relaunch**
- Persistent plugin states
- Quick re-execution of previous actions
- Enhanced workflow continuity

## Limitations & Constraints

**Security Restrictions:**
- No access to external team libraries without explicit import
- Limited network access (must declare domains)
- No file system access (browser environment)

**Performance Limits:**
- Memory usage constraints
- Execution timeout limits
- Bundle size restrictions

**API Boundaries:**
- Cannot access file metadata (use REST API)
- No external web font loading
- Limited analytics/crash reporting

## Use Cases & Applications

**Design Automation:**
- Batch operations on design elements
- Automated design system application
- Content generation and population

**Design Systems:**
- Component library management
- Token synchronization
- Style guide enforcement

**Productivity Tools:**
- Workflow optimization
- Repetitive task automation
- Custom UI/UX enhancements

**Integration & Export:**
- External service integration
- Custom export formats
- Code generation tools

**AI & Machine Learning:**
- AI-powered design suggestions
- Automated content generation
- Smart design analysis

## Creating Figma Plugins with Vue.js and Vite

### Prerequisites

1. **Figma Desktop App** - Required for plugin development and testing
2. **Node.js** - For package management and build tools
3. **IDE** - VS Code, WebStorm, or similar with JavaScript/TypeScript support
4. **JavaScript/TypeScript Knowledge** - Especially asynchronous operations

### Quick Start Options

#### Option 1: Vue.js Starter Template
```bash
git clone https://github.com/jamieecarr/figma-plugin-vue-starter.git your-plugin-name
cd your-plugin-name
npm install
```

#### Option 2: Plugma Framework (Recommended)
Plugma is an all-in-one solution that supports Vue.js with zero configuration:
```bash
npm create plugma@latest my-plugin
# Select Vue.js when prompted
```

#### Option 3: Bolt Figma
Lightning-fast boilerplate built on Vite + TypeScript:
```bash
# Visit https://hyperbrew.co/resources/bolt-figma/ for setup
```

### Project Structure

A typical Figma plugin with Vue.js has this structure:
```
your-plugin/
├── manifest.json          # Plugin configuration
├── src/
│   ├── code.ts           # Plugin logic (main thread)
│   ├── ui.ts             # UI entry point
│   ├── ui.html           # HTML template
│   └── components/       # Vue components
├── dist/
│   ├── code.js           # Compiled plugin logic
│   └── ui.html           # Compiled UI with inlined assets
├── package.json
└── vite.config.js
```

### Manifest.json Configuration

```json
{
  "name": "Your Plugin Name",
  "id": "your-plugin-id-from-figma",
  "api": "1.0.0",
  "editorType": ["figma", "figjam"],
  "main": "dist/code.js",
  "ui": "dist/ui.html",
  "documentAccess": "dynamic-page",
  "networkAccess": {
    "allowedDomains": ["none"],
    "devAllowedDomains": ["http://localhost:3000"]
  }
}
```

### Vite Configuration Challenges and Solutions

#### The Single-File Problem
Figma requires all code bundled into single files and ignores `<script src="">` and `<link href="">`. Standard Vite builds don't handle this requirement.

#### Recommended Vite Config for Figma Plugins
```javascript
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      input: {
        code: resolve(__dirname, 'src/code.ts'),
        ui: resolve(__dirname, 'src/ui.html')
      },
      output: {
        entryFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    },
    outDir: 'dist',
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
```

### Development Workflow

#### Build Commands
```bash
# Development with hot reload
npm run dev

# Production build
npm run build

# Watch mode for development
npm run watch
```

#### Plugin Registration
1. Open Figma Desktop App
2. Go to Plugins > Development > Create new plugin
3. Select "Figma Design" and provide plugin name
4. Copy the generated plugin ID to your `manifest.json`

### Architecture Understanding

Figma plugins run in two separate environments:

1. **Main Thread (code.js)**: 
   - Runs in Figma's sandboxed environment
   - Has access to Figma API
   - Can manipulate design files
   - Limited browser APIs

2. **UI Thread (ui.html)**:
   - Runs in an iframe with null origin
   - Contains your Vue.js application
   - Communicates with main thread via `postMessage`
   - Has full browser API access but no Figma API access

### Vue.js Implementation

#### Main Thread (code.ts)
```typescript
// code.ts
figma.showUI(__html__, { width: 320, height: 480 });

figma.ui.onmessage = (msg) => {
  if (msg.type === 'create-rectangle') {
    const rect = figma.createRectangle();
    rect.x = msg.x;
    rect.y = msg.y;
    figma.currentPage.appendChild(rect);
  }
};
```

#### UI Entry (ui.ts)
```typescript
// ui.ts
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
```

#### Vue Component Example
```vue
<!-- App.vue -->
<template>
  <div id="app">
    <button @click="createRectangle">Create Rectangle</button>
  </div>
</template>

<script>
export default {
  methods: {
    createRectangle() {
      parent.postMessage({
        pluginMessage: {
          type: 'create-rectangle',
          x: 100,
          y: 100
        }
      }, '*');
    }
  }
}
</script>
```

### Key Limitations and Gotchas

#### 1. CORS Restrictions
- Plugins run in iframe with null origin
- API calls must allow `Access-Control-Allow-Origin: *`
- Use proxy servers for external API access

#### 2. Import Statement Restrictions
- Main thread doesn't support ES6 imports
- Everything must be bundled into single file
- Use dynamic imports carefully

#### 3. Storage Limitations
- No localStorage or cookies in UI context
- Use Figma's clientStorage API for persistence
- Data URLs can't access browser storage

#### 4. Network Access
- Must explicitly declare allowed domains in manifest
- Development domains separate from production

#### 5. Bundle Size Considerations
- Figma has runtime limits for plugin code
- Keep bundle sizes minimal
- Tree-shake unused code aggressively

### Best Practices

#### 1. Communication Pattern
```typescript
// Typed message system
interface PluginMessage {
  type: string;
  payload: any;
}

// UI to Plugin
parent.postMessage({ pluginMessage: message }, '*');

// Plugin to UI
figma.ui.postMessage(message);
```

#### 2. State Management
Use Vuex or Pinia for complex state management:
```javascript
// store.js
import { createStore } from 'vuex'

export default createStore({
  state: {
    selectedNodes: []
  },
  mutations: {
    setSelectedNodes(state, nodes) {
      state.selectedNodes = nodes;
    }
  }
})
```

#### 3. Error Handling
```typescript
// Always wrap plugin operations
try {
  const selection = figma.currentPage.selection;
  // Process selection
} catch (error) {
  figma.notify('Error: ' + error.message);
}
```

#### 4. Performance Optimization
- Minimize DOM updates in Vue components
- Use `v-memo` for expensive computations
- Batch Figma API calls when possible

### Testing and Debugging

#### Development Testing
1. Build your plugin: `npm run build`
2. In Figma: Plugins > Development > Import plugin from manifest
3. Select your `manifest.json` file
4. Test plugin functionality

#### Hot Reload Setup
Most modern setups support hot reload where Figma automatically restarts the plugin when code changes are detected.

### Deployment

#### Plugin Submission
1. Ensure all code is bundled correctly
2. Test thoroughly in both Figma and FigJam (if supported)
3. Submit through Figma's plugin review process
4. Follow Figma's plugin guidelines and policies

### Recommended Tools and Libraries

- **Plugma** - Zero-config framework for Figma plugins
- **Bolt Figma** - Fast boilerplate with Vite + TypeScript
- **Vue DevTools** - For debugging Vue components
- **Figma API Types** - TypeScript definitions for Figma API

---

The Figma Plugin API provides unprecedented access to design files and workflows, enabling developers to create powerful tools that extend Figma's native capabilities across the entire design process.