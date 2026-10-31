import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useScene } from './sceneContext'

interface ConstellationToolItem {
    id: string
    title: string
    category: string
    color: string
}

const TOOLS_3D_LIST: ConstellationToolItem[] = [
    { id: 'compressor', title: 'Compressor', category: 'Core', color: '#4f46e5' },
    { id: 'resizer', title: 'Resizer', category: 'Core', color: '#6366f1' },
    { id: 'background-remover', title: 'Remover', category: 'AI', color: '#d4ff3a' },
    { id: 'cropper', title: 'Cropper', category: 'Edit', color: '#38bdf8' },
    { id: 'rotator', title: 'Rotator', category: 'Edit', color: '#818cf8' },
    { id: 'watermark-remover', title: 'Inpaint', category: 'Edit', color: '#f43f5e' },
    { id: 'watermark', title: 'Watermark', category: 'Edit', color: '#fb923c' },
    { id: 'image-to-pdf', title: 'Img to PDF', category: 'PDF', color: '#e11d48' },
    { id: 'pdf-to-image', title: 'PDF to Img', category: 'PDF', color: '#be123c' },
    { id: 'exif-cleaner', title: 'EXIF Clean', category: 'Privacy', color: '#10b981' },
    { id: 'duplicate-finder', title: 'Duplicates', category: 'Privacy', color: '#059669' },
    { id: 'ocr', title: 'OCR Text', category: 'AI', color: '#00f0ff' },
    { id: 'device-mockup', title: 'Mockup', category: 'Design', color: '#a855f7' },
    { id: 'color-palette', title: 'Palette', category: 'Design', color: '#ec4899' },
    { id: 'ascii-art', title: 'ASCII Art', category: 'Design', color: '#22c55e' },
    { id: 'thumbnail', title: 'Thumbnail', category: 'Social', color: '#ef4444' },
    { id: 'instagram-grid', title: 'Grid Split', category: 'Social', color: '#f59e0b' },
    { id: 'favicon', title: 'Favicon', category: 'Design', color: '#8b5cf6' },
    { id: 'color-blindness', title: 'Simulator', category: 'A11y', color: '#06b6d4' },
    { id: 'image-comparison', title: 'Compare', category: 'Core', color: '#64748b' },
]

export const ToolConstellation: React.FC<{ onSelectTool?: (toolId: string) => void }> = ({ onSelectTool }) => {
    const groupRef = useRef<THREE.Group>(null)
    const { scrollProgress, hoveredToolId, setHoveredToolId, isPaused } = useScene()

    // Arrange 20 tiles in a curved cylindrical amphitheater
    const tileLayout = useMemo(() => {
        const radius = 9.5
        return TOOLS_3D_LIST.map((tool, idx) => {
            const count = TOOLS_3D_LIST.length
            const angle = ((idx - count / 2) / count) * Math.PI * 1.3
            const x = Math.sin(angle) * radius
            const z = -Math.cos(angle) * radius + radius - 4
            const y = ((idx % 4) - 1.5) * 2.2
            return {
                ...tool,
                pos: [x, y, z] as [number, number, number],
                rotY: angle,
            }
        })
    }, [])

    useFrame(() => {
        if (isPaused || !groupRef.current) return
        const p = scrollProgress
        // Visible only when scrolled towards the tool field chapter
        if (p < 0.88) {
            groupRef.current.visible = false
        } else {
            groupRef.current.visible = true
            const alpha = Math.min(1, (p - 0.88) / 0.08)
            groupRef.current.position.y = THREE.MathUtils.lerp(-10, 0, alpha)
        }
    })

    return (
        <group ref={groupRef} position={[0, 0, 0]} visible={false}>
            {tileLayout.map((tile) => {
                const isHovered = hoveredToolId === tile.id
                const isDimmed = hoveredToolId !== null && !isHovered

                return (
                    <group
                        key={tile.id}
                        position={tile.pos}
                        rotation={[0, tile.rotY, 0]}
                    >
                        <mesh
                            onPointerOver={(e) => {
                                e.stopPropagation()
                                setHoveredToolId(tile.id)
                            }}
                            onPointerOut={() => {
                                setHoveredToolId(null)
                            }}
                            onClick={(e) => {
                                e.stopPropagation()
                                onSelectTool?.(tile.id)
                            }}
                            scale={isHovered ? [1.15, 1.15, 1.15] : [1, 1, 1]}
                        >
                            <planeGeometry args={[1.8, 1.2]} />
                            <meshStandardMaterial
                                color={isHovered ? '#ffffff' : '#14141c'}
                                roughness={0.3}
                                metalness={0.7}
                                transparent
                                opacity={isDimmed ? 0.35 : isHovered ? 0.95 : 0.75}
                            />
                        </mesh>
                    </group>
                )
            })}
        </group>
    )
}

export default ToolConstellation

