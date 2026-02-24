/**
 * Output Branding Utility
 * Adds "Made with ImageKit Pro ✨" badge to output images
 */

export function addBrandingToCanvas(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const text = 'Made with ImageKit Pro ✨'
    const fontSize = Math.max(12, Math.min(canvas.width * 0.018, 20))
    const paddingX = fontSize * 0.8
    const paddingY = fontSize * 0.5
    const margin = fontSize

    ctx.save()

    // Measure text
    ctx.font = `600 ${fontSize}px Inter, -apple-system, BlinkMacSystemFont, sans-serif`
    const metrics = ctx.measureText(text)
    const badgeW = metrics.width + paddingX * 2
    const badgeH = fontSize + paddingY * 2
    const x = canvas.width - badgeW - margin
    const y = canvas.height - badgeH - margin
    const radius = badgeH / 2

    // Draw pill background
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + badgeW - radius, y)
    ctx.arcTo(x + badgeW, y, x + badgeW, y + radius, radius)
    ctx.arcTo(x + badgeW, y + badgeH, x + badgeW - radius, y + badgeH, radius)
    ctx.lineTo(x + radius, y + badgeH)
    ctx.arcTo(x, y + badgeH, x, y + radius, radius)
    ctx.arcTo(x, y, x + radius, y, radius)
    ctx.closePath()

    ctx.fillStyle = 'rgba(10, 10, 15, 0.75)'
    ctx.fill()

    // Gradient border
    ctx.strokeStyle = 'rgba(102, 126, 234, 0.6)'
    ctx.lineWidth = 1
    ctx.stroke()

    // Draw text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.fillText(text, x + badgeW / 2, y + badgeH / 2)

    ctx.restore()
}

export async function addBrandingToBlob(blob: Blob): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext('2d')
            if (!ctx) {
                resolve(blob) // fallback: return original
                return
            }
            ctx.drawImage(img, 0, 0)
            addBrandingToCanvas(canvas)

            canvas.toBlob(
                (newBlob) => {
                    if (newBlob) {
                        resolve(newBlob)
                    } else {
                        resolve(blob)
                    }
                },
                blob.type || 'image/png',
                0.95
            )
        }
        img.onerror = () => reject(new Error('Failed to load image for branding'))
        img.src = URL.createObjectURL(blob)
    })
}
