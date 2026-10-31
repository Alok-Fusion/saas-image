import { useCallback, useEffect, useRef, useState } from 'react'
import Dropzone from '../components/Dropzone'
import { useToast } from '../components/Toast'
import {
    buildOutputName,
    formatFileSize,
    getImageInfo,
    loadImage,
    type ImageInfo,
} from '../utils/imageProcessing'

interface ImageToPdfProps {
    onBack: () => void
}

interface ImageFile {
    file: File
    url: string
    info: ImageInfo
}

export default function ImageToPdf({ onBack }: ImageToPdfProps) {
    const [images, setImages] = useState<ImageFile[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [progress, setProgress] = useState(0)
    const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'fit'>('a4')
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
    const [margin, setMargin] = useState(10)
    const imagesRef = useRef<ImageFile[]>([])
    const cancelRef = useRef(false)
    const { error } = useToast()

    useEffect(() => {
        imagesRef.current = images
    }, [images])

    useEffect(() => () => {
        imagesRef.current.forEach((image) => URL.revokeObjectURL(image.url))
    }, [])

    const handleFiles = useCallback(async (selectedFiles: File[]) => {
        if (selectedFiles.length === 0) return
        const newImages: ImageFile[] = []

        try {
            for (const file of selectedFiles) {
                const url = URL.createObjectURL(file)
                const info = await getImageInfo(file)
                newImages.push({ file, url, info })
            }
            setImages((current) => [...current, ...newImages])
        } catch (err) {
            newImages.forEach((image) => URL.revokeObjectURL(image.url))
            error(err instanceof Error ? err.message : 'Could not add one of the images')
        }
    }, [error])

    const toPdfDataUrl = async (image: ImageFile): Promise<string> => {
        const img = await loadImage(image.file)
        const canvas = document.createElement('canvas')
        canvas.width = image.info.width
        canvas.height = image.info.height
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Canvas is not available')

        const isJpeg = image.file.type === 'image/jpeg'
        if (isJpeg) {
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        return canvas.toDataURL(isJpeg ? 'image/jpeg' : 'image/png', 0.92)
    }

    // Remove image
    const removeImage = (index: number) => {
        const newImages = [...images]
        URL.revokeObjectURL(newImages[index].url)
        newImages.splice(index, 1)
        setImages(newImages)
    }

    // Move image up/down
    const moveImage = (index: number, direction: 'up' | 'down') => {
        const newImages = [...images]
        const newIndex = direction === 'up' ? index - 1 : index + 1
        if (newIndex < 0 || newIndex >= newImages.length) return
        [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]]
        setImages(newImages)
    }

    const generatePdf = async () => {
        if (images.length === 0 || isProcessing) return

        setIsProcessing(true)
        setProgress(0)
        cancelRef.current = false

        try {
            const { jsPDF } = await import('jspdf')
            let pdf: InstanceType<typeof jsPDF>

            if (pageSize === 'fit') {
                const firstImg = images[0]
                pdf = new jsPDF({
                    orientation: firstImg.info.width > firstImg.info.height ? 'landscape' : 'portrait',
                    unit: 'px',
                    format: [firstImg.info.width, firstImg.info.height],
                })
            } else {
                pdf = new jsPDF({ orientation, unit: 'mm', format: pageSize })
            }

            for (let i = 0; i < images.length; i++) {
                if (cancelRef.current) return
                const img = images[i]
                const dataUrl = await toPdfDataUrl(img)
                const format = img.file.type === 'image/jpeg' ? 'JPEG' : 'PNG'

                if (i > 0) {
                    if (pageSize === 'fit') {
                        pdf.addPage(
                            [img.info.width, img.info.height],
                            img.info.width > img.info.height ? 'landscape' : 'portrait'
                        )
                    } else {
                        pdf.addPage()
                    }
                }

                const pageWidth = pdf.internal.pageSize.getWidth()
                const pageHeight = pdf.internal.pageSize.getHeight()

                if (pageSize === 'fit') {
                    pdf.addImage(dataUrl, format, 0, 0, img.info.width, img.info.height)
                } else {
                    const availableWidth = pageWidth - margin * 2
                    const availableHeight = pageHeight - margin * 2
                    const imgRatio = img.info.width / img.info.height
                    const pageRatio = availableWidth / availableHeight

                    let imgWidth: number
                    let imgHeight: number

                    if (imgRatio > pageRatio) {
                        imgWidth = availableWidth
                        imgHeight = availableWidth / imgRatio
                    } else {
                        imgHeight = availableHeight
                        imgWidth = availableHeight * imgRatio
                    }

                    const x = margin + (availableWidth - imgWidth) / 2
                    const y = margin + (availableHeight - imgHeight) / 2
                    pdf.addImage(dataUrl, format, x, y, imgWidth, imgHeight)
                }

                setProgress(Math.round(((i + 1) / images.length) * 100))
            }

            if (cancelRef.current) return
            const baseName = images[0].file.name.replace(/\.[^/.]+$/, '')
            pdf.save(buildOutputName(baseName, images.length > 1 ? `${images.length}-images` : 'document', 'pdf'))
        } catch (err) {
            error(err instanceof Error ? err.message : 'Could not generate the PDF')
        } finally {
            setIsProcessing(false)
            setProgress(0)
        }
    }

    const handleReset = () => {
        images.forEach((img) => URL.revokeObjectURL(img.url))
        setImages([])
    }

    return (
        <div className="tool-page">
            <div className="tool-header">
                <button className="back-button" onClick={onBack}>←</button>
                <h1 className="tool-title">Image to PDF</h1>
            </div>

            <Dropzone
                onFiles={handleFiles}
                multiple
                icon="📄"
                title={images.length > 0 ? 'Add more images' : 'Drop images here or click to browse'}
                hint="Convert multiple images into a single PDF document"
            />

            {/* Image List */}
            {images.length > 0 && (
                <>
                    <div className="controls-panel" style={{ marginTop: '1.5rem' }}>
                        <h4 style={{ marginBottom: '1rem' }}>Images ({images.length})</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {images.map((img, index) => (
                                <div
                                    key={index}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '0.75rem',
                                        background: 'rgba(255,255,255,0.03)',
                                        borderRadius: '8px'
                                    }}
                                >
                                    <img
                                        src={img.url}
                                        alt={`Image ${index + 1}`}
                                        style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Page {index + 1}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                                            {img.info.width}×{img.info.height} • {formatFileSize(img.info.size)}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                        <button
                                            onClick={() => moveImage(index, 'up')}
                                            disabled={index === 0}
                                            style={{
                                                padding: '0.5rem',
                                                background: 'rgba(255,255,255,0.1)',
                                                border: 'none',
                                                borderRadius: 6,
                                                cursor: index === 0 ? 'not-allowed' : 'pointer',
                                                opacity: index === 0 ? 0.3 : 1,
                                                color: 'white'
                                            }}
                                        >
                                            ↑
                                        </button>
                                        <button
                                            onClick={() => moveImage(index, 'down')}
                                            disabled={index === images.length - 1}
                                            style={{
                                                padding: '0.5rem',
                                                background: 'rgba(255,255,255,0.1)',
                                                border: 'none',
                                                borderRadius: 6,
                                                cursor: index === images.length - 1 ? 'not-allowed' : 'pointer',
                                                opacity: index === images.length - 1 ? 0.3 : 1,
                                                color: 'white'
                                            }}
                                        >
                                            ↓
                                        </button>
                                        <button
                                            onClick={() => removeImage(index)}
                                            style={{
                                                padding: '0.5rem',
                                                background: 'rgba(245, 87, 108, 0.2)',
                                                border: 'none',
                                                borderRadius: 6,
                                                cursor: 'pointer',
                                                color: '#f5576c'
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* PDF Options */}
                    <div className="controls-panel" style={{ marginTop: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                            <div className="control-group">
                                <label className="control-label"><span>Page Size</span></label>
                                <div className="select-buttons">
                                    <button className={`select-button ${pageSize === 'a4' ? 'active' : ''}`} onClick={() => setPageSize('a4')}>A4</button>
                                    <button className={`select-button ${pageSize === 'letter' ? 'active' : ''}`} onClick={() => setPageSize('letter')}>Letter</button>
                                    <button className={`select-button ${pageSize === 'fit' ? 'active' : ''}`} onClick={() => setPageSize('fit')}>Fit Image</button>
                                </div>
                            </div>

                            {pageSize !== 'fit' && (
                                <>
                                    <div className="control-group">
                                        <label className="control-label"><span>Orientation</span></label>
                                        <div className="select-buttons">
                                            <button className={`select-button ${orientation === 'portrait' ? 'active' : ''}`} onClick={() => setOrientation('portrait')}>Portrait</button>
                                            <button className={`select-button ${orientation === 'landscape' ? 'active' : ''}`} onClick={() => setOrientation('landscape')}>Landscape</button>
                                        </div>
                                    </div>

                                    <div className="control-group">
                                        <label className="control-label">
                                            <span>Margin</span>
                                            <span className="control-value">{margin}mm</span>
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="30"
                                            value={margin}
                                            onChange={(e) => setMargin(Number(e.target.value))}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="actions-bar">
                        <button className="secondary-button" onClick={handleReset}>
                            🔄 Clear All
                        </button>
                        <button
                            className="download-button"
                            onClick={generatePdf}
                            disabled={isProcessing}
                        >
                            {isProcessing ? '⏳ Generating...' : `📄 Generate PDF (${images.length} pages)`}
                        </button>
                    </div>
                </>
            )}

            {isProcessing && (
                <div className="processing-overlay" role="status" aria-live="polite">
                    <div className="processing-content">
                        <div className="processing-spinner" />
                        <div className="processing-text">
                            Generating PDF… {progress > 0 ? `${progress}%` : ''}
                        </div>
                        <div className="progress-track" style={{ width: 220, marginTop: '0.75rem' }}>
                            <div className="progress-fill" style={{ width: `${progress}%` }} />
                        </div>
                        <button
                            className="secondary-button"
                            style={{ marginTop: '1rem' }}
                            onClick={() => { cancelRef.current = true }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
