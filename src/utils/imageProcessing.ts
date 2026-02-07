/**
 * Image Processing Utilities
 * All processing happens client-side using Canvas API
 */

export interface ImageInfo {
    width: number;
    height: number;
    size: number;
    type: string;
    name: string;
}

/**
 * Get image dimensions and info from a File
 */
export async function getImageInfo(file: File): Promise<ImageInfo> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve({
                width: img.width,
                height: img.height,
                size: file.size,
                type: file.type,
                name: file.name
            });
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };

        img.src = url;
    });
}

/**
 * Load an image file into an HTMLImageElement
 */
export async function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };

        img.src = url;
    });
}

/**
 * Load an image from a URL/blob URL
 */
export async function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image'));

        img.src = url;
    });
}

/**
 * Compress an image to specified quality and format
 */
export async function compressImage(
    file: File,
    quality: number,
    format: 'image/jpeg' | 'image/png' | 'image/webp'
): Promise<Blob> {
    const img = await loadImage(file);

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    // White background for JPEG (no transparency support)
    if (format === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(img, 0, 0);

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) resolve(blob);
                else reject(new Error('Failed to compress image'));
            },
            format,
            quality / 100
        );
    });
}

/**
 * Resize an image to specified dimensions
 */
export async function resizeImage(
    file: File | Blob,
    targetWidth: number,
    targetHeight: number,
    fit: 'cover' | 'contain' = 'cover'
): Promise<Blob> {
    const img = file instanceof File
        ? await loadImage(file)
        : await loadImageFromUrl(URL.createObjectURL(file));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const sourceRatio = img.width / img.height;
    const targetRatio = targetWidth / targetHeight;

    let drawWidth: number;
    let drawHeight: number;
    let drawX: number;
    let drawY: number;

    if (fit === 'cover') {
        // Cover: fill the entire canvas, may crop
        if (sourceRatio > targetRatio) {
            drawHeight = targetHeight;
            drawWidth = drawHeight * sourceRatio;
            drawX = (targetWidth - drawWidth) / 2;
            drawY = 0;
        } else {
            drawWidth = targetWidth;
            drawHeight = drawWidth / sourceRatio;
            drawX = 0;
            drawY = (targetHeight - drawHeight) / 2;
        }
    } else {
        // Contain: fit within canvas, may have letterbox
        if (sourceRatio > targetRatio) {
            drawWidth = targetWidth;
            drawHeight = drawWidth / sourceRatio;
            drawX = 0;
            drawY = (targetHeight - drawHeight) / 2;
        } else {
            drawHeight = targetHeight;
            drawWidth = drawHeight * sourceRatio;
            drawX = (targetWidth - drawWidth) / 2;
            drawY = 0;
        }
    }

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) resolve(blob);
                else reject(new Error('Failed to resize image'));
            },
            'image/jpeg',
            0.92
        );
    });
}

/**
 * Apply a solid color background to an image with transparency
 */
export async function applyBackground(
    imageBlob: Blob,
    backgroundColor: string
): Promise<Blob> {
    const img = await loadImageFromUrl(URL.createObjectURL(imageBlob));

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) resolve(blob);
                else reject(new Error('Failed to apply background'));
            },
            'image/png'
        );
    });
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file extension from mime type
 */
export function getExtension(mimeType: string): string {
    const extensions: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif'
    };
    return extensions[mimeType] || 'jpg';
}
