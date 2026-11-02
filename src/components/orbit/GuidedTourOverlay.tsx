import React, { useEffect } from 'react'
import { useScene } from '../scene/sceneContext'
import { X, Play } from 'lucide-react'

const TOUR_STEPS = [
    {
        toolId: 'compressor',
        tag: '01 / 06 · ESSENTIALS',
        title: 'Image Compressor',
        caption: 'Shrink massive JPEGs, PNGs and WebP files by up to 90% without visible quality loss.',
    },
    {
        toolId: 'cropper',
        tag: '02 / 06 · EDIT',
        title: 'Precision Cropper',
        caption: 'Golden ratio framing, custom aspect ratios, and instant social media crops.',
    },
    {
        toolId: 'background-remover',
        tag: '03 / 06 · AI CUTOUT',
        title: 'Background Remover',
        caption: 'AI-powered subject extraction running 100% in local memory. Never sent to a server.',
    },
    {
        toolId: 'image-to-pdf',
        tag: '04 / 06 · PDF SUITE',
        title: 'Image to PDF Converter',
        caption: 'Combine batches of photos into a pristine, high-density PDF document in seconds.',
    },
    {
        toolId: 'ocr',
        tag: '05 / 06 · OCR EXTRACTOR',
        title: 'OCR Text Extractor',
        caption: 'Scan screenshots and invoices to extract clean, editable text in 12 languages.',
    },
    {
        toolId: 'exif-cleaner',
        tag: '06 / 06 · PRIVACY',
        title: 'EXIF Privacy Cleaner',
        caption: 'Permanently wipe GPS coordinates, camera serials, and hidden metadata before sharing.',
    },
]

export const GuidedTourOverlay: React.FC<{ onSelectTool: (id: string) => void }> = ({ onSelectTool }) => {
    const { isTourActive, setIsTourActive, tourStep, setTourStep, setHoveredToolId } = useScene()

    useEffect(() => {
        if (!isTourActive) return

        // Set hovered tool for the current step so the orbit node highlights
        const current = TOUR_STEPS[tourStep % TOUR_STEPS.length]
        setHoveredToolId(current.toolId)

        // Advance to next step every 3.3 seconds
        const timer = setInterval(() => {
            setTourStep((prev) => {
                if (prev >= TOUR_STEPS.length - 1) {
                    setIsTourActive(false)
                    setHoveredToolId(null)
                    return 0
                }
                return prev + 1
            })
        }, 3300)

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
                setIsTourActive(false)
                setHoveredToolId(null)
            }
        }

        window.addEventListener('keydown', handleKeyDown)

        return () => {
            clearInterval(timer)
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [isTourActive, tourStep, setIsTourActive, setTourStep, setHoveredToolId])

    if (!isTourActive) return null

    const step = TOUR_STEPS[tourStep % TOUR_STEPS.length]

    return (
        <div
            className="guided-tour-overlay"
            role="region"
            aria-label="20-second guided tour"
            onClick={() => {
                setIsTourActive(false)
                setHoveredToolId(null)
            }}
        >
            <div className="tour-badge-pill">
                <Play size={12} fill="currentColor" />
                <span>20-Second Guided Tour</span>
            </div>

            <div
                className="tour-caption-card"
                onClick={(e) => {
                    e.stopPropagation()
                    setIsTourActive(false)
                    onSelectTool(step.toolId)
                }}
            >
                <div className="tour-card-top">
                    <span className="tour-tag">{step.tag}</span>
                    <button
                        type="button"
                        className="tour-dismiss-btn"
                        onClick={(e) => {
                            e.stopPropagation()
                            setIsTourActive(false)
                            setHoveredToolId(null)
                        }}
                        aria-label="Exit tour"
                    >
                        <X size={14} />
                    </button>
                </div>

                <h2 className="tour-title">{step.title}</h2>
                <p className="tour-desc">{step.caption}</p>

                {/* Progress Indicators */}
                <div className="tour-progress-track">
                    {TOUR_STEPS.map((_, idx) => (
                        <div
                            key={idx}
                            className={`tour-step-dot ${idx === tourStep ? 'is-active' : idx < tourStep ? 'is-done' : ''}`}
                        />
                    ))}
                </div>

                <div className="tour-footer-hint">
                    <span>Click card to open this tool</span>
                    <span className="tour-esc-hint">Esc to exit</span>
                </div>
            </div>
        </div>
    )
}

export default GuidedTourOverlay
