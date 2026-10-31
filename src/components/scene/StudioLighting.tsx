import React from 'react'

export const StudioLighting: React.FC = () => {
    return (
        <>
            <ambientLight intensity={0.7} color="#181822" />
            
            {/* Key Light */}
            <directionalLight
                position={[5, 8, 5]}
                intensity={2.2}
                color="#ffffff"
            />

            {/* Electric Lime Rim / Kicker */}
            <directionalLight
                position={[-6, 4, -4]}
                intensity={3.2}
                color="#d4ff3a"
            />

            {/* Cyan Underfill */}
            <pointLight
                position={[0, -4, 2]}
                intensity={1.5}
                color="#00f0ff"
                distance={18}
            />

            {/* Warm Studio Specular Accent */}
            <pointLight
                position={[4, 1, -2]}
                intensity={1.0}
                color="#ff9e3b"
                distance={15}
            />
        </>
    )
}

export default StudioLighting

