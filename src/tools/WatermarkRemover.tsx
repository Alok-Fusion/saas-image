import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, Eraser, RotateCcw, Sparkles, X } from 'lucide-react'
import Button from '../components/Button'
import ControlGroup from '../components/ControlGroup'
import Dropzone from '../components/Dropzone'
import FileChip from '../components/FileChip'
import ProgressBar from '../components/ProgressBar'
import SegmentedControl from '../components/SegmentedControl'
import Slider from '../components/Slider'
import StatTile from '../components/StatTile'
import ToolHeader from '../components/ToolHeader'
import { useToast } from '../components/Toast'
import WorkspaceLayout from '../components/WorkspaceLayout'
import { useObjectUrl } from '../hooks/useObjectUrl'
import {
    buildOutputName,
    canvasToBlob,
    downloadBlob,
    getImageInfo,
    loadImage,
    type ImageInfo,
} from '../utils/imageProcessing'
import { runImageTask, type WorkerTask } from '../utils/imageWorker'
import { createSampleImage } from '../utils/sampleImage'

interface WatermarkRemoverProps {
    onBack: () => void
    initialFile?: File | null
    onProduceFile?: (file: File) => void
}

interface SelectionArea {
    x: number
    y: number
    width: number
    height: number
}

type Method = 'inpaint' | 'blur' | 'pixelate'

const METHOD_OPTIONS = [
    { value: 'inpaint', label: 'Inpaint (AI)' },
    { value: 'blur', label: 'Blur' },
    { value: 'pixelate', label: 'Pixelate' },
]

