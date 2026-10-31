/// <reference lib="webworker" />
import { CHAR_SETS, type ImageWorkerInput, type PaletteColor, type WorkerResponse } from './types'

declare const self: DedicatedWorkerGlobalScope

type Req = ImageWorkerInput & { id: number }

function toHex(value: number): string {
    return value.toString(16).padStart(2, '0')
}

async function decode(file: File, maxDimension?: number): Promise<{ bitmap: ImageBitmap; width: number; height: number }> {
    const bitmap = await createImageBitmap(file)
    if (!maxDimension || Math.max(bitmap.width, bitmap.height) <= maxDimension) {
        return { bitmap, width: bitmap.width, height: bitmap.height }
    }

    const scale = maxDimension / Math.max(bitmap.width, bitmap.height)
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = new OffscreenCanvas(width, height)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas is unavailable in this browser')
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()
    const scaled = canvas.transferToImageBitmap()
    return { bitmap: scaled, width, height }
}

function drawToData(bitmap: ImageBitmap, width: number, height: number): ImageData {
    const canvas = new OffscreenCanvas(width, height)
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new Error('Canvas is unavailable in this browser')
    ctx.drawImage(bitmap, 0, 0, width, height)
    return ctx.getImageData(0, 0, width, height)
}

async function handleAscii(req: Extract<ImageWorkerInput, { kind: 'ascii' }>): Promise<string> {
    const { bitmap } = await decode(req.file)
    try {
        const outputWidth = Math.max(10, Math.min(400, Math.round(req.width)))
        const outputHeight = Math.max(1, Math.floor((outputWidth * bitmap.height) / bitmap.width * 0.5))
        const imageData = drawToData(bitmap, outputWidth, outputHeight)
        const pixels = imageData.data
        const chars = req.inverted
            ? CHAR_SETS[req.charSet].split('').reverse().join('')
            : CHAR_SETS[req.charSet]

        const lines: string[] = []
        for (let y = 0; y < outputHeight; y++) {
            let line = ''
            for (let x = 0; x < outputWidth; x++) {
                const idx = (y * outputWidth + x) * 4
                const brightness = pixels[idx] * 0.299 + pixels[idx + 1] * 0.587 + pixels[idx + 2] * 0.114
                const charIdx = Math.floor((brightness / 255) * (chars.length - 1))
                line += chars[charIdx]
            }
            lines.push(line)
        }
        return lines.join('\n')
    } finally {
        bitmap.close()
    }
}

