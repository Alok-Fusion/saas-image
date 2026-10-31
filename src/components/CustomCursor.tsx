import React, { useEffect, useRef, useState } from 'react'

export const CustomCursor: React.FC = () => {
    const dotRef = useRef<HTMLDivElement>(null)
    const ringRef = useRef<HTMLDivElement>(null)
    const [cursorText, setCursorText] = useState('')
    const [isHovered, setIsHovered] = useState(false)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Only run on non-touch devices with fine pointers
        if (typeof window === 'undefined' || !window.matchMedia('(pointer: fine)').matches) {
            return
        }

        let mouseX = -100
        let mouseY = -100
        let ringX = -100
        let ringY = -100
        let animId: number

        const handleMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX
            mouseY = e.clientY
            if (!isVisible) setIsVisible(true)

            if (dotRef.current) {
                dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`
            }

            // Detect target for hover effects
            const target = e.target as HTMLElement | null
            if (target) {
                const interactive = target.closest('button, a, [role="button"], .quick-start-tile, .tool-card, .nav-dot')
                if (interactive) {
                    setIsHovered(true)
                    const customLabel = interactive.getAttribute('data-cursor')
                    setCursorText(customLabel || '')
                } else {
                    setIsHovered(false)
                    setCursorText('')
                }
            }
        }

        const handleMouseLeave = () => {
            setIsVisible(false)
        }

        // Smooth trailing ring physics (lerp)
        const render = () => {
            ringX += (mouseX - ringX) * 0.18
            ringY += (mouseY - ringY) * 0.18

            if (ringRef.current) {
                ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`
            }
            animId = requestAnimationFrame(render)
        }

        window.addEventListener('mousemove', handleMouseMove)
        document.body.addEventListener('mouseleave', handleMouseLeave)
        animId = requestAnimationFrame(render)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            document.body.removeEventListener('mouseleave', handleMouseLeave)
            cancelAnimationFrame(animId)
        }
    }, [isVisible])

    if (!isVisible) return null

    return (
        <div className="custom-cursor-root" aria-hidden="true">
            {/* Center pinpoint */}
            <div ref={dotRef} className="cursor-dot" />

            {/* Trailing elastic ring */}
            <div
                ref={ringRef}
                className={`cursor-ring ${isHovered ? 'is-hovering' : ''} ${
                    cursorText ? 'has-text' : ''
                }`}
            >
                {cursorText && <span className="cursor-label">{cursorText}</span>}
            </div>
        </div>
    )
}

export default CustomCursor

