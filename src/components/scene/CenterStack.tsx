import React, { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useScene } from './sceneContext'
import { createStudioPhotoTexture } from './textures'

export const CenterStack: React.FC = () => {
    const groupRef = useRef<THREE.Group>(null)
    const card1Ref = useRef<THREE.Mesh>(null)
    const card2Ref = useRef<THREE.Mesh>(null)
    const card3Ref = useRef<THREE.Mesh>(null)

    const { isDraggingFile, activeImageSrc, isPaused } = useScene()
    const { pointer } = useThree()

    // Default procedural studio texture
    const defaultTexture = useMemo(() => createStudioPhotoTexture(), [])

    // User-uploaded texture state
    const [userTexture, setUserTexture] = useState<THREE.Texture | null>(null)

    useEffect(() => {
        if (!activeImageSrc) {
            return
        }

        let isCurrent = true
        let createdTexture: THREE.Texture | null = null

        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
            if (!isCurrent) return
            createdTexture = new THREE.Texture(img)
            createdTexture.needsUpdate = true
            createdTexture.colorSpace = THREE.SRGBColorSpace
            setUserTexture(createdTexture)
        }
        img.src = activeImageSrc

        return () => {
            isCurrent = false
            if (createdTexture) {
                createdTexture.dispose()
            }
            setUserTexture((prev) => {
                if (prev) prev.dispose()
                return null
            })
        }
    }, [activeImageSrc])

    useEffect(() => {
        return () => {
            defaultTexture.dispose()
        }
    }, [defaultTexture])

    const frontTexture = userTexture || defaultTexture

    useFrame((state) => {
        if (isPaused || !groupRef.current) return
        const time = state.clock.getElapsedTime()

        // Parallax cursor tilt (smooth lerp)
        const targetRotX = pointer.y * 0.14 + Math.sin(time * 0.6) * 0.02
        const targetRotY = pointer.x * 0.18 + Math.cos(time * 0.5) * 0.02

        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.06)
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.06)

        // Float motion
        const floatY = Math.sin(time * 0.8) * 0.06
        groupRef.current.position.y = floatY

        // Aperture / Iris open effect when dragging file
        const dragSpread = isDraggingFile ? 1.0 : 0.0

        if (card1Ref.current && card2Ref.current && card3Ref.current) {
            // Front Card
            card1Ref.current.position.z = THREE.MathUtils.lerp(
                card1Ref.current.position.z,
                dragSpread * 0.45,
                0.08
            )
            card1Ref.current.position.y = THREE.MathUtils.lerp(
                card1Ref.current.position.y,
                dragSpread * 0.15,
                0.08
            )

            // Middle Card (spreads lower-left)
            card2Ref.current.position.x = THREE.MathUtils.lerp(
                card2Ref.current.position.x,
                0.28 + dragSpread * 0.55,
                0.08
            )
            card2Ref.current.position.y = THREE.MathUtils.lerp(
                card2Ref.current.position.y,
                -0.2 - dragSpread * 0.35,
                0.08
            )
            card2Ref.current.position.z = THREE.MathUtils.lerp(
                card2Ref.current.position.z,
                -0.45 - dragSpread * 0.35,
                0.08
            )
            card2Ref.current.rotation.z = THREE.MathUtils.lerp(
                card2Ref.current.rotation.z,
                -0.08 - dragSpread * 0.12,
                0.08
            )

            // Back Card (spreads upper-right)
            card3Ref.current.position.x = THREE.MathUtils.lerp(
                card3Ref.current.position.x,
                -0.28 - dragSpread * 0.55,
                0.08
            )
            card3Ref.current.position.y = THREE.MathUtils.lerp(
                card3Ref.current.position.y,
                0.22 + dragSpread * 0.35,
                0.08
            )
            card3Ref.current.position.z = THREE.MathUtils.lerp(
                card3Ref.current.position.z,
                -0.9 - dragSpread * 0.4,
                0.08
            )
            card3Ref.current.rotation.z = THREE.MathUtils.lerp(
                card3Ref.current.rotation.z,
                0.09 + dragSpread * 0.12,
                0.08
            )
        }
    })

    return (
        <group ref={groupRef} position={[0, 0, 0]}>
            {/* Front Card (Active Image or Procedural Art) */}
            <mesh ref={card1Ref} position={[0, 0, 0]}>
                <planeGeometry args={[2.8, 1.95]} />
                <meshStandardMaterial
                    map={frontTexture}
                    roughness={0.25}
                    metalness={0.15}
                    emissive={isDraggingFile ? new THREE.Color('#6366f1') : new THREE.Color('#000000')}
                    emissiveIntensity={isDraggingFile ? 0.4 : 0.0}
                />
            </mesh>

            {/* Subtle hairline edge frame for Front Card */}
            <lineSegments position={[0, 0, 0.01]}>
                <edgesGeometry args={[new THREE.PlaneGeometry(2.8, 1.95)]} />
                <lineBasicMaterial
                    color={isDraggingFile ? '#d4ff3a' : '#6366f1'}
                    transparent
                    opacity={isDraggingFile ? 0.9 : 0.4}
                />
            </lineSegments>

            {/* Middle Card */}
            <mesh ref={card2Ref} position={[0.28, -0.2, -0.45]} rotation={[0, 0, -0.08]}>
                <planeGeometry args={[2.7, 1.85]} />
                <meshStandardMaterial
                    color="#14141d"
                    roughness={0.4}
                    metalness={0.5}
                />
            </mesh>
            <lineSegments position={[0.28, -0.2, -0.44]} rotation={[0, 0, -0.08]}>
                <edgesGeometry args={[new THREE.PlaneGeometry(2.7, 1.85)]} />
                <lineBasicMaterial color="#38bdf8" transparent opacity={0.3} />
            </lineSegments>

            {/* Back Card */}
            <mesh ref={card3Ref} position={[-0.28, 0.22, -0.9]} rotation={[0, 0, 0.09]}>
                <planeGeometry args={[2.6, 1.75]} />
                <meshStandardMaterial
                    color="#0d0d14"
                    roughness={0.5}
                    metalness={0.6}
                />
            </mesh>
            <lineSegments position={[-0.28, 0.22, -0.89]} rotation={[0, 0, 0.09]}>
                <edgesGeometry args={[new THREE.PlaneGeometry(2.6, 1.75)]} />
                <lineBasicMaterial color="#a855f7" transparent opacity={0.25} />
            </lineSegments>
        </group>
    )
}

export default CenterStack
