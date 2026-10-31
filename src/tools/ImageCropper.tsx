import { useCallback, useEffect, useRef, useState } from 'react'
import { Crop, Download, RotateCcw } from 'lucide-react'
import Button from '../components/Button'
import ControlGroup from '../components/ControlGroup'
import Dropzone from '../components/Dropzone'
import FileChip from '../components/FileChip'
import StatTile from '../components/StatTile'
import ToolHeader from '../components/ToolHeader'
import { useToast } from '../components/Toast'
import WorkspaceLayout from '../components/WorkspaceLayout'
import { useObjectUrl } from '../hooks/useObjectUrl'
import {
    buildOutputName,
    canvasToBlob,
    downloadBlob,
    getExtension,
    getImageInfo,
    getOutputMime,
    ImageInfo,
    loadImage,
} from '../utils/imageProcessing'
import { createSampleImage } from '../utils/sampleImage'

interface ImageCropperProps {
    onBack: () => void
    initialFile?: File | null
    onProduceFile?: (file: File) => void
}

interface CropArea {
    x: number
    y: number
    width: number
    height: number
}

const ASPECT_RATIOS = [
    { label: 'Free', value: null },
    { label: '1:1', value: 1 },
    { label: '16:9', value: 16 / 9 },
    { label: '9:16', value: 9 / 16 },
    { label: '4:3', value: 4 / 3 },
    { label: '3:4', value: 3 / 4 },
    { label: '3:2', value: 3 / 2 },
    { label: '2:3', value: 2 / 3 },
]

const MIN_SIZE = 5

