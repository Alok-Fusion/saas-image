import { jsPDF } from 'jspdf'
import { useCallback, useRef, useState } from 'react'
import { formatFileSize, getImageInfo, type ImageInfo } from '../utils/imageProcessing'

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
    const [isDragging, setIsDragging] = useState(false)
    const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'fit'>('a4')
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
    const [margin, setMargin] = useState(10)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Handle file selection
    const handleFiles = useCallback(async (selectedFiles: FileList) => {
        const imageFiles = Array.from(selectedFiles).filter(f => f.type.startsWith('image/'))

        if (imageFiles.length === 0) {
            alert('Please select image files')
            return
        }

        const newImages: ImageFile[] = []

        for (const file of imageFiles) {
            const url = URL.createObjectURL(file)
            const info = await getImageInfo(file)
            newImages.push({ file, url, info })
        }

        setImages([...images, ...newImages])
    }, [images])

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
        if (e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files)
        }
    }, [handleFiles])

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

    // Generate PDF
    const generatePdf = async () => {
        if (images.length === 0) return

        setIsProcessing(true)

        try {
            let pdf: jsPDF

            if (pageSize === 'fit') {
                // Create PDF with first image size
                const firstImg = images[0]
                pdf = new jsPDF({
                    orientation: firstImg.info.width > firstImg.info.height ? 'landscape' : 'portrait',
                    unit: 'px',
                    format: [firstImg.info.width, firstImg.info.height]
                })
            } else {
                pdf = new jsPDF({
                    orientation,
                    unit: 'mm',
                    format: pageSize
                })
            }

            for (let i = 0; i < images.length; i++) {
                const img = images[i]

                if (i > 0) {
                    if (pageSize === 'fit') {
                        pdf.addPage([img.info.width, img.info.height], img.info.width > img.info.height ? 'landscape' : 'portrait')
                    } else {
                        pdf.addPage()
                    }
                }

                const pageWidth = pdf.internal.pageSize.getWidth()
                const pageHeight = pdf.internal.pageSize.getHeight()

                if (pageSize === 'fit') {
                    pdf.addImage(img.url, 'JPEG', 0, 0, img.info.width, img.info.height)
                } else {
                    // Calculate dimensions to fit within margins
                    const availableWidth = pageWidth - (margin * 2)
                    const availableHeight = pageHeight - (margin * 2)

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

                    pdf.addImage(img.url, 'JPEG', x, y, imgWidth, imgHeight)
                }
            }

            pdf.save('images.pdf')
        } catch (error) {
            console.error('Error generating PDF:', error)
            alert('Error generating PDF')
        } finally {
            setIsProcessing(false)
        }
    }

    // Reset
    const handleReset = () => {
        images.forEach(img => URL.revokeObjectURL(img.url))
        setImages([])
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    return (
        <div className="tool-page">
            <div className="tool-header">
                <button className="back-button" onClick={onBack}>←</button>
                <h1 className="tool-title">Image to PDF</h1>
            </div>

            {/* Upload Area */}
            <div
                className={`dropzone ${isDragging ? 'dragging' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="dropzone-content">
                    <div className="dropzone-icon">📄</div>
                    <p className="dropzone-text">Drop images here or click to browse</p>
                    <p className="dropzone-hint">Convert multiple images into a single PDF document</p>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => e.target.files && handleFiles(e.target.files)}
                    style={{ display: 'none' }}
                />
            </div>

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
                            className="secondary-button"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            ➕ Add More
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

            {/* Processing Overlay */}
            {isProcessing && (
                <div className="processing-overlay">
                    <div className="processing-content">
                        <div className="processing-spinner" />
                        <div className="processing-text">Generating PDF...</div>
                    </div>
                </div>
            )}
        </div>
    )
}
