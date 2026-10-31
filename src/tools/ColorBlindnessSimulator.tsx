import { useCallback, useEffect, useRef, useState } from 'react'
import Dropzone from '../components/Dropzone'
import { useToast } from '../components/Toast'
import { useObjectUrl } from '../hooks/useObjectUrl'
import { downloadBlob, formatFileSize, getImageInfo, type ImageInfo } from '../utils/imageProcessing'
import { runImageTask, type WorkerTask } from '../utils/imageWorker'
import type { ColorblindMatrix } from '../workers/types'

interface ColorBlindnessSimulatorProps {
    onBack: () => void
}

interface ColorBlindnessType {
    id: string
    name: string
    description: string
    matrix: ColorblindMatrix
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

interface Simulation {
    blob: Blob
    url: string
}

export default function ColorBlindnessSimulator({ onBack }: ColorBlindnessSimulatorProps) {
    const [file, setFile] = useState<File | null>(null)
    const [originalInfo, setOriginalInfo] = useState<ImageInfo | null>(null)
    const [simulatedImages, setSimulatedImages] = useState<Map<string, Simulation>>(new Map())
    const [selectedType, setSelectedType] = useState<ColorBlindnessType>(COLOR_BLINDNESS_TYPES[0])
    const [isProcessing, setIsProcessing] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [viewMode, setViewMode] = useState<'single' | 'grid'>('single')
    const preview = useObjectUrl(file)
    const tasksRef = useRef<Set<WorkerTask<Blob>>>(new Set())
    const simulationsRef = useRef<Map<string, Simulation>>(new Map())
    const { error } = useToast()

    useEffect(() => {
        simulationsRef.current = simulatedImages
    }, [simulatedImages])

    const clearSimulations = () => {
        simulationsRef.current.forEach((img) => URL.revokeObjectURL(img.url))
        setSimulatedImages(new Map())
    }

    useEffect(() => () => {
        tasksRef.current.forEach((task) => task.cancel())
        simulationsRef.current.forEach((img) => URL.revokeObjectURL(img.url))
    }, [])

    const generateAll = useCallback(async (imageFile: File) => {
        clearSimulations()
        setIsProcessing(true)
        setProgress(0)
        const next = new Map<string, Simulation>()

        try {
            for (let index = 0; index < COLOR_BLINDNESS_TYPES.length; index++) {
                const type = COLOR_BLINDNESS_TYPES[index]
                const task = runImageTask<Blob>({
                    kind: 'colorblind',
                    file: imageFile,
                    matrix: type.matrix,
                    maxDimension: 1400,
                })
                tasksRef.current.add(task)
                try {
                    const blob = await task.promise
                    next.set(type.id, { blob, url: URL.createObjectURL(blob) })
                    setSimulatedImages(new Map(next))
                    setProgress(Math.round(((index + 1) / COLOR_BLINDNESS_TYPES.length) * 100))
                } finally {
                    tasksRef.current.delete(task)
                }
            }
        } catch (err) {
            if (!(err instanceof Error && err.name === 'AbortError')) {
                error(err instanceof Error ? err.message : 'Could not generate simulations')
            }
        } finally {
            setIsProcessing(false)
        }
    }, [error])

    const handleFile = useCallback(async (selectedFile: File) => {
        setFile(selectedFile)
        try {
            setOriginalInfo(await getImageInfo(selectedFile))
        } catch {
            setOriginalInfo(null)
        }
        void generateAll(selectedFile)
    }, [generateAll])

    const cancel = () => {
        tasksRef.current.forEach((task) => task.cancel())
        setIsProcessing(false)
    }

    const handleDownload = async () => {
        if (!file) return
        setIsDownloading(true)
        try {
            const blob = await runImageTask<Blob>({
                kind: 'colorblind',
                file,
                matrix: selectedType.matrix,
            }).promise
            const baseName = file.name.replace(/\.[^/.]+$/, '') || 'image'
            downloadBlob(blob, `${baseName}-${selectedType.id}.png`)
        } catch (err) {
            if (!(err instanceof Error && err.name === 'AbortError')) {
                error(err instanceof Error ? err.message : 'Could not export the image')
            }
        } finally {
            setIsDownloading(false)
        }
    }

    const handleReset = () => {
        cancel()
        clearSimulations()
        setFile(null)
        setOriginalInfo(null)
    }

    const currentImage = simulatedImages.get(selectedType.id)

    return (
        <div className="tool-page">
            <div className="tool-header">
                <button className="back-button" onClick={onBack}>←</button>
                <h1 className="tool-title">Color Blindness Simulator</h1>
            </div>

            {!file ? (
                <Dropzone
                    onFiles={(files) => void handleFile(files[0])}
                    icon="🎭"
                    title="Drop your image here or click to browse"
                    hint="See how images appear to people with color blindness"
                />
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

                        {originalInfo && (
                            <div className="image-info" style={{ marginBottom: '1rem' }}>
                                <span className="info-badge">
                                    <span className="info-badge-label">Dimensions:</span>
                                    <span className="info-badge-value">{originalInfo.width}×{originalInfo.height}</span>
                                </span>
                                <span className="info-badge">
                                    <span className="info-badge-label">Size:</span>
                                    <span className="info-badge-value">{formatFileSize(originalInfo.size)}</span>
                                </span>
                            </div>
                        )}

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
                            <button className="download-button" onClick={() => void handleDownload()} disabled={isDownloading}>
                                {isDownloading ? 'Preparing…' : `⬇️ Download ${selectedType.name}`}
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
                        <div className="processing-text">Generating Simulations... {progress}%</div>
                        <div className="progress-track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                            <div className="progress-fill" style={{ width: `${progress}%` }} />
                        </div>
                        <button className="secondary-button" style={{ marginTop: '1rem' }} onClick={cancel}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
