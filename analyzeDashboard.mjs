import fs from 'fs'
import { convertNodesToWeweb } from './src/figmatocode/wewebJsonConverter.ts'
import { htmlMain } from './src/figmatocode/htmlMain.ts'

// Load dashboard fixture
const dashboardData = JSON.parse(
  fs.readFileSync('./src/test/__fixtures__/figmaNodes/untitled-ui-dashboard-01.json', 'utf8')
)

const settings = {
  htmlGenerationMode: "html",
  showLayerNames: true,
  embedVectors: false,
  embedImages: false
}

console.log('🎯 ANALYZING DASHBOARD FIXTURE\n')

// Convert to both formats
const wewebResult = await convertNodesToWeweb([dashboardData])
const htmlResult = await htmlMain([dashboardData], settings, true)

// Count style properties
let htmlPropCount = 0
const htmlMatches = htmlResult.html.matchAll(/style="([^"]*)"/g)
for (const match of htmlMatches) {
  if (match[1]) {
    htmlPropCount += match[1].split(';').filter(s => s.trim()).length
  }
}

function countWewebProps(element) {
  let count = 0
  if (element.styles?.default) {
    count += Object.keys(element.styles.default).length
  }
  if (element.slots?.children) {
    for (const child of element.slots.children) {
      count += countWewebProps(child)
    }
  }
  return count
}

const wewebPropCount = countWewebProps(wewebResult[0])

console.log(`HTML total properties: ${htmlPropCount}`)
console.log(`WeWeb total properties: ${wewebPropCount}`)
console.log(`Difference: ${Math.abs(htmlPropCount - wewebPropCount)}`)

// Check the root element specifically
console.log('\nROOT ELEMENT COMPARISON:')
const rootMatch = htmlResult.html.match(/<div[^>]*style="([^"]*)"/)
if (rootMatch) {
  const htmlStyles = rootMatch[1].split(';').filter(s => s.trim())
  console.log(`HTML root: ${htmlStyles.length} styles`)
  
  // Check for flexbox
  const flexStyles = htmlStyles.filter(s => 
    s.includes('display') || s.includes('flex') || s.includes('justify') || s.includes('align')
  )
  console.log('HTML flexbox styles:')
  flexStyles.forEach(s => console.log(`  ${s}`))
}

const wewebRoot = wewebResult[0].styles.default
console.log(`\nWeWeb root: ${Object.keys(wewebRoot).length} styles`)
console.log('WeWeb flexbox styles:')
if (wewebRoot.display) console.log(`  display: ${wewebRoot.display}`)
if (wewebRoot.flexDirection) console.log(`  flexDirection: ${wewebRoot.flexDirection}`)
if (wewebRoot.justifyContent) console.log(`  justifyContent: ${wewebRoot.justifyContent}`)
if (wewebRoot.alignItems) console.log(`  alignItems: ${wewebRoot.alignItems}`)

// Sample a few elements to see what's different
console.log('\n🔍 SAMPLING ELEMENTS:')

function findElementByType(node, type) {
  if (node.type === type) return node
  if (node.children) {
    for (const child of node.children) {
      const found = findElementByType(child, type)
      if (found) return found
    }
  }
  return null
}

// Find a text element
const textNode = findElementByType(dashboardData, 'TEXT')
if (textNode) {
  console.log(`\nText element: "${textNode.name}"`)
  
  const textWeweb = await convertNodesToWeweb([textNode])
  const textHtml = await htmlMain([textNode], settings, true)
  
  const textWewebStyles = textWeweb[0].styles.default
  console.log('WeWeb text styles:', Object.keys(textWewebStyles).length)
  console.log('  fontSize:', textWewebStyles.fontSize)
  console.log('  fontWeight:', textWewebStyles.fontWeight)
  console.log('  fontFamily:', textWewebStyles.fontFamily)
  console.log('  color:', textWewebStyles.color)
}

console.log('\n💡 SUMMARY:')
const matchRate = Math.min(htmlPropCount, wewebPropCount) / Math.max(htmlPropCount, wewebPropCount) * 100
console.log(`Approximate match rate: ${matchRate.toFixed(1)}%`)

if (matchRate < 100) {
  console.log('\nPossible issues:')
  console.log('- Some styles might be missing in WeWeb conversion')
  console.log('- Font properties might not be fully converted')
  console.log('- Some edge cases in the dashboard layout')
}