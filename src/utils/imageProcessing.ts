/**
 * Image Processing Utilities
 * All processing happens client-side using Canvas API.
 */

export interface ImageInfo {
    width: number
    height: number
    size: number
    type: string
    name: string
}

export type OutputMime = 'image/jpeg' | 'image/png' | 'image/webp'

export interface CompressionResult {
    blob: Blob
    format: OutputMime
    originalSize: number
    isLarger: boolean
}

export interface DrawRect {
    x: number
    y: number
    width: number
    height: number
}

export interface ResizeOptions {
    format?: OutputMime
    quality?: number
    background?: string
}

/** Pick an output format from an explicit choice or the source format. */
export function getOutputMime(sourceType: string, requested?: OutputMime | 'auto'): OutputMime {
    if (requested && requested !== 'auto') return requested
    if (sourceType === 'image/jpeg') return 'image/jpeg'
    if (sourceType === 'image/webp') return 'image/webp'
    return 'image/png'
}

/** Compute the destination rectangle for a cover/contain fit. */
export function computeDrawRect(
    sourceWidth: number,
    sourceHeight: number,
    targetWidth: number,
    targetHeight: number,
    fit: 'cover' | 'contain'
): DrawRect {
    const sourceRatio = sourceWidth / sourceHeight
    const targetRatio = targetWidth / targetHeight

    let width: number
    let height: number

    if (fit === 'cover') {
        if (sourceRatio > targetRatio) {
            height = targetHeight
            width = height * sourceRatio
        } else {
            width = targetWidth
            height = width / sourceRatio
        }
    } else {
        if (sourceRatio > targetRatio) {
            width = targetWidth
            height = width / sourceRatio
        } else {
            height = targetHeight
            width = height * sourceRatio
        }
    }

    return {
        x: (targetWidth - width) / 2,
        y: (targetHeight - height) / 2,
        width,
        height,
    }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: OutputMime, quality?: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                canvas.width = 0
                canvas.height = 0
                if (blob) resolve(blob)
                else reject(new Error('Failed to encode image'))
            },
            type,
            quality
        )
    })
}

async function sourceToCanvasSource(
    source: File | Blob | HTMLImageElement
): Promise<{ source: CanvasImageSource; width: number; height: number; revoke: () => void }> {
    if (source instanceof HTMLImageElement) {
        return { source, width: source.naturalWidth || source.width, height: source.naturalHeight || source.height, revoke: () => {} }
    }

    if (typeof createImageBitmap === 'function') {
        try {
            const bitmap = await createImageBitmap(source)
            return { source: bitmap, width: bitmap.width, height: bitmap.height, revoke: () => bitmap.close() }
        } catch {
            // Fall through to the <img> path (e.g. Safari/HEIC quirks).
        }
    }

    const url = URL.createObjectURL(source)
    try {
        const img = await loadImageFromUrl(url)
        return { source: img, width: img.naturalWidth, height: img.naturalHeight, revoke: () => URL.revokeObjectURL(url) }
    } catch (error) {
        URL.revokeObjectURL(url)
        throw error
    }
}

/**
 * Get image dimensions and info from a File
 */
export async function getImageInfo(file: File): Promise<ImageInfo> {
    const loaded = await sourceToCanvasSource(file)
    try {
        return {
            width: loaded.width,
            height: loaded.height,
            size: file.size,
            type: file.type,
            name: file.name,
        }
    } finally {
        loaded.revoke()
    }
}

/**
 * Load an image file into an HTMLImageElement
 */
export async function loadImage(file: File | Blob): Promise<HTMLImageElement> {
    const url = URL.createObjectURL(file)
    try {
        return await loadImageFromUrl(url)
    } finally {
        URL.revokeObjectURL(url)
    }
}

/**
 * Load an image from a URL/blob URL
 */
export async function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = url
    })
}

/**
 * Compress an image to specified quality and format.
 * Reports when the result is larger than the input so the UI can offer the original.
 */
export async function compressImage(
    file: File,
    quality: number,
    format: OutputMime
): Promise<CompressionResult> {
    const loaded = await sourceToCanvasSource(file)

    try {
        const canvas = document.createElement('canvas')
        canvas.width = loaded.width
        canvas.height = loaded.height

        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Failed to get canvas context')

        if (format === 'image/jpeg') {
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
        }

        ctx.drawImage(loaded.source, 0, 0)

        const blob = await canvasToBlob(canvas, format, quality / 100)
        return {
            blob,
            format,
            originalSize: file.size,
            isLarger: blob.size > file.size,
        }
    } finally {
        loaded.revoke()
    }
}

/**
 * Resize an image to specified dimensions. Output format follows the caller's
 * choice, or the source format, and transparency is preserved for PNG/WebP.
 */
export async function resizeImage(
    file: File | Blob,
    targetWidth: number,
    targetHeight: number,
    fit: 'cover' | 'contain' = 'cover',
    options: ResizeOptions = {}
): Promise<Blob> {
    const sourceType = file.type || 'image/png'
    const format = options.format ?? getOutputMime(sourceType)
    const quality = options.quality ?? 0.92
    const loaded = await sourceToCanvasSource(file)

    try {
        const canvas = document.createElement('canvas')
        canvas.width = targetWidth
        canvas.height = targetHeight

        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Failed to get canvas context')

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        if (format === 'image/jpeg') {
            ctx.fillStyle = options.background ?? '#ffffff'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
        } else if (options.background) {
            ctx.fillStyle = options.background
            ctx.fillRect(0, 0, canvas.width, canvas.height)
        }

        const rect = computeDrawRect(loaded.width, loaded.height, targetWidth, targetHeight, fit)
        ctx.drawImage(loaded.source, rect.x, rect.y, rect.width, rect.height)

        return await canvasToBlob(canvas, format, quality)
    } finally {
        loaded.revoke()
    }
}

/**
 * Apply a solid color background to an image with transparency
 */
export async function applyBackground(
    imageBlob: Blob,
    backgroundColor: string
): Promise<Blob> {
    const loaded = await sourceToCanvasSource(imageBlob)

    try {
        const canvas = document.createElement('canvas')
        canvas.width = loaded.width
        canvas.height = loaded.height

        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Failed to get canvas context')

        ctx.fillStyle = backgroundColor
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(loaded.source, 0, 0)

        return await canvasToBlob(canvas, 'image/png')
    } finally {
        loaded.revoke()
    }
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1)
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Get file extension from mime type
 */
export function getExtension(mimeType: string): string {
    const extensions: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
        'image/avif': 'avif',
        'image/bmp': 'bmp',
        'image/svg+xml': 'svg',
        'image/heic': 'heic',
        'image/heif': 'heif',
    }
    return extensions[mimeType] || 'jpg'
}

/** Build a meaningful output filename: photo-compressed.webp */
export function buildOutputName(originalName: string, suffix: string, extension: string): string {
    const base = originalName.replace(/\.[^/.]+$/, '') || 'image'
    const safeSuffix = suffix ? `-${suffix.replace(/[^a-z0-9_-]+/gi, '-')}` : ''
    return `${base}${safeSuffix}.${extension}`
}
