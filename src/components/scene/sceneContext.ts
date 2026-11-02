import { createContext, useContext } from 'react'

export interface SceneContextType {
    hoveredToolId: string | null
    setHoveredToolId: (id: string | null) => void
    selectedCategory: string
    setSelectedCategory: (category: string) => void
    suggestedTools: string[]
    setSuggestedTools: (tools: string[]) => void
    isTourActive: boolean
    setIsTourActive: (active: boolean) => void
    tourStep: number
    setTourStep: (step: number | ((prev: number) => number)) => void
    isDraggingFile: boolean
    setIsDraggingFile: (dragging: boolean) => void
    hasActiveFile: boolean
    setHasActiveFile: (hasFile: boolean) => void
    activeImageSrc: string | null
    setActiveImageSrc: (src: string | null) => void
    activeToolTransition: string | null
    setActiveToolTransition: (toolId: string | null) => void
    isPaused: boolean
    setIsPaused: (paused: boolean) => void
    viewMode: '3d' | 'list'
    setViewMode: (mode: '3d' | 'list') => void
    orbitRotation: number
    setOrbitRotation: (rot: number | ((prev: number) => number)) => void
}

export const SceneContext = createContext<SceneContextType>({
    hoveredToolId: null,
    setHoveredToolId: () => {},
    selectedCategory: 'all',
    setSelectedCategory: () => {},
    suggestedTools: [],
    setSuggestedTools: () => {},
    isTourActive: false,
    setIsTourActive: () => {},
    tourStep: 0,
    setTourStep: () => {},
    isDraggingFile: false,
    setIsDraggingFile: () => {},
    hasActiveFile: false,
    setHasActiveFile: () => {},
    activeImageSrc: null,
    setActiveImageSrc: () => {},
    activeToolTransition: null,
    setActiveToolTransition: () => {},
    isPaused: false,
    setIsPaused: () => {},
    viewMode: '3d',
    setViewMode: () => {},
    orbitRotation: 0,
    setOrbitRotation: () => {},
})

export const useScene = () => useContext(SceneContext)
