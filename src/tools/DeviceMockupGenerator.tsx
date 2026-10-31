import { useCallback, useEffect, useState } from 'react'
import { Download, Globe, Laptop, Monitor, RotateCcw, Smartphone, Sparkles, Tablet } from 'lucide-react'
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
    getImageInfo,
    loadImage,
    type ImageInfo,
} from '../utils/imageProcessing'
import { createSampleImage } from '../utils/sampleImage'

interface DeviceMockupGeneratorProps {
    onBack: () => void
    initialFile?: File | null
    onProduceFile?: (file: File) => void
}

interface DeviceFrame {
    id: string
    name: string
    type: 'phone' | 'laptop' | 'desktop' | 'tablet' | 'browser'
    width: number
    height: number
    screenX: number
    screenY: number
    screenWidth: number
    screenHeight: number
    borderRadius: number
    frameColor: string
    bezelWidth: number
}

const DEVICE_FRAMES: DeviceFrame[] = [
    {
        id: 'iphone-14',
        name: 'iPhone 14 Pro',
        type: 'phone',
        width: 430,
        height: 880,
        screenX: 15,
        screenY: 15,
        screenWidth: 400,
        screenHeight: 850,
        borderRadius: 55,
        frameColor: '#1a1a1a',
        bezelWidth: 15,
    },
    {
        id: 'iphone-se',
        name: 'iPhone SE',
        type: 'phone',
        width: 375,
        height: 750,
        screenX: 15,
        screenY: 80,
        screenWidth: 345,
        screenHeight: 590,
        borderRadius: 40,
        frameColor: '#2a2a2a',
        bezelWidth: 15,
    },
    {
        id: 'android',
        name: 'Android Phone',
        type: 'phone',
        width: 412,
        height: 870,
        screenX: 12,
        screenY: 12,
        screenWidth: 388,
        screenHeight: 846,
        borderRadius: 35,
        frameColor: '#1a1a1a',
        bezelWidth: 12,
    },
    {
        id: 'macbook',
        name: 'MacBook Pro',
        type: 'laptop',
        width: 1200,
        height: 780,
        screenX: 95,
        screenY: 35,
        screenWidth: 1010,
        screenHeight: 630,
        borderRadius: 15,
        frameColor: '#c0c0c0',
        bezelWidth: 35,
    },
    {
        id: 'imac',
        name: 'iMac 24"',
        type: 'desktop',
        width: 1100,
        height: 900,
        screenX: 50,
        screenY: 50,
        screenWidth: 1000,
        screenHeight: 625,
        borderRadius: 20,
        frameColor: '#e8e8e8',
        bezelWidth: 50,
    },
    {
        id: 'ipad',
        name: 'iPad Pro',
        type: 'tablet',
        width: 840,
        height: 1120,
        screenX: 20,
        screenY: 20,
        screenWidth: 800,
        screenHeight: 1080,
        borderRadius: 35,
        frameColor: '#2a2a2a',
        bezelWidth: 20,
    },
    {
        id: 'browser',
        name: 'Browser Window',
        type: 'browser',
        width: 1200,
        height: 800,
        screenX: 0,
        screenY: 60,
        screenWidth: 1200,
        screenHeight: 740,
        borderRadius: 12,
        frameColor: '#2d2d2d',
        bezelWidth: 0,
    },
]

const BG_COLORS = ['#4f46e5', '#6366f1', '#0ea5e9', '#10b981', '#f43f5e', '#18181b', '#f4f4f5']

function getDeviceIcon(type: DeviceFrame['type']) {
    switch (type) {
        case 'phone': return <Smartphone size={16} />
        case 'laptop': return <Laptop size={16} />
        case 'desktop': return <Monitor size={16} />
        case 'tablet': return <Tablet size={16} />
        case 'browser': return <Globe size={16} />
    }
}

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
}

const adjustColor = (hex: string, amount: number): string => {
    const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex
    const num = parseInt(cleanHex.length === 3 ? cleanHex.split('').map((c) => c + c).join('') : cleanHex, 16)
    if (isNaN(num)) return hex
    const r = Math.min(255, Math.max(0, (num >> 16) + amount))
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount))
    const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount))
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

