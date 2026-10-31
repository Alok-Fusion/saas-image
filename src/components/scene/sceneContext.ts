import { createContext, useContext } from 'react'

export interface SceneContextType {
    scrollProgress: number
    setScrollProgress: (progress: number) => void
    activeChapter: number
    setActiveChapter: (chapter: number) => void
    isPaused: boolean
    setIsPaused: (paused: boolean) => void
    hoveredToolId: string | null
    setHoveredToolId: (toolId: string | null) => void
    activeToolTransition: string | null
    setActiveToolTransition: (toolId: string | null) => void
    isLoaded: boolean
    setIsLoaded: (loaded: boolean) => void
}

export const SceneContext = createContext<SceneContextType>({
    scrollProgress: 0,
    setScrollProgress: () => {},
    activeChapter: 0,
    setActiveChapter: () => {},
    isPaused: false,
    setIsPaused: () => {},
    hoveredToolId: null,
    setHoveredToolId: () => {},
    activeToolTransition: null,
    setActiveToolTransition: () => {},
    isLoaded: false,
    setIsLoaded: () => {},
})

export const useScene = () => useContext(SceneContext)

