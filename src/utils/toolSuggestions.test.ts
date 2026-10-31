import { describe, expect, it } from 'vitest'
import { getToolSuggestions } from './toolSuggestions'

describe('toolSuggestions', () => {
    it('returns suggestions for known tools', () => {
        const tools = ['compressor', 'background-remover', 'cropper', 'ocr', 'favicon', 'thumbnail']
        for (const tool of tools) {
            const suggestions = getToolSuggestions(tool)
            expect(suggestions.length).toBeGreaterThan(0)
            expect(suggestions.some(s => s.id === tool)).toBe(false)
            for (const s of suggestions) {
                expect(s.id).toBeTruthy()
                expect(s.title).toBeTruthy()
                expect(s.icon).toBeTruthy()
                expect(s.description).toBeTruthy()
            }
        }
    })

    it('returns empty array or fallback for unknown tool', () => {
        const suggestions = getToolSuggestions('non-existent-tool')
        expect(Array.isArray(suggestions)).toBe(true)
    })
})

