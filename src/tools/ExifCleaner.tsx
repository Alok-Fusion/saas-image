import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Download, FileWarning, RotateCcw, Shield, ShieldCheck } from 'lucide-react'
import Button from '../components/Button'
import ControlGroup from '../components/ControlGroup'
import Dropzone from '../components/Dropzone'
import FileChip from '../components/FileChip'
import StatTile from '../components/StatTile'
import ToolHeader from '../components/ToolHeader'
import { useToast } from '../components/Toast'
import WorkspaceLayout from '../components/WorkspaceLayout'
import { useObjectUrl } from '../hooks/useObjectUrl'
import { parseExif, type ExifSummary } from '../utils/exif'
import {
    buildOutputName,
    canvasToBlob,
    downloadBlob,
    getExtension,
    getImageInfo,
    getOutputMime,
    loadImage,
    type ImageInfo,
} from '../utils/imageProcessing'
import { createSampleImage } from '../utils/sampleImage'

interface ExifCleanerProps {
    onBack: () => void
    initialFile?: File | null
    onProduceFile?: (file: File) => void
}

export default function ExifCleaner({
    onBack,
    initialFile,
    onProduceFile,
}: ExifCleanerProps) {
    const [file, setFile] = useState<File | null>(() => initialFile ?? null)
    const [prevInitialFile, setPrevInitialFile] = useState<File | null>(initialFile ?? null)
    const [originalInfo, setOriginalInfo] = useState<ImageInfo | null>(null)
    const [exif, setExif] = useState<ExifSummary | null>(null)
    const [cleanedBlob, setCleanedBlob] = useState<Blob | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const preview = useObjectUrl(file)
    const { error, success } = useToast()

    if (initialFile && initialFile !== prevInitialFile) {
        setPrevInitialFile(initialFile)
        setFile(initialFile)
        setCleanedBlob(null)
        setExif(null)
    }

    const handleFile = useCallback((selectedFile: File) => {
        setFile(selectedFile)
        setCleanedBlob(null)
        setExif(null)
    }, [])

    useEffect(() => {
        if (!file) return
        let cancelled = false
        void Promise.all([getImageInfo(file), parseExif(file)])
            .then(([info, exifData]) => {
                if (cancelled) return
                setOriginalInfo(info)
                setExif(exifData)
            })
            .catch((err) => {
                if (cancelled) return
                error(err instanceof Error ? err.message : 'Could not read metadata')
            })
        return () => {
            cancelled = true
        }
    }, [file, error])

    const handleClean = async () => {
        if (!file) return
        setIsProcessing(true)
        try {
            const img = await loadImage(file)
            const canvas = document.createElement('canvas')
            canvas.width = img.naturalWidth || img.width
            canvas.height = img.naturalHeight || img.height
            const ctx = canvas.getContext('2d')
            if (!ctx) throw new Error('Canvas is not available')

            const format = getOutputMime(file.type)
            if (format === 'image/jpeg') {
                ctx.fillStyle = '#ffffff'
                ctx.fillRect(0, 0, canvas.width, canvas.height)
            }
            ctx.drawImage(img, 0, 0)

            const blob = await canvasToBlob(canvas, format, 0.92)
            setCleanedBlob(blob)
            const outName = buildOutputName(file.name, 'clean', getExtension(blob.type))
            if (onProduceFile) {
                onProduceFile(new File([blob], outName, { type: blob.type }))
            }
            success('Metadata removed. Clean file is ready.')
        } catch (err) {
            error(err instanceof Error ? err.message : 'Could not clean the image')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleDownload = () => {
        if (!cleanedBlob || !file) return
        downloadBlob(cleanedBlob, buildOutputName(file.name, 'clean', getExtension(cleanedBlob.type)))
    }

    const handleReset = () => {
        setFile(null)
        setOriginalInfo(null)
        setExif(null)
        setCleanedBlob(null)
    }

    const hasFields = exif ? Object.keys(exif.fields).length > 0 : false
    const isJpeg = file ? file.type === 'image/jpeg' || file.type === 'image/jpg' : false

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

            <ControlGroup
                label="Privacy Scan"
                hint={
                    cleanedBlob
                        ? 'Image sanitized — all metadata removed'
                        : hasFields
                        ? 'Sensitive metadata tags found in file'
                        : 'No EXIF metadata tags detected'
                }
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-2)',
                        padding: 'var(--spacing-3)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: cleanedBlob
                            ? 'var(--color-success-subtle)'
                            : hasFields
                            ? 'var(--color-danger-subtle)'
                            : 'var(--color-bg-surface-elevated)',
                        border: '1px solid var(--color-border-default)',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: cleanedBlob
                            ? 'var(--color-success)'
                            : hasFields
                            ? 'var(--color-danger)'
                            : 'var(--color-text-primary)',
                    }}
                >
                    {cleanedBlob ? (
                        <>
                            <CheckCircle2 size={16} />
                            <span>100% Sanitized & Clean</span>
                        </>
                    ) : hasFields ? (
                        <>
                            <FileWarning size={16} />
                            <span>Metadata Detected</span>
                        </>
                    ) : (
                        <>
                            <ShieldCheck size={16} />
                            <span>No Hidden EXIF Detected</span>
                        </>
                    )}
                </div>
            </ControlGroup>

            {exif && hasFields && (
                <ControlGroup label="Detected Metadata Tags">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
                        {Object.entries(exif.fields).map(([key, value]) => (
                            <div
                                key={key}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '6px 8px',
                                    background: 'var(--color-bg-surface-elevated)',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '11px',
                                }}
                            >
                                <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>{key}</span>
                                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>{value}</span>
                            </div>
                        ))}
                    </div>
                </ControlGroup>
            )}

            {!isJpeg && file && (
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                    Note: EXIF tag inspection targets JPEG files. Re-encoding still strips all metadata chunks from {file.type || 'this format'}.
                </p>
            )}
        </>
    )

    const centerCanvas = !file ? (
        <Dropzone
            onFiles={(files) => void handleFile(files[0])}
            icon="shield"
            title="Drop image to strip metadata"
            hint="Removes camera info, GPS coordinates, dates & device tags"
            onTrySample={async () => {
                const s = await createSampleImage()
                void handleFile(s)
            }}
        />
    ) : (
        <div style={{ maxWidth: '800px', width: '100%', textAlign: 'center' }}>
            <img
                src={preview || undefined}
                alt="Source preview"
                style={{
                    maxHeight: '65vh',
                    maxWidth: '100%',
                    objectFit: 'contain',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border-subtle)',
                }}
            />
        </div>
    )

    const bottomBar = (
        <>
            <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                <StatTile
                    label="Status"
                    value={cleanedBlob ? 'Clean' : hasFields ? 'Metadata' : 'Safe'}
                />
                {originalInfo && (
                    <StatTile
                        label="Dimensions"
                        value={`${originalInfo.width} × ${originalInfo.height}`}
                    />
                )}
            </div>

            <div className="workspace-action-group">
                <Button variant="ghost" onClick={handleReset} icon={<RotateCcw size={15} />}>
                    Reset
                </Button>
                {!cleanedBlob ? (
                    <Button
                        variant="primary"
                        onClick={() => void handleClean()}
                        isLoading={isProcessing}
                        icon={<Shield size={15} />}
                    >
                        Remove All Metadata
                    </Button>
                ) : (
                    <Button
                        variant="primary"
                        onClick={handleDownload}
                        icon={<Download size={15} />}
                    >
                        Download Clean Image
                    </Button>
                )}
            </div>
        </>
    )

    return (
        <div className="tool-view-wrapper">
            <ToolHeader
                toolName="EXIF Privacy Cleaner"
                toolIcon={<Shield size={18} />}
                toolId="exif-cleaner"
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
