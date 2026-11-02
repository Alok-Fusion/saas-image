import { useState, useEffect } from 'react'

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

export interface BreakpointState {
    width: number
    height: number
    breakpoint: Breakpoint
    isMobile: boolean     // < 768px
    isTablet: boolean     // 768px - 1023px
    isDesktop: boolean    // 1024px - 1439px
    isWide: boolean       // >= 1440px
    isUltrawide: boolean  // >= 1920px
    isLandscape: boolean
    isTouch: boolean
}

function getBreakpoint(width: number): Breakpoint {
    if (width < 360) return 'xs'
    if (width < 480) return 'sm'
    if (width < 768) return 'md'
    if (width < 1024) return 'lg'
    if (width < 1440) return 'xl'
    return '2xl'
}

function computeState(): BreakpointState {
    if (typeof window === 'undefined') {
        return {
            width: 1280,
            height: 800,
            breakpoint: 'lg',
            isMobile: false,
            isTablet: false,
            isDesktop: true,
            isWide: false,
            isUltrawide: false,
            isLandscape: true,
            isTouch: false,
        }
    }

    const width = window.innerWidth
    const height = window.innerHeight
    const breakpoint = getBreakpoint(width)
    const isTouch = window.matchMedia('(pointer: coarse)').matches

    return {
        width,
        height,
        breakpoint,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024 && width < 1440,
        isWide: width >= 1440,
        isUltrawide: width >= 1920,
        isLandscape: width > height,
        isTouch,
    }
}

export function useBreakpoint(): BreakpointState {
    const [state, setState] = useState<BreakpointState>(computeState)

    useEffect(() => {
        let timeoutId: number | null = null

        const handleResize = () => {
            if (timeoutId) cancelAnimationFrame(timeoutId)
            timeoutId = requestAnimationFrame(() => {
                setState(computeState())
            })
        }

        window.addEventListener('resize', handleResize, { passive: true })
        window.addEventListener('orientationchange', handleResize, { passive: true })

        return () => {
            if (timeoutId) cancelAnimationFrame(timeoutId)
            window.removeEventListener('resize', handleResize)
            window.removeEventListener('orientationchange', handleResize)
        }
    }, [])

    return state
}

