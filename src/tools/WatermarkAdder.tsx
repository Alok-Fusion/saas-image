import { useCallback, useRef, useState } from 'react'
import { downloadBlob, getImageInfo, type ImageInfo } from '../utils/imageProcessing'

interface WatermarkAdderProps {
    onBack: () => void
}

export default function WatermarkAdder({ onBack }: WatermarkAdderProps) {
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [originalInfo, setOriginalInfo] = useState<ImageInfo | null>(null)
    const [watermarkText, setWatermarkText] = useState('© Your Name')
    const [watermarkPosition, setWatermarkPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center'>('bottom-right')
    const [watermarkSize, setWatermarkSize] = useState(24)
    const [watermarkOpacity, setWatermarkOpacity] = useState(70)
    const [watermarkColor, setWatermarkColor] = useState('#ffffff')
    const [processedUrl, setProcessedUrl] = useState<string | null>(null)
    const [processedBlob, setProcessedBlob] = useState<Blob | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const applyWatermark = useCallback(async () => {
        if (!file || !originalInfo) return
        const img = new Image()
        img.src = preview!
        await new Promise(resolve => img.onload = resolve)
        const canvas = document.createElement('canvas')
        canvas.width = originalInfo.width
        canvas.height = originalInfo.height
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(img, 0, 0)
        ctx.font = `bold ${watermarkSize}px Arial`
        ctx.fillStyle = watermarkColor
        ctx.globalAlpha = watermarkOpacity / 100
        const padding = 20
        let x: number, y: number
        switch (watermarkPosition) {
            case 'top-left': x = padding; y = padding + watermarkSize; ctx.textAlign = 'left'; break
            case 'top-right': x = originalInfo.width - padding; y = padding + watermarkSize; ctx.textAlign = 'right'; break
            case 'bottom-left': x = padding; y = originalInfo.height - padding; ctx.textAlign = 'left'; break
            case 'bottom-right': x = originalInfo.width - padding; y = originalInfo.height - padding; ctx.textAlign = 'right'; break
            case 'center': x = originalInfo.width / 2; y = originalInfo.height / 2; ctx.textAlign = 'center'; break
        }
        ctx.shadowColor = 'rgba(0,0,0,0.5)'
        ctx.shadowBlur = 4
        ctx.fillText(watermarkText, x, y)
        const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'))
        if (processedUrl) URL.revokeObjectURL(processedUrl)
        setProcessedBlob(blob)
        setProcessedUrl(URL.createObjectURL(blob))
    }, [file, originalInfo, preview, watermarkText, watermarkPosition, watermarkSize, watermarkOpacity, watermarkColor, processedUrl])

    const handleFile = useCallback(async (selectedFile: File) => {
        if (!selectedFile.type.startsWith('image/')) return
        setFile(selectedFile)
        const url = URL.createObjectURL(selectedFile)
        setPreview(url)
        if (processedUrl) URL.revokeObjectURL(processedUrl)
        setProcessedUrl(null)
        setProcessedBlob(null)
        const info = await getImageInfo(selectedFile)
        setOriginalInfo(info)
    }, [processedUrl])

    const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }, [])
    const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false) }, [])
    const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]) }, [handleFile])

    const handleDownload = () => {
        if (!processedBlob || !file) return
        downloadBlob(processedBlob, `${file.name.replace(/\.[^/.]+$/, '')}_watermarked.png`)
    }

    const handleReset = () => {
        if (preview) URL.revokeObjectURL(preview)
        if (processedUrl) URL.revokeObjectURL(processedUrl)
        setFile(null); setPreview(null); setOriginalInfo(null); setProcessedUrl(null); setProcessedBlob(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    return (
        <div className="tool-page">
            <div className="tool-header">
                <button className="back-button" onClick={onBack}>←</button>
                <h1 className="tool-title">Watermark Adder</h1>
            </div>
            {!file ? (
                <div className={`dropzone ${isDragging ? 'dragging' : ''}`} onClick={() => fileInputRef.current?.click()} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                    <div className="dropzone-content">
                        <div className="dropzone-icon">©</div>
                        <p className="dropzone-text">Drop image here or click to browse</p>
                        <p className="dropzone-hint">Add text watermarks to protect your images</p>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} style={{ display: 'none' }} />
                </div>
            ) : (
                <>
                    <div className="controls-panel">
                        <div className="control-group">
                            <label className="control-label"><span>Text</span></label>
                            <input type="text" value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white' }} />
                        </div>
                        <div className="control-group">
                            <label className="control-label"><span>Position</span></label>
                            <div className="select-buttons">
                                {['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'].map(p => (
                                    <button key={p} className={`select-button ${watermarkPosition === p ? 'active' : ''}`} onClick={() => setWatermarkPosition(p as typeof watermarkPosition)}>{p}</button>
                                ))}
                            </div>
                        </div>
                        <div className="control-group">
                            <label className="control-label"><span>Size: {watermarkSize}px</span></label>
                            <input type="range" min="12" max="72" value={watermarkSize} onChange={(e) => setWatermarkSize(Number(e.target.value))} style={{ width: '100%' }} />
                        </div>
                        <div className="control-group">
                            <label className="control-label"><span>Opacity: {watermarkOpacity}%</span></label>
                            <input type="range" min="10" max="100" value={watermarkOpacity} onChange={(e) => setWatermarkOpacity(Number(e.target.value))} style={{ width: '100%' }} />
                        </div>
                        <div className="control-group">
                            <label className="control-label"><span>Color</span></label>
                            <input type="color" value={watermarkColor} onChange={(e) => setWatermarkColor(e.target.value)} className="color-picker" />
                        </div>
                        <button className="download-button" onClick={applyWatermark} style={{ width: '100%', marginTop: '1rem' }}>✨ Apply Watermark</button>
                    </div>
                    <div className="comparison-container" style={{ marginTop: '1.5rem' }}>
                        <div className="comparison-panel"><div className="comparison-label">Original</div><img src={preview!} alt="Original" className="comparison-image" /></div>
                        <div className="comparison-panel"><div className="comparison-label">Watermarked</div>{processedUrl ? <img src={processedUrl} alt="Watermarked" className="comparison-image" /> : <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>Click Apply</div>}</div>
                    </div>
                    <div className="actions-bar">
                        <button className="secondary-button" onClick={handleReset}>🔄 New Image</button>
                        {processedBlob && <button className="download-button" onClick={handleDownload}>⬇️ Download</button>}
                    </div>
                </>
            )}
        </div>
    )
}
