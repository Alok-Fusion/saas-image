import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useScene } from './sceneContext'

interface PixelDustProps {
    count?: number
}

// Deterministic Pseudo-Random Number Generator (Mulberry32) for pure idempotent renders
function mulberry32(seed: number) {
    let s = seed
    return function () {
        s |= 0
        s = (s + 0x6d2b79f5) | 0
        let t = Math.imul(s ^ (s >>> 15), 1 | s)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

export const PixelDust: React.FC<PixelDustProps> = ({ count = 900 }) => {
    const pointsRef = useRef<THREE.Points>(null)
    const { scrollProgress, isPaused } = useScene()

    const [positions, initialPositions, colors] = useMemo(() => {
        const random = mulberry32(1337)
        const pos = new Float32Array(count * 3)
        const initPos = new Float32Array(count * 3)
        const col = new Float32Array(count * 3)

        const lime = new THREE.Color('#d4ff3a')
        const cyan = new THREE.Color('#00f0ff')
        const white = new THREE.Color('#ffffff')

        for (let i = 0; i < count; i++) {
            const i3 = i * 3
            const x = (random() - 0.5) * 22
            const y = (random() - 0.5) * 16
            const z = (random() - 0.5) * 16

            pos[i3] = x
            pos[i3 + 1] = y
            pos[i3 + 2] = z

            initPos[i3] = x
            initPos[i3 + 1] = y
            initPos[i3 + 2] = z

            const rVal = random()
            const mixed = rVal < 0.6 ? lime : rVal < 0.85 ? cyan : white
            col[i3] = mixed.r
            col[i3 + 1] = mixed.g
            col[i3 + 2] = mixed.b
        }

        return [pos, initPos, col]
    }, [count])

    useFrame((state) => {
        if (isPaused || !pointsRef.current) return
        const time = state.clock.getElapsedTime()
        const geom = pointsRef.current.geometry
        const posAttr = geom.attributes.position

        // Burst factor during compress chapter (progress around 0.12 to 0.28)
        const isCompressing = scrollProgress >= 0.10 && scrollProgress <= 0.28
        const compressIntensity = isCompressing
            ? Math.sin(((scrollProgress - 0.10) / 0.18) * Math.PI) * 2.5
            : 0

        for (let i = 0; i < count; i++) {
            const i3 = i * 3
            const origX = initialPositions[i3]
            const origY = initialPositions[i3 + 1]
            const origZ = initialPositions[i3 + 2]

            // Subtle harmonic orbital drift
            const driftX = Math.sin(time * 0.4 + origY) * 0.15
            const driftY = Math.cos(time * 0.3 + origX) * 0.15

            if (compressIntensity > 0) {
                // Expanding kinetic shockwave ring
                const angle = Math.atan2(origY, origX)
                posAttr.setXYZ(
                    i,
                    origX + Math.cos(angle) * compressIntensity * 2.0 + driftX,
                    origY + Math.sin(angle) * compressIntensity * 2.0 + driftY,
                    origZ + (i % 2 === 0 ? 0.5 : -0.5) * compressIntensity
                )
            } else {
                posAttr.setXYZ(i, origX + driftX, origY + driftY, origZ)
            }
        }
        posAttr.needsUpdate = true
    })

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[positions, 3]}
                />
                <bufferAttribute
                    attach="attributes-color"
                    args={[colors, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.05}
                vertexColors
                transparent
                opacity={0.7}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    )
}

export default PixelDust
