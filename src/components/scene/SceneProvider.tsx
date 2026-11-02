import React, { useState, useMemo } from 'react'
import { SceneContext, SceneContextType } from './sceneContext'

export const SceneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [hoveredToolId, setHoveredToolId] = useState<string | null>(null)
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [suggestedTools, setSuggestedTools] = useState<string[]>([])
    const [isTourActive, setIsTourActive] = useState<boolean>(false)
    const [tourStep, setTourStep] = useState<number>(0)
    const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false)
    const [hasActiveFile, setHasActiveFile] = useState<boolean>(false)
    const [activeImageSrc, setActiveImageSrc] = useState<string | null>(null)
    const [activeToolTransition, setActiveToolTransition] = useState<string | null>(null)
    const [isPaused, setIsPaused] = useState<boolean>(false)
    const [viewMode, setViewMode] = useState<'3d' | 'list'>('3d')
    const [orbitRotation, setOrbitRotation] = useState<number>(0)

    const value: SceneContextType = useMemo(
        () => ({
            hoveredToolId,
            setHoveredToolId,
            selectedCategory,
            setSelectedCategory,
            suggestedTools,
            setSuggestedTools,
            isTourActive,
            setIsTourActive,
            tourStep,
            setTourStep,
            isDraggingFile,
            setIsDraggingFile,
            hasActiveFile,
            setHasActiveFile,
            activeImageSrc,
            setActiveImageSrc,
            activeToolTransition,
            setActiveToolTransition,
            isPaused,
            setIsPaused,
            viewMode,
            setViewMode,
            orbitRotation,
            setOrbitRotation,
        }),
        [
            hoveredToolId,
            selectedCategory,
            suggestedTools,
            isTourActive,
            tourStep,
            isDraggingFile,
            hasActiveFile,
            activeImageSrc,
            activeToolTransition,
            isPaused,
            viewMode,
            orbitRotation,
        ]
    )

    return <SceneContext.Provider value={value}>{children}</SceneContext.Provider>
}

export default SceneProvider
