import { describe, it, expect } from 'vitest'
import { assertStyleEquivalence, validateColorEquivalence, validateSizingApproaches } from './styleComparison.test'
import fixtureData from './__fixtures__/figmaNodes/untitled-ui-landing-01.json'

/**
 * Real-world fixture testing with the huge landing page data
 */
describe('Real-World Fixture Style Coherence', () => {
  it('should analyze the landing page fixture structure', () => {
    console.log('\n=== FIXTURE ANALYSIS ===')
    console.log('Root node:', fixtureData.name)
    console.log('Type:', fixtureData.type)
    console.log('Dimensions:', `${fixtureData.width}x${fixtureData.height}`)
    console.log('Layout mode:', fixtureData.layoutMode)
    console.log('Children count:', fixtureData.children?.length || 0)
    
    const analysis = analyzeFixtureStructure(fixtureData)
    console.log('\n=== STRUCTURE ANALYSIS ===')
    console.log('Total nodes:', analysis.totalNodes)
    console.log('Max depth:', analysis.maxDepth)
    console.log('Node types:', Array.from(analysis.nodeTypes).join(', '))
    console.log('Has text nodes:', analysis.hasText)
    console.log('Has layout nodes:', analysis.hasLayout)
    console.log('Has potential images:', analysis.hasImages)
    
    expect(analysis.totalNodes).toBeGreaterThan(100) // Should be a complex structure
    expect(analysis.nodeTypes.size).toBeGreaterThan(2) // Should have multiple node types
  })

  it('should test style coherence on the root landing page frame', async () => {
    console.log('\n=== TESTING ROOT FRAME ===')
    
    const result = await assertStyleEquivalence(fixtureData, 'Landing Page Root')
    
    expect(result.success).toBe(true)
    expect(result.wewebResult).toHaveLength(1)
    expect(result.wewebResult[0].tag).toBe('ww-div')
    
    // Validate the layout properties since this is a vertical layout frame
    console.log('Root frame converted to:', result.wewebResult[0].tag)
    console.log('WeWeb styles captured:', Object.keys(result.wewebStyles))
    console.log('HTML styles captured:', Object.keys(result.htmlStyles))
    
    // Check for layout-related styles
    const layoutProps = ['display', 'flexDirection', 'alignItems', 'justifyContent', 'gap']
    const hasLayoutStyles = layoutProps.some(prop => 
      result.wewebStyles[prop] || result.htmlStyles[prop]
    )
    
    console.log('Has layout styles:', hasLayoutStyles)
    
    // Validate sizing approaches
    validateSizingApproaches(result.htmlStyles, result.wewebStyles, 'Landing Page Root')
  })

  it('should test style coherence on a child hero section', async () => {
    console.log('\n=== TESTING HERO SECTION ===')
    
    const heroSection = fixtureData.children?.[0] // "Hero header section"
    if (!heroSection) {
      console.log('No hero section found in fixture')
      return
    }
    
    console.log('Testing:', heroSection.name)
    console.log('Type:', heroSection.type)
    console.log('Dimensions:', `${heroSection.width}x${heroSection.height}`)
    
    const result = await assertStyleEquivalence(heroSection, 'Hero Section')
    
    expect(result.success).toBe(true)
    
    // Since this is an INSTANCE, it should be converted to ww-div
    expect(result.wewebResult[0].tag).toBe('ww-div')
    
    console.log('Comparison results:')
    if (result.comparison) {
      console.log('✅ Matching:', result.comparison.matching)
      console.log('⚠️  Different:', result.comparison.differing.map(d => `${d.prop}: ${d.html} vs ${d.weweb}`))
      console.log('📝 HTML-only:', result.comparison.htmlOnly)
      console.log('📝 WeWeb-only:', result.comparison.wewebOnly)
    }
  })

  it('should test performance with deep nested elements', async () => {
    console.log('\n=== PERFORMANCE TEST ===')
    
    // Find a deeply nested element to test
    const deepElement = findDeepestElement(fixtureData, 5) // At least 5 levels deep
    
    if (!deepElement) {
      console.log('No deep element found for performance testing')
      return
    }
    
    console.log('Testing deep element:', deepElement.name)
    console.log('Type:', deepElement.type)
    
    const startTime = Date.now()
    
    const result = await assertStyleEquivalence(deepElement, 'Deep Nested Element')
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    console.log(`Conversion time: ${duration}ms`)
    
    expect(result.success).toBe(true)
    expect(duration).toBeLessThan(5000) // Should complete within 5 seconds for a single element
  })

  it('should test text elements from the fixture', async () => {
    console.log('\n=== TESTING TEXT ELEMENTS ===')
    
    // Find text elements in the fixture
    const textElements = findElementsByType(fixtureData, 'TEXT').slice(0, 3) // Test first 3 text elements
    
    if (textElements.length === 0) {
      console.log('No text elements found in fixture')
      return
    }
    
    console.log(`Found ${textElements.length} text elements to test`)
    
    for (const textElement of textElements) {
      console.log(`\nTesting text: "${textElement.characters || textElement.name}"`)
      
      const result = await assertStyleEquivalence(textElement, `Text: ${textElement.name}`)
      
      expect(result.success).toBe(true)
      expect(result.wewebResult[0].tag).toBe('ww-text')
      
      // Check if text content is preserved
      if (textElement.characters && result.wewebResult[0].props?.default?.text) {
        expect(result.wewebResult[0].props.default.text).toBe(textElement.characters)
      }
    }
  })

  it('should validate consistent color handling across multiple elements', async () => {
    console.log('\n=== COLOR CONSISTENCY TEST ===')
    
    // Find elements with different types that might have colors
    const coloredElements = findElementsWithPotentialColors(fixtureData).slice(0, 5)
    
    if (coloredElements.length === 0) {
      console.log('No colored elements found in fixture')
      return
    }
    
    console.log(`Testing color consistency across ${coloredElements.length} elements`)
    
    for (const element of coloredElements) {
      const result = await assertStyleEquivalence(element, `Color Test: ${element.name}`)
      
      if (result.success) {
        // Test color consistency if both conversions have background colors
        validateColorEquivalence(result.htmlStyles, result.wewebStyles, element.name)
        
        console.log(`${element.name} (${element.type}):`)
        console.log('  WeWeb colors:', Object.entries(result.wewebStyles).filter(([key]) => 
          key.includes('color') || key.includes('background')
        ))
        console.log('  HTML colors:', Object.entries(result.htmlStyles).filter(([key]) => 
          key.includes('color') || key.includes('background')
        ))
      }
    }
  })
})

