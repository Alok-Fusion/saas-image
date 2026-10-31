import React, { useEffect, useState } from 'react'

interface RouteTransitionProps {
    isTransitioning: boolean
    targetToolTitle?: string
    onTransitionComplete?: () => void
}

export const RouteTransition: React.FC<RouteTransitionProps> = ({
    isTransitioning,
    targetToolTitle,
    onTransitionComplete,
}) => {
    const [prevTransitioning, setPrevTransitioning] = useState(false)
    const [phase, setPhase] = useState<'in' | 'out'>('in')

    if (isTransitioning && !prevTransitioning) {
        setPrevTransitioning(true)
        setPhase('in')
    } else if (!isTransitioning && prevTransitioning) {
        setPrevTransitioning(false)
    }

    useEffect(() => {
        if (!isTransitioning) return

        const timerOut = setTimeout(() => {
            setPhase('out')
            const timerDone = setTimeout(() => {
                onTransitionComplete?.()
            }, 300)
            return () => clearTimeout(timerDone)
        }, 280)

        return () => clearTimeout(timerOut)
    }, [isTransitioning, onTransitionComplete])

    if (!isTransitioning) return null

    return (
        <div
            className={`route-transition-curtain ${phase === 'in' ? 'curtain-in' : 'curtain-out'}`}
            aria-hidden="true"
        >
            <div className="curtain-line" />
            {targetToolTitle && (
                <div className="curtain-brand">
                    <span className="curtain-sub">INITIALIZING WORKSPACE</span>
                    <span className="curtain-title">{targetToolTitle}</span>
                </div>
            )}
        </div>
    )
}

export default RouteTransition
