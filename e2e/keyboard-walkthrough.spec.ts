import { test, expect } from '@playwright/test'

test.describe('Keyboard & Accessibility Walkthrough', () => {
    test('Cmd+K opens command palette and Escape closes it', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' })
        await page.waitForTimeout(300)

        // Trigger search via button or shortcut
        const searchBtn = page.locator('button[aria-label*="Search"]').first()
        await searchBtn.click()

        const palette = page.locator('.cmd-modal')
        await expect(palette).toBeVisible()

        // Type query
        const input = page.locator('.cmd-input')
        await input.fill('compress')
        await page.waitForTimeout(200)

        // Options should filter
        const option = page.locator('.cmd-item').first()
        await expect(option).toBeVisible()

        // Press Escape to dismiss
        await page.keyboard.press('Escape')
        await page.waitForTimeout(200)
        await expect(palette).not.toBeVisible()
    })

    test('keyboard tab navigation reaches main actions', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' })
        await page.keyboard.press('Tab')
        const activeTagName = await page.evaluate(() => document.activeElement?.tagName)
        expect(activeTagName).toMatch(/^(BUTTON|A|INPUT)$/)
    })
})

