import React, { useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import StudioLighting from './StudioLighting'
import PixelDust from './PixelDust'
import CenterStack from './CenterStack'
import ToolOrbit from './ToolOrbit'
import { useScene } from './sceneContext'

const CameraRig: React.FC = () => {
    const { isPaused, activeToolTransition, isTourActive } = useScene()
    const { pointer } = useThree()

    useFrame((state) => {
        if (isPaused) return

        // Smooth subtle cursor camera parallax
        const targetX = pointer.x * 0.4
        const targetY = 1.0 + pointer.y * 0.3
        const targetZ = activeToolTransition ? 2.5 : isTourActive ? 7.0 : 8.2

        state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.05)
        state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, 0.05)
        state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, 0.06)

        // Always smoothly look towards center
        state.camera.lookAt(0, 0, 0)
    })

    return null
}

interface ImmersiveCanvasProps {
    onSelectTool?: (toolId: string) => void
}

export const ImmersiveCanvas: React.FC<ImmersiveCanvasProps> = ({ onSelectTool }) => {
    const { isPaused } = useScene()
    const containerRef = useRef<HTMLDivElement>(null)

    return (
        <div
            ref={containerRef}
            className="immersive-canvas-container"
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 0,
                pointerEvents: 'auto',
            }}
            aria-hidden="true"
        >
            <Canvas
                camera={{ position: [0, 1.0, 8.2], fov: 46 }}
                dpr={[1, 1.5]}
                gl={{
                    antialias: true,
                    alpha: false,
                    powerPreference: 'high-performance',
                }}
                frameloop={isPaused ? 'never' : 'always'}
            >
                <color attach="background" args={['#07070a']} />
                <fogExp2 attach="fog" args={['#07070a', 0.038]} />
                <CameraRig />
                <StudioLighting />
                <PixelDust count={600} />
                <CenterStack />
                <ToolOrbit onSelectTool={onSelectTool} />
            </Canvas>
        </div>
    )
}

export default ImmersiveCanvas
