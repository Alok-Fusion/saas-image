import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, Download, FileText, RotateCcw, Trash2 } from 'lucide-react'
import Button from '../components/Button'
import ControlGroup from '../components/ControlGroup'
import Dropzone from '../components/Dropzone'
import ProgressBar from '../components/ProgressBar'
import SegmentedControl from '../components/SegmentedControl'
import Slider from '../components/Slider'
import StatTile from '../components/StatTile'
import ToolHeader from '../components/ToolHeader'
import { useToast } from '../components/Toast'
import WorkspaceLayout from '../components/WorkspaceLayout'
import {
    buildOutputName,
    formatFileSize,
    getImageInfo,
    loadImage,
    type ImageInfo,
} from '../utils/imageProcessing'
import { createSampleImage } from '../utils/sampleImage'

interface ImageToPdfProps {
    onBack: () => void
    initialFile?: File | null
}

interface ImageFile {
    file: File
    url: string
    info: ImageInfo
}

const PAGE_SIZE_OPTIONS = [
    { value: 'a4', label: 'A4' },
    { value: 'letter', label: 'Letter' },
    { value: 'fit', label: 'Fit Image' },
]

const ORIENTATION_OPTIONS = [
    { value: 'portrait', label: 'Portrait' },
    { value: 'landscape', label: 'Landscape' },
]

