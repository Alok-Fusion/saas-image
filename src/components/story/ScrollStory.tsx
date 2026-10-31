import React, { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowDown, ArrowUpRight, Sparkles } from 'lucide-react'
import { useScene } from '../scene/sceneContext'
import { useSmoothScroll } from '../smoothScrollContext'

gsap.registerPlugin(ScrollTrigger)

interface ScrollStoryProps {
    onSelectTool: (toolId: string) => void
    onOpenSearch: () => void
    is3DEnabled: boolean
}

interface ChapterData {
    id: string
    index: string
    title: string
    subtitle: string
    metricLabel?: string
    metricFrom?: string
    metricTo?: string
    toolId: string
    toolLabel: string
}

const CHAPTERS: ChapterData[] = [
    {
        id: 'compress',
        index: '01',
        title: 'Instant Squeeze.',
        subtitle: 'Cut 90% of file weight with pure mathematical precision. Zero artifacting, zero server uploads.',
        metricLabel: 'PAYLOAD REDUCTION',
        metricFrom: '8.4 MB',
        metricTo: '640 KB',
        toolId: 'compressor',
        toolLabel: 'Open Image Compressor',
    },
    {
        id: 'crop',
        index: '02',
        title: 'Architectural Framing.',
        subtitle: 'Snap between 1:1, 16:9, and 9:16 aspect ratios. Grid-aligned and pixel-locked for any canvas.',
        metricLabel: 'ASPECT ACCURACY',
        metricFrom: 'Freeform',
        metricTo: '16:9 Cinema',
        toolId: 'cropper',
        toolLabel: 'Open Image Cropper',
    },
    {
        id: 'remove-bg',
        index: '03',
        title: 'Depth Separation.',
        subtitle: 'Isolate subjects locally in 3D parallax. Neural segmentation dissolves backgrounds on-device.',
        metricLabel: 'LOCAL INFERENCE',
        metricFrom: 'ONNX WebAssembly',
        metricTo: 'Alpha 0.0',
        toolId: 'background-remover',
        toolLabel: 'Open Background Remover',
    },
    {
        id: 'pdf',
        index: '04',
        title: 'Multi-Page Synthesis.',
        subtitle: 'Fold, sequence, and bind high-resolution image stacks into crisp, archival-grade PDF folios.',
        metricLabel: 'DOCUMENT ASSEMBLY',
        metricFrom: '12 Raster Plates',
        metricTo: 'Vector PDF',
        toolId: 'image-to-pdf',
        toolLabel: 'Open Image to PDF',
    },
    {
        id: 'ocr',
        index: '05',
        title: 'Laser Inscription.',
        subtitle: 'Scan raster documents in 12 languages. Instant client-side optical character recognition.',
        metricLabel: 'CHARACTER RECOGNITION',
        metricFrom: 'Pixel Scan',
        metricTo: 'Plain Text UTF-8',
        toolId: 'ocr',
        toolLabel: 'Open OCR Extractor',
    },
    {
        id: 'privacy',
        index: '06',
        title: 'Zero Trace.',
        subtitle: 'Strip GPS coordinates, device serials, and timestamps. Nothing ever leaves your machine. Ever.',
        metricLabel: 'PRIVACY ASSURANCE',
        metricFrom: 'GPS & EXIF Tags',
        metricTo: '100% Sanitized',
        toolId: 'exif-cleaner',
        toolLabel: 'Open EXIF Cleaner',
    },
    {
        id: 'mockup',
        index: '07',
        title: 'Instant Stage.',
        subtitle: 'Frame your visual assets inside vector-accurate flagship devices and studio displays.',
        metricLabel: 'HARDWARE FRAME',
        metricFrom: 'Flat Graphic',
        metricTo: '3D Studio Render',
        toolId: 'device-mockup',
        toolLabel: 'Open Mockup Generator',
    },
]