export default function ImageCropper({
    onBack,
    initialFile,
    onProduceFile,
}: ImageCropperProps) {
    const [file, setFile] = useState<File | null>(() => initialFile ?? null)
    const [prevInitialFile, setPrevInitialFile] = useState<File | null>(initialFile ?? null)
    const [originalInfo, setOriginalInfo] = useState<ImageInfo | null>(null)
    const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 100, height: 100 })
    const [aspectRatio, setAspectRatio] = useState<number | null>(null)
    const [dragType, setDragType] = useState<'move' | 'resize' | null>(null)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const [isProcessing, setIsProcessing] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const imgRef = useRef<HTMLImageElement>(null)
    const preview = useObjectUrl(file)
    const { success, error } = useToast()

    if (initialFile && initialFile !== prevInitialFile) {
        setPrevInitialFile(initialFile)
        setFile(initialFile)
        setAspectRatio(null)
        setCropArea({ x: 0, y: 0, width: 100, height: 100 })
    }

    const handleFile = useCallback((selectedFile: File) => {
        setFile(selectedFile)
        setAspectRatio(null)
        setCropArea({ x: 0, y: 0, width: 100, height: 100 })
    }, [])

    useEffect(() => {
        if (!file) return
        let cancelled = false
        void getImageInfo(file)
            .then((info) => {
                if (cancelled) return
                setOriginalInfo(info)
            })
            .catch((err) => {
                if (cancelled) return
                setOriginalInfo(null)
                error(err instanceof Error ? err.message : 'Could not read image info')
            })
        return () => {
            cancelled = true
        }
    }, [file, error])

    const handlePointerDown = (e: React.PointerEvent, type: 'move' | 'resize') => {
        e.preventDefault()
        e.stopPropagation()
        e.currentTarget.setPointerCapture(e.pointerId)
        setDragType(type)
        setDragStart({ x: e.clientX, y: e.clientY })
    }

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!dragType) return
        const rect = imgRef.current?.getBoundingClientRect()
        if (!rect) return

        const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100
        const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100
        const imgAspect = originalInfo ? originalInfo.width / originalInfo.height : 1

        setCropArea((prev) => {
            if (dragType === 'move') {
                return {
                    ...prev,
                    x: Math.max(0, Math.min(100 - prev.width, prev.x + deltaX)),
                    y: Math.max(0, Math.min(100 - prev.height, prev.y + deltaY)),
                }
            }

            let newWidth = Math.max(MIN_SIZE, Math.min(100 - prev.x, prev.width + deltaX))
            let newHeight = Math.max(MIN_SIZE, Math.min(100 - prev.y, prev.height + deltaY))

            if (aspectRatio) {
                newWidth = Math.min(newWidth, ((100 - prev.y) * aspectRatio) / imgAspect)
                newHeight = (newWidth * imgAspect) / aspectRatio
            }

            if (prev.x + newWidth > 100) {
                newWidth = 100 - prev.x
                if (aspectRatio) newHeight = (newWidth * imgAspect) / aspectRatio
            }
            if (prev.y + newHeight > 100) {
                newHeight = 100 - prev.y
                if (aspectRatio) newWidth = (newHeight * aspectRatio) / imgAspect
            }

            return { ...prev, width: newWidth, height: newHeight }
        })

        setDragStart({ x: e.clientX, y: e.clientY })
    }

    const handlePointerUp = () => setDragType(null)

    const applyAspectRatio = (ratio: number | null) => {
        setAspectRatio(ratio)
        if (!ratio || !originalInfo) return

        const imgAspect = originalInfo.width / originalInfo.height
        setCropArea((prev) => {
            let width = prev.width
            let height = (width * imgAspect) / ratio

            if (prev.y + height > 100) {
                height = 100 - prev.y
                width = (height * ratio) / imgAspect
            }
            if (prev.x + width > 100) {
                width = 100 - prev.x
                height = (width * imgAspect) / ratio
            }

            return {
                x: Math.min(prev.x, Math.max(0, 100 - width)),
                y: Math.min(prev.y, Math.max(0, 100 - height)),
                width,
                height,
            }
        })
    }

    const handleCrop = async () => {
        if (!file || !originalInfo) return
        setIsProcessing(true)

        try {
            const img = await loadImage(file)
            const sourceX = Math.round((cropArea.x / 100) * originalInfo.width)
            const sourceY = Math.round((cropArea.y / 100) * originalInfo.height)
            const sourceWidth = Math.max(1, Math.round((cropArea.width / 100) * originalInfo.width))
            const sourceHeight = Math.max(1, Math.round((cropArea.height / 100) * originalInfo.height))

            const canvas = document.createElement('canvas')
            canvas.width = sourceWidth
            canvas.height = sourceHeight

            const ctx = canvas.getContext('2d')
            if (!ctx) throw new Error('Canvas is not available')

            const format = getOutputMime(file.type)
            if (format === 'image/jpeg') {
                ctx.fillStyle = '#ffffff'
                ctx.fillRect(0, 0, canvas.width, canvas.height)
            }

            ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight)
            const blob = await canvasToBlob(canvas, format, 0.92)
            const outName = buildOutputName(file.name, 'cropped', getExtension(format))
            downloadBlob(blob, outName)

            if (onProduceFile) {
                onProduceFile(new File([blob], outName, { type: format }))
            }
            success('Cropped image exported successfully')
        } catch (err) {
            error(err instanceof Error ? err.message : 'Could not crop the image')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleReset = () => {
        setFile(null)
        setOriginalInfo(null)
        setCropArea({ x: 0, y: 0, width: 100, height: 100 })
        setAspectRatio(null)
    }

    const cropDimensions = originalInfo
        ? {
              width: Math.max(1, Math.round((cropArea.width / 100) * originalInfo.width)),
              height: Math.max(1, Math.round((cropArea.height / 100) * originalInfo.height)),
          }
        : null

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

            <ControlGroup
                label="Aspect Ratio"
                hint="Locks width/height proportion during drag"
            >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--spacing-1)' }}>
                    {ASPECT_RATIOS.map(({ label, value }) => (
                        <Button
                            key={label}
                            variant={aspectRatio === value ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => applyAspectRatio(value)}
                        >
                            {label}
                        </Button>
                    ))}
                </div>
            </ControlGroup>

            {cropDimensions && (
                <ControlGroup label="Crop Details">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-2)' }}>
                        <div className="stat-tile">
                            <span className="stat-tile-label">Width</span>
                            <span className="stat-tile-value">{cropDimensions.width} px</span>
                        </div>
                        <div className="stat-tile">
                            <span className="stat-tile-label">Height</span>
                            <span className="stat-tile-value">{cropDimensions.height} px</span>
                        </div>
                    </div>
                </ControlGroup>
            )}
        </>
    )

    const centerCanvas = !file ? (
        <Dropzone
            onFiles={(files) => void handleFile(files[0])}
            icon="crop"
            title="Drop image to crop"
            hint="Supports PNG, JPEG, and WebP up to 50MB"
            onTrySample={async () => {
                const sample = await createSampleImage()
                void handleFile(sample)
            }}
        />
    ) : (
        <div
            ref={containerRef}
            style={{
                position: 'relative',
                display: 'inline-block',
                maxWidth: '100%',
                maxHeight: '100%',
                cursor: dragType ? 'grabbing' : 'default',
                userSelect: 'none',
                touchAction: 'none',
            }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
        >
            <img
                ref={imgRef}
                src={preview || undefined}
                alt="Source preview"
                style={{
                    display: 'block',
                    maxWidth: '100%',
                    maxHeight: '70vh',
                    objectFit: 'contain',
                    borderRadius: 'var(--radius-sm)',
                }}
                draggable={false}
            />

            {/* Crop Overlay Box */}
            <div
                className="cropper-overlay"
                style={{
                    left: `${cropArea.x}%`,
                    top: `${cropArea.y}%`,
                    width: `${cropArea.width}%`,
                    height: `${cropArea.height}%`,
                }}
                onPointerDown={(e) => handlePointerDown(e, 'move')}
            >
                <div className="cropper-grid-thirds" />

                {/* Resize Handle */}
                <div
                    className="cropper-handle"
                    style={{
                        bottom: -6,
                        right: -6,
                        cursor: 'se-resize',
                    }}
                    onPointerDown={(e) => handlePointerDown(e, 'resize')}
                />
            </div>
        </div>
    )

    const bottomBar = (
        <>
            {cropDimensions && (
                <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                    <StatTile
                        label="Output Size"
                        value={`${cropDimensions.width} × ${cropDimensions.height} px`}
                    />
                    <StatTile
                        label="Ratio"
                        value={aspectRatio ? ASPECT_RATIOS.find((r) => r.value === aspectRatio)?.label || 'Custom' : 'Free'}
                    />
                </div>
            )}
            <div className="workspace-action-group">
                <Button
                    variant="ghost"
                    onClick={handleReset}
                    icon={<RotateCcw size={15} />}
                >
                    Reset
                </Button>
                <Button
                    variant="primary"
                    onClick={() => void handleCrop()}
                    isLoading={isProcessing}
                    icon={<Download size={15} />}
                >
                    Crop & Download
                </Button>
            </div>
        </>
    )

    return (
        <div className="tool-view-wrapper">
            <ToolHeader
                toolName="Image Cropper"
                toolIcon={<Crop size={18} />}
                toolId="cropper"
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
