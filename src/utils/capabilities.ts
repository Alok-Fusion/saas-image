import { useState, useEffect, useCallback } from 'react'

export interface DeviceCapabilities {
    hasWebGL: boolean
    prefersReducedMotion: boolean
    isLowPower: boolean
    isSmallScreen: boolean
    userReducedEffects: boolean
    shouldRun3D: boolean
}

const REDUCE_EFFECTS_KEY = 'ik_reduce_effects'

function testWebGLSupport(): boolean {
    if (typeof window === 'undefined') return false
    try {
        const canvas = document.createElement('canvas')
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
        return Boolean(gl)
    } catch {
        return false
    }
}

export function getStoredReduceEffects(): boolean {
    if (typeof window === 'undefined') return false
    try {
        return localStorage.getItem(REDUCE_EFFECTS_KEY) === 'true'
    } catch {
        return false
    }
}

export function setStoredReduceEffects(value: boolean): void {
    if (typeof window === 'undefined') return
    try {
        localStorage.setItem(REDUCE_EFFECTS_KEY, value ? 'true' : 'false')
    } catch {
        // Safe catch for private browsing or quota limits
    }
}

export function getDeviceCapabilities(): DeviceCapabilities {
    if (typeof window === 'undefined') {
        return {
            hasWebGL: false,
            prefersReducedMotion: false,
            isLowPower: false,
            isSmallScreen: false,
            userReducedEffects: false,
            shouldRun3D: false,
        }
    }

    const hasWebGL = testWebGLSupport()
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    
    // Low power / memory detection
    const nav = window.navigator as Navigator & { deviceMemory?: number }
    const concurrency = nav.hardwareConcurrency || 4
    const memory = nav.deviceMemory || 4
    const isLowPower = concurrency < 4 || memory < 4
    const isSmallScreen = window.innerWidth < 768
    const userReducedEffects = getStoredReduceEffects()

    const shouldRun3D = hasWebGL && !prefersReducedMotion && !isLowPower && !isSmallScreen && !userReducedEffects

    return {
        hasWebGL,
        prefersReducedMotion,
        isLowPower,
        isSmallScreen,
        userReducedEffects,
        shouldRun3D,
    }
}

export function useCapabilities() {
    const [caps, setCaps] = useState<DeviceCapabilities>(() => getDeviceCapabilities())

    useEffect(() => {
        const updateCaps = () => {
            setCaps(getDeviceCapabilities())
        }

        const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)')
        motionQuery?.addEventListener?.('change', updateCaps)
        window.addEventListener('resize', updateCaps)

        return () => {
            motionQuery?.removeEventListener?.('change', updateCaps)
            window.removeEventListener('resize', updateCaps)
        }
    }, [])

    const toggleReduceEffects = useCallback(() => {
        setCaps((prev) => {
            const nextValue = !prev.userReducedEffects
            setStoredReduceEffects(nextValue)
            const shouldRun3D = prev.hasWebGL && !prev.prefersReducedMotion && !prev.isLowPower && !prev.isSmallScreen && !nextValue
            return {
                ...prev,
                userReducedEffects: nextValue,
                shouldRun3D,
            }
        })
    }, [])

    return {
        ...caps,
        toggleReduceEffects,
    }
}

