import { useCallback, useRef, useState } from 'react'
import { downloadBlob, formatFileSize, getImageInfo, type ImageInfo } from '../utils/imageProcessing'

interface ExifCleanerProps {
    onBack: () => void
}

interface ExifData {
    [key: string]: string | number | undefined
}

export default function ExifCleaner({ onBack }: ExifCleanerProps) {
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [originalInfo, setOriginalInfo] = useState<ImageInfo | null>(null)
    const [exifData, setExifData] = useState<ExifData | null>(null)
    const [cleanedBlob, setCleanedBlob] = useState<Blob | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Parse EXIF data from image
    const parseExifData = async (imageFile: File): Promise<ExifData> => {
        return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                const view = new DataView(e.target?.result as ArrayBuffer)

                // Check for JPEG SOI marker
                if (view.getUint16(0) !== 0xFFD8) {
                    resolve({})
                    return
                }

                const exif: ExifData = {}
                let offset = 2

                while (offset < view.byteLength) {
                    if (view.getUint16(offset) === 0xFFE1) {
                        // Found EXIF APP1 marker
                        const exifHeader = view.getUint32(offset + 4)
                        if (exifHeader === 0x45786966) {
                            // "Exif" header found
                            exif['Has EXIF Data'] = 'Yes'
                            exif['⚠️ Location Data'] = 'Potentially present'
                            exif['⚠️ Camera Info'] = 'Potentially present'
                            exif['⚠️ Date/Time'] = 'Potentially present'
                            exif['⚠️ Software'] = 'Potentially present'
                        }
                        break
                    }

                    // Move to next marker
                    const markerLength = view.getUint16(offset + 2)
                    offset += 2 + markerLength
                }

                if (Object.keys(exif).length === 0) {
                    exif['Has EXIF Data'] = 'No metadata found'
                }

                resolve(exif)
            }
            reader.readAsArrayBuffer(imageFile)
        })
    }

    // Remove EXIF data by re-encoding the image
    const removeExifData = async (imageFile: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = new Image()
            const url = URL.createObjectURL(imageFile)

            img.onload = () => {
                URL.revokeObjectURL(url)

                const canvas = document.createElement('canvas')
                canvas.width = img.width
                canvas.height = img.height

                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'))
                    return
                }

                ctx.drawImage(img, 0, 0)

                // Convert to blob without EXIF
                canvas.toBlob(
                    (blob) => {
                        if (blob) resolve(blob)
                        else reject(new Error('Failed to create clean image'))
                    },
                    imageFile.type === 'image/png' ? 'image/png' : 'image/jpeg',
                    0.95
                )
            }

            img.onerror = () => {
                URL.revokeObjectURL(url)
                reject(new Error('Failed to load image'))
            }

            img.src = url
        })
    }

    // Handle file selection
    const handleFile = useCallback(async (selectedFile: File) => {
        if (!selectedFile.type.startsWith('image/')) {
            alert('Please select an image file')
            return
        }

        setFile(selectedFile)
        const url = URL.createObjectURL(selectedFile)
        setPreview(url)
        setCleanedBlob(null)

        try {
            const info = await getImageInfo(selectedFile)
            setOriginalInfo(info)

            const exif = await parseExifData(selectedFile)
            setExifData(exif)
        } catch (error) {
            console.error('Error processing image:', error)
        }
    }, [])

    // Handle drag and drop
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const droppedFile = e.dataTransfer.files[0]
        if (droppedFile) handleFile(droppedFile)
    }, [handleFile])

    // Clean the image
    const handleClean = async () => {
        if (!file) return

        setIsProcessing(true)
        try {
            const blob = await removeExifData(file)
            setCleanedBlob(blob)
        } catch (error) {
            console.error('Error cleaning image:', error)
            alert('Error processing image')
        } finally {
            setIsProcessing(false)
        }
    }

    // Download cleaned image
    const handleDownload = () => {
        if (!cleanedBlob || !file) return
        const baseName = file.name.replace(/\.[^/.]+$/, '')
        const ext = file.type === 'image/png' ? 'png' : 'jpg'
        downloadBlob(cleanedBlob, `${baseName}_clean.${ext}`)
    }

    // Reset
    const handleReset = () => {
        if (preview) URL.revokeObjectURL(preview)
        setFile(null)
        setPreview(null)
        setOriginalInfo(null)
        setExifData(null)
        setCleanedBlob(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    return (
        <div className="tool-page">
            <div className="tool-header">
                <button className="back-button" onClick={onBack}>←</button>
                <h1 className="tool-title">EXIF Privacy Cleaner</h1>
            </div>

            {!file ? (
                <div
                    className={`dropzone ${isDragging ? 'dragging' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div className="dropzone-content">
                        <div className="dropzone-icon">🔒</div>
                        <p className="dropzone-text">Drop your image here or click to browse</p>
                        <p className="dropzone-hint">Remove GPS location, camera info, and other hidden metadata</p>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                        style={{ display: 'none' }}
                    />
                </div>
            ) : (
                <>
                    {/* Image Preview */}
                    <div className="image-preview-container">
                        <img src={preview!} alt="Preview" className="image-preview" />
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

                    {/* EXIF Data Display */}
                    {exifData && (
                        <div className="controls-panel" style={{ marginTop: '1.5rem' }}>
                            <h3 style={{ marginBottom: '1rem', color: exifData['Has EXIF Data'] === 'Yes' ? '#f5576c' : '#38ef7d' }}>
                                {exifData['Has EXIF Data'] === 'Yes' ? '⚠️ Metadata Found' : '✅ No Metadata Found'}
                            </h3>

                            {exifData['Has EXIF Data'] === 'Yes' && (
                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                    {Object.entries(exifData).map(([key, value]) => (
                                        key !== 'Has EXIF Data' && (
                                            <div key={key} className="info-badge" style={{ justifyContent: 'space-between', width: '100%' }}>
                                                <span className="info-badge-label">{key}</span>
                                                <span className="info-badge-value" style={{ color: '#f5576c' }}>{String(value)}</span>
                                            </div>
                                        )
                                    ))}
                                </div>
                            )}

                            {!cleanedBlob && exifData['Has EXIF Data'] === 'Yes' && (
                                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(245, 87, 108, 0.1)', borderRadius: '12px' }}>
                                    <p style={{ color: '#f5576c', fontSize: '0.9rem' }}>
                                        🚨 This image may contain sensitive data like your location, device info, and when it was taken!
                                    </p>
                                </div>
                            )}

                            {cleanedBlob && (
                                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(56, 239, 125, 0.1)', borderRadius: '12px' }}>
                                    <p style={{ color: '#38ef7d', fontSize: '0.9rem' }}>
                                        ✅ Image cleaned! All metadata has been removed. Safe to share.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="actions-bar">
                        <button className="secondary-button" onClick={handleReset}>
                            🔄 Upload New Image
                        </button>
                        {!cleanedBlob ? (
                            <button
                                className="download-button"
                                onClick={handleClean}
                                disabled={isProcessing}
                            >
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
