import { useCallback, useEffect, useRef, useState } from 'react'
import { compressImage, downloadBlob, formatFileSize, getExtension, getImageInfo, type ImageInfo } from '../utils/imageProcessing'

interface ImageCompressorProps {
    onBack: () => void
}

type Format = 'image/jpeg' | 'image/png' | 'image/webp'

export default function ImageCompressor({ onBack }: ImageCompressorProps) {
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [originalInfo, setOriginalInfo] = useState<ImageInfo | null>(null)
    const [quality, setQuality] = useState(80)
    const [format, setFormat] = useState<Format>('image/jpeg')
    const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null)
    const [compressedPreview, setCompressedPreview] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
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

        try {
            const info = await getImageInfo(selectedFile)
            setOriginalInfo(info)
        } catch (error) {
            console.error('Error getting image info:', error)
        }

        // Reset compressed state
        setCompressedBlob(null)
        setCompressedPreview(null)
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

    // Compress image when quality or format changes
    useEffect(() => {
        if (!file) return

        const processImage = async () => {
            setIsProcessing(true)
            try {
                const blob = await compressImage(file, quality, format)
                setCompressedBlob(blob)

                if (compressedPreview) {
                    URL.revokeObjectURL(compressedPreview)
                }
                setCompressedPreview(URL.createObjectURL(blob))
            } catch (error) {
                console.error('Error compressing image:', error)
            } finally {
                setIsProcessing(false)
            }
        }

        const debounce = setTimeout(processImage, 300)
        return () => clearTimeout(debounce)
    }, [file, quality, format])

    // Download compressed image
    const handleDownload = () => {
        if (!compressedBlob || !file) return

        const baseName = file.name.replace(/\.[^/.]+$/, '')
        const extension = getExtension(format)
        downloadBlob(compressedBlob, `${baseName}_compressed.${extension}`)
    }

    // Reset and upload new image
    const handleReset = () => {
        if (preview) URL.revokeObjectURL(preview)
        if (compressedPreview) URL.revokeObjectURL(compressedPreview)
        setFile(null)
        setPreview(null)
        setOriginalInfo(null)
        setCompressedBlob(null)
        setCompressedPreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    // Calculate compression percentage
    const compressionPercent = originalInfo && compressedBlob
        ? Math.round((1 - compressedBlob.size / originalInfo.size) * 100)
        : 0

    return (
        <div className="tool-page">
            <div className="tool-header">
                <button className="back-button" onClick={onBack}>←</button>
                <h1 className="tool-title">Image Compressor</h1>
            </div>

            {!file ? (
                // Upload dropzone
                <div
                    className={`dropzone ${isDragging ? 'dragging' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div className="dropzone-content">
                        <div className="dropzone-icon">📦</div>
                        <p className="dropzone-text">Drop your image here or click to browse</p>
                        <p className="dropzone-hint">Supports JPG, PNG, WEBP • Max 50MB</p>
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
                        <div className="control-group">
                            <label className="control-label">
                                <span>Compression Quality</span>
                                <span className="control-value">{quality}%</span>
                            </label>
                            <div className="slider-container">
                                <div className="slider-fill" style={{ width: `${quality}%` }} />
                                <input
                                    type="range"
                                    min="1"
                                    max="100"
                                    value={quality}
                                    onChange={(e) => setQuality(Number(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="control-group">
                            <label className="control-label">
                                <span>Output Format</span>
                            </label>
                            <div className="select-buttons">
                                <button
                                    className={`select-button ${format === 'image/jpeg' ? 'active' : ''}`}
                                    onClick={() => setFormat('image/jpeg')}
                                >
                                    JPEG
                                </button>
                                <button
                                    className={`select-button ${format === 'image/png' ? 'active' : ''}`}
                                    onClick={() => setFormat('image/png')}
                                >
                                    PNG
                                </button>
                                <button
                                    className={`select-button ${format === 'image/webp' ? 'active' : ''}`}
                                    onClick={() => setFormat('image/webp')}
                                >
                                    WEBP
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Comparison View */}
                    <div className="comparison-container">
                        <div className="comparison-panel">
                            <div className="comparison-label">Original</div>
                            {preview && (
                                <img src={preview} alt="Original" className="comparison-image" />
                            )}
                            <div className="comparison-stats">
                                <div className="stat">
                                    <div className="stat-value">{originalInfo ? formatFileSize(originalInfo.size) : '-'}</div>
                                    <div className="stat-label">File Size</div>
                                </div>
                                <div className="stat">
                                    <div className="stat-value">{originalInfo ? `${originalInfo.width}×${originalInfo.height}` : '-'}</div>
                                    <div className="stat-label">Dimensions</div>
                                </div>
                            </div>
                        </div>

                        <div className="comparison-panel">
                            <div className="comparison-label">Compressed {isProcessing && '(Processing...)'}</div>
                            {compressedPreview && (
                                <img src={compressedPreview} alt="Compressed" className="comparison-image" />
                            )}
                            <div className="comparison-stats">
                                <div className="stat">
                                    <div className="stat-value">{compressedBlob ? formatFileSize(compressedBlob.size) : '-'}</div>
                                    <div className="stat-label">File Size</div>
                                </div>
                                <div className="stat">
                                    <div className={`stat-value ${compressionPercent > 0 ? 'success' : ''}`}>
                                        {compressionPercent > 0 ? `-${compressionPercent}%` : compressionPercent < 0 ? `+${Math.abs(compressionPercent)}%` : '-'}
                                    </div>
                                    <div className="stat-label">Size Change</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="actions-bar">
                        <button className="secondary-button" onClick={handleReset}>
                            🔄 Upload New Image
                        </button>
                        <button
                            className="download-button"
                            onClick={handleDownload}
                            disabled={!compressedBlob || isProcessing}
                        >
                            ⬇️ Download Compressed Image
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
