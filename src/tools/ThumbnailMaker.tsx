import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, Image as ImageIcon, LayoutTemplate, RotateCcw, Trash2, Type } from 'lucide-react'
import Button from '../components/Button'
import ControlGroup from '../components/ControlGroup'
import SegmentedControl from '../components/SegmentedControl'
import Slider from '../components/Slider'
import StatTile from '../components/StatTile'
import ToolHeader from '../components/ToolHeader'
import { useToast } from '../components/Toast'
import WorkspaceLayout from '../components/WorkspaceLayout'
import { validateImageFile } from '../utils/fileIntake'
import { canvasToBlob, downloadBlob } from '../utils/imageProcessing'

interface ThumbnailMakerProps {
    onBack: () => void
    initialFile?: File | null
    onProduceFile?: (file: File) => void
}

interface TextElement {
    id: string
    text: string
    x: number
    y: number
    fontSize: number
    color: string
    fontWeight: 'normal' | 'bold'
    rotation: number
}

interface ImageElement {
    id: string
    src: string
    x: number
    y: number
    width: number
    height: number
    rotation: number
}

interface EmojiElement {
    id: string
    emoji: string
    x: number
    y: number
    fontSize: number
    rotation: number
}

type CanvasElement = TextElement | ImageElement | EmojiElement

const POPULAR_EMOJIS = [
    '🔥', '⭐', '💯', '🚀', '💡', '🎯', '✨', '👆', '👇', '❤️',
    '🎉', '💪', '🏆', '📌', '⚡', '🔔', '👀', '💰', '🎮', '📸',
]

const CANVAS_PRESETS = [
    { name: 'YouTube (16:9)', width: 1280, height: 720 },
    { name: 'Instagram (1:1)', width: 1080, height: 1080 },
    { name: 'Story (9:16)', width: 1080, height: 1920 },
    { name: 'Twitter (16:9)', width: 1200, height: 675 },
]

export default function ThumbnailMaker({
    onBack,
    initialFile,
    onProduceFile,
}: ThumbnailMakerProps) {
    const [canvasWidth, setCanvasWidth] = useState(1280)
    const [canvasHeight, setCanvasHeight] = useState(720)
    const [bgColor, setBgColor] = useState('#0f172a')
    const [bgImage, setBgImage] = useState<string | null>(null)
    const [elements, setElements] = useState<CanvasElement[]>([])
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [newText, setNewText] = useState('Epic Thumbnail')
    const [isDragging, setIsDragging] = useState(false)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
    const [previewScale, setPreviewScale] = useState(0.5)
    const [isExporting, setIsExporting] = useState(false)
    const canvasRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const overlayInputRef = useRef<HTMLInputElement>(null)
    const idCounter = useRef(0)
    const overlayUrlsRef = useRef(new Set<string>())
    const { error, success } = useToast()

    // Handle initialFile prop as background
    useEffect(() => {
        if (initialFile && !bgImage) {
            const timer = setTimeout(() => {
                const url = URL.createObjectURL(initialFile)
                setBgImage(url)
            }, 0)
            return () => clearTimeout(timer)
        }
    }, [initialFile, bgImage])

    useEffect(() => {
        const element = canvasRef.current
        if (!element) return
        const observer = new ResizeObserver((entries) => {
            const width = entries[0]?.contentRect.width ?? 0
            if (width > 0) setPreviewScale(width / canvasWidth)
        })
        observer.observe(element)
        return () => observer.disconnect()
    }, [canvasWidth])

    useEffect(() => () => {
        overlayUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    }, [])

    useEffect(() => () => {
        if (bgImage) URL.revokeObjectURL(bgImage)
    }, [bgImage])

    const nextId = (prefix: string) => {
        idCounter.current += 1
        return `${prefix}-${idCounter.current}`
    }

    const addText = () => {
        const id = nextId('text')
        const newElement: TextElement = {
            id,
            text: newText,
            x: canvasWidth / 2 - 120,
            y: canvasHeight / 2 - 30,
            fontSize: 54,
            color: '#ffffff',
            fontWeight: 'bold',
            rotation: 0,
        }
        setElements((current) => [...current, newElement])
        setSelectedId(id)
    }

    const addEmoji = (emoji: string) => {
        const id = nextId('emoji')
        const seq = idCounter.current
        const newElement: EmojiElement = {
            id,
            emoji,
            x: ((seq * 137) % Math.max(1, canvasWidth - 100)) + 50,
            y: ((seq * 89) % Math.max(1, canvasHeight - 100)) + 50,
            fontSize: 72,
            rotation: 0,
        }
        setElements((current) => [...current, newElement])
        setSelectedId(id)
    }

    const addOverlayImage = async (file: File) => {
        const validation = await validateImageFile(file)
        if (!validation.ok) {
            error(validation.error)
            return
        }
        const url = URL.createObjectURL(file)
        overlayUrlsRef.current.add(url)
        const img = new Image()
        img.onload = () => {
            const id = nextId('img')
            const scale = Math.min(300 / img.width, 300 / img.height, 1)
            const newElement: ImageElement = {
                id,
                src: url,
                x: canvasWidth / 2 - (img.width * scale) / 2,
                y: canvasHeight / 2 - (img.height * scale) / 2,
                width: img.width * scale,
                height: img.height * scale,
                rotation: 0,
            }
            setElements((current) => [...current, newElement])
            setSelectedId(id)
        }
        img.onerror = () => {
            URL.revokeObjectURL(url)
            overlayUrlsRef.current.delete(url)
            error('Could not load overlay image')
        }
        img.src = url
    }

    const handleBgImage = async (file: File) => {
        const validation = await validateImageFile(file)
        if (!validation.ok) {
            error(validation.error)
            return
        }
        if (bgImage) URL.revokeObjectURL(bgImage)
        setBgImage(URL.createObjectURL(file))
    }

    const handlePointerDown = (event: React.PointerEvent, id: string) => {
        event.stopPropagation()
        setSelectedId(id)
        setIsDragging(true)
        const element = elements.find((item) => item.id === id)
        if (element && canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect()
            const scale = canvasWidth / rect.width
            setDragOffset({
                x: (event.clientX - rect.left) * scale - element.x,
                y: (event.clientY - rect.top) * scale - element.y,
            })
        }
    }

    const handlePointerMove = useCallback(
        (event: PointerEvent) => {
            if (!isDragging || !selectedId || !canvasRef.current) return
            const rect = canvasRef.current.getBoundingClientRect()
            const scale = canvasWidth / rect.width
            const x = (event.clientX - rect.left) * scale - dragOffset.x
            const y = (event.clientY - rect.top) * scale - dragOffset.y
            setElements((current) =>
                current.map((element) => (element.id === selectedId ? { ...element, x, y } : element))
            )
        },
        [isDragging, selectedId, dragOffset, canvasWidth]
    )

    const handlePointerUp = useCallback(() => {
        setIsDragging(false)
    }, [])

    useEffect(() => {
        window.addEventListener('pointermove', handlePointerMove)
        window.addEventListener('pointerup', handlePointerUp)
        window.addEventListener('pointercancel', handlePointerUp)
        return () => {
            window.removeEventListener('pointermove', handlePointerMove)
            window.removeEventListener('pointerup', handlePointerUp)
            window.removeEventListener('pointercancel', handlePointerUp)
        }
    }, [handlePointerMove, handlePointerUp])

    const updateElement = (updates: Partial<CanvasElement>) => {
        if (!selectedId) return
        setElements((els) => els.map((el) => (el.id === selectedId ? ({ ...el, ...updates } as CanvasElement) : el)))
    }

    const deleteElement = () => {
        if (!selectedId) return
        const element = elements.find((item) => item.id === selectedId)
        if (element && 'src' in element) {
            URL.revokeObjectURL(element.src)
            overlayUrlsRef.current.delete(element.src)
        }
        setElements((current) => current.filter((item) => item.id !== selectedId))
        setSelectedId(null)
    }

    const selectedElement = elements.find((el) => el.id === selectedId)

    const loadImageElement = (src: string) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new Image()
            image.onload = () => resolve(image)
            image.onerror = () => reject(new Error('Could not load image on canvas'))
            image.src = src
        })

    const exportImage = async () => {
        if (isExporting) return
        setIsExporting(true)
        try {
            const canvas = document.createElement('canvas')
            canvas.width = canvasWidth
            canvas.height = canvasHeight
            const ctx = canvas.getContext('2d')
            if (!ctx) throw new Error('Canvas is not available')

            ctx.fillStyle = bgColor
            ctx.fillRect(0, 0, canvasWidth, canvasHeight)

            if (bgImage) {
                const image = await loadImageElement(bgImage)
                const scale = Math.max(canvasWidth / image.width, canvasHeight / image.height)
                const width = image.width * scale
                const height = image.height * scale
                ctx.drawImage(image, (canvasWidth - width) / 2, (canvasHeight - height) / 2, width, height)
            }

            for (const element of elements) {
                ctx.save()
                ctx.translate(element.x, element.y)
                ctx.rotate((element.rotation * Math.PI) / 180)

                if ('text' in element) {
                    ctx.font = `${element.fontWeight} ${element.fontSize}px Geist, Inter, sans-serif`
                    ctx.fillStyle = element.color
                    ctx.textBaseline = 'top'
                    ctx.shadowColor = 'rgba(0,0,0,0.6)'
                    ctx.shadowBlur = 12
                    ctx.fillText(element.text, 0, 0)
                } else if ('emoji' in element) {
                    ctx.font = `${element.fontSize}px sans-serif`
                    ctx.textBaseline = 'top'
                    ctx.fillText(element.emoji, 0, 0)
                } else if ('src' in element) {
                    const image = await loadImageElement(element.src)
                    ctx.drawImage(image, 0, 0, element.width, element.height)
                }
                ctx.restore()
            }

            const blob = await canvasToBlob(canvas, 'image/png')
            downloadBlob(blob, 'thumbnail.png')
            if (onProduceFile) {
                onProduceFile(new File([blob], 'thumbnail.png', { type: 'image/png' }))
            }
            success('Thumbnail exported successfully')
        } catch (err) {
            error(err instanceof Error ? err.message : 'Could not export thumbnail')
        } finally {
            setIsExporting(false)
        }
    }

    const handlePresetChange = (val: string) => {
        const preset = CANVAS_PRESETS.find((p) => p.name === val)
        if (preset) {
            setCanvasWidth(preset.width)
            setCanvasHeight(preset.height)
        }
    }

    const handleReset = () => {
        if (bgImage) URL.revokeObjectURL(bgImage)
        overlayUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
        overlayUrlsRef.current.clear()
        setBgImage(null)
        setElements([])
        setSelectedId(null)
    }

    const currentPreset = CANVAS_PRESETS.find((p) => p.width === canvasWidth && p.height === canvasHeight)

    const leftControls = (
        <>
            <ControlGroup label="Canvas Preset">
                <SegmentedControl
                    value={currentPreset?.name ?? CANVAS_PRESETS[0].name}
                    onChange={handlePresetChange}
                    options={CANVAS_PRESETS.map((p) => ({ value: p.name, label: p.name.split(' ')[0] }))}
                />
            </ControlGroup>

            <ControlGroup label="Background" hint="Set solid color or upload custom background">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        style={{
                            width: 36,
                            height: 36,
                            padding: 0,
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--color-border-default)',
                            cursor: 'pointer',
                            backgroundColor: 'transparent',
                        }}
                    />
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        icon={<ImageIcon size={14} />}
                    >
                        {bgImage ? 'Replace Photo' : 'Upload Photo'}
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && void handleBgImage(e.target.files[0])}
                        style={{ display: 'none' }}
                    />
                </div>
            </ControlGroup>

            <ControlGroup label="Add Typography">
                <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                        type="text"
                        className="control-input"
                        value={newText}
                        onChange={(e) => setNewText(e.target.value)}
                        placeholder="Text headline…"
                    />
                    <Button variant="secondary" size="sm" onClick={addText} icon={<Type size={14} />}>
                        Add
                    </Button>
                </div>
            </ControlGroup>

            <ControlGroup label="Stickers & Emojis">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
                    {POPULAR_EMOJIS.map((emoji) => (
                        <button
                            key={emoji}
                            type="button"
                            onClick={() => addEmoji(emoji)}
                            style={{
                                fontSize: '18px',
                                padding: '6px',
                                backgroundColor: 'var(--color-bg-surface-elevated)',
                                border: '1px solid var(--color-border-subtle)',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer',
                            }}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </ControlGroup>

            <ControlGroup label="Add Graphic Overlay">
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => overlayInputRef.current?.click()}
                    icon={<ImageIcon size={14} />}
                >
                    Add Image Layer
                </Button>
                <input
                    ref={overlayInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && void addOverlayImage(e.target.files[0])}
                    style={{ display: 'none' }}
                />
            </ControlGroup>

            {/* Selected Element Inspector */}
            {selectedElement && (
                <ControlGroup label="Selected Layer">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                        {'fontSize' in selectedElement && (
                            <Slider
                                label="Font Size"
                                value={selectedElement.fontSize}
                                min={16}
                                max={140}
                                step={2}
                                unit="px"
                                onChange={(val) => updateElement({ fontSize: val })}
                            />
                        )}
                        <Slider
                            label="Rotation"
                            value={selectedElement.rotation}
                            min={0}
                            max={360}
                            step={5}
                            unit="°"
                            onChange={(val) => updateElement({ rotation: val })}
                        />
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={deleteElement}
                            icon={<Trash2 size={13} />}
                        >
                            Delete Layer
                        </Button>
                    </div>
                </ControlGroup>
            )}
        </>
    )

    const centerCanvas = (
        <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-3)' }}>
            <div
                ref={canvasRef}
                style={{
                    width: '100%',
                    maxWidth: 680,
                    aspectRatio: `${canvasWidth}/${canvasHeight}`,
                    background: bgImage ? `url(${bgImage}) center/cover no-repeat` : bgColor,
                    borderRadius: 'var(--radius-md)',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'default',
                    boxShadow: 'var(--shadow-md)',
                    border: '1px solid var(--color-border-default)',
                    touchAction: isDragging ? 'none' : 'auto',
                }}
                onClick={() => setSelectedId(null)}
            >
                {elements.map((el) => (
                    <div
                        key={el.id}
                        onPointerDown={(event) => handlePointerDown(event, el.id)}
                        style={{
                            position: 'absolute',
                            left: `${(el.x / canvasWidth) * 100}%`,
                            top: `${(el.y / canvasHeight) * 100}%`,
                            transform: `rotate(${el.rotation}deg)`,
                            transformOrigin: 'top left',
                            cursor: 'move',
                            outline: selectedId === el.id ? '2px dashed var(--color-accent)' : 'none',
                            outlineOffset: '2px',
                            borderRadius: '2px',
                            userSelect: 'none',
                            touchAction: 'none',
                        }}
                    >
                        {'text' in el && (
                            <span
                                style={{
                                    fontSize: el.fontSize * previewScale,
                                    color: el.color,
                                    fontWeight: el.fontWeight,
                                    textShadow: '2px 2px 8px rgba(0,0,0,0.6)',
                                    whiteSpace: 'nowrap',
                                    fontFamily: 'var(--font-sans)',
                                }}
                            >
                                {el.text}
                            </span>
                        )}
                        {'emoji' in el && (
                            <span style={{ fontSize: el.fontSize * previewScale }}>{el.emoji}</span>
                        )}
                        {'src' in el && (
                            <img
                                src={el.src}
                                alt=""
                                style={{
                                    width: el.width * previewScale,
                                    height: el.height * previewScale,
                                    pointerEvents: 'none',
                                }}
                                draggable={false}
                            />
                        )}
                    </div>
                ))}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                Click and drag layers directly on the canvas to reposition
            </span>
        </div>
    )

    const bottomBar = (
        <>
            <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                <StatTile label="Canvas Size" value={`${canvasWidth} × ${canvasHeight}`} />
                <StatTile label="Layers" value={elements.length} />
            </div>

            <div className="workspace-action-group">
                <Button variant="ghost" onClick={handleReset} icon={<RotateCcw size={15} />}>
                    Reset
                </Button>
                <Button
                    variant="primary"
                    onClick={() => void exportImage()}
                    isLoading={isExporting}
                    icon={<Download size={15} />}
                >
                    Export Thumbnail PNG
                </Button>
            </div>
        </>
    )

    return (
        <div className="tool-view-wrapper">
            <ToolHeader
                toolName="Thumbnail Maker"
                toolIcon={<LayoutTemplate size={18} />}
                toolId="thumbnail-maker"
                onBack={onBack}
                onReset={handleReset}
            />
            <WorkspaceLayout
                leftControls={leftControls}
                centerCanvas={centerCanvas}
                bottomBar={bottomBar}
                hasFile={true}
            />
        </div>
    )
}
