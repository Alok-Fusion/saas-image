import { describe, expect, it } from 'vitest'
import { parseExif } from './exif'

describe('exif parser', () => {
    it('returns empty summary for non-JPEG files', async () => {
        const file = new File(['fake-png-data'], 'test.png', { type: 'image/png' })
        const result = await parseExif(file)
        expect(result.hasExif).toBe(false)
        expect(result.hasGps).toBe(false)
        expect(result.fields).toEqual({})
    })

    it('returns empty summary for empty or truncated JPEG files', async () => {
        const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], 'test.jpg', { type: 'image/jpeg' })
        const result = await parseExif(file)
        expect(result.hasExif).toBe(false)
        expect(result.hasGps).toBe(false)
    })
})

