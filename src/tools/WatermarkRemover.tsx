import { useCallback, useEffect, useRef, useState } from 'react'
import { downloadBlob, getImageInfo, type ImageInfo } from '../utils/imageProcessing'

interface WatermarkRemoverProps {
    onBack: () => void
}

interface SelectionArea {
    x: number
    y: number
    width: number
    height: number
}

export default function WatermarkRemover({ onBack }: WatermarkRemoverProps) {
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [originalInfo, setOriginalInfo] = useState<ImageInfo | null>(null)
    const [processedUrl, setProcessedUrl] = useState<string | null>(null)
    const [processedBlob, setProcessedBlob] = useState<Blob | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [isSelecting, setIsSelecting] = useState(false)
    const [selection, setSelection] = useState<SelectionArea | null>(null)
    const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null)
    const [removalMethod, setRemovalMethod] = useState<'inpaint' | 'blur' | 'pixelate'>('inpaint')
    const [intensity, setIntensity] = useState(15)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [displayScale, setDisplayScale] = useState(1)

    const handleFile = useCallback(async (selectedFile: File) => {
        if (!selectedFile.type.startsWith('image/')) return
        setFile(selectedFile)
        const url = URL.createObjectURL(selectedFile)
        setPreview(url)
        if (processedUrl) URL.revokeObjectURL(processedUrl)
        setProcessedUrl(null)
        setProcessedBlob(null)
        setSelection(null)
        const info = await getImageInfo(selectedFile)
        setOriginalInfo(info)
    }, [processedUrl])

    // Calculate display scale when image loads
    useEffect(() => {
        if (containerRef.current && originalInfo) {
            const containerWidth = containerRef.current.clientWidth - 40
            const scale = Math.min(1, containerWidth / originalInfo.width)
            setDisplayScale(scale)
        }
    }, [originalInfo])

    const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }, [])
    const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false) }, [])
    const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]) }, [handleFile])

    // Selection handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!containerRef.current || !originalInfo) return
        const rect = containerRef.current.querySelector('img')?.getBoundingClientRect()
        if (!rect) return
        const x = (e.clientX - rect.left) / displayScale
        const y = (e.clientY - rect.top) / displayScale
        setIsSelecting(true)
        setSelectionStart({ x, y })
        setSelection({ x, y, width: 0, height: 0 })
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isSelecting || !selectionStart || !containerRef.current || !originalInfo) return
        const rect = containerRef.current.querySelector('img')?.getBoundingClientRect()
        if (!rect) return
        const x = Math.max(0, Math.min((e.clientX - rect.left) / displayScale, originalInfo.width))
        const y = Math.max(0, Math.min((e.clientY - rect.top) / displayScale, originalInfo.height))

        setSelection({
            x: Math.min(selectionStart.x, x),
            y: Math.min(selectionStart.y, y),
            width: Math.abs(x - selectionStart.x),
            height: Math.abs(y - selectionStart.y)
        })
    }

    const handleMouseUp = () => {
        setIsSelecting(false)
        setSelectionStart(null)
    }

    // Remove watermark from selected area
    const removeWatermark = async () => {
        if (!file || !originalInfo || !selection || selection.width < 5 || selection.height < 5) {
            alert('Please select the watermark area first')
            return
        }

        const img = new Image()
        img.src = preview!
        await new Promise(resolve => img.onload = resolve)

        const canvas = document.createElement('canvas')
        canvas.width = originalInfo.width
        canvas.height = originalInfo.height
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.drawImage(img, 0, 0)

        const { x, y, width, height } = selection
        const sx = Math.round(x)
        const sy = Math.round(y)
        const sw = Math.round(width)
        const sh = Math.round(height)

        if (removalMethod === 'inpaint') {
            // Simple content-aware fill using surrounding pixels
            const imageData = ctx.getImageData(0, 0, originalInfo.width, originalInfo.height)
            const data = imageData.data
            const radius = intensity

            for (let py = sy; py < sy + sh; py++) {
                for (let px = sx; px < sx + sw; px++) {
                    let r = 0, g = 0, b = 0, count = 0

                    // Sample from edges around the selection
                    for (let i = 0; i < radius * 4; i++) {
                        const angle = (i / (radius * 4)) * Math.PI * 2
                        const sampleX = Math.round(sx + sw / 2 + (sw / 2 + radius) * Math.cos(angle))
                        const sampleY = Math.round(sy + sh / 2 + (sh / 2 + radius) * Math.sin(angle))

                        if (sampleX >= 0 && sampleX < originalInfo.width && sampleY >= 0 && sampleY < originalInfo.height) {
                            if (sampleX < sx || sampleX >= sx + sw || sampleY < sy || sampleY >= sy + sh) {
                                const idx = (sampleY * originalInfo.width + sampleX) * 4
                                r += data[idx]
                                g += data[idx + 1]
                                b += data[idx + 2]
                                count++
                            }
                        }
                    }

                    if (count > 0) {
                        const idx = (py * originalInfo.width + px) * 4
                        // Add some noise for natural look
                        const noise = (Math.random() - 0.5) * 10
                        data[idx] = Math.min(255, Math.max(0, r / count + noise))
                        data[idx + 1] = Math.min(255, Math.max(0, g / count + noise))
                        data[idx + 2] = Math.min(255, Math.max(0, b / count + noise))
                    }
                }
            }
            ctx.putImageData(imageData, 0, 0)
        } else if (removalMethod === 'blur') {
            // Strong blur on selected area
            ctx.filter = `blur(${intensity}px)`
            ctx.drawImage(img, sx, sy, sw, sh, sx, sy, sw, sh)
            ctx.filter = 'none'
        } else if (removalMethod === 'pixelate') {
            // Pixelate the selected area
            const pixelSize = intensity
            const tempCanvas = document.createElement('canvas')
            tempCanvas.width = sw
            tempCanvas.height = sh
            const tempCtx = tempCanvas.getContext('2d')
            if (tempCtx) {
                tempCtx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh)
                tempCtx.imageSmoothingEnabled = false
                const smallW = Math.max(1, Math.floor(sw / pixelSize))
                const smallH = Math.max(1, Math.floor(sh / pixelSize))
                ctx.imageSmoothingEnabled = false
                ctx.drawImage(tempCanvas, 0, 0, sw, sh, sx, sy, smallW, smallH)
                ctx.drawImage(canvas, sx, sy, smallW, smallH, sx, sy, sw, sh)
                ctx.imageSmoothingEnabled = true
            }
        }

        const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'))
        if (processedUrl) URL.revokeObjectURL(processedUrl)
        setProcessedBlob(blob)
        setProcessedUrl(URL.createObjectURL(blob))
    }

    const handleDownload = () => {
        if (!processedBlob || !file) return
        downloadBlob(processedBlob, `${file.name.replace(/\.[^/.]+$/, '')}_cleaned.png`)
    }

    const handleReset = () => {
        if (preview) URL.revokeObjectURL(preview)
        if (processedUrl) URL.revokeObjectURL(processedUrl)
        setFile(null); setPreview(null); setOriginalInfo(null); setProcessedUrl(null); setProcessedBlob(null); setSelection(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const clearSelection = () => setSelection(null)

    return (
        <div className="tool-page">
            <div className="tool-header">
                <button className="back-button" onClick={onBack}>←</button>
                <h1 className="tool-title">Watermark Remover</h1>
            </div>

            {!file ? (
                <div className={`dropzone ${isDragging ? 'dragging' : ''}`} onClick={() => fileInputRef.current?.click()} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                    <div className="dropzone-content">
                        <div className="dropzone-icon">🧹</div>
                        <p className="dropzone-text">Drop image here or click to browse</p>
                        <p className="dropzone-hint">Select watermark area to remove it from your image</p>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} style={{ display: 'none' }} />
                </div>
            ) : (
                <>
                    <div className="controls-panel">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="control-group">
                                <label className="control-label"><span>Removal Method</span></label>
                                <div className="select-buttons">
                                    <button className={`select-button ${removalMethod === 'inpaint' ? 'active' : ''}`} onClick={() => setRemovalMethod('inpaint')}>🎨 Inpaint</button>
                                    <button className={`select-button ${removalMethod === 'blur' ? 'active' : ''}`} onClick={() => setRemovalMethod('blur')}>💨 Blur</button>
                                    <button className={`select-button ${removalMethod === 'pixelate' ? 'active' : ''}`} onClick={() => setRemovalMethod('pixelate')}>🔲 Pixelate</button>
                                </div>
                            </div>
                            <div className="control-group">
                                <label className="control-label"><span>Intensity: {intensity}</span></label>
                                <input type="range" min="5" max="30" value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} style={{ width: '100%' }} />
                            </div>
                        </div>
                        <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                            📌 Click and drag on the image to select the watermark area, then click "Remove Watermark"
                        </p>
                    </div>

                    <div
                        ref={containerRef}
                        className="image-preview-container"
                        style={{ marginTop: '1.5rem', position: 'relative', cursor: 'crosshair', userSelect: 'none' }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <img
                                src={processedUrl || preview!}
                                alt="Preview"
                                className="image-preview"
                                style={{ maxHeight: 500, pointerEvents: 'none' }}
                                draggable={false}
                            />
                            {selection && selection.width > 0 && selection.height > 0 && (
                                <div style={{
                                    position: 'absolute',
                                    left: selection.x * displayScale,
                                    top: selection.y * displayScale,
                                    width: selection.width * displayScale,
                                    height: selection.height * displayScale,
                                    border: '2px dashed #667eea',
                                    background: 'rgba(102, 126, 234, 0.2)',
                                    pointerEvents: 'none'
                                }} />
                            )}
                        </div>
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                    </div>

                    <div className="actions-bar">
                        <button className="secondary-button" onClick={handleReset}>🔄 New Image</button>
                        {selection && <button className="secondary-button" onClick={clearSelection}>❌ Clear Selection</button>}
                        <button className="download-button" onClick={removeWatermark} disabled={!selection}>🧹 Remove Watermark</button>
                        {processedBlob && <button className="download-button" onClick={handleDownload}>⬇️ Download</button>}
                    </div>
                </>
            )}
        </div>
    )
}
