import { describe, it, expect } from 'vitest'
import { convertNodesToWeweb } from '../figmatocode/wewebJsonConverter'
import { htmlMain } from '../figmatocode/htmlMain'

describe('Find The Lie - Why 100% match but ugly?', () => {
  it('should expose the truth about the match', async () => {
    // Simple flex container
    const flexNode = {
      type: 'FRAME',
      name: 'Flex Test',
      visible: true,
      width: 600,
      height: 400,
      x: 0,
      y: 0,
      layoutMode: 'HORIZONTAL',
      primaryAxisAlignItems: 'CENTER',
      counterAxisAlignItems: 'CENTER',
      itemSpacing: 20,
      paddingTop: 40,
      paddingRight: 40,
      paddingBottom: 40,
      paddingLeft: 40,
      fills: [{
        type: 'SOLID',
        visible: true,
        color: { r: 0.95, g: 0.95, b: 0.97 },
        opacity: 1
      }],
      strokes: [],
      effects: [],
      cornerRadius: 8,
      constraints: { horizontal: 'MIN', vertical: 'MIN' },
      children: [
        {
          type: 'TEXT',
          name: 'Hello',
          characters: 'Hello World',
          visible: true,
          width: 100,
          height: 40,
          x: 0,
          y: 0,
          fontSize: 24,
          fontName: { family: 'Inter', style: 'Regular' },
          fills: [{
            type: 'SOLID',
            visible: true,
            color: { r: 0.2, g: 0.2, b: 0.2 },
            opacity: 1
          }],
          textAlignHorizontal: 'CENTER',
          textAlignVertical: 'CENTER',
          textAutoResize: 'WIDTH_AND_HEIGHT'
        }
      ]
    } as any
    
    const settings = {
      htmlGenerationMode: "html" as const,
      showLayerNames: true,
      embedVectors: false,
      embedImages: false
    }
    
    // Convert both
    const wewebResult = await convertNodesToWeweb([flexNode])
    const htmlResult = await htmlMain([flexNode], settings, true)
    
    console.log('\n🔍 THE LIE DETECTOR TEST\n')
    
    // Extract actual HTML output
    console.log('HTML Output:')
    console.log(htmlResult.html.substring(0, 500))
    
    // Extract styles from first div
    const divMatch = htmlResult.html.match(/<div[^>]*style="([^"]*)"/)
    if (divMatch) {
      const htmlStyles = divMatch[1].split(';').map(s => s.trim()).filter(s => s)
      console.log(`\nHTML has ${htmlStyles.length} style properties`)
      
      // Group by type
      const layoutStyles = htmlStyles.filter(s => 
        s.includes('display') || s.includes('flex') || s.includes('justify') || 
        s.includes('align') || s.includes('gap'))
      const sizeStyles = htmlStyles.filter(s => 
        s.includes('width') || s.includes('height'))
      const spacingStyles = htmlStyles.filter(s => 
        s.includes('padding') || s.includes('margin'))
      const visualStyles = htmlStyles.filter(s => 
        s.includes('background') || s.includes('border') || s.includes('radius'))
      
      console.log(`  Layout: ${layoutStyles.length} properties`)
      layoutStyles.forEach(s => console.log(`    ${s}`))
      console.log(`  Size: ${sizeStyles.length} properties`)
      console.log(`  Spacing: ${spacingStyles.length} properties`)
      console.log(`  Visual: ${visualStyles.length} properties`)
    }
    
    console.log('\n---')
    
    // WeWeb output
    const wewebStyles = wewebResult[0].styles.default
    const wewebProps = Object.entries(wewebStyles)
    console.log(`\nWeWeb has ${wewebProps.length} style properties`)
    
    const wewebLayout = wewebProps.filter(([k]) => 
      k.includes('display') || k.includes('flex') || k.includes('justify') || 
      k.includes('align') || k.includes('gap'))
    const wewebSize = wewebProps.filter(([k]) => 
      k.includes('width') || k.includes('height'))
    const wewebSpacing = wewebProps.filter(([k]) => 
      k.includes('padding') || k.includes('margin'))
    const wewebVisual = wewebProps.filter(([k]) => 
      k.includes('background') || k.includes('border') || k.includes('radius'))
    
    console.log(`  Layout: ${wewebLayout.length} properties`)
    wewebLayout.forEach(([k, v]) => console.log(`    ${k}: ${v}`))
    console.log(`  Size: ${wewebSize.length} properties`)
    console.log(`  Spacing: ${wewebSpacing.length} properties`)
    console.log(`  Visual: ${wewebVisual.length} properties`)
    
    // The REAL comparison
    console.log('\n❌ THE REAL PROBLEM:')
    
    // Check for default HTML styles
    const htmlHasBoxSizing = htmlResult.html.includes('box-sizing')
    const wewebHasBoxSizing = 'boxSizing' in wewebStyles
    
    if (htmlHasBoxSizing && !wewebHasBoxSizing) {
      console.log('  HTML has box-sizing but WeWeb doesn\'t!')
    }
    
    // Check actual flexbox rendering
    if (wewebLayout.length > 0) {
      console.log('\n  WeWeb HAS flexbox properties:')
      wewebLayout.forEach(([k, v]) => console.log(`    ${k}: ${v}`))
      console.log('\n  So why does it look ugly?')
      console.log('  Possible reasons:')
      console.log('  1. WeWeb might need explicit box-sizing: border-box')
      console.log('  2. WeWeb might need * { margin: 0; padding: 0; }')
      console.log('  3. WeWeb might render flex differently than browser')
      console.log('  4. Font styles might be missing')
    }
    
    // Check child styles
    console.log('\n📝 CHILD TEXT STYLES:')
    if (wewebResult[0].slots?.children?.[0]) {
      const textStyles = wewebResult[0].slots.children[0].styles.default
      console.log('Text element styles:', Object.keys(textStyles))
      
      const hasFont = 'fontFamily' in textStyles || 'fontSize' in textStyles
      if (!hasFont) {
        console.log('❌ Text is missing font styles!')
      }
    }
    
    expect(true).toBe(true)
  })
})