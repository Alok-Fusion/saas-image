import { useCallback, useEffect, useState } from 'react'
import { Download, FlipHorizontal, FlipVertical, RotateCcw, RotateCw } from 'lucide-react'
import Button from '../components/Button'
import ControlGroup from '../components/ControlGroup'
import Dropzone from '../components/Dropzone'
import FileChip from '../components/FileChip'
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
    getOutputMime,
    loadImage,
    type ImageInfo,
} from '../utils/imageProcessing'
import { createSampleImage } from '../utils/sampleImage'

interface ImageRotatorProps {
    onBack: () => void
    initialFile?: File | null
    onProduceFile?: (file: File) => void
}

export default function ImageRotator({
    onBack,
    initialFile,
    onProduceFile,
}: ImageRotatorProps) {
    const [file, setFile] = useState<File | null>(() => initialFile ?? null)
    const [prevInitialFile, setPrevInitialFile] = useState<File | null>(initialFile ?? null)
    const [originalInfo, setOriginalInfo] = useState<ImageInfo | null>(null)
    const [rotation, setRotation] = useState(0)
    const [flipH, setFlipH] = useState(false)
    const [flipV, setFlipV] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const preview = useObjectUrl(file)
    const { error, success } = useToast()

    if (initialFile && initialFile !== prevInitialFile) {
        setPrevInitialFile(initialFile)
        setFile(initialFile)
        setRotation(0)
        setFlipH(false)
        setFlipV(false)
    }

    const handleFile = useCallback((selectedFile: File) => {
        setFile(selectedFile)
        setRotation(0)
        setFlipH(false)
        setFlipV(false)
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

    const rotate = (degrees: number) => {
        setRotation((prev) => (prev + degrees + 360) % 360)
    }

    const handleDownload = async () => {
        if (!file || !originalInfo || isProcessing) return
        setIsProcessing(true)
        try {
            const img = await loadImage(file)
            const radians = (rotation * Math.PI) / 180
            const cos = Math.abs(Math.cos(radians))
            const sin = Math.abs(Math.sin(radians))
            const width = originalInfo.width
            const height = originalInfo.height
            const canvas = document.createElement('canvas')
            canvas.width = Math.max(1, Math.round(width * cos + height * sin))
            canvas.height = Math.max(1, Math.round(width * sin + height * cos))
            const ctx = canvas.getContext('2d')
            if (!ctx) throw new Error('Canvas is not available')

            const mime = getOutputMime(file.type)
            if (mime === 'image/jpeg') {
                ctx.fillStyle = '#ffffff'
                ctx.fillRect(0, 0, canvas.width, canvas.height)
            }

            ctx.translate(canvas.width / 2, canvas.height / 2)
            ctx.rotate(radians)
            ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)
            ctx.drawImage(img, -width / 2, -height / 2)

            const blob = await canvasToBlob(canvas, mime, 0.92)
            const extension = mime === 'image/jpeg' ? 'jpg' : mime === 'image/webp' ? 'webp' : 'png'
            const outName = buildOutputName(file.name, 'rotated', extension)
            downloadBlob(blob, outName)

            if (onProduceFile) {
                onProduceFile(new File([blob], outName, { type: mime }))
            }
            success('Transformed image exported successfully')
        } catch (err) {
            error(err instanceof Error ? err.message : 'Could not transform the image')
        } finally {
            setIsProcessing(false)
        }
    }

    const resetTransforms = () => {
        setRotation(0)
        setFlipH(false)
        setFlipV(false)
    }

    const handleReset = () => {
        setFile(null)
        setOriginalInfo(null)
        resetTransforms()
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

            <ControlGroup label="Step Rotation" hint="Rotate clockwise or counter-clockwise by 90°">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-1)' }}>
                    <Button variant="secondary" size="sm" onClick={() => rotate(-90)} icon={<RotateCcw size={13} />}>
                        -90°
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => rotate(90)} icon={<RotateCw size={13} />}>
                        +90°
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => rotate(180)}>
                        180°
                    </Button>
                </div>
            </ControlGroup>

            <ControlGroup label="Continuous Angle">
                <Slider
                    label="Angle"
                    value={rotation}
                    min={0}
                    max={360}
                    step={1}
                    unit="°"
                    onChange={setRotation}
                />
            </ControlGroup>

            <ControlGroup label="Mirror & Invert">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-2)' }}>
                    <Button
                        variant={flipH ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => setFlipH(!flipH)}
                        icon={<FlipHorizontal size={14} />}
                    >
                        Flip Horizontal
                    </Button>
                    <Button
                        variant={flipV ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => setFlipV(!flipV)}
                        icon={<FlipVertical size={14} />}
                    >
                        Flip Vertical
                    </Button>
                </div>
            </ControlGroup>

            <Button variant="ghost" size="sm" onClick={resetTransforms} icon={<RotateCcw size={13} />}>
                Reset Transformations
            </Button>
        </>
    )

    const centerCanvas = !file ? (
        <Dropzone
            onFiles={(files) => handleFile(files[0])}
            icon="rotate-cw"
            title="Drop image to rotate or flip"
            hint="Lossless canvas transformation with angle sliders and mirror controls"
            onTrySample={async () => {
                const s = await createSampleImage()
                handleFile(s)
            }}
        />
    ) : (
        <div style={{ textAlign: 'center', maxWidth: '800px', width: '100%', padding: 'var(--spacing-4)' }}>
            <img
                src={preview || undefined}
                alt="Rotated preview"
                style={{
                    maxHeight: '65vh',
                    maxWidth: '100%',
                    objectFit: 'contain',
                    transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                    transition: 'transform 0.25s ease-out',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--shadow-md)',
                }}
            />
        </div>
    )

    const bottomBar = (
        <>
            <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                <StatTile label="Angle" value={`${rotation}°`} />
                <StatTile
                    label="Flip"
                    value={
                        flipH && flipV ? 'Both (H+V)' : flipH ? 'Horizontal' : flipV ? 'Vertical' : 'None'
                    }
                />
            </div>

            <div className="workspace-action-group">
                <Button variant="ghost" onClick={handleReset} icon={<RotateCcw size={15} />}>
                    Reset
                </Button>
                <Button
                    variant="primary"
                    onClick={() => void handleDownload()}
                    isLoading={isProcessing}
                    icon={<Download size={15} />}
                >
                    Download Transformed Image
                </Button>
            </div>
        </>
    )

    return (
        <div className="tool-view-wrapper">
            <ToolHeader
                toolName="Image Rotator & Flipper"
                toolIcon={<RotateCw size={18} />}
                toolId="image-rotator"
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
