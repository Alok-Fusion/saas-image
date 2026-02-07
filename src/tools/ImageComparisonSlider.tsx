import { useCallback, useRef, useState } from 'react';
import { getImageInfo, type ImageInfo } from '../utils/imageProcessing';

interface ImageComparisonSliderProps {
    onBack: () => void
}

export default function ImageComparisonSlider({ onBack }: ImageComparisonSliderProps) {
    const [image1, setImage1] = useState<{ file: File; url: string; info: ImageInfo } | null>(null)
    const [image2, setImage2] = useState<{ file: File; url: string; info: ImageInfo } | null>(null)
    const [sliderPosition, setSliderPosition] = useState(50)
    const [isDragging, setIsDragging] = useState(false)
    const [activeUpload, setActiveUpload] = useState<1 | 2>(1)
    const containerRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Handle file selection
    const handleFile = useCallback(async (selectedFile: File) => {
        if (!selectedFile.type.startsWith('image/')) {
            alert('Please select an image file')
            return
        }

        const url = URL.createObjectURL(selectedFile)
        const info = await getImageInfo(selectedFile)

        const imageData = { file: selectedFile, url, info }

        if (activeUpload === 1) {
            if (image1?.url) URL.revokeObjectURL(image1.url)
            setImage1(imageData)
        } else {
            if (image2?.url) URL.revokeObjectURL(image2.url)
            setImage2(imageData)
        }
    }, [activeUpload, image1, image2])

    // Handle drag and drop on dropzones
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent, slot: 1 | 2) => {
        e.preventDefault()
        setIsDragging(false)
        setActiveUpload(slot)
        const droppedFile = e.dataTransfer.files[0]
        if (droppedFile) handleFile(droppedFile)
    }, [handleFile])

    // Handle slider drag
    const handleSliderMouseDown = () => {
        setIsDragging(true)
    }

    const handleSliderMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging || !containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const percentage = (x / rect.width) * 100
        setSliderPosition(Math.max(0, Math.min(100, percentage)))
    }, [isDragging])

    const handleSliderMouseUp = () => {
        setIsDragging(false)
    }

    // Handle touch events
    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const x = e.touches[0].clientX - rect.left
        const percentage = (x / rect.width) * 100
        setSliderPosition(Math.max(0, Math.min(100, percentage)))
    }, [])

    // Reset
    const handleReset = () => {
        if (image1?.url) URL.revokeObjectURL(image1.url)
        if (image2?.url) URL.revokeObjectURL(image2.url)
        setImage1(null)
        setImage2(null)
        setSliderPosition(50)
    }

    const bothImagesLoaded = image1 && image2

    return (
        <div className="tool-page">
            <div className="tool-header">
                <button className="back-button" onClick={onBack}>←</button>
                <h1 className="tool-title">Image Comparison Slider</h1>
            </div>

            {!bothImagesLoaded ? (
                <>
                    {/* Upload Two Images */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        {/* Image 1 */}
                        <div
                            className={`dropzone ${isDragging && activeUpload === 1 ? 'dragging' : ''}`}
                            onClick={() => { setActiveUpload(1); fileInputRef.current?.click() }}
                            onDragOver={(e) => { handleDragOver(e); setActiveUpload(1) }}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, 1)}
                            style={{ minHeight: '200px' }}
                        >
                            {image1 ? (
                                <div style={{ textAlign: 'center' }}>
                                    <img src={image1.url} alt="Image 1" style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '8px' }} />
                                    <p style={{ marginTop: '0.5rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
                                        {image1.info.width}×{image1.info.height}
                                    </p>
                                </div>
                            ) : (
                                <div className="dropzone-content">
                                    <div className="dropzone-icon" style={{ fontSize: '2rem' }}>1️⃣</div>
                                    <p className="dropzone-text" style={{ fontSize: '1rem' }}>First Image (Before)</p>
                                </div>
                            )}
                        </div>

                        {/* Image 2 */}
                        <div
                            className={`dropzone ${isDragging && activeUpload === 2 ? 'dragging' : ''}`}
                            onClick={() => { setActiveUpload(2); fileInputRef.current?.click() }}
                            onDragOver={(e) => { handleDragOver(e); setActiveUpload(2) }}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, 2)}
                            style={{ minHeight: '200px' }}
                        >
                            {image2 ? (
                                <div style={{ textAlign: 'center' }}>
                                    <img src={image2.url} alt="Image 2" style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '8px' }} />
                                    <p style={{ marginTop: '0.5rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
                                        {image2.info.width}×{image2.info.height}
                                    </p>
                                </div>
                            ) : (
                                <div className="dropzone-content">
                                    <div className="dropzone-icon" style={{ fontSize: '2rem' }}>2️⃣</div>
                                    <p className="dropzone-text" style={{ fontSize: '1rem' }}>Second Image (After)</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                        style={{ display: 'none' }}
                    />

                    <div style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        background: 'rgba(102, 126, 234, 0.1)',
                        borderRadius: '12px',
                        textAlign: 'center',
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: '0.875rem'
                    }}>
                        ℹ️ Upload two images to compare them with an interactive slider
                    </div>
                </>
            ) : (
                <>
                    {/* Comparison Slider */}
                    <div
                        ref={containerRef}
                        style={{
                            position: 'relative',
                            width: '100%',
                            maxWidth: '800px',
                            margin: '0 auto',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            cursor: 'ew-resize',
                            userSelect: 'none'
                        }}
                        onMouseMove={handleSliderMouseMove}
                        onMouseUp={handleSliderMouseUp}
                        onMouseLeave={handleSliderMouseUp}
                        onTouchMove={handleTouchMove}
                    >
                        {/* Image 2 (Background - Right side) */}
                        <img
                            src={image2.url}
                            alt="After"
                            style={{
                                width: '100%',
                                display: 'block'
                            }}
                            draggable={false}
                        />

                        {/* Image 1 (Overlay - Left side with clip) */}
                        <div
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`
                            }}
                        >
                            <img
                                src={image1.url}
                                alt="Before"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                                draggable={false}
                            />
                        </div>

                        {/* Slider Line */}
                        <div
                            style={{
                                position: 'absolute',
                                top: 0,
                                bottom: 0,
                                left: `${sliderPosition}%`,
                                width: '4px',
                                background: 'white',
                                transform: 'translateX(-50%)',
                                boxShadow: '0 0 10px rgba(0,0,0,0.5)'
                            }}
                        />

                        {/* Slider Handle */}
                        <div
                            onMouseDown={handleSliderMouseDown}
                            onTouchStart={handleSliderMouseDown}
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: `${sliderPosition}%`,
                                width: '48px',
                                height: '48px',
                                background: 'white',
                                borderRadius: '50%',
                                transform: 'translate(-50%, -50%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                                cursor: 'ew-resize',
                                zIndex: 10,
                                fontSize: '1.5rem'
                            }}
                        >
                            ↔️
                        </div>

                        {/* Labels */}
                        <div style={{
                            position: 'absolute',
                            bottom: '1rem',
                            left: '1rem',
                            padding: '0.5rem 1rem',
                            background: 'rgba(0,0,0,0.7)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '0.875rem',
                            fontWeight: 600
                        }}>
                            Before
                        </div>
                        <div style={{
                            position: 'absolute',
                            bottom: '1rem',
                            right: '1rem',
                            padding: '0.5rem 1rem',
                            background: 'rgba(0,0,0,0.7)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '0.875rem',
                            fontWeight: 600
                        }}>
                            After
                        </div>
                    </div>

                    {/* Slider Position Control */}
                    <div className="controls-panel" style={{ marginTop: '1.5rem', maxWidth: '800px', margin: '1.5rem auto 0' }}>
                        <div className="control-group">
                            <label className="control-label">
                                <span>Slider Position</span>
                                <span className="control-value">{Math.round(sliderPosition)}%</span>
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={sliderPosition}
                                onChange={(e) => setSliderPosition(Number(e.target.value))}
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="actions-bar">
                        <button className="secondary-button" onClick={handleReset}>
                            🔄 Compare New Images
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
