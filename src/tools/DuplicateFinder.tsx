import { useCallback, useEffect, useRef, useState } from 'react'
import Dropzone from '../components/Dropzone'
import { useToast } from '../components/Toast'
import { getConcurrencyLimit, mapWithConcurrency } from '../utils/concurrency'
import {
    findDuplicates,
    type DuplicateGroup,
    type ImageWithHash,
} from '../utils/duplicateHashing'
import { formatFileSize, getImageInfo } from '../utils/imageProcessing'
import { runImageTask, type WorkerTask } from '../utils/imageWorker'

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

    const handleFiles = useCallback(async (selectedFiles: File[]) => {
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

            const allImages = [...images, ...results]
            setImages(allImages)
            setDuplicateGroups(findDuplicates(allImages))
        } catch (err) {
            if (!(err instanceof Error && err.name === 'AbortError')) {
                error(err instanceof Error ? err.message : 'Error processing some images')
            }
        } finally {
            setIsProcessing(false)
            activeTasksRef.current = new Set()
        }
    }, [error, images])

    const cancel = () => {
        activeTasksRef.current.forEach((task) => task.cancel())
        setIsProcessing(false)
    }

    const removeImage = (index: number) => {
        const newImages = [...images]
        URL.revokeObjectURL(newImages[index].url)
        newImages.splice(index, 1)
        setImages(newImages)
        setDuplicateGroups(findDuplicates(newImages))
    }

    const handleReset = () => {
        cancel()
        images.forEach(img => URL.revokeObjectURL(img.url))
        setImages([])
        setDuplicateGroups([])
        setProgress(0)
    }

    const uniqueCount = images.length - duplicateGroups.reduce((acc, g) => acc + g.images.length - 1, 0)
    const duplicateCount = duplicateGroups.reduce((acc, g) => acc + g.images.length - 1, 0)

    return (
        <div className="tool-page">
            <div className="tool-header">
                <button className="back-button" onClick={onBack}>←</button>
                <h1 className="tool-title">Duplicate Image Finder</h1>
            </div>

            <Dropzone
                onFiles={(files) => void handleFiles(files)}
                multiple
                icon="🔍"
                title={images.length > 0 ? 'Add more images or drop them here' : 'Drop multiple images here or click to browse'}
                hint="Uses perceptual hashing to find visually similar images"
                disabled={isProcessing}
            />

            {/* Stats */}
            {images.length > 0 && (
                <div className="image-info" style={{ marginTop: '1.5rem', justifyContent: 'center' }}>
                    <span className="info-badge">
                        <span className="info-badge-label">Total:</span>
                        <span className="info-badge-value">{images.length} images</span>
                    </span>
                    <span className="info-badge">
                        <span className="info-badge-label">Unique:</span>
                        <span className="info-badge-value" style={{ color: '#38ef7d' }}>{uniqueCount}</span>
                    </span>
                    {duplicateCount > 0 && (
                        <span className="info-badge">
                            <span className="info-badge-label">Duplicates:</span>
                            <span className="info-badge-value" style={{ color: '#f5576c' }}>{duplicateCount}</span>
                        </span>
                    )}
                </div>
            )}

            {/* Duplicate Groups */}
            {duplicateGroups.length > 0 && (
                <div className="controls-panel" style={{ marginTop: '1.5rem' }}>
                    <h4 style={{ marginBottom: '1rem', color: '#f5576c' }}>
                        ⚠️ Found {duplicateGroups.length} Duplicate Group{duplicateGroups.length > 1 ? 's' : ''}
                    </h4>

                    {duplicateGroups.map((group, groupIndex) => (
                        <div key={groupIndex} style={{
                            marginBottom: '1rem',
                            padding: '1rem',
                            background: 'rgba(245, 87, 108, 0.1)',
                            borderRadius: '12px',
                            border: '1px solid rgba(245, 87, 108, 0.3)'
                        }}>
                            <div style={{ marginBottom: '0.75rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
                                Group {groupIndex + 1} - {group.images.length} similar images
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                {group.images.map((img, imgIndex) => (
                                    <div key={imgIndex} style={{ position: 'relative' }}>
                                        <img
                                            src={img.url}
                                            alt={img.file.name}
                                            style={{
                                                width: '100px',
                                                height: '100px',
                                                objectFit: 'cover',
                                                borderRadius: '8px',
                                                border: imgIndex === 0 ? '2px solid #38ef7d' : '2px solid #f5576c'
                                            }}
                                        />
                                        {imgIndex === 0 && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '-8px',
                                                right: '-8px',
                                                background: '#38ef7d',
                                                color: '#000',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                fontSize: '0.7rem',
                                                fontWeight: 600
                                            }}>
                                                Keep
                                            </div>
                                        )}
                                        {imgIndex > 0 && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '-8px',
                                                right: '-8px',
                                                background: '#f5576c',
                                                color: '#fff',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                fontSize: '0.7rem',
                                                fontWeight: 600
                                            }}>
                                                Duplicate
                                            </div>
                                        )}
                                        <div style={{
                                            fontSize: '0.7rem',
                                            marginTop: '0.25rem',
                                            color: 'rgba(255,255,255,0.5)',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            width: '100px'
                                        }}>
                                            {formatFileSize(img.info.size)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* All Images Grid */}
            {images.length > 0 && duplicateGroups.length === 0 && !isProcessing && (
                <div style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    background: 'rgba(56, 239, 125, 0.1)',
                    borderRadius: '12px',
                    textAlign: 'center'
                }}>
                    <p style={{ color: '#38ef7d', fontSize: '1rem' }}>
                        ✅ No duplicates found! All {images.length} images are unique.
                    </p>
                </div>
            )}

            {/* All Images Preview */}
            {images.length > 0 && (
                <div className="controls-panel" style={{ marginTop: '1.5rem' }}>
                    <h4 style={{ marginBottom: '1rem' }}>All Uploaded Images ({images.length})</h4>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {images.map((img, index) => (
                            <div key={index} style={{ position: 'relative' }}>
                                <img
                                    src={img.url}
                                    alt={img.file.name}
                                    style={{
                                        width: '60px',
                                        height: '60px',
                                        objectFit: 'cover',
                                        borderRadius: '6px'
                                    }}
                                />
                                <button
                                    onClick={() => removeImage(index)}
                                    style={{
                                        position: 'absolute',
                                        top: '-6px',
                                        right: '-6px',
                                        width: '18px',
                                        height: '18px',
                                        background: 'rgba(0,0,0,0.7)',
                                        border: 'none',
                                        borderRadius: '50%',
                                        color: 'white',
                                        fontSize: '10px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            {images.length > 0 && (
                <div className="actions-bar">
                    <button className="secondary-button" onClick={handleReset}>
                        🔄 Clear All
                    </button>
                </div>
            )}

            {/* Processing Overlay */}
            {isProcessing && (
                <div className="processing-overlay">
                    <div className="processing-content">
                        <div className="processing-spinner" />
                        <div className="processing-text">Analyzing Images...</div>
                        <div style={{
                            marginTop: '1rem',
                            width: '200px',
                            height: '8px',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '4px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${progress}%`,
                                height: '100%',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                borderRadius: '4px',
                                transition: 'width 0.3s ease'
                            }} />
                        </div>
                        <div style={{ marginTop: '0.5rem', color: 'rgba(255,255,255,0.5)' }}>{progress}%</div>
                        <button className="secondary-button" style={{ marginTop: '1rem' }} onClick={cancel}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
