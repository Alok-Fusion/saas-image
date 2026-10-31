import { useCallback, useState } from 'react'
import Dropzone from '../components/Dropzone'
import { useToast } from '../components/Toast'
import { useObjectUrl } from '../hooks/useObjectUrl'
import { parseExif, type ExifSummary } from '../utils/exif'
import {
    buildOutputName,
    canvasToBlob,
    downloadBlob,
    formatFileSize,
    getExtension,
    getImageInfo,
    getOutputMime,
    loadImage,
    type ImageInfo,
} from '../utils/imageProcessing'

interface ExifCleanerProps {
    onBack: () => void
}

export default function ExifCleaner({ onBack }: ExifCleanerProps) {
    const [file, setFile] = useState<File | null>(null)
    const [originalInfo, setOriginalInfo] = useState<ImageInfo | null>(null)
    const [exif, setExif] = useState<ExifSummary | null>(null)
    const [cleanedBlob, setCleanedBlob] = useState<Blob | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const preview = useObjectUrl(file)
    const { error, success } = useToast()

    const handleFile = useCallback(async (selectedFile: File) => {
        setFile(selectedFile)
        setCleanedBlob(null)
        setExif(null)
        try {
            setOriginalInfo(await getImageInfo(selectedFile))
            setExif(await parseExif(selectedFile))
        } catch (err) {
            error(err instanceof Error ? err.message : 'Could not read the image')
        }
    }, [error])

    const handleClean = async () => {
        if (!file) return
        setIsProcessing(true)
        try {
            const img = await loadImage(file)
            const canvas = document.createElement('canvas')
            canvas.width = img.naturalWidth || img.width
            canvas.height = img.naturalHeight || img.height
            const ctx = canvas.getContext('2d')
            if (!ctx) throw new Error('Canvas is not available')

            const format = getOutputMime(file.type)
            if (format === 'image/jpeg') {
                ctx.fillStyle = '#ffffff'
                ctx.fillRect(0, 0, canvas.width, canvas.height)
            }
            ctx.drawImage(img, 0, 0)

            const blob = await canvasToBlob(canvas, format, 0.92)
            setCleanedBlob(blob)
            success('Metadata removed. The clean copy is ready.')
        } catch (err) {
            error(err instanceof Error ? err.message : 'Could not clean the image')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleDownload = () => {
        if (!cleanedBlob || !file) return
        downloadBlob(cleanedBlob, buildOutputName(file.name, 'clean', getExtension(cleanedBlob.type)))
    }

    const handleReset = () => {
        setFile(null)
        setOriginalInfo(null)
        setExif(null)
        setCleanedBlob(null)
    }

    const hasFields = exif ? Object.keys(exif.fields).length > 0 : false
    const isJpeg = file ? file.type === 'image/jpeg' || file.type === 'image/jpg' : false

    return (
        <div className="tool-page">
            <div className="tool-header">
                <button className="back-button" onClick={onBack}>←</button>
                <h1 className="tool-title">EXIF Privacy Cleaner</h1>
            </div>

            {!file ? (
                <Dropzone
                    onFiles={(files) => void handleFile(files[0])}
                    icon="🔒"
                    title="Drop your image here or click to browse"
                    hint="Remove GPS location, camera info, and other hidden metadata"
                />
            ) : (
                <>
                    <div className="image-preview-container">
                        {preview && <img src={preview} alt="Preview" className="image-preview" />}
                        <div className="image-info">
                            <span className="info-badge">
                                <span className="info-badge-label">Size:</span>
                                <span className="info-badge-value">{originalInfo ? formatFileSize(originalInfo.size) : '-'}</span>
                            </span>
                            <span className="info-badge">
                                <span className="info-badge-label">Dimensions:</span>
                                <span className="info-badge-value">{originalInfo ? `${originalInfo.width}×${originalInfo.height}` : '-'}</span>
                            </span>
                        </div>
                    </div>

                    {exif && (
                        <div className="controls-panel" style={{ marginTop: '1.5rem' }}>
                            <h3 style={{ marginBottom: '1rem', color: hasFields ? '#f5576c' : '#38ef7d' }}>
                                {hasFields ? '⚠️ Metadata Found' : '✅ No Hidden Metadata Found'}
                            </h3>

                            {!isJpeg && (
                                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1rem' }}>
                                    EXIF inspection is available for JPEG files. Re-encoding still strips metadata from {file.type || 'this format'}.
                                </p>
                            )}

                            {hasFields && (
                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                    {Object.entries(exif.fields).map(([key, value]) => (
                                        <div key={key} className="info-badge" style={{ justifyContent: 'space-between', width: '100%' }}>
                                            <span className="info-badge-label">{key}</span>
                                            <span className="info-badge-value" style={{ color: '#f5576c', textAlign: 'right', overflowWrap: 'anywhere' }}>{value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!cleanedBlob && hasFields && (
                                <div className="warning-banner" style={{ marginTop: '1rem' }}>
                                    🚨 This image may reveal your location, device, and when it was taken.
                                </div>
                            )}

                            {cleanedBlob && (
                                <div className="success-banner" style={{ marginTop: '1rem' }}>
                                    ✅ Metadata removed. Download the clean copy below.
                                </div>
                            )}
                        </div>
                    )}

                    <div className="actions-bar">
                        <button className="secondary-button" onClick={handleReset}>
                            🔄 Upload New Image
                        </button>
                        {!cleanedBlob ? (
                            <button className="download-button" onClick={() => void handleClean()} disabled={isProcessing}>
                                {isProcessing ? '⏳ Cleaning...' : '🧹 Remove All Metadata'}
                            </button>
                        ) : (
                            <button className="download-button" onClick={handleDownload}>
                                ⬇️ Download Clean Image
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
