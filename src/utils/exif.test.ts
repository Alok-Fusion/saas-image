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

    it('confirms EXIF & GPS metadata are purged when APP1 segment is removed', async () => {
        // Construct a JPEG with an APP1 Exif segment
        const exifHeader = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00] // "Exif\0\0"
        const tiffHeader = [0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00] // Little-endian, IFD0 at 8
        // IFD0: 1 entry: Make (tag 0x010f, type 2 ASCII, count 6, offset 14)
        const ifd0 = [
            0x01, 0x00, // 1 entry
            0x0f, 0x01, 0x02, 0x00, 0x06, 0x00, 0x00, 0x00, 0x1a, 0x00, 0x00, 0x00, // Tag 0x010f
            0x00, 0x00, 0x00, 0x00, // Next IFD offset (0)
            0x43, 0x61, 0x6e, 0x6f, 0x6e, 0x00, // "Canon\0"
        ]
        const app1Payload = [...exifHeader, ...tiffHeader, ...ifd0]
        const app1Length = app1Payload.length + 2
        const rawWithExif = new Uint8Array([
            0xff, 0xd8, // SOI
            0xff, 0xe1, // APP1
            (app1Length >> 8) & 0xff, app1Length & 0xff,
            ...app1Payload,
            0xff, 0xd9, // EOI
        ])

        const initialFile = new File([rawWithExif], 'camera_photo.jpg', { type: 'image/jpeg' })
        const initialResult = await parseExif(initialFile)
        expect(initialResult.hasExif).toBe(true)
        expect(initialResult.fields['Camera make']).toBe('Canon')

        // Cleaned file without APP1 EXIF segment (pure SOI + EOI or fresh canvas export)
        const cleanedRaw = new Uint8Array([0xff, 0xd8, 0xff, 0xd9])
        const cleanedFile = new File([cleanedRaw], 'camera_photo-clean.jpg', { type: 'image/jpeg' })
        const cleanedResult = await parseExif(cleanedFile)

        expect(cleanedResult.hasExif).toBe(false)
        expect(cleanedResult.hasGps).toBe(false)
        expect(cleanedResult.fields).toEqual({})
    })
})

