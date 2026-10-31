import { useCallback, useEffect, useRef, useState } from 'react'
import { Copy, RotateCcw, Trash2 } from 'lucide-react'
import Button from '../components/Button'
import ControlGroup from '../components/ControlGroup'
import Dropzone from '../components/Dropzone'
import ProgressBar from '../components/ProgressBar'
import StatTile from '../components/StatTile'
import ToolHeader from '../components/ToolHeader'
import { useToast } from '../components/Toast'
import WorkspaceLayout from '../components/WorkspaceLayout'
import { getConcurrencyLimit, mapWithConcurrency } from '../utils/concurrency'
import {
    findDuplicates,
    type DuplicateGroup,
    type ImageWithHash,
} from '../utils/duplicateHashing'
import { formatFileSize, getImageInfo } from '../utils/imageProcessing'
import { runImageTask, type WorkerTask } from '../utils/imageWorker'
import { createSampleImage } from '../utils/sampleImage'

interface DuplicateFinderProps {
    onBack: () => void
}

export default function DuplicateFinder({ onBack }: DuplicateFinderProps) {
    const [images, setImages] = useState<ImageWithHash[]>([])
    const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [progress, setProgress] = useState(0)
    const activeTasksRef = useRef<Set<WorkerTask<string>>>(new Set())
    const imagesRef = useRef<ImageWithHash[]>([])
    const { error } = useToast()

    useEffect(() => {
        imagesRef.current = images
    }, [images])

    useEffect(() => () => {
        activeTasksRef.current.forEach((task) => task.cancel())
        imagesRef.current.forEach((img) => URL.revokeObjectURL(img.url))
    }, [])

    const handleFiles = useCallback(
        async (selectedFiles: File[]) => {
            if (selectedFiles.length === 0) return

            setIsProcessing(true)
            setProgress(0)
            activeTasksRef.current = new Set()

            try {
                const results = await mapWithConcurrency(
                    selectedFiles,
                    getConcurrencyLimit(selectedFiles.length),
                    async (file) => {
                        const info = await getImageInfo(file)
                        const task = runImageTask<string>({ kind: 'hash', file })
                        activeTasksRef.current.add(task)
                        try {
                            const hash = await task.promise
                            return { file, url: URL.createObjectURL(file), info, hash }
                        } finally {
                            activeTasksRef.current.delete(task)
                        }
                    },
                    (done, total) => setProgress(Math.round((done / total) * 100))
                )

                setImages((prev) => {
                    const allImages = [...prev, ...results]
                    setDuplicateGroups(findDuplicates(allImages))
                    return allImages
                })
            } catch (err) {
                if (!(err instanceof Error && err.name === 'AbortError')) {
                    error(err instanceof Error ? err.message : 'Error processing some images')
                }
            } finally {
                setIsProcessing(false)
                activeTasksRef.current = new Set()
            }
        },
        [error]
    )

    const cancel = () => {
        activeTasksRef.current.forEach((task) => task.cancel())
        setIsProcessing(false)
    }

    const removeImage = (index: number) => {
        setImages((prev) => {
            const next = [...prev]
            URL.revokeObjectURL(next[index].url)
            next.splice(index, 1)
            setDuplicateGroups(findDuplicates(next))
            return next
        })
    }

    const handleReset = () => {
        cancel()
        images.forEach((img) => URL.revokeObjectURL(img.url))
        setImages([])
        setDuplicateGroups([])
        setProgress(0)
    }

    const duplicateCount = duplicateGroups.reduce((acc, g) => acc + g.images.length - 1, 0)
    const uniqueCount = images.length - duplicateCount

    const leftControls = (
        <>
            <ControlGroup label="Add More Photos">
                <Dropzone
                    onFiles={(files) => void handleFiles(files)}
                    multiple
                    icon="image"
                    title="Add more images"
                    hint="Batch perceptual hash scan"
                    disabled={isProcessing}
                />
            </ControlGroup>

            <ControlGroup label="Scan Summary">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-2)' }}>
                    <div className="stat-tile">
                        <span className="stat-tile-label">Scanned</span>
                        <span className="stat-tile-value">{images.length}</span>
                    </div>
                    <div className="stat-tile">
                        <span className="stat-tile-label">Duplicates</span>
                        <span className="stat-tile-value" style={{ color: duplicateCount > 0 ? 'var(--color-danger)' : undefined }}>
                            {duplicateCount}
                        </span>
                    </div>
                </div>
            </ControlGroup>

            {isProcessing && (
                <ControlGroup label="Hashing Progress">
                    <ProgressBar
                        progress={progress}
                        stageText="Calculating perceptual dHash in web worker…"
                        onCancel={cancel}
                    />
                </ControlGroup>
            )}
        </>
    )

    const centerCanvas = images.length === 0 ? (
        <Dropzone
            onFiles={(files) => void handleFiles(files)}
            multiple
            icon="copy"
            title="Drop multiple images to find duplicates"
            hint="Perceptually compares visual similarity in your browser"
            onTrySample={async () => {
                const s1 = await createSampleImage()
                const s2 = new File([s1], 'sample-copy.png', { type: s1.type })
                void handleFiles([s1, s2])
            }}
        />
    ) : (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            {/* Duplicate Groups Section */}
            {duplicateGroups.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-danger)', margin: 0 }}>
                        ⚠️ Found {duplicateGroups.length} Duplicate Group{duplicateGroups.length > 1 ? 's' : ''}
                    </h3>
                    {duplicateGroups.map((group, groupIdx) => (
                        <div
                            key={groupIdx}
                            style={{
                                padding: 'var(--spacing-3)',
                                backgroundColor: 'var(--color-bg-surface)',
                                border: '1px solid var(--color-border-default)',
                                borderRadius: 'var(--radius-md)',
                            }}
                        >
                            <p style={{ margin: '0 0 var(--spacing-2) 0', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                                Group #{groupIdx + 1} — {group.images.length} visually matching images
                            </p>
                            <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
                                {group.images.map((img, imgIdx) => (
                                    <div
                                        key={imgIdx}
                                        style={{
                                            position: 'relative',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            width: '120px',
                                        }}
                                    >
                                        <img
                                            src={img.url}
                                            alt={img.file.name}
                                            style={{
                                                width: '120px',
                                                height: '100px',
                                                objectFit: 'cover',
                                                borderRadius: 'var(--radius-sm)',
                                                border: imgIdx === 0
                                                    ? '2px solid var(--color-success)'
                                                    : '2px solid var(--color-danger)',
                                            }}
                                        />
                                        <span
                                            style={{
                                                position: 'absolute',
                                                top: 4,
                                                left: 4,
                                                padding: '2px 6px',
                                                borderRadius: 'var(--radius-sm)',
                                                fontSize: '10px',
                                                fontWeight: 600,
                                                backgroundColor: imgIdx === 0 ? 'var(--color-success)' : 'var(--color-danger)',
                                                color: '#ffffff',
                                            }}
                                        >
                                            {imgIdx === 0 ? 'Original' : 'Duplicate'}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: '11px',
                                                color: 'var(--color-text-secondary)',
                                                marginTop: '4px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {img.file.name}
                                        </span>
                                        <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
                                            {formatFileSize(img.file.size)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* All Scanned Images */}
            <div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-2)' }}>
                    All Scanned Images ({images.length})
                </h3>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                        gap: 'var(--spacing-3)',
                    }}
                >
                    {images.map((img, idx) => (
                        <div
                            key={idx}
                            style={{
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                padding: 'var(--spacing-2)',
                                backgroundColor: 'var(--color-bg-surface)',
                                border: '1px solid var(--color-border-default)',
                                borderRadius: 'var(--radius-md)',
                            }}
                        >
                            <img
                                src={img.url}
                                alt={img.file.name}
                                style={{
                                    width: '100%',
                                    height: '90px',
                                    objectFit: 'cover',
                                    borderRadius: 'var(--radius-sm)',
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => removeImage(idx)}
                                style={{
                                    position: 'absolute',
                                    top: 10,
                                    right: 10,
                                    width: 22,
                                    height: 22,
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(0,0,0,0.6)',
                                    color: '#ffffff',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                                aria-label="Remove image"
                            >
                                <Trash2 size={12} />
                            </button>
                            <span
                                style={{
                                    fontSize: '11px',
                                    marginTop: '6px',
                                    fontWeight: 500,
                                    color: 'var(--color-text-primary)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {img.file.name}
                            </span>
                            <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
                                {img.info.width} × {img.info.height} · {formatFileSize(img.file.size)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )

    const bottomBar = (
        <>
            <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                <StatTile label="Total Images" value={images.length} />
                <StatTile label="Unique" value={uniqueCount} />
                <StatTile label="Duplicates" value={duplicateCount} />
            </div>

            <div className="workspace-action-group">
                <Button variant="ghost" onClick={handleReset} icon={<RotateCcw size={15} />}>
                    Clear All
                </Button>
            </div>
        </>
    )

    return (
        <div className="tool-view-wrapper">
            <ToolHeader
                toolName="Duplicate Finder"
                toolIcon={<Copy size={18} />}
                toolId="duplicate-finder"
                onBack={onBack}
                onReset={images.length > 0 ? handleReset : undefined}
            />
            <WorkspaceLayout
                leftControls={leftControls}
                centerCanvas={centerCanvas}
                bottomBar={bottomBar}
                hasFile={images.length > 0}
            />
        </div>
    )
}