export default function DeviceMockupGenerator({
    onBack,
    initialFile,
    onProduceFile,
}: DeviceMockupGeneratorProps) {
    const [file, setFile] = useState<File | null>(() => initialFile ?? null)
    const [prevInitialFile, setPrevInitialFile] = useState<File | null>(initialFile ?? null)
    const [originalInfo, setOriginalInfo] = useState<ImageInfo | null>(null)
    const [selectedDevice, setSelectedDevice] = useState<DeviceFrame>(DEVICE_FRAMES[0])
    const [mockupBlob, setMockupBlob] = useState<Blob | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [backgroundColor, setBackgroundColor] = useState('#4f46e5')
    const preview = useObjectUrl(file)
    const mockupUrl = useObjectUrl(mockupBlob)
    const { error, success } = useToast()

    if (initialFile && initialFile !== prevInitialFile) {
        setPrevInitialFile(initialFile)
        setFile(initialFile)
        setMockupBlob(null)
    }

    const handleFile = useCallback((selectedFile: File) => {
        setFile(selectedFile)
        setMockupBlob(null)
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

    const generateMockup = async (imageFile: File, device: DeviceFrame, bgColor: string): Promise<Blob> => {
        const img = await loadImage(imageFile)
        const imgWidth = img.naturalWidth || img.width
        const imgHeight = img.naturalHeight || img.height
        const padding = 80
        const canvas = document.createElement('canvas')
        canvas.width = device.width + padding * 2
        canvas.height = device.height + padding * 2

        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Canvas is not available')

        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
        gradient.addColorStop(0, bgColor)
        gradient.addColorStop(1, adjustColor(bgColor, -30))
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        ctx.shadowColor = 'rgba(0, 0, 0, 0.35)'
        ctx.shadowBlur = 40
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 20

        if (device.id === 'browser') {
            ctx.fillStyle = device.frameColor
            roundRect(ctx, padding, padding, device.width, device.height, device.borderRadius)
            ctx.fill()

            ctx.fillStyle = '#222226'
            ctx.fillRect(padding, padding, device.width, 60)

            const dotY = padding + 25
            ctx.fillStyle = '#ff5f57'
            ctx.beginPath()
            ctx.arc(padding + 20, dotY, 6, 0, Math.PI * 2)
            ctx.fill()

            ctx.fillStyle = '#ffbd2e'
            ctx.beginPath()
            ctx.arc(padding + 42, dotY, 6, 0, Math.PI * 2)
            ctx.fill()

            ctx.fillStyle = '#28c940'
            ctx.beginPath()
            ctx.arc(padding + 64, dotY, 6, 0, Math.PI * 2)
            ctx.fill()

            ctx.fillStyle = '#121216'
            roundRect(ctx, padding + 90, padding + 15, device.width - 110, 30, 6)
            ctx.fill()
        } else {
            ctx.fillStyle = device.frameColor
            roundRect(ctx, padding, padding, device.width, device.height, device.borderRadius)
            ctx.fill()
        }

        ctx.shadowColor = 'transparent'

        ctx.fillStyle = '#000000'
        roundRect(
            ctx,
            padding + device.screenX,
            padding + device.screenY,
            device.screenWidth,
            device.screenHeight,
            Math.max(4, device.borderRadius - device.bezelWidth)
        )
        ctx.fill()

        ctx.save()
        roundRect(
            ctx,
            padding + device.screenX,
            padding + device.screenY,
            device.screenWidth,
            device.screenHeight,
            Math.max(4, device.borderRadius - device.bezelWidth)
        )
        ctx.clip()

        const scale = Math.max(device.screenWidth / imgWidth, device.screenHeight / imgHeight)
        const scaledWidth = imgWidth * scale
        const scaledHeight = imgHeight * scale
        const x = padding + device.screenX + (device.screenWidth - scaledWidth) / 2
        const y = padding + device.screenY + (device.screenHeight - scaledHeight) / 2

        ctx.drawImage(img, x, y, scaledWidth, scaledHeight)
        ctx.restore()

        if (device.id === 'iphone-14') {
            ctx.fillStyle = '#000000'
            roundRect(ctx, padding + device.width / 2 - 60, padding + 18, 120, 30, 15)
            ctx.fill()
        }

        return canvasToBlob(canvas, 'image/png')
    }

    const handleGenerate = async () => {
        if (!file || isProcessing) return
        setIsProcessing(true)
        try {
            const blob = await generateMockup(file, selectedDevice, backgroundColor)
            setMockupBlob(blob)
            success('Mockup generated successfully')
        } catch (err) {
            error(err instanceof Error ? err.message : 'Could not generate the mockup')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleDownload = () => {
        if (!mockupBlob || !file) return
        const outName = buildOutputName(file.name, `${selectedDevice.id}-mockup`, 'png')
        downloadBlob(mockupBlob, outName)
        if (onProduceFile) {
            onProduceFile(new File([mockupBlob], outName, { type: 'image/png' }))
        }
    }

    const handleReset = () => {
        setFile(null)
        setOriginalInfo(null)
        setMockupBlob(null)
    }

    const leftControls = (
        <>
            {file && (
                <ControlGroup label="Source Screenshot">
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

            <ControlGroup label="Device Frame" hint="Realistic Apple, Android and desktop frames">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-2)' }}>
                    {DEVICE_FRAMES.map((device) => {
                        const isSelected = selectedDevice.id === device.id
                        return (
                            <button
                                key={device.id}
                                type="button"
                                onClick={() => setSelectedDevice(device)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 10px',
                                    borderRadius: 'var(--radius-sm)',
                                    border: isSelected
                                        ? '1px solid var(--color-accent)'
                                        : '1px solid var(--color-border-subtle)',
                                    backgroundColor: isSelected
                                        ? 'var(--color-accent-subtle)'
                                        : 'var(--color-bg-surface-elevated)',
                                    color: 'var(--color-text-primary)',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                }}
                            >
                                <span style={{ color: isSelected ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}>
                                    {getDeviceIcon(device.type)}
                                </span>
                                <span style={{ fontSize: '11px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {device.name}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </ControlGroup>

            <ControlGroup label="Backdrop Color" hint="Subtle gradient backplate">
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {BG_COLORS.map((color) => (
                        <button
                            type="button"
                            key={color}
                            aria-label={`Background color ${color}`}
                            onClick={() => setBackgroundColor(color)}
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: color,
                                cursor: 'pointer',
                                border: backgroundColor === color ? '2px solid #ffffff' : '1px solid var(--color-border-default)',
                                boxShadow: backgroundColor === color ? '0 0 0 2px var(--color-accent)' : 'none',
                            }}
                        />
                    ))}
                    <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        style={{
                            width: 28,
                            height: 28,
                            padding: 0,
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--color-border-default)',
                            cursor: 'pointer',
                            backgroundColor: 'transparent',
                        }}
                        title="Custom color"
                    />
                </div>
            </ControlGroup>
        </>
    )

    const centerCanvas = !file ? (
        <Dropzone
            onFiles={(files) => handleFile(files[0])}
            icon="laptop"
            title="Drop screenshot to generate device mockup"
            hint="Wraps UI screenshots in clean vector device frames"
            onTrySample={async () => {
                const s = await createSampleImage()
                handleFile(s)
            }}
        />
    ) : mockupUrl ? (
        <div style={{ textAlign: 'center', maxWidth: '850px', width: '100%' }}>
            <img
                src={mockupUrl}
                alt="Device mockup output"
                style={{
                    maxHeight: '65vh',
                    maxWidth: '100%',
                    objectFit: 'contain',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-md)',
                }}
            />
        </div>
    ) : (
        <div style={{ textAlign: 'center', maxWidth: '600px', width: '100%' }}>
            <img
                src={preview || undefined}
                alt="Source preview"
                style={{
                    maxHeight: '50vh',
                    maxWidth: '100%',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border-subtle)',
                }}
            />
            <p style={{ marginTop: 'var(--spacing-3)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Screenshot loaded. Click "Generate Mockup" to render in {selectedDevice.name}.
            </p>
        </div>
    )

    const bottomBar = (
        <>
            <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                <StatTile label="Device" value={selectedDevice.name} />
                <StatTile label="Resolution" value={`${selectedDevice.width} × ${selectedDevice.height}`} />
            </div>

            <div className="workspace-action-group">
                <Button variant="ghost" onClick={handleReset} icon={<RotateCcw size={15} />}>
                    Reset
                </Button>
                <Button
                    variant="secondary"
                    onClick={() => void handleGenerate()}
                    isLoading={isProcessing}
                    icon={<Sparkles size={15} />}
                >
                    {mockupBlob ? 'Regenerate Mockup' : 'Generate Mockup'}
                </Button>
                {mockupBlob && (
                    <Button
                        variant="primary"
                        onClick={handleDownload}
                        icon={<Download size={15} />}
                    >
                        Download PNG
                    </Button>
                )}
            </div>
        </>
    )

    return (
        <div className="tool-view-wrapper">
            <ToolHeader
                toolName="Device Mockup Generator"
                toolIcon={<Laptop size={18} />}
                toolId="device-mockup"
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
