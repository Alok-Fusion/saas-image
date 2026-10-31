import { useCallback, useEffect, useRef, useState } from 'react'
import { Archive, Download, Eye, RotateCcw } from 'lucide-react'
import Button from '../components/Button'
import CompareView from '../components/CompareView'
import ControlGroup from '../components/ControlGroup'
import Dropzone from '../components/Dropzone'
import FileChip from '../components/FileChip'
import ProgressBar from '../components/ProgressBar'
import SegmentedControl from '../components/SegmentedControl'
import StatTile from '../components/StatTile'
import ToolHeader from '../components/ToolHeader'
import { useToast } from '../components/Toast'
import WorkspaceLayout from '../components/WorkspaceLayout'
import { useObjectUrl } from '../hooks/useObjectUrl'
import { downloadBlob, getImageInfo, type ImageInfo } from '../utils/imageProcessing'
import { runImageTask, type WorkerTask } from '../utils/imageWorker'
import { createSampleImage } from '../utils/sampleImage'
import type { ColorblindMatrix } from '../workers/types'

interface ColorBlindnessSimulatorProps {
    onBack: () => void
    initialFile?: File | null
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
            [0, 0, 1],
        ],
    },
    {
        id: 'protanopia',
        name: 'Protanopia',
        description: 'Red-blind (~1% of males)',
        matrix: [
            [0.567, 0.433, 0],
            [0.558, 0.442, 0],
            [0, 0.242, 0.758],
        ],
    },
    {
        id: 'deuteranopia',
        name: 'Deuteranopia',
        description: 'Green-blind (~1% of males)',
        matrix: [
            [0.625, 0.375, 0],
            [0.7, 0.3, 0],
            [0, 0.3, 0.7],
        ],
    },
    {
        id: 'tritanopia',
        name: 'Tritanopia',
        description: 'Blue-blind (~0.01%)',
        matrix: [
            [0.95, 0.05, 0],
            [0, 0.433, 0.567],
            [0, 0.475, 0.525],
        ],
    },
    {
        id: 'achromatopsia',
        name: 'Achromatopsia',
        description: 'Complete monochromatic',
        matrix: [
            [0.299, 0.587, 0.114],
            [0.299, 0.587, 0.114],
            [0.299, 0.587, 0.114],
        ],
    },
    {
        id: 'protanomaly',
        name: 'Protanomaly',
        description: 'Red-weak (~1% of males)',
        matrix: [
            [0.817, 0.183, 0],
            [0.333, 0.667, 0],
            [0, 0.125, 0.875],
        ],
    },
    {
        id: 'deuteranomaly',
        name: 'Deuteranomaly',
        description: 'Green-weak (~5% of males)',
        matrix: [
            [0.8, 0.2, 0],
            [0.258, 0.742, 0],
            [0, 0.142, 0.858],
        ],
    },
    {
        id: 'tritanomaly',
        name: 'Tritanomaly',
        description: 'Blue-weak (~0.01%)',
        matrix: [
            [0.967, 0.033, 0],
            [0, 0.733, 0.267],
            [0, 0.183, 0.817],
        ],
    },
]

interface Simulation {
    blob: Blob
    url: string
}

const VIEW_OPTIONS = [
    { value: 'single', label: 'Interactive Compare' },
    { value: 'grid', label: '8-Vision Matrix' },
]

