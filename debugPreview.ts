import { htmlMain } from './src/figmatocode/htmlMain'
import { getIsPreviewGlobal, setIsPreviewGlobal } from './src/figmatocode/htmlShared'

const testNode = {
  id: '1:1',
  name: 'Desktop',
  type: 'FRAME' as const,
  visible: true,
  width: 1440,
  height: 960,
  x: 4238,
  y: 620,
  parent: null,
  layoutMode: 'HORIZONTAL' as const,
  primaryAxisAlignItems: 'MIN' as const,
  counterAxisAlignItems: 'MIN' as const,
  itemSpacing: 0,
  fills: [{
    type: 'SOLID' as const,
    visible: true,
    color: { r: 1, g: 1, b: 1 },
    opacity: 1
  }],
  strokes: [],
  effects: [],
  children: []
} as any

const settings = {
  framework: "HTML" as const,
  htmlGenerationMode: "html" as const,
  showLayerNames: false,
  embedVectors: false,
  embedImages: false,
  responsiveRoot: false,
  useOldPluginVersion2025: false
} as any

async function test() {
  console.log('Testing preview mode...\n')
  
  // Test without preview
  console.log('WITHOUT preview (isPreview = false):')
  const result1 = await htmlMain([testNode], settings, false)
  console.log(result1.html.substring(0, 150))
  
  // Test with preview
  console.log('\nWITH preview (isPreview = true):')
  const result2 = await htmlMain([testNode], settings, true)
  console.log(result2.html.substring(0, 150))
  
  // Check preview state
  console.log('\nPreview state:', getIsPreviewGlobal())
}

test()