import { useCallback, useEffect, useRef, useState } from 'react'
import { downloadBlob } from '../utils/imageProcessing'

interface ThumbnailMakerProps {
    onBack: () => void
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

const POPULAR_EMOJIS = ['🔥', '⭐', '💯', '🚀', '💡', '🎯', '✨', '👆', '👇', '❤️', '🎉', '💪', '🏆', '📌', '⚡', '🔔', '👀', '💰', '🎮', '📸']

const CANVAS_PRESETS = [
    { name: 'YouTube', width: 1280, height: 720 },
    { name: 'Instagram Post', width: 1080, height: 1080 },
    { name: 'Instagram Story', width: 1080, height: 1920 },
    { name: 'Twitter', width: 1200, height: 675 },
    { name: 'Facebook', width: 1200, height: 630 }
]

export default function ThumbnailMaker({ onBack }: ThumbnailMakerProps) {
    const [canvasWidth, setCanvasWidth] = useState(1280)
    const [canvasHeight, setCanvasHeight] = useState(720)
    const [bgColor, setBgColor] = useState('#1a1a2e')
    const [bgImage, setBgImage] = useState<string | null>(null)
    const [elements, setElements] = useState<CanvasElement[]>([])
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [newText, setNewText] = useState('Your Text Here')
    const [isDragging, setIsDragging] = useState(false)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
    const canvasRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const overlayInputRef = useRef<HTMLInputElement>(null)

    // Add text element
    const addText = () => {
        const id = `text-${Date.now()}`
        const newElement: TextElement = {
            id,
            text: newText,
            x: canvasWidth / 2 - 100,
            y: canvasHeight / 2,
            fontSize: 48,
            color: '#ffffff',
            fontWeight: 'bold',
            rotation: 0
        }
        setElements([...elements, newElement])
        setSelectedId(id)
    }

    // Add emoji element
    const addEmoji = (emoji: string) => {
        const id = `emoji-${Date.now()}`
        const newElement: EmojiElement = {
            id,
            emoji,
            x: Math.random() * (canvasWidth - 100) + 50,
            y: Math.random() * (canvasHeight - 100) + 50,
            fontSize: 64,
            rotation: 0
        }
        setElements([...elements, newElement])
        setSelectedId(id)
    }

    // Add overlay image
    const addOverlayImage = (file: File) => {
        const url = URL.createObjectURL(file)
        const img = new Image()
        img.onload = () => {
            const id = `img-${Date.now()}`
            const scale = Math.min(300 / img.width, 300 / img.height, 1)
            const newElement: ImageElement = {
                id,
                src: url,
                x: canvasWidth / 2 - (img.width * scale) / 2,
                y: canvasHeight / 2 - (img.height * scale) / 2,
                width: img.width * scale,
                height: img.height * scale,
                rotation: 0
            }
            setElements([...elements, newElement])
            setSelectedId(id)
        }
        img.src = url
    }

    // Set background image
    const handleBgImage = (file: File) => {
        const url = URL.createObjectURL(file)
        setBgImage(url)
    }

    // Element drag handlers
    const handleMouseDown = (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        setSelectedId(id)
        setIsDragging(true)
        const el = elements.find(el => el.id === id)
        if (el && canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect()
            const scale = canvasWidth / rect.width
            setDragOffset({
                x: (e.clientX - rect.left) * scale - el.x,
                y: (e.clientY - rect.top) * scale - el.y
            })
        }
    }

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !selectedId || !canvasRef.current) return
        const rect = canvasRef.current.getBoundingClientRect()
        const scale = canvasWidth / rect.width
        const x = (e.clientX - rect.left) * scale - dragOffset.x
        const y = (e.clientY - rect.top) * scale - dragOffset.y
        setElements(els => els.map(el => el.id === selectedId ? { ...el, x, y } : el))
    }, [isDragging, selectedId, dragOffset, canvasWidth])

    const handleMouseUp = useCallback(() => {
        setIsDragging(false)
    }, [])

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [handleMouseMove, handleMouseUp])

    // Update selected element
    const updateElement = (updates: Partial<CanvasElement>) => {
        if (!selectedId) return
        setElements(els => els.map(el => el.id === selectedId ? { ...el, ...updates } : el))
    }

    // Delete element
    const deleteElement = () => {
        if (!selectedId) return
        setElements(els => els.filter(el => el.id !== selectedId))
        setSelectedId(null)
    }

    // Get selected element
    const selectedElement = elements.find(el => el.id === selectedId)

    // Export as image
    const exportImage = async () => {
        const canvas = document.createElement('canvas')
        canvas.width = canvasWidth
        canvas.height = canvasHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Background
        ctx.fillStyle = bgColor
        ctx.fillRect(0, 0, canvasWidth, canvasHeight)

        // Background image
        if (bgImage) {
            const img = new Image()
            img.crossOrigin = 'anonymous'
            await new Promise<void>(resolve => { img.onload = () => resolve(); img.src = bgImage })
            ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)
        }

        // Elements
        for (const el of elements) {
            ctx.save()
            ctx.translate(el.x, el.y)
            if ('rotation' in el) ctx.rotate((el.rotation * Math.PI) / 180)

            if ('text' in el) {
                const textEl = el as TextElement
                ctx.font = `${textEl.fontWeight} ${textEl.fontSize}px Arial, sans-serif`
                ctx.fillStyle = textEl.color
                ctx.textBaseline = 'top'
                ctx.shadowColor = 'rgba(0,0,0,0.5)'
                ctx.shadowBlur = 8
                ctx.fillText(textEl.text, 0, 0)
            } else if ('emoji' in el) {
                const emojiEl = el as EmojiElement
                ctx.font = `${emojiEl.fontSize}px Arial`
                ctx.textBaseline = 'top'
                ctx.fillText(emojiEl.emoji, 0, 0)
            } else if ('src' in el) {
                const imgEl = el as ImageElement
                const img = new Image()
                img.crossOrigin = 'anonymous'
                await new Promise<void>(resolve => { img.onload = () => resolve(); img.src = imgEl.src })
                ctx.drawImage(img, 0, 0, imgEl.width, imgEl.height)
            }
            ctx.restore()
        }

        canvas.toBlob(blob => {
            if (blob) downloadBlob(blob, 'thumbnail.png')
        }, 'image/png')
    }

    return (
        <div className="tool-page">
            <div className="tool-header">
                <button className="back-button" onClick={onBack}>←</button>
                <h1 className="tool-title">Thumbnail Maker</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>
                {/* Canvas Area */}
                <div>
                    <div className="controls-panel" style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {CANVAS_PRESETS.map(p => (
                                <button key={p.name} className={`select-button ${canvasWidth === p.width && canvasHeight === p.height ? 'active' : ''}`} onClick={() => { setCanvasWidth(p.width); setCanvasHeight(p.height) }} style={{ fontSize: '0.75rem' }}>{p.name}</button>
                            ))}
                        </div>
                    </div>

                    <div ref={canvasRef} style={{
                        width: '100%',
                        maxWidth: canvasWidth * 0.5,
                        aspectRatio: `${canvasWidth}/${canvasHeight}`,
                        background: bgImage ? `url(${bgImage}) center/cover` : bgColor,
                        borderRadius: 12,
                        position: 'relative',
                        overflow: 'hidden',
                        cursor: 'default',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                    }} onClick={() => setSelectedId(null)}>
                        {elements.map(el => (
                            <div key={el.id} onMouseDown={(e) => handleMouseDown(e, el.id)} style={{
                                position: 'absolute',
                                left: `${(el.x / canvasWidth) * 100}%`,
                                top: `${(el.y / canvasHeight) * 100}%`,
                                transform: `rotate(${'rotation' in el ? el.rotation : 0}deg)`,
                                cursor: 'move',
                                border: selectedId === el.id ? '2px dashed #667eea' : 'none',
                                padding: selectedId === el.id ? 4 : 0,
                                borderRadius: 4,
                                userSelect: 'none'
                            }}>
                                {'text' in el && (
                                    <span style={{ fontSize: (el as TextElement).fontSize * 0.5, color: (el as TextElement).color, fontWeight: (el as TextElement).fontWeight, textShadow: '2px 2px 8px rgba(0,0,0,0.5)', whiteSpace: 'nowrap' }}>{(el as TextElement).text}</span>
                                )}
                                {'emoji' in el && (
                                    <span style={{ fontSize: (el as EmojiElement).fontSize * 0.5 }}>{(el as EmojiElement).emoji}</span>
                                )}
                                {'src' in el && (
                                    <img src={(el as ImageElement).src} alt="" style={{ width: (el as ImageElement).width * 0.5, height: (el as ImageElement).height * 0.5, pointerEvents: 'none' }} draggable={false} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar Controls */}
                <div className="controls-panel" style={{ height: 'fit-content' }}>
                    {/* Background */}
                    <div className="control-group">
                        <label className="control-label"><span>Background</span></label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="color-picker" />
                            <button className="select-button" onClick={() => fileInputRef.current?.click()}>📷 Image</button>
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleBgImage(e.target.files[0])} style={{ display: 'none' }} />
                    </div>

                    {/* Add Text */}
                    <div className="control-group">
                        <label className="control-label"><span>Add Text</span></label>
                        <input type="text" value={newText} onChange={e => setNewText(e.target.value)} placeholder="Enter text" style={{ width: '100%', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'white', marginBottom: '0.5rem' }} />
                        <button className="select-button active" onClick={addText} style={{ width: '100%' }}>➕ Add Text</button>
                    </div>

                    {/* Add Emoji */}
                    <div className="control-group">
                        <label className="control-label"><span>Add Emoji</span></label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                            {POPULAR_EMOJIS.map(e => (
                                <button key={e} onClick={() => addEmoji(e)} style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 6, fontSize: 20, cursor: 'pointer' }}>{e}</button>
                            ))}
                        </div>
                    </div>

                    {/* Add Overlay Image */}
                    <div className="control-group">
                        <label className="control-label"><span>Add Image</span></label>
                        <button className="select-button" onClick={() => overlayInputRef.current?.click()} style={{ width: '100%' }}>🖼️ Add Overlay Image</button>
                        <input ref={overlayInputRef} type="file" accept="image/*" onChange={e => e.target.files?.[0] && addOverlayImage(e.target.files[0])} style={{ display: 'none' }} />
                    </div>

                    {/* Selected Element Controls */}
                    {selectedElement && (
                        <div className="control-group" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', marginTop: '1rem' }}>
                            <label className="control-label"><span>Selected: {selectedElement.id.split('-')[0]}</span></label>

                            {'fontSize' in selectedElement && (
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Size: {selectedElement.fontSize}</label>
                                    <input type="range" min="16" max="200" value={selectedElement.fontSize} onChange={e => updateElement({ fontSize: Number(e.target.value) })} style={{ width: '100%' }} />
                                </div>
                            )}

                            {'color' in selectedElement && (
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Color</label>
                                    <input type="color" value={(selectedElement as TextElement).color} onChange={e => updateElement({ color: e.target.value })} className="color-picker" />
                                </div>
                            )}

                            {'width' in selectedElement && (
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Size: {Math.round((selectedElement as ImageElement).width)}</label>
                                    <input type="range" min="50" max="800" value={(selectedElement as ImageElement).width} onChange={e => { const w = Number(e.target.value); const ratio = (selectedElement as ImageElement).height / (selectedElement as ImageElement).width; updateElement({ width: w, height: w * ratio }) }} style={{ width: '100%' }} />
                                </div>
                            )}

                            {'rotation' in selectedElement && (
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Rotation: {selectedElement.rotation}°</label>
                                    <input type="range" min="-180" max="180" value={selectedElement.rotation} onChange={e => updateElement({ rotation: Number(e.target.value) })} style={{ width: '100%' }} />
                                </div>
                            )}

                            <button className="secondary-button" onClick={deleteElement} style={{ width: '100%', background: 'rgba(245,87,108,0.2)', color: '#f5576c' }}>🗑️ Delete</button>
                        </div>
                    )}

                    {/* Export */}
                    <button className="download-button" onClick={exportImage} style={{ width: '100%', marginTop: '1rem' }}>⬇️ Export Thumbnail</button>
                </div>
            </div>
        </div>
    )
}
