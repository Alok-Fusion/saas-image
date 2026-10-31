import React, { useState, useMemo } from 'react'
import { SceneContext } from './sceneContext'

export const SceneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [scrollProgress, setScrollProgress] = useState(0)
    const [activeChapter, setActiveChapter] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const [hoveredToolId, setHoveredToolId] = useState<string | null>(null)
    const [activeToolTransition, setActiveToolTransition] = useState<string | null>(null)
    const [isLoaded, setIsLoaded] = useState(false)

    const value = useMemo(
        () => ({
            scrollProgress,
            setScrollProgress,
            activeChapter,
            setActiveChapter,
            isPaused,
            setIsPaused,
            hoveredToolId,
            setHoveredToolId,
            activeToolTransition,
            setActiveToolTransition,
            isLoaded,
            setIsLoaded,
        }),
        [scrollProgress, activeChapter, isPaused, hoveredToolId, activeToolTransition, isLoaded]
    )

    return <SceneContext.Provider value={value}>{children}</SceneContext.Provider>
}

export default SceneProvider