export const ScrollStory: React.FC<ScrollStoryProps> = ({
    onSelectTool,
    onOpenSearch,
    is3DEnabled,
}) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const { setScrollProgress, setActiveChapter } = useScene()
    const { scrollTo } = useSmoothScroll()
    const [currentDot, setCurrentDot] = useState(0)

    useEffect(() => {
        if (!containerRef.current) return

        const trigger = ScrollTrigger.create({
            trigger: containerRef.current,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.6,
            onUpdate: (self) => {
                const progress = self.progress
                setScrollProgress(progress)

                // Chapter index 0 to 7
                const chapterIdx = Math.min(7, Math.floor(progress * 8))
                setActiveChapter(chapterIdx)
                setCurrentDot(chapterIdx)
            },
        })

        return () => {
            trigger.kill()
        }
    }, [setScrollProgress, setActiveChapter])

    const handleJumpToChapter = (idx: number) => {
        if (!containerRef.current) return
        const totalHeight = containerRef.current.scrollHeight
        const targetScroll = (idx / 8) * totalHeight
        scrollTo(targetScroll, { duration: 1.2 })
    }

    const handleJumpToTools = () => {
        const gridEl = document.getElementById('accessible-tools-grid')
        if (gridEl) {
            scrollTo(gridEl, { duration: 1.4 })
        }
    }

    return (
        <div ref={containerRef} className="scroll-story-container">
            {/* Side Chapter Dots Indicator */}
            <nav className="chapter-nav-rail" aria-label="Story chapter navigation">
                <button
                    type="button"
                    className={`nav-dot ${currentDot === 0 ? 'is-active' : ''}`}
                    onClick={() => handleJumpToChapter(0)}
                    aria-label="Jump to Hero"
                >
                    <span className="dot-circle" />
                    <span className="dot-label">00 Intro</span>
                </button>
                {CHAPTERS.map((ch, i) => (
                    <button
                        key={ch.id}
                        type="button"
                        className={`nav-dot ${currentDot === i + 1 ? 'is-active' : ''}`}
                        onClick={() => handleJumpToChapter(i + 1)}
                        aria-label={`Jump to ${ch.title}`}
                    >
                        <span className="dot-circle" />
                        <span className="dot-label">{ch.index} {ch.id}</span>
                    </button>
                ))}
            </nav>

            {/* Chapter 0: Atmospheric Hero */}
            <section className="story-section hero-story-section">
                <div className="hero-story-content">
                    <div className="hero-super-title">
                        <span className="hero-status-dot" />
                        <span>PRIVATE IN-BROWSER SUITE // 20 TOOLS</span>
                    </div>

                    <h1 className="hero-display-headline">
                        <span className="headline-line">Raw power.</span>
                        <span className="headline-line headline-italic">Zero trace.</span>
                    </h1>

                    <p className="hero-display-subtext">
                        A cinematic suite of 20 client-side image instruments. Every calculation executes 100% inside your browser’s GPU and CPU memory.
                    </p>

                    <div className="hero-cta-group">
                        <button
                            type="button"
                            className="hero-pill-btn hero-primary-pill"
                            onClick={handleJumpToTools}
                        >
                            <span>Explore 20 Tools</span>
                            <ArrowDown size={16} />
                        </button>

                        <button
                            type="button"
                            className="hero-pill-btn hero-secondary-pill"
                            onClick={onOpenSearch}
                        >
                            <Sparkles size={15} />
                            <span>Quick Search</span>
                            <span className="hero-shortcut-badge">Ctrl K</span>
                        </button>
                    </div>

                    <div className="hero-scroll-affordance">
                        <span className="scroll-mouse-icon">
                            <span className="scroll-mouse-wheel" />
                        </span>
                        <span className="scroll-text">Scroll to inspect transformations</span>
                    </div>
                </div>
            </section>

            {/* Chapters 01 to 07 */}
            {CHAPTERS.map((chapter) => (
                <section
                    key={chapter.id}
                    className={`story-section chapter-story-section ${
                        !is3DEnabled ? 'fallback-mode-card' : ''
                    }`}
                >
                    <div className="chapter-content-card">
                        <div className="chapter-meta-row">
                            <span className="chapter-numeral">{chapter.index}</span>
                            <span className="chapter-meta-line" />
                            <span className="chapter-category-tag">{chapter.metricLabel}</span>
                        </div>

                        <h2 className="chapter-headline">{chapter.title}</h2>
                        <p className="chapter-subtitle">{chapter.subtitle}</p>

                        {/* Metric readout */}
                        {chapter.metricFrom && chapter.metricTo && (
                            <div className="chapter-metric-hud">
                                <div className="metric-col">
                                    <span className="metric-tag">ORIGINAL</span>
                                    <span className="metric-val">{chapter.metricFrom}</span>
                                </div>
                                <span className="metric-arrow">→</span>
                                <div className="metric-col">
                                    <span className="metric-tag">PROCESSED</span>
                                    <span className="metric-val metric-val-accent">{chapter.metricTo}</span>
                                </div>
                            </div>
                        )}

                        <div className="chapter-actions">
                            <button
                                type="button"
                                className="chapter-action-btn"
                                onClick={() => onSelectTool(chapter.toolId)}
                            >
                                <span>{chapter.toolLabel}</span>
                                <ArrowUpRight size={16} />
                            </button>
                        </div>
                    </div>
                </section>
            ))}
        </div>
    )
}

export default ScrollStory

