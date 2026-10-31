import React, { useEffect, useCallback, useSyncExternalStore } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SmoothScrollContext } from './smoothScrollContext'

gsap.registerPlugin(ScrollTrigger)

let activeLenis: Lenis | null = null
const subscribers = new Set<() => void>()

function subscribe(callback: () => void) {
    subscribers.add(callback)
    return () => subscribers.delete(callback)
}

function getLenisSnapshot(): Lenis | null {
    return activeLenis
}

function getLenisServerSnapshot(): Lenis | null {
    return null
}

function updateActiveLenis(instance: Lenis | null) {
    activeLenis = instance
    subscribers.forEach((fn) => fn())
}

interface SmoothScrollProps {
    children: React.ReactNode
    enabled: boolean
}

export const SmoothScroll: React.FC<SmoothScrollProps> = ({ children, enabled }) => {
    const lenis = useSyncExternalStore(subscribe, getLenisSnapshot, getLenisServerSnapshot)

    useEffect(() => {
        if (!enabled) {
            if (activeLenis) {
                activeLenis.destroy()
                updateActiveLenis(null)
            }
            return
        }

        const lenisInstance = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            touchMultiplier: 1.4,
        })

        const updateScrollTrigger = () => {
            ScrollTrigger.update()
        }

        lenisInstance.on('scroll', updateScrollTrigger)

        const tickerCallback = (time: number) => {
            lenisInstance.raf(time * 1000)
        }
        gsap.ticker.add(tickerCallback)
        gsap.ticker.lagSmoothing(0)

        updateActiveLenis(lenisInstance)

        return () => {
            gsap.ticker.remove(tickerCallback)
            lenisInstance.destroy()
            updateActiveLenis(null)
        }
    }, [enabled])

    const scrollTo = useCallback((target: string | number | HTMLElement, options?: { offset?: number; immediate?: boolean; duration?: number }) => {
        if (lenis) {
            lenis.scrollTo(target, options)
        } else if (typeof target === 'string') {
            const el = document.querySelector(target)
            el?.scrollIntoView({ behavior: 'smooth' })
        } else if (typeof target === 'number') {
            window.scrollTo({ top: target, behavior: 'smooth' })
        } else if (target instanceof HTMLElement) {
            target.scrollIntoView({ behavior: 'smooth' })
        }
    }, [lenis])

    return (
        <SmoothScrollContext.Provider value={{ lenis, scrollTo }}>
            {children}
        </SmoothScrollContext.Provider>
    )
}

export default SmoothScroll
