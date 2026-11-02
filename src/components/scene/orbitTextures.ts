import * as THREE from 'three'

interface NodeTextureProps {
    shortName: string
    category: string
    color: string
}

const textureCache = new Map<string, THREE.CanvasTexture>()

/**
 * Creates an offline, crisp high-DPI canvas texture for a 3D orbit tool badge.
 */
export function getOrbitNodeTexture({ shortName, category, color }: NodeTextureProps): THREE.CanvasTexture {
    const key = `${shortName}-${color}`
    if (textureCache.has(key)) {
        return textureCache.get(key)!
    }

    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')

    if (!ctx) {
        const fallback = new THREE.CanvasTexture(canvas)
        textureCache.set(key, fallback)
        return fallback
    }

    // High quality anti-aliasing
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // Background circle with glass gradient
    const grad = ctx.createRadialGradient(256, 256, 40, 256, 256, 240)
    grad.addColorStop(0, '#1c1c28')
    grad.addColorStop(0.7, '#111118')
    grad.addColorStop(1, '#08080c')

    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(256, 256, 240, 0, Math.PI * 2)
    ctx.fill()

    // Outer rim glow with category color
    ctx.strokeStyle = color
    ctx.lineWidth = 10
    ctx.shadowColor = color
    ctx.shadowBlur = 25
    ctx.beginPath()
    ctx.arc(256, 256, 235, 0, Math.PI * 2)
    ctx.stroke()
    ctx.shadowBlur = 0 // reset shadow

    // Inner subtle ring
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(256, 256, 210, 0, Math.PI * 2)
    ctx.stroke()

    // Central accent dot / indicator
    ctx.fillStyle = color
    ctx.shadowColor = color
    ctx.shadowBlur = 20
    ctx.beginPath()
    ctx.arc(256, 170, 22, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    // Tool Name Text
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = 'bold 52px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(shortName, 256, 280)

    // Category label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'
    ctx.font = '600 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(category.toUpperCase(), 256, 350)

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.needsUpdate = true
    textureCache.set(key, texture)
    return texture
}

export function disposeOrbitTextures() {
    textureCache.forEach((tex) => tex.dispose())
    textureCache.clear()
}

