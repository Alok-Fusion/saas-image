import { useCallback, useEffect, useState } from 'react'
import Dropzone from '../components/Dropzone'
import { useToast } from '../components/Toast'
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

interface WatermarkAdderProps {
    onBack: () => void
}

export default function WatermarkAdder({ onBack }: WatermarkAdderProps) {
    const [file, setFile] = useState<File | null>(null)
    const [originalInfo, setOriginalInfo] = useState<ImageInfo | null>(null)
    const [watermarkText, setWatermarkText] = useState('© Your Name')
    const [watermarkPosition, setWatermarkPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center'>('bottom-right')
    const [watermarkSize, setWatermarkSize] = useState(24)
    const [watermarkOpacity, setWatermarkOpacity] = useState(70)
    const [watermarkColor, setWatermarkColor] = useState('#ffffff')
    const [processedBlob, setProcessedBlob] = useState<Blob | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const preview = useObjectUrl(file)
    const processedUrl = useObjectUrl(processedBlob)
    const { error } = useToast()

    useEffect(() => {
        if (!file) return
        let active = true
        getImageInfo(file)
            .then((info) => { if (active) setOriginalInfo(info) })
            .catch(() => { if (active) setOriginalInfo(null) })
        return () => { active = false }
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
        const mime = getOutputMime(file.type)
        setProcessedBlob(await canvasToBlob(canvas, mime, 0.92))
        } catch (err) {
            error(err instanceof Error ? err.message : 'Could not apply the watermark')
        } finally {
            setIsProcessing(false)
        }
    }, [file, originalInfo, watermarkText, watermarkPosition, watermarkSize, watermarkOpacity, watermarkColor, error])

    const handleFile = useCallback((selectedFile: File) => {
        setProcessedBlob(null)
        setFile(selectedFile)
    }, [])

    const handleDownload = () => {
        if (!processedBlob || !file) return
        const mime = getOutputMime(file.type)
        const extension = mime === 'image/jpeg' ? 'jpg' : mime === 'image/webp' ? 'webp' : 'png'
        downloadBlob(processedBlob, buildOutputName(file.name, 'watermarked', extension))
    }

    const handleReset = () => {
        setFile(null)
        setOriginalInfo(null)
        setProcessedBlob(null)
    }

    return (
        <div className="tool-page">
            <div className="tool-header">
                <button className="back-button" onClick={onBack}>←</button>
                <h1 className="tool-title">Watermark Adder</h1>
            </div>
            {!file ? (
                <Dropzone
                    onFiles={(files) => handleFile(files[0])}
                    icon="©"
                    title="Drop image here or click to browse"
                    hint="Add text watermarks to protect your images"
                />
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
                        <button className="download-button" onClick={applyWatermark} disabled={isProcessing || !originalInfo} style={{ width: '100%', marginTop: '1rem' }}>
                            {isProcessing ? '⏳ Applying…' : '✨ Apply Watermark'}
                        </button>
                    </div>
                    <div className="comparison-container" style={{ marginTop: '1.5rem' }}>
                        <div className="comparison-panel"><div className="comparison-label">Original</div>{preview && <img src={preview} alt="Original" className="comparison-image" />}</div>
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
