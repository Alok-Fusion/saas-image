import { useCallback, useEffect, useRef, useState } from 'react'
import { Archive, Copy, Download, Globe, RotateCcw } from 'lucide-react'
import Button from '../components/Button'
import ControlGroup from '../components/ControlGroup'
import Dropzone from '../components/Dropzone'
import FileChip from '../components/FileChip'
import StatTile from '../components/StatTile'
import ToolHeader from '../components/ToolHeader'
import { useToast } from '../components/Toast'
import WorkspaceLayout from '../components/WorkspaceLayout'
import { useObjectUrl } from '../hooks/useObjectUrl'
import { canvasToBlob, downloadBlob, getImageInfo, loadImage, type ImageInfo } from '../utils/imageProcessing'
import { createSampleImage } from '../utils/sampleImage'

interface FaviconGeneratorProps {
    onBack: () => void
    initialFile?: File | null
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

export default function FaviconGenerator({ onBack, initialFile }: FaviconGeneratorProps) {
    const [file, setFile] = useState<File | null>(() => initialFile ?? null)
    const [prevInitialFile, setPrevInitialFile] = useState<File | null>(initialFile ?? null)
    const [originalInfo, setOriginalInfo] = useState<ImageInfo | null>(null)
    const [generatedFavicons, setGeneratedFavicons] = useState<Map<number, GeneratedFavicon>>(new Map())
    const [isProcessing, setIsProcessing] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)
    const preview = useObjectUrl(file)
    const faviconsRef = useRef<Map<number, GeneratedFavicon>>(new Map())
    const { error, success } = useToast()

    useEffect(() => {
        faviconsRef.current = generatedFavicons
    }, [generatedFavicons])

    const clearFavicons = useCallback(() => {
        faviconsRef.current.forEach((favicon) => URL.revokeObjectURL(favicon.url))
        faviconsRef.current = new Map()
        setGeneratedFavicons(new Map())
    }, [])

    if (initialFile && initialFile !== prevInitialFile) {
        setPrevInitialFile(initialFile)
        setFile(initialFile)
        setGeneratedFavicons(new Map())
    }

    const processFile = useCallback(
        async (selectedFile: File) => {
            clearFavicons()
            setIsProcessing(true)
            try {
                const next = new Map<number, GeneratedFavicon>()
                for (const { size } of FAVICON_SIZES) {
                    const blob = await generateFavicon(selectedFile, size)
                    next.set(size, { blob, url: URL.createObjectURL(blob) })
                }
                setGeneratedFavicons(next)
                success('Generated all 10 favicon sizes')
            } catch (err) {
                error(err instanceof Error ? err.message : 'Could not generate favicons')
            } finally {
                setIsProcessing(false)
            }
        },
        [clearFavicons, error, success]
    )

    const handleFile = useCallback(
        (selectedFile: File) => {
            setFile(selectedFile)
            void processFile(selectedFile)
        },
        [processFile]
    )

    useEffect(() => {
        if (!file) return
        let cancelled = false
        void getImageInfo(file)
            .then((info) => {
                if (cancelled) return
                setOriginalInfo(info)
            })
            .catch(() => {
                if (cancelled) return
                setOriginalInfo(null)
            })
        return () => {
            cancelled = true
        }
    }, [file])

    // Generate for initialFile if present on mount
    useEffect(() => {
        if (initialFile && generatedFavicons.size === 0 && !isProcessing) {
            const timer = setTimeout(() => {
                void processFile(initialFile)
            }, 0)
            return () => clearTimeout(timer)
        }
    }, [initialFile, generatedFavicons.size, isProcessing, processFile])

