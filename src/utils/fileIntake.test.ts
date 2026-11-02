import { describe, expect, it } from 'vitest'
import {
    ACCEPTED_IMAGE_TYPES,
    isAcceptedImage,
    isHeic,
    MAX_FILE_SIZE,
    MAX_IMAGE_PIXELS,
    validateFiles,
    validateImageFile,
    sanitizeSvg,
    sanitizeFilename,
} from './fileIntake'

describe('fileIntake utils', () => {
    describe('isHeic', () => {
        it('detects HEIC by mime type', () => {
            const f1 = new File(['abc'], 'photo.img', { type: 'image/heic' })
            const f2 = new File(['abc'], 'photo.img', { type: 'image/heif' })
            expect(isHeic(f1)).toBe(true)
            expect(isHeic(f2)).toBe(true)
        })

        it('detects HEIC by extension', () => {
            const f1 = new File(['abc'], 'IMG_1234.HEIC', { type: '' })
            const f2 = new File(['abc'], 'photo.heif', { type: 'application/octet-stream' })
            expect(isHeic(f1)).toBe(true)
            expect(isHeic(f2)).toBe(true)
        })

        it('returns false for non-HEIC files', () => {
            const f = new File(['abc'], 'photo.jpg', { type: 'image/jpeg' })
            expect(isHeic(f)).toBe(false)
        })
    })

    describe('isAcceptedImage', () => {
        it('accepts standard image mime types', () => {
            for (const type of ACCEPTED_IMAGE_TYPES) {
                const f = new File(['test'], 'file', { type })
                expect(isAcceptedImage(f)).toBe(true)
            }
        })

        it('accepts valid extensions even if mime type is missing', () => {
            const f = new File(['test'], 'sample.webp', { type: '' })
            expect(isAcceptedImage(f)).toBe(true)
        })

        it('rejects unsupported file types', () => {
            const f1 = new File(['test'], 'document.pdf', { type: 'application/pdf' })
            const f2 = new File(['test'], 'archive.zip', { type: 'application/zip' })
            expect(isAcceptedImage(f1)).toBe(false)
            expect(isAcceptedImage(f2)).toBe(false)
        })
    })

    describe('validateImageFile', () => {
        it('rejects unsupported formats immediately', async () => {
            const file = new File(['bad'], 'notes.txt', { type: 'text/plain' })
            const result = await validateImageFile(file)
            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.error).toContain('not a supported image')
            }
        })

        it('rejects files larger than 50 MB', async () => {
            const file = new File(['dummy'], 'giant.png', { type: 'image/png' })
            Object.defineProperty(file, 'size', { value: MAX_FILE_SIZE + 1024 })
            const result = await validateImageFile(file)
            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.error).toContain('The limit is 50 MB')
            }
        })
    })

    describe('validateFiles', () => {
        it('validates pdf files correctly', async () => {
            const pdfFile = new File(['%PDF-1.4'], 'doc.pdf', { type: 'application/pdf' })
            const textFile = new File(['hello'], 'doc.txt', { type: 'text/plain' })
            const { valid, errors } = await validateFiles([pdfFile, textFile], 'pdf')
            expect(valid).toHaveLength(1)
            expect(valid[0].name).toBe('doc.pdf')
            expect(errors).toHaveLength(1)
            expect(errors[0]).toContain('is not a PDF')
        })
    })

    describe('constants', () => {
        it('has correct max limits', () => {
            expect(MAX_FILE_SIZE).toBe(50 * 1024 * 1024)
            expect(MAX_IMAGE_PIXELS).toBe(100_000_000)
        })
    })

    describe('security sanitizers', () => {
        it('strips script tags and onload handlers from SVGs', () => {
            const maliciousSvg = `<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><circle cx="5" cy="5" r="5" onload="evil()"/><text>Safe</text></svg>`
            const sanitized = sanitizeSvg(maliciousSvg)
            expect(sanitized).not.toContain('<script>')
            expect(sanitized).not.toContain('alert(1)')
            expect(sanitized).not.toContain('onload')
            expect(sanitized).not.toContain('evil()')
            expect(sanitized).toContain('<circle cx="5" cy="5" r="5"')
            expect(sanitized).toContain('Safe')
        })

        it('sanitizes filenames by removing traversal and illegal characters', () => {
            expect(sanitizeFilename('../../../etc/passwd.png')).toBe('etc_passwd.png')
            expect(sanitizeFilename('..\\..\\windows\\system32.jpg')).toBe('windows_system32.jpg')
            expect(sanitizeFilename('photo\0with\x00null.png')).toBe('photowithnull.png')
            expect(sanitizeFilename('bad:name<test>?*.png')).toBe('badnametest.png')
            expect(sanitizeFilename('')).toBe('image')
        })
    })
})

