import { useCallback, useEffect, useRef, useState } from 'react'
import { Archive, Download, FileText, RotateCcw } from 'lucide-react'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import Button from '../components/Button'
import ControlGroup from '../components/ControlGroup'
import Dropzone from '../components/Dropzone'
import FileChip from '../components/FileChip'
import ProgressBar from '../components/ProgressBar'
import SegmentedControl from '../components/SegmentedControl'
import StatTile from '../components/StatTile'
import ToolHeader from '../components/ToolHeader'
import { useToast } from '../components/Toast'
import WorkspaceLayout from '../components/WorkspaceLayout'
import { buildOutputName, downloadBlob } from '../utils/imageProcessing'

interface PdfToImageProps {
    onBack: () => void
}

interface RenderedPage {
    blob: Blob
    url: string
}

const MAX_PDF_BYTES = 50 * 1024 * 1024

const SCALE_OPTIONS = [
    { value: '1', label: '1× (72 DPI)' },
    { value: '2', label: '2× (150 DPI)' },
    { value: '3', label: '3× (300 DPI)' },
]

export default function PdfToImage({ onBack }: PdfToImageProps) {
    const [file, setFile] = useState<File | null>(null)
    const [pages, setPages] = useState<RenderedPage[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [progress, setProgress] = useState(0)
    const [scale, setScale] = useState(2)
    const cancelRef = useRef(false)
    const pagesRef = useRef<RenderedPage[]>([])
    const { success, error } = useToast()

    const revokeAll = useCallback((list: RenderedPage[]) => {
        list.forEach((page) => URL.revokeObjectURL(page.url))
    }, [])

    useEffect(() => {
        pagesRef.current = pages
    }, [pages])

    useEffect(() => {
        return () => {
            cancelRef.current = true
            revokeAll(pagesRef.current)
        }
    }, [revokeAll])

    const convertPdfToImages = useCallback(
        async (pdfFile: File, renderScale: number) => {
            setIsProcessing(true)
            setProgress(0)
            cancelRef.current = false

            const previous = pagesRef.current
            pagesRef.current = []
            setPages([])
            revokeAll(previous)

            const pdfjsLib = await import('pdfjs-dist')
            pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

            let pdf: Awaited<ReturnType<typeof pdfjsLib.getDocument>['promise']> | null = null
            const newPages: RenderedPage[] = []

            try {
                const arrayBuffer = await pdfFile.arrayBuffer()
                pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
                const pageCount = pdf.numPages

                for (let i = 1; i <= pageCount; i++) {
                    if (cancelRef.current) break

                    const page = await pdf.getPage(i)
                    const viewport = page.getViewport({ scale: renderScale })

                    const canvas = document.createElement('canvas')
                    canvas.width = Math.ceil(viewport.width)
                    canvas.height = Math.ceil(viewport.height)
                    const ctx = canvas.getContext('2d')
                    if (!ctx) throw new Error('Canvas not supported')

                    await page.render({ canvasContext: ctx, viewport, canvas }).promise

                    const blob = await new Promise<Blob>((resolve, reject) => {
                        canvas.toBlob(
                            (result) => (result ? resolve(result) : reject(new Error('Failed to encode page'))),
                            'image/png'
                        )
                    })

                    canvas.width = 0
                    canvas.height = 0
                    page.cleanup()

                    const rendered = { blob, url: URL.createObjectURL(blob) }
                    newPages.push(rendered)
                    pagesRef.current = [...newPages]
                    setPages([...newPages])
                    setProgress(Math.round((i / pageCount) * 100))
                }

                if (!cancelRef.current && newPages.length === 0) {
                    error('This PDF has no pages to render.')
                } else if (!cancelRef.current) {
                    success(`Rendered ${newPages.length} PDF page${newPages.length > 1 ? 's' : ''}`)
                }
            } catch (err) {
                const name = (err as { name?: string })?.name
                if (name === 'PasswordException') {
                    error('This PDF is password-protected. Remove the password and try again.')
                } else {
                    console.error('Error converting PDF:', err)
                    error('Could not read this PDF. Make sure it is a valid, unencrypted PDF file.')
                }
            } finally {
                if (pdf) {
                    try {
                        await pdf.destroy()
                    } catch {
                        /* already destroyed */
                    }
                }
                setIsProcessing(false)
            }
        },
        [revokeAll, error, success]
    )

    const handleFile = useCallback(
        (selectedFile: File) => {
            if (
                selectedFile.type !== 'application/pdf' &&
                !selectedFile.name.toLowerCase().endsWith('.pdf')
            ) {
                error('Please select a valid PDF file.')
                return
            }
            if (selectedFile.size > MAX_PDF_BYTES) {
                error('This PDF is larger than 50 MB. Please choose a smaller file.')
                return
            }
            setFile(selectedFile)
            void convertPdfToImages(selectedFile, scale)
        },
        [convertPdfToImages, scale, error]
    )

    const handleScaleChange = (val: string) => {
        const s = Number(val)
        setScale(s)
        if (file) void convertPdfToImages(file, s)
    }

    const downloadSingle = (page: RenderedPage, index: number) => {
        downloadBlob(
            page.blob,
            buildOutputName(file?.name || 'document.pdf', `page-${index + 1}`, 'png')
        )
    }

    const downloadAll = async () => {
        const JSZip = (await import('jszip')).default
        const zip = new JSZip()
        const baseName = (file?.name || 'document').replace(/\.pdf$/i, '') || 'document'
        pages.forEach((page, i) => {
            zip.file(`${baseName}-page-${i + 1}.png`, page.blob)
        })
        const content = await zip.generateAsync({ type: 'blob' })
        downloadBlob(content, `${baseName}-pages.zip`)
        success('ZIP archive created and downloaded')
    }

    const cancel = () => {
        cancelRef.current = true
        setIsProcessing(false)
    }

    const handleReset = () => {
        cancelRef.current = true
        revokeAll(pagesRef.current)
        pagesRef.current = []
        setFile(null)
        setPages([])
        setProgress(0)
    }

    const leftControls = (
        <>
            {file && (
                <ControlGroup label="Source PDF">
                    <FileChip
                        name={file.name}
                        sizeBytes={file.size}
                        onRemove={handleReset}
                    />
                </ControlGroup>
            )}

            <ControlGroup
                label="Render Resolution"
                hint="Higher DPI produces crisper text and vector graphics"
            >
                <SegmentedControl
                    value={String(scale)}
                    onChange={handleScaleChange}
                    options={SCALE_OPTIONS}
                />
            </ControlGroup>

            {isProcessing && (
                <ControlGroup label="Rendering Progress">
                    <ProgressBar
                        progress={progress}
                        stageText="Extracting vector streams to canvas bitmaps…"
                        onCancel={cancel}
                    />
                </ControlGroup>
            )}
        </>
    )

    const centerCanvas = !file ? (
        <Dropzone
            onFiles={(files) => handleFile(files[0])}
            accept={{ 'application/pdf': ['.pdf'] }}
            icon="file-text"
            title="Drop PDF here or click to browse"
            hint="Converts each page to full-resolution PNG images in your browser"
        />
    ) : (
        <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    Rendered Pages ({pages.length})
                </p>
                {pages.length > 1 && (
                    <Button variant="secondary" size="sm" onClick={() => void downloadAll()} icon={<Archive size={13} />}>
                        Download All as ZIP
                    </Button>
                )}
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: 'var(--spacing-3)',
                }}
            >
                {pages.map((page, idx) => (
                    <div
                        key={idx}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            padding: 'var(--spacing-2)',
                            backgroundColor: 'var(--color-bg-surface)',
                            border: '1px solid var(--color-border-default)',
                            borderRadius: 'var(--radius-md)',
                            gap: 'var(--spacing-2)',
                        }}
                    >
                        <div style={{ position: 'relative', width: '100%', overflow: 'hidden', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-subtle)' }}>
                            <img
                                src={page.url}
                                alt={`Page ${idx + 1}`}
                                style={{ width: '100%', height: 'auto', display: 'block' }}
                            />
                            <span
                                style={{
                                    position: 'absolute',
                                    top: 6,
                                    left: 6,
                                    backgroundColor: 'rgba(0,0,0,0.65)',
                                    color: '#ffffff',
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    padding: '2px 6px',
                                    borderRadius: 'var(--radius-sm)',
                                    fontFamily: 'var(--font-mono)',
                                }}
                            >
                                Page {idx + 1}
                            </span>
                        </div>

                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => downloadSingle(page, idx)}
                            icon={<Download size={13} />}
                        >
                            Download PNG
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    )

    const bottomBar = (
        <>
            <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                <StatTile label="Pages Rendered" value={pages.length} />
                <StatTile label="Scale" value={`${scale}×`} />
            </div>

            <div className="workspace-action-group">
                <Button variant="ghost" onClick={handleReset} icon={<RotateCcw size={15} />}>
                    Reset
                </Button>
                {pages.length > 0 && (
                    <Button
                        variant="primary"
                        onClick={() => void downloadAll()}
                        icon={<Archive size={15} />}
                    >
                        Download All ({pages.length} Pages)
                    </Button>
                )}
            </div>
        </>
    )

    return (
        <div className="tool-view-wrapper">
            <ToolHeader
                toolName="PDF to Image"
                toolIcon={<FileText size={18} />}
                toolId="pdf-to-image"
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
