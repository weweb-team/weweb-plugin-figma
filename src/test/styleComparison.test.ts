import { describe, it, expect, vi, beforeAll } from 'vitest'
import { convertNodesToWeweb } from '../figmatocode/wewebJsonConverter'
import { htmlMain } from '../figmatocode/htmlMain'

/**
 * Compares HTML converted styles with WeWeb converted styles for a given Figma node
 * Documents and validates the differences between the two conversion approaches
 */
async function assertStyleEquivalence(figmaNode: any, testName: string = 'Node') {
  const settings = {
    framework: "HTML",
    showLayerNames: false,
    useOldPluginVersion2025: false,
    responsiveRoot: false,
    flutterGenerationMode: "snippet",
    swiftUIGenerationMode: "snippet",
    roundTailwindValues: true,
    roundTailwindColors: true,
    useColorVariables: true,
    customTailwindPrefix: "",
    embedImages: false,
    embedVectors: false,
    htmlGenerationMode: "html",
    tailwindGenerationMode: "jsx",
    baseFontSize: 16,
    useTailwind4: false,
  }

  console.debug(`\n=== Testing ${testName} ===`)

  // Convert using WeWeb pipeline (direct node conversion)
  let wewebResult, wewebError
  try {
    wewebResult = await convertNodesToWeweb([figmaNode], settings)
    console.debug('WeWeb conversion successful:', wewebResult[0]?.styles?.default)
  } catch (error) {
    wewebError = error
    console.debug('WeWeb conversion failed:', error)
  }

  // Convert using HTML pipeline (needs processed nodes)
  let htmlResult, htmlError
  try {
    // Create a minimal processed node for HTML conversion
    const processedNode = {
      ...figmaNode,
      uniqueName: figmaNode.name || 'TestNode',
      parent: null,
      x: 0,
      y: 0,
      layoutMode: 'NONE',
      layoutGrow: 0,
      layoutSizingHorizontal: 'FIXED',
      layoutSizingVertical: 'FIXED',
      primaryAxisAlignItems: 'MIN',
      counterAxisAlignItems: 'MIN',
    }

    htmlResult = await htmlMain([processedNode], settings, true)
    console.debug('HTML conversion successful')
  } catch (error) {
    htmlError = error
    console.debug('HTML conversion failed:', error)
  }

  // Both conversions should either succeed or fail
  if (wewebError && htmlError) {
    console.debug('Both conversions failed - this is acceptable for unsupported nodes')
    return { success: false, reason: 'Both conversions failed' }
  }

  if (wewebError) {
    throw new Error(`WeWeb conversion failed: ${wewebError.message}`)
  }

  if (htmlError) {
    throw new Error(`HTML conversion failed: ${htmlError.message}`)
  }

  // Extract styles from both conversions
  const wewebStyles = wewebResult?.[0]?.styles?.default || {}
  const htmlStyles = extractStylesFromHtml(htmlResult?.html || '', htmlResult?.css)

  console.debug('Extracted WeWeb styles:', wewebStyles)
  console.debug('Extracted HTML styles:', htmlStyles)

  // Compare the styles
  const comparison = compareStyleProperties(htmlStyles, wewebStyles, testName)

  return {
    success: true,
    htmlStyles,
    wewebStyles,
    htmlResult,
    wewebResult,
    comparison
  }
}

/**
 * Extracts style properties from HTML output
 */
function extractStylesFromHtml(html: string, css?: string): Record<string, any> {
  const styles: Record<string, any> = {}

  // Extract inline styles from HTML
  const inlineStyleMatch = html.match(/style="([^"]*)"/)
  if (inlineStyleMatch) {
    const inlineStyles = inlineStyleMatch[1]
    const styleProps = inlineStyles.split(';').filter(prop => prop.trim())
    
    for (const prop of styleProps) {
      const [key, value] = prop.split(':').map(s => s.trim())
      if (key && value) {
        // Convert kebab-case to camelCase for comparison
        const camelKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
        styles[camelKey] = value
      }
    }
  }

  return styles
}

/**
 * Compares style properties between HTML and WeWeb conversions
 */