/**
 * Helper functions for fixture analysis
 */
function analyzeFixtureStructure(fixture: any) {
  const analysis = {
    totalNodes: 0,
    nodeTypes: new Set<string>(),
    maxDepth: 0,
    hasText: false,
    hasLayout: false,
    hasImages: false
  }

  function traverse(node: any, depth: number = 0) {
    analysis.totalNodes++
    analysis.nodeTypes.add(node.type)
    analysis.maxDepth = Math.max(analysis.maxDepth, depth)
    
    if (node.type === 'TEXT') analysis.hasText = true
    if (node.layoutMode && node.layoutMode !== 'NONE') analysis.hasLayout = true
    if (node.type === 'RECTANGLE' || node.type === 'INSTANCE') analysis.hasImages = true
    
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        traverse(child, depth + 1)
      }
    }
  }

  traverse(fixture)
  return analysis
}

function findDeepestElement(node: any, minDepth: number, currentDepth: number = 0): any {
  if (currentDepth >= minDepth) {
    return node
  }
  
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      const deepElement = findDeepestElement(child, minDepth, currentDepth + 1)
      if (deepElement) return deepElement
    }
  }
  
  return null
}

function findElementsByType(node: any, type: string): any[] {
  const elements: any[] = []
  
  function traverse(n: any) {
    if (n.type === type) {
      elements.push(n)
    }
    
    if (n.children && Array.isArray(n.children)) {
      for (const child of n.children) {
        traverse(child)
      }
    }
  }
  
  traverse(node)
  return elements
}

function findElementsWithPotentialColors(node: any): any[] {
  const elements: any[] = []
  
  function traverse(n: any) {
    // Elements that might have colors: frames, rectangles, text, etc.
    if (['FRAME', 'RECTANGLE', 'TEXT', 'INSTANCE', 'COMPONENT'].includes(n.type)) {
      elements.push(n)
    }
    
    if (n.children && Array.isArray(n.children)) {
      for (const child of n.children) {
        traverse(child)
      }
    }
  }
  
  traverse(node)
  return elements
}