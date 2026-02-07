import { useCallback, useRef, useState } from 'react'
import { downloadBlob } from '../utils/imageProcessing'

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
    { label: '2:3', value: 2 / 3 }
]

export default function ImageCropper({ onBack }: ImageCropperProps) {
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null)
    const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 100, height: 100 })
    const [aspectRatio, setAspectRatio] = useState<number | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [dragType, setDragType] = useState<'move' | 'resize' | null>(null)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const containerRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Handle file selection
    const handleFile = useCallback(async (selectedFile: File) => {
        if (!selectedFile.type.startsWith('image/')) {
            alert('Please select an image file')
            return
        }

        setFile(selectedFile)
        const url = URL.createObjectURL(selectedFile)
        setPreview(url)

        // Get image dimensions
        const img = new Image()
        img.onload = () => {
            setImageDimensions({ width: img.width, height: img.height })
            // Set initial crop to full image
            setCropArea({ x: 0, y: 0, width: 100, height: 100 })
        }
        img.src = url
    }, [])

    // Handle drag and drop
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const droppedFile = e.dataTransfer.files[0]
        if (droppedFile) handleFile(droppedFile)
    }, [handleFile])

    // Handle crop area mouse events
    const handleMouseDown = (e: React.MouseEvent, type: 'move' | 'resize') => {
        e.preventDefault()
        setDragType(type)
        setDragStart({ x: e.clientX, y: e.clientY })
    }

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!dragType || !containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100
        const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100

        setCropArea(prev => {
            if (dragType === 'move') {
                const newX = Math.max(0, Math.min(100 - prev.width, prev.x + deltaX))
                const newY = Math.max(0, Math.min(100 - prev.height, prev.y + deltaY))
                return { ...prev, x: newX, y: newY }
            } else {
                let newWidth = Math.max(10, Math.min(100 - prev.x, prev.width + deltaX))
                let newHeight = Math.max(10, Math.min(100 - prev.y, prev.height + deltaY))

                if (aspectRatio && imageDimensions) {
                    const imgAspect = imageDimensions.width / imageDimensions.height
                    const targetAspect = aspectRatio * imgAspect
                    newHeight = newWidth / targetAspect
                    if (prev.y + newHeight > 100) {
                        newHeight = 100 - prev.y
                        newWidth = newHeight * targetAspect
                    }
                }

                return { ...prev, width: newWidth, height: newHeight }
            }
        })

        setDragStart({ x: e.clientX, y: e.clientY })
    }, [dragType, dragStart, aspectRatio, imageDimensions])

    const handleMouseUp = () => {
        setDragType(null)
    }

    // Apply aspect ratio
    const applyAspectRatio = (ratio: number | null) => {
        setAspectRatio(ratio)
        if (ratio && imageDimensions) {
            const imgAspect = imageDimensions.width / imageDimensions.height
            const targetAspect = ratio * imgAspect

            let newWidth = cropArea.width
            let newHeight = newWidth / targetAspect

            if (cropArea.y + newHeight > 100) {
                newHeight = 100 - cropArea.y
                newWidth = newHeight * targetAspect
            }

            setCropArea(prev => ({ ...prev, width: newWidth, height: newHeight }))
        }
    }

    // Crop and download
    const handleCrop = async () => {
        if (!file || !imageDimensions) return

        const img = new Image()
        img.src = preview!

        await new Promise(resolve => img.onload = resolve)

        const canvas = document.createElement('canvas')
        const sourceX = (cropArea.x / 100) * imageDimensions.width
        const sourceY = (cropArea.y / 100) * imageDimensions.height
        const sourceWidth = (cropArea.width / 100) * imageDimensions.width
        const sourceHeight = (cropArea.height / 100) * imageDimensions.height

        canvas.width = sourceWidth
        canvas.height = sourceHeight

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight)

        canvas.toBlob((blob) => {
            if (blob) {
                const baseName = file.name.replace(/\.[^/.]+$/, '')
                downloadBlob(blob, `${baseName}_cropped.png`)
            }
        }, 'image/png')
    }

    // Reset
    const handleReset = () => {
        if (preview) URL.revokeObjectURL(preview)
        setFile(null)
        setPreview(null)
        setImageDimensions(null)
        setCropArea({ x: 0, y: 0, width: 100, height: 100 })
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const cropDimensions = imageDimensions ? {
        width: Math.round((cropArea.width / 100) * imageDimensions.width),
        height: Math.round((cropArea.height / 100) * imageDimensions.height)
    } : null

    return (
        <div className="tool-page">
            <div className="tool-header">
                <button className="back-button" onClick={onBack}>←</button>
                <h1 className="tool-title">Image Cropper</h1>
            </div>

            {!file ? (
                <div
                    className={`dropzone ${isDragging ? 'dragging' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div className="dropzone-content">
                        <div className="dropzone-icon">✂️</div>
                        <p className="dropzone-text">Drop your image here or click to browse</p>
                        <p className="dropzone-hint">Crop images with customizable aspect ratios</p>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                        style={{ display: 'none' }}
                    />
                </div>
            ) : (
                <>
                    {/* Aspect Ratio Selection */}
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

                    {/* Crop Area */}
                    <div
                        ref={containerRef}
                        className="image-preview-container"
                        style={{
                            marginTop: '1.5rem',
                            position: 'relative',
                            cursor: dragType ? 'grabbing' : 'default',
                            userSelect: 'none'
                        }}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <img src={preview!} alt="Preview" className="image-preview" style={{ opacity: 0.5 }} />

                            {/* Crop overlay */}
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
                                    overflow: 'hidden'
                                }}
                                onMouseDown={(e) => handleMouseDown(e, 'move')}
                            >
                                <img
                                    src={preview!}
                                    alt="Crop"
                                    style={{
                                        position: 'absolute',
                                        left: `-${(cropArea.x / cropArea.width) * 100}%`,
                                        top: `-${(cropArea.y / cropArea.height) * 100}%`,
                                        width: `${100 / cropArea.width * 100}%`,
                                        height: `${100 / cropArea.height * 100}%`,
                                        maxWidth: 'none',
                                        pointerEvents: 'none'
                                    }}
                                />

                                {/* Resize handle */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        right: -8,
                                        bottom: -8,
                                        width: 16,
                                        height: 16,
                                        background: '#667eea',
                                        borderRadius: 4,
                                        cursor: 'nwse-resize'
                                    }}
                                    onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'resize') }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="actions-bar">
                        <button className="secondary-button" onClick={handleReset}>
                            🔄 Upload New Image
                        </button>
                        <button className="download-button" onClick={handleCrop}>
                            ✂️ Crop & Download
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
