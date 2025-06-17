import { describe, it, expect } from 'vitest'
import { convertNodesToWeweb } from '../figmatocode/wewebJsonConverter'
import fixtureData from './__fixtures__/figmaNodes/untitled-ui-landing-01.json'

/**
 * Single snapshot test for WeWeb conversion
 */
describe('WeWeb Conversion Snapshot', () => {
  it('should convert fixture to WeWeb format consistently', async () => {
    const result = await convertNodesToWeweb([fixtureData])
    
    expect(result).toMatchSnapshot('figma-to-weweb-conversion.json')
  })
})