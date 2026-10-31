import React, { useEffect, useState } from 'react'

interface PreloaderProps {
    onComplete: () => void
    isReady?: boolean
}

export const Preloader: React.FC<PreloaderProps> = ({ onComplete, isReady = false }) => {
    const [progress, setProgress] = useState(0)
    const [isFadingOut, setIsFadingOut] = useState(false)

    useEffect(() => {
        const startTime = Date.now()
        const maxDuration = 1200 // 1.2s cap for snappy opening

        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime
            const percent = Math.min(100, Math.round((elapsed / maxDuration) * 100))

            if (isReady && percent > 60) {
                // Accelerate completion if assets are ready
                setProgress(100)
                clearInterval(interval)
                setIsFadingOut(true)
                setTimeout(onComplete, 400)
            } else if (percent >= 100) {
                setProgress(100)
                clearInterval(interval)
                setIsFadingOut(true)
                setTimeout(onComplete, 400)
            } else {
                setProgress(percent)
            }
        }, 20)

        return () => clearInterval(interval)
    }, [isReady, onComplete])

    return (
        <div
            className={`preloader-overlay ${isFadingOut ? 'is-complete' : ''}`}
            aria-hidden={isFadingOut}
            role="status"
            aria-label="Loading workspace experience"
        >
            <div className="preloader-content">
                <div className="preloader-brand">
                    <span className="preloader-mark">IK</span>
                    <span className="preloader-title">IMAGEKIT PRO</span>
                </div>
                <div className="preloader-track">
                    <div className="preloader-bar" style={{ width: `${progress}%` }} />
                </div>
                <div className="preloader-meta">
                    <span className="preloader-status">INITIALIZING STUDIO RUNTIME</span>
                    <span className="preloader-counter">{progress}%</span>
                </div>
            </div>
        </div>
    )
}

export default Preloader