export default function ImageToPdf({ onBack, initialFile }: ImageToPdfProps) {
    const [images, setImages] = useState<ImageFile[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [progress, setProgress] = useState(0)
    const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'fit'>('a4')
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
    const [margin, setMargin] = useState(10)
    const imagesRef = useRef<ImageFile[]>([])
    const cancelRef = useRef(false)
    const { error, success } = useToast()

    useEffect(() => {
        imagesRef.current = images
    }, [images])

    useEffect(() => () => {
        imagesRef.current.forEach((image) => URL.revokeObjectURL(image.url))
    }, [])

    const handleFiles = useCallback(
        async (selectedFiles: File[]) => {
            if (selectedFiles.length === 0) return
            const newImages: ImageFile[] = []

            try {
                for (const file of selectedFiles) {
                    const url = URL.createObjectURL(file)
                    const info = await getImageInfo(file)
                    newImages.push({ file, url, info })
                }
                setImages((current) => [...current, ...newImages])
            } catch (err) {
                newImages.forEach((image) => URL.revokeObjectURL(image.url))
                error(err instanceof Error ? err.message : 'Could not add one of the images')
            }
        },
        [error]
    )

    // Handle initialFile prop
    useEffect(() => {
        if (initialFile && images.length === 0) {
            const timer = setTimeout(() => {
                void handleFiles([initialFile])
            }, 0)
            return () => clearTimeout(timer)
        }
    }, [initialFile, images.length, handleFiles])

    const toPdfDataUrl = async (image: ImageFile): Promise<string> => {
        const img = await loadImage(image.file)
        const canvas = document.createElement('canvas')
        canvas.width = image.info.width
        canvas.height = image.info.height
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Canvas is not available')

        const isJpeg = image.file.type === 'image/jpeg'
        if (isJpeg) {
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        return canvas.toDataURL(isJpeg ? 'image/jpeg' : 'image/png', 0.92)
    }

    const removeImage = (index: number) => {
        const newImages = [...images]
        URL.revokeObjectURL(newImages[index].url)
        newImages.splice(index, 1)
        setImages(newImages)
    }

    const moveImage = (index: number, direction: 'up' | 'down') => {
        const newImages = [...images]
        const newIndex = direction === 'up' ? index - 1 : index + 1
        if (newIndex < 0 || newIndex >= newImages.length) return
        ;[newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]]
        setImages(newImages)
    }

    const generatePdf = async () => {
        if (images.length === 0 || isProcessing) return

        setIsProcessing(true)
        setProgress(0)
        cancelRef.current = false

        try {
            const { jsPDF } = await import('jspdf')
            let pdf: InstanceType<typeof jsPDF>

            if (pageSize === 'fit') {
                const firstImg = images[0]
                pdf = new jsPDF({
                    orientation: firstImg.info.width > firstImg.info.height ? 'landscape' : 'portrait',
                    unit: 'px',
                    format: [firstImg.info.width, firstImg.info.height],
                })
            } else {
                pdf = new jsPDF({ orientation, unit: 'mm', format: pageSize })
            }

            for (let i = 0; i < images.length; i++) {
                if (cancelRef.current) return
                const img = images[i]
                const dataUrl = await toPdfDataUrl(img)
                const format = img.file.type === 'image/jpeg' ? 'JPEG' : 'PNG'

                if (i > 0) {
                    if (pageSize === 'fit') {
                        pdf.addPage(
                            [img.info.width, img.info.height],
                            img.info.width > img.info.height ? 'landscape' : 'portrait'
                        )
                    } else {
                        pdf.addPage()
                    }
                }

                const pageWidth = pdf.internal.pageSize.getWidth()
                const pageHeight = pdf.internal.pageSize.getHeight()

                if (pageSize === 'fit') {
                    pdf.addImage(dataUrl, format, 0, 0, img.info.width, img.info.height)
                } else {
                    const availableWidth = pageWidth - margin * 2
                    const availableHeight = pageHeight - margin * 2
                    const imgRatio = img.info.width / img.info.height
                    const pageRatio = availableWidth / availableHeight

                    let imgWidth: number
                    let imgHeight: number

                    if (imgRatio > pageRatio) {
                        imgWidth = availableWidth
                        imgHeight = availableWidth / imgRatio
                    } else {
                        imgHeight = availableHeight
                        imgWidth = availableHeight * imgRatio
                    }

                    const x = margin + (availableWidth - imgWidth) / 2
                    const y = margin + (availableHeight - imgHeight) / 2
                    pdf.addImage(dataUrl, format, x, y, imgWidth, imgHeight)
                }

                setProgress(Math.round(((i + 1) / images.length) * 100))
            }

            if (cancelRef.current) return
            const baseName = images[0].file.name.replace(/\.[^/.]+$/, '')
            pdf.save(buildOutputName(baseName, images.length > 1 ? `${images.length}-pages` : 'document', 'pdf'))
            success('PDF generated successfully')
        } catch (err) {
            error(err instanceof Error ? err.message : 'Could not generate the PDF')
        } finally {
            setIsProcessing(false)
            setProgress(0)
        }
    }

    const cancel = () => {
        cancelRef.current = true
        setIsProcessing(false)
    }

    const handleReset = () => {
        images.forEach((img) => URL.revokeObjectURL(img.url))
        setImages([])
    }

    const leftControls = (
        <>
            <ControlGroup label="Add Pages">
                <Dropzone
                    onFiles={(files) => void handleFiles(files)}
                    multiple
                    icon="file-text"
                    title="Add more images"
                    hint="PNG, JPEG, WebP"
                />
            </ControlGroup>

            <ControlGroup label="Page Size">
                <SegmentedControl
                    value={pageSize}
                    onChange={(val) => setPageSize(val as 'a4' | 'letter' | 'fit')}
                    options={PAGE_SIZE_OPTIONS}
                />
            </ControlGroup>

            {pageSize !== 'fit' && (
                <>
                    <ControlGroup label="Orientation">
                        <SegmentedControl
                            value={orientation}
                            onChange={(val) => setOrientation(val as 'portrait' | 'landscape')}
                            options={ORIENTATION_OPTIONS}
                        />
                    </ControlGroup>

                    <ControlGroup label="Page Margin" hint="Outer margin around images">
                        <Slider
                            value={margin}
                            min={0}
                            max={30}
                            step={2}
                            unit="mm"
                            onChange={setMargin}
                        />
                    </ControlGroup>
                </>
            )}

            {isProcessing && (
                <ControlGroup label="Rendering PDF">
                    <ProgressBar
                        progress={progress}
                        stageText="Composing vector pages and embedding image streams…"
                        onCancel={cancel}
                    />
                </ControlGroup>
            )}
        </>
    )

    const centerCanvas = images.length === 0 ? (
        <Dropzone
            onFiles={(files) => void handleFiles(files)}
            multiple
            icon="file-text"
            title="Drop images to convert to PDF"
            hint="Supports multiple photos and document scans"
            onTrySample={async () => {
                const s = await createSampleImage()
                void handleFiles([s])
            }}
        />
    ) : (
        <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    Pages Sequence ({images.length})
                </p>
                <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                    Use arrows to reorder pages
                </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                {images.map((img, idx) => (
                    <div
                        key={idx}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: 'var(--spacing-2) var(--spacing-3)',
                            backgroundColor: 'var(--color-bg-surface)',
                            border: '1px solid var(--color-border-default)',
                            borderRadius: 'var(--radius-md)',
                            gap: 'var(--spacing-3)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', minWidth: 0 }}>
                            <span
                                style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: 'var(--color-text-tertiary)',
                                    width: '20px',
                                }}
                            >
                                #{idx + 1}
                            </span>
                            <img
                                src={img.url}
                                alt={img.file.name}
                                style={{
                                    width: '50px',
                                    height: '50px',
                                    objectFit: 'cover',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--color-border-subtle)',
                                }}
                            />
                            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                                <span
                                    style={{
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        color: 'var(--color-text-primary)',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {img.file.name}
                                </span>
                                <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                                    {img.info.width} × {img.info.height} · {formatFileSize(img.file.size)}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}>
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={idx === 0}
                                onClick={() => moveImage(idx, 'up')}
                                aria-label="Move up"
                                icon={<ChevronUp size={14} />}
                            />
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={idx === images.length - 1}
                                onClick={() => moveImage(idx, 'down')}
                                aria-label="Move down"
                                icon={<ChevronDown size={14} />}
                            />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeImage(idx)}
                                aria-label="Remove page"
                                icon={<Trash2 size={14} />}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )

    const bottomBar = (
        <>
            <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                <StatTile label="Total Pages" value={images.length} />
                <StatTile label="Page Size" value={pageSize.toUpperCase()} />
                {pageSize !== 'fit' && (
                    <StatTile
                        label="Orientation"
                        value={orientation === 'portrait' ? 'Portrait' : 'Landscape'}
                    />
                )}
            </div>

            <div className="workspace-action-group">
                <Button variant="ghost" onClick={handleReset} icon={<RotateCcw size={15} />}>
                    Clear All
                </Button>
                <Button
                    variant="primary"
                    onClick={() => void generatePdf()}
                    disabled={images.length === 0 || isProcessing}
                    isLoading={isProcessing}
                    icon={<Download size={15} />}
                >
                    Generate & Download PDF
                </Button>
            </div>
        </>
    )

    return (
        <div className="tool-view-wrapper">
            <ToolHeader
                toolName="Image to PDF"
                toolIcon={<FileText size={18} />}
                toolId="image-to-pdf"
                onBack={onBack}
                onReset={images.length > 0 ? handleReset : undefined}
            />
            <WorkspaceLayout
                leftControls={leftControls}
                centerCanvas={centerCanvas}
                bottomBar={bottomBar}
                hasFile={images.length > 0}
            />
        </div>
    )
}