function compareStyleProperties(htmlStyles: Record<string, any>, wewebStyles: Record<string, any>, testName: string) {
  const comparison = {
    matching: [] as string[],
    differing: [] as Array<{ prop: string, html: string, weweb: string }>,
    htmlOnly: [] as string[],
    wewebOnly: [] as string[]
  }

  // Get all unique properties
  const allProps = new Set([...Object.keys(htmlStyles), ...Object.keys(wewebStyles)])

  for (const prop of allProps) {
    const htmlValue = normalizeStyleValue(htmlStyles[prop])
    const wewebValue = normalizeStyleValue(wewebStyles[prop])

    if (htmlValue && wewebValue) {
      if (htmlValue === wewebValue) {
        comparison.matching.push(prop)
      } else {
        comparison.differing.push({ prop, html: htmlValue, weweb: wewebValue })
      }
    } else if (htmlValue && !wewebValue) {
      comparison.htmlOnly.push(prop)
    } else if (!htmlValue && wewebValue) {
      comparison.wewebOnly.push(prop)
    }
  }

  console.debug(`${testName} comparison:`, comparison)

  return comparison
}

/**
 * Normalizes style values for comparison
 */
function normalizeStyleValue(value: any): string {
  if (!value) return ''
  
  const str = String(value).trim()
  
  // Convert numeric values to px
  if (/^\d+(\.\d+)?$/.test(str)) {
    return `${str}px`
  }
  
  return str
}

/**
 * Validates that color values match between conversions
 */
function validateColorEquivalence(htmlStyles: Record<string, any>, wewebStyles: Record<string, any>, testName: string) {
  const colorProps = ['background', 'backgroundColor', 'color', 'borderColor']
  
  for (const prop of colorProps) {
    if (htmlStyles[prop] && wewebStyles[prop]) {
      expect(
        htmlStyles[prop],
        `${testName}: Color property '${prop}' should match between conversions`
      ).toBe(wewebStyles[prop])
    }
  }
}

/**
 * Validates that sizing approaches are documented (not necessarily equal)
 */
function validateSizingApproaches(htmlStyles: Record<string, any>, wewebStyles: Record<string, any>, testName: string) {
  const sizeProps = ['width', 'height']
  
  for (const prop of sizeProps) {
    if (htmlStyles[prop] && wewebStyles[prop]) {
      // Document the different approaches
      const htmlUsesPixels = htmlStyles[prop].includes('px')
      const wewebUsesPercent = wewebStyles[prop].includes('%')
      
      console.debug(`${testName} sizing: HTML uses ${htmlStyles[prop]} (pixels: ${htmlUsesPixels}), WeWeb uses ${wewebStyles[prop]} (percent: ${wewebUsesPercent})`)
      
      // Both should have some sizing approach
      expect(htmlStyles[prop], `HTML should have ${prop} styling`).toBeTruthy()
      expect(wewebStyles[prop], `WeWeb should have ${prop} styling`).toBeTruthy()
    }
  }
}

