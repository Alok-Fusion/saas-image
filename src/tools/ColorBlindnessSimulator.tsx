import { useCallback, useRef, useState } from 'react'
import { downloadBlob, getImageInfo, type ImageInfo } from '../utils/imageProcessing'

interface ColorBlindnessSimulatorProps {
    onBack: () => void
}

interface ColorBlindnessType {
    id: string
    name: string
    description: string
    matrix: number[][]
}

const COLOR_BLINDNESS_TYPES: ColorBlindnessType[] = [
    {
        id: 'normal',
        name: 'Normal Vision',
        description: 'Original image',
        matrix: [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
        ]
    },
    {
        id: 'protanopia',
        name: 'Protanopia',
        description: 'Red-blind (~1% of males)',
        matrix: [
            [0.567, 0.433, 0],
            [0.558, 0.442, 0],
            [0, 0.242, 0.758]
        ]
    },
    {
        id: 'deuteranopia',
        name: 'Deuteranopia',
        description: 'Green-blind (~1% of males)',
        matrix: [
            [0.625, 0.375, 0],
            [0.7, 0.3, 0],
            [0, 0.3, 0.7]
        ]
    },
    {
        id: 'tritanopia',
        name: 'Tritanopia',
        description: 'Blue-blind (~0.01%)',
        matrix: [
            [0.95, 0.05, 0],
            [0, 0.433, 0.567],
            [0, 0.475, 0.525]
        ]
    },
    {
        id: 'achromatopsia',
        name: 'Achromatopsia',
        description: 'Complete color blindness',
        matrix: [
            [0.299, 0.587, 0.114],
            [0.299, 0.587, 0.114],
            [0.299, 0.587, 0.114]
        ]
    },
    {
        id: 'protanomaly',
        name: 'Protanomaly',
        description: 'Red-weak (~1% of males)',
        matrix: [
            [0.817, 0.183, 0],
            [0.333, 0.667, 0],
            [0, 0.125, 0.875]
        ]
    },
    {
        id: 'deuteranomaly',
        name: 'Deuteranomaly',
        description: 'Green-weak (~5% of males)',
        matrix: [
            [0.8, 0.2, 0],
            [0.258, 0.742, 0],
            [0, 0.142, 0.858]
        ]
    },
    {
        id: 'tritanomaly',
        name: 'Tritanomaly',
        description: 'Blue-weak (~0.01%)',
        matrix: [
            [0.967, 0.033, 0],
            [0, 0.733, 0.267],
            [0, 0.183, 0.817]
        ]
    }
]

