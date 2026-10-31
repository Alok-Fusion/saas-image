import { useCallback, useEffect, useRef, useState } from 'react'
import Dropzone from '../components/Dropzone'
import { useToast } from '../components/Toast'
import { useObjectUrl } from '../hooks/useObjectUrl'
import {
    applyBackground,
    buildOutputName,
    downloadBlob,
    formatFileSize,
    getImageInfo,
    type ImageInfo,
} from '../utils/imageProcessing'

interface BackgroundRemoverProps {
    onBack: () => void
}

export default function BackgroundRemover({ onBack }: BackgroundRemoverProps) {
    const [file, setFile] = useState<File | null>(null)
    const [originalInfo, setOriginalInfo] = useState<ImageInfo | null>(null)
    const [processedBlob, setProcessedBlob] = useState<Blob | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [progress, setProgress] = useState(0)
    const [showOriginal, setShowOriginal] = useState(false)
    const [backgroundColor, setBackgroundColor] = useState('#ffffff')
    const [applyBg, setApplyBg] = useState(false)
    const [finalBlob, setFinalBlob] = useState<Blob | null>(null)
    const runIdRef = useRef(0)
    const bgRunIdRef = useRef(0)
    const preview = useObjectUrl(file)
    const finalPreview = useObjectUrl(finalBlob)
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
        runIdRef.current += 1
        bgRunIdRef.current += 1
        setFile(selectedFile)
        setProcessedBlob(null)
        setFinalBlob(null)
        setProgress(0)
        setApplyBg(false)
    }, [])

    const handleRemoveBackground = async () => {
        if (!file || isProcessing) return

        const runId = ++runIdRef.current
        setIsProcessing(true)
        setProgress(0)

        try {
            const { removeBackground } = await import('@imgly/background-removal')
            const blob = await removeBackground(file, {
                progress: (_key, current, total) => {
                    if (runIdRef.current === runId && total > 0) {
                        setProgress(Math.round((current / total) * 100))
                    }
                }
            })
            if (runIdRef.current !== runId) return
            setProcessedBlob(blob)
            setFinalBlob(blob)
            setProgress(100)
        } catch (err) {
            if (runIdRef.current === runId) {
                error(err instanceof Error ? err.message : 'Could not remove the background')
            }
        } finally {
            if (runIdRef.current === runId) setIsProcessing(false)
        }
    }

    const updateFinalBackground = useCallback(async (enabled: boolean, color: string) => {
        if (!processedBlob) return
        const runId = ++bgRunIdRef.current
        if (!enabled) {
            setFinalBlob(processedBlob)
            return
        }
        try {
            const blob = await applyBackground(processedBlob, color, 'image/jpeg')
            if (bgRunIdRef.current === runId) setFinalBlob(blob)
        } catch (err) {
            if (bgRunIdRef.current === runId) {
                error(err instanceof Error ? err.message : 'Could not apply the background colour')
            }
        }
    }, [error, processedBlob])

    const handleApplyBackground = (color: string) => {
        setBackgroundColor(color)
        if (applyBg) void updateFinalBackground(true, color)
    }

    const handleToggleBackground = (enabled: boolean) => {
        setApplyBg(enabled)
        void updateFinalBackground(enabled, backgroundColor)
    }

    const handleDownload = () => {
        if (!finalBlob || !file) return
        const extension = finalBlob.type === 'image/jpeg' ? 'jpg' : 'png'
        downloadBlob(finalBlob, buildOutputName(file.name, 'no-background', extension))
    }

    const handleReset = () => {
        runIdRef.current += 1
        bgRunIdRef.current += 1
        setFile(null)
        setOriginalInfo(null)
        setProcessedBlob(null)
        setFinalBlob(null)
        setProgress(0)
        setApplyBg(false)
    }

    return (
        <div className="tool-page">
            <div className="tool-header">
                <button className="back-button" onClick={onBack}>←</button>
                <h1 className="tool-title">Background Remover</h1>
            </div>

            {!file ? (
                <Dropzone
                    onFiles={(files) => handleFile(files[0])}
                    icon="🎭"
                    title="Drop your image here or click to browse"
                    hint="AI-powered background removal • Works best with clear subjects"
                />
            ) : !processedBlob ? (
                <>
                    {/* Original Image Preview */}
                    <div className="image-preview-container">
                        {preview && <img src={preview} alt="Original" className="image-preview" />}
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
                            {preview && <img src={preview} alt="Original" className="comparison-image" />}
                        </div>

                        <div className="comparison-panel">
                            <div className="comparison-label">
                                {showOriginal ? 'Original' : 'Background Removed'}
                            </div>
                            <div className={!applyBg && !showOriginal ? 'checkered-bg' : ''} style={{ borderRadius: '12px', overflow: 'hidden' }}>
                                {(showOriginal ? preview : finalPreview) && (
                                    <img
                                        src={showOriginal ? preview! : finalPreview!}
                                        alt="Processed"
                                        className="comparison-image"
                                        style={{ display: 'block' }}
                                    />
                                )}
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
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={showOriginal}
                                    aria-label="Compare with original"
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
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={applyBg}
                                    aria-label="Apply solid color background"
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
