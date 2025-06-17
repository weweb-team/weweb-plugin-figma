// Quick check without the testing framework
const fs = require('fs');

// Simple mock of a flex container
const flexContainer = {
  type: 'FRAME',
  name: 'Hero Section',
  layoutMode: 'HORIZONTAL',
  primaryAxisAlignItems: 'CENTER',
  counterAxisAlignItems: 'CENTER',
  itemSpacing: 24,
  visible: true,
  width: 1440,
  height: 600,
  fills: [{
    type: 'SOLID',
    visible: true,
    color: { r: 0.96, g: 0.96, b: 0.98 },
    opacity: 1
  }]
};

console.log('🔍 CHECKING WEWEB CONVERTER\n');

// Read the WeWeb converter to see what it's doing
const converterCode = fs.readFileSync('./src/figmatocode/wewebJsonConverter.ts', 'utf8');

// Check if it's handling auto-layout
const hasAutoLayout = converterCode.includes('htmlAutoLayoutProps');
const hasAdditionalStyles = converterCode.includes('additionalStyles');
const hasPushStyles = converterCode.includes('additionalStyles.push');

console.log('WeWeb converter checks:');
console.log(`  Uses htmlAutoLayoutProps: ${hasAutoLayout ? '✅' : '❌'}`);
console.log(`  Has additionalStyles array: ${hasAdditionalStyles ? '✅' : '❌'}`);
console.log(`  Pushes auto-layout styles: ${hasPushStyles ? '✅' : '❌'}`);

// Check the specific line that combines styles
const combinesStyles = converterCode.includes('const allStyles = [...builder.styles, ...additionalStyles]');
console.log(`  Combines builder + additional styles: ${combinesStyles ? '✅' : '❌'}`);

// Look for the problem
console.log('\n🔍 PARSING CHECK:');

// Find the parseStyleString function
const parseStart = converterCode.indexOf('function parseStyleString');
const parseEnd = converterCode.indexOf('\n}', parseStart) + 2;
const parseFunction = converterCode.substring(parseStart, parseEnd);

console.log('\nparseStyleString function handles:');
console.log(`  CSS to camelCase: ${parseFunction.includes('cssPropertyToCamelCase') ? '✅' : '❌'}`);
console.log(`  Pixel value conversion: ${parseFunction.includes('endsWith(\'px\')') ? '✅' : '❌'}`);

// The real issue check
console.log('\n❓ HYPOTHESIS:');
console.log('If WeWeb is getting the styles but they look ugly, maybe:');
console.log('1. The styles are being generated correctly ✅');
console.log('2. The styles are being parsed correctly ✅');
console.log('3. But WeWeb itself might need different CSS values?');
console.log('4. Or the HTML is getting additional styles we\'re not seeing?');

// Check HTML container
const htmlContainerCode = fs.readFileSync('./src/figmatocode/builderImpl/htmlContainer.ts', 'utf8');
console.log('\n🔍 HTML CONTAINER CHECK:');

// Does HTML add extra styles?
const hasBoxSizing = htmlContainerCode.includes('box-sizing');
const hasObjectFit = htmlContainerCode.includes('object-fit');

console.log(`  HTML adds box-sizing: ${hasBoxSizing ? '✅' : '❌'}`);
console.log(`  HTML adds object-fit: ${hasObjectFit ? '✅' : '❌'}`);

console.log('\n💡 CONCLUSION:');
console.log('The 100% match test might be counting properties but not checking VALUES!');
console.log('Or HTML might be adding default styles that WeWeb needs explicitly.');