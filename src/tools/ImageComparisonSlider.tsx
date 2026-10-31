import { useCallback, useEffect, useRef, useState } from 'react'
import Dropzone from '../components/Dropzone'
import { useToast } from '../components/Toast'
import { useObjectUrl } from '../hooks/useObjectUrl'
import { getImageInfo, type ImageInfo } from '../utils/imageProcessing'

interface ImageComparisonSliderProps {
    onBack: () => void
}

interface ComparisonImage {
    file: File
    info: ImageInfo
}

export default function ImageComparisonSlider({ onBack }: ImageComparisonSliderProps) {
    const [image1, setImage1] = useState<ComparisonImage | null>(null)
    const [image2, setImage2] = useState<ComparisonImage | null>(null)
    const [sliderPosition, setSliderPosition] = useState(50)
    const [isDragging, setIsDragging] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const preview1 = useObjectUrl(image1?.file ?? null)
    const preview2 = useObjectUrl(image2?.file ?? null)
    const { error } = useToast()

    const loadImage = useCallback(async (selectedFile: File, slot: 1 | 2) => {
        try {
            const info = await getImageInfo(selectedFile)
            const next = { file: selectedFile, info }
            if (slot === 1) setImage1(next)
            else setImage2(next)
        } catch (err) {
            error(err instanceof Error ? err.message : 'Could not read the image')
        }
    }, [error])

    const updateFromClientX = useCallback((clientX: number) => {
        const container = containerRef.current
        if (!container) return
        const rect = container.getBoundingClientRect()
        if (rect.width === 0) return
        const percentage = ((clientX - rect.left) / rect.width) * 100
        setSliderPosition(Math.max(0, Math.min(100, percentage)))
    }, [])

    useEffect(() => {
        if (!isDragging) return
        const onMove = (event: PointerEvent) => {
            event.preventDefault()
            updateFromClientX(event.clientX)
        }
        const stop = () => setIsDragging(false)
        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', stop)
        window.addEventListener('pointercancel', stop)
        return () => {
            window.removeEventListener('pointermove', onMove)
            window.removeEventListener('pointerup', stop)
            window.removeEventListener('pointercancel', stop)
        }
    }, [isDragging, updateFromClientX])

    const handleReset = () => {
        setImage1(null)
        setImage2(null)
        setSliderPosition(50)
    }

    const bothImagesLoaded = Boolean(image1 && image2)

    return (
        <div className="tool-page">
            <div className="tool-header">
                <button className="back-button" onClick={onBack}>←</button>
                <h1 className="tool-title">Image Comparison Slider</h1>
            </div>

            {!bothImagesLoaded ? (
                <>
                    <div className="comparison-upload-grid">
                        <Dropzone
                            onFiles={(files) => { void loadImage(files[0], 1) }}
                            title={image1 ? 'Replace first image' : 'First Image (Before)'}
                            icon="1️⃣"
                            enablePaste
                        >
                            {preview1 && image1 && (
                                <div style={{ textAlign: 'center' }}>
                                    <img src={preview1} alt="First" style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 8 }} />
                                    <p style={{ marginTop: '0.5rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
                                        {image1.info.width}×{image1.info.height}
                                    </p>
                                </div>
                            )}
                        </Dropzone>
                        <Dropzone
                            onFiles={(files) => { void loadImage(files[0], 2) }}
                            title={image2 ? 'Replace second image' : 'Second Image (After)'}
                            icon="2️⃣"
                            enablePaste={false}
                        >
                            {preview2 && image2 && (
                                <div style={{ textAlign: 'center' }}>
                                    <img src={preview2} alt="Second" style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 8 }} />
                                    <p style={{ marginTop: '0.5rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
                                        {image2.info.width}×{image2.info.height}
                                    </p>
                                </div>
                            )}
                        </Dropzone>
                    </div>

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
                    <div
                        ref={containerRef}
                        className="comparison-slider"
                        style={{
                            position: 'relative',
                            width: '100%',
                            maxWidth: '800px',
                            margin: '0 auto',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            cursor: 'ew-resize',
                            userSelect: 'none',
                            touchAction: 'none'
                        }}
                        onPointerDown={(event) => {
                            setIsDragging(true)
                            updateFromClientX(event.clientX)
                        }}
                    >
                        <img
                            src={preview2 ?? undefined}
                            alt="After"
                            style={{ width: '100%', display: 'block' }}
                            draggable={false}
                        />

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
                                src={preview1 ?? undefined}
                                alt="Before"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                draggable={false}
                            />
                        </div>

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

                        <div
                            role="slider"
                            tabIndex={0}
                            aria-label="Comparison position"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={Math.round(sliderPosition)}
                            onKeyDown={(event) => {
                                if (event.key === 'ArrowLeft') {
                                    event.preventDefault()
                                    setSliderPosition((value) => Math.max(0, value - 2))
                                } else if (event.key === 'ArrowRight') {
                                    event.preventDefault()
                                    setSliderPosition((value) => Math.min(100, value + 2))
                                } else if (event.key === 'Home') {
                                    event.preventDefault()
                                    setSliderPosition(0)
                                } else if (event.key === 'End') {
                                    event.preventDefault()
                                    setSliderPosition(100)
                                }
                            }}
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

                        <div style={labelStyle('left')}>Before</div>
                        <div style={labelStyle('right')}>After</div>
                    </div>

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
                                onChange={(event) => setSliderPosition(Number(event.target.value))}
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>

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

function labelStyle(side: 'left' | 'right') {
    return {
        position: 'absolute' as const,
        bottom: '1rem',
        [side]: '1rem',
        padding: '0.5rem 1rem',
        background: 'rgba(0,0,0,0.7)',
        borderRadius: '8px',
        color: 'white',
        fontSize: '0.875rem',
        fontWeight: 600,
    }
}
