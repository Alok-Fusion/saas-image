import { useCallback, useEffect, useRef, useState } from 'react'
import Dropzone from '../components/Dropzone'
import { useToast } from '../components/Toast'
import { useObjectUrl } from '../hooks/useObjectUrl'
import { buildOutputName, canvasToBlob, downloadBlob, getImageInfo, loadImage, type ImageInfo } from '../utils/imageProcessing'
import { runImageTask, type WorkerTask } from '../utils/imageWorker'

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
    const [originalInfo, setOriginalInfo] = useState<ImageInfo | null>(null)
    const [processedBlob, setProcessedBlob] = useState<Blob | null>(null)
    const [isSelecting, setIsSelecting] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [progress, setProgress] = useState(0)
    const [selection, setSelection] = useState<SelectionArea | null>(null)
    const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null)
    const [removalMethod, setRemovalMethod] = useState<'inpaint' | 'blur' | 'pixelate'>('inpaint')
    const [intensity, setIntensity] = useState(15)
    const containerRef = useRef<HTMLDivElement>(null)
    const taskRef = useRef<WorkerTask<ArrayBuffer> | null>(null)
    const [displayScale, setDisplayScale] = useState(1)
    const preview = useObjectUrl(file)
    const processedUrl = useObjectUrl(processedBlob)
    const { error } = useToast()

    const handleFile = useCallback(async (selectedFile: File) => {
        taskRef.current?.cancel()
        setFile(selectedFile)
        setProcessedBlob(null)
        setSelection(null)
        setProgress(0)
        try {
            setOriginalInfo(await getImageInfo(selectedFile))
        } catch {
            setOriginalInfo(null)
        }
    }, [])

    useEffect(() => () => taskRef.current?.cancel(), [])

    // Calculate display scale when image loads
    useEffect(() => {
        if (containerRef.current && originalInfo) {
            const containerWidth = containerRef.current.clientWidth - 40
            const scale = Math.min(1, containerWidth / originalInfo.width)
            setDisplayScale(scale)
        }
    }, [originalInfo])

    const pointFromEvent = (e: React.PointerEvent) => {
        const rect = containerRef.current?.querySelector('img')?.getBoundingClientRect()
        if (!rect) return null
        return {
            x: Math.max(0, Math.min((e.clientX - rect.left) / displayScale, originalInfo?.width ?? 0)),
            y: Math.max(0, Math.min((e.clientY - rect.top) / displayScale, originalInfo?.height ?? 0)),
        }
    }

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!originalInfo) return
        const point = pointFromEvent(e)
        if (!point) return
        e.currentTarget.setPointerCapture(e.pointerId)
        setIsSelecting(true)
        setSelectionStart(point)
        setSelection({ x: point.x, y: point.y, width: 0, height: 0 })
    }

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isSelecting || !selectionStart) return
        const point = pointFromEvent(e)
        if (!point) return
        setSelection({
            x: Math.min(selectionStart.x, point.x),
            y: Math.min(selectionStart.y, point.y),
            width: Math.abs(point.x - selectionStart.x),
            height: Math.abs(point.y - selectionStart.y)
        })
    }

    const handlePointerUp = () => {
        setIsSelecting(false)
        setSelectionStart(null)
    }

    const removeWatermark = async () => {
        if (!file || !originalInfo || !selection || selection.width < 5 || selection.height < 5) {
            error('Select the watermark area on the image first.')
            return
        }

        taskRef.current?.cancel()
        setIsProcessing(true)
        setProgress(0)

        try {
            const img = await loadImage(file)
            const canvas = document.createElement('canvas')
            canvas.width = originalInfo.width
            canvas.height = originalInfo.height
            const ctx = canvas.getContext('2d')
            if (!ctx) throw new Error('Canvas is not available')

            ctx.drawImage(img, 0, 0)

            const { x, y, width, height } = selection
            const sx = Math.round(x)
            const sy = Math.round(y)
            const sw = Math.max(1, Math.round(width))
            const sh = Math.max(1, Math.round(height))

            if (removalMethod === 'inpaint') {
                const imageData = ctx.getImageData(0, 0, originalInfo.width, originalInfo.height)
                const buffer = imageData.data.buffer as ArrayBuffer
                const task = runImageTask<ArrayBuffer>(
                    {
                        kind: 'inpaint',
                        data: buffer,
                        width: originalInfo.width,
                        height: originalInfo.height,
                        x: sx,
                        y: sy,
                        sw,
                        sh,
                    },
                    { transfer: [buffer], onProgress: setProgress }
                )
                taskRef.current = task
                const result = await task.promise
                ctx.putImageData(new ImageData(new Uint8ClampedArray(result), originalInfo.width, originalInfo.height), 0, 0)
            } else if (removalMethod === 'blur') {
                ctx.filter = `blur(${intensity}px)`
                ctx.drawImage(img, sx, sy, sw, sh, sx, sy, sw, sh)
                ctx.filter = 'none'
            } else {
                const tempCanvas = document.createElement('canvas')
                tempCanvas.width = sw
                tempCanvas.height = sh
                const tempCtx = tempCanvas.getContext('2d')
                if (!tempCtx) throw new Error('Canvas is not available')
                tempCtx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh)
                const smallW = Math.max(1, Math.floor(sw / intensity))
                const smallH = Math.max(1, Math.floor(sh / intensity))
                ctx.imageSmoothingEnabled = false
                ctx.drawImage(tempCanvas, 0, 0, sw, sh, sx, sy, smallW, smallH)
                ctx.drawImage(tempCanvas, 0, 0, smallW, smallH, sx, sy, sw, sh)
                ctx.imageSmoothingEnabled = true
            }

            setProcessedBlob(await canvasToBlob(canvas, 'image/png'))
        } catch (err) {
            if (!(err instanceof Error && err.name === 'AbortError')) {
                error(err instanceof Error ? err.message : 'Could not remove the watermark')
            }
        } finally {
            setIsProcessing(false)
            taskRef.current = null
        }
    }

    const cancel = () => {
        taskRef.current?.cancel()
    }

    const handleDownload = () => {
        if (!processedBlob || !file) return
        downloadBlob(processedBlob, buildOutputName(file.name, 'cleaned', 'png'))
    }

    const handleReset = () => {
        taskRef.current?.cancel()
        setFile(null)
        setOriginalInfo(null)
        setProcessedBlob(null)
        setSelection(null)
        setProgress(0)
    }

    const clearSelection = () => setSelection(null)

    return (
        <div className="tool-page">
            <div className="tool-header">
                <button className="back-button" onClick={onBack}>←</button>
                <h1 className="tool-title">Watermark Remover</h1>
            </div>

            {!file ? (
                <Dropzone
                    onFiles={(files) => void handleFile(files[0])}
                    icon="🧹"
                    title="Drop image here or click to browse"
                    hint="Select watermark area to remove it from your image"
                />
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
                        style={{ marginTop: '1.5rem', position: 'relative', cursor: 'crosshair', userSelect: 'none', touchAction: 'none' }}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                    >
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <img
                                src={processedUrl || preview || ''}
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
                    </div>

                    <div className="actions-bar">
                        <button className="secondary-button" onClick={handleReset}>🔄 New Image</button>
                        {selection && <button className="secondary-button" onClick={clearSelection}>❌ Clear Selection</button>}
                        <button className="download-button" onClick={() => void removeWatermark()} disabled={!selection || isProcessing}>
                            🧹 {isProcessing ? 'Removing…' : 'Remove Watermark'}
                        </button>
                        {processedBlob && <button className="download-button" onClick={handleDownload}>⬇️ Download</button>}
                    </div>
                </>
            )}

            {isProcessing && removalMethod === 'inpaint' && (
                <div className="processing-overlay">
                    <div className="processing-content">
                        <div className="processing-spinner" />
                        <div className="processing-text">Inpainting... {progress}%</div>
                        <div className="progress-track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                            <div className="progress-fill" style={{ width: `${progress}%` }} />
                        </div>
                        <button className="secondary-button" style={{ marginTop: '1rem' }} onClick={cancel}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
