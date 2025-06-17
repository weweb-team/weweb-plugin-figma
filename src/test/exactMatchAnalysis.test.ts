import { describe, it, expect } from 'vitest'
import { convertNodesToWeweb } from '../figmatocode/wewebJsonConverter'
import { htmlMain } from '../figmatocode/htmlMain'
import fixtureData from './__fixtures__/figmaNodes/untitled-ui-landing-01.json'

describe('Exact Match Analysis', () => {
  it('should identify EXACT property generation differences', async () => {
    const pluginSettings = {
      htmlGenerationMode: "html" as const,
      showLayerNames: true,
      embedVectors: false,
      embedImages: false
    }
    
    // Test a specific problematic element
    const findElementByName = (node: any, name: string): any => {
      if (node.name === name) return node
      if (node.children) {
        for (const child of node.children) {
          const found = findElementByName(child, name)
          if (found) return found
        }
      }
      return null
    }
    
    // Find the "Content" element that's causing issues
    const contentElement = findElementByName(fixtureData, 'Content')
    
    if (!contentElement) {
      console.log('Content element not found')
      return
    }
    
    console.log('\n=== CONTENT ELEMENT ANALYSIS ===')
    console.log('Name:', contentElement.name)
    console.log('Type:', contentElement.type)
    console.log('Layout Mode:', contentElement.layoutMode)
    console.log('Width:', contentElement.width)
    console.log('Height:', contentElement.height)
    console.log('Has children:', contentElement.children?.length || 0)
    
    // Convert just this element
    const wewebResult = await convertNodesToWeweb([contentElement])
    const htmlResult = await htmlMain([contentElement], pluginSettings, true)
    
    // Extract HTML styles
    const styleMatch = htmlResult.html.match(/style="([^"]*)"/)
    const htmlStyleString = styleMatch ? styleMatch[1] : ''
    const htmlStyles: Record<string, any> = {}
    
    if (htmlStyleString) {
      const declarations = htmlStyleString.split(';').filter(s => s.trim())
      for (const declaration of declarations) {
        const [property, value] = declaration.split(':').map(s => s.trim())
        if (property && value) {
          const camelCaseProperty = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
          if (value.endsWith('px')) {
            const numValue = parseFloat(value)
            htmlStyles[camelCaseProperty] = isNaN(numValue) ? value : numValue
          } else {
            htmlStyles[camelCaseProperty] = value
          }
        }
      }
    }
    
    const wewebStyles = wewebResult[0].styles.default
    
    console.log('\n📊 STYLE COMPARISON:')
    console.log('HTML styles:', JSON.stringify(htmlStyles, null, 2))
    console.log('WeWeb styles:', JSON.stringify(wewebStyles, null, 2))
    
    // Analyze the differences
    const htmlProps = Object.keys(htmlStyles)
    const wewebProps = Object.keys(wewebStyles)
    
    console.log('\n🔍 PROPERTY ANALYSIS:')
    console.log('HTML properties:', htmlProps)
    console.log('WeWeb properties:', wewebProps)
    
    // The key insight
    console.log('\n💡 KEY INSIGHT:')
    if (contentElement.layoutMode !== 'NONE') {
      console.log('Element has layoutMode:', contentElement.layoutMode)
      console.log('But HTML is generating:', htmlProps)
      console.log('While WeWeb is generating:', wewebProps)
      console.log('This means HTML has ADDITIONAL logic we\'re missing!')
    }
    
    // Test multiple elements to find the pattern
    const testElements = [
      'Desktop',
      'Hero header section',
      'Content',
      'Text',
      'Container'
    ]
    
    console.log('\n=== MULTI-ELEMENT ANALYSIS ===')
    for (const elementName of testElements) {
      const element = findElementByName(fixtureData, elementName)
      if (!element) continue
      
      const wewebRes = await convertNodesToWeweb([element])
      const htmlRes = await htmlMain([element], pluginSettings, true)
      
      const wewebPropCount = Object.keys(wewebRes[0].styles.default).length
      const htmlMatch = htmlRes.html.match(/style="([^"]*)"/)
      const htmlPropsCount = htmlMatch ? htmlMatch[1].split(';').filter(s => s.trim()).length : 0
      
      console.log(`\n${elementName}:`)
      console.log(`  Type: ${element.type}`)
      console.log(`  Layout: ${element.layoutMode || 'N/A'}`)
      console.log(`  HTML props: ${htmlPropsCount}`)
      console.log(`  WeWeb props: ${wewebPropCount}`)
      console.log(`  Match: ${htmlPropsCount === wewebPropCount ? '✅' : '❌'}`)
    }
    
    expect(true).toBe(true) // Always pass to see output
  })
})