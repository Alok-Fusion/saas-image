import { useCallback, useRef, useState } from 'react'
import Dropzone from '../components/Dropzone'
import { useToast } from '../components/Toast'
import { useObjectUrl } from '../hooks/useObjectUrl'
import {
    buildOutputName,
    canvasToBlob,
    downloadBlob,
    getExtension,
    getImageInfo,
    getOutputMime,
    loadImage,
} from '../utils/imageProcessing'

interface ImageCropperProps {
    onBack: () => void
}

interface CropArea {
    x: number
    y: number
    width: number
    height: number
}

const ASPECT_RATIOS = [
    { label: 'Free', value: null },
    { label: '1:1', value: 1 },
    { label: '16:9', value: 16 / 9 },
    { label: '9:16', value: 9 / 16 },
    { label: '4:3', value: 4 / 3 },
    { label: '3:4', value: 3 / 4 },
    { label: '3:2', value: 3 / 2 },
    { label: '2:3', value: 2 / 3 },
]

const MIN_SIZE = 5

export default function ImageCropper({ onBack }: ImageCropperProps) {
    const [file, setFile] = useState<File | null>(null)
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null)
    const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 100, height: 100 })
    const [aspectRatio, setAspectRatio] = useState<number | null>(null)
    const [dragType, setDragType] = useState<'move' | 'resize' | null>(null)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const [isProcessing, setIsProcessing] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const imgRef = useRef<HTMLImageElement>(null)
    const preview = useObjectUrl(file)
    const { error } = useToast()

    const handleFile = useCallback(async (selectedFile: File) => {
        setFile(selectedFile)
        setAspectRatio(null)
        setCropArea({ x: 0, y: 0, width: 100, height: 100 })
        try {
            const info = await getImageInfo(selectedFile)
            setImageDimensions({ width: info.width, height: info.height })
        } catch (err) {
            setImageDimensions(null)
            error(err instanceof Error ? err.message : 'Could not read the image')
        }
    }, [error])

    const handlePointerDown = (e: React.PointerEvent, type: 'move' | 'resize') => {
        e.preventDefault()
        e.stopPropagation()
        e.currentTarget.setPointerCapture(e.pointerId)
        setDragType(type)
        setDragStart({ x: e.clientX, y: e.clientY })
    }

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!dragType) return
        const rect = imgRef.current?.getBoundingClientRect()
        if (!rect) return

        const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100
        const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100
        const imgAspect = imageDimensions ? imageDimensions.width / imageDimensions.height : 1

        setCropArea((prev) => {
            if (dragType === 'move') {
                return {
                    ...prev,
                    x: Math.max(0, Math.min(100 - prev.width, prev.x + deltaX)),
                    y: Math.max(0, Math.min(100 - prev.height, prev.y + deltaY)),
                }
            }

            let newWidth = Math.max(MIN_SIZE, Math.min(100 - prev.x, prev.width + deltaX))
            let newHeight = Math.max(MIN_SIZE, Math.min(100 - prev.y, prev.height + deltaY))

            if (aspectRatio) {
                newWidth = Math.min(newWidth, ((100 - prev.y) * aspectRatio) / imgAspect)
                newHeight = (newWidth * imgAspect) / aspectRatio
            }

            if (prev.x + newWidth > 100) {
                newWidth = 100 - prev.x
                if (aspectRatio) newHeight = (newWidth * imgAspect) / aspectRatio
            }
            if (prev.y + newHeight > 100) {
                newHeight = 100 - prev.y
                if (aspectRatio) newWidth = (newHeight * aspectRatio) / imgAspect
            }

            return { ...prev, width: newWidth, height: newHeight }
        })

        setDragStart({ x: e.clientX, y: e.clientY })
    }

    const handlePointerUp = () => setDragType(null)

    const applyAspectRatio = (ratio: number | null) => {
        setAspectRatio(ratio)
        if (!ratio || !imageDimensions) return

        const imgAspect = imageDimensions.width / imageDimensions.height
        setCropArea((prev) => {
            let width = prev.width
            let height = (width * imgAspect) / ratio

            if (prev.y + height > 100) {
                height = 100 - prev.y
                width = (height * ratio) / imgAspect
            }
            if (prev.x + width > 100) {
                width = 100 - prev.x
                height = (width * imgAspect) / ratio
            }

            return {
                x: Math.min(prev.x, Math.max(0, 100 - width)),
                y: Math.min(prev.y, Math.max(0, 100 - height)),
                width,
                height,
            }
        })
    }

    const handleCrop = async () => {
        if (!file || !imageDimensions) return
        setIsProcessing(true)

        try {
            const img = await loadImage(file)
            const sourceX = Math.round((cropArea.x / 100) * imageDimensions.width)
            const sourceY = Math.round((cropArea.y / 100) * imageDimensions.height)
            const sourceWidth = Math.max(1, Math.round((cropArea.width / 100) * imageDimensions.width))
            const sourceHeight = Math.max(1, Math.round((cropArea.height / 100) * imageDimensions.height))

            const canvas = document.createElement('canvas')
            canvas.width = sourceWidth
            canvas.height = sourceHeight

            const ctx = canvas.getContext('2d')
            if (!ctx) throw new Error('Canvas is not available')

            const format = getOutputMime(file.type)
            if (format === 'image/jpeg') {
                ctx.fillStyle = '#ffffff'
                ctx.fillRect(0, 0, canvas.width, canvas.height)
            }

            ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight)
            const blob = await canvasToBlob(canvas, format, 0.92)
            downloadBlob(blob, buildOutputName(file.name, 'cropped', getExtension(format)))
        } catch (err) {
            error(err instanceof Error ? err.message : 'Could not crop the image')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleReset = () => {
        setFile(null)
        setImageDimensions(null)
        setCropArea({ x: 0, y: 0, width: 100, height: 100 })
        setAspectRatio(null)
    }

    const cropDimensions = imageDimensions ? {
        width: Math.max(1, Math.round((cropArea.width / 100) * imageDimensions.width)),
        height: Math.max(1, Math.round((cropArea.height / 100) * imageDimensions.height)),
    } : null

    return (
        <div className="tool-page">
            <div className="tool-header">
                <button className="back-button" onClick={onBack}>←</button>
                <h1 className="tool-title">Image Cropper</h1>
            </div>

            {!file ? (
                <Dropzone
                    onFiles={(files) => void handleFile(files[0])}
                    icon="✂️"
                    title="Drop your image here or click to browse"
                    hint="Crop images with customizable aspect ratios"
                />
            ) : (
                <>
                    <div className="controls-panel">
                        <div className="control-group">
                            <label className="control-label"><span>Aspect Ratio</span></label>
                            <div className="select-buttons">
                                {ASPECT_RATIOS.map(({ label, value }) => (
                                    <button
                                        key={label}
                                        className={`select-button ${aspectRatio === value ? 'active' : ''}`}
                                        onClick={() => applyAspectRatio(value)}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {cropDimensions && (
                            <div className="image-info" style={{ marginTop: '1rem', justifyContent: 'flex-start' }}>
                                <span className="info-badge">
                                    <span className="info-badge-label">Output:</span>
                                    <span className="info-badge-value">{cropDimensions.width}×{cropDimensions.height}px</span>
                                </span>
                            </div>
                        )}
                    </div>

                    <div
                        ref={containerRef}
                        className="image-preview-container"
                        style={{
                            marginTop: '1.5rem',
                            position: 'relative',
                            cursor: dragType ? 'grabbing' : 'default',
                            userSelect: 'none',
                            touchAction: 'none',
                        }}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                    >
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            {preview && (
                                <img
                                    ref={imgRef}
                                    src={preview}
                                    alt="Preview"
                                    className="image-preview"
                                    style={{ opacity: 0.5, display: 'block' }}
                                    draggable={false}
                                />
                            )}

                            <div
                                style={{
                                    position: 'absolute',
                                    left: `${cropArea.x}%`,
                                    top: `${cropArea.y}%`,
                                    width: `${cropArea.width}%`,
                                    height: `${cropArea.height}%`,
                                    border: '2px solid #667eea',
                                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                                    cursor: 'move',
                                    overflow: 'hidden',
                                    touchAction: 'none',
                                }}
                                onPointerDown={(e) => handlePointerDown(e, 'move')}
                            >
                                {preview && (
                                    <img
                                        src={preview}
                                        alt=""
                                        style={{
                                            position: 'absolute',
                                            left: `-${(cropArea.x / cropArea.width) * 100}%`,
                                            top: `-${(cropArea.y / cropArea.height) * 100}%`,
                                            width: `${100 / cropArea.width * 100}%`,
                                            height: `${100 / cropArea.height * 100}%`,
                                            maxWidth: 'none',
                                            pointerEvents: 'none',
                                        }}
                                        draggable={false}
                                    />
                                )}

                                <div
                                    role="slider"
                                    aria-label="Resize crop area"
                                    tabIndex={0}
                                    style={{
                                        position: 'absolute',
                                        right: -8,
                                        bottom: -8,
                                        width: 24,
                                        height: 24,
                                        background: '#667eea',
                                        borderRadius: 4,
                                        cursor: 'nwse-resize',
                                        touchAction: 'none',
                                    }}
                                    onPointerDown={(e) => handlePointerDown(e, 'resize')}
                                    onKeyDown={(e) => {
                                        if (!imageDimensions) return
                                        const step = e.shiftKey ? 5 : 1
                                        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                                            e.preventDefault()
                                            setCropArea((prev) => ({ ...prev, width: Math.min(100 - prev.x, prev.width + step), height: Math.min(100 - prev.y, prev.height + step) }))
                                        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                                            e.preventDefault()
                                            setCropArea((prev) => ({ ...prev, width: Math.max(MIN_SIZE, prev.width - step), height: Math.max(MIN_SIZE, prev.height - step) }))
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="actions-bar">
                        <button className="secondary-button" onClick={handleReset}>
                            🔄 Upload New Image
                        </button>
                        <button className="download-button" onClick={() => void handleCrop()} disabled={isProcessing}>
                            ✂️ {isProcessing ? 'Cropping…' : 'Crop & Download'}
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