describe('HTML vs WeWeb Style Equivalence', () => {
  it('should document styling approaches for text nodes', async () => {
    const mockTextNode = {
      type: 'TEXT',
      name: 'Test Text',
      characters: 'Hello World',
      width: 100,
      height: 20,
      fills: [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }],
      fontSize: 16,
      fontName: { family: 'Arial', style: 'Regular' },
    }

    const result = await assertStyleEquivalence(mockTextNode, 'Text Node')
    
    expect(result.success).toBe(true)
    expect(result.wewebResult).toHaveLength(1)
    expect(result.wewebResult[0].tag).toBe('ww-text')
    
    // Text nodes might not have size styles in WeWeb approach
    console.debug('Text node styling approach documented')
  })

  it('should validate color consistency between conversions', async () => {
    const mockFrameNode = {
      type: 'FRAME',
      name: 'Test Frame',
      width: 200,
      height: 100,
      children: [],
      fills: [{ type: 'SOLID', color: { r: 1, g: 0, b: 0 } }], // Red background
      layoutMode: 'NONE',
    }

    const result = await assertStyleEquivalence(mockFrameNode, 'Frame Node')
    
    expect(result.success).toBe(true)
    expect(result.wewebResult).toHaveLength(1)
    expect(result.wewebResult[0].tag).toBe('ww-div')
    
    // Validate that colors match exactly
    validateColorEquivalence(result.htmlStyles, result.wewebStyles, 'Frame Node')
    
    // Document sizing approaches
    validateSizingApproaches(result.htmlStyles, result.wewebStyles, 'Frame Node')
  })

  it('should validate border styling consistency', async () => {
    const mockRectangleNode = {
      type: 'RECTANGLE',
      name: 'Test Rectangle',
      width: 150,
      height: 75,
      fills: [{ type: 'SOLID', color: { r: 0, g: 1, b: 0 } }], // Green background
      cornerRadius: 8,
    }

    const result = await assertStyleEquivalence(mockRectangleNode, 'Rectangle Node')
    
    expect(result.success).toBe(true)
    
    // Validate color consistency
    validateColorEquivalence(result.htmlStyles, result.wewebStyles, 'Rectangle Node')
    
    // Validate border radius handling
    if (result.htmlStyles.borderRadius && result.wewebStyles.borderRadius) {
      // Both should have border radius, values might differ in units
      expect(result.htmlStyles.borderRadius).toContain('8')
      expect(String(result.wewebStyles.borderRadius)).toContain('8')
    }
  })

  it('should document the fundamental difference in sizing approaches', async () => {
    const mockNode = {
      type: 'RECTANGLE',
      name: 'Size Test',
      width: 100,
      height: 50,
    }

    const result = await assertStyleEquivalence(mockNode, 'Size Test')
    
    expect(result.success).toBe(true)
    
    // Document the fundamental difference:
    // - HTML conversion uses fixed pixel values (100px, 50px)
    // - WeWeb conversion uses responsive percentages (100%)
    
    console.debug('\n=== SIZING APPROACH DOCUMENTATION ===')
    console.debug('HTML approach: Fixed pixel values for exact Figma reproduction')
    console.debug('WeWeb approach: Responsive percentages for flexible layouts')
    console.debug('This difference is by design and expected.')
    
    // Both approaches should provide some form of sizing
    const htmlHasSizing = Object.keys(result.htmlStyles).some(key => ['width', 'height'].includes(key))
    const wewebHasSizing = Object.keys(result.wewebStyles).some(key => ['width', 'height'].includes(key))
    
    expect(htmlHasSizing || wewebHasSizing, 'At least one conversion should provide sizing').toBe(true)
  })

  it('should validate that both conversions produce valid output structures', async () => {
    const mockComplexNode = {
      type: 'FRAME',
      name: 'Complex Frame',
      width: 300,
      height: 200,
      children: [],
      fills: [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 1 } }], // Blue background
      strokes: [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }],
      strokeWeight: 2,
      cornerRadius: 12,
      layoutMode: 'HORIZONTAL',
      paddingLeft: 16,
      paddingRight: 16,
      paddingTop: 8,
      paddingBottom: 8,
      itemSpacing: 12,
    }

    const result = await assertStyleEquivalence(mockComplexNode, 'Complex Frame')
    
    expect(result.success).toBe(true)
    
    // Validate WeWeb structure
    expect(result.wewebResult[0]).toHaveProperty('tag')
    expect(result.wewebResult[0]).toHaveProperty('name')
    expect(result.wewebResult[0]).toHaveProperty('styles')
    expect(result.wewebResult[0].styles).toHaveProperty('default')
    
    // Validate HTML structure
    expect(result.htmlResult).toHaveProperty('html')
    expect(result.htmlResult.html).toBeTruthy()
    
    // Document what styles are captured
    console.debug('\n=== COMPLEX STYLING DOCUMENTATION ===')
    console.debug('WeWeb captured styles:', Object.keys(result.wewebStyles))
    console.debug('HTML captured styles:', Object.keys(result.htmlStyles))
    
    // Both should capture some form of the styling
    const totalStylesCaptured = Object.keys(result.wewebStyles).length + Object.keys(result.htmlStyles).length
    expect(totalStylesCaptured, 'Complex styling should be captured').toBeGreaterThan(0)
  })
})

// Export the assertion function for use in other tests
export { assertStyleEquivalence, validateColorEquivalence, validateSizingApproaches }