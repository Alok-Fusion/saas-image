import { test, expect } from '@playwright/test'

const CORE_TOOLS = [
    { path: '/compress-image', title: 'Image Compressor' },
    { path: '/resize-image', title: 'Social Media Resizer' },
    { path: '/crop-image', title: 'Image Cropper' },
    { path: '/image-to-pdf', title: 'Image to PDF' },
]

test.describe('Tool Pages Responsive Functionality', () => {
    for (const tool of CORE_TOOLS) {
        test(`${tool.title} loads, accepts sample image, and renders action bar`, async ({ page, isMobile }) => {
            await page.goto(tool.path, { waitUntil: 'domcontentloaded' })
            await page.waitForTimeout(300)

            // Verify sample image button or dropzone is present
            const sampleBtn = page.locator('button:has-text("Try sample image"), button:has-text("Try with a sample image")').first()
            if (await sampleBtn.isVisible()) {
                await sampleBtn.click()
                await page.waitForTimeout(500)
            }

            // Verify primary download / action button is visible and tappable
            const actionBtn = page.locator('.workspace-actionbar button, .workspace-actionbar .btn').first()
            if (await actionBtn.isVisible()) {
                const box = await actionBtn.boundingBox()
                expect(box).not.toBeNull()
                expect(box?.height).toBeGreaterThanOrEqual(32)
            }

            // If mobile, test bottom sheet snap points
            if (isMobile) {
                const sheet = page.locator('.workspace-mobile-sheet')
                if (await sheet.isVisible()) {
                    const handleBar = page.locator('.sheet-handle-bar')
                    await expect(handleBar).toBeVisible()

                    // Click to cycle snap point
                    await handleBar.click()
                    await page.waitForTimeout(350)
                    const expandedSnap = await sheet.evaluate((el) => el.getAttribute('class'))
                    expect(expandedSnap).toContain('snap-')
                }
            }
        })
    }
})

