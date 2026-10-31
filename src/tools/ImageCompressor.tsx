import { Download, Minimize2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import Button from '../components/Button'
import CompareView from '../components/CompareView'
import Dropzone from '../components/Dropzone'
import FileChip from '../components/FileChip'
import SegmentedControl from '../components/SegmentedControl'
import Slider from '../components/Slider'
import StatTile from '../components/StatTile'
import ToolHeader from '../components/ToolHeader'
import WorkspaceLayout from '../components/WorkspaceLayout'
import { useObjectUrl } from '../hooks/useObjectUrl'
import {
    buildOutputName,
    compressImage,
    downloadBlob,
    formatFileSize,
    getExtension,
    getImageInfo,
    type ImageInfo,
    type OutputMime,
} from '../utils/imageProcessing'
import { getSampleImageFile } from '../utils/sampleImage'

interface ImageCompressorProps {
    onBack: () => void
    initialFile?: File | null
    onProduceFile?: (file: File) => void
}

const FORMAT_OPTIONS: { value: OutputMime; label: string }[] = [
    { value: 'image/jpeg', label: 'JPEG' },
    { value: 'image/webp', label: 'WebP' },
    { value: 'image/png', label: 'PNG' },
]

export default function ImageCompressor({
    onBack,
    initialFile,
    onProduceFile,
}: ImageCompressorProps) {
    const [file, setFile] = useState<File | null>(() => initialFile ?? null)
    const [prevInitialFile, setPrevInitialFile] = useState<File | null>(initialFile ?? null)
    const [originalInfo, setOriginalInfo] = useState<ImageInfo | null>(null)
    const [quality, setQuality] = useState(80)
    const [format, setFormat] = useState<OutputMime>('image/jpeg')
    const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [useOriginal, setUseOriginal] = useState(false)

    if (initialFile && initialFile !== prevInitialFile) {
        setPrevInitialFile(initialFile)
        setFile(initialFile)
        setCompressedBlob(null)
        setUseOriginal(false)
    }

    const originalUrl = useObjectUrl(file)
    const compressedUrl = useObjectUrl(compressedBlob)

    const handleFile = useCallback((selectedFile: File) => {
        setFile(selectedFile)
        setCompressedBlob(null)
        setUseOriginal(false)
    }, [])

    // Read metadata when file changes
    useEffect(() => {
        if (!file) return
        let cancelled = false
        void getImageInfo(file).then((info) => {
            if (cancelled) return
            setOriginalInfo(info)
            if (file.type === 'image/webp') setFormat('image/webp')
            else if (file.type === 'image/png') setFormat('image/png')
            else setFormat('image/jpeg')
        }).catch((error) => {
            console.error('Error reading image info:', error)
        })
        return () => {
            cancelled = true
        }
    }, [file])

    // Compress whenever file, quality, or format changes
    useEffect(() => {
        if (!file) return

        let cancelled = false

        const timer = setTimeout(async () => {
            setIsProcessing(true)
            try {
                const result = await compressImage(file, quality, format)
                if (cancelled) return
                setUseOriginal(result.isLarger)
                setCompressedBlob(result.blob)

                if (onProduceFile) {
                    const ext = getExtension(format)
                    const producedFile = new File([result.blob], buildOutputName(file.name, 'compressed', ext), { type: format })
                    onProduceFile(producedFile)
                }
            } catch (error) {
                console.error('Compression failed:', error)
            } finally {
                if (!cancelled) setIsProcessing(false)
            }
        }, 220)

        return () => {
            cancelled = true
            clearTimeout(timer)
        }
    }, [file, quality, format, onProduceFile])

    const handleDownload = () => {
        if (!file) return
        if (useOriginal || !compressedBlob) {
            downloadBlob(file, file.name)
            return
        }
        const ext = getExtension(format)
        downloadBlob(compressedBlob, buildOutputName(file.name, 'compressed', ext))
    }

    const handleReset = () => {
        setFile(null)
        setOriginalInfo(null)
        setCompressedBlob(null)
        setUseOriginal(false)
    }

    const handleTrySample = async () => {
        const sample = await getSampleImageFile()
        void handleFile(sample)
    }

    // Calculations
    const originalSize = file?.size ?? 0
    const compressedSize = compressedBlob?.size ?? 0
    const savedBytes = originalSize - compressedSize
    const savedPct = originalSize > 0 ? Math.round((savedBytes / originalSize) * 100) : 0
    const isLarger = compressedSize > originalSize

    const header = (
        <ToolHeader
            title="Image Compressor"
            icon={<Minimize2 size={16} />}
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
                            Client-Side Compression
                        </p>
                        <p>
                            Reduce image payload sizes for web, email, or apps while maintaining visual quality. Everything executes entirely inside your browser tab.
                        </p>
                    </div>
                }
                canvas={
                    <div style={{ width: '100%', maxWidth: 640 }}>
                        <Dropzone
                            onFiles={(files) => handleFile(files[0])}
                            icon={<Minimize2 size={24} />}
                            title="Drop image to compress, click to browse, or paste"
                            hint="Supports JPEG, PNG, WebP up to 50 MB"
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
                    sizeText={formatFileSize(originalSize)}
                    thumbnailUrl={originalUrl}
                    onRemove={handleReset}
                />
            </div>

            <div className="rail-section">
                <span className="rail-section-title">Output Format</span>
                <SegmentedControl
                    options={FORMAT_OPTIONS}
                    value={format}
                    onChange={(val) => setFormat(val)}
                />
            </div>

            <div className="rail-section">
                <span className="rail-section-title">Compression Quality</span>
                <Slider
                    label="Quality Level"
                    value={quality}
                    min={10}
                    max={100}
                    step={1}
                    unit="%"
                    onChange={setQuality}
                />
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: -6 }}>
                    {quality > 85 ? 'High quality, larger file' : quality < 60 ? 'Maximum compression, visible loss' : 'Balanced visual quality and file savings'}
                </span>
            </div>

            {isLarger && (
                <div
                    style={{
                        padding: 'var(--spacing-3)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-warning-subtle)',
                        border: '1px solid var(--color-warning)',
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-primary)',
                        lineHeight: 'var(--line-height-normal)',
                    }}
                >
                    ⚠️ Compressed output is larger than source. We recommend keeping the original file.
                </div>
            )}
        </div>
    )

    const canvas = (
        <div style={{ width: '100%', maxWidth: 900, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {originalUrl && compressedUrl ? (
                <CompareView
                    beforeSrc={originalUrl}
                    afterSrc={compressedUrl}
                    beforeLabel="Original"
                    afterLabel={`Compressed (${formatFileSize(compressedSize)})`}
                />
            ) : (
                originalUrl && (
                    <img
                        src={originalUrl}
                        alt="Preview"
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
                    <StatTile label="Original" value={formatFileSize(originalSize)} />
                    <StatTile
                        label="Compressed"
                        value={compressedSize > 0 ? formatFileSize(compressedSize) : '…'}
                        delta={savedPct > 0 ? `-${savedPct}%` : undefined}
                    />
                    {originalInfo && (
                        <StatTile
                            label="Dimensions"
                            value={`${originalInfo.width} × ${originalInfo.height}`}
                        />
                    )}
                </div>
            </div>

            <div className="actionbar-right">
                <Button
                    variant="primary"
                    size="md"
                    icon={<Download size={16} />}
                    onClick={handleDownload}
                    isLoading={isProcessing}
                >
                    {useOriginal ? 'Download Original' : `Download ${getExtension(format).toUpperCase()}`}
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
