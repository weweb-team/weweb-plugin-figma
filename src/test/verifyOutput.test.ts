import { describe, it, expect } from 'vitest'
import { convertNodesToWewebV2 } from '../figmatocode/wewebJsonConverterV2'
import { htmlMain } from '../figmatocode/htmlMain'

describe('Verify WeWeb Output', () => {
  it('should generate beautiful WeWeb JSON like HTML', async () => {
    // Simple test node
    const testNode = {
      id: '1:1',
      name: 'Desktop',
      type: 'FRAME' as const,
      visible: true,
      width: 1440,
      height: 960,
      x: 0,
      y: 0,
      layoutMode: 'HORIZONTAL' as const,
      primaryAxisAlignItems: 'MIN' as const,
      counterAxisAlignItems: 'MIN' as const,
      itemSpacing: 0,
      fills: [{
        type: 'SOLID' as const,
        visible: true,
        color: { r: 1, g: 1, b: 1 },
        opacity: 1
      }],
      strokes: [],
      effects: [],
      children: []
    } as any
    
    const settings = {
      htmlGenerationMode: "html" as const,
      showLayerNames: true,
      embedVectors: false,
      embedImages: false
    }
    
    // Convert to both formats
    const wewebResult = await convertNodesToWewebV2([testNode], settings, true)
    const htmlResult = await htmlMain([testNode], settings, true)
    
    console.log('\n🎨 FINAL OUTPUT COMPARISON\n')
    
    // Show HTML output
    console.log('HTML Output:')
    console.log(htmlResult.html.substring(0, 200) + '...')
    
    // Show WeWeb output
    console.log('\nWeWeb JSON Output:')
    console.log(JSON.stringify(wewebResult[0], null, 2))
    
    // Check critical properties
    const wewebStyles = wewebResult[0].styles.default
    
    console.log('\n✅ KEY IMPROVEMENTS:')
    console.log(`1. Width: ${wewebStyles.width} (should be "100%" for root)`)
    console.log(`2. Height: ${wewebStyles.height} (should be "100%" for root)`)
    console.log(`3. Position: ${wewebStyles.position || 'not set'} (should not be "absolute" for root)`)
    console.log(`4. Display: ${wewebStyles.display || 'not set'} (should have flexbox)`)
    console.log(`5. Background: ${wewebStyles.background || 'not set'}`)
    
    // Verify root node has responsive sizing
    expect(wewebStyles.width).toBe('100%')
    expect(wewebStyles.height).toBe('100%')
    
    // Should not have absolute positioning
    expect(wewebStyles.position).not.toBe('absolute')
    expect(wewebStyles.left).toBeUndefined()
    expect(wewebStyles.top).toBeUndefined()
    
    // Should have flexbox
    expect(wewebStyles.display).toMatch(/flex/)
  })
})