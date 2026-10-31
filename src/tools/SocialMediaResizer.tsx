import { Archive, Check, Download, Maximize2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import Button from '../components/Button'
import Dropzone from '../components/Dropzone'
import FileChip from '../components/FileChip'
import SegmentedControl from '../components/SegmentedControl'
import StatTile from '../components/StatTile'
import ToolHeader from '../components/ToolHeader'
import { useToast } from '../components/Toast'
import WorkspaceLayout from '../components/WorkspaceLayout'
import { useObjectUrl } from '../hooks/useObjectUrl'
import {
    buildOutputName,
    downloadBlob,
    formatFileSize,
    getImageInfo,
    resizeImage,
    type ImageInfo,
} from '../utils/imageProcessing'
import { getSampleImageFile } from '../utils/sampleImage'
import { platforms, type PlatformPreset } from '../utils/socialPresets'

interface SocialMediaResizerProps {
    onBack: () => void
    initialFile?: File | null
    onProduceFile?: (file: File) => void
}

interface ActivePresetItem {
    platformName: string
    preset: PlatformPreset
}

export default function SocialMediaResizer({
    onBack,
    initialFile,
    onProduceFile,
}: SocialMediaResizerProps) {
    const [file, setFile] = useState<File | null>(initialFile ?? null)
    const [prevInitialFile, setPrevInitialFile] = useState<File | null>(initialFile ?? null)
    const [originalInfo, setOriginalInfo] = useState<ImageInfo | null>(null)
    const [activePlatformIndex, setActivePlatformIndex] = useState(0)
    const [selectedPresets, setSelectedPresets] = useState<ActivePresetItem[]>([])
    const [fitMode, setFitMode] = useState<'cover' | 'contain'>('cover')
    const [isProcessing, setIsProcessing] = useState(false)
    const [previewBlob, setPreviewBlob] = useState<Blob | null>(null)
    const { success, error } = useToast()

    if (initialFile && initialFile !== prevInitialFile) {
        setPrevInitialFile(initialFile)
        setFile(initialFile)
        setPreviewBlob(null)
    }

    const currentPreset = selectedPresets[0]
    const effectivePreview = file && currentPreset ? previewBlob : null

    const originalUrl = useObjectUrl(file)
    const previewUrl = useObjectUrl(effectivePreview)

    const handleFile = useCallback((selectedFile: File) => {
        setFile(selectedFile)
        setPreviewBlob(null)
    }, [])

    // Read metadata and initialize default preset when file changes
    useEffect(() => {
        if (!file) return
        let cancelled = false
        void getImageInfo(file).then((info) => {
            if (cancelled) return
            setOriginalInfo(info)
            const defaultPreset = platforms[0]?.presets[0]
            if (defaultPreset) {
                setSelectedPresets([{ platformName: platforms[0].name, preset: defaultPreset }])
            }
        }).catch(() => {
            if (cancelled) return
            setOriginalInfo(null)
        })
        return () => {
            cancelled = true
        }
    }, [file])

    // Render single preview when currentPreset changes
    useEffect(() => {
        if (!file || !currentPreset) return

        let cancelled = false
        const runPreview = async () => {
            try {
                const blob = await resizeImage(
                    file,
                    currentPreset.preset.width,
                    currentPreset.preset.height,
                    fitMode,
                    { format: 'image/jpeg', quality: 0.9 }
                )
                if (!cancelled) setPreviewBlob(blob)
            } catch {
                // Ignore preview errors
            }
        }

        void runPreview()
        return () => {
            cancelled = true
        }
    }, [file, currentPreset, fitMode])

    const togglePreset = (platformName: string, preset: PlatformPreset) => {
        const key = `${platformName}-${preset.name}`
        const exists = selectedPresets.some(
            (p) => `${p.platformName}-${p.preset.name}` === key
        )

        if (exists) {
            if (selectedPresets.length > 1) {
                setSelectedPresets((prev) =>
                    prev.filter((p) => `${p.platformName}-${p.preset.name}` !== key)
                )
            }
        } else {
            setSelectedPresets((prev) => [...prev, { platformName, preset }])
        }
    }

    const isPresetSelected = (platformName: string, presetName: string) => {
        return selectedPresets.some(
            (p) => p.platformName === platformName && p.preset.name === presetName
        )
    }

    const handleDownloadSingle = async () => {
        if (!file || !currentPreset) return
        setIsProcessing(true)
        try {
            const blob = await resizeImage(
                file,
                currentPreset.preset.width,
                currentPreset.preset.height,
                fitMode,
                { format: 'image/jpeg', quality: 0.92 }
            )
            const safeName = `${currentPreset.platformName}-${currentPreset.preset.name}`
            const filename = buildOutputName(file.name, safeName, 'jpg')
            downloadBlob(blob, filename)
            success(`Downloaded ${currentPreset.preset.name}`)
            if (onProduceFile) {
                onProduceFile(new File([blob], filename, { type: 'image/jpeg' }))
            }
        } catch (err) {
            error(err instanceof Error ? err.message : 'Resize failed')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleDownloadAllZip = async () => {
        if (!file || selectedPresets.length === 0) return
        setIsProcessing(true)
        try {
            const { default: JSZip } = await import('jszip')
            const zip = new JSZip()

            for (const item of selectedPresets) {
                const blob = await resizeImage(
                    file,
                    item.preset.width,
                    item.preset.height,
                    fitMode,
                    { format: 'image/jpeg', quality: 0.92 }
                )
                const safeName = `${item.platformName}_${item.preset.name.replace(/\s+/g, '_')}_${item.preset.width}x${item.preset.height}.jpg`
                zip.file(safeName, blob)
            }

            const zipBlob = await zip.generateAsync({ type: 'blob' })
            downloadBlob(zipBlob, buildOutputName(file.name, 'social-pack', 'zip'))
            success(`Exported ZIP with ${selectedPresets.length} presets!`)
        } catch (err) {
            error(err instanceof Error ? err.message : 'ZIP generation failed')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleReset = () => {
        setFile(null)
        setOriginalInfo(null)
        setPreviewBlob(null)
        setSelectedPresets([])
    }

    const handleTrySample = async () => {
        const sample = await getSampleImageFile()
        handleFile(sample)
    }

    const header = (
        <ToolHeader
            title="Social Media Resizer"
            icon={<Maximize2 size={16} />}
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
                            Pixel-Perfect Social Formats
                        </p>
                        <p>
                            Instantly adapt your images for Instagram posts, Stories, YouTube banners, LinkedIn covers, and Twitter/X cards.
                        </p>
                    </div>
                }
                canvas={
                    <div style={{ width: '100%', maxWidth: 640 }}>
                        <Dropzone
                            onFiles={(files) => handleFile(files[0])}
                            icon={<Maximize2 size={24} />}
                            title="Drop image to resize for social platforms"
                            hint="Supports JPEG, PNG, WebP up to 50 MB"
                            onTrySample={handleTrySample}
                        />
                    </div>
                }
            />
        )
    }

    const platform = platforms[activePlatformIndex] || platforms[0]

    const controls = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
            <div className="rail-section">
                <span className="rail-section-title">Source Image</span>
                <FileChip
                    name={file.name}
                    sizeText={formatFileSize(file.size)}
                    thumbnailUrl={originalUrl}
                    onRemove={handleReset}
                />
            </div>

            <div className="rail-section">
                <span className="rail-section-title">Fitting Mode</span>
                <SegmentedControl
                    options={[
                        { value: 'cover', label: 'Cover (Fill & Crop)' },
                        { value: 'contain', label: 'Contain (Fit all)' },
                    ]}
                    value={fitMode}
                    onChange={(val) => setFitMode(val)}
                />
            </div>

            <div className="rail-section">
                <span className="rail-section-title">Select Platform</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {platforms.map((p, idx) => (
                        <button
                            key={p.name}
                            type="button"
                            className={`filter-chip ${idx === activePlatformIndex ? 'active' : ''}`}
                            onClick={() => setActivePlatformIndex(idx)}
                        >
                            <span>{p.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="rail-section">
                <span className="rail-section-title">{platform.name} Presets</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {platform.presets.map((preset) => {
                        const selected = isPresetSelected(platform.name, preset.name)
                        return (
                            <button
                                key={preset.name}
                                type="button"
                                onClick={() => togglePreset(platform.name, preset)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '8px 12px',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid',
                                    borderColor: selected ? 'var(--color-accent)' : 'var(--color-border-default)',
                                    backgroundColor: selected ? 'var(--color-accent-subtle)' : 'var(--color-bg-surface)',
                                    color: 'var(--color-text-primary)',
                                    textAlign: 'left',
                                    transition: 'all var(--transition-fast)',
                                }}
                            >
                                <div>
                                    <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                                        {preset.name}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                                        {preset.description}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span className="tabular-nums" style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                                        {preset.width} × {preset.height}
                                    </span>
                                    {selected && <Check size={14} style={{ color: 'var(--color-accent)' }} />}
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )

    const canvas = (
        <div style={{ width: '100%', maxWidth: 840, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {previewUrl ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <img
                        src={previewUrl}
                        alt="Resized Preview"
                        className="workspace-canvas-preview checkerboard-pattern"
                        style={{ border: '1px solid var(--color-border-default)' }}
                    />
                    {currentPreset && (
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                            Previewing: <strong style={{ color: 'var(--color-text-primary)' }}>{currentPreset.platformName} {currentPreset.preset.name}</strong> ({currentPreset.preset.width} × {currentPreset.preset.height} px)
                        </div>
                    )}
                </div>
            ) : (
                originalUrl && (
                    <img src={originalUrl} alt="Original" className="workspace-canvas-preview" />
                )
            )}
        </div>
    )

    const actionBar = (
        <>
            <div className="actionbar-left">
                <div className="stat-tiles-row">
                    <StatTile
                        label="Selected Presets"
                        value={selectedPresets.length}
                    />
                    {currentPreset && (
                        <StatTile
                            label="Target Dimensions"
                            value={`${currentPreset.preset.width} × ${currentPreset.preset.height}`}
                        />
                    )}
                    {originalInfo && (
                        <StatTile
                            label="Source"
                            value={`${originalInfo.width} × ${originalInfo.height}`}
                        />
                    )}
                </div>
            </div>

            <div className="actionbar-right">
                {selectedPresets.length > 1 && (
                    <Button
                        variant="secondary"
                        size="md"
                        icon={<Archive size={16} />}
                        onClick={handleDownloadAllZip}
                        isLoading={isProcessing}
                    >
                        Download All as ZIP ({selectedPresets.length})
                    </Button>
                )}
                <Button
                    variant="primary"
                    size="md"
                    icon={<Download size={16} />}
                    onClick={handleDownloadSingle}
                    isLoading={isProcessing}
                >
                    Download {currentPreset?.preset.name || 'Image'}
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
