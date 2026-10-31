import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Copy, Palette, RotateCcw } from 'lucide-react'
import Button from '../components/Button'
import ControlGroup from '../components/ControlGroup'
import Dropzone from '../components/Dropzone'
import FileChip from '../components/FileChip'
import SegmentedControl from '../components/SegmentedControl'
import StatTile from '../components/StatTile'
import ToolHeader from '../components/ToolHeader'
import { useToast } from '../components/Toast'
import WorkspaceLayout from '../components/WorkspaceLayout'
import { useObjectUrl } from '../hooks/useObjectUrl'
import { getImageInfo, type ImageInfo } from '../utils/imageProcessing'
import { runImageTask, type PaletteColor, type WorkerTask } from '../utils/imageWorker'
import { createSampleImage } from '../utils/sampleImage'

interface ColorPaletteExtractorProps {
    onBack: () => void
    initialFile?: File | null
}

const COLOR_COUNT_OPTIONS = [
    { value: '4', label: '4' },
    { value: '6', label: '6' },
    { value: '8', label: '8' },
    { value: '10', label: '10' },
]

export default function ColorPaletteExtractor({ onBack, initialFile }: ColorPaletteExtractorProps) {
    const [file, setFile] = useState<File | null>(() => initialFile ?? null)
    const [prevInitialFile, setPrevInitialFile] = useState<File | null>(initialFile ?? null)
    const [originalInfo, setOriginalInfo] = useState<ImageInfo | null>(null)
    const [colors, setColors] = useState<PaletteColor[]>([])
    const [colorCount, setColorCount] = useState(6)
    const [isProcessing, setIsProcessing] = useState(false)
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
    const preview = useObjectUrl(file)
    const taskRef = useRef<WorkerTask<PaletteColor[]> | null>(null)
    const { success, error } = useToast()

    if (initialFile && initialFile !== prevInitialFile) {
        setPrevInitialFile(initialFile)
        setFile(initialFile)
        setColors([])
    }

    const extractColors = useCallback(
        async (imageFile: File, numColors: number) => {
            taskRef.current?.cancel()
            setIsProcessing(true)
            const task = runImageTask<PaletteColor[]>({ kind: 'palette', file: imageFile, numColors })
            taskRef.current = task
            try {
                const result = await task.promise
                setColors(result)
            } catch (err) {
                if (!(err instanceof Error && err.name === 'AbortError')) {
                    error(err instanceof Error ? err.message : 'Could not extract colors')
                }
            } finally {
                if (taskRef.current === task) setIsProcessing(false)
            }
        },
        [error]
    )

    const handleFile = useCallback(
        (selectedFile: File) => {
            setFile(selectedFile)
            setColors([])
            void extractColors(selectedFile, colorCount)
        },
        [colorCount, extractColors]
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

    // Extract on initialFile mount
    useEffect(() => {
        if (initialFile && colors.length === 0 && !isProcessing) {
            const timer = setTimeout(() => {
                void extractColors(initialFile, colorCount)
            }, 0)
            return () => clearTimeout(timer)
        }
    }, [initialFile, colors.length, isProcessing, colorCount, extractColors])

    useEffect(() => () => taskRef.current?.cancel(), [])

    const handleColorCountChange = (val: string) => {
        const count = Number(val)
        setColorCount(count)
        if (file) void extractColors(file, count)
    }

    const copyColor = async (color: string, index: number) => {
        try {
            await navigator.clipboard.writeText(color)
            setCopiedIndex(index)
            success(`${color} copied`)
            setTimeout(() => setCopiedIndex(null), 1500)
        } catch {
            error('Clipboard access was blocked by your browser')
        }
    }

    const copyAsCss = async () => {
        if (colors.length === 0) return
        const css = colors.map((c, i) => `--color-${i + 1}: ${c.hex};`).join('\n')
        try {
            await navigator.clipboard.writeText(css)
            success('CSS variables copied to clipboard')
        } catch {
            error('Clipboard access was blocked by your browser')
        }
    }

    const generateGradient = () => {
        if (colors.length < 2) return ''
        return `linear-gradient(135deg, ${colors.slice(0, 3).map((c) => c.hex).join(', ')})`
    }

    const handleReset = () => {
        taskRef.current?.cancel()
        setFile(null)
        setOriginalInfo(null)
        setColors([])
    }

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

            <ControlGroup label="Number of Swatches" hint="Extract up to 10 dominant perceptual color clusters">
                <SegmentedControl
                    value={String(colorCount)}
                    onChange={handleColorCountChange}
                    options={COLOR_COUNT_OPTIONS}
                />
            </ControlGroup>

            {colors.length >= 2 && (
                <ControlGroup label="Generated Gradient" hint="Linear gradient composed from top dominant colors">
                    <div
                        style={{
                            height: '56px',
                            borderRadius: 'var(--radius-md)',
                            background: generateGradient(),
                            border: '1px solid var(--color-border-subtle)',
                            marginBottom: 'var(--spacing-2)',
                        }}
                    />
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => void copyAsCss()}
                        icon={<Copy size={13} />}
                    >
                        Copy CSS Variables
                    </Button>
                </ControlGroup>
            )}
        </>
    )

    const centerCanvas = !file ? (
        <Dropzone
            onFiles={(files) => handleFile(files[0])}
            icon="palette"
            title="Drop image to extract color palette"
            hint="Identifies dominant tones, hex codes & CSS styles"
            onTrySample={async () => {
                const s = await createSampleImage()
                handleFile(s)
            }}
        />
    ) : (
        <div style={{ width: '100%', maxWidth: '850px', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            <div style={{ textAlign: 'center' }}>
                <img
                    src={preview || undefined}
                    alt="Source preview"
                    style={{
                        maxHeight: '40vh',
                        maxWidth: '100%',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border-subtle)',
                        objectFit: 'contain',
                    }}
                />
            </div>

            <div>
                <p style={{ margin: '0 0 var(--spacing-2) 0', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    Extracted Dominant Swatches ({colors.length})
                </p>

                {isProcessing ? (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)' }}>
                        Quantizing image pixels via k-means worker…
                    </div>
                ) : (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                            gap: 'var(--spacing-3)',
                        }}
                    >
                        {colors.map((color, idx) => (
                            <div
                                key={`${color.hex}-${idx}`}
                                role="button"
                                tabIndex={0}
                                aria-label={`Copy color ${color.hex}`}
                                onClick={() => void copyColor(color.hex, idx)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault()
                                        void copyColor(color.hex, idx)
                                    }
                                }}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: 'var(--spacing-2)',
                                    backgroundColor: 'var(--color-bg-surface)',
                                    border: '1px solid var(--color-border-default)',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    transition: 'transform var(--transition-fast)',
                                }}
                            >
                                <div
                                    style={{
                                        width: '100%',
                                        height: '70px',
                                        borderRadius: 'var(--radius-sm)',
                                        backgroundColor: color.hex,
                                        border: '1px solid rgba(0,0,0,0.1)',
                                    }}
                                />
                                <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                                        {color.hex}
                                    </span>
                                    <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                                        {copiedIndex === idx ? (
                                            <span style={{ color: 'var(--color-success)', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                                <Check size={11} /> Copied
                                            </span>
                                        ) : (
                                            `${color.percentage}%`
                                        )}
                                    </span>
                                </div>
                                <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                                    {color.rgb}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )

    const bottomBar = (
        <>
            <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                <StatTile label="Colors" value={colors.length} />
                {colors[0] && <StatTile label="Dominant" value={colors[0].hex} />}
            </div>

            <div className="workspace-action-group">
                <Button variant="ghost" onClick={handleReset} icon={<RotateCcw size={15} />}>
                    Reset
                </Button>
                <Button
                    variant="primary"
                    onClick={() => void copyAsCss()}
                    disabled={colors.length === 0}
                    icon={<Copy size={15} />}
                >
                    Copy CSS Variables
                </Button>
            </div>
        </>
    )

    return (
        <div className="tool-view-wrapper">
            <ToolHeader
                toolName="Color Palette Extractor"
                toolIcon={<Palette size={18} />}
                toolId="color-palette"
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
