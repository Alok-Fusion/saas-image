import { test, expect } from '@playwright/test'

const ROUTES = [
    '/',
    '/compress-image',
    '/resize-image',
    '/crop-image',
    '/image-to-pdf',
    '/remove-background',
    '/image-tools',
    '/guides',
    '/about',
    '/privacy',
]

test.describe('Responsive No-Overflow Checks', () => {
    for (const route of ROUTES) {
        test(`route ${route} has zero horizontal overflow`, async ({ page }) => {
            await page.goto(route, { waitUntil: 'domcontentloaded' })
            await page.waitForTimeout(200)

            const overflow = await page.evaluate(() => {
                const doc = document.scrollingElement || document.documentElement
                return {
                    scrollWidth: doc.scrollWidth,
                    clientWidth: doc.clientWidth,
                    hasOverflow: doc.scrollWidth > doc.clientWidth + 1, // allow 1px subpixel rounding
                }
            })

            expect(overflow.hasOverflow, `Overflow on ${route}: scrollWidth ${overflow.scrollWidth} > clientWidth ${overflow.clientWidth}`).toBe(false)
        })
    }

    test('200% browser zoom check on home page', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' })
        // Emulate 200% zoom via css zoom on documentElement
        await page.evaluate(() => {
            document.documentElement.style.zoom = '200%'
        })
        await page.waitForTimeout(300)

        const overflow = await page.evaluate(() => {
            const doc = document.scrollingElement || document.documentElement
            return doc.scrollWidth > doc.clientWidth + 2
        })
        expect(overflow).toBe(false)
    })
})

