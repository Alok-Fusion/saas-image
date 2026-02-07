import JSZip from 'jszip'
import { useCallback, useRef, useState } from 'react'
import { downloadBlob } from '../utils/imageProcessing'

interface FaviconGeneratorProps {
    onBack: () => void
}

interface FaviconSize {
    size: number
    name: string
    description: string
}

const FAVICON_SIZES: FaviconSize[] = [
    { size: 16, name: 'favicon-16x16.png', description: 'Browser tab' },
    { size: 32, name: 'favicon-32x32.png', description: 'Browser tab (Retina)' },
    { size: 48, name: 'favicon-48x48.png', description: 'Desktop shortcut' },
    { size: 64, name: 'favicon-64x64.png', description: 'Windows site icon' },
    { size: 96, name: 'favicon-96x96.png', description: 'Google TV icon' },
    { size: 128, name: 'favicon-128x128.png', description: 'Chrome Web Store' },
    { size: 180, name: 'apple-touch-icon.png', description: 'iOS home screen' },
    { size: 192, name: 'android-chrome-192x192.png', description: 'Android Chrome' },
    { size: 256, name: 'favicon-256x256.png', description: 'Large icon' },
    { size: 512, name: 'android-chrome-512x512.png', description: 'Android splash' }
]

export default function FaviconGenerator({ onBack }: FaviconGeneratorProps) {
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [generatedFavicons, setGeneratedFavicons] = useState<Map<number, { blob: Blob; url: string }>>(new Map())
    const [isProcessing, setIsProcessing] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Generate favicon at specific size
    const generateFavicon = async (imageFile: File, size: number): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = new Image()
            const url = URL.createObjectURL(imageFile)

            img.onload = () => {
                URL.revokeObjectURL(url)

                const canvas = document.createElement('canvas')
                canvas.width = size
                canvas.height = size

                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'))
                    return
                }

                // Draw with high quality scaling
                ctx.imageSmoothingEnabled = true
                ctx.imageSmoothingQuality = 'high'

                // Center crop to square
                const minDim = Math.min(img.width, img.height)
                const sx = (img.width - minDim) / 2
                const sy = (img.height - minDim) / 2

                ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size)

                canvas.toBlob(
                    (blob) => {
                        if (blob) resolve(blob)
                        else reject(new Error('Failed to create favicon'))
                    },
                    'image/png'
                )
            }

            img.onerror = () => {
                URL.revokeObjectURL(url)
                reject(new Error('Failed to load image'))
            }

            img.src = url
        })
    }

    // Generate all favicons
    const generateAllFavicons = async (imageFile: File) => {
        const newFavicons = new Map<number, { blob: Blob; url: string }>()

        for (const { size } of FAVICON_SIZES) {
            const blob = await generateFavicon(imageFile, size)
            newFavicons.set(size, { blob, url: URL.createObjectURL(blob) })
        }

        return newFavicons
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

        // Clear old favicons
        generatedFavicons.forEach(f => URL.revokeObjectURL(f.url))
        setGeneratedFavicons(new Map())

        // Auto-generate
        setIsProcessing(true)
        try {
            const favicons = await generateAllFavicons(selectedFile)
            setGeneratedFavicons(favicons)
        } catch (error) {
            console.error('Error generating favicons:', error)
            alert('Error processing image')
        } finally {
            setIsProcessing(false)
        }
    }, [generatedFavicons])

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

    // Download all as ZIP with manifest
    const handleDownloadAll = async () => {
        if (generatedFavicons.size === 0) return

        const zip = new JSZip()

        // Add all favicon images
        for (const { size, name } of FAVICON_SIZES) {
            const favicon = generatedFavicons.get(size)
            if (favicon) {
                zip.file(name, favicon.blob)
            }
        }

        // Add ICO file (16x16 and 32x32 combined would need special handling)
        // For simplicity, we'll add the 32x32 as favicon.ico
        const favicon32 = generatedFavicons.get(32)
        if (favicon32) {
            zip.file('favicon.ico', favicon32.blob)
        }

        // Generate manifest.json
        const manifest = {
            name: 'Your App Name',
            short_name: 'App',
            icons: [
                { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
                { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }
            ],
            theme_color: '#ffffff',
            background_color: '#ffffff',
            display: 'standalone'
        }
        zip.file('manifest.json', JSON.stringify(manifest, null, 2))

        // Generate HTML snippet
        const htmlSnippet = `<!-- Favicons -->
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#ffffff">`
        zip.file('favicon-html.txt', htmlSnippet)

        const content = await zip.generateAsync({ type: 'blob' })
        downloadBlob(content, 'favicons.zip')
    }

    // Reset
    const handleReset = () => {
        if (preview) URL.revokeObjectURL(preview)
        generatedFavicons.forEach(f => URL.revokeObjectURL(f.url))
        setFile(null)
        setPreview(null)
        setGeneratedFavicons(new Map())
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    return (
        <div className="tool-page">
            <div className="tool-header">
                <button className="back-button" onClick={onBack}>←</button>
                <h1 className="tool-title">Favicon Generator</h1>
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
                        <div className="dropzone-icon">🖼️</div>
                        <p className="dropzone-text">Drop your logo here or click to browse</p>
                        <p className="dropzone-hint">Generate all favicon sizes + manifest.json + HTML snippet</p>
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
                    {/* Original Image Preview */}
                    <div className="image-preview-container">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', justifyContent: 'center' }}>
                            <div>
                                <img
                                    src={preview!}
                                    alt="Original"
                                    style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '16px' }}
                                />
                                <p style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>Original</p>
                            </div>
                            {generatedFavicons.get(32) && (
                                <>
                                    <div style={{ fontSize: '2rem', color: 'rgba(255,255,255,0.3)' }}>→</div>
                                    <div>
                                        <div style={{
                                            background: 'white',
                                            padding: '1rem',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            gap: '1rem',
                                            alignItems: 'flex-end'
                                        }}>
                                            {[16, 32, 48].map(size => {
                                                const favicon = generatedFavicons.get(size)
                                                return favicon && (
                                                    <img
                                                        key={size}
                                                        src={favicon.url}
                                                        alt={`${size}x${size}`}
                                                        style={{ width: size, height: size }}
                                                    />
                                                )
                                            })}
                                        </div>
                                        <p style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>Preview</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Generated Sizes */}
                    {generatedFavicons.size > 0 && (
                        <div className="controls-panel" style={{ marginTop: '1.5rem' }}>
                            <h4 style={{ marginBottom: '1rem' }}>Generated Sizes ({FAVICON_SIZES.length})</h4>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                gap: '0.75rem'
                            }}>
                                {FAVICON_SIZES.map(({ size, name, description }) => {
                                    const favicon = generatedFavicons.get(size)
                                    return (
                                        <div
                                            key={size}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1rem',
                                                padding: '0.75rem',
                                                background: 'rgba(255,255,255,0.03)',
                                                borderRadius: '8px'
                                            }}
                                        >
                                            {favicon && (
                                                <img
                                                    src={favicon.url}
                                                    alt={name}
                                                    style={{
                                                        width: Math.min(size, 48),
                                                        height: Math.min(size, 48),
                                                        borderRadius: '4px',
                                                        background: 'white'
                                                    }}
                                                />
                                            )}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{size}×{size}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{description}</div>
                                            </div>
                                            <div style={{ color: '#38ef7d', fontSize: '1rem' }}>✓</div>
                                        </div>
                                    )
                                })}
                            </div>

                            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(102, 126, 234, 0.1)', borderRadius: '12px' }}>
                                <h5 style={{ marginBottom: '0.5rem' }}>📦 ZIP includes:</h5>
                                <ul style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.25rem' }}>
                                    <li>• All favicon sizes (PNG)</li>
                                    <li>• favicon.ico</li>
                                    <li>• apple-touch-icon.png</li>
                                    <li>• android-chrome icons</li>
                                    <li>• manifest.json</li>
                                    <li>• HTML snippet</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="actions-bar">
                        <button className="secondary-button" onClick={handleReset}>
                            🔄 Upload New Image
                        </button>
                        <button
                            className="download-button"
                            onClick={handleDownloadAll}
                            disabled={isProcessing || generatedFavicons.size === 0}
                        >
                            {isProcessing ? '⏳ Generating...' : '📦 Download All Favicons'}
                        </button>
                    </div>
                </>
            )}

            {/* Processing Overlay */}
            {isProcessing && (
                <div className="processing-overlay">
                    <div className="processing-content">
                        <div className="processing-spinner" />
                        <div className="processing-text">Generating Favicons...</div>
                    </div>
                </div>
            )}
        </div>
    )
}
