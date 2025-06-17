import { describe, it, expect } from 'vitest'
import { htmlMain } from '../figmatocode/htmlMain'
import fixtureData from './__fixtures__/figmaNodes/untitled-ui-landing-01.json'

/**
 * Single snapshot test for HTML conversion
 */
describe('HTML Conversion Snapshot', () => {
  it('should convert fixture to HTML format consistently', async () => {
    const pluginSettings = {
      htmlGenerationMode: "html" as const,
      showLayerNames: true,
      embedVectors: false,
      embedImages: false
    }
    
    // Use fixture data directly (it's already in the correct format)
    const result = await htmlMain([fixtureData], pluginSettings, true)
    
    expect(result).toMatchSnapshot('figma-to-html-conversion.html')
  })
})