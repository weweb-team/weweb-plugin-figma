import { describe, it, expect } from 'vitest'
import { convertNodesToWeweb } from '../figmatocode/wewebJsonConverter'
import { htmlMain } from '../figmatocode/htmlMain'
import simpleFixture from './__fixtures__/figmaNodes/simple-flex-layout.json'
import bigFixture from './__fixtures__/figmaNodes/untitled-ui-landing-01.json'

describe('Real Match Test - Multiple Fixtures', () => {
  it('should test if match rate holds for different fixtures', async () => {
    const settings = {
      htmlGenerationMode: "html" as const,
      showLayerNames: true,
      embedVectors: false,
      embedImages: false
    }
    
    console.log('\n🔍 TESTING MULTIPLE FIXTURES\n')
    
    // Test 1: Simple fixture
    console.log('1️⃣ SIMPLE FLEX LAYOUT TEST')
    const simpleWeweb = await convertNodesToWeweb([simpleFixture])
    const simpleHtml = await htmlMain([simpleFixture], settings, true)
    
    // Count properties in simple fixture
    let simpleHtmlProps = 0
    let simpleWewebProps = 0
    
    // Extract all style properties from HTML
    const htmlStyleMatches = simpleHtml.html.matchAll(/style="([^"]*)"/g)
    for (const match of htmlStyleMatches) {
      if (match[1]) {
        simpleHtmlProps += match[1].split(';').filter(s => s.trim()).length
      }
    }
    
    // Count WeWeb properties
    function countProps(element: any): number {
      let count = 0
      if (element.styles?.default) {
        count += Object.keys(element.styles.default).length
      }
      if (element.slots?.children) {
        for (const child of element.slots.children) {
          count += countProps(child)
        }
      }
      return count
    }
    
    simpleWewebProps = countProps(simpleWeweb[0])
    
    console.log(`  HTML properties: ${simpleHtmlProps}`)
    console.log(`  WeWeb properties: ${simpleWewebProps}`)
    console.log(`  Match: ${simpleHtmlProps === simpleWewebProps ? '✅' : '❌'}`)
    
    // Let's look at the actual container styles
    console.log('\n  Container styles comparison:')
    const containerMatch = simpleHtml.html.match(/<div[^>]*data-layer="Simple Flex Container"[^>]*style="([^"]*)"/)
    if (containerMatch) {
      const htmlStyles = containerMatch[1].split(';').map(s => s.trim()).filter(s => s)
      console.log(`  HTML container: ${htmlStyles.length} styles`)
      
      // Check for flexbox
      const hasDisplay = htmlStyles.some(s => s.includes('display'))
      const hasFlexDir = htmlStyles.some(s => s.includes('flex-direction'))
      const hasJustify = htmlStyles.some(s => s.includes('justify-content'))
      const hasAlign = htmlStyles.some(s => s.includes('align-items'))
      
      console.log(`    display: ${hasDisplay ? '✅' : '❌'}`)
      console.log(`    flex-direction: ${hasFlexDir ? '✅' : '❌'}`)
      console.log(`    justify-content: ${hasJustify ? '✅' : '❌'}`)
      console.log(`    align-items: ${hasAlign ? '✅' : '❌'}`)
    }
    
    const wewebContainer = simpleWeweb[0].styles.default
    console.log(`  WeWeb container: ${Object.keys(wewebContainer).length} styles`)
    console.log(`    display: ${wewebContainer.display ? '✅' : '❌'} (${wewebContainer.display || 'missing'})`)
    console.log(`    flexDirection: ${wewebContainer.flexDirection ? '✅' : '❌'} (${wewebContainer.flexDirection || 'missing'})`)
    console.log(`    justifyContent: ${wewebContainer.justifyContent ? '✅' : '❌'} (${wewebContainer.justifyContent || 'missing'})`)
    console.log(`    alignItems: ${wewebContainer.alignItems ? '✅' : '❌'} (${wewebContainer.alignItems || 'missing'})`)
    
    // Test 2: Check text styles
    console.log('\n  Text element comparison:')
    const textElement = simpleWeweb[0].slots?.children?.[0]
    if (textElement) {
      const textStyles = textElement.styles.default
      console.log(`  WeWeb text styles: ${Object.keys(textStyles).length}`)
      console.log(`    fontSize: ${textStyles.fontSize || 'missing'}`)
      console.log(`    fontWeight: ${textStyles.fontWeight || 'missing'}`)
      console.log(`    color: ${textStyles.color || 'missing'}`)
      console.log(`    fontFamily: ${textStyles.fontFamily || 'missing'}`)
    }
    
    // Test 3: Original fixture for comparison
    console.log('\n2️⃣ ORIGINAL BIG FIXTURE TEST')
    const bigWeweb = await convertNodesToWeweb([bigFixture])
    const bigHtml = await htmlMain([bigFixture], settings, true)
    
    let bigHtmlProps = 0
    let bigWewebProps = 0
    
    const bigHtmlMatches = bigHtml.html.matchAll(/style="([^"]*)"/g)
    for (const match of bigHtmlMatches) {
      if (match[1]) {
        bigHtmlProps += match[1].split(';').filter(s => s.trim()).length
      }
    }
    
    bigWewebProps = countProps(bigWeweb[0])
    
    console.log(`  HTML properties: ${bigHtmlProps}`)
    console.log(`  WeWeb properties: ${bigWewebProps}`)
    console.log(`  Match: ${bigHtmlProps === bigWewebProps ? '✅' : '❌'}`)
    
    // The verdict
    console.log('\n🎯 VERDICT:')
    const simpleMatch = simpleHtmlProps === simpleWewebProps
    const bigMatch = bigHtmlProps === bigWewebProps
    
    if (!simpleMatch && bigMatch) {
      console.log('❌ OVERFITTING DETECTED!')
      console.log('The code works for the big fixture but fails on simple cases.')
      console.log('This suggests the "100% match" is not real.')
    } else if (simpleMatch && bigMatch) {
      console.log('✅ Both fixtures match!')
      console.log('But if it looks ugly, the issue might be:')
      console.log('- WeWeb renders styles differently than browsers')
      console.log('- Missing default CSS (box-sizing, margins, etc)')
      console.log('- Font loading issues')
    } else {
      console.log('❌ Neither fixture matches properly')
      console.log('The 100% match claim is definitely false!')
    }
    
    expect(true).toBe(true)
  })
})