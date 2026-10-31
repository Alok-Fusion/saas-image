/**
 * Generates an in-browser sample image blob for testing tools without user file.
 */
let cachedSample: File | null = null

export function getSampleImageFile(): Promise<File> {
    if (cachedSample) return Promise.resolve(cachedSample)

    return new Promise((resolve) => {
        const canvas = document.createElement('canvas')
        canvas.width = 1200
        canvas.height = 800
        const ctx = canvas.getContext('2d')

        if (!ctx) {
            const emptyBlob = new Blob(['sample'], { type: 'image/png' })
            const file = new File([emptyBlob], 'sample-image.png', { type: 'image/png' })
            resolve(file)
            return
        }

        // Background gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 1200, 800)
        bgGrad.addColorStop(0, '#1e1b4b')
        bgGrad.addColorStop(0.5, '#312e81')
        bgGrad.addColorStop(1, '#0f172a')
        ctx.fillStyle = bgGrad
        ctx.fillRect(0, 0, 1200, 800)

        // Geometric shapes
        ctx.fillStyle = '#6366f1'
        ctx.beginPath()
        ctx.arc(320, 400, 180, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = '#10b981'
        ctx.beginPath()
        ctx.arc(880, 400, 160, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = '#f59e0b'
        ctx.beginPath()
        ctx.roundRect(460, 260, 280, 280, 40)
        ctx.fill()

        // Text
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 56px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('ImageKit Pro Sample', 600, 390)

        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
        ctx.font = '28px sans-serif'
        ctx.fillText('1200 × 800 px · Client-Side Generated', 600, 450)

        canvas.toBlob((blob) => {
            canvas.width = 0
            canvas.height = 0
            if (blob) {
                cachedSample = new File([blob], 'sample-landscape.png', { type: 'image/png' })
                resolve(cachedSample)
            } else {
                const f = new File(['sample'], 'sample-landscape.png', { type: 'image/png' })
                resolve(f)
            }
        }, 'image/png')
    })
}
