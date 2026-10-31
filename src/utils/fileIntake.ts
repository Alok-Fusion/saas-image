import { getImageInfo } from './imageProcessing'

export const MAX_FILE_SIZE = 50 * 1024 * 1024
export const MAX_IMAGE_PIXELS = 100_000_000

export const ACCEPTED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'image/bmp',
    'image/heic',
    'image/heif',
] as const

export const IMAGE_ACCEPT_ATTRIBUTE = `${ACCEPTED_IMAGE_TYPES.join(',')},.jpg,.jpeg,.png,.webp,.gif,.avif,.bmp,.heic,.heif`

const HEIC_PATTERN = /\.(heic|heif)$/i

export type IntakeResult =
    | { ok: true; width: number; height: number }
    | { ok: false; error: string }

export function isHeic(file: File): boolean {
    return file.type === 'image/heic' || file.type === 'image/heif' || HEIC_PATTERN.test(file.name)
}

export function isAcceptedImage(file: File): boolean {
    if ((ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) return true
    return /\.(jpe?g|png|webp|gif|avif|bmp|heic|heif)$/i.test(file.name)
}

/** Validate size, type, pixels and perform a real decode. */
export async function validateImageFile(file: File): Promise<IntakeResult> {
    if (!isAcceptedImage(file)) {
        return {
            ok: false,
            error: `${file.name} is not a supported image. Use JPEG, PNG, WebP, GIF, AVIF, BMP, or HEIC.`,
        }
    }

    if (file.size > MAX_FILE_SIZE) {
        return {
            ok: false,
            error: `${file.name} is ${(file.size / (1024 * 1024)).toFixed(1)} MB. The limit is 50 MB per file.`,
        }
    }

    try {
        const info = await getImageInfo(file)
        const pixels = info.width * info.height
        if (pixels > MAX_IMAGE_PIXELS) {
            return {
                ok: false,
                error: `${file.name} is ${info.width}×${info.height} (${Math.round(pixels / 1_000_000)} MP). The limit is 100 MP to protect your browser tab.`,
            }
        }
        return { ok: true, width: info.width, height: info.height }
    } catch {
        if (isHeic(file)) {
            return {
                ok: false,
                error: `${file.name}: this browser cannot decode HEIC/HEIF images. Export it as JPEG or PNG first.`,
            }
        }
        return {
            ok: false,
            error: `${file.name} could not be decoded. The file may be corrupt or use an unsupported codec.`,
        }
    }
}

export async function validateFiles(
    files: File[],
    kind: 'image' | 'pdf' = 'image'
): Promise<{ valid: File[]; errors: string[] }> {
    const valid: File[] = []
    const errors: string[] = []

    for (const file of files) {
        if (kind === 'pdf') {
            if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                errors.push(`${file.name} is not a PDF.`)
            } else if (file.size > MAX_FILE_SIZE) {
                errors.push(`${file.name} is larger than 50 MB.`)
            } else {
                valid.push(file)
            }
            continue
        }

        const result = await validateImageFile(file)
        if (result.ok) valid.push(file)
        else errors.push(result.error)
    }

    return { valid, errors }
}
