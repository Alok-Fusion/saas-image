import { useState, useEffect } from 'react'

export interface VisualViewportState {
    keyboardOffset: number
    viewportHeight: number
    viewportWidth: number
    scale: number
    isKeyboardOpen: boolean
}

export function useVisualViewport(): VisualViewportState {
    const [state, setState] = useState<VisualViewportState>({
        keyboardOffset: 0,
        viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 800,
        viewportWidth: typeof window !== 'undefined' ? window.innerWidth : 1280,
        scale: 1,
        isKeyboardOpen: false,
    })

    useEffect(() => {
        if (typeof window === 'undefined' || !window.visualViewport) return

        const vv = window.visualViewport

        const handleViewportChange = () => {
            const currentHeight = vv.height
            const windowHeight = window.innerHeight
            const offset = Math.max(0, windowHeight - currentHeight)
            // If offset is significant (> 120px), virtual keyboard is active on mobile
            const isKeyboardOpen = offset > 120

            setState({
                keyboardOffset: offset,
                viewportHeight: currentHeight,
                viewportWidth: vv.width,
                scale: vv.scale,
                isKeyboardOpen,
            })
        }

        vv.addEventListener('resize', handleViewportChange)
        vv.addEventListener('scroll', handleViewportChange)

        return () => {
            vv.removeEventListener('resize', handleViewportChange)
            vv.removeEventListener('scroll', handleViewportChange)
        }
    }, [])

    return state
}