async function handlePalette(req: Extract<ImageWorkerInput, { kind: 'palette' }>): Promise<PaletteColor[]> {
    const { bitmap } = await decode(req.file, 160)
    try {
        const size = 100
        const imageData = drawToData(bitmap, size, size)
        const pixels = imageData.data
        const colorMap = new Map<string, number>()
        let total = 0

        for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i + 3] < 32) continue
            const r = Math.round(pixels[i] / 16) * 16
            const g = Math.round(pixels[i + 1] / 16) * 16
            const b = Math.round(pixels[i + 2] / 16) * 16
            const key = `${r},${g},${b}`
            colorMap.set(key, (colorMap.get(key) ?? 0) + 1)
            total += 1
        }

        const sorted = Array.from(colorMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, Math.max(1, Math.min(24, req.numColors)))

        return sorted.map(([key, count]) => {
            const [r, g, b] = key.split(',').map(Number)
            return {
                hex: `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase(),
                rgb: `rgb(${r}, ${g}, ${b})`,
                count,
                percentage: total > 0 ? Math.round((count / total) * 100) : 0,
            }
        })
    } finally {
        bitmap.close()
    }
}

async function handleHash(req: Extract<ImageWorkerInput, { kind: 'hash' }>): Promise<string> {
    const { bitmap } = await decode(req.file)
    try {
        const size = 8
        const imageData = drawToData(bitmap, size, size)
        const pixels = imageData.data
        const grayscale: number[] = []
        let total = 0
        for (let i = 0; i < pixels.length; i += 4) {
            const gray = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114
            grayscale.push(gray)
            total += gray
        }
        const average = total / grayscale.length
        return grayscale.map((gray) => (gray >= average ? '1' : '0')).join('')
    } finally {
        bitmap.close()
    }
}

async function handleColorblind(req: Extract<ImageWorkerInput, { kind: 'colorblind' }>): Promise<Blob> {
    const { bitmap, width, height } = await decode(req.file, req.maxDimension)
    try {
        const imageData = drawToData(bitmap, width, height)
        const data = imageData.data
        const m = req.matrix
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i]
            const g = data[i + 1]
            const b = data[i + 2]
            data[i] = Math.min(255, Math.max(0, r * m[0][0] + g * m[0][1] + b * m[0][2]))
            data[i + 1] = Math.min(255, Math.max(0, r * m[1][0] + g * m[1][1] + b * m[1][2]))
            data[i + 2] = Math.min(255, Math.max(0, r * m[2][0] + g * m[2][1] + b * m[2][2]))
        }
        const canvas = new OffscreenCanvas(width, height)
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Canvas is unavailable in this browser')
        ctx.putImageData(imageData, 0, 0)
        return await canvas.convertToBlob({ type: 'image/png' })
    } finally {
        bitmap.close()
    }
}

function handleInpaint(req: Extract<ImageWorkerInput, { kind: 'inpaint' }>): ArrayBuffer {
    const { width, height, x, y, sw, sh } = req
    const data = new Uint8ClampedArray(req.data)
    const x0 = Math.max(0, Math.floor(x))
    const y0 = Math.max(0, Math.floor(y))
    const x1 = Math.min(width, Math.ceil(x + sw))
    const y1 = Math.min(height, Math.ceil(y + sh))
    const total = Math.max(0, (x1 - x0) * (y1 - y0))
    if (total === 0) return data.buffer

    const mask = new Uint8Array(width * height)
    for (let py = y0; py < y1; py++) {
        for (let px = x0; px < x1; px++) mask[py * width + px] = 1
    }

    const queue = new Uint32Array(total)
    let head = 0
    let tail = 0
    const offsets = [-1, 1, -width, width, -width - 1, -width + 1, width - 1, width + 1]

    const enqueueBoundary = () => {
        for (let py = y0; py < y1; py++) {
            for (let px = x0; px < x1; px++) {
                const index = py * width + px
                if (mask[index] !== 1) continue
                for (const offset of offsets) {
                    const neighbor = index + offset
                    if (neighbor >= 0 && neighbor < mask.length && mask[neighbor] === 0) {
                        mask[index] = 2
                        queue[tail++] = index
                        break
                    }
                }
            }
        }
    }
    enqueueBoundary()

    let filled = 0
    let lastReport = 0
    while (head < tail) {
        const index = queue[head++]
        const py = Math.floor(index / width)
        const px = index - py * width
        let r = 0
        let g = 0
        let b = 0
        let count = 0

        for (const offset of offsets) {
            const neighbor = index + offset
            if (neighbor < 0 || neighbor >= mask.length || mask[neighbor] !== 0) continue
            const nx = neighbor % width
            if (Math.abs(nx - px) > 1) continue
            const dataIndex = neighbor * 4
            r += data[dataIndex]
            g += data[dataIndex + 1]
            b += data[dataIndex + 2]
            count += 1
        }

        if (count > 0) {
            const dataIndex = index * 4
            data[dataIndex] = r / count
            data[dataIndex + 1] = g / count
            data[dataIndex + 2] = b / count
        }
        mask[index] = 0
        filled += 1

        for (const offset of offsets) {
            const neighbor = index + offset
            if (neighbor < 0 || neighbor >= mask.length) continue
            const nx = neighbor % width
            if (Math.abs(nx - px) > 1) continue
            if (mask[neighbor] === 1) {
                mask[neighbor] = 2
                queue[tail++] = neighbor
            }
        }

        if (filled - lastReport >= Math.max(1000, Math.floor(total / 20))) {
            lastReport = filled
            self.postMessage({ type: 'progress', progress: Math.round((filled / total) * 100) } satisfies WorkerResponse)
        }
    }

    self.postMessage({ type: 'progress', progress: 100 } satisfies WorkerResponse)
    return data.buffer
}

self.onmessage = async (event: MessageEvent<Req>) => {
    const { id, ...rest } = event.data
    const payload = rest as ImageWorkerInput
    try {
        let result: unknown
        switch (payload.kind) {
            case 'ascii':
                result = await handleAscii(payload)
                break
            case 'palette':
                result = await handlePalette(payload)
                break
            case 'hash':
                result = await handleHash(payload)
                break
            case 'colorblind':
                result = await handleColorblind(payload)
                break
            case 'inpaint':
                result = handleInpaint(payload)
                break
        }
        self.postMessage({ id, ok: true, result } satisfies WorkerResponse, result instanceof ArrayBuffer ? [result] : [])
    } catch (error) {
        self.postMessage({
            id,
            ok: false,
            error: error instanceof Error ? error.message : 'Worker failed',
        } satisfies WorkerResponse)
    }
}

export {}
