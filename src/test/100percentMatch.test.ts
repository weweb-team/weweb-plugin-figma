import { describe, it, expect } from 'vitest'
import { convertNodesToWeweb } from '../figmatocode/wewebJsonConverter'
import { htmlMain } from '../figmatocode/htmlMain'
import fixtureData from './__fixtures__/figmaNodes/untitled-ui-landing-01.json'

describe('100% Match Test', () => {
  it('should achieve 100% style property match between HTML and WeWeb', async () => {
    const pluginSettings = {
      htmlGenerationMode: "html" as const,
      showLayerNames: true,
      embedVectors: false,
      embedImages: false
    }
    
    // Convert to both formats
    const wewebResult = await convertNodesToWeweb([fixtureData])
    const htmlResult = await htmlMain([fixtureData], pluginSettings, true)
    
    // Parse HTML to extract all style properties
    function parseHtmlStyles(htmlString: string): Map<string, Record<string, any>> {
      const elementStyles = new Map<string, Record<string, any>>()
      
      const divRegex = /<div[^>]*data-layer="([^"]*)"[^>]*style="([^"]*)"[^>]*>/g
      let match
      
      while ((match = divRegex.exec(htmlString)) !== null) {
        const [, dataLayer, styleString] = match
        const styles: Record<string, any> = {}
        
        if (styleString) {
          const declarations = styleString.split(';').filter(s => s.trim())
          for (const declaration of declarations) {
            const [property, value] = declaration.split(':').map(s => s.trim())
            if (property && value) {
              const camelCaseProperty = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
              
              // Normalize values for comparison
              if (value.endsWith('px')) {
                const numValue = parseFloat(value)
                styles[camelCaseProperty] = isNaN(numValue) ? value : numValue
              } else {
                styles[camelCaseProperty] = value
              }
            }
          }
        }
        
        elementStyles.set(dataLayer, styles)
      }
      
      return elementStyles
    }
    
    // Extract WeWeb styles recursively
    function extractWewebStyles(elements: any[]): Map<string, Record<string, any>> {
      const elementStyles = new Map<string, Record<string, any>>()
      
      function traverse(element: any) {
        if (element.tag === 'ww-div') {
          elementStyles.set(element.name, element.styles?.default || {})
        }
        
        if (element.slots?.children) {
          for (const child of element.slots.children) {
            traverse(child)
          }
        }
      }
      
      for (const element of elements) {
        traverse(element)
      }
      
      return elementStyles
    }
    
    const htmlStyles = parseHtmlStyles(htmlResult.html)
    const wewebStyles = extractWewebStyles(wewebResult)
    
    console.log('\n=== 100% MATCH ANALYSIS ===')
    console.log(`HTML elements: ${htmlStyles.size}`)
    console.log(`WeWeb elements: ${wewebStyles.size}`)
    
    // Compare each matching element
    let totalProperties = 0
    let matchingProperties = 0
    let mismatches: any[] = []
    
    for (const [name, htmlStyle] of htmlStyles) {
      const wewebStyle = wewebStyles.get(name)
      
      if (wewebStyle) {
        const allProps = new Set([...Object.keys(htmlStyle), ...Object.keys(wewebStyle)])
        
        for (const prop of allProps) {
          totalProperties++
          
          const htmlValue = htmlStyle[prop]
          const wewebValue = wewebStyle[prop]
          
          if (htmlValue === wewebValue) {
            matchingProperties++
          } else {
            // Try numeric comparison
            const htmlNum = typeof htmlValue === 'string' ? parseFloat(htmlValue) : htmlValue
            const wewebNum = typeof wewebValue === 'string' ? parseFloat(wewebValue) : wewebValue
            
            if (!isNaN(htmlNum) && !isNaN(wewebNum) && htmlNum === wewebNum) {
              matchingProperties++
            } else {
              mismatches.push({
                element: name,
                prop,
                html: htmlValue,
                weweb: wewebValue
              })
            }
          }
        }
      }
    }
    
    const matchRate = (matchingProperties / totalProperties * 100).toFixed(1)
    
    console.log(`\n🎯 MATCH RATE: ${matchRate}%`)
    console.log(`✅ Matching properties: ${matchingProperties}`)
    console.log(`❌ Mismatched properties: ${totalProperties - matchingProperties}`)
    
    if (mismatches.length > 0) {
      console.log('\n🔍 REMAINING MISMATCHES (first 10):')
      for (const mismatch of mismatches.slice(0, 10)) {
        console.log(`  ${mismatch.element}.${mismatch.prop}: HTML="${mismatch.html}" vs WeWeb="${mismatch.weweb}"`)
      }
    }
    
    // FORCE OUTPUT TO SEE THE TRUTH
    console.error('\n🚨 MATCH RATE:', matchRate + '%')
    console.error('Total properties:', totalProperties)
    console.error('Matching:', matchingProperties)
    console.error('Mismatches:', mismatches.length)
    
    // Check a specific element
    const testEl = Array.from(htmlStyles.keys()).find(name => name.includes('Desktop') || name.includes('Container'))
    if (testEl) {
      console.error('\nExample element:', testEl)
      console.error('HTML styles:', Object.keys(htmlStyles.get(testEl) || {}))
      console.error('WeWeb styles:', Object.keys(wewebStyles.get(testEl) || {}))
    }
    
    // Show the match rate
    const report = `
🎯 FINAL MATCH RATE: ${matchRate}%
✅ Matching properties: ${matchingProperties}
❌ Mismatched properties: ${totalProperties - matchingProperties}
📊 Total properties compared: ${totalProperties}

${mismatches.length > 0 ? 'REMAINING ISSUES:\n' + mismatches.slice(0, 5).map(m => 
  `  ${m.element}.${m.prop}: HTML="${m.html}" vs WeWeb="${m.weweb}"`
).join('\n') : '✨ PERFECT MATCH - NO MISMATCHES!'}
`
    
    expect(Number(matchRate), report).toBeGreaterThanOrEqual(100) // 100% match!
  })
})