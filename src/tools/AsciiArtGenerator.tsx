import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Copy, Download, RefreshCw, RotateCcw, Terminal } from 'lucide-react'
import Button from '../components/Button'
import ControlGroup from '../components/ControlGroup'
import Dropzone from '../components/Dropzone'
import FileChip from '../components/FileChip'
import SegmentedControl from '../components/SegmentedControl'
import Slider from '../components/Slider'
import StatTile from '../components/StatTile'
import Toggle from '../components/Toggle'
import ToolHeader from '../components/ToolHeader'
import { useToast } from '../components/Toast'
import WorkspaceLayout from '../components/WorkspaceLayout'
import { useObjectUrl } from '../hooks/useObjectUrl'
import { downloadBlob, getImageInfo, type ImageInfo } from '../utils/imageProcessing'
import { runImageTask, type WorkerTask } from '../utils/imageWorker'
import { createSampleImage } from '../utils/sampleImage'
import type { CharSetKey } from '../workers/types'

interface AsciiArtGeneratorProps {
    onBack: () => void
    initialFile?: File | null
}

const CHARSET_OPTIONS = [
    { value: 'standard', label: 'Standard' },
    { value: 'blocks', label: 'Blocks' },
    { value: 'simple', label: 'Simple' },
]

export default function AsciiArtGenerator({ onBack, initialFile }: AsciiArtGeneratorProps) {
    const [file, setFile] = useState<File | null>(() => initialFile ?? null)
    const [prevInitialFile, setPrevInitialFile] = useState<File | null>(initialFile ?? null)
    const [originalInfo, setOriginalInfo] = useState<ImageInfo | null>(null)
    const [asciiArt, setAsciiArt] = useState<string>('')
    const [width, setWidth] = useState(100)
    const [isProcessing, setIsProcessing] = useState(false)
    const [copied, setCopied] = useState(false)
    const [charSet, setCharSet] = useState<CharSetKey>('standard')
    const [inverted, setInverted] = useState(false)
    const preview = useObjectUrl(file)
    const taskRef = useRef<WorkerTask<string> | null>(null)
    const { success, error } = useToast()

    if (initialFile && initialFile !== prevInitialFile) {
        setPrevInitialFile(initialFile)
        setFile(initialFile)
        setAsciiArt('')
    }

    const generate = useCallback(
        async (imageFile: File, outputWidth: number, setKey: CharSetKey, isInverted: boolean) => {
            taskRef.current?.cancel()
            setIsProcessing(true)
            const task = runImageTask<string>({
                kind: 'ascii',
                file: imageFile,
                width: outputWidth,
                charSet: setKey,
                inverted: isInverted,
            })
            taskRef.current = task

            try {
                const art = await task.promise
                setAsciiArt(art)
            } catch (err) {
                if (!(err instanceof Error && err.name === 'AbortError')) {
                    error(err instanceof Error ? err.message : 'Could not generate ASCII art')
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
            setAsciiArt('')
            void generate(selectedFile, width, charSet, inverted)
        },
        [charSet, generate, inverted, width]
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
        if (initialFile && !asciiArt && !isProcessing) {
            const timer = setTimeout(() => {
                void generate(initialFile, width, charSet, inverted)
            }, 0)
            return () => clearTimeout(timer)
        }
    }, [initialFile, asciiArt, isProcessing, width, charSet, inverted, generate])

    useEffect(() => () => taskRef.current?.cancel(), [])

    const handleWidthChange = (val: number) => {
        setWidth(val)
        if (file) void generate(file, val, charSet, inverted)
    }

    const handleCharSetChange = (val: string) => {
        const key = val as CharSetKey
        setCharSet(key)
        if (file) void generate(file, width, key, inverted)
    }

    const handleInvertChange = (inv: boolean) => {
        setInverted(inv)
        if (file) void generate(file, width, charSet, inv)
    }

    const regenerate = () => {
        if (file) void generate(file, width, charSet, inverted)
    }

    const copyArt = async () => {
        try {
            await navigator.clipboard.writeText(asciiArt)
            setCopied(true)
            success('ASCII art copied to clipboard')
            setTimeout(() => setCopied(false), 2000)
        } catch {
            error('Clipboard access was blocked by your browser')
        }
    }

    const downloadArt = () => {
        if (!asciiArt) return
        downloadBlob(new Blob([asciiArt], { type: 'text/plain' }), 'ascii-art.txt')
    }

    const handleReset = () => {
        taskRef.current?.cancel()
        setFile(null)
        setOriginalInfo(null)
        setAsciiArt('')
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

            <ControlGroup label="Canvas Width" hint="Total horizontal character columns">
                <Slider
                    value={width}
                    min={40}
                    max={200}
                    step={5}
                    unit=" cols"
                    onChange={handleWidthChange}
                />
            </ControlGroup>

            <ControlGroup label="Glyph Palette" hint="Gradient ramp mapping pixel luminance to characters">
                <SegmentedControl
                    value={charSet}
                    onChange={handleCharSetChange}
                    options={CHARSET_OPTIONS}
                />
            </ControlGroup>

            <ControlGroup label="Luminance Inversion">
                <Toggle
                    checked={inverted}
                    onChange={handleInvertChange}
                    label="Invert Brightness"
                    description="Flips dark and light character density"
                />
            </ControlGroup>

            <Button
                variant="secondary"
                size="sm"
                onClick={regenerate}
                isLoading={isProcessing}
                icon={<RefreshCw size={13} />}
            >
                Regenerate Art
            </Button>
        </>
    )

    const centerCanvas = !file ? (
        <Dropzone
            onFiles={(files) => handleFile(files[0])}
            icon="terminal"
            title="Drop image to convert to ASCII art"
            hint="Transforms pixel luminance to text characters in your browser"
            onTrySample={async () => {
                const s = await createSampleImage()
                handleFile(s)
            }}
        />
    ) : (
        <div
            style={{
                width: '100%',
                maxWidth: '1000px',
                display: 'grid',
                gridTemplateColumns: 'minmax(200px, 300px) 1fr',
                gap: 'var(--spacing-4)',
                alignItems: 'start',
            }}
        >
            <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '0 0 var(--spacing-2) 0', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    Original Image
                </p>
                <img
                    src={preview || undefined}
                    alt="Source"
                    style={{
                        width: '100%',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border-subtle)',
                    }}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-2)' }}>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                        Terminal ASCII Output ({width} cols)
                    </p>
                    <Button variant="ghost" size="sm" onClick={() => void copyArt()} icon={copied ? <Check size={13} /> : <Copy size={13} />}>
                        {copied ? 'Copied' : 'Copy'}
                    </Button>
                </div>

                <pre
                    style={{
                        margin: 0,
                        padding: 'var(--spacing-3)',
                        backgroundColor: '#050507',
                        color: '#4ade80',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border-subtle)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '6.5px',
                        lineHeight: 1.05,
                        letterSpacing: '0.05em',
                        overflowX: 'auto',
                        maxHeight: '65vh',
                        whiteSpace: 'pre',
                    }}
                >
                    {asciiArt || (isProcessing ? 'Generating ASCII stream…' : 'Ready')}
                </pre>
            </div>
        </div>
    )

    const bottomBar = (
        <>
            <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                <StatTile label="Columns" value={`${width} chars`} />
                <StatTile label="Palette" value={charSet.toUpperCase()} />
            </div>

            <div className="workspace-action-group">
                <Button variant="ghost" onClick={handleReset} icon={<RotateCcw size={15} />}>
                    Reset
                </Button>
                <Button
                    variant="secondary"
                    onClick={() => void copyArt()}
                    disabled={!asciiArt}
                    icon={copied ? <Check size={15} /> : <Copy size={15} />}
                >
                    {copied ? 'Copied' : 'Copy ASCII'}
                </Button>
                <Button
                    variant="primary"
                    onClick={downloadArt}
                    disabled={!asciiArt}
                    icon={<Download size={15} />}
                >
                    Download .txt
                </Button>
            </div>
        </>
    )

    return (
        <div className="tool-view-wrapper">
            <ToolHeader
                toolName="ASCII Art Generator"
                toolIcon={<Terminal size={18} />}
                toolId="ascii-art"
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
