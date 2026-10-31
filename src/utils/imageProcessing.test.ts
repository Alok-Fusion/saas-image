import { describe, expect, it } from 'vitest'
import {
    buildOutputName,
    computeDrawRect,
    formatFileSize,
    getExtension,
    getOutputMime,
} from './imageProcessing'

describe('imageProcessing utils', () => {
    describe('formatFileSize', () => {
        it('formats zero and negative bytes correctly', () => {
            expect(formatFileSize(0)).toBe('0 B')
            expect(formatFileSize(-10)).toBe('0 B')
            expect(formatFileSize(Number.NaN)).toBe('0 B')
        })

        it('formats small byte sizes', () => {
            expect(formatFileSize(512)).toBe('512 B')
            expect(formatFileSize(1023)).toBe('1023 B')
        })

        it('formats kilobytes correctly', () => {
            expect(formatFileSize(1024)).toBe('1 KB')
            expect(formatFileSize(1536)).toBe('1.5 KB')
        })

        it('formats megabytes and gigabytes correctly', () => {
            expect(formatFileSize(1024 * 1024)).toBe('1 MB')
            expect(formatFileSize(5.25 * 1024 * 1024)).toBe('5.25 MB')
            expect(formatFileSize(2 * 1024 * 1024 * 1024)).toBe('2 GB')
        })
    })

    describe('getExtension', () => {
        it('returns expected extension for known mime types', () => {
            expect(getExtension('image/jpeg')).toBe('jpg')
            expect(getExtension('image/jpg')).toBe('jpg')
            expect(getExtension('image/png')).toBe('png')
            expect(getExtension('image/webp')).toBe('webp')
            expect(getExtension('image/gif')).toBe('gif')
            expect(getExtension('image/avif')).toBe('avif')
            expect(getExtension('image/bmp')).toBe('bmp')
            expect(getExtension('image/svg+xml')).toBe('svg')
            expect(getExtension('image/heic')).toBe('heic')
        })

        it('falls back to jpg for unknown mime types', () => {
            expect(getExtension('application/octet-stream')).toBe('jpg')
            expect(getExtension('')).toBe('jpg')
        })
    })

    describe('getOutputMime', () => {
        it('respects explicit requested formats', () => {
            expect(getOutputMime('image/png', 'image/jpeg')).toBe('image/jpeg')
            expect(getOutputMime('image/jpeg', 'image/webp')).toBe('image/webp')
        })

        it('infers from source type when requested is auto or undefined', () => {
            expect(getOutputMime('image/jpeg', 'auto')).toBe('image/jpeg')
            expect(getOutputMime('image/webp')).toBe('image/webp')
            expect(getOutputMime('image/png')).toBe('image/png')
            expect(getOutputMime('image/gif')).toBe('image/png')
        })
    })

    describe('computeDrawRect', () => {
        it('computes contain rect for wider source in square container', () => {
            const rect = computeDrawRect(200, 100, 100, 100, 'contain')
            expect(rect.width).toBe(100)
            expect(rect.height).toBe(50)
            expect(rect.x).toBe(0)
            expect(rect.y).toBe(25)
        })

        it('computes contain rect for taller source in square container', () => {
            const rect = computeDrawRect(100, 200, 100, 100, 'contain')
            expect(rect.width).toBe(50)
            expect(rect.height).toBe(100)
            expect(rect.x).toBe(25)
            expect(rect.y).toBe(0)
        })

        it('computes cover rect for wider source in square container', () => {
            const rect = computeDrawRect(200, 100, 100, 100, 'cover')
            expect(rect.width).toBe(200)
            expect(rect.height).toBe(100)
            expect(rect.x).toBe(-50)
            expect(rect.y).toBe(0)
        })

        it('computes cover rect for taller source in square container', () => {
            const rect = computeDrawRect(100, 200, 100, 100, 'cover')
            expect(rect.width).toBe(100)
            expect(rect.height).toBe(200)
            expect(rect.x).toBe(0)
            expect(rect.y).toBe(-50)
        })
    })

    describe('buildOutputName', () => {
        it('appends suffix and replaces extension', () => {
            expect(buildOutputName('photo.jpg', 'compressed', 'webp')).toBe('photo-compressed.webp')
            expect(buildOutputName('my.cool.photo.png', 'crop', 'jpg')).toBe('my.cool.photo-crop.jpg')
        })

        it('handles files with no extension or empty name', () => {
            expect(buildOutputName('image', 'resized', 'png')).toBe('image-resized.png')
            expect(buildOutputName('', 'thumb', 'png')).toBe('image-thumb.png')
        })

        it('sanitizes unsafe suffix characters', () => {
            expect(buildOutputName('banner.png', '200x200 (test)', 'png')).toBe('banner-200x200-test-.png')
        })
    })
})
