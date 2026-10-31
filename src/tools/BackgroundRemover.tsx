import { Download, Eraser, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import Button from '../components/Button'
import CompareView from '../components/CompareView'
import Dropzone from '../components/Dropzone'
import FileChip from '../components/FileChip'
import ProgressBar from '../components/ProgressBar'
import StatTile from '../components/StatTile'
import Toggle from '../components/Toggle'
import ToolHeader from '../components/ToolHeader'
import { useToast } from '../components/Toast'
import WorkspaceLayout from '../components/WorkspaceLayout'
import { useObjectUrl } from '../hooks/useObjectUrl'
import {
    applyBackground,
    buildOutputName,
    downloadBlob,
    formatFileSize,
    getImageInfo,
    type ImageInfo,
} from '../utils/imageProcessing'
import { getSampleImageFile } from '../utils/sampleImage'

interface BackgroundRemoverProps {
    onBack: () => void
    initialFile?: File | null
    onProduceFile?: (file: File) => void
}

export default function BackgroundRemover({
    onBack,
    initialFile,
    onProduceFile,
}: BackgroundRemoverProps) {
    const [file, setFile] = useState<File | null>(initialFile ?? null)
    const [prevInitialFile, setPrevInitialFile] = useState<File | null>(initialFile ?? null)
    const [originalInfo, setOriginalInfo] = useState<ImageInfo | null>(null)
    const [processedBlob, setProcessedBlob] = useState<Blob | null>(null)
    const [finalBlob, setFinalBlob] = useState<Blob | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [progress, setProgress] = useState(0)
    const [stageText, setStageText] = useState('Preparing…')
    const [applyBg, setApplyBg] = useState(false)
    const [backgroundColor, setBackgroundColor] = useState('#ffffff')
    const runIdRef = useRef(0)
    const bgRunIdRef = useRef(0)
    const { success, error } = useToast()

    if (initialFile && initialFile !== prevInitialFile) {
        setPrevInitialFile(initialFile)
        setFile(initialFile)
        setProcessedBlob(null)
        setFinalBlob(null)
        setProgress(0)
        setApplyBg(false)
    }

    const originalUrl = useObjectUrl(file)
    const finalUrl = useObjectUrl(finalBlob)

    const handleFile = useCallback((selectedFile: File) => {
        runIdRef.current += 1
        bgRunIdRef.current += 1
        setFile(selectedFile)
        setProcessedBlob(null)
        setFinalBlob(null)
        setProgress(0)
        setApplyBg(false)
    }, [])

    useEffect(() => {
        if (!file) return
        let cancelled = false
        void getImageInfo(file).then((info) => {
            if (cancelled) return
            setOriginalInfo(info)
        }).catch(() => {
            if (cancelled) return
            setOriginalInfo(null)
        })
        return () => {
            cancelled = true
        }
    }, [file])

    const handleRemoveBackground = async () => {
        if (!file || isProcessing) return

        const runId = ++runIdRef.current
        setIsProcessing(true)
        setProgress(0)
        setStageText('Downloading neural net model (first run ~30 MB)…')

        try {
            const { removeBackground } = await import('@imgly/background-removal')
            const blob = await removeBackground(file, {
                progress: (key, current, total) => {
                    if (runIdRef.current !== runId) return
                    if (key.includes('fetch')) {
                        setStageText(`Loading model weights (${Math.round((current / (1024 * 1024)))} MB)…`)
                    } else if (key.includes('compute')) {
                        setStageText('Analyzing image segmentation…')
                    }
                    if (total > 0) {
                        setProgress(Math.round((current / total) * 100))
                    }
                },
            })

            if (runIdRef.current !== runId) return
            setProcessedBlob(blob)
            setFinalBlob(blob)
            setProgress(100)
            success('Background removed successfully!')

            if (onProduceFile) {
                const produced = new File([blob], buildOutputName(file.name, 'nobg', 'png'), { type: 'image/png' })
                onProduceFile(produced)
            }
        } catch (err) {
            if (runIdRef.current === runId) {
                error(err instanceof Error ? err.message : 'Could not remove background. Check connection for model download.')
            }
        } finally {
            if (runIdRef.current === runId) setIsProcessing(false)
        }
    }

    const updateFinalBackground = useCallback(async (enabled: boolean, color: string) => {
        if (!processedBlob) return
        const runId = ++bgRunIdRef.current
        if (!enabled) {
            setFinalBlob(processedBlob)
            return
        }
        try {
            const blob = await applyBackground(processedBlob, color, 'image/jpeg')
            if (bgRunIdRef.current === runId) setFinalBlob(blob)
        } catch (err) {
            if (bgRunIdRef.current === runId) {
                error(err instanceof Error ? err.message : 'Failed to apply background color')
            }
        }
    }, [error, processedBlob])

    const handleToggleBg = (enabled: boolean) => {
        setApplyBg(enabled)
        void updateFinalBackground(enabled, backgroundColor)
    }

    const handleColorChange = (color: string) => {
        setBackgroundColor(color)
        if (applyBg) void updateFinalBackground(true, color)
    }

    const handleDownload = () => {
        if (!finalBlob || !file) return
        const ext = applyBg ? 'jpg' : 'png'
        const filename = buildOutputName(file.name, 'nobg', ext)
        downloadBlob(finalBlob, filename)
    }

    const handleReset = () => {
        runIdRef.current += 1
        setFile(null)
        setOriginalInfo(null)
        setProcessedBlob(null)
        setFinalBlob(null)
        setIsProcessing(false)
        setProgress(0)
    }

    const handleTrySample = async () => {
        const sample = await getSampleImageFile()
        void handleFile(sample)
    }

    const header = (
        <ToolHeader
            title="Background Remover"
            icon={<Eraser size={16} />}
            onBack={onBack}
            onReset={file ? handleReset : undefined}
        />
    )

    if (!file) {
        return (
            <WorkspaceLayout
                header={header}
                controls={
                    <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', lineHeight: 'var(--line-height-relaxed)' }}>
                        <p style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                            Client-Side AI Segmentation
                        </p>
                        <p>
                            Isolates people, products, or subjects using machine learning running directly in WebAssembly inside your browser. No files are ever sent to an external server.
                        </p>
                    </div>
                }
                canvas={
                    <div style={{ width: '100%', maxWidth: 640 }}>
                        <Dropzone
                            onFiles={(files) => handleFile(files[0])}
                            icon={<Eraser size={24} />}
                            title="Drop image to remove background"
                            hint="Works best on portraits, products, and animals"
                            onTrySample={handleTrySample}
                        />
                    </div>
                }
            />
        )
    }

    const controls = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
            <div className="rail-section">
                <span className="rail-section-title">Source File</span>
                <FileChip
                    name={file.name}
                    sizeText={formatFileSize(file.size)}
                    thumbnailUrl={originalUrl}
                    onRemove={handleReset}
                />
            </div>

            <div className="rail-section">
                <span className="rail-section-title">AI Isolation</span>
                {!processedBlob ? (
                    <Button
                        variant="primary"
                        size="md"
                        icon={<Sparkles size={16} />}
                        onClick={handleRemoveBackground}
                        isLoading={isProcessing}
                    >
                        {isProcessing ? 'Removing Background…' : 'Remove Background'}
                    </Button>
                ) : (
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        ✓ Background removed
                    </div>
                )}
            </div>

            {isProcessing && (
                <div className="rail-section">
                    <ProgressBar
                        progress={progress}
                        stageText={stageText}
                        onCancel={() => {
                            runIdRef.current += 1
                            setIsProcessing(false)
                        }}
                    />
                </div>
            )}

            {processedBlob && (
                <div className="rail-section">
                    <span className="rail-section-title">Background Style</span>
                    <Toggle
                        label="Solid Color Background"
                        description="Replace transparent cutout with a solid backdrop"
                        checked={applyBg}
                        onChange={handleToggleBg}
                    />
                    {applyBg && (
                        <div style={{ marginTop: 'var(--spacing-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input
                                type="color"
                                value={backgroundColor}
                                onChange={(e) => handleColorChange(e.target.value)}
                                className="color-picker"
                            />
                            <span style={{ fontSize: 'var(--font-size-xs)', fontFamily: 'var(--font-mono)' }}>
                                {backgroundColor}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    )

    const canvas = (
        <div style={{ width: '100%', maxWidth: 900, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {originalUrl && finalUrl ? (
                <CompareView
                    beforeSrc={originalUrl}
                    afterSrc={finalUrl}
                    beforeLabel="Original"
                    afterLabel={applyBg ? 'Color Backdrop' : 'Cutout (Transparent)'}
                />
            ) : (
                originalUrl && (
                    <img
                        src={originalUrl}
                        alt="Original Preview"
                        className="workspace-canvas-preview"
                    />
                )
            )}
        </div>
    )

    const actionBar = (
        <>
            <div className="actionbar-left">
                <div className="stat-tiles-row">
                    <StatTile label="Source Size" value={formatFileSize(file.size)} />
                    {finalBlob && (
                        <StatTile label="Output Size" value={formatFileSize(finalBlob.size)} />
                    )}
                    {originalInfo && (
                        <StatTile label="Resolution" value={`${originalInfo.width} × ${originalInfo.height}`} />
                    )}
                </div>
            </div>

            <div className="actionbar-right">
                <Button
                    variant="primary"
                    size="md"
                    icon={<Download size={16} />}
                    onClick={handleDownload}
                    disabled={!finalBlob || isProcessing}
                >
                    Download {applyBg ? 'JPEG' : 'PNG (Transparent)'}
                </Button>
            </div>
        </>
    )

    return (
        <WorkspaceLayout
            header={header}
            controls={controls}
            canvas={canvas}
            actionBar={actionBar}
        />
    )
}
