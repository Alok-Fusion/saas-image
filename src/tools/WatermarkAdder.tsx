import { useCallback, useEffect, useState } from 'react'
import { Download, RotateCcw, Sparkles, Stamp } from 'lucide-react'
import Button from '../components/Button'
import CompareView from '../components/CompareView'
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

interface WatermarkAdderProps {
    onBack: () => void
    initialFile?: File | null
    onProduceFile?: (file: File) => void
}

type Position = 'top-left' | 'top-right' | 'center' | 'bottom-left' | 'bottom-right'

const POSITIONS: { id: Position; label: string }[] = [
    { id: 'top-left', label: 'Top-Left' },
    { id: 'top-right', label: 'Top-Right' },
    { id: 'center', label: 'Center' },
    { id: 'bottom-left', label: 'Bottom-Left' },
    { id: 'bottom-right', label: 'Bottom-Right' },
]

export default function WatermarkAdder({
    onBack,
    initialFile,
    onProduceFile,
}: WatermarkAdderProps) {
    const [file, setFile] = useState<File | null>(() => initialFile ?? null)
    const [prevInitialFile, setPrevInitialFile] = useState<File | null>(initialFile ?? null)
    const [originalInfo, setOriginalInfo] = useState<ImageInfo | null>(null)
    const [watermarkText, setWatermarkText] = useState('© ImageKit Pro')
    const [watermarkPosition, setWatermarkPosition] = useState<Position>('bottom-right')
    const [watermarkSize, setWatermarkSize] = useState(36)
    const [watermarkOpacity, setWatermarkOpacity] = useState(70)
    const [watermarkColor, setWatermarkColor] = useState('#ffffff')
    const [processedBlob, setProcessedBlob] = useState<Blob | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const preview = useObjectUrl(file)
    const processedUrl = useObjectUrl(processedBlob)
    const { error, success } = useToast()

    if (initialFile && initialFile !== prevInitialFile) {
        setPrevInitialFile(initialFile)
        setFile(initialFile)
        setProcessedBlob(null)
    }

    const handleFile = useCallback((selectedFile: File) => {
        setFile(selectedFile)
        setProcessedBlob(null)
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

    const applyWatermark = useCallback(async () => {
        if (!file || !originalInfo) return
        setIsProcessing(true)
        try {
            const img = await loadImage(file)
            const canvas = document.createElement('canvas')
            canvas.width = originalInfo.width
            canvas.height = originalInfo.height
            const ctx = canvas.getContext('2d')
            if (!ctx) return

            ctx.drawImage(img, 0, 0)
            ctx.font = `bold ${watermarkSize}px Geist, Inter, sans-serif`
            ctx.fillStyle = watermarkColor
            ctx.globalAlpha = watermarkOpacity / 100
            const padding = Math.max(20, Math.round(originalInfo.width * 0.03))
            let x = 0
            let y = 0

            switch (watermarkPosition) {
                case 'top-left':
                    x = padding
                    y = padding + watermarkSize
                    ctx.textAlign = 'left'
                    break
                case 'top-right':
                    x = originalInfo.width - padding
                    y = padding + watermarkSize
                    ctx.textAlign = 'right'
                    break
                case 'bottom-left':
                    x = padding
                    y = originalInfo.height - padding
                    ctx.textAlign = 'left'
                    break
                case 'bottom-right':
                    x = originalInfo.width - padding
                    y = originalInfo.height - padding
                    ctx.textAlign = 'right'
                    break
                case 'center':
                    x = originalInfo.width / 2
                    y = originalInfo.height / 2
                    ctx.textAlign = 'center'
                    break
            }

            ctx.shadowColor = 'rgba(0,0,0,0.6)'
            ctx.shadowBlur = 6
            ctx.fillText(watermarkText, x, y)

            const mime = getOutputMime(file.type)
            const blob = await canvasToBlob(canvas, mime, 0.92)
            setProcessedBlob(blob)
            success('Watermark applied')
        } catch (err) {
            error(err instanceof Error ? err.message : 'Could not apply the watermark')
        } finally {
            setIsProcessing(false)
        }
    }, [file, originalInfo, watermarkSize, watermarkColor, watermarkOpacity, watermarkPosition, watermarkText, error, success])

    const handleDownload = () => {
        if (!processedBlob || !file) return
        const mime = getOutputMime(file.type)
        const extension = mime === 'image/jpeg' ? 'jpg' : mime === 'image/webp' ? 'webp' : 'png'
        const outName = buildOutputName(file.name, 'watermarked', extension)
        downloadBlob(processedBlob, outName)
        if (onProduceFile) {
            onProduceFile(new File([processedBlob], outName, { type: mime }))
        }
    }

    const handleReset = () => {
        setFile(null)
        setOriginalInfo(null)
        setProcessedBlob(null)
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

            <ControlGroup label="Watermark Text">
                <input
                    type="text"
                    className="control-input"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    placeholder="© Your Name / Brand"
                />
            </ControlGroup>

            <ControlGroup label="Position" hint="Placement on the exported canvas">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-1)' }}>
                    {POSITIONS.map((p) => (
                        <Button
                            key={p.id}
                            variant={watermarkPosition === p.id ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => setWatermarkPosition(p.id)}
                        >
                            {p.label}
                        </Button>
                    ))}
                </div>
            </ControlGroup>

            <ControlGroup label="Typography Size">
                <Slider
                    label="Font Size"
                    value={watermarkSize}
                    min={14}
                    max={120}
                    step={2}
                    unit="px"
                    onChange={setWatermarkSize}
                />
            </ControlGroup>

            <ControlGroup label="Opacity">
                <Slider
                    label="Opacity"
                    value={watermarkOpacity}
                    min={10}
                    max={100}
                    step={5}
                    unit="%"
                    onChange={setWatermarkOpacity}
                />
            </ControlGroup>

            <ControlGroup label="Text Color">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {['#ffffff', '#000000', '#f43f5e', '#6366f1'].map((c) => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => setWatermarkColor(c)}
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: c,
                                border: watermarkColor === c ? '2px solid var(--color-accent)' : '1px solid var(--color-border-default)',
                                cursor: 'pointer',
                            }}
                        />
                    ))}
                    <input
                        type="color"
                        value={watermarkColor}
                        onChange={(e) => setWatermarkColor(e.target.value)}
                        style={{
                            width: 28,
                            height: 28,
                            padding: 0,
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--color-border-default)',
                            cursor: 'pointer',
                            backgroundColor: 'transparent',
                        }}
                    />
                </div>
            </ControlGroup>
        </>
    )

    const centerCanvas = !file ? (
        <Dropzone
            onFiles={(files) => handleFile(files[0])}
            icon="stamp"
            title="Drop image to add watermark"
            hint="Stamp copyright or brand watermark onto your photos"
            onTrySample={async () => {
                const s = await createSampleImage()
                handleFile(s)
            }}
        />
    ) : (
        <div style={{ width: '100%', maxWidth: '850px', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            {preview && processedUrl ? (
                <CompareView
                    beforeSrc={preview}
                    afterSrc={processedUrl}
                    beforeLabel="Original"
                    afterLabel="Watermarked"
                />
            ) : preview ? (
                <div style={{ textAlign: 'center' }}>
                    <img
                        src={preview}
                        alt="Source"
                        style={{
                            maxHeight: '65vh',
                            maxWidth: '100%',
                            objectFit: 'contain',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border-subtle)',
                        }}
                    />
                    <p style={{ marginTop: 'var(--spacing-3)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                        Click "Apply Watermark" to render preview
                    </p>
                </div>
            ) : null}
        </div>
    )

    const bottomBar = (
        <>
            <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                <StatTile label="Position" value={watermarkPosition} />
                <StatTile label="Size" value={`${watermarkSize}px`} />
            </div>

            <div className="workspace-action-group">
                <Button variant="ghost" onClick={handleReset} icon={<RotateCcw size={15} />}>
                    Reset
                </Button>
                <Button
                    variant="secondary"
                    onClick={() => void applyWatermark()}
                    isLoading={isProcessing}
                    icon={<Sparkles size={15} />}
                >
                    Apply Watermark
                </Button>
                {processedBlob && (
                    <Button
                        variant="primary"
                        onClick={handleDownload}
                        icon={<Download size={15} />}
                    >
                        Download Watermarked Image
                    </Button>
                )}
            </div>
        </>
    )

    return (
        <div className="tool-view-wrapper">
            <ToolHeader
                toolName="Watermark Adder"
                toolIcon={<Stamp size={18} />}
                toolId="watermark-adder"
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
