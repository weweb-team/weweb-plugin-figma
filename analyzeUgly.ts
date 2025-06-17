import { convertNodesToWeweb } from './src/figmatocode/wewebJsonConverter'
import { htmlMain } from './src/figmatocode/htmlMain'
import { htmlContainer } from './src/builderImpl/htmlContainer'
import { HtmlDefaultBuilder } from './src/figmatocode/htmlDefaultBuilder'

// Create a mock Figma node to test
const mockNode = {
  type: 'FRAME' as const,
  name: 'Test Container',
  visible: true,
  width: 1440,
  height: 900,
  x: 0,
  y: 0,
  layoutMode: 'HORIZONTAL' as const,
  primaryAxisAlignItems: 'CENTER' as const,
  counterAxisAlignItems: 'CENTER' as const,
  paddingTop: 32,
  paddingRight: 48,
  paddingBottom: 32,
  paddingLeft: 48,
  itemSpacing: 24,
  fills: [{
    type: 'SOLID' as const,
    visible: true,
    color: { r: 0.96, g: 0.96, b: 0.98 },
    opacity: 1
  }],
  strokes: [],
  effects: [],
  cornerRadius: 0,
  constraints: {
    horizontal: 'STRETCH' as const,
    vertical: 'MIN' as const
  },
  children: []
} as any

const settings = {
  htmlGenerationMode: "html" as const,
  showLayerNames: true,
  embedVectors: false,
  embedImages: false
}

console.log('🔍 ANALYZING WHY WEWEB LOOKS UGLY\n')

// Get HTML output
const htmlBuilder = new HtmlDefaultBuilder(mockNode, settings)
htmlBuilder.commonPositionStyles()
htmlBuilder.commonShapeStyles()

console.log('HTML Builder styles:')
console.log(htmlBuilder.styles)

// Get the actual HTML container output
const htmlOutput = htmlContainer(mockNode, settings, [])
console.log('\nHTML Container output:')
console.log(htmlOutput)

// Parse HTML styles
const styleMatch = htmlOutput.match(/style="([^"]*)"/)
if (styleMatch) {
  console.log('\nHTML styles parsed:')
  const styles = styleMatch[1].split(';').filter(s => s.trim())
  styles.forEach(s => console.log('  ' + s))
}

// Get WeWeb output
convertNodesToWeweb([mockNode]).then(wewebResult => {
  console.log('\nWeWeb styles:')
  console.log(JSON.stringify(wewebResult[0].styles.default, null, 2))
  
  console.log('\n❌ THE PROBLEM:')
  console.log('HTML includes flexbox properties but WeWeb might be missing them!')
  console.log('Let me check the WeWeb converter...')
})