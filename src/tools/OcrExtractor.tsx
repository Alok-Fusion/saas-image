import { useCallback, useRef, useState } from 'react'
import Tesseract from 'tesseract.js'

interface OcrExtractorProps {
    onBack: () => void
}

export default function OcrExtractor({ onBack }: OcrExtractorProps) {
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [extractedText, setExtractedText] = useState<string>('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [progress, setProgress] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const [language, setLanguage] = useState('eng')
    const [copied, setCopied] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const languages = [
        { code: 'eng', name: 'English' },
        { code: 'spa', name: 'Spanish' },
        { code: 'fra', name: 'French' },
        { code: 'deu', name: 'German' },
        { code: 'ita', name: 'Italian' },
        { code: 'por', name: 'Portuguese' },
        { code: 'rus', name: 'Russian' },
        { code: 'jpn', name: 'Japanese' },
        { code: 'kor', name: 'Korean' },
        { code: 'chi_sim', name: 'Chinese (Simplified)' },
        { code: 'ara', name: 'Arabic' },
        { code: 'hin', name: 'Hindi' }
    ]

    // Handle file selection
    const handleFile = useCallback(async (selectedFile: File) => {
        if (!selectedFile.type.startsWith('image/')) {
            alert('Please select an image file')
            return
        }

        setFile(selectedFile)
        const url = URL.createObjectURL(selectedFile)
        setPreview(url)
        setExtractedText('')
        setProgress(0)
    }, [])

    // Extract text using Tesseract.js
    const extractText = async () => {
        if (!file) return

        setIsProcessing(true)
        setProgress(0)
        setExtractedText('')

        try {
            const result = await Tesseract.recognize(file, language, {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        setProgress(Math.round(m.progress * 100))
                    }
                }
            })

            setExtractedText(result.data.text.trim())
        } catch (error) {
            console.error('Error extracting text:', error)
            alert('Error extracting text from image')
        } finally {
            setIsProcessing(false)
            setProgress(100)
        }
    }

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

    // Copy text to clipboard
    const copyText = () => {
        navigator.clipboard.writeText(extractedText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Download as text file
    const downloadText = () => {
        const blob = new Blob([extractedText], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'extracted_text.txt'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    // Reset
    const handleReset = () => {
        if (preview) URL.revokeObjectURL(preview)
        setFile(null)
        setPreview(null)
        setExtractedText('')
        setProgress(0)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    // Word and character count
    const wordCount = extractedText ? extractedText.split(/\s+/).filter(w => w).length : 0
    const charCount = extractedText.length

    return (
        <div className="tool-page">
            <div className="tool-header">
                <button className="back-button" onClick={onBack}>←</button>
                <h1 className="tool-title">OCR Text Extractor</h1>
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
                        <div className="dropzone-icon">📝</div>
                        <p className="dropzone-text">Drop your image here or click to browse</p>
                        <p className="dropzone-hint">Extract text from screenshots, documents, photos, or handwriting</p>
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
                    {/* Image Preview and Controls */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="image-preview-container" style={{ margin: 0 }}>
                            <img src={preview!} alt="Preview" className="image-preview" />
                        </div>

                        <div className="controls-panel" style={{ margin: 0 }}>
                            <div className="control-group">
                                <label className="control-label">
                                    <span>Language</span>
                                </label>
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontSize: '1rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {languages.map(lang => (
                                        <option key={lang.code} value={lang.code} style={{ background: '#1a1a25' }}>
                                            {lang.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {!isProcessing && !extractedText && (
                                <button
                                    className="download-button"
                                    onClick={extractText}
                                    style={{ width: '100%', marginTop: '1rem' }}
                                >
                                    🔍 Extract Text
                                </button>
                            )}

                            {isProcessing && (
                                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                                    <div style={{ marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>
                                        {progress < 30 ? 'Loading OCR engine...' :
                                            progress < 90 ? 'Recognizing text...' :
                                                'Finishing up...'}
                                    </div>
                                    <div style={{
                                        width: '100%',
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
                            )}

                            {extractedText && (
                                <div style={{ marginTop: '1rem' }}>
                                    <div className="image-info" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
                                        <span className="info-badge">
                                            <span className="info-badge-value">{wordCount} words</span>
                                        </span>
                                        <span className="info-badge">
                                            <span className="info-badge-value">{charCount} characters</span>
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Extracted Text */}
                    {extractedText && (
                        <div className="controls-panel" style={{ marginTop: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h4>Extracted Text</h4>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        className="secondary-button"
                                        onClick={copyText}
                                        style={{ padding: '0.5rem 1rem' }}
                                    >
                                        {copied ? '✓ Copied!' : '📋 Copy'}
                                    </button>
                                    <button
                                        className="secondary-button"
                                        onClick={downloadText}
                                        style={{ padding: '0.5rem 1rem' }}
                                    >
                                        ⬇️ Download
                                    </button>
                                </div>
                            </div>
                            <textarea
                                value={extractedText}
                                onChange={(e) => setExtractedText(e.target.value)}
                                style={{
                                    width: '100%',
                                    minHeight: '200px',
                                    padding: '1rem',
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontSize: '1rem',
                                    lineHeight: 1.6,
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="actions-bar">
                        <button className="secondary-button" onClick={handleReset}>
                            🔄 Upload New Image
                        </button>
                        {extractedText && (
                            <button
                                className="download-button"
                                onClick={extractText}
                            >
                                🔄 Re-extract Text
                            </button>
                        )}
                    </div>

                    {/* Info Note */}
                    {!extractedText && !isProcessing && (
                        <div style={{
                            marginTop: '1.5rem',
                            padding: '1rem',
                            background: 'rgba(102, 126, 234, 0.1)',
                            borderRadius: '12px',
                            textAlign: 'center',
                            color: 'rgba(255,255,255,0.7)',
                            fontSize: '0.875rem'
                        }}>
                            ℹ️ First use downloads the OCR model (~15MB). Processing happens locally in your browser.
                        </div>
                    )}
                </>
            )}

            {/* Processing Overlay */}
            {isProcessing && (
                <div className="processing-overlay">
                    <div className="processing-content">
                        <div className="processing-spinner" />
                        <div className="processing-text">Extracting Text...</div>
                        <div className="processing-hint">
                            {progress < 30 ? 'Loading OCR engine...' : 'Recognizing text...'}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
