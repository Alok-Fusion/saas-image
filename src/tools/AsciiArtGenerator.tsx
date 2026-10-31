import { useCallback, useEffect, useRef, useState } from 'react'
import Dropzone from '../components/Dropzone'
import { useToast } from '../components/Toast'
import { useObjectUrl } from '../hooks/useObjectUrl'
import { downloadBlob } from '../utils/imageProcessing'
import { runImageTask, type WorkerTask } from '../utils/imageWorker'
import type { CharSetKey } from '../workers/types'

interface AsciiArtGeneratorProps {
    onBack: () => void
}

export default function AsciiArtGenerator({ onBack }: AsciiArtGeneratorProps) {
    const [file, setFile] = useState<File | null>(null)
    const [asciiArt, setAsciiArt] = useState<string>('')
    const [width, setWidth] = useState(100)
    const [isProcessing, setIsProcessing] = useState(false)
    const [copied, setCopied] = useState(false)
    const [charSet, setCharSet] = useState<CharSetKey>('standard')
    const [inverted, setInverted] = useState(false)
    const preview = useObjectUrl(file)
    const taskRef = useRef<WorkerTask<string> | null>(null)
    const { success, error } = useToast()

    const generate = useCallback(async (imageFile: File, outputWidth: number) => {
        taskRef.current?.cancel()
        setIsProcessing(true)
        const task = runImageTask<string>({
            kind: 'ascii',
            file: imageFile,
            width: outputWidth,
            charSet,
            inverted,
        })
        taskRef.current = task

        try {
            const art = await task.promise
            setAsciiArt(art)
        } catch (err) {
            if (!(err instanceof Error && err.name === 'AbortError')) {
                error(err instanceof Error ? err.message : 'Could not generate ASCII art')
            }
        } finally {
            if (taskRef.current === task) setIsProcessing(false)
        }
    }, [charSet, error, inverted])

    const handleFile = useCallback((selectedFile: File) => {
        setFile(selectedFile)
        setAsciiArt('')
        void generate(selectedFile, width)
    }, [generate, width])

    useEffect(() => () => taskRef.current?.cancel(), [])

    const regenerate = () => {
        if (file) void generate(file, width)
    }

    const cancel = () => {
        taskRef.current?.cancel()
    }

    const copyArt = async () => {
        try {
            await navigator.clipboard.writeText(asciiArt)
            setCopied(true)
            success('ASCII art copied to clipboard')
            setTimeout(() => setCopied(false), 2000)
        } catch {
            error('Clipboard access was blocked by your browser')
        }
    }

    const downloadArt = () => {
        if (!asciiArt) return
        downloadBlob(new Blob([asciiArt], { type: 'text/plain' }), 'ascii-art.txt')
    }

    const handleReset = () => {
        taskRef.current?.cancel()
        setFile(null)
        setAsciiArt('')
    }

    return (
        <div className="tool-page">
            <div className="tool-header">
                <button className="back-button" onClick={onBack}>←</button>
                <h1 className="tool-title">Image to ASCII Art</h1>
            </div>

            {!file ? (
                <Dropzone
                    onFiles={(files) => handleFile(files[0])}
                    icon="🖌️"
                    title="Drop your image here or click to browse"
                    hint="Convert photos into ASCII text art"
                />
            ) : (
                <>
                    <div className="controls-panel">
                        <div className="responsive-grid responsive-grid-3">
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
                                        role="switch"
                                        aria-checked={inverted}
                                        tabIndex={0}
                                        onClick={() => setInverted(!inverted)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault()
                                                setInverted(!inverted)
                                            }
                                        }}
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

                    <div className="ascii-layout">
                        <div className="image-preview-container" style={{ margin: 0, padding: '1rem' }}>
                            {preview && (
                                <img src={preview} alt="Original" style={{ width: '100%', borderRadius: '8px' }} />
                            )}
                            <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>
                                Original
                            </div>
                        </div>

                        <div className="controls-panel" style={{ margin: 0, overflow: 'hidden' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <h4>ASCII Art</h4>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        className="secondary-button"
                                        onClick={copyArt}
                                        style={{ padding: '0.5rem 1rem' }}
                                        disabled={!asciiArt}
                                    >
                                        {copied ? '✓ Copied!' : '📋 Copy'}
                                    </button>
                                    <button
                                        className="secondary-button"
                                        onClick={downloadArt}
                                        style={{ padding: '0.5rem 1rem' }}
                                        disabled={!asciiArt}
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
                                {asciiArt || (isProcessing ? 'Generating...' : 'Adjust settings and regenerate.')}
                            </pre>
                        </div>
                    </div>

                    <div className="actions-bar">
                        <button className="secondary-button" onClick={handleReset}>
                            🔄 Upload New Image
                        </button>
                    </div>
                </>
            )}

            {isProcessing && (
                <div className="processing-overlay">
                    <div className="processing-content">
                        <div className="processing-spinner" />
                        <div className="processing-text">Generating ASCII Art...</div>
                        <button className="secondary-button" style={{ marginTop: '1rem' }} onClick={cancel}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
