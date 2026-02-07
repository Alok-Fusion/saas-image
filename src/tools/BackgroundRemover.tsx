import { removeBackground } from '@imgly/background-removal'
import { useCallback, useRef, useState } from 'react'
import { applyBackground, downloadBlob, formatFileSize, getImageInfo, type ImageInfo } from '../utils/imageProcessing'

interface BackgroundRemoverProps {
    onBack: () => void
}

export default function BackgroundRemover({ onBack }: BackgroundRemoverProps) {
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [originalInfo, setOriginalInfo] = useState<ImageInfo | null>(null)
    const [processedBlob, setProcessedBlob] = useState<Blob | null>(null)
    const [processedPreview, setProcessedPreview] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [progress, setProgress] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const [showOriginal, setShowOriginal] = useState(false)
    const [backgroundColor, setBackgroundColor] = useState('#ffffff')
    const [applyBg, setApplyBg] = useState(false)
    const [finalBlob, setFinalBlob] = useState<Blob | null>(null)
    const [finalPreview, setFinalPreview] = useState<string | null>(null)
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

        // Reset processed state
        setProcessedBlob(null)
        setProcessedPreview(null)
        setFinalBlob(null)
        setFinalPreview(null)
        setProgress(0)
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

    // Process image - remove background
    const handleRemoveBackground = async () => {
        if (!file) return

        setIsProcessing(true)
        setProgress(0)

        try {
            const blob = await removeBackground(file, {
                progress: (key, current, total) => {
                    // Calculate overall progress
                    const progressPercent = Math.round((current / total) * 100)
                    setProgress(progressPercent)
                }
            })

            setProcessedBlob(blob)
            if (processedPreview) URL.revokeObjectURL(processedPreview)
            const url = URL.createObjectURL(blob)
            setProcessedPreview(url)
            setFinalBlob(blob)
            setFinalPreview(url)
        } catch (error) {
            console.error('Error removing background:', error)
            alert('Error processing image. Please try again with a different image.')
        } finally {
            setIsProcessing(false)
            setProgress(100)
        }
    }

    // Apply background color
    const handleApplyBackground = async (color: string) => {
        if (!processedBlob) return

        setBackgroundColor(color)

        if (!applyBg) {
            // If toggle is off, just update the color but don't apply
            return
        }

        try {
            const blob = await applyBackground(processedBlob, color)
            setFinalBlob(blob)
            if (finalPreview && finalPreview !== processedPreview) {
                URL.revokeObjectURL(finalPreview)
            }
            setFinalPreview(URL.createObjectURL(blob))
        } catch (error) {
            console.error('Error applying background:', error)
        }
    }

    // Toggle background color application
    const handleToggleBackground = async (enabled: boolean) => {
        setApplyBg(enabled)

        if (enabled && processedBlob) {
            try {
                const blob = await applyBackground(processedBlob, backgroundColor)
                setFinalBlob(blob)
                if (finalPreview && finalPreview !== processedPreview) {
                    URL.revokeObjectURL(finalPreview)
                }
                setFinalPreview(URL.createObjectURL(blob))
            } catch (error) {
                console.error('Error applying background:', error)
            }
        } else if (processedBlob) {
            // Reset to transparent
            setFinalBlob(processedBlob)
            setFinalPreview(processedPreview)
        }
    }

    // Download
    const handleDownload = () => {
        if (!finalBlob || !file) return

        const baseName = file.name.replace(/\.[^/.]+$/, '')
        const extension = applyBg ? 'jpg' : 'png'
        downloadBlob(finalBlob, `${baseName}_no_background.${extension}`)
    }

    // Reset
    const handleReset = () => {
        if (preview) URL.revokeObjectURL(preview)
        if (processedPreview) URL.revokeObjectURL(processedPreview)
        if (finalPreview && finalPreview !== processedPreview) URL.revokeObjectURL(finalPreview)

        setFile(null)
        setPreview(null)
        setOriginalInfo(null)
        setProcessedBlob(null)
        setProcessedPreview(null)
        setFinalBlob(null)
        setFinalPreview(null)
        setProgress(0)
        setApplyBg(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    return (
        <div className="tool-page">
            <div className="tool-header">
                <button className="back-button" onClick={onBack}>←</button>
                <h1 className="tool-title">Background Remover</h1>
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
                        <div className="dropzone-icon">🎭</div>
                        <p className="dropzone-text">Drop your image here or click to browse</p>
                        <p className="dropzone-hint">AI-powered background removal • Works best with clear subjects</p>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                        style={{ display: 'none' }}
                    />
                </div>
            ) : !processedBlob ? (
                <>
                    {/* Original Image Preview */}
                    <div className="image-preview-container">
                        <img src={preview!} alt="Original" className="image-preview" />
                        <div className="image-info">
                            <span className="info-badge">
                                <span className="info-badge-label">Size:</span>
                                <span className="info-badge-value">{originalInfo ? formatFileSize(originalInfo.size) : '-'}</span>
                            </span>
                            <span className="info-badge">
                                <span className="info-badge-label">Dimensions:</span>
                                <span className="info-badge-value">{originalInfo ? `${originalInfo.width}×${originalInfo.height}` : '-'}</span>
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="actions-bar">
                        <button className="secondary-button" onClick={handleReset}>
                            🔄 Upload New Image
                        </button>
                        <button
                            className="download-button"
                            onClick={handleRemoveBackground}
                            disabled={isProcessing}
                        >
                            {isProcessing ? `⏳ Processing... ${progress}%` : '🎭 Remove Background'}
                        </button>
                    </div>

                    {/* Info note */}
                    <div style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        background: 'rgba(102, 126, 234, 0.1)',
                        borderRadius: '12px',
                        textAlign: 'center',
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: '0.875rem'
                    }}>
                        ℹ️ First-time use downloads AI model (~50MB). Processing happens locally in your browser.
                    </div>
                </>
            ) : (
                <>
                    {/* Comparison View */}
                    <div className="comparison-container">
                        <div className="comparison-panel">
                            <div className="comparison-label">Original</div>
                            <img src={preview!} alt="Original" className="comparison-image" />
                        </div>

                        <div className="comparison-panel">
                            <div className="comparison-label">
                                {showOriginal ? 'Original' : 'Background Removed'}
                            </div>
                            <div className={!applyBg && !showOriginal ? 'checkered-bg' : ''} style={{ borderRadius: '12px', overflow: 'hidden' }}>
                                <img
                                    src={showOriginal ? preview! : finalPreview!}
                                    alt="Processed"
                                    className="comparison-image"
                                    style={{ display: 'block' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="controls-panel" style={{ marginTop: '1.5rem' }}>
                        <div className="control-group">
                            <label className="control-label">
                                <span>Toggle Original</span>
                            </label>
                            <div className="toggle-container">
                                <span style={{ color: showOriginal ? '#667eea' : 'rgba(255,255,255,0.5)' }}>Compare with original</span>
                                <div
                                    className={`toggle ${showOriginal ? 'active' : ''}`}
                                    onClick={() => setShowOriginal(!showOriginal)}
                                />
                            </div>
                        </div>

                        <div className="control-group" style={{ marginTop: '1.5rem' }}>
                            <label className="control-label">
                                <span>Add Background Color</span>
                            </label>
                            <div className="toggle-container" style={{ marginBottom: '1rem' }}>
                                <span style={{ color: applyBg ? '#667eea' : 'rgba(255,255,255,0.5)' }}>Apply solid color background</span>
                                <div
                                    className={`toggle ${applyBg ? 'active' : ''}`}
                                    onClick={() => handleToggleBackground(!applyBg)}
                                />
                            </div>
                            {applyBg && (
                                <div className="color-picker-container">
                                    <input
                                        type="color"
                                        value={backgroundColor}
                                        onChange={(e) => handleApplyBackground(e.target.value)}
                                        className="color-picker"
                                    />
                                    <div className="select-buttons">
                                        <button
                                            className="select-button"
                                            onClick={() => handleApplyBackground('#ffffff')}
                                            style={{ background: '#ffffff', color: '#000' }}
                                        >
                                            White
                                        </button>
                                        <button
                                            className="select-button"
                                            onClick={() => handleApplyBackground('#000000')}
                                            style={{ background: '#000000' }}
                                        >
                                            Black
                                        </button>
                                        <button
                                            className="select-button"
                                            onClick={() => handleApplyBackground('#667eea')}
                                            style={{ background: '#667eea' }}
                                        >
                                            Purple
                                        </button>
                                        <button
                                            className="select-button"
                                            onClick={() => handleApplyBackground('#38ef7d')}
                                            style={{ background: '#38ef7d', color: '#000' }}
                                        >
                                            Green
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="actions-bar">
                        <button className="secondary-button" onClick={handleReset}>
                            🔄 Upload New Image
                        </button>
                        <button className="download-button" onClick={handleDownload}>
                            ⬇️ Download {applyBg ? 'JPG' : 'PNG (Transparent)'}
                        </button>
                    </div>
                </>
            )}

            {/* Processing Overlay */}
            {isProcessing && (
                <div className="processing-overlay">
                    <div className="processing-content">
                        <div className="processing-spinner" />
                        <div className="processing-text">Removing Background...</div>
                        <div className="processing-hint">
                            {progress < 30 ? 'Loading AI model...' :
                                progress < 70 ? 'Analyzing image...' :
                                    progress < 90 ? 'Removing background...' :
                                        'Finishing up...'}
                        </div>
                        <div style={{
                            marginTop: '1rem',
                            width: '200px',
                            height: '8px',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '4px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${progress}%`,
                                height: '100%',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                borderRadius: '4px',
                                transition: 'width 0.3s ease'
                            }} />
                        </div>
                        <div style={{ marginTop: '0.5rem', color: 'rgba(255,255,255,0.5)' }}>{progress}%</div>
                    </div>
                </div>
            )}
        </div>
    )
}
