import { describe, expect, it } from 'vitest'
import { calculateSimilarity, findDuplicates } from '../utils/duplicateHashing'

describe('DuplicateFinder pure logic', () => {
    describe('calculateSimilarity', () => {
        it('returns 100% for identical hashes', () => {
            const h = '1100110011001100'
            expect(calculateSimilarity(h, h)).toBe(100)
        })

        it('returns 0% for completely opposite hashes', () => {
            const h1 = '11110000'
            const h2 = '00001111'
            expect(calculateSimilarity(h1, h2)).toBe(0)
        })

        it('calculates correct partial similarity', () => {
            const h1 = '11110000'
            const h2 = '11110001' // 1 difference in 8 bits = 7/8 = 87.5%
            expect(calculateSimilarity(h1, h2)).toBe(87.5)
        })

        it('handles standard 64-bit perceptual hashes', () => {
            const h1 = '1'.repeat(64)
            const h2 = '1'.repeat(60) + '0000' // 4 differences in 64 bits = 60/64 = 93.75%
            expect(calculateSimilarity(h1, h2)).toBe(93.75)
        })
    })

    describe('findDuplicates', () => {
        const dummyInfo = { width: 100, height: 100, size: 1024, type: 'image/png', name: 'test.png' }
        const dummyFile = (name: string) => new File(['data'], name, { type: 'image/png' })

        it('groups images with similarity >= 90%', () => {
            const hA = '1'.repeat(64)
            const hA_similar = '1'.repeat(62) + '00' // 2 diffs / 64 = 96.875% -> match!
            const hB = '0'.repeat(64) // completely different

            const items = [
                { file: dummyFile('a1.png'), url: 'blob:1', info: dummyInfo, hash: hA },
                { file: dummyFile('b1.png'), url: 'blob:2', info: dummyInfo, hash: hB },
                { file: dummyFile('a2.png'), url: 'blob:3', info: dummyInfo, hash: hA_similar },
            ]

            const groups = findDuplicates(items)
            expect(groups).toHaveLength(1)
            expect(groups[0].images).toHaveLength(2)
            expect(groups[0].images.map(i => i.file.name)).toEqual(['a1.png', 'a2.png'])
        })

        it('returns empty groups when all images are distinct', () => {
            const items = [
                { file: dummyFile('a.png'), url: 'blob:1', info: dummyInfo, hash: '1'.repeat(64) },
                { file: dummyFile('b.png'), url: 'blob:2', info: dummyInfo, hash: '0'.repeat(64) },
                { file: dummyFile('c.png'), url: 'blob:3', info: dummyInfo, hash: '10'.repeat(32) },
            ]

            const groups = findDuplicates(items)
            expect(groups).toHaveLength(0)
        })
    })
})
