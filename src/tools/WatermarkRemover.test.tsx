import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import WatermarkRemover from './WatermarkRemover'

vi.mock('../utils/imageProcessing', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../utils/imageProcessing')>()),
    getImageInfo: vi.fn(async () => ({ width: 2000, height: 1000, size: 1024, type: 'image/png', name: 'photo.png' })),
}))

type Point = [x: number, y: number]

describe('WatermarkRemover selection', () => {
    let host: HTMLDivElement
    let root: Root

    const setDisplayedImage = (left: number, top: number, width: number, height: number) => {
        vi.spyOn(HTMLImageElement.prototype, 'getBoundingClientRect').mockImplementation(
            () => new DOMRect(left, top, width, height)
        )
    }

    const setContainerWidth = (width: number) => {
        vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(width)
    }

    const renderTool = async () => {
        const file = new File(['image'], 'photo.png', { type: 'image/png' })
        await act(async () => {
            root.render(<WatermarkRemover onBack={() => {}} initialFile={file} />)
        })
    }

    const surface = () => host.querySelector('img[alt="Preview"]')!.parentElement!

    const pointer = async (type: string, [clientX, clientY]: Point) => {
        await act(async () => {
            surface().dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 1, clientX, clientY }))
        })
    }

    const drag = async (from: Point, to: Point) => {
        await pointer('pointerdown', from)
        await pointer('pointermove', to)
        await pointer('pointerup', to)
    }

    const removeButton = () =>
        [...host.querySelectorAll('button')].find((b) => b.textContent?.includes('Remove Watermark'))!

    beforeEach(() => {
        host = document.createElement('div')
        document.body.appendChild(host)
        root = createRoot(host)
        window.matchMedia = vi.fn(() => ({
            matches: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        })) as unknown as typeof window.matchMedia
        HTMLElement.prototype.setPointerCapture = vi.fn()
    })

    afterEach(() => {
        act(() => root.unmount())
        host.remove()
        vi.restoreAllMocks()
    })

    it('selects an area when the image had not laid out as its info arrived', async () => {
        setContainerWidth(0)
        setDisplayedImage(100, 50, 1000, 500)
        await renderTool()

        expect(removeButton().disabled).toBe(true)
        await drag([200, 150], [400, 250])

        expect(host.textContent).toContain('400 × 200 px selected')
        expect(removeButton().disabled).toBe(false)
    })

    it('maps the drag to image pixels using the size the image is displayed at', async () => {
        setContainerWidth(1000)
        setDisplayedImage(100, 50, 1000, 500)
        await renderTool()

        await drag([200, 150], [400, 250])

        expect(host.textContent).toContain('400 × 200 px selected')
        const marquee = surface().querySelector('div')!
        expect(marquee.style.left).toBe('10%')
        expect(marquee.style.top).toBe('20%')
        expect(marquee.style.width).toBe('20%')
        expect(marquee.style.height).toBe('20%')
    })

    it('stays accurate when the image is resized after loading', async () => {
        setContainerWidth(1000)
        setDisplayedImage(100, 50, 1000, 500)
        await renderTool()

        setDisplayedImage(100, 50, 500, 250)
        await drag([150, 100], [250, 150])

        expect(host.textContent).toContain('400 × 200 px selected')
    })
})
