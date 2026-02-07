import { useCallback, useRef, useState } from 'react'
import { downloadBlob, formatFileSize, getImageInfo, type ImageInfo } from '../utils/imageProcessing'

interface ImageRotatorProps {
    onBack: () => void
}

export default function ImageRotator({ onBack }: ImageRotatorProps) {
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [originalInfo, setOriginalInfo] = useState<ImageInfo | null>(null)
    const [rotation, setRotation] = useState(0)
    const [flipH, setFlipH] = useState(false)
    const [flipV, setFlipV] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
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
        setRotation(0)
        setFlipH(false)
        setFlipV(false)

        try {
            const info = await getImageInfo(selectedFile)
            setOriginalInfo(info)
        } catch (error) {
            console.error('Error getting image info:', error)
        }
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

    // Rotate
    const rotate = (degrees: number) => {
        setRotation((prev) => (prev + degrees + 360) % 360)
    }

    // Apply transformations and download
    const handleDownload = async () => {
        if (!file || !originalInfo) return

        const img = new Image()
        img.src = preview!

        await new Promise(resolve => img.onload = resolve)

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Swap dimensions for 90/270 degree rotations
        const isRotated = rotation === 90 || rotation === 270
        canvas.width = isRotated ? originalInfo.height : originalInfo.width
        canvas.height = isRotated ? originalInfo.width : originalInfo.height

        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate((rotation * Math.PI) / 180)
        ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)
        ctx.drawImage(img, -originalInfo.width / 2, -originalInfo.height / 2)

        canvas.toBlob((blob) => {
            if (blob) {
                const baseName = file.name.replace(/\.[^/.]+$/, '')
                downloadBlob(blob, `${baseName}_transformed.png`)
            }
        }, 'image/png')
    }

    // Reset transformations
    const resetTransforms = () => {
        setRotation(0)
        setFlipH(false)
        setFlipV(false)
    }

    // Reset all
    const handleReset = () => {
        if (preview) URL.revokeObjectURL(preview)
        setFile(null)
        setPreview(null)
        setOriginalInfo(null)
        setRotation(0)
        setFlipH(false)
        setFlipV(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const transformStyle = {
        transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
        transition: 'transform 0.3s ease'
    }

    return (
        <div className="tool-page">
            <div className="tool-header">
                <button className="back-button" onClick={onBack}>←</button>
                <h1 className="tool-title">Image Rotator & Flipper</h1>
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
                        <div className="dropzone-icon">🔄</div>
                        <p className="dropzone-text">Drop your image here or click to browse</p>
                        <p className="dropzone-hint">Rotate, flip, and mirror your images</p>
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
                    {/* Controls */}
                    <div className="controls-panel">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                            {/* Rotation Controls */}
                            <div className="control-group">
                                <label className="control-label">
                                    <span>Rotation</span>
                                    <span className="control-value">{rotation}°</span>
                                </label>
                                <div className="select-buttons">
                                    <button className="select-button" onClick={() => rotate(-90)}>↶ 90°</button>
                                    <button className="select-button" onClick={() => rotate(90)}>↷ 90°</button>
                                    <button className="select-button" onClick={() => rotate(180)}>180°</button>
                                </div>
                                <div style={{ marginTop: '0.75rem' }}>
                                    <input
                                        type="range"
                                        min="0"
                                        max="360"
                                        value={rotation}
                                        onChange={(e) => setRotation(Number(e.target.value))}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>

                            {/* Flip Controls */}
                            <div className="control-group">
                                <label className="control-label"><span>Flip</span></label>
                                <div className="select-buttons">
                                    <button
                                        className={`select-button ${flipH ? 'active' : ''}`}
                                        onClick={() => setFlipH(!flipH)}
                                    >
                                        ↔️ Horizontal
                                    </button>
                                    <button
                                        className={`select-button ${flipV ? 'active' : ''}`}
                                        onClick={() => setFlipV(!flipV)}
                                    >
                                        ↕️ Vertical
                                    </button>
                                </div>
                                <button
                                    className="secondary-button"
                                    onClick={resetTransforms}
                                    style={{ marginTop: '0.75rem', width: '100%' }}
                                >
                                    Reset Transformations
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="image-preview-container" style={{ marginTop: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                            <img
                                src={preview!}
                                alt="Preview"
                                className="image-preview"
                                style={transformStyle}
                            />
                        </div>
                        <div className="image-info">
                            <span className="info-badge">
                                <span className="info-badge-label">Original:</span>
                                <span className="info-badge-value">
                                    {originalInfo ? `${originalInfo.width}×${originalInfo.height}` : '-'}
                                </span>
                            </span>
                            <span className="info-badge">
                                <span className="info-badge-label">Size:</span>
                                <span className="info-badge-value">
                                    {originalInfo ? formatFileSize(originalInfo.size) : '-'}
                                </span>
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="actions-bar">
                        <button className="secondary-button" onClick={handleReset}>
                            🔄 Upload New Image
                        </button>
                        <button className="download-button" onClick={handleDownload}>
                            ⬇️ Download Transformed Image
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
