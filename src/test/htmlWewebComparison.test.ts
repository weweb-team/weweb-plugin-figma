import { describe, it, expect } from 'vitest'
import { convertNodesToWeweb } from '../figmatocode/wewebJsonConverter'
import { htmlMain } from '../figmatocode/htmlMain'
import fixtureData from './__fixtures__/figmaNodes/untitled-ui-landing-01.json'

/**
 * Parse HTML string to extract div elements with their styles
 */
function parseHtmlElements(htmlString: string) {
  const elements: Array<{
    tag: string,
    dataLayer: string,
    className: string,
    styles: Record<string, any>,
    isTextElement: boolean
  }> = []
  
  // Match div elements with their attributes
  const divRegex = /<div[^>]*data-layer="([^"]*)"[^>]*class="([^"]*)"[^>]*style="([^"]*)"[^>]*>/g
  let match
  
  while ((match = divRegex.exec(htmlString)) !== null) {
    const [, dataLayer, className, styleString] = match
    
    // Parse the inline styles
    const styles: Record<string, any> = {}
    if (styleString) {
      const styleDeclarations = styleString.split(';').filter(s => s.trim())
      for (const declaration of styleDeclarations) {
        const [property, value] = declaration.split(':').map(s => s.trim())
        if (property && value) {
          // Convert CSS property to camelCase
          const camelCaseProperty = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
          
          // Convert pixel values to numbers where appropriate
          if (value.endsWith('px')) {
            const numValue = parseFloat(value)
            if (!isNaN(numValue)) {
              styles[camelCaseProperty] = numValue
            } else {
              styles[camelCaseProperty] = value
            }
          } else {
            styles[camelCaseProperty] = value.replace(/['"]/g, '')
          }
        }
      }
    }
    
    // Check if this is likely a text container (empty div or contains text)
    const isTextElement = className.toLowerCase().includes('text') || 
                         dataLayer.toLowerCase().includes('text')
    
    elements.push({
      tag: 'div',
      dataLayer,
      className,
      styles,
      isTextElement
    })
  }
  
  return elements
}

/**
 * Extract WeWeb elements with their styles for comparison
 */
function extractWewebElements(wewebResult: any[]): Array<{
  tag: string,
  name: string,
  styles: Record<string, any>,
  isTextElement: boolean,
  text?: string
}> {
  const elements: any[] = []
  
  function traverse(element: any) {
    elements.push({
      tag: element.tag,
      name: element.name,
      styles: element.styles?.default || {},
      isTextElement: element.tag === 'ww-text',
      text: element.props?.default?.text
    })
    
    if (element.slots?.children) {
      for (const child of element.slots.children) {
        traverse(child)
      }
    }
  }
  
  for (const element of wewebResult) {
    traverse(element)
  }
  
  return elements
}

/**
 * Compare CSS properties between HTML and WeWeb
 */
function compareStyles(htmlStyles: Record<string, any>, wewebStyles: Record<string, any>, elementName: string) {
  const comparison = {
    matching: [] as string[],
    differing: [] as Array<{ prop: string, html: any, weweb: any }>,
    htmlOnly: [] as string[],
    wewebOnly: [] as string[]
  }
  
  const allProps = new Set([...Object.keys(htmlStyles), ...Object.keys(wewebStyles)])
  
  for (const prop of allProps) {
    const htmlValue = htmlStyles[prop]
    const wewebValue = wewebStyles[prop]
    
    if (htmlValue !== undefined && wewebValue !== undefined) {
      // Both have the property - compare values
      if (htmlValue === wewebValue) {
        comparison.matching.push(prop)
      } else {
        // Special handling for numeric vs string values
        const htmlNum = typeof htmlValue === 'string' ? parseFloat(htmlValue) : htmlValue
        const wewebNum = typeof wewebValue === 'string' ? parseFloat(wewebValue) : wewebValue
        
        if (!isNaN(htmlNum) && !isNaN(wewebNum) && htmlNum === wewebNum) {
          comparison.matching.push(prop)
        } else {
          comparison.differing.push({ prop, html: htmlValue, weweb: wewebValue })
        }
      }
    } else if (htmlValue !== undefined) {
      comparison.htmlOnly.push(prop)
    } else {
      comparison.wewebOnly.push(prop)
    }
  }
  
  return comparison
}

describe('HTML vs WeWeb Element Comparison', () => {
  it('should have matching div elements and styles between HTML and WeWeb conversions', async () => {
    const pluginSettings = {
      htmlGenerationMode: "html" as const,
      showLayerNames: true,
      embedVectors: false,
      embedImages: false
    }
    
    // Convert to both formats
    const wewebResult = await convertNodesToWeweb([fixtureData])
    const htmlResult = await htmlMain([fixtureData], pluginSettings, true)
    
    // Parse HTML to extract elements
    const htmlElements = parseHtmlElements(htmlResult.html)
    const wewebElements = extractWewebElements(wewebResult)
    
    console.log('\n=== CONVERSION SUMMARY ===')
    console.log(`HTML elements found: ${htmlElements.length}`)
    console.log(`WeWeb elements found: ${wewebElements.length}`)
    
    // Filter to div/ww-div elements only for fair comparison
    const htmlDivs = htmlElements.filter(el => el.tag === 'div' && !el.isTextElement)
    const wewebDivs = wewebElements.filter(el => el.tag === 'ww-div')
    
    console.log(`HTML divs (non-text): ${htmlDivs.length}`)
    console.log(`WeWeb divs: ${wewebDivs.length}`)
    
    // Compare a sample of elements by name matching
    const matchedElements: Array<{
      html: any,
      weweb: any,
      comparison: any
    }> = []
    
    for (const wewebDiv of wewebDivs.slice(0, 10)) { // Test first 10 elements
      // Try to find matching HTML element by name
      const htmlMatch = htmlDivs.find(htmlEl => 
        htmlEl.dataLayer === wewebDiv.name || 
        htmlEl.className.toLowerCase().replace(/[^a-z0-9]/g, '') === 
        wewebDiv.name.toLowerCase().replace(/[^a-z0-9]/g, '')
      )
      
      if (htmlMatch) {
        const comparison = compareStyles(htmlMatch.styles, wewebDiv.styles, wewebDiv.name)
        matchedElements.push({
          html: htmlMatch,
          weweb: wewebDiv,
          comparison
        })
        
        console.log(`\n🔍 ELEMENT: ${wewebDiv.name}`)
        console.log(`  HTML styles (${Object.keys(htmlMatch.styles).length}):`, Object.keys(htmlMatch.styles))
        console.log(`  WeWeb styles (${Object.keys(wewebDiv.styles).length}):`, Object.keys(wewebDiv.styles))
        console.log(`  ✅ Matching props: ${comparison.matching.length}`)
        console.log(`  ⚠️  Different props: ${comparison.differing.length}`)
        console.log(`  📝 HTML-only: ${comparison.htmlOnly.length}`)
        console.log(`  📝 WeWeb-only: ${comparison.wewebOnly.length}`)
        
        if (comparison.differing.length > 0) {
          console.log(`  Differences:`, comparison.differing.slice(0, 3))
        }
      }
    }
    
    console.log(`\n=== MATCHED ELEMENTS SUMMARY ===`)
    console.log(`Successfully matched: ${matchedElements.length} elements`)
    
    // Calculate overall statistics
    const totalMatching = matchedElements.reduce((sum, el) => sum + el.comparison.matching.length, 0)
    const totalDiffering = matchedElements.reduce((sum, el) => sum + el.comparison.differing.length, 0)
    const totalHtmlOnly = matchedElements.reduce((sum, el) => sum + el.comparison.htmlOnly.length, 0)
    const totalWewebOnly = matchedElements.reduce((sum, el) => sum + el.comparison.wewebOnly.length, 0)
    
    console.log(`Total matching properties: ${totalMatching}`)
    console.log(`Total differing properties: ${totalDiffering}`)
    console.log(`Total HTML-only properties: ${totalHtmlOnly}`)
    console.log(`Total WeWeb-only properties: ${totalWewebOnly}`)
    
    const matchRate = totalMatching / (totalMatching + totalDiffering) * 100
    console.log(`Style match rate: ${matchRate.toFixed(1)}%`)
    
    // Show detailed statistics in assertion messages
    const statsMessage = `
📊 CONVERSION STATISTICS:
- HTML elements: ${htmlElements.length} (${htmlDivs.length} divs)
- WeWeb elements: ${wewebElements.length} (${wewebDivs.length} divs)
- Matched elements: ${matchedElements.length}
- Style match rate: ${matchRate.toFixed(1)}%
- Total matching properties: ${totalMatching}
- Total differing properties: ${totalDiffering}
- HTML-only properties: ${totalHtmlOnly}
- WeWeb-only properties: ${totalWewebOnly}
`
    
    // Assertions for the test
    expect(matchedElements.length, `Should find matching elements between HTML and WeWeb${statsMessage}`).toBeGreaterThan(0)
    expect(matchRate, `Style match rate should be reasonable${statsMessage}`).toBeGreaterThan(20) // At least 20% match rate
    
    // Ensure both conversions produce meaningful results
    expect(htmlDivs.length, 'HTML should produce div elements').toBeGreaterThan(0)
    expect(wewebDivs.length, 'WeWeb should produce ww-div elements').toBeGreaterThan(0)
    
    // Test specific important layout properties are present
    const hasFlexProperties = matchedElements.some(el => 
      Object.keys(el.weweb.styles).some(prop => 
        ['display', 'flexDirection', 'justifyContent', 'alignItems'].includes(prop)
      )
    )
    expect(hasFlexProperties, 'WeWeb should include flexbox layout properties').toBe(true)
  })
  
  it('should have comparable text elements between HTML and WeWeb', async () => {
    const pluginSettings = {
      htmlGenerationMode: "html" as const,
      showLayerNames: true,
      embedVectors: false,
      embedImages: false
    }
    
    // Convert to both formats
    const wewebResult = await convertNodesToWeweb([fixtureData])
    const htmlResult = await htmlMain([fixtureData], pluginSettings, true)
    
    // Extract text elements
    const htmlElements = parseHtmlElements(htmlResult.html)
    const wewebElements = extractWewebElements(wewebResult)
    
    const htmlTextContainers = htmlElements.filter(el => el.isTextElement)
    const wewebTextElements = wewebElements.filter(el => el.isTextElement)
    
    console.log('\n=== TEXT ELEMENTS COMPARISON ===')
    console.log(`HTML text containers: ${htmlTextContainers.length}`)
    console.log(`WeWeb text elements: ${wewebTextElements.length}`)
    
    // Check that WeWeb text elements have meaningful styling
    const styledTextElements = wewebTextElements.filter(el => 
      Object.keys(el.styles).length > 0
    )
    
    console.log(`WeWeb text elements with styles: ${styledTextElements.length}`)
    
    if (styledTextElements.length > 0) {
      console.log('Sample text element styles:', styledTextElements[0].styles)
    }
    
    // Assertions
    expect(wewebTextElements.length, 'WeWeb should produce text elements').toBeGreaterThan(0)
    expect(styledTextElements.length, 'WeWeb text elements should have styles').toBeGreaterThan(0)
    
    // Check for font-related properties
    const hasTypographyStyles = styledTextElements.some(el =>
      Object.keys(el.styles).some(prop => 
        ['fontSize', 'fontFamily', 'fontWeight', 'color', 'lineHeight'].includes(prop)
      )
    )
    expect(hasTypographyStyles, 'WeWeb text elements should include typography styles').toBe(true)
  })
})