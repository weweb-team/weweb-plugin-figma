import { describe, it, expect } from 'vitest'
import { convertNodesToWeweb } from '../figmatocode/wewebJsonConverter'
import { htmlMain } from '../figmatocode/htmlMain'

describe('Debug Ugly WeWeb', () => {
  it('should find why WeWeb lacks display:flex', async () => {
    // Create a simple flexbox container
    const flexNode = {
      type: 'FRAME',
      name: 'Flex Container',
      visible: true,
      width: 500,
      height: 300,
      x: 0,
      y: 0,
      layoutMode: 'HORIZONTAL', // This should trigger flexbox
      primaryAxisAlignItems: 'CENTER',
      counterAxisAlignItems: 'CENTER',
      itemSpacing: 20,
      paddingTop: 16,
      paddingRight: 16,
      paddingBottom: 16,
      paddingLeft: 16,
      fills: [{
        type: 'SOLID',
        visible: true,
        color: { r: 0.9, g: 0.9, b: 0.9 },
        opacity: 1
      }],
      strokes: [],
      effects: [],
      cornerRadius: 8,
      constraints: {
        horizontal: 'MIN',
        vertical: 'MIN'
      },
      children: []
    } as any
    
    const settings = {
      htmlGenerationMode: "html" as const,
      showLayerNames: true,
      embedVectors: false,
      embedImages: false
    }
    
    console.log('\n🔍 DEBUGGING FLEXBOX STYLES\n')
    
    // Convert to HTML
    const htmlResult = await htmlMain([flexNode], settings, true)
    console.log('HTML output:')
    console.log(htmlResult.html)
    
    // Extract HTML styles
    const styleMatch = htmlResult.html.match(/style="([^"]*)"/)
    if (styleMatch) {
      console.log('\nHTML styles (parsed):')
      const styles = styleMatch[1].split(';').filter(s => s.trim())
      styles.forEach(s => console.log(`  ${s.trim()}`))
      
      // Check for flexbox properties
      const hasDisplay = styles.some(s => s.includes('display'))
      const hasFlexDirection = styles.some(s => s.includes('flex-direction'))
      const hasJustifyContent = styles.some(s => s.includes('justify-content'))
      const hasAlignItems = styles.some(s => s.includes('align-items'))
      
      console.log('\nHTML Flexbox properties:')
      console.log(`  display: ${hasDisplay ? '✅' : '❌'}`)
      console.log(`  flex-direction: ${hasFlexDirection ? '✅' : '❌'}`)
      console.log(`  justify-content: ${hasJustifyContent ? '✅' : '❌'}`)
      console.log(`  align-items: ${hasAlignItems ? '✅' : '❌'}`)
    }
    
    // Convert to WeWeb
    const wewebResult = await convertNodesToWeweb([flexNode])
    console.log('\nWeWeb output:')
    console.log(JSON.stringify(wewebResult[0], null, 2))
    
    const wewebStyles = wewebResult[0].styles.default
    console.log('\nWeWeb Flexbox properties:')
    console.log(`  display: ${wewebStyles.display || '❌ MISSING'}`)
    console.log(`  flexDirection: ${wewebStyles.flexDirection || '❌ MISSING'}`)
    console.log(`  justifyContent: ${wewebStyles.justifyContent || '❌ MISSING'}`)
    console.log(`  alignItems: ${wewebStyles.alignItems || '❌ MISSING'}`)
    
    // The real problem
    if (!wewebStyles.display) {
      console.log('\n🚨 PROBLEM FOUND: WeWeb is missing display:flex!')
      console.log('This is why it looks ugly - without display:flex, none of the flexbox properties work!')
    }
    
    // Check if display is flex or inline-flex
    expect(wewebStyles.display).toMatch(/flex/) // Should contain 'flex'
  })
})