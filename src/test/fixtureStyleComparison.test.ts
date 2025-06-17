import { describe, it, expect } from 'vitest'
import { assertStyleEquivalence } from './styleComparison.test'

/**
 * Test style coherence using real Figma fixture data
 * This test is designed to work with actual Figma node data that you've copied
 */
describe('Fixture Style Coherence Tests', () => {
  it('should test style coherence with your imported fixture data', async () => {
    // Replace this with your actual fixture data that you copied from Figma
    // You can paste the JSON data from your clipboard here, or load it from a file
    
    const yourFixtureData = {
      // PASTE YOUR FIXTURE DATA HERE
      // This should be the raw Figma node tree you copied with the "Copy Raw Figma Node Tree" button
      
      // For now, I'll use a placeholder - replace this with your actual data
      id: "fixture-test",
      name: "Your Fixture Name",
      type: "FRAME",
      visible: true,
      width: 400,
      height: 300,
      children: [
        {
          id: "child-1",
          name: "Child Element",
          type: "TEXT",
          characters: "Sample Text",
          fontSize: 16,
          width: 200,
          height: 24
        }
      ]
    }

    // Test the coherence with your fixture data
    if (yourFixtureData.id === "fixture-test") {
      console.log("⚠️  Please replace the placeholder fixture data with your actual data")
      console.log("   Copy your Figma node tree and paste it in this test file")
      // Skip the test if using placeholder data
      return
    }

    const result = await assertStyleEquivalence(yourFixtureData, 'Your Fixture')
    
    expect(result.success).toBe(true)
    
    // Log detailed comparison results
    console.log('\n=== FIXTURE STYLE COHERENCE RESULTS ===')
    console.log('Node:', yourFixtureData.name)
    console.log('Type:', yourFixtureData.type)
    console.log('WeWeb Element Tag:', result.wewebResult?.[0]?.tag)
    
    if (result.comparison) {
      console.log('\nStyle Comparison:')
      console.log('✅ Matching properties:', result.comparison.matching)
      console.log('⚠️  Differing properties:', result.comparison.differing)
      console.log('📝 HTML-only properties:', result.comparison.htmlOnly)
      console.log('📝 WeWeb-only properties:', result.comparison.wewebOnly)
    }

    // Validate that both conversions produced output
    expect(result.wewebResult, 'WeWeb conversion should produce results').toBeTruthy()
    expect(result.htmlResult, 'HTML conversion should produce results').toBeTruthy()
    
    // Check for critical styling consistency
    if (result.htmlStyles.background && result.wewebStyles.background) {
      expect(
        result.htmlStyles.background,
        'Background colors should match between conversions'
      ).toBe(result.wewebStyles.background)
    }
  })

  it('should handle complex nested fixture structures', async () => {
    // This test can handle more complex nested structures from your fixture
    
    const complexFixtureData = {
      // PASTE A COMPLEX NESTED STRUCTURE HERE
      // This could be a frame with multiple children, layout properties, etc.
      
      id: "complex-fixture-test",
      name: "Complex Fixture",
      type: "FRAME",
      visible: true,
      width: 800,
      height: 600,
      children: []
    }

    if (complexFixtureData.id === "complex-fixture-test") {
      console.log("⚠️  Please replace the placeholder with your complex fixture data")
      return
    }

    const result = await assertStyleEquivalence(complexFixtureData, 'Complex Fixture')
    
    expect(result.success).toBe(true)
    
    // Test that complex layouts are handled properly
    const hasLayoutStyles = Object.keys(result.wewebStyles).some(key => 
      ['display', 'flexDirection', 'padding', 'gap', 'alignItems', 'justifyContent'].includes(key)
    ) || Object.keys(result.htmlStyles).some(key => 
      ['display', 'flexDirection', 'padding', 'gap', 'alignItems', 'justifyContent'].includes(key)
    )
    
    console.log('Has layout-related styles:', hasLayoutStyles)
    
    // Document the layout approach differences
    console.log('\n=== COMPLEX LAYOUT ANALYSIS ===')
    console.log('WeWeb approach captures:', Object.keys(result.wewebStyles))
    console.log('HTML approach captures:', Object.keys(result.htmlStyles))
  })

  it('should test performance with large fixture trees', async () => {
    // Performance test with your large fixture
    
    const largeFixtureData = {
      // PASTE YOUR LARGE FIXTURE DATA HERE if you want to test performance
      id: "performance-test",
      name: "Performance Test",
      type: "FRAME",
      children: []
    }

    if (largeFixtureData.id === "performance-test") {
      console.log("⚠️  Skipping performance test - no large fixture data provided")
      return
    }

    const startTime = Date.now()
    
    const result = await assertStyleEquivalence(largeFixtureData, 'Large Fixture Performance Test')
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    console.log(`\n=== PERFORMANCE RESULTS ===`)
    console.log(`Total conversion time: ${duration}ms`)
    console.log(`Node count: ${countNodes(largeFixtureData)}`)
    console.log(`Average time per node: ${(duration / countNodes(largeFixtureData)).toFixed(2)}ms`)
    
    expect(result.success).toBe(true)
    expect(duration).toBeLessThan(10000) // Should complete within 10 seconds
  })
})

/**
 * Helper function to count total nodes in a tree
 */
function countNodes(node: any): number {
  let count = 1
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      count += countNodes(child)
    }
  }
  return count
}

/**
 * Helper function to analyze fixture data structure
 */
export function analyzeFixtureStructure(fixture: any) {
  const analysis = {
    totalNodes: countNodes(fixture),
    nodeTypes: new Set<string>(),
    maxDepth: 0,
    hasText: false,
    hasImages: false,
    hasLayout: false
  }

  function traverse(node: any, depth: number = 0) {
    analysis.nodeTypes.add(node.type)
    analysis.maxDepth = Math.max(analysis.maxDepth, depth)
    
    if (node.type === 'TEXT') analysis.hasText = true
    if (node.type === 'RECTANGLE' && node.fills) analysis.hasImages = true
    if (node.layoutMode && node.layoutMode !== 'NONE') analysis.hasLayout = true
    
    if (node.children) {
      for (const child of node.children) {
        traverse(child, depth + 1)
      }
    }
  }

  traverse(fixture)
  
  return analysis
}