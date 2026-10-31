import * as THREE from 'three'

/**
 * Creates high-fidelity procedural canvas textures offline.
 * Zero external network requests; runs 100% locally in-memory.
 */
export function createStudioPhotoTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 1024
    const ctx = canvas.getContext('2d')
    if (!ctx) return new THREE.CanvasTexture(canvas)

    // Deep artistic cinematic landscape gradient
    const grad = ctx.createLinearGradient(0, 0, 1024, 1024)
    grad.addColorStop(0, '#101018')
    grad.addColorStop(0.35, '#1e1b4b')
    grad.addColorStop(0.65, '#312e81')
    grad.addColorStop(0.85, '#4f46e5')
    grad.addColorStop(1, '#d4ff3a')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 1024, 1024)

    // Geometric landscape silhouette
    ctx.fillStyle = '#09090d'
    ctx.beginPath()
    ctx.moveTo(0, 1024)
    ctx.lineTo(0, 680)
    ctx.quadraticCurveTo(240, 520, 512, 640)
    ctx.quadraticCurveTo(768, 760, 1024, 560)
    ctx.lineTo(1024, 1024)
    ctx.closePath()
    ctx.fill()

    // Studio focal element (architectural arch)
    ctx.strokeStyle = 'rgba(212, 255, 58, 0.4)'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(512, 480, 220, 0, Math.PI * 2)
    ctx.stroke()

    // Fine grid overlay
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)'
    ctx.lineWidth = 1
    for (let x = 0; x <= 1024; x += 64) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, 1024)
        ctx.stroke()
    }
    for (let y = 0; y <= 1024; y += 64) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(1024, y)
        ctx.stroke()
    }

    // Typography badge
    ctx.fillStyle = '#ffffff'
    ctx.font = '600 24px -apple-system, sans-serif'
    ctx.fillText('IMAGEKIT PRO STUDIO // RAW PASS', 64, 960)

    const texture = new THREE.CanvasTexture(canvas)
    texture.generateMipmaps = true
    texture.minFilter = THREE.LinearMipmapLinearFilter
    return texture
}

export function createCutoutForegroundTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 1024
    const ctx = canvas.getContext('2d')
    if (!ctx) return new THREE.CanvasTexture(canvas)

    // Transparent background
    ctx.clearRect(0, 0, 1024, 1024)

    // Cutout subject: sleek geometric silhouette with glowing rim
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(512, 512, 260, 0, Math.PI * 2)
    ctx.fill()

    // Lime rim line
    ctx.strokeStyle = '#d4ff3a'
    ctx.lineWidth = 8
    ctx.stroke()

    const texture = new THREE.CanvasTexture(canvas)
    return texture
}

