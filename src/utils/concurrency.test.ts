import { describe, expect, it } from 'vitest'
import { getConcurrencyLimit, mapWithConcurrency } from './concurrency'

describe('concurrency utils', () => {
    describe('getConcurrencyLimit', () => {
        it('clamps concurrency between 1 and 4', () => {
            expect(getConcurrencyLimit(1)).toBe(1)
            expect(getConcurrencyLimit(0)).toBe(1)
            expect(getConcurrencyLimit(10)).toBeLessThanOrEqual(4)
            expect(getConcurrencyLimit(10)).toBeGreaterThanOrEqual(1)
        })
    })

    describe('mapWithConcurrency', () => {
        it('processes all items and preserves order', async () => {
            const items = [50, 10, 30, 20, 5]
            const results = await mapWithConcurrency(items, 3, async (ms, index) => {
                await new Promise(resolve => setTimeout(resolve, ms))
                return `item-${index}`
            })

            expect(results).toEqual(['item-0', 'item-1', 'item-2', 'item-3', 'item-4'])
        })

        it('tracks progress accurately', async () => {
            const items = [1, 2, 3, 4]
            const progressReports: number[] = []

            await mapWithConcurrency(items, 2, async (n) => n * 2, (done, total) => {
                progressReports.push(done / total)
            })

            expect(progressReports).toHaveLength(4)
            expect(progressReports[progressReports.length - 1]).toBe(1)
        })
    })
})

