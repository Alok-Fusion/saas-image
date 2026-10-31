import React, { useMemo, useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useScene } from './sceneContext'
import { createStudioPhotoTexture, createCutoutForegroundTexture } from './textures'

export const PhotoStack: React.FC = () => {
    const groupRef = useRef<THREE.Group>(null)
    const card1Ref = useRef<THREE.Mesh>(null)
    const card2Ref = useRef<THREE.Mesh>(null)
    const card3Ref = useRef<THREE.Mesh>(null)
    const cutoutRef = useRef<THREE.Mesh>(null)
    const scanLineRef = useRef<THREE.Mesh>(null)
    const shieldRef = useRef<THREE.Mesh>(null)
    const phoneBezelRef = useRef<THREE.Group>(null)

    const { scrollProgress, isPaused, setIsLoaded } = useScene()
    const { pointer } = useThree()

    // Textures created once and disposed on unmount
    const [photoTex, cutoutTex] = useMemo(() => {
        return [createStudioPhotoTexture(), createCutoutForegroundTexture()]
    }, [])

    useEffect(() => {
        setIsLoaded(true)
        return () => {
            photoTex.dispose()
            cutoutTex.dispose()
        }
    }, [photoTex, cutoutTex, setIsLoaded])

    useFrame((state) => {
        if (isPaused || !groupRef.current) return
        const time = state.clock.getElapsedTime()
        const p = scrollProgress

        // Pointer-reactive gentle parallax
        const targetRotX = pointer.y * 0.18 + Math.sin(time * 0.5) * 0.04
        const targetRotY = pointer.x * 0.22 + Math.cos(time * 0.4) * 0.04

        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.08)
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.08)

        // CHAPTER TRANSFORMATIONS

        // 1. HERO / IDLE (p: 0.00 to 0.12)
        if (card1Ref.current && card2Ref.current && card3Ref.current) {
            if (p < 0.12) {
                // Natural floating stack
                card1Ref.current.position.set(0, Math.sin(time * 0.8) * 0.08, 0)
                card1Ref.current.scale.set(3.2, 2.2, 1)

                card2Ref.current.position.set(0.35, -0.25 + Math.cos(time * 0.7) * 0.06, -0.6)
                card2Ref.current.rotation.z = -0.06
                card2Ref.current.scale.set(3.0, 2.0, 1)

                card3Ref.current.position.set(-0.35, 0.3 + Math.sin(time * 0.6) * 0.06, -1.2)
                card3Ref.current.rotation.z = 0.08
                card3Ref.current.scale.set(2.8, 1.8, 1)
            }
            // 2. COMPRESS (p: 0.12 to 0.25)
            else if (p >= 0.12 && p < 0.25) {
                const norm = (p - 0.12) / 0.13
                // Squeeze cards into dense cube
                const squeeze = THREE.MathUtils.lerp(1, 0.45, norm)
                card1Ref.current.position.set(0, 0, 0)
                card1Ref.current.scale.set(3.2 * squeeze, 2.2 * squeeze, 1)

                card2Ref.current.position.set(0, 0, -0.08 * (1 - norm))
                card2Ref.current.rotation.z = THREE.MathUtils.lerp(-0.06, 0, norm)
                card2Ref.current.scale.set(3.0 * squeeze, 2.0 * squeeze, 1)

                card3Ref.current.position.set(0, 0, -0.16 * (1 - norm))
                card3Ref.current.rotation.z = THREE.MathUtils.lerp(0.08, 0, norm)
                card3Ref.current.scale.set(2.8 * squeeze, 1.8 * squeeze, 1)
            }
            // 3. CROP & ASPECT MORPH (p: 0.25 to 0.38)
            else if (p >= 0.25 && p < 0.38) {
                const norm = (p - 0.25) / 0.13
                // Morph from 1:1 square to 16:9 landscape to 9:16 story
                const [targetW, targetH] =
                    norm > 0.5
                        ? [
                              THREE.MathUtils.lerp(3.2, 1.8, (norm - 0.5) * 2),
                              THREE.MathUtils.lerp(1.8, 3.2, (norm - 0.5) * 2),
                          ]
                        : [
                              THREE.MathUtils.lerp(2.4, 3.2, norm * 2),
                              THREE.MathUtils.lerp(2.4, 1.8, norm * 2),
                          ]
                card1Ref.current.scale.set(targetW, targetH, 1)
                card1Ref.current.position.set(0, 0, 0)
                card2Ref.current.scale.set(0.001, 0.001, 0.001)
                card3Ref.current.scale.set(0.001, 0.001, 0.001)
            }
            // 4. REMOVE BACKGROUND (p: 0.38 to 0.50)
            else if (p >= 0.38 && p < 0.50) {
                const norm = (p - 0.38) / 0.12
                card1Ref.current.scale.set(2.8, 2.8, 1)
                const mat = card1Ref.current.material as THREE.MeshStandardMaterial
                mat.opacity = THREE.MathUtils.lerp(1, 0.18, norm)

                if (cutoutRef.current) {
                    cutoutRef.current.position.set(0, 0, THREE.MathUtils.lerp(0.02, 1.6, norm))
                    cutoutRef.current.scale.set(2.8, 2.8, 1)
                    const cutoutMat = cutoutRef.current.material as THREE.MeshStandardMaterial
                    cutoutMat.opacity = THREE.MathUtils.lerp(0, 1, Math.min(1, norm * 2))
                }
            }
            // 5. PDF SYNTHESIS (p: 0.50 to 0.62)
            else if (p >= 0.50 && p < 0.62) {
                const norm = (p - 0.50) / 0.12
                card1Ref.current.scale.set(2.2, 3.0, 1)
                const mat = card1Ref.current.material as THREE.MeshStandardMaterial
                mat.opacity = 1
                if (cutoutRef.current) {
                    const cutoutMat = cutoutRef.current.material as THREE.MeshStandardMaterial
                    cutoutMat.opacity = 0
                }
                card1Ref.current.rotation.y = THREE.MathUtils.lerp(0, Math.PI * 0.15, norm)
            }
            // 6. OCR SCAN LINE (p: 0.62 to 0.74)
            else if (p >= 0.62 && p < 0.74) {
                const norm = (p - 0.62) / 0.12
                card1Ref.current.scale.set(2.6, 2.6, 1)
                card1Ref.current.rotation.y = 0

                if (scanLineRef.current) {
                    scanLineRef.current.visible = true
                    scanLineRef.current.position.y = THREE.MathUtils.lerp(1.3, -1.3, norm)
                }
            } else {
                if (scanLineRef.current) scanLineRef.current.visible = false
            }

            // 7. PRIVACY SHIELD (p: 0.74 to 0.86)
            if (shieldRef.current) {
                if (p >= 0.74 && p < 0.86) {
                    const norm = (p - 0.74) / 0.12
                    shieldRef.current.visible = true
                    const shieldScale = THREE.MathUtils.lerp(0.1, 3.6, Math.min(1, norm * 2))
                    shieldRef.current.scale.set(shieldScale, shieldScale, shieldScale)
                    shieldRef.current.rotation.y = time * 0.8
                } else {
                    shieldRef.current.visible = false
                }
            }

            // 8. DEVICE MOCKUP (p: 0.86 to 0.96)
            if (phoneBezelRef.current) {
                if (p >= 0.86 && p < 0.96) {
                    const norm = (p - 0.86) / 0.10
                    phoneBezelRef.current.visible = true
                    card1Ref.current.scale.set(1.9, 3.8, 1)
                    phoneBezelRef.current.rotation.y = THREE.MathUtils.lerp(-0.4, 0.4, norm) + Math.sin(time * 0.5) * 0.1
                } else {
                    phoneBezelRef.current.visible = false
                }
            }

            // 9. PULL BACK FOR CONSTELLATION (p: 0.96 to 1.0)
            if (p >= 0.96) {
                const norm = (p - 0.96) / 0.04
                groupRef.current.position.z = THREE.MathUtils.lerp(0, -18, norm)
                groupRef.current.position.y = THREE.MathUtils.lerp(0, 10, norm)
            } else {
                groupRef.current.position.z = 0
                groupRef.current.position.y = 0
            }
        }
    })

    return (
        <group ref={groupRef} position={[0, 0, 0]}>
            {/* Primary Center Card */}
            <mesh ref={card1Ref} position={[0, 0, 0]}>
                <planeGeometry args={[1, 1]} />
                <meshStandardMaterial
                    map={photoTex}
                    roughness={0.2}
                    metalness={0.1}
                    transparent
                />
            </mesh>

            {/* Layer 2 Background Card */}
            <mesh ref={card2Ref} position={[0.35, -0.25, -0.6]}>
                <planeGeometry args={[1, 1]} />
                <meshStandardMaterial
                    map={photoTex}
                    roughness={0.4}
                    metalness={0.1}
                    transparent
                    opacity={0.65}
                />
            </mesh>

            {/* Layer 3 Background Card */}
            <mesh ref={card3Ref} position={[-0.35, 0.3, -1.2]}>
                <planeGeometry args={[1, 1]} />
                <meshStandardMaterial
                    map={photoTex}
                    roughness={0.5}
                    metalness={0.1}
                    transparent
                    opacity={0.45}
                />
            </mesh>

            {/* Cutout Foreground (Chapter 3) */}
            <mesh ref={cutoutRef} position={[0, 0, 0.05]} visible={scrollProgress >= 0.35 && scrollProgress <= 0.55}>
                <planeGeometry args={[1, 1]} />
                <meshStandardMaterial
                    map={cutoutTex}
                    transparent
                    opacity={0}
                    roughness={0.1}
                    metalness={0.2}
                />
            </mesh>

            {/* OCR Laser Scan Line (Chapter 5) */}
            <mesh ref={scanLineRef} position={[0, 0, 0.08]} visible={false}>
                <planeGeometry args={[3.2, 0.04]} />
                <meshBasicMaterial color="#00f0ff" transparent opacity={0.9} />
            </mesh>

            {/* Privacy Shield Sphere (Chapter 6) */}
            <mesh ref={shieldRef} position={[0, 0, 0]} visible={false}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshStandardMaterial
                    color="#00f0ff"
                    transparent
                    opacity={0.25}
                    wireframe
                    roughness={0.1}
                />
            </mesh>

            {/* 3D Phone Bezel Frame (Chapter 7) */}
            <group ref={phoneBezelRef} position={[0, 0, 0]} visible={false}>
                {/* Outer frame */}
                <mesh position={[0, 0, -0.04]}>
                    <boxGeometry args={[2.1, 4.0, 0.08]} />
                    <meshStandardMaterial color="#1a1a24" metalness={0.9} roughness={0.2} />
                </mesh>
                {/* Camera island notch */}
                <mesh position={[0, 1.7, 0.02]}>
                    <boxGeometry args={[0.6, 0.12, 0.04]} />
                    <meshStandardMaterial color="#0b0b0e" roughness={0.8} />
                </mesh>
            </group>
        </group>
    )
}

export default PhotoStack

