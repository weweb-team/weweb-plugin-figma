import { describe, it, expect } from 'vitest'
import { convertNodesToWewebV2 } from '../figmatocode/wewebJsonConverterV2'
import { htmlMain } from '../figmatocode/htmlMain'
import dashboardFixture from './__fixtures__/figmaNodes/untitled-ui-dashboard-01.json'

describe('Dashboard Fixture Test', () => {
  it('should test match rate with untitled-ui-dashboard-01', async () => {
    const settings = {
      htmlGenerationMode: "html" as const,
      showLayerNames: true,
      embedVectors: false,
      embedImages: false
    }
    
    console.log('\n🎯 TESTING DASHBOARD FIXTURE\n')
    
    // Convert to both formats
    const wewebResult = await convertNodesToWewebV2([dashboardFixture], settings, true)
    const htmlResult = await htmlMain([dashboardFixture], settings, true)
    
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
        if (element.tag === 'ww-div' || element.tag === 'ww-text' || element.tag === 'ww-image') {
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
    
    console.log('HTML elements:', htmlStyles.size)
    console.log('WeWeb elements:', wewebStyles.size)
    
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
    
    const matchRate = totalProperties > 0 ? (matchingProperties / totalProperties * 100).toFixed(1) : '0'
    
    console.log(`\n📊 DASHBOARD MATCH RESULTS:`)
    console.log(`Match Rate: ${matchRate}%`)
    console.log(`Matching properties: ${matchingProperties}`)
    console.log(`Mismatched properties: ${totalProperties - matchingProperties}`)
    console.log(`Total properties compared: ${totalProperties}`)
    
    // Show first few mismatches
    if (mismatches.length > 0) {
      console.log('\n❌ FIRST 10 MISMATCHES:')
      for (const mismatch of mismatches.slice(0, 10)) {
        console.log(`  ${mismatch.element}.${mismatch.prop}: HTML="${mismatch.html}" vs WeWeb="${mismatch.weweb}"`)
      }
    }
    
    // Check flexbox properties specifically
    let flexMismatches = mismatches.filter(m => 
      m.prop.includes('display') || 
      m.prop.includes('flex') || 
      m.prop.includes('justify') || 
      m.prop.includes('align') ||
      m.prop.includes('gap')
    )
    
    if (flexMismatches.length > 0) {
      console.log(`\n🔍 FLEXBOX MISMATCHES (${flexMismatches.length} total):`)
      for (const mismatch of flexMismatches.slice(0, 5)) {
        console.log(`  ${mismatch.element}.${mismatch.prop}: HTML="${mismatch.html}" vs WeWeb="${mismatch.weweb}"`)
      }
    }
    
    // Check font properties
    let fontMismatches = mismatches.filter(m => 
      m.prop.includes('font') || 
      m.prop.includes('line') || 
      m.prop.includes('text')
    )
    
    if (fontMismatches.length > 0) {
      console.log(`\n📝 FONT MISMATCHES (${fontMismatches.length} total):`)
      for (const mismatch of fontMismatches.slice(0, 5)) {
        console.log(`  ${mismatch.element}.${mismatch.prop}: HTML="${mismatch.html}" vs WeWeb="${mismatch.weweb}"`)
      }
    }
    
    // Final verdict
    console.log('\n🎯 VERDICT:')
    if (Number(matchRate) === 100) {
      console.log('✅ 100% match achieved on dashboard fixture!')
      console.log('If it still looks ugly, the issue is NOT missing properties.')
      console.log('Possible causes:')
      console.log('- WeWeb renders CSS differently')
      console.log('- Missing CSS resets or defaults')
      console.log('- Font loading issues')
      console.log('- Different box model interpretation')
    } else {
      console.log(`❌ Only ${matchRate}% match on dashboard fixture`)
      console.log('Missing properties are causing the ugly appearance')
    }
    
    // Force output to console.error to ensure visibility
    console.error('\n🚨 DASHBOARD TEST RESULTS:')
    console.error(`Match Rate: ${matchRate}%`)
    console.error(`Total Properties: ${totalProperties}`)
    console.error(`Mismatches: ${mismatches.length}`)
    
    // Show all mismatches since it's not 100%
    if (mismatches.length > 0) {
      console.error('\n🔍 ALL MISMATCHES:')
      mismatches.forEach(m => {
        console.error(`  ${m.element}.${m.prop}: HTML="${m.html}" vs WeWeb="${m.weweb}"`)
      })
    }
    
    expect(Number(matchRate)).toBeGreaterThanOrEqual(95) // Back to 95% threshold
  })
})