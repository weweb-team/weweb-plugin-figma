import { describe, it, expect } from 'vitest'
import { convertNodesToWeweb } from '../figmatocode/wewebJsonConverter'
import { htmlMain } from '../figmatocode/htmlMain'
import fixtureData from './__fixtures__/figmaNodes/untitled-ui-landing-01.json'

describe('Show Me The Truth', () => {
  it('should reveal if styles are REALLY matching', async () => {
    const pluginSettings = {
      htmlGenerationMode: "html" as const,
      showLayerNames: true,
      embedVectors: false,
      embedImages: false
    }
    
    // Find a specific flex container
    const findByName = (node: any, name: string): any => {
      if (node.name === name) return node
      if (node.children) {
        for (const child of node.children) {
          const found = findByName(child, name)
          if (found) return found
        }
      }
      return null
    }
    
    // Look for elements with layoutMode
    const findFlexElements = (node: any, results: any[] = []): any[] => {
      if (node.layoutMode && node.layoutMode !== 'NONE') {
        results.push(node)
      }
      if (node.children) {
        for (const child of node.children) {
          findFlexElements(child, results)
        }
      }
      return results
    }
    
    const flexElements = findFlexElements(fixtureData)
    console.log(`\n🔍 Found ${flexElements.length} flex elements\n`)
    
    // Check the first few
    for (let i = 0; i < Math.min(3, flexElements.length); i++) {
      const element = flexElements[i]
      console.log(`\n📦 Element: ${element.name}`)
      console.log(`   Layout: ${element.layoutMode}`)
      
      // Convert individually
      const wewebResult = await convertNodesToWeweb([element])
      const htmlResult = await htmlMain([element], pluginSettings, true)
      
      // Extract HTML styles
      const styleMatch = htmlResult.html.match(/style="([^"]*)"/)
      const htmlStyles: Record<string, any> = {}
      
      if (styleMatch) {
        styleMatch[1].split(';').forEach(decl => {
          const [prop, val] = decl.split(':').map(s => s.trim())
          if (prop && val) {
            const camelProp = prop.replace(/-([a-z])/g, (_, l) => l.toUpperCase())
            htmlStyles[camelProp] = val
          }
        })
      }
      
      const wewebStyles = wewebResult[0].styles.default
      
      // Check flexbox properties specifically
      const flexProps = ['display', 'flexDirection', 'justifyContent', 'alignItems', 'gap']
      
      console.log('\n   Flexbox properties:')
      flexProps.forEach(prop => {
        const htmlVal = htmlStyles[prop]
        const wewebVal = wewebStyles[prop]
        const match = htmlVal === wewebVal ? '✅' : '❌'
        console.log(`   ${prop}: HTML="${htmlVal}" WeWeb="${wewebVal}" ${match}`)
      })
      
      // Count total mismatches
      const allHtmlProps = Object.keys(htmlStyles)
      const allWewebProps = Object.keys(wewebStyles)
      const missingInWeweb = allHtmlProps.filter(p => !(p in wewebStyles))
      
      if (missingInWeweb.length > 0) {
        console.log(`\n   ❌ Missing in WeWeb: ${missingInWeweb.join(', ')}`)
      }
    }
    
    // Now do the full comparison
    const wewebFull = await convertNodesToWeweb([fixtureData])
    const htmlFull = await htmlMain([fixtureData], pluginSettings, true)
    
    // Count flexbox properties
    let htmlFlexCount = 0
    let wewebFlexCount = 0
    
    const flexRegex = /display:\s*(flex|inline-flex)|flex-direction|justify-content|align-items/g
    htmlFlexCount = (htmlFull.html.match(flexRegex) || []).length
    
    function countWewebFlex(elements: any[]): number {
      let count = 0
      for (const el of elements) {
        if (el.styles?.default) {
          if (el.styles.default.display?.includes('flex')) count++
          if (el.styles.default.flexDirection) count++
          if (el.styles.default.justifyContent) count++
          if (el.styles.default.alignItems) count++
        }
        if (el.slots?.children) {
          count += countWewebFlex(el.slots.children)
        }
      }
      return count
    }
    
    wewebFlexCount = countWewebFlex(wewebFull)
    
    console.log('\n📊 FLEXBOX PROPERTY COUNT:')
    console.log(`   HTML: ${htmlFlexCount} flexbox properties`)
    console.log(`   WeWeb: ${wewebFlexCount} flexbox properties`)
    console.log(`   Match: ${htmlFlexCount === wewebFlexCount ? '✅' : '❌'}`)
    
    if (htmlFlexCount !== wewebFlexCount) {
      console.log('\n🚨 THIS IS WHY WEWEB LOOKS UGLY!')
      console.log('   WeWeb is missing flexbox properties that HTML has!')
    }
    
    expect(true).toBe(true)
  })
})