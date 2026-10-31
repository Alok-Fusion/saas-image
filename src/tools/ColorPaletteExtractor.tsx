import { useCallback, useEffect, useRef, useState } from 'react'
import Dropzone from '../components/Dropzone'
import { useToast } from '../components/Toast'
import { useObjectUrl } from '../hooks/useObjectUrl'
import { getImageInfo, type ImageInfo } from '../utils/imageProcessing'
import { runImageTask, type PaletteColor, type WorkerTask } from '../utils/imageWorker'

interface ColorPaletteExtractorProps {
    onBack: () => void
}

export default function ColorPaletteExtractor({ onBack }: ColorPaletteExtractorProps) {
    const [file, setFile] = useState<File | null>(null)
    const [originalInfo, setOriginalInfo] = useState<ImageInfo | null>(null)
    const [colors, setColors] = useState<PaletteColor[]>([])
    const [colorCount, setColorCount] = useState(6)
    const [isProcessing, setIsProcessing] = useState(false)
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
    const preview = useObjectUrl(file)
    const taskRef = useRef<WorkerTask<PaletteColor[]> | null>(null)
    const { success, error } = useToast()

    const extractColors = useCallback(async (imageFile: File, numColors: number) => {
        taskRef.current?.cancel()
        setIsProcessing(true)
        const task = runImageTask<PaletteColor[]>({ kind: 'palette', file: imageFile, numColors })
        taskRef.current = task
        try {
            setColors(await task.promise)
        } catch (err) {
            if (!(err instanceof Error && err.name === 'AbortError')) {
                error(err instanceof Error ? err.message : 'Could not extract colors')
            }
        } finally {
            if (taskRef.current === task) setIsProcessing(false)
        }
    }, [error])

    const handleFile = useCallback(async (selectedFile: File) => {
        setFile(selectedFile)
        setColors([])
        try {
            setOriginalInfo(await getImageInfo(selectedFile))
        } catch {
            setOriginalInfo(null)
        }
        void extractColors(selectedFile, colorCount)
    }, [colorCount, extractColors])

    useEffect(() => () => taskRef.current?.cancel(), [])

    const handleColorCountChange = (count: number) => {
        setColorCount(count)
        if (file) void extractColors(file, count)
    }

    const copyColor = async (color: string, index: number) => {
        try {
            await navigator.clipboard.writeText(color)
            setCopiedIndex(index)
            success(`${color} copied`)
            setTimeout(() => setCopiedIndex(null), 1500)
        } catch {
            error('Clipboard access was blocked by your browser')
        }
    }

    const copyAsCss = async () => {
        if (colors.length === 0) return
        const css = colors.map((c, i) => `--color-${i + 1}: ${c.hex};`).join('\n')
        try {
            await navigator.clipboard.writeText(css)
            success('CSS variables copied to clipboard')
        } catch {
            error('Clipboard access was blocked by your browser')
        }
    }

    const generateGradient = () => {
        if (colors.length < 2) return ''
        return `linear-gradient(135deg, ${colors.slice(0, 3).map(c => c.hex).join(', ')})`
    }

    const handleReset = () => {
        taskRef.current?.cancel()
        setFile(null)
        setOriginalInfo(null)
        setColors([])
    }

    return (
        <div className="tool-page">
            <div className="tool-header">
                <button className="back-button" onClick={onBack}>←</button>
                <h1 className="tool-title">Color Palette Extractor</h1>
            </div>

            {!file ? (
                <Dropzone
                    onFiles={(files) => void handleFile(files[0])}
                    icon="🎨"
                    title="Drop your image here or click to browse"
                    hint="Extract dominant colors with hex codes & CSS"
                />
            ) : (
                <>
                    <div className="palette-layout">
                        <div className="image-preview-container" style={{ margin: 0 }}>
                            {preview && <img src={preview} alt="Preview" className="image-preview" />}
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
                                                key={`${color.hex}-${index}`}
                                                role="button"
                                                tabIndex={0}
                                                aria-label={`Copy ${color.hex}`}
                                                onClick={() => void copyColor(color.hex, index)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault()
                                                        void copyColor(color.hex, index)
                                                    }
                                                }}
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

                    <div className="actions-bar">
                        <button className="secondary-button" onClick={handleReset}>
                            🔄 Upload New Image
                        </button>
                        <button className="secondary-button" onClick={() => void copyAsCss()} disabled={colors.length === 0}>
                            📋 Copy as CSS Variables
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
