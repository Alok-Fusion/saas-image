import { useCallback, useEffect, useState } from 'react'
import Dropzone from '../components/Dropzone'
import { useToast } from '../components/Toast'
import { useObjectUrl } from '../hooks/useObjectUrl'
import {
    buildOutputName,
    canvasToBlob,
    downloadBlob,
    formatFileSize,
    getImageInfo,
    getOutputMime,
    loadImage,
    type ImageInfo,
} from '../utils/imageProcessing'

interface ImageRotatorProps {
    onBack: () => void
}

export default function ImageRotator({ onBack }: ImageRotatorProps) {
    const [file, setFile] = useState<File | null>(null)
    const [originalInfo, setOriginalInfo] = useState<ImageInfo | null>(null)
    const [rotation, setRotation] = useState(0)
    const [flipH, setFlipH] = useState(false)
    const [flipV, setFlipV] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const preview = useObjectUrl(file)
    const { error } = useToast()

    useEffect(() => {
        if (!file) return
        let active = true
        getImageInfo(file)
            .then((info) => { if (active) setOriginalInfo(info) })
            .catch((err) => { if (active) error(err instanceof Error ? err.message : 'Could not read the image') })
        return () => { active = false }
    }, [error, file])

    const handleFile = useCallback((selectedFile: File) => {
        setFile(selectedFile)
        setRotation(0)
        setFlipH(false)
        setFlipV(false)
    }, [])

    // Rotate
    const rotate = (degrees: number) => {
        setRotation((prev) => (prev + degrees + 360) % 360)
    }

    const handleDownload = async () => {
        if (!file || !originalInfo || isProcessing) return
        setIsProcessing(true)
        try {
            const img = await loadImage(file)
            const radians = (rotation * Math.PI) / 180
            const cos = Math.abs(Math.cos(radians))
            const sin = Math.abs(Math.sin(radians))
            const width = originalInfo.width
            const height = originalInfo.height
            const canvas = document.createElement('canvas')
            canvas.width = Math.max(1, Math.round(width * cos + height * sin))
            canvas.height = Math.max(1, Math.round(width * sin + height * cos))
            const ctx = canvas.getContext('2d')
            if (!ctx) throw new Error('Canvas is not available')

            const mime = getOutputMime(file.type)
            if (mime === 'image/jpeg') {
                ctx.fillStyle = '#ffffff'
                ctx.fillRect(0, 0, canvas.width, canvas.height)
            }

            ctx.translate(canvas.width / 2, canvas.height / 2)
            ctx.rotate(radians)
            ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)
            ctx.drawImage(img, -width / 2, -height / 2)

            const blob = await canvasToBlob(canvas, mime, 0.92)
            const extension = mime === 'image/jpeg' ? 'jpg' : mime === 'image/webp' ? 'webp' : 'png'
            downloadBlob(blob, buildOutputName(file.name, 'rotated', extension))
        } catch (err) {
            error(err instanceof Error ? err.message : 'Could not transform the image')
        } finally {
            setIsProcessing(false)
        }
    }

    const resetTransforms = () => {
        setRotation(0)
        setFlipH(false)
        setFlipV(false)
    }

    const handleReset = () => {
        setFile(null)
        setOriginalInfo(null)
        setRotation(0)
        setFlipH(false)
        setFlipV(false)
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
                <Dropzone
                    onFiles={(files) => handleFile(files[0])}
                    icon="🔄"
                    title="Drop your image here or click to browse"
                    hint="Rotate, flip, and mirror your images"
                />
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
                            {preview && (
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="image-preview"
                                    style={transformStyle}
                                />
                            )}
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
                        <button className="download-button" onClick={handleDownload} disabled={isProcessing}>
                            {isProcessing ? '⏳ Processing…' : '⬇️ Download Transformed Image'}
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
