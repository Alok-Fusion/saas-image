import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useScene } from './sceneContext'

interface PixelDustProps {
    count?: number
}

// Deterministic Pseudo-Random Number Generator (Mulberry32)
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

export const PixelDust: React.FC<PixelDustProps> = ({ count = 600 }) => {
    const pointsRef = useRef<THREE.Points>(null)
    const { isPaused, isDraggingFile, hoveredToolId } = useScene()

    const [positions, initialPositions, colors] = useMemo(() => {
        const random = mulberry32(42)
        const pos = new Float32Array(count * 3)
        const initPos = new Float32Array(count * 3)
        const col = new Float32Array(count * 3)

        const indigo = new THREE.Color('#6366f1')
        const cyan = new THREE.Color('#38bdf8')
        const lime = new THREE.Color('#d4ff3a')
        const white = new THREE.Color('#ffffff')

        for (let i = 0; i < count; i++) {
            const i3 = i * 3
            // Distribute in a spherical cylinder envelope around orbit
            const radius = 3.0 + random() * 6.5
            const theta = random() * Math.PI * 2
            const x = Math.cos(theta) * radius
            const z = Math.sin(theta) * radius - 1.0
            const y = (random() - 0.5) * 8.0

            pos[i3] = x
            pos[i3 + 1] = y
            pos[i3 + 2] = z

            initPos[i3] = x
            initPos[i3 + 1] = y
            initPos[i3 + 2] = z

            const rVal = random()
            const mixed = rVal < 0.45 ? indigo : rVal < 0.75 ? cyan : rVal < 0.9 ? lime : white
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

        const expansion = isDraggingFile ? 1.4 : hoveredToolId ? 1.08 : 1.0

        for (let i = 0; i < count; i++) {
            const i3 = i * 3
            const origX = initialPositions[i3]
            const origY = initialPositions[i3 + 1]
            const origZ = initialPositions[i3 + 2]

            // Gentle harmonic orbital drift
            const driftX = Math.sin(time * 0.35 + origY * 0.5) * 0.12
            const driftY = Math.cos(time * 0.3 + origX * 0.5) * 0.12
            const driftZ = Math.sin(time * 0.25 + origX * 0.3) * 0.08

            posAttr.setXYZ(
                i,
                origX * expansion + driftX,
                origY * expansion + driftY,
                origZ * expansion + driftZ
            )
        }
        posAttr.needsUpdate = true
    })

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={positions.length / 3}
                    array={positions}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-color"
                    count={colors.length / 3}
                    array={colors}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.045}
                vertexColors
                transparent
                opacity={0.65}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    )
}

export default PixelDust