export default function WatermarkRemover({
    onBack,
    initialFile,
    onProduceFile,
}: WatermarkRemoverProps) {
    const [file, setFile] = useState<File | null>(() => initialFile ?? null)
    const [prevInitialFile, setPrevInitialFile] = useState<File | null>(initialFile ?? null)
    const [originalInfo, setOriginalInfo] = useState<ImageInfo | null>(null)
    const [processedBlob, setProcessedBlob] = useState<Blob | null>(null)
    const [isSelecting, setIsSelecting] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [progress, setProgress] = useState(0)
    const [selection, setSelection] = useState<SelectionArea | null>(null)
    const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null)
    const [removalMethod, setRemovalMethod] = useState<Method>('inpaint')
    const [intensity, setIntensity] = useState(15)
    const containerRef = useRef<HTMLDivElement>(null)
    const taskRef = useRef<WorkerTask<ArrayBuffer> | null>(null)
    const [displayScale, setDisplayScale] = useState(1)
    const preview = useObjectUrl(file)
    const processedUrl = useObjectUrl(processedBlob)
    const { success, error } = useToast()

    if (initialFile && initialFile !== prevInitialFile) {
        setPrevInitialFile(initialFile)
        setFile(initialFile)
        setProcessedBlob(null)
        setSelection(null)
        setProgress(0)
    }

    const handleFile = useCallback((selectedFile: File) => {
        taskRef.current?.cancel()
        setFile(selectedFile)
        setProcessedBlob(null)
        setSelection(null)
        setProgress(0)
    }, [])

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

    useEffect(() => () => taskRef.current?.cancel(), [])

    // Calculate display scale when image dimensions are ready
    useEffect(() => {
        if (containerRef.current && originalInfo) {
            const containerWidth = containerRef.current.clientWidth - 40
            const scale = Math.min(1, containerWidth / originalInfo.width)
            setDisplayScale(scale)
        }
    }, [originalInfo])

    const pointFromEvent = (e: React.PointerEvent) => {
        const rect = containerRef.current?.querySelector('img')?.getBoundingClientRect()
        if (!rect) return null
        return {
            x: Math.max(0, Math.min((e.clientX - rect.left) / displayScale, originalInfo?.width ?? 0)),
            y: Math.max(0, Math.min((e.clientY - rect.top) / displayScale, originalInfo?.height ?? 0)),
        }
    }

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!originalInfo) return
        const point = pointFromEvent(e)
        if (!point) return
        e.currentTarget.setPointerCapture(e.pointerId)
        setIsSelecting(true)
        setSelectionStart(point)
        setSelection({ x: point.x, y: point.y, width: 0, height: 0 })
    }

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isSelecting || !selectionStart) return
        const point = pointFromEvent(e)
        if (!point) return
        setSelection({
            x: Math.min(selectionStart.x, point.x),
            y: Math.min(selectionStart.y, point.y),
            width: Math.abs(point.x - selectionStart.x),
            height: Math.abs(point.y - selectionStart.y),
        })
    }

    const handlePointerUp = () => {
        setIsSelecting(false)
        setSelectionStart(null)
    }

    const removeWatermark = async () => {
        if (!file || !originalInfo || !selection || selection.width < 5 || selection.height < 5) {
            error('Select the watermark area on the image canvas first.')
            return
        }

        taskRef.current?.cancel()
        setIsProcessing(true)
        setProgress(0)

        try {
            const img = await loadImage(file)
            const canvas = document.createElement('canvas')
            canvas.width = originalInfo.width
            canvas.height = originalInfo.height
            const ctx = canvas.getContext('2d')
            if (!ctx) throw new Error('Canvas is not available')

            ctx.drawImage(img, 0, 0)

            const { x, y, width, height } = selection
            const sx = Math.round(x)
            const sy = Math.round(y)
            const sw = Math.max(1, Math.round(width))
            const sh = Math.max(1, Math.round(height))

            if (removalMethod === 'inpaint') {
                const imageData = ctx.getImageData(0, 0, originalInfo.width, originalInfo.height)
                const buffer = imageData.data.buffer as ArrayBuffer
                const task = runImageTask<ArrayBuffer>(
                    {
                        kind: 'inpaint',
                        data: buffer,
                        width: originalInfo.width,
                        height: originalInfo.height,
                        x: sx,
                        y: sy,
                        sw,
                        sh,
                    },
                    { transfer: [buffer], onProgress: setProgress }
                )
                taskRef.current = task
                const result = await task.promise
                ctx.putImageData(
                    new ImageData(new Uint8ClampedArray(result), originalInfo.width, originalInfo.height),
                    0,
                    0
                )
            } else if (removalMethod === 'blur') {
                ctx.filter = `blur(${intensity}px)`
                ctx.drawImage(img, sx, sy, sw, sh, sx, sy, sw, sh)
                ctx.filter = 'none'
            } else {
                const tempCanvas = document.createElement('canvas')
                tempCanvas.width = sw
                tempCanvas.height = sh
                const tempCtx = tempCanvas.getContext('2d')
                if (!tempCtx) throw new Error('Canvas is not available')
                tempCtx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh)
                const smallW = Math.max(1, Math.floor(sw / intensity))
                const smallH = Math.max(1, Math.floor(sh / intensity))
                ctx.imageSmoothingEnabled = false
                ctx.drawImage(tempCanvas, 0, 0, sw, sh, sx, sy, smallW, smallH)
                ctx.drawImage(tempCanvas, 0, 0, smallW, smallH, sx, sy, sw, sh)
                ctx.imageSmoothingEnabled = true
            }

            const outBlob = await canvasToBlob(canvas, 'image/png')
            setProcessedBlob(outBlob)
            success('Watermark removed successfully')
        } catch (err) {
            if (!(err instanceof Error && err.name === 'AbortError')) {
                error(err instanceof Error ? err.message : 'Could not remove the watermark')
            }
        } finally {
            setIsProcessing(false)
            taskRef.current = null
        }
    }

    const cancel = () => {
        taskRef.current?.cancel()
    }

    const handleDownload = () => {
        if (!processedBlob || !file) return
        const outName = buildOutputName(file.name, 'cleaned', 'png')
        downloadBlob(processedBlob, outName)
        if (onProduceFile) {
            onProduceFile(new File([processedBlob], outName, { type: 'image/png' }))
        }
    }

    const handleReset = () => {
        taskRef.current?.cancel()
        setFile(null)
        setOriginalInfo(null)
        setProcessedBlob(null)
        setSelection(null)
        setProgress(0)
    }

    const clearSelection = () => setSelection(null)

    const hasSelection = !!(selection && selection.width >= 5 && selection.height >= 5)

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
                label="Removal Method"
                hint="Inpaint reconstructs pixels from surroundings"
            >
                <SegmentedControl
                    value={removalMethod}
                    onChange={(val) => setRemovalMethod(val as Method)}
                    options={METHOD_OPTIONS}
                />
            </ControlGroup>

            {removalMethod !== 'inpaint' && (
                <ControlGroup
                    label="Filter Intensity"
                    hint="Higher values create stronger concealment"
                >
                    <Slider
                        value={intensity}
                        min={5}
                        max={30}
                        step={1}
                        unit="px"
                        onChange={setIntensity}
                    />
                </ControlGroup>
            )}

            <ControlGroup
                label="Selection Instructions"
                hint="Click & drag a rectangle directly over the watermark on the image"
            >
                {hasSelection ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                            {Math.round(selection.width)} × {Math.round(selection.height)} px selected
                        </span>
                        <Button variant="ghost" size="sm" onClick={clearSelection} icon={<X size={13} />}>
                            Clear
                        </Button>
                    </div>
                ) : (
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                        No area selected yet.
                    </p>
                )}
            </ControlGroup>

            {isProcessing && removalMethod === 'inpaint' && (
                <ControlGroup label="Inpaint Status">
                    <ProgressBar
                        progress={progress}
                        stageText="Reconstructing texture via web worker…"
                        onCancel={cancel}
                    />
                </ControlGroup>
            )}
        </>
    )

    const centerCanvas = !file ? (
        <Dropzone
            onFiles={(files) => void handleFile(files[0])}
            icon="crop"
            title="Drop image to remove watermark"
            hint="Supports PNG, JPEG, WebP"
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
                cursor: 'crosshair',
                userSelect: 'none',
                touchAction: 'none',
                maxWidth: '100%',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            <img
                src={processedUrl || preview || ''}
                alt="Preview"
                style={{
                    display: 'block',
                    maxWidth: '100%',
                    maxHeight: '70vh',
                    objectFit: 'contain',
                    borderRadius: 'var(--radius-sm)',
                    pointerEvents: 'none',
                }}
                draggable={false}
            />

            {/* Selection marquee */}
            {selection && selection.width > 0 && selection.height > 0 && (
                <div
                    style={{
                        position: 'absolute',
                        left: selection.x * displayScale,
                        top: selection.y * displayScale,
                        width: selection.width * displayScale,
                        height: selection.height * displayScale,
                        border: '2px dashed var(--color-accent)',
                        backgroundColor: 'var(--color-accent-subtle)',
                        pointerEvents: 'none',
                        borderRadius: '2px',
                    }}
                />
            )}
        </div>
    )

    const bottomBar = (
        <>
            <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                <StatTile
                    label="Method"
                    value={removalMethod === 'inpaint' ? 'Inpaint' : removalMethod === 'blur' ? 'Blur' : 'Pixelate'}
                />
                {hasSelection && (
                    <StatTile
                        label="Selected"
                        value={`${Math.round(selection.width)} × ${Math.round(selection.height)} px`}
                    />
                )}
            </div>

            <div className="workspace-action-group">
                <Button variant="ghost" onClick={handleReset} icon={<RotateCcw size={15} />}>
                    Reset
                </Button>
                <Button
                    variant="secondary"
                    onClick={() => void removeWatermark()}
                    disabled={!hasSelection || isProcessing}
                    isLoading={isProcessing}
                    icon={<Sparkles size={15} />}
                >
                    {isProcessing ? 'Removing…' : 'Remove Watermark'}
                </Button>
                {processedBlob && (
                    <Button
                        variant="primary"
                        onClick={handleDownload}
                        icon={<Download size={15} />}
                    >
                        Download Result
                    </Button>
                )}
            </div>
        </>
    )

    return (
        <div className="tool-view-wrapper">
            <ToolHeader
                toolName="Watermark Remover"
                toolIcon={<Eraser size={18} />}
                toolId="watermark-remover"
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