export default function ColorBlindnessSimulator({ onBack }: ColorBlindnessSimulatorProps) {
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [originalInfo, setOriginalInfo] = useState<ImageInfo | null>(null)
    const [simulatedImages, setSimulatedImages] = useState<Map<string, { blob: Blob; url: string }>>(new Map())
    const [selectedType, setSelectedType] = useState<ColorBlindnessType>(COLOR_BLINDNESS_TYPES[0])
    const [isProcessing, setIsProcessing] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [viewMode, setViewMode] = useState<'single' | 'grid'>('single')
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Apply color blindness simulation
    const simulateColorBlindness = async (imageFile: File, type: ColorBlindnessType): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = new Image()
            const url = URL.createObjectURL(imageFile)

            img.onload = () => {
                URL.revokeObjectURL(url)

                const canvas = document.createElement('canvas')
                canvas.width = img.width
                canvas.height = img.height

                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'))
                    return
                }

                ctx.drawImage(img, 0, 0)
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                const data = imageData.data

                const matrix = type.matrix

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i]
                    const g = data[i + 1]
                    const b = data[i + 2]

                    data[i] = Math.min(255, Math.max(0, r * matrix[0][0] + g * matrix[0][1] + b * matrix[0][2]))
                    data[i + 1] = Math.min(255, Math.max(0, r * matrix[1][0] + g * matrix[1][1] + b * matrix[1][2]))
                    data[i + 2] = Math.min(255, Math.max(0, r * matrix[2][0] + g * matrix[2][1] + b * matrix[2][2]))
                }

                ctx.putImageData(imageData, 0, 0)

                canvas.toBlob(
                    (blob) => {
                        if (blob) resolve(blob)
                        else reject(new Error('Failed to create simulated image'))
                    },
                    'image/png'
                )
            }

            img.onerror = () => {
                URL.revokeObjectURL(url)
                reject(new Error('Failed to load image'))
            }

            img.src = url
        })
    }

    // Generate all simulations
    const generateAllSimulations = async (imageFile: File) => {
        const newImages = new Map<string, { blob: Blob; url: string }>()

        for (const type of COLOR_BLINDNESS_TYPES) {
            const blob = await simulateColorBlindness(imageFile, type)
            newImages.set(type.id, { blob, url: URL.createObjectURL(blob) })
        }

        return newImages
    }

    // Handle file selection
    const handleFile = useCallback(async (selectedFile: File) => {
        if (!selectedFile.type.startsWith('image/')) {
            alert('Please select an image file')
            return
        }

        setFile(selectedFile)
        const url = URL.createObjectURL(selectedFile)
        setPreview(url)

        try {
            const info = await getImageInfo(selectedFile)
            setOriginalInfo(info)
        } catch (error) {
            console.error('Error getting image info:', error)
        }

        // Clear old simulations
        simulatedImages.forEach(img => URL.revokeObjectURL(img.url))

        // Generate all simulations
        setIsProcessing(true)
        try {
            const images = await generateAllSimulations(selectedFile)
            setSimulatedImages(images)
        } catch (error) {
            console.error('Error generating simulations:', error)
        } finally {
            setIsProcessing(false)
        }
    }, [simulatedImages])

    // Handle drag and drop
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const droppedFile = e.dataTransfer.files[0]
        if (droppedFile) handleFile(droppedFile)
    }, [handleFile])

    // Download current simulation
    const handleDownload = () => {
        const simulated = simulatedImages.get(selectedType.id)
        if (!simulated || !file) return
        const baseName = file.name.replace(/\.[^/.]+$/, '')
        downloadBlob(simulated.blob, `${baseName}_${selectedType.id}.png`)
    }

    // Reset
    const handleReset = () => {
        if (preview) URL.revokeObjectURL(preview)
        simulatedImages.forEach(img => URL.revokeObjectURL(img.url))
        setFile(null)
        setPreview(null)
        setOriginalInfo(null)
        setSimulatedImages(new Map())
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const currentImage = simulatedImages.get(selectedType.id)

    return (
        <div className="tool-page">
            <div className="tool-header">
                <button className="back-button" onClick={onBack}>←</button>
                <h1 className="tool-title">Color Blindness Simulator</h1>
            </div>

            {!file ? (
                <div
                    className={`dropzone ${isDragging ? 'dragging' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div className="dropzone-content">
                        <div className="dropzone-icon">🎭</div>
                        <p className="dropzone-text">Drop your image here or click to browse</p>
                        <p className="dropzone-hint">See how images appear to people with color blindness</p>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                        style={{ display: 'none' }}
                    />
                </div>
            ) : (
                <>
                    {/* View Mode Toggle */}
                    <div className="controls-panel">
                        <div className="select-buttons" style={{ marginBottom: '1rem' }}>
                            <button
                                className={`select-button ${viewMode === 'single' ? 'active' : ''}`}
                                onClick={() => setViewMode('single')}
                            >
                                Single View
                            </button>
                            <button
                                className={`select-button ${viewMode === 'grid' ? 'active' : ''}`}
                                onClick={() => setViewMode('grid')}
                            >
                                Grid View (All Types)
                            </button>
                        </div>

                        {viewMode === 'single' && (
                            <div className="control-group">
                                <label className="control-label">
                                    <span>Color Blindness Type</span>
                                </label>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                                    gap: '0.5rem'
                                }}>
                                    {COLOR_BLINDNESS_TYPES.map(type => (
                                        <button
                                            key={type.id}
                                            className={`select-button ${selectedType.id === type.id ? 'active' : ''}`}
                                            onClick={() => setSelectedType(type)}
                                            style={{ textAlign: 'left', padding: '0.75rem' }}
                                        >
                                            <div style={{ fontWeight: 600 }}>{type.name}</div>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{type.description}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Image Display */}
                    {viewMode === 'single' ? (
                        <div className="comparison-container" style={{ marginTop: '1.5rem' }}>
                            <div className="comparison-panel">
                                <div className="comparison-label">Original</div>
                                <img src={preview!} alt="Original" className="comparison-image" />
                            </div>
                            <div className="comparison-panel">
                                <div className="comparison-label">{selectedType.name}</div>
                                {currentImage ? (
                                    <img src={currentImage.url} alt={selectedType.name} className="comparison-image" />
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.5)' }}>
                                        Processing...
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                            gap: '1rem',
                            marginTop: '1.5rem'
                        }}>
                            {COLOR_BLINDNESS_TYPES.map(type => {
                                const img = simulatedImages.get(type.id)
                                return (
                                    <div key={type.id} className="result-card" style={{ padding: '0.75rem' }}>
                                        {img ? (
                                            <img src={img.url} alt={type.name} className="result-image" />
                                        ) : (
                                            <div className="result-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)' }}>
                                                Processing...
                                            </div>
                                        )}
                                        <div className="result-title" style={{ marginTop: '0.5rem' }}>{type.name}</div>
                                        <div className="result-dimensions">{type.description}</div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Info */}
                    <div style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        background: 'rgba(102, 126, 234, 0.1)',
                        borderRadius: '12px'
                    }}>
                        <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
                            💡 Use this tool to ensure your designs are accessible to people with color vision deficiencies.
                            About 8% of men and 0.5% of women have some form of color blindness.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="actions-bar">
                        <button className="secondary-button" onClick={handleReset}>
                            🔄 Upload New Image
                        </button>
                        {viewMode === 'single' && currentImage && (
                            <button className="download-button" onClick={handleDownload}>
                                ⬇️ Download {selectedType.name}
                            </button>
                        )}
                    </div>
                </>
            )}

            {/* Processing Overlay */}
            {isProcessing && (
                <div className="processing-overlay">
                    <div className="processing-content">
                        <div className="processing-spinner" />
                        <div className="processing-text">Generating Simulations...</div>
                    </div>
                </div>
            )}
        </div>
    )
}
