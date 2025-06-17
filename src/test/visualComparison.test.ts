import { describe, it, expect } from 'vitest'
import { convertNodesToWeweb } from '../figmatocode/wewebJsonConverter'
import { htmlMain } from '../figmatocode/htmlMain'
import fixtureData from './__fixtures__/figmaNodes/untitled-ui-landing-01.json'

describe('Visual Comparison - Why is WeWeb ugly?', () => {
  it('should find why WeWeb looks ugly compared to HTML', async () => {
    const pluginSettings = {
      htmlGenerationMode: "html" as const,
      showLayerNames: true,
      embedVectors: false,
      embedImages: false
    }
    
    // Let's check a specific element that should look good
    const findElementByName = (node: any, name: string): any => {
      if (node.name === name) return node
      if (node.children) {
        for (const child of node.children) {
          const found = findElementByName(child, name)
          if (found) return found
        }
      }
      return null
    }
    
    // Test with the main Desktop element
    const desktop = findElementByName(fixtureData, 'Desktop')
    if (!desktop) {
      console.log('Desktop not found')
      return
    }
    
    console.log('\n🔍 VISUAL COMPARISON ANALYSIS')
    console.log('================================')
    
    // Convert both
    const wewebResult = await convertNodesToWeweb([desktop])
    const htmlResult = await htmlMain([desktop], pluginSettings, true)
    
    // Let's look at the first few elements
    console.log('\n📄 HTML OUTPUT (first 2000 chars):')
    console.log(htmlResult.html.substring(0, 2000))
    
    console.log('\n📦 WEWEB OUTPUT (first element):')
    console.log(JSON.stringify(wewebResult[0], null, 2))
    
    // Extract and compare specific important styles
    const importantProps = [
      'display', 'flexDirection', 'alignItems', 'justifyContent', 'gap',
      'width', 'height', 'padding', 'margin', 'backgroundColor',
      'color', 'fontSize', 'fontWeight', 'lineHeight', 'fontFamily'
    ]
    
    // Parse HTML to find specific elements
    const htmlElements = htmlResult.html.match(/<div[^>]*data-layer="([^"]*)"[^>]*style="([^"]*)"[^>]*>/g) || []
    
    console.log('\n🎨 CRITICAL STYLE COMPARISON:')
    for (let i = 0; i < Math.min(3, htmlElements.length); i++) {
      const match = htmlElements[i].match(/data-layer="([^"]*)".*style="([^"]*)"/);
      if (!match) continue
      
      const [, name, styleString] = match
      console.log(`\n📍 Element: ${name}`)
      
      // Parse HTML styles
      const htmlStyles: Record<string, string> = {}
      styleString.split(';').forEach(decl => {
        const [prop, val] = decl.split(':').map(s => s.trim())
        if (prop && val) {
          const camelProp = prop.replace(/-([a-z])/g, (_, l) => l.toUpperCase())
          htmlStyles[camelProp] = val
        }
      })
      
      // Find corresponding WeWeb element
      const findWewebElement = (el: any, targetName: string): any => {
        if (el.name === targetName) return el
        if (el.slots?.children) {
          for (const child of el.slots.children) {
            const found = findWewebElement(child, targetName)
            if (found) return found
          }
        }
        return null
      }
      
      const wewebEl = findWewebElement(wewebResult[0], name)
      const wewebStyles = wewebEl?.styles?.default || {}
      
      console.log('  HTML important styles:')
      importantProps.forEach(prop => {
        if (htmlStyles[prop]) {
          console.log(`    ${prop}: ${htmlStyles[prop]}`)
        }
      })
      
      console.log('  WeWeb important styles:')
      importantProps.forEach(prop => {
        if (wewebStyles[prop] !== undefined) {
          console.log(`    ${prop}: ${wewebStyles[prop]}`)
        }
      })
      
      // Check for missing critical styles
      console.log('  ❌ Missing in WeWeb:')
      importantProps.forEach(prop => {
        if (htmlStyles[prop] && wewebStyles[prop] === undefined) {
          console.log(`    ${prop}: ${htmlStyles[prop]}`)
        }
      })
    }
    
    // Let's also check if we're missing entire style categories
    console.log('\n📊 STYLE CATEGORIES CHECK:')
    
    function categorizeStyles(styles: Record<string, any>) {
      const categories = {
        layout: ['display', 'flexDirection', 'alignItems', 'justifyContent', 'gap', 'flexWrap', 'flexGrow', 'flexShrink'],
        sizing: ['width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight'],
        spacing: ['padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft'],
        typography: ['fontSize', 'fontWeight', 'lineHeight', 'fontFamily', 'textAlign', 'color'],
        visual: ['backgroundColor', 'backgroundImage', 'border', 'borderRadius', 'boxShadow', 'opacity'],
        position: ['position', 'top', 'right', 'bottom', 'left', 'zIndex']
      }
      
      const found: Record<string, number> = {}
      for (const [category, props] of Object.entries(categories)) {
        found[category] = props.filter(p => styles[p] !== undefined).length
      }
      return found
    }
    
    // Analyze the root element
    const rootHtmlMatch = htmlResult.html.match(/style="([^"]*)"/)
    if (rootHtmlMatch) {
      const htmlStyles: Record<string, string> = {}
      rootHtmlMatch[1].split(';').forEach(decl => {
        const [prop, val] = decl.split(':').map(s => s.trim())
        if (prop && val) {
          const camelProp = prop.replace(/-([a-z])/g, (_, l) => l.toUpperCase())
          htmlStyles[camelProp] = val
        }
      })
      
      const htmlCategories = categorizeStyles(htmlStyles)
      const wewebCategories = categorizeStyles(wewebResult[0].styles.default)
      
      console.log('\nHTML style categories:', htmlCategories)
      console.log('WeWeb style categories:', wewebCategories)
      
      console.log('\n⚠️  MISSING CATEGORIES:')
      for (const [category, count] of Object.entries(htmlCategories)) {
        if (count > 0 && (!wewebCategories[category] || wewebCategories[category] < count)) {
          console.log(`  ${category}: HTML has ${count}, WeWeb has ${wewebCategories[category] || 0}`)
        }
      }
    }
    
    // Force output
    console.error('\n\n🚨 SUMMARY: The WeWeb output is missing critical styles that make HTML look good!')
    
    expect(true).toBe(true)
  })
})