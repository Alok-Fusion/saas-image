import { describe, expect, it } from 'vitest'
import { platforms } from './socialPresets'

describe('socialPresets', () => {
    it('contains all required major platforms', () => {
        const names = platforms.map(p => p.name)
        expect(names).toContain('Instagram')
        expect(names).toContain('YouTube')
        expect(names).toContain('LinkedIn')
        expect(names).toContain('Twitter/X')
        expect(names).toContain('Facebook')
        expect(names).toContain('Pinterest')
        expect(names).toContain('TikTok')
    })

    it('ensures each preset has positive dimensions and valid properties', () => {
        for (const platform of platforms) {
            expect(platform.presets.length).toBeGreaterThan(0)
            expect(platform.icon).toBeTruthy()
            expect(platform.color).toMatch(/^#[0-9A-Fa-f]{6}$/)

            for (const preset of platform.presets) {
                expect(preset.name).toBeTruthy()
                expect(preset.description).toBeTruthy()
                expect(preset.width).toBeGreaterThan(0)
                expect(preset.height).toBeGreaterThan(0)
                expect(Number.isInteger(preset.width)).toBe(true)
                expect(Number.isInteger(preset.height)).toBe(true)
            }
        }
    })
})
