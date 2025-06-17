// Direct check of what's happening
import { HtmlDefaultBuilder } from './src/figmatocode/htmlDefaultBuilder'
import { htmlAutoLayoutProps } from './src/figmatocode/builderImpl/htmlAutoLayout'

const mockFlexNode = {
  type: 'FRAME',
  name: 'Test Flex',
  layoutMode: 'HORIZONTAL',
  primaryAxisAlignItems: 'CENTER',
  counterAxisAlignItems: 'CENTER', 
  itemSpacing: 20,
  parent: null,
  visible: true,
  width: 500,
  height: 300
} as any

const settings = {
  htmlGenerationMode: "html" as const,
  showLayerNames: true
}

console.log('🔍 CHECKING STYLE GENERATION\n')

// What does htmlAutoLayoutProps return?
const autoLayoutStyles = htmlAutoLayoutProps(mockFlexNode, settings)
console.log('htmlAutoLayoutProps returns:')
console.log(autoLayoutStyles)

// What's in the builder after calling methods?
const builder = new HtmlDefaultBuilder(mockFlexNode, settings)
builder.commonPositionStyles()
builder.commonShapeStyles()

console.log('\nBuilder styles after common methods:')
console.log(builder.styles)

// Now add the auto-layout styles
const allStyles = [...builder.styles, ...autoLayoutStyles]
console.log('\nAll styles combined:')
console.log(allStyles)

// Parse to object
const styleString = allStyles.join('; ')
const parsed: Record<string, any> = {}
styleString.split(';').forEach(decl => {
  const [prop, val] = decl.split(':').map(s => s.trim())
  if (prop && val) {
    const camelProp = prop.replace(/-([a-z])/g, (_, l) => l.toUpperCase())
    parsed[camelProp] = val.endsWith('px') ? parseFloat(val) : val
  }
})

console.log('\nParsed as object:')
console.log(JSON.stringify(parsed, null, 2))

console.log('\n✅ CONCLUSION:')
if (parsed.display) {
  console.log('Display IS being set to:', parsed.display)
  console.log('So WeWeb should have flexbox styles!')
} else {
  console.log('❌ Display is NOT being set!')
}