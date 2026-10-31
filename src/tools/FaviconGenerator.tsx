import { useCallback, useEffect, useRef, useState } from 'react'
import Dropzone from '../components/Dropzone'
import { useToast } from '../components/Toast'
import { useObjectUrl } from '../hooks/useObjectUrl'
import { canvasToBlob, downloadBlob, loadImage } from '../utils/imageProcessing'

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
    { size: 512, name: 'android-chrome-512x512.png', description: 'Android splash' },
]

interface GeneratedFavicon {
    blob: Blob
    url: string
}

async function generateFavicon(imageFile: File, size: number): Promise<Blob> {
    const img = await loadImage(imageFile)
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas is not available')

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    const minDim = Math.min(img.naturalWidth || img.width, img.naturalHeight || img.height)
    const sx = ((img.naturalWidth || img.width) - minDim) / 2
    const sy = ((img.naturalHeight || img.height) - minDim) / 2
    ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size)

    return canvasToBlob(canvas, 'image/png')
}

/** Build a real multi-image .ico container using PNG-compressed entries. */
async function buildIco(entries: { size: number; blob: Blob }[]): Promise<Blob> {
    const images = await Promise.all(
        entries.map(async (entry) => ({
            size: entry.size,
            data: new Uint8Array(await entry.blob.arrayBuffer()),
        }))
    )
    const headerSize = 6 + 16 * images.length
    const total = headerSize + images.reduce((acc, image) => acc + image.data.length, 0)
    const buffer = new ArrayBuffer(total)
    const view = new DataView(buffer)
    view.setUint16(0, 0, true)
    view.setUint16(2, 1, true)
    view.setUint16(4, images.length, true)

    let offset = headerSize
    images.forEach((image, index) => {
        const entry = 6 + index * 16
        view.setUint8(entry, image.size >= 256 ? 0 : image.size)
        view.setUint8(entry + 1, image.size >= 256 ? 0 : image.size)
        view.setUint8(entry + 2, 0)
        view.setUint8(entry + 3, 0)
        view.setUint16(entry + 4, 1, true)
        view.setUint16(entry + 6, 32, true)
        view.setUint32(entry + 8, image.data.length, true)
        view.setUint32(entry + 12, offset, true)
        new Uint8Array(buffer, offset, image.data.length).set(image.data)
        offset += image.data.length
    })

    return new Blob([buffer], { type: 'image/x-icon' })
}

export default function FaviconGenerator({ onBack }: FaviconGeneratorProps) {
    const [file, setFile] = useState<File | null>(null)
    const [generatedFavicons, setGeneratedFavicons] = useState<Map<number, GeneratedFavicon>>(new Map())
    const [isProcessing, setIsProcessing] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)
    const preview = useObjectUrl(file)
    const faviconsRef = useRef<Map<number, GeneratedFavicon>>(new Map())
    const { error, success } = useToast()

    useEffect(() => {
        faviconsRef.current = generatedFavicons
    }, [generatedFavicons])

    const clearFavicons = () => {
        faviconsRef.current.forEach((favicon) => URL.revokeObjectURL(favicon.url))
        setGeneratedFavicons(new Map())
    }

    useEffect(() => () => {
        faviconsRef.current.forEach((favicon) => URL.revokeObjectURL(favicon.url))
    }, [])

    const handleFile = useCallback(async (selectedFile: File) => {
        setFile(selectedFile)
        clearFavicons()
        setIsProcessing(true)
        try {
            const next = new Map<number, GeneratedFavicon>()
            for (const { size } of FAVICON_SIZES) {
                const blob = await generateFavicon(selectedFile, size)
                next.set(size, { blob, url: URL.createObjectURL(blob) })
            }
            setGeneratedFavicons(next)
        } catch (err) {
            error(err instanceof Error ? err.message : 'Could not generate favicons')
        } finally {
            setIsProcessing(false)
        }
    }, [error])

    const handleDownloadAll = async () => {
        if (generatedFavicons.size === 0) return
        setIsDownloading(true)
        try {
            const { default: JSZip } = await import('jszip')
            const zip = new JSZip()

            for (const { size, name } of FAVICON_SIZES) {
                const favicon = generatedFavicons.get(size)
                if (favicon) zip.file(name, favicon.blob)
            }

            const icoEntries = [16, 32, 48]
                .map((size) => ({ size, blob: generatedFavicons.get(size)?.blob }))
                .filter((entry): entry is { size: number; blob: Blob } => Boolean(entry.blob))
            if (icoEntries.length > 0) {
                zip.file('favicon.ico', await buildIco(icoEntries))
            }

            const manifest = {
                name: 'Your App Name',
                short_name: 'App',
                description: 'Add your app description here',
                start_url: '/',
                scope: '/',
                display: 'standalone',
                background_color: '#ffffff',
                theme_color: '#ffffff',
                icons: [
                    { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
                    { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
                ],
            }
            zip.file('manifest.json', JSON.stringify(manifest, null, 2))
            zip.file('site.webmanifest', JSON.stringify(manifest, null, 2))

            const htmlSnippet = `<!-- Favicons -->
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#ffffff">`
            zip.file('favicon-html.txt', htmlSnippet)

            const content = await zip.generateAsync({ type: 'blob' })
            downloadBlob(content, 'favicons.zip')
            success('Downloaded favicons.zip')
        } catch (err) {
            error(err instanceof Error ? err.message : 'Could not build the favicon bundle')
        } finally {
            setIsDownloading(false)
        }
    }

    const handleReset = () => {
        clearFavicons()
        setFile(null)
    }

    return (
        <div className="tool-page">
            <div className="tool-header">
                <button className="back-button" onClick={onBack}>←</button>
                <h1 className="tool-title">Favicon Generator</h1>
            </div>

            {!file ? (
                <Dropzone
                    onFiles={(files) => void handleFile(files[0])}
                    icon="🖼️"
                    title="Drop your logo here or click to browse"
                    hint="Generate all favicon sizes + manifest.json + HTML snippet"
                />
            ) : (
                <>
                    <div className="image-preview-container">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <div>
                                {preview && (
                                    <img
                                        src={preview}
                                        alt="Original"
                                        style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '16px' }}
                                    />
                                )}
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

                    {generatedFavicons.size > 0 && (
                        <div className="controls-panel" style={{ marginTop: '1.5rem' }}>
                            <h4 style={{ marginBottom: '1rem' }}>Generated Sizes ({FAVICON_SIZES.length})</h4>
                            <div className="favicon-grid">
                                {FAVICON_SIZES.map(({ size, name, description }) => {
                                    const favicon = generatedFavicons.get(size)
                                    return (
                                        <div key={size} className="result-card" style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            {favicon ? (
                                                <img
                                                    src={favicon.url}
                                                    alt={name}
                                                    style={{ width: Math.min(size, 56), height: Math.min(size, 56), borderRadius: 6, background: 'rgba(255,255,255,0.05)', flexShrink: 0 }}
                                                />
                                            ) : (
                                                <div style={{ width: 56, height: 56, borderRadius: 6, background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />
                                            )}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{size}×{size} · {description}</div>
                                            </div>
                                            {favicon && (
                                                <button
                                                    className="secondary-button"
                                                    style={{ padding: '0.35rem 0.6rem', flexShrink: 0 }}
                                                    onClick={() => downloadBlob(favicon.blob, name)}
                                                    aria-label={`Download ${name}`}
                                                >
                                                    ⬇️
                                                </button>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    <div className="actions-bar">
                        <button className="secondary-button" onClick={handleReset}>
                            🔄 Upload New Image
                        </button>
                        <button
                            className="download-button"
                            onClick={() => void handleDownloadAll()}
                            disabled={generatedFavicons.size === 0 || isDownloading}
                        >
                            {isDownloading ? 'Packaging…' : '⬇️ Download All (.zip)'}
                        </button>
                    </div>
                </>
            )}

            {isProcessing && (
                <div className="processing-overlay">
                    <div className="processing-content">
                        <div className="processing-spinner" />
                        <div className="processing-text">Generating favicons...</div>
                    </div>
                </div>
            )}
        </div>
    )
}
