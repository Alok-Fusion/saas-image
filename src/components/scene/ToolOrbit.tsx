import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useScene } from './sceneContext'
import { getOrbitNodeTexture, disposeOrbitTextures } from './orbitTextures'
import { ORBIT_TOOLS, RING_RADII, OrbitToolDefinition } from '../../constants/orbitTools'

interface ToolNodeItemProps {
    tool: OrbitToolDefinition
    baseAngle: number
    onSelectTool?: (toolId: string) => void
}

const ToolNodeItem: React.FC<ToolNodeItemProps> = ({ tool, baseAngle, onSelectTool }) => {
    const meshRef = useRef<THREE.Group>(null)
    const {
        hoveredToolId,
        setHoveredToolId,
        selectedCategory,
        suggestedTools,
        isPaused,
    } = useScene()

    const isHovered = hoveredToolId === tool.id
    const isSuggested = suggestedTools.includes(tool.id)
    const isCategoryMatch = selectedCategory === 'all' || tool.category === selectedCategory
    const isDimmed = !isCategoryMatch || (hoveredToolId !== null && !isHovered)

    const texture = useMemo(() => {
        return getOrbitNodeTexture({
            shortName: tool.shortName,
            category: tool.categoryLabel,
            color: tool.color,
        })
    }, [tool])

    const radius = RING_RADII[tool.ring]

    useFrame((state) => {
        if (isPaused || !meshRef.current) return

        // Calculate 3D position in local group coordinates
        const rawX = Math.sin(baseAngle) * radius
        const rawZ = Math.cos(baseAngle) * radius
        const rawY = Math.sin(baseAngle * 2 + tool.ring) * 0.18

        // If hovered, pull forward (+1.2 Z) and scale up
        const targetZ = isHovered ? rawZ + 1.2 : rawZ
        const targetScale = isHovered ? 1.35 : isDimmed ? 0.85 : 1.0

        meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, rawX, 0.08)
        meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, rawY, 0.08)
        meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetZ, 0.08)

        // Face towards camera
        meshRef.current.lookAt(state.camera.position)

        meshRef.current.scale.lerp(
            new THREE.Vector3(targetScale, targetScale, targetScale),
            0.1
        )
    })

    return (
        <group
            ref={meshRef}
            onPointerOver={(e) => {
                e.stopPropagation()
                setHoveredToolId(tool.id)
            }}
            onPointerOut={() => {
                setHoveredToolId(null)
            }}
            onClick={(e) => {
                e.stopPropagation()
                onSelectTool?.(tool.id)
            }}
        >
            {/* Front Badge Disc */}
            <mesh>
                <circleGeometry args={[0.55, 36]} />
                <meshBasicMaterial
                    map={texture}
                    transparent
                    opacity={isDimmed ? 0.28 : 1.0}
                    toneMapped={false}
                />
            </mesh>

            {/* Glowing Accent Ring */}
            <mesh position={[0, 0, -0.01]}>
                <ringGeometry args={[0.54, 0.58, 36]} />
                <meshBasicMaterial
                    color={tool.color}
                    transparent
                    opacity={isDimmed ? 0.2 : isHovered ? 1.0 : 0.65}
                />
            </mesh>

            {/* Suggested Pulsing Outer Halo */}
            {isSuggested && (
                <mesh position={[0, 0, -0.02]}>
                    <ringGeometry args={[0.62, 0.70, 36]} />
                    <meshBasicMaterial
                        color="#d4ff3a"
                        transparent
                        opacity={0.8}
                    />
                </mesh>
            )}
        </group>
    )
}

export const ToolOrbit: React.FC<{ onSelectTool?: (toolId: string) => void }> = ({ onSelectTool }) => {
    const groupRef = useRef<THREE.Group>(null)
    const { hoveredToolId, isPaused, isTourActive, tourStep, suggestedTools } = useScene()

    const orbitRotationRef = useRef(0)
    const speedRef = useRef(0.12)

    // Precalculate angle for each node in its ring
    const nodes = useMemo(() => {
        const ring1 = ORBIT_TOOLS.filter((t) => t.ring === 1)
        const ring2 = ORBIT_TOOLS.filter((t) => t.ring === 2)
        const ring3 = ORBIT_TOOLS.filter((t) => t.ring === 3)

        return [
            ...ring1.map((t, idx) => ({ tool: t, baseAngle: (idx / ring1.length) * Math.PI * 2 })),
            ...ring2.map((t, idx) => ({ tool: t, baseAngle: (idx / ring2.length) * Math.PI * 2 + 0.3 })),
            ...ring3.map((t, idx) => ({ tool: t, baseAngle: (idx / ring3.length) * Math.PI * 2 + 0.6 })),
        ]
    }, [])

    useEffect(() => {
        return () => {
            disposeOrbitTextures()
        }
    }, [])

    useFrame((_state, delta) => {
        if (isPaused || !groupRef.current) return

        // Speed slows down to 10% on hover
        const targetSpeed = hoveredToolId !== null ? 0.015 : 0.12
        speedRef.current = THREE.MathUtils.lerp(speedRef.current, targetSpeed, 0.05)

        // Advance orbit rotation continuously
        orbitRotationRef.current += delta * speedRef.current

        // If Guided Tour is active, orient the tour target tool to the front
        if (isTourActive) {
            const tourTargets = ['compressor', 'cropper', 'background-remover', 'image-to-pdf', 'ocr', 'exif-cleaner']
            const targetId = tourTargets[tourStep % tourTargets.length]
            const targetNode = nodes.find((n) => n.tool.id === targetId)
            if (targetNode) {
                const desiredRotation = -targetNode.baseAngle
                orbitRotationRef.current = THREE.MathUtils.lerp(orbitRotationRef.current, desiredRotation, 0.04)
            }
        }
        // If Suggested Tools are active and not hovered, glide first suggested tool towards front
        else if (suggestedTools.length > 0 && hoveredToolId === null) {
            const topSuggested = suggestedTools[0]
            const suggestedNode = nodes.find((n) => n.tool.id === topSuggested)
            if (suggestedNode) {
                const desiredRotation = -suggestedNode.baseAngle
                orbitRotationRef.current = THREE.MathUtils.lerp(orbitRotationRef.current, desiredRotation, 0.02)
            }
        }

        // Rotate the entire orbit group around Y-axis! (zero ref access during render)
        groupRef.current.rotation.y = orbitRotationRef.current
    })

    return (
        <group ref={groupRef} rotation={[0.22, 0, 0]}>
            {nodes.map(({ tool, baseAngle }) => (
                <ToolNodeItem
                    key={tool.id}
                    tool={tool}
                    baseAngle={baseAngle}
                    onSelectTool={onSelectTool}
                />
            ))}
        </group>
    )
}

export default ToolOrbit
