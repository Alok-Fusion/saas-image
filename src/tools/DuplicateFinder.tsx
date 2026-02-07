import { useCallback, useRef, useState } from 'react'
import { formatFileSize, getImageInfo, type ImageInfo } from '../utils/imageProcessing'

interface DuplicateFinderProps {
    onBack: () => void
}

interface ImageWithHash {
    file: File
    url: string
    info: ImageInfo
    hash: string
}

interface DuplicateGroup {
    hash: string
    images: ImageWithHash[]
}

export default function DuplicateFinder({ onBack }: DuplicateFinderProps) {
    const [images, setImages] = useState<ImageWithHash[]>([])
    const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [progress, setProgress] = useState(0)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Generate perceptual hash for an image
    const generateImageHash = async (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image()
            const url = URL.createObjectURL(file)

            img.onload = () => {
                URL.revokeObjectURL(url)

                // Create small canvas for hash generation (8x8)
                const canvas = document.createElement('canvas')
                const size = 8
                canvas.width = size
                canvas.height = size

                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'))
                    return
                }

                // Draw image to small size
                ctx.drawImage(img, 0, 0, size, size)
                const imageData = ctx.getImageData(0, 0, size, size)
                const pixels = imageData.data

                // Calculate average brightness
                let total = 0
                const grayscale: number[] = []

                for (let i = 0; i < pixels.length; i += 4) {
                    const gray = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114
                    grayscale.push(gray)
                    total += gray
                }

                const average = total / grayscale.length

                // Generate hash based on whether each pixel is above/below average
                let hash = ''
                for (const gray of grayscale) {
                    hash += gray >= average ? '1' : '0'
                }

                resolve(hash)
            }

            img.onerror = () => {
                URL.revokeObjectURL(url)
                reject(new Error('Failed to load image'))
            }

            img.src = url
        })
    }

    // Calculate similarity between two hashes (Hamming distance)
    const calculateSimilarity = (hash1: string, hash2: string): number => {
        let differences = 0
        for (let i = 0; i < hash1.length; i++) {
            if (hash1[i] !== hash2[i]) differences++
        }
        return ((hash1.length - differences) / hash1.length) * 100
    }

    // Find duplicates in the image list
    const findDuplicates = (imageList: ImageWithHash[]): DuplicateGroup[] => {
        const groups: DuplicateGroup[] = []
        const processed = new Set<number>()

        for (let i = 0; i < imageList.length; i++) {
            if (processed.has(i)) continue

            const group: ImageWithHash[] = [imageList[i]]
            processed.add(i)

            for (let j = i + 1; j < imageList.length; j++) {
                if (processed.has(j)) continue

                const similarity = calculateSimilarity(imageList[i].hash, imageList[j].hash)

                // Consider images as duplicates if similarity >= 90%
                if (similarity >= 90) {
                    group.push(imageList[j])
                    processed.add(j)
                }
            }

            // Only add to groups if there are duplicates
            if (group.length > 1) {
                groups.push({ hash: imageList[i].hash, images: group })
            }
        }

        return groups
    }

    // Handle file selection
    const handleFiles = useCallback(async (selectedFiles: FileList) => {
        const imageFiles = Array.from(selectedFiles).filter(f => f.type.startsWith('image/'))

        if (imageFiles.length === 0) {
            alert('Please select image files')
            return
        }

        setIsProcessing(true)
        setProgress(0)

        const newImages: ImageWithHash[] = []

        try {
            for (let i = 0; i < imageFiles.length; i++) {
                const file = imageFiles[i]
                const url = URL.createObjectURL(file)
                const info = await getImageInfo(file)
                const hash = await generateImageHash(file)

                newImages.push({ file, url, info, hash })
                setProgress(Math.round(((i + 1) / imageFiles.length) * 100))
            }

            const allImages = [...images, ...newImages]
            setImages(allImages)

            // Find duplicates
            const groups = findDuplicates(allImages)
            setDuplicateGroups(groups)
        } catch (error) {
            console.error('Error processing images:', error)
            alert('Error processing some images')
        } finally {
            setIsProcessing(false)
        }
    }, [images])

    // Handle drag and drop
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files)
        }
    }, [handleFiles])

    // Remove image
    const removeImage = (index: number) => {
        const newImages = [...images]
        URL.revokeObjectURL(newImages[index].url)
        newImages.splice(index, 1)
        setImages(newImages)
        setDuplicateGroups(findDuplicates(newImages))
    }

    // Reset
    const handleReset = () => {
        images.forEach(img => URL.revokeObjectURL(img.url))
        setImages([])
        setDuplicateGroups([])
        setProgress(0)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const uniqueCount = images.length - duplicateGroups.reduce((acc, g) => acc + g.images.length - 1, 0)
    const duplicateCount = duplicateGroups.reduce((acc, g) => acc + g.images.length - 1, 0)

    return (
        <div className="tool-page">
            <div className="tool-header">
                <button className="back-button" onClick={onBack}>←</button>
                <h1 className="tool-title">Duplicate Image Finder</h1>
            </div>

            {/* Upload Area */}
            <div
                className={`dropzone ${isDragging ? 'dragging' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="dropzone-content">
                    <div className="dropzone-icon">🔍</div>
                    <p className="dropzone-text">Drop multiple images here or click to browse</p>
                    <p className="dropzone-hint">Uses perceptual hashing to find visually similar images</p>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => e.target.files && handleFiles(e.target.files)}
                    style={{ display: 'none' }}
                />
            </div>

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
                    <button
                        className="download-button"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        ➕ Add More Images
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
                    </div>
                </div>
            )}
        </div>
    )
}
