import { convertNodesToWeweb } from './src/figmatocode/wewebJsonConverter.ts'
import { htmlMain } from './src/figmatocode/htmlMain.ts'

const simpleNode = {
  type: 'FRAME',
  name: 'Test Container',
  visible: true,
  width: 400,
  height: 300,
  x: 0,
  y: 0,
  layoutMode: 'HORIZONTAL',
  primaryAxisAlignItems: 'CENTER',
  counterAxisAlignItems: 'CENTER',
  itemSpacing: 20,
  paddingTop: 20,
  paddingRight: 20,
  paddingBottom: 20,
  paddingLeft: 20,
  fills: [{
    type: 'SOLID',
    visible: true,
    color: { r: 0.9, g: 0.9, b: 0.95 },
    opacity: 1
  }],
  strokes: [],
  effects: [],
  cornerRadius: 8,
  constraints: { horizontal: 'MIN', vertical: 'MIN' },
  children: []
}

const settings = {
  htmlGenerationMode: "html",
  showLayerNames: true,
  embedVectors: false,
  embedImages: false
}

console.log('🔍 DIRECT COMPARISON\n')

// HTML output
const htmlResult = await htmlMain([simpleNode], settings, true)
console.log('HTML Output:')
console.log(htmlResult.html)

// Extract HTML styles
const styleMatch = htmlResult.html.match(/style="([^"]*)"/)
if (styleMatch) {
  const styles = styleMatch[1].split(';').filter(s => s.trim())
  console.log(`\nHTML Styles (${styles.length} total):`)
  styles.forEach(s => console.log(`  ${s}`))
}

// WeWeb output  
const wewebResult = await convertNodesToWeweb([simpleNode])
console.log('\nWeWeb Output:')
console.log(JSON.stringify(wewebResult[0], null, 2))

const wewebStyles = wewebResult[0].styles.default
console.log(`\nWeWeb Styles (${Object.keys(wewebStyles).length} total):`)
Object.entries(wewebStyles).forEach(([k, v]) => {
  console.log(`  ${k}: ${v}`)
})

// The truth
console.log('\n❌ THE TRUTH:')
console.log('If WeWeb looks ugly, check if these are present:')
console.log(`  display: ${wewebStyles.display ? '✅' : '❌'} ${wewebStyles.display || ''}`)
console.log(`  flexDirection: ${wewebStyles.flexDirection ? '✅' : '❌'} ${wewebStyles.flexDirection || ''}`)
console.log(`  justifyContent: ${wewebStyles.justifyContent ? '✅' : '❌'} ${wewebStyles.justifyContent || ''}`)
console.log(`  alignItems: ${wewebStyles.alignItems ? '✅' : '❌'} ${wewebStyles.alignItems || ''}`)