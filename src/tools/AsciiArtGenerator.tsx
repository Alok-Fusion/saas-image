import { useCallback, useRef, useState } from 'react'

interface AsciiArtGeneratorProps {
    onBack: () => void
}

export default function AsciiArtGenerator({ onBack }: AsciiArtGeneratorProps) {
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [asciiArt, setAsciiArt] = useState<string>('')
    const [width, setWidth] = useState(100)
    const [isProcessing, setIsProcessing] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [copied, setCopied] = useState(false)
    const [charSet, setCharSet] = useState<'standard' | 'blocks' | 'simple'>('standard')
    const [inverted, setInverted] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const charSets = {
        standard: ' .:-=+*#%@',
        blocks: ' ░▒▓█',
        simple: ' .-:=+*#'
    }

    // Generate ASCII art from image
    const generateAsciiArt = async (imageFile: File, outputWidth: number): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image()
            const url = URL.createObjectURL(imageFile)

            img.onload = () => {
                URL.revokeObjectURL(url)

                const aspectRatio = img.height / img.width
                const outputHeight = Math.floor(outputWidth * aspectRatio * 0.5) // 0.5 for character aspect ratio

                const canvas = document.createElement('canvas')
                canvas.width = outputWidth
                canvas.height = outputHeight

                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'))
                    return
                }

                ctx.drawImage(img, 0, 0, outputWidth, outputHeight)
                const imageData = ctx.getImageData(0, 0, outputWidth, outputHeight)
                const pixels = imageData.data

                const chars = inverted ? charSets[charSet].split('').reverse().join('') : charSets[charSet]
                let result = ''

                for (let y = 0; y < outputHeight; y++) {
                    for (let x = 0; x < outputWidth; x++) {
                        const idx = (y * outputWidth + x) * 4
                        const r = pixels[idx]
                        const g = pixels[idx + 1]
                        const b = pixels[idx + 2]

                        // Calculate brightness (0-255)
                        const brightness = (r * 0.299 + g * 0.587 + b * 0.114)

                        // Map brightness to character
                        const charIdx = Math.floor((brightness / 255) * (chars.length - 1))
                        result += chars[charIdx]
                    }
                    result += '\n'
                }

                resolve(result)
            }

            img.onerror = () => {
                URL.revokeObjectURL(url)
                reject(new Error('Failed to load image'))
            }

            img.src = url
        })
    }

    // Handle file selection
    const handleFile = useCallback(async (selectedFile: File) => {
        if (!selectedFile.type.startsWith('image/')) {
            alert('Please select an image file')
            return
        }

        setFile(selectedFile)
        const url = URL.createObjectURL(selectedFile)
        setPreview(url)
        setAsciiArt('')

        // Auto-generate
        setIsProcessing(true)
        try {
            const art = await generateAsciiArt(selectedFile, width)
            setAsciiArt(art)
        } catch (error) {
            console.error('Error generating ASCII art:', error)
        } finally {
            setIsProcessing(false)
        }
    }, [width, charSet, inverted])

    // Regenerate when settings change
    const regenerate = async () => {
        if (!file) return

        setIsProcessing(true)
        try {
            const art = await generateAsciiArt(file, width)
            setAsciiArt(art)
        } catch (error) {
            console.error('Error generating ASCII art:', error)
        } finally {
            setIsProcessing(false)
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

    // Copy to clipboard
    const copyArt = () => {
        navigator.clipboard.writeText(asciiArt)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Download as text file
    const downloadArt = () => {
        const blob = new Blob([asciiArt], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'ascii_art.txt'
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
        setAsciiArt('')
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    return (
        <div className="tool-page">
            <div className="tool-header">
                <button className="back-button" onClick={onBack}>←</button>
                <h1 className="tool-title">Image to ASCII Art</h1>
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
                        <div className="dropzone-icon">🖌️</div>
                        <p className="dropzone-text">Drop your image here or click to browse</p>
                        <p className="dropzone-hint">Convert photos into ASCII text art</p>
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
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div className="control-group">
                                <label className="control-label">
                                    <span>Width</span>
                                    <span className="control-value">{width} chars</span>
                                </label>
                                <input
                                    type="range"
                                    min="40"
                                    max="200"
                                    value={width}
                                    onChange={(e) => setWidth(Number(e.target.value))}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div className="control-group">
                                <label className="control-label">
                                    <span>Character Set</span>
                                </label>
                                <div className="select-buttons">
                                    <button
                                        className={`select-button ${charSet === 'standard' ? 'active' : ''}`}
                                        onClick={() => setCharSet('standard')}
                                    >
                                        Standard
                                    </button>
                                    <button
                                        className={`select-button ${charSet === 'blocks' ? 'active' : ''}`}
                                        onClick={() => setCharSet('blocks')}
                                    >
                                        Blocks
                                    </button>
                                    <button
                                        className={`select-button ${charSet === 'simple' ? 'active' : ''}`}
                                        onClick={() => setCharSet('simple')}
                                    >
                                        Simple
                                    </button>
                                </div>
                            </div>

                            <div className="control-group">
                                <label className="control-label">
                                    <span>Invert Colors</span>
                                </label>
                                <div className="toggle-container">
                                    <div
                                        className={`toggle ${inverted ? 'active' : ''}`}
                                        onClick={() => setInverted(!inverted)}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            className="download-button"
                            onClick={regenerate}
                            disabled={isProcessing}
                            style={{ width: '100%', marginTop: '1rem' }}
                        >
                            {isProcessing ? '⏳ Generating...' : '🔄 Regenerate'}
                        </button>
                    </div>

                    {/* Side by side view */}
                    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
                        <div className="image-preview-container" style={{ margin: 0, padding: '1rem' }}>
                            <img src={preview!} alt="Original" style={{ width: '100%', borderRadius: '8px' }} />
                            <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>
                                Original
                            </div>
                        </div>

                        <div className="controls-panel" style={{ margin: 0, overflow: 'hidden' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h4>ASCII Art</h4>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        className="secondary-button"
                                        onClick={copyArt}
                                        style={{ padding: '0.5rem 1rem' }}
                                    >
                                        {copied ? '✓ Copied!' : '📋 Copy'}
                                    </button>
                                    <button
                                        className="secondary-button"
                                        onClick={downloadArt}
                                        style={{ padding: '0.5rem 1rem' }}
                                    >
                                        ⬇️ Download
                                    </button>
                                </div>
                            </div>

                            <pre style={{
                                background: '#000',
                                color: '#0f0',
                                padding: '1rem',
                                borderRadius: '8px',
                                fontSize: '6px',
                                lineHeight: 1.1,
                                fontFamily: 'monospace',
                                overflow: 'auto',
                                maxHeight: '400px',
                                whiteSpace: 'pre',
                                margin: 0
                            }}>
                                {asciiArt || 'Generating...'}
                            </pre>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="actions-bar">
                        <button className="secondary-button" onClick={handleReset}>
                            🔄 Upload New Image
                        </button>
                    </div>
                </>
            )}

            {/* Processing Overlay */}
            {isProcessing && (
                <div className="processing-overlay">
                    <div className="processing-content">
                        <div className="processing-spinner" />
                        <div className="processing-text">Generating ASCII Art...</div>
                    </div>
                </div>
            )}
        </div>
    )
}
