import { MoveHorizontal } from 'lucide-react'
import { useCallback, useRef, useState, type PointerEvent } from 'react'

interface CompareViewProps {
    beforeSrc: string
    afterSrc: string
    beforeLabel?: string
    afterLabel?: string
    className?: string
}

export default function CompareView({
    beforeSrc,
    afterSrc,
    beforeLabel = 'Before',
    afterLabel = 'After',
    className = '',
}: CompareViewProps) {
    const [sliderPos, setSliderPos] = useState(50)
    const [isDragging, setIsDragging] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const updatePosition = useCallback((clientX: number) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const x = clientX - rect.left
        const pct = Math.max(0, Math.min(100, (x / rect.width) * 100))
        setSliderPos(pct)
    }, [])

    const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
        setIsDragging(true)
        e.currentTarget.setPointerCapture(e.pointerId)
        updatePosition(e.clientX)
    }

    const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
        if (isDragging) {
            updatePosition(e.clientX)
        }
    }

    const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
        setIsDragging(false)
        try {
            e.currentTarget.releasePointerCapture(e.pointerId)
        } catch {
            // Already released
        }
    }

    return (
        <div
            ref={containerRef}
            className={`comparison-container checkerboard-pattern ${className}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{ cursor: 'ew-resize' }}
        >
            {/* Background After Image */}
            <img
                src={afterSrc}
                alt={afterLabel}
                style={{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none' }}
                draggable={false}
            />

            {/* Overlaid Clipped Before Image */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
                    pointerEvents: 'none',
                }}
            >
                <img
                    src={beforeSrc}
                    alt={beforeLabel}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    draggable={false}
                />
            </div>

            {/* Divider Line */}
            <div
                className="comparison-line"
                style={{ left: `${sliderPos}%` }}
            />

            {/* Slider Handle */}
            <div
                role="slider"
                tabIndex={0}
                aria-label="Comparison split slider"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(sliderPos)}
                className="comparison-handle"
                style={{ left: `${sliderPos}%` }}
                onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft') {
                        e.preventDefault()
                        setSliderPos(p => Math.max(0, p - 2))
                    } else if (e.key === 'ArrowRight') {
                        e.preventDefault()
                        setSliderPos(p => Math.min(100, p + 2))
                    } else if (e.key === 'Home') {
                        e.preventDefault()
                        setSliderPos(0)
                    } else if (e.key === 'End') {
                        e.preventDefault()
                        setSliderPos(100)
                    }
                }}
            >
                <MoveHorizontal size={18} />
            </div>

            {/* Badges */}
            <span className="comparison-badge left">{beforeLabel}</span>
            <span className="comparison-badge right">{afterLabel}</span>
        </div>
    )
}