    useEffect(() => () => {
        faviconsRef.current.forEach((favicon) => URL.revokeObjectURL(favicon.url))
    }, [])

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
            success('Downloaded favicons.zip package')
        } catch (err) {
            error(err instanceof Error ? err.message : 'Could not build the favicon bundle')
        } finally {
            setIsDownloading(false)
        }
    }

    const handleReset = () => {
        clearFavicons()
        setFile(null)
        setOriginalInfo(null)
    }

    const copyHtmlTags = async () => {
        const snippet = `<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">`
        try {
            await navigator.clipboard.writeText(snippet)
            success('HTML tags copied to clipboard')
        } catch {
            error('Clipboard blocked')
        }
    }

    const leftControls = (
        <>
            {file && (
                <ControlGroup label="Source Image">
                    <FileChip
                        name={file.name}
                        sizeBytes={file.size}
                        width={originalInfo?.width}
                        height={originalInfo?.height}
                        thumbnailUrl={preview || undefined}
                        onRemove={handleReset}
                    />
                </ControlGroup>
            )}

            <ControlGroup label="Package Bundle" hint="Includes all standard web, iOS, Android, and Windows formats">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)' }}>
                        <span>PNG Sizes</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>10 icons</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)' }}>
                        <span>Multi-res .ico</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>16, 32, 48px</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)' }}>
                        <span>PWA Webmanifest</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>Included</span>
                    </div>
                </div>
            </ControlGroup>

            <ControlGroup label="HTML Meta Tags" hint="Drop directly into your <head> section">
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void copyHtmlTags()}
                    icon={<Copy size={13} />}
                >
                    Copy HTML Head Snippet
                </Button>
            </ControlGroup>
        </>
    )

    const centerCanvas = !file ? (
        <Dropzone
            onFiles={(files) => handleFile(files[0])}
            icon="globe"
            title="Drop image to generate favicons"
            hint="PNG, JPEG, WebP or SVG recommended (512×512 or higher)"
            onTrySample={async () => {
                const s = await createSampleImage()
                handleFile(s)
            }}
        />
    ) : (
        <div style={{ width: '100%', maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                Favicon Preview Matrix ({generatedFavicons.size} sizes)
            </p>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                    gap: 'var(--spacing-3)',
                }}
            >
                {FAVICON_SIZES.map(({ size, name, description }) => {
                    const favicon = generatedFavicons.get(size)
                    return (
                        <div
                            key={size}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: 'var(--spacing-3)',
                                backgroundColor: 'var(--color-bg-surface)',
                                border: '1px solid var(--color-border-default)',
                                borderRadius: 'var(--radius-md)',
                                gap: 'var(--spacing-2)',
                                textAlign: 'center',
                            }}
                        >
                            <div
                                className="checkerboard-pattern"
                                style={{
                                    width: '64px',
                                    height: '64px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--color-border-subtle)',
                                    overflow: 'hidden',
                                }}
                            >
                                {favicon && (
                                    <img
                                        src={favicon.url}
                                        alt={name}
                                        style={{
                                            width: `${Math.min(size, 48)}px`,
                                            height: `${Math.min(size, 48)}px`,
                                            imageRendering: size <= 32 ? 'pixelated' : 'auto',
                                        }}
                                    />
                                )}
                            </div>

                            <span style={{ fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>
                                {size} × {size}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                                {description}
                            </span>

                            {favicon && (
                                <button
                                    type="button"
                                    onClick={() => downloadBlob(favicon.blob, name)}
                                    style={{
                                        marginTop: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '4px 8px',
                                        fontSize: '11px',
                                        border: '1px solid var(--color-border-default)',
                                        borderRadius: 'var(--radius-sm)',
                                        backgroundColor: 'var(--color-bg-surface-elevated)',
                                        color: 'var(--color-text-secondary)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <Download size={11} />
                                    <span>PNG</span>
                                </button>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )

    const bottomBar = (
        <>
            <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                <StatTile label="Sizes" value="10 Icons" />
                <StatTile label="Formats" value=".ico + .png + manifest" />
            </div>

            <div className="workspace-action-group">
                <Button variant="ghost" onClick={handleReset} icon={<RotateCcw size={15} />}>
                    Reset
                </Button>
                <Button
                    variant="primary"
                    onClick={() => void handleDownloadAll()}
                    disabled={generatedFavicons.size === 0 || isDownloading}
                    isLoading={isDownloading}
                    icon={<Archive size={15} />}
                >
                    Download Favicon Bundle (.zip)
                </Button>
            </div>
        </>
    )

    return (
        <div className="tool-view-wrapper">
            <ToolHeader
                toolName="Favicon Generator"
                toolIcon={<Globe size={18} />}
                toolId="favicon"
                onBack={onBack}
                onReset={file ? handleReset : undefined}
            />
            <WorkspaceLayout
                leftControls={leftControls}
                centerCanvas={centerCanvas}
                bottomBar={bottomBar}
                hasFile={!!file}
            />
        </div>
    )
}
