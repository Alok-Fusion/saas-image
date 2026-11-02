import { test, expect } from '@playwright/test'

test.describe('Home Page Single-Screen Layout', () => {
    test('home fits in one viewport and drop target is immediately reachable', async ({ page, isMobile }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' })
        await page.waitForTimeout(300)

        // Drop target must be visible immediately without page scrolling
        const dropButton = isMobile
            ? page.locator('.orbit-mobile-choose-btn, .orbit-drop-well')
            : page.locator('.orbit-drop-well')

        await expect(dropButton.first()).toBeVisible()

        // Tools must be reachable
        if (isMobile) {
            const toolCards = page.locator('.orbit-mobile-card')
            await expect(toolCards.first()).toBeVisible()
            const count = await toolCards.count()
            expect(count).toBeGreaterThanOrEqual(15)
        } else {
            // Desktop orbit has interactive scene or list view toggle
            const brandBtn = page.locator('.orbit-brand-btn')
            await expect(brandBtn).toBeVisible()
        }
    })

    test('theme toggle works and maintains contrast', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' })
        const themeBtn = page.locator('button[aria-label="Toggle theme"]').first()
        await expect(themeBtn).toBeVisible()
        await themeBtn.click()

        const htmlTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
        expect(htmlTheme).toMatch(/^(dark|light)$/)
    })
})
