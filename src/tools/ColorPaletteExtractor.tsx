import { useCallback, useRef, useState } from 'react'
import { getImageInfo, type ImageInfo } from '../utils/imageProcessing'

interface ColorPaletteExtractorProps {
    onBack: () => void
}

interface ColorInfo {
    hex: string
    rgb: string
    count: number
    percentage: number
}

export default function ColorPaletteExtractor({ onBack }: ColorPaletteExtractorProps) {
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [originalInfo, setOriginalInfo] = useState<ImageInfo | null>(null)
    const [colors, setColors] = useState<ColorInfo[]>([])
    const [colorCount, setColorCount] = useState(6)
    const [isProcessing, setIsProcessing] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Extract dominant colors from image
    const extractColors = async (imageFile: File, numColors: number): Promise<ColorInfo[]> => {
        return new Promise((resolve, reject) => {
            const img = new Image()
            const url = URL.createObjectURL(imageFile)

            img.onload = () => {
                URL.revokeObjectURL(url)

                // Create small canvas for sampling
                const canvas = document.createElement('canvas')
                const size = 100 // Sample at lower resolution
                canvas.width = size
                canvas.height = size

                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'))
                    return
                }

                ctx.drawImage(img, 0, 0, size, size)
                const imageData = ctx.getImageData(0, 0, size, size)
                const pixels = imageData.data

                // Color quantization using median cut algorithm (simplified)
                const colorMap: Map<string, number> = new Map()

                for (let i = 0; i < pixels.length; i += 4) {
                    const r = Math.round(pixels[i] / 16) * 16
                    const g = Math.round(pixels[i + 1] / 16) * 16
                    const b = Math.round(pixels[i + 2] / 16) * 16
                    const key = `${r},${g},${b}`
                    colorMap.set(key, (colorMap.get(key) || 0) + 1)
                }

                // Sort by frequency
                const sorted = Array.from(colorMap.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, numColors)

                const totalPixels = pixels.length / 4
                const colorInfos: ColorInfo[] = sorted.map(([key, count]) => {
                    const [r, g, b] = key.split(',').map(Number)
                    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
                    return {
                        hex: hex.toUpperCase(),
                        rgb: `rgb(${r}, ${g}, ${b})`,
                        count,
                        percentage: Math.round((count / totalPixels) * 100)
                    }
                })

                resolve(colorInfos)
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
        setColors([])

        try {
            const info = await getImageInfo(selectedFile)
            setOriginalInfo(info)

            setIsProcessing(true)
            const extractedColors = await extractColors(selectedFile, colorCount)
            setColors(extractedColors)
        } catch (error) {
            console.error('Error processing image:', error)
        } finally {
            setIsProcessing(false)
        }
    }, [colorCount])

    // Re-extract with different color count
    const handleColorCountChange = async (count: number) => {
        setColorCount(count)
        if (file) {
            setIsProcessing(true)
            try {
                const extractedColors = await extractColors(file, count)
                setColors(extractedColors)
            } catch (error) {
                console.error('Error extracting colors:', error)
            } finally {
                setIsProcessing(false)
            }
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

    // Copy color to clipboard
    const copyColor = (color: string, index: number) => {
        navigator.clipboard.writeText(color)
        setCopiedIndex(index)
        setTimeout(() => setCopiedIndex(null), 1500)
    }

    // Copy all as CSS
    const copyAsCss = () => {
        const css = colors.map((c, i) => `--color-${i + 1}: ${c.hex};`).join('\n')
        navigator.clipboard.writeText(css)
        alert('CSS variables copied to clipboard!')
    }

    // Generate gradient
    const generateGradient = () => {
        if (colors.length < 2) return ''
        return `linear-gradient(135deg, ${colors.slice(0, 3).map(c => c.hex).join(', ')})`
    }

    // Reset
    const handleReset = () => {
        if (preview) URL.revokeObjectURL(preview)
        setFile(null)
        setPreview(null)
        setOriginalInfo(null)
        setColors([])
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    return (
        <div className="tool-page">
            <div className="tool-header">
                <button className="back-button" onClick={onBack}>←</button>
                <h1 className="tool-title">Color Palette Extractor</h1>
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
                        <div className="dropzone-icon">🎨</div>
                        <p className="dropzone-text">Drop your image here or click to browse</p>
                        <p className="dropzone-hint">Extract dominant colors with hex codes & CSS</p>
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
                    {/* Image Preview & Palette Side by Side */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
                        <div className="image-preview-container" style={{ margin: 0 }}>
                            <img src={preview!} alt="Preview" className="image-preview" />
                            <div className="image-info">
                                <span className="info-badge">
                                    <span className="info-badge-value">{originalInfo ? `${originalInfo.width}×${originalInfo.height}` : '-'}</span>
                                </span>
                            </div>
                        </div>

                        <div className="controls-panel" style={{ margin: 0 }}>
                            <div className="control-group">
                                <label className="control-label">
                                    <span>Number of Colors</span>
                                    <span className="control-value">{colorCount}</span>
                                </label>
                                <div className="select-buttons">
                                    {[4, 6, 8, 10].map(n => (
                                        <button
                                            key={n}
                                            className={`select-button ${colorCount === n ? 'active' : ''}`}
                                            onClick={() => handleColorCountChange(n)}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Color Palette */}
                            <div style={{ marginTop: '1.5rem' }}>
                                <h4 style={{ marginBottom: '1rem' }}>Extracted Palette</h4>
                                <div style={{ display: 'grid', gap: '0.5rem' }}>
                                    {isProcessing ? (
                                        <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.5)' }}>
                                            Extracting colors...
                                        </div>
                                    ) : (
                                        colors.map((color, index) => (
                                            <div
                                                key={index}
                                                onClick={() => copyColor(color.hex, index)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '1rem',
                                                    padding: '0.75rem',
                                                    background: 'rgba(255,255,255,0.03)',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                            >
                                                <div
                                                    style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '8px',
                                                        background: color.hex,
                                                        border: '2px solid rgba(255,255,255,0.1)'
                                                    }}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{color.hex}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{color.rgb}</div>
                                                </div>
                                                <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>
                                                    {copiedIndex === index ? '✓ Copied!' : `${color.percentage}%`}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Gradient Preview */}
                    {colors.length >= 2 && (
                        <div className="controls-panel" style={{ marginTop: '1.5rem' }}>
                            <h4 style={{ marginBottom: '1rem' }}>Generated Gradient</h4>
                            <div
                                style={{
                                    height: '80px',
                                    borderRadius: '12px',
                                    background: generateGradient(),
                                    marginBottom: '1rem'
                                }}
                            />
                            <code style={{
                                display: 'block',
                                padding: '1rem',
                                background: 'rgba(0,0,0,0.3)',
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                wordBreak: 'break-all'
                            }}>
                                background: {generateGradient()};
                            </code>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="actions-bar">
                        <button className="secondary-button" onClick={handleReset}>
                            🔄 Upload New Image
                        </button>
                        <button className="secondary-button" onClick={copyAsCss}>
                            📋 Copy as CSS Variables
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
