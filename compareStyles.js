const { convertNodesToWeweb } = require('./src/figmatocode/wewebJsonConverter');
const { htmlMain } = require('./src/figmatocode/htmlMain');
const fixtureData = require('./src/test/__fixtures__/figmaNodes/untitled-ui-landing-01.json');

async function compareStyles() {
  const settings = {
    htmlGenerationMode: "html",
    showLayerNames: true,
    embedVectors: false,
    embedImages: false
  };
  
  // Convert to both formats
  const wewebResult = await convertNodesToWeweb([fixtureData]);
  const htmlResult = await htmlMain([fixtureData], settings, true);
  
  console.log('\n🔍 DIRECT STYLE COMPARISON\n');
  
  // Extract first div from HTML
  const firstDivMatch = htmlResult.html.match(/<div[^>]*style="([^"]*)"[^>]*>/);
  if (firstDivMatch) {
    console.log('HTML first div styles:');
    const styles = firstDivMatch[1].split(';').filter(s => s.trim());
    styles.forEach(s => console.log('  ' + s.trim()));
    console.log('Total HTML styles:', styles.length);
  }
  
  console.log('\nWeWeb first element styles:');
  const wewebStyles = wewebResult[0].styles.default;
  Object.entries(wewebStyles).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  console.log('Total WeWeb styles:', Object.keys(wewebStyles).length);
  
  // Check for specific important styles
  console.log('\n❌ CRITICAL MISSING STYLES CHECK:');
  
  const criticalStyles = [
    'display: flex',
    'flex-direction',
    'align-items', 
    'justify-content',
    'font-family',
    'font-size',
    'line-height'
  ];
  
  criticalStyles.forEach(style => {
    const htmlHas = firstDivMatch && firstDivMatch[1].includes(style);
    const camelCase = style.split(':')[0].replace(/-([a-z])/g, (_, l) => l.toUpperCase());
    const wewebHas = wewebStyles[camelCase] !== undefined;
    
    if (htmlHas && !wewebHas) {
      console.log(`  ❌ ${style} - in HTML but NOT in WeWeb`);
    }
  });
  
  // Let's check a text element
  console.log('\n📝 TEXT ELEMENT CHECK:');
  
  function findTextElement(node) {
    if (node.type === 'TEXT') return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findTextElement(child);
        if (found) return found;
      }
    }
    return null;
  }
  
  const textNode = findTextElement(fixtureData);
  if (textNode) {
    console.log('Found text node:', textNode.name);
    
    const textWewebResult = await convertNodesToWeweb([textNode]);
    const textHtmlResult = await htmlMain([textNode], settings, true);
    
    console.log('\nHTML text styles:');
    const textMatch = textHtmlResult.html.match(/style="([^"]*)">/);
    if (textMatch) {
      textMatch[1].split(';').filter(s => s.trim()).forEach(s => console.log('  ' + s));
    }
    
    console.log('\nWeWeb text styles:');
    Object.entries(textWewebResult[0].styles.default).forEach(([k, v]) => {
      console.log(`  ${k}: ${v}`);
    });
  }
}

compareStyles().catch(console.error);