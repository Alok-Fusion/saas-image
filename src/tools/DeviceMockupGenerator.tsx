import { useCallback, useEffect, useState } from 'react'
import Dropzone from '../components/Dropzone'
import { useToast } from '../components/Toast'
import { useObjectUrl } from '../hooks/useObjectUrl'
import {
    buildOutputName,
    canvasToBlob,
    downloadBlob,
    formatFileSize,
    getImageInfo,
    loadImage,
    type ImageInfo,
} from '../utils/imageProcessing'

interface DeviceMockupGeneratorProps {
    onBack: () => void
}

interface DeviceFrame {
    id: string
    name: string
    icon: string
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
        icon: '📱',
        width: 430,
        height: 880,
        screenX: 15,
        screenY: 15,
        screenWidth: 400,
        screenHeight: 850,
        borderRadius: 55,
        frameColor: '#1a1a1a',
        bezelWidth: 15
    },
    {
        id: 'iphone-se',
        name: 'iPhone SE',
        icon: '📱',
        width: 375,
        height: 750,
        screenX: 15,
        screenY: 80,
        screenWidth: 345,
        screenHeight: 590,
        borderRadius: 40,
        frameColor: '#2a2a2a',
        bezelWidth: 15
    },
    {
        id: 'android',
        name: 'Android Phone',
        icon: '📱',
        width: 412,
        height: 870,
        screenX: 12,
        screenY: 12,
        screenWidth: 388,
        screenHeight: 846,
        borderRadius: 35,
        frameColor: '#1a1a1a',
        bezelWidth: 12
    },
    {
        id: 'macbook',
        name: 'MacBook Pro',
        icon: '💻',
        width: 1200,
        height: 780,
        screenX: 95,
        screenY: 35,
        screenWidth: 1010,
        screenHeight: 630,
        borderRadius: 15,
        frameColor: '#c0c0c0',
        bezelWidth: 35
    },
    {
        id: 'imac',
        name: 'iMac',
        icon: '🖥️',
        width: 1100,
        height: 900,
        screenX: 50,
        screenY: 50,
        screenWidth: 1000,
        screenHeight: 625,
        borderRadius: 20,
        frameColor: '#e8e8e8',
        bezelWidth: 50
    },
    {
        id: 'ipad',
        name: 'iPad Pro',
        icon: '📟',
        width: 840,
        height: 1120,
        screenX: 20,
        screenY: 20,
        screenWidth: 800,
        screenHeight: 1080,
        borderRadius: 35,
        frameColor: '#2a2a2a',
        bezelWidth: 20
    },
    {
        id: 'browser',
        name: 'Browser Window',
        icon: '🌐',
        width: 1200,
        height: 800,
        screenX: 0,
        screenY: 60,
        screenWidth: 1200,
        screenHeight: 740,
        borderRadius: 12,
        frameColor: '#2d2d2d',
        bezelWidth: 0
    }
]

export default function DeviceMockupGenerator({ onBack }: DeviceMockupGeneratorProps) {
    const [file, setFile] = useState<File | null>(null)
    const [originalInfo, setOriginalInfo] = useState<ImageInfo | null>(null)
    const [selectedDevice, setSelectedDevice] = useState<DeviceFrame>(DEVICE_FRAMES[0])
    const [mockupBlob, setMockupBlob] = useState<Blob | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [backgroundColor, setBackgroundColor] = useState('#667eea')
    const preview = useObjectUrl(file)
    const mockupUrl = useObjectUrl(mockupBlob)
    const { error } = useToast()

    useEffect(() => {
        if (!file) return
        let active = true
        getImageInfo(file)
            .then((info) => { if (active) setOriginalInfo(info) })
            .catch((err) => { if (active) error(err instanceof Error ? err.message : 'Could not read the image') })
        return () => { active = false }
    }, [error, file])

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

        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
        ctx.shadowBlur = 40
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 20

        if (device.id === 'browser') {
            drawBrowserFrame(ctx, padding, padding, device)
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
            device.borderRadius - device.bezelWidth
        )
        ctx.fill()

        ctx.save()
        roundRect(
            ctx,
            padding + device.screenX,
            padding + device.screenY,
            device.screenWidth,
            device.screenHeight,
            device.borderRadius - device.bezelWidth
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

    // Draw browser frame
    const drawBrowserFrame = (ctx: CanvasRenderingContext2D, x: number, y: number, device: DeviceFrame) => {
        // Window background
        ctx.fillStyle = device.frameColor
        roundRect(ctx, x, y, device.width, device.height, device.borderRadius)
        ctx.fill()

        // Title bar
        ctx.fillStyle = '#3a3a3a'
        ctx.fillRect(x, y, device.width, 60)

        // Traffic lights
        const dotY = y + 25
        ctx.fillStyle = '#ff5f57'
        ctx.beginPath()
        ctx.arc(x + 20, dotY, 7, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = '#ffbd2e'
        ctx.beginPath()
        ctx.arc(x + 45, dotY, 7, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = '#28c940'
        ctx.beginPath()
        ctx.arc(x + 70, dotY, 7, 0, Math.PI * 2)
        ctx.fill()

        // URL bar
        ctx.fillStyle = '#1a1a1a'
        roundRect(ctx, x + 100, y + 15, device.width - 120, 30, 6)
        ctx.fill()
    }

    // Helper functions
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
        const num = parseInt(hex.slice(1), 16)
        const r = Math.min(255, Math.max(0, (num >> 16) + amount))
        const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount))
        const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount))
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
    }

    const handleFile = useCallback((selectedFile: File) => {
        setFile(selectedFile)
        setMockupBlob(null)
    }, [])

    const handleGenerate = async () => {
        if (!file || isProcessing) return
        setIsProcessing(true)
        try {
            setMockupBlob(await generateMockup(file, selectedDevice, backgroundColor))
        } catch (err) {
            error(err instanceof Error ? err.message : 'Could not generate the mockup')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleDownload = () => {
        if (!mockupBlob || !file) return
        downloadBlob(mockupBlob, buildOutputName(file.name, `${selectedDevice.id}-mockup`, 'png'))
    }

    const handleReset = () => {
        setFile(null)
        setOriginalInfo(null)
        setMockupBlob(null)
    }

    const bgColors = ['#667eea', '#f093fb', '#4facfe', '#38ef7d', '#ff6b6b', '#1a1a2e', '#ffffff']

    return (
        <div className="tool-page">
            <div className="tool-header">
                <button className="back-button" onClick={onBack}>←</button>
                <h1 className="tool-title">Device Mockup Generator</h1>
            </div>

            {!file ? (
                <Dropzone
                    onFiles={(files) => handleFile(files[0])}
                    icon="📱"
                    title="Drop your screenshot here or click to browse"
                    hint="Place screenshots in iPhone, MacBook, browser frames"
                />
            ) : (
                <>
                    {/* Device & Color Selection */}
                    <div className="controls-panel">
                        {originalInfo && (
                            <div className="image-info" style={{ marginBottom: '1.5rem' }}>
                                <span className="info-badge">
                                    <span className="info-badge-label">Dimensions:</span>
                                    <span className="info-badge-value">{originalInfo.width}×{originalInfo.height}</span>
                                </span>
                                <span className="info-badge">
                                    <span className="info-badge-label">Size:</span>
                                    <span className="info-badge-value">{formatFileSize(originalInfo.size)}</span>
                                </span>
                            </div>
                        )}
                        <div className="control-group">
                            <label className="control-label">
                                <span>Device Frame</span>
                            </label>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                                gap: '0.5rem'
                            }}>
                                {DEVICE_FRAMES.map(device => (
                                    <button
                                        key={device.id}
                                        className={`select-button ${selectedDevice.id === device.id ? 'active' : ''}`}
                                        onClick={() => setSelectedDevice(device)}
                                        style={{ padding: '0.75rem', textAlign: 'center' }}
                                    >
                                        <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{device.icon}</div>
                                        <div style={{ fontSize: '0.75rem' }}>{device.name}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="control-group" style={{ marginTop: '1.5rem' }}>
                            <label className="control-label">
                                <span>Background Color</span>
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                {bgColors.map(color => (
                                    <button
                                        type="button"
                                        key={color}
                                        aria-label={`Background colour ${color}`}
                                        aria-pressed={backgroundColor === color}
                                        onClick={() => setBackgroundColor(color)}
                                        style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 8,
                                            background: color,
                                            cursor: 'pointer',
                                            border: backgroundColor === color ? '3px solid white' : '2px solid rgba(255,255,255,0.1)',
                                            transition: 'all 0.2s ease'
                                        }}
                                    />
                                ))}
                                <input
                                    type="color"
                                    value={backgroundColor}
                                    onChange={(e) => setBackgroundColor(e.target.value)}
                                    className="color-picker"
                                    style={{ width: 40, height: 40 }}
                                />
                            </div>
                        </div>

                        <button
                            className="download-button"
                            onClick={handleGenerate}
                            disabled={isProcessing}
                            style={{ width: '100%', marginTop: '1.5rem' }}
                        >
                            {isProcessing ? '⏳ Generating...' : '✨ Generate Mockup'}
                        </button>
                    </div>

                    {/* Mockup Preview */}
                    {mockupUrl && (
                        <div className="image-preview-container" style={{ marginTop: '1.5rem' }}>
                            <img src={mockupUrl} alt="Mockup" className="image-preview" style={{ maxHeight: '500px' }} />
                        </div>
                    )}
                    {!mockupUrl && preview && (
                        <div className="image-preview-container" style={{ marginTop: '1.5rem' }}>
                            <img src={preview} alt="Source screenshot" className="image-preview" style={{ maxHeight: '300px' }} />
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="actions-bar">
                        <button className="secondary-button" onClick={handleReset}>
                            🔄 Upload New Image
                        </button>
                        {mockupBlob && (
                            <button className="download-button" onClick={handleDownload}>
                                ⬇️ Download Mockup
                            </button>
                        )}
                    </div>
                </>
            )}

            {/* Processing Overlay */}
            {isProcessing && (
                <div className="processing-overlay">
                    <div className="processing-content">
                        <div className="processing-spinner" />
                        <div className="processing-text">Generating Mockup...</div>
                    </div>
                </div>
            )}
        </div>
    )
}