export default function ColorBlindnessSimulator({ onBack, initialFile }: ColorBlindnessSimulatorProps) {
    const [file, setFile] = useState<File | null>(() => initialFile ?? null)
    const [prevInitialFile, setPrevInitialFile] = useState<File | null>(initialFile ?? null)
    const [originalInfo, setOriginalInfo] = useState<ImageInfo | null>(null)
    const [simulatedImages, setSimulatedImages] = useState<Map<string, Simulation>>(new Map())
    const [selectedType, setSelectedType] = useState<ColorBlindnessType>(COLOR_BLINDNESS_TYPES[1]) // Default protanopia
    const [isProcessing, setIsProcessing] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [viewMode, setViewMode] = useState<'single' | 'grid'>('single')
    const preview = useObjectUrl(file)
    const tasksRef = useRef<Set<WorkerTask<Blob>>>(new Set())
    const simulationsRef = useRef<Map<string, Simulation>>(new Map())
    const { error, success } = useToast()

    useEffect(() => {
        simulationsRef.current = simulatedImages
    }, [simulatedImages])

    const clearSimulations = useCallback(() => {
        simulationsRef.current.forEach((img) => URL.revokeObjectURL(img.url))
        simulationsRef.current = new Map()
        setSimulatedImages(new Map())
    }, [])

    if (initialFile && initialFile !== prevInitialFile) {
        setPrevInitialFile(initialFile)
        setFile(initialFile)
        setSimulatedImages(new Map())
    }

    const generateAll = useCallback(
        async (imageFile: File) => {
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
        },
        [clearSimulations, error]
    )

    const handleFile = useCallback(
        (selectedFile: File) => {
            setFile(selectedFile)
            void generateAll(selectedFile)
        },
        [generateAll]
    )

    useEffect(() => {
        if (!file) return
        let cancelled = false
        void getImageInfo(file)
            .then((info) => {
                if (cancelled) return
                setOriginalInfo(info)
            })
            .catch(() => {
                if (cancelled) return
                setOriginalInfo(null)
            })
        return () => {
            cancelled = true
        }
    }, [file])

    // Generate on initialFile mount
    useEffect(() => {
        if (initialFile && simulatedImages.size === 0 && !isProcessing) {
            const timer = setTimeout(() => {
                void generateAll(initialFile)
            }, 0)
            return () => clearTimeout(timer)
        }
    }, [initialFile, simulatedImages.size, isProcessing, generateAll])

    useEffect(() => () => {
        tasksRef.current.forEach((task) => task.cancel())
        simulationsRef.current.forEach((img) => URL.revokeObjectURL(img.url))
    }, [])

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
            success(`Downloaded ${selectedType.name} simulation`)
        } catch (err) {
            if (!(err instanceof Error && err.name === 'AbortError')) {
                error(err instanceof Error ? err.message : 'Could not export image')
            }
        } finally {
            setIsDownloading(false)
        }
    }

    const handleDownloadAll = async () => {
        if (!file || simulatedImages.size === 0) return
        setIsDownloading(true)
        try {
            const { default: JSZip } = await import('jszip')
            const zip = new JSZip()
            const baseName = file.name.replace(/\.[^/.]+$/, '') || 'image'

            for (const type of COLOR_BLINDNESS_TYPES) {
                const sim = simulatedImages.get(type.id)
                if (sim) {
                    zip.file(`${baseName}-${type.id}.png`, sim.blob)
                }
            }

            const content = await zip.generateAsync({ type: 'blob' })
            downloadBlob(content, `${baseName}-colorblindness-simulations.zip`)
            success('Downloaded all simulations as ZIP')
        } catch (err) {
            error(err instanceof Error ? err.message : 'Could not build ZIP')
        } finally {
            setIsDownloading(false)
        }
    }

    const handleReset = () => {
        tasksRef.current.forEach((task) => task.cancel())
        clearSimulations()
        setFile(null)
        setOriginalInfo(null)
        setProgress(0)
    }

    const currentSim = simulatedImages.get(selectedType.id)

    const leftControls = (
        <>
            {file && (
                <ControlGroup label="Source Image">
                    <FileChip
                        name={file.name}
                        sizeBytes={file.size}
                        width={originalInfo?.width}
                        height={originalInfo?.height}
                        thumbnailUrl={preview || undefined}
                        onRemove={handleReset}
                    />
                </ControlGroup>
            )}

            <ControlGroup label="View Mode">
                <SegmentedControl
                    value={viewMode}
                    onChange={(val) => setViewMode(val as 'single' | 'grid')}
                    options={VIEW_OPTIONS}
                />
            </ControlGroup>

            <ControlGroup
                label="Deficiency Type"
                hint="Select a specific color vision deficiency condition"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {COLOR_BLINDNESS_TYPES.map((type) => (
                        <button
                            key={type.id}
                            type="button"
                            onClick={() => setSelectedType(type)}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                padding: '8px 10px',
                                borderRadius: 'var(--radius-sm)',
                                border: selectedType.id === type.id
                                    ? '1px solid var(--color-accent)'
                                    : '1px solid var(--color-border-subtle)',
                                backgroundColor: selectedType.id === type.id
                                    ? 'var(--color-accent-subtle)'
                                    : 'var(--color-bg-surface-elevated)',
                                color: 'var(--color-text-primary)',
                                cursor: 'pointer',
                                textAlign: 'left',
                            }}
                        >
                            <span style={{ fontSize: '13px', fontWeight: 600 }}>{type.name}</span>
                            <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                                {type.description}
                            </span>
                        </button>
                    ))}
                </div>
            </ControlGroup>

            {isProcessing && (
                <ControlGroup label="Simulating Conditions">
                    <ProgressBar
                        progress={progress}
                        stageText="Computing LMS cone response matrices in web worker…"
                        onCancel={cancel}
                    />
                </ControlGroup>
            )}
        </>
    )

    const centerCanvas = !file ? (
        <Dropzone
            onFiles={(files) => handleFile(files[0])}
            icon="eye"
            title="Drop image to test accessibility"
            hint="Simulates Protanopia, Deuteranopia, Tritanopia & Achromatopsia"
            onTrySample={async () => {
                const s = await createSampleImage()
                handleFile(s)
            }}
        />
    ) : viewMode === 'single' ? (
        <div style={{ width: '100%', maxWidth: '850px', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                Comparing Normal Vision vs {selectedType.name} ({selectedType.description})
            </p>

            {preview && currentSim ? (
                <CompareView
                    beforeSrc={preview}
                    afterSrc={currentSim.url}
                    beforeLabel="Normal Vision"
                    afterLabel={selectedType.name}
                />
            ) : preview ? (
                <div style={{ textAlign: 'center' }}>
                    <img
                        src={preview}
                        alt="Normal vision"
                        style={{ maxHeight: '60vh', maxWidth: '100%', borderRadius: 'var(--radius-md)' }}
                    />
                </div>
            ) : null}
        </div>
    ) : (
        <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                All 8 Vision Deficiencies Matrix
            </p>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 'var(--spacing-3)',
                }}
            >
                {COLOR_BLINDNESS_TYPES.map((type) => {
                    const sim = simulatedImages.get(type.id)
                    return (
                        <div
                            key={type.id}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                padding: 'var(--spacing-2)',
                                backgroundColor: 'var(--color-bg-surface)',
                                border: '1px solid var(--color-border-default)',
                                borderRadius: 'var(--radius-md)',
                                gap: '6px',
                            }}
                        >
                            <div style={{ width: '100%', aspectRatio: '4/3', overflow: 'hidden', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-bg-surface-elevated)' }}>
                                {sim && (
                                    <img
                                        src={sim.url}
                                        alt={type.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                )}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                    {type.name}
                                </span>
                                {sim && (
                                    <button
                                        type="button"
                                        onClick={() => downloadBlob(sim.blob, `${file.name.replace(/\.[^/.]+$/, '')}-${type.id}.png`)}
                                        style={{
                                            border: 'none',
                                            background: 'transparent',
                                            color: 'var(--color-text-secondary)',
                                            cursor: 'pointer',
                                            padding: 2,
                                        }}
                                        title={`Download ${type.name} PNG`}
                                    >
                                        <Download size={13} />
                                    </button>
                                )}
                            </div>
                            <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
                                {type.description}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )

    const bottomBar = (
        <>
            <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                <StatTile label="Condition" value={selectedType.name} />
                <StatTile label="Affected" value={selectedType.description.split('(')[1]?.replace(')', '') || 'Baseline'} />
            </div>

            <div className="workspace-action-group">
                <Button variant="ghost" onClick={handleReset} icon={<RotateCcw size={15} />}>
                    Reset
                </Button>
                <Button
                    variant="secondary"
                    onClick={() => void handleDownload()}
                    disabled={!currentSim || isDownloading}
                    isLoading={isDownloading}
                    icon={<Download size={15} />}
                >
                    Download {selectedType.name} PNG
                </Button>
                <Button
                    variant="primary"
                    onClick={() => void handleDownloadAll()}
                    disabled={simulatedImages.size === 0 || isDownloading}
                    icon={<Archive size={15} />}
                >
                    Download All (ZIP)
                </Button>
            </div>
        </>
    )

    return (
        <div className="tool-view-wrapper">
            <ToolHeader
                toolName="Color Blindness Simulator"
                toolIcon={<Eye size={18} />}
                toolId="color-blindness"
                onBack={onBack}
                onReset={file ? handleReset : undefined}
            />
            <WorkspaceLayout
                leftControls={leftControls}
                centerCanvas={centerCanvas}
                bottomBar={bottomBar}
                hasFile={!!file}
            />
        </div>
    )
}
