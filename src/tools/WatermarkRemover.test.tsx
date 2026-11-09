import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { canvasToBlob, loadImage } from '../utils/imageProcessing'
import { runImageTask } from '../utils/imageWorker'
import { createSampleImage } from '../utils/sampleImage'
import WatermarkRemover from './WatermarkRemover'

vi.mock('../utils/imageProcessing', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../utils/imageProcessing')>()),
    getImageInfo: vi.fn(async () => ({ width: 2000, height: 1000, size: 1024, type: 'image/png', name: 'photo.png' })),
    loadImage: vi.fn(),
    canvasToBlob: vi.fn(),
}))

vi.mock('../utils/imageWorker', () => ({ runImageTask: vi.fn() }))

vi.mock('../utils/sampleImage', () => ({ createSampleImage: vi.fn() }))

type Point = [x: number, y: number]
type Area = [from: Point, to: Point]

describe('WatermarkRemover', () => {
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

    const renderTool = async (file = new File(['image'], 'photo.png', { type: 'image/png' })) => {
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

    const button = (label: string) =>
        [...host.querySelectorAll('button')].find((b) => b.textContent?.includes(label))

    const removeButton = () => button('Remove Watermark')!

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

    describe('removals', () => {
        const FIRST_AREA: Area = [[100, 100], [200, 150]]
        const SECOND_AREA: Area = [[500, 300], [620, 360]]

        const file = new File(['photo'], 'photo.png', { type: 'image/png' })
        const sample = new File(['sample'], 'sample.png', { type: 'image/png' })

        let outputs: Blob[]
        let drawImage: ReturnType<typeof vi.fn>
        let rect: ReturnType<typeof vi.fn>
        let clip: ReturnType<typeof vi.fn>
        let restore: ReturnType<typeof vi.fn>

        const click = async (label: string) => {
            await act(async () => {
                button(label)!.click()
            })
        }

        const removeArea = async (area: Area) => {
            await drag(...area)
            await click('Remove Watermark')
        }

        // Identity, because toEqual can't tell two Blobs apart
        const expectLoadedFrom = (...expected: Blob[]) => {
            const loaded = vi.mocked(loadImage).mock.calls.map(([source]) => source)
            expect(loaded).toHaveLength(expected.length)
            expected.forEach((source, i) => expect(loaded[i]).toBe(source))
        }

        // Hold back the next encode, so a test can act while that removal is still running
        const holdNextEncode = () => {
            let finish: (blob: Blob) => void = () => {}
            vi.mocked(canvasToBlob).mockImplementationOnce(
                () => new Promise((resolve) => {
                    finish = resolve
                })
            )
            return (blob: Blob) => act(async () => finish(blob))
        }

        beforeEach(() => {
            setDisplayedImage(0, 0, 2000, 1000)

            drawImage = vi.fn()
            rect = vi.fn()
            clip = vi.fn()
            restore = vi.fn()
            vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
                drawImage,
                getImageData: () => ({ data: new Uint8ClampedArray(4) }),
                putImageData: vi.fn(),
                save: vi.fn(),
                beginPath: vi.fn(),
                rect,
                clip,
                restore,
            } as unknown as CanvasRenderingContext2D)
            vi.stubGlobal('ImageData', class {})

            outputs = []
            vi.mocked(loadImage).mockImplementation(
                async (source) => ({ decodedFrom: source }) as unknown as HTMLImageElement
            )
            vi.mocked(canvasToBlob).mockImplementation(async () => {
                const output = new Blob([`result ${outputs.length + 1}`], { type: 'image/png' })
                outputs.push(output)
                return output
            })
            vi.mocked(runImageTask).mockImplementation((() => ({
                promise: Promise.resolve(new ArrayBuffer(4)),
                cancel: vi.fn(),
            })) as unknown as typeof runImageTask)
            vi.mocked(createSampleImage).mockResolvedValue(sample)
        })

        afterEach(() => {
            vi.unstubAllGlobals()
        })

        it.each(['Inpaint (AI)', 'Blur', 'Pixelate'])('%s starts from the previous result', async (method) => {
            await renderTool(file)
            await click(method)

            await removeArea(FIRST_AREA)
            const drawsOfFirstRemoval = drawImage.mock.calls.length
            await removeArea(SECOND_AREA)

            expectLoadedFrom(file, outputs[0])

            const decodedDraws = drawImage.mock.calls
                .slice(drawsOfFirstRemoval)
                .map(([source]) => (source as { decodedFrom?: Blob }).decodedFrom)
                .filter(Boolean)
            expect(decodedDraws.length).toBeGreaterThan(0)
            decodedDraws.forEach((source) => expect(source).toBe(outputs[0]))
        })

        it('keeps Blur inside the selection at full strength', async () => {
            await renderTool(file)
            await click('Blur')

            await removeArea(FIRST_AREA)

            expect(rect).toHaveBeenCalledWith(100, 100, 100, 50)
            const [, ...blurDraws] = drawImage.mock.invocationCallOrder
            expect(blurDraws.length).toBeGreaterThan(0)
            blurDraws.forEach((draw) => {
                expect(draw).toBeGreaterThan(clip.mock.invocationCallOrder[0])
                expect(draw).toBeLessThan(restore.mock.invocationCallOrder[0])
            })
            // Reading only the selection would fade the blur out towards its edges
            drawImage.mock.calls.slice(1).forEach((args) => expect(args.length).toBeLessThan(9))
        })

        it('keeps building across more than two removals', async () => {
            await renderTool(file)

            await removeArea(FIRST_AREA)
            await removeArea(SECOND_AREA)
            await removeArea([[700, 50], [800, 100]])

            expectLoadedFrom(file, outputs[0], outputs[1])
        })

        it('clears the selection once its area is done', async () => {
            await renderTool(file)
            await drag(...FIRST_AREA)
            expect(removeButton().disabled).toBe(false)

            await click('Remove Watermark')

            expect(host.textContent).toContain('No area selected yet.')
            expect(removeButton().disabled).toBe(true)
            expect(surface().querySelector('div')).toBeNull()
        })

        it('keeps the selection and the earlier result when a removal fails', async () => {
            await renderTool(file)
            await removeArea(FIRST_AREA)

            vi.mocked(canvasToBlob).mockRejectedValueOnce(new Error('Failed to encode image'))
            await removeArea(SECOND_AREA)

            expect(host.textContent).toContain('120 × 60 px selected')
            expect(removeButton().disabled).toBe(false)

            await click('Remove Watermark')
            expectLoadedFrom(file, outputs[0], outputs[0])
        })

        it('keeps the selection when an inpaint is cancelled', async () => {
            let abort: () => void = () => {}
            vi.mocked(runImageTask).mockImplementationOnce((() => ({
                promise: new Promise((_resolve, reject) => {
                    abort = () => reject(Object.assign(new Error('Cancelled'), { name: 'AbortError' }))
                }),
                cancel: () => abort(),
            })) as unknown as typeof runImageTask)
            await renderTool(file)

            await removeArea(FIRST_AREA)
            await click('Cancel')

            expect(host.textContent).toContain('100 × 50 px selected')
            expect(removeButton().disabled).toBe(false)
            expect(button('Download Result')).toBeUndefined()
        })

        it('keeps a selection drawn while a removal was running', async () => {
            await renderTool(file)
            await click('Blur')
            const finishEncode = holdNextEncode()

            await removeArea(FIRST_AREA)
            await drag(...SECOND_AREA)
            await finishEncode(new Blob(['result'], { type: 'image/png' }))

            expect(host.textContent).toContain('120 × 60 px selected')
        })

        it('starts from the new file after a reset', async () => {
            await renderTool(file)
            await removeArea(FIRST_AREA)

            await click('Reset')
            await click('Try sample image')
            await removeArea(SECOND_AREA)

            expectLoadedFrom(file, sample)
        })

        it('starts from a new initial file', async () => {
            const next = new File(['next'], 'next.png', { type: 'image/png' })
            await renderTool(file)
            await removeArea(FIRST_AREA)

            await renderTool(next)
            await removeArea(SECOND_AREA)

            expectLoadedFrom(file, next)
        })

        it('drops a removal that finishes after the image was replaced', async () => {
            await renderTool(file)
            await click('Blur')
            const finishEncode = holdNextEncode()
            await removeArea(FIRST_AREA)

            await click('Reset')
            await click('Try sample image')
            await finishEncode(new Blob(['stale result'], { type: 'image/png' }))

            expect(button('Download Result')).toBeUndefined()

            await removeArea(SECOND_AREA)
            expectLoadedFrom(file, sample)
        })
    })
})
