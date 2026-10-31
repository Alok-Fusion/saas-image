import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import StudioLighting from './StudioLighting'
import PixelDust from './PixelDust'
import PhotoStack from './PhotoStack'
import ToolConstellation from './ToolConstellation'
import { useScene } from './sceneContext'

const CameraRig: React.FC = () => {
    const { scrollProgress, isPaused } = useScene()

    useFrame((state) => {
        if (isPaused) return
        const p = scrollProgress
        // Camera pulls back for Constellation chapter
        let targetZ = 5.5
        let targetY = 0

        if (p >= 0.88) {
            const norm = (p - 0.88) / 0.12
            targetZ = THREE.MathUtils.lerp(5.5, 11.5, norm)
            targetY = THREE.MathUtils.lerp(0, 0.5, norm)
        }

        state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, 0.08)
        state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, 0.08)
    })

    return null
}

interface ImmersiveCanvasProps {
    onSelectTool?: (toolId: string) => void
}

export const ImmersiveCanvas: React.FC<ImmersiveCanvasProps> = ({ onSelectTool }) => {
    const { isPaused, scrollProgress } = useScene()
    const containerRef = useRef<HTMLDivElement>(null)

    // Interactive pointer only when in tool constellation chapter
    const isInteractive = scrollProgress >= 0.88

    return (
        <div
            ref={containerRef}
            className="immersive-canvas-container"
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 0,
                pointerEvents: isInteractive ? 'auto' : 'none',
            }}
            aria-hidden="true"
        >
            <Canvas
                camera={{ position: [0, 0, 5.5], fov: 45 }}
                dpr={[1, 1.5]}
                gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference: 'high-performance',
                }}
                frameloop={isPaused ? 'never' : 'always'}
            >
                <color attach="background" args={['#07070a']} />
                <fogExp2 attach="fog" args={['#07070a', 0.035]} />
                <CameraRig />
                <StudioLighting />
                <PixelDust count={800} />
                <PhotoStack />
                <ToolConstellation onSelectTool={onSelectTool} />
            </Canvas>
        </div>
    )
}

export default ImmersiveCanvas

