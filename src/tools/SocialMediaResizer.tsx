import JSZip from 'jszip'
import { useCallback, useRef, useState } from 'react'
import { downloadBlob, formatFileSize, getImageInfo, resizeImage, type ImageInfo } from '../utils/imageProcessing'
import { getPopularPresets, platforms } from '../utils/socialPresets'

interface SocialMediaResizerProps {
    onBack: () => void
}

interface SelectedPreset {
    platform: string
    preset: string
    width: number
    height: number
    icon: string
}

interface ResizedImage {
    preset: SelectedPreset
    blob: Blob
    url: string
}

export default function SocialMediaResizer({ onBack }: SocialMediaResizerProps) {
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [originalInfo, setOriginalInfo] = useState<ImageInfo | null>(null)
    const [selectedPresets, setSelectedPresets] = useState<SelectedPreset[]>([])
    const [resizedImages, setResizedImages] = useState<ResizedImage[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [activeTab, setActiveTab] = useState<'popular' | 'all'>('popular')
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Handle file selection
    const handleFile = useCallback(async (selectedFile: File) => {
        if (!selectedFile.type.startsWith('image/')) {
            alert('Please select an image file')
            return
        }

        setFile(selectedFile)
        const url = URL.createObjectURL(selectedFile)
        setPreview(url)

        try {
            const info = await getImageInfo(selectedFile)
            setOriginalInfo(info)
        } catch (error) {
            console.error('Error getting image info:', error)
        }

        setResizedImages([])
    }, [])

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
        const droppedFile = e.dataTransfer.files[0]
        if (droppedFile) handleFile(droppedFile)
    }, [handleFile])

    // Toggle preset selection
    const togglePreset = (preset: SelectedPreset) => {
        const key = `${preset.platform}-${preset.preset}`
        const exists = selectedPresets.find(p => `${p.platform}-${p.preset}` === key)

        if (exists) {
            setSelectedPresets(selectedPresets.filter(p => `${p.platform}-${p.preset}` !== key))
        } else {
            setSelectedPresets([...selectedPresets, preset])
        }
    }

    // Check if preset is selected
    const isPresetSelected = (platform: string, preset: string) => {
        return selectedPresets.some(p => p.platform === platform && p.preset === preset)
    }

    // Process all selected presets
    const handleGenerate = async () => {
        if (!file || selectedPresets.length === 0) return

        setIsProcessing(true)
        const results: ResizedImage[] = []

        try {
            for (const preset of selectedPresets) {
                const blob = await resizeImage(file, preset.width, preset.height, 'cover')
                results.push({
                    preset,
                    blob,
                    url: URL.createObjectURL(blob)
                })
            }
            setResizedImages(results)
        } catch (error) {
            console.error('Error resizing images:', error)
            alert('Error processing images')
        } finally {
            setIsProcessing(false)
        }
    }

    // Download single image
    const handleDownloadSingle = (image: ResizedImage) => {
        const baseName = file?.name.replace(/\.[^/.]+$/, '') || 'image'
        const filename = `${baseName}_${image.preset.platform}_${image.preset.preset.replace(/\s+/g, '_')}.jpg`
        downloadBlob(image.blob, filename)
    }

    // Download all as ZIP
    const handleDownloadAll = async () => {
        if (resizedImages.length === 0) return

        const zip = new JSZip()
        const baseName = file?.name.replace(/\.[^/.]+$/, '') || 'image'

        for (const image of resizedImages) {
            const filename = `${image.preset.platform}_${image.preset.preset.replace(/\s+/g, '_')}.jpg`
            zip.file(filename, image.blob)
        }

        const content = await zip.generateAsync({ type: 'blob' })
        downloadBlob(content, `${baseName}_social_media_images.zip`)
    }

    // Reset
    const handleReset = () => {
        if (preview) URL.revokeObjectURL(preview)
        resizedImages.forEach(img => URL.revokeObjectURL(img.url))

        setFile(null)
        setPreview(null)
        setOriginalInfo(null)
        setSelectedPresets([])
        setResizedImages([])
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const popularPresets = getPopularPresets()

    return (
        <div className="tool-page">
            <div className="tool-header">
                <button className="back-button" onClick={onBack}>←</button>
                <h1 className="tool-title">Social Media Resizer</h1>
            </div>

            {!file ? (
                <div
                    className={`dropzone ${isDragging ? 'dragging' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div className="dropzone-content">
                        <div className="dropzone-icon">📱</div>
                        <p className="dropzone-text">Drop your image here or click to browse</p>
                        <p className="dropzone-hint">Resize for Instagram, YouTube, LinkedIn, Twitter & more</p>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                        style={{ display: 'none' }}
                    />
                </div>
            ) : resizedImages.length === 0 ? (
                <>
                    {/* Image Preview */}
                    <div className="image-preview-container">
                        <img src={preview!} alt="Preview" className="image-preview" />
                        <div className="image-info">
                            <span className="info-badge">
                                <span className="info-badge-label">Size:</span>
                                <span className="info-badge-value">{originalInfo ? formatFileSize(originalInfo.size) : '-'}</span>
                            </span>
                            <span className="info-badge">
                                <span className="info-badge-label">Dimensions:</span>
                                <span className="info-badge-value">{originalInfo ? `${originalInfo.width}×${originalInfo.height}` : '-'}</span>
                            </span>
                        </div>
                    </div>

                    {/* Preset Selection */}
                    <div className="controls-panel" style={{ marginTop: '1.5rem' }}>
                        <div className="control-group">
                            <div className="control-label">
                                <span>Select Sizes ({selectedPresets.length} selected)</span>
                                <div className="select-buttons">
                                    <button
                                        className={`select-button ${activeTab === 'popular' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('popular')}
                                    >
                                        Popular
                                    </button>
                                    <button
                                        className={`select-button ${activeTab === 'all' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('all')}
                                    >
                                        All Platforms
                                    </button>
                                </div>
                            </div>

                            {activeTab === 'popular' ? (
                                <div className="platforms-grid" style={{ marginTop: '1rem' }}>
                                    {popularPresets.map((item) => (
                                        <div
                                            key={`${item.platform}-${item.preset}`}
                                            className={`platform-card ${isPresetSelected(item.platform, item.preset) ? 'selected' : ''}`}
                                            onClick={() => togglePreset(item)}
                                        >
                                            <div className="platform-icon">{item.icon}</div>
                                            <div className="platform-name">{item.platform}</div>
                                            <div className="platform-size">{item.preset}</div>
                                            <div className="platform-size">{item.width}×{item.height}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ marginTop: '1rem' }}>
                                    {platforms.map((platform) => (
                                        <div key={platform.name} style={{ marginBottom: '1.5rem' }}>
                                            <h4 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span>{platform.icon}</span>
                                                <span>{platform.name}</span>
                                            </h4>
                                            <div className="select-buttons">
                                                {platform.presets.map((preset) => (
                                                    <button
                                                        key={preset.name}
                                                        className={`select-button ${isPresetSelected(platform.name, preset.name) ? 'active' : ''}`}
                                                        onClick={() => togglePreset({
                                                            platform: platform.name,
                                                            preset: preset.name,
                                                            width: preset.width,
                                                            height: preset.height,
                                                            icon: platform.icon
                                                        })}
                                                        title={`${preset.width}×${preset.height} - ${preset.description}`}
                                                    >
                                                        {preset.name} ({preset.width}×{preset.height})
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="actions-bar">
                        <button className="secondary-button" onClick={handleReset}>
                            🔄 Upload New Image
                        </button>
                        <button
                            className="download-button"
                            onClick={handleGenerate}
                            disabled={selectedPresets.length === 0 || isProcessing}
                        >
                            {isProcessing ? '⏳ Processing...' : `✨ Generate ${selectedPresets.length} Image${selectedPresets.length !== 1 ? 's' : ''}`}
                        </button>
                    </div>
                </>
            ) : (
                <>
                    {/* Results */}
                    <div className="results-grid">
                        {resizedImages.map((image, index) => (
                            <div key={index} className="result-card">
                                <img src={image.url} alt={image.preset.preset} className="result-image" />
                                <div className="result-title">
                                    {image.preset.icon} {image.preset.platform}
                                </div>
                                <div className="result-dimensions">
                                    {image.preset.preset} • {image.preset.width}×{image.preset.height}
                                </div>
                                <button
                                    className="secondary-button"
                                    onClick={() => handleDownloadSingle(image)}
                                    style={{ marginTop: '0.75rem', width: '100%', justifyContent: 'center' }}
                                >
                                    ⬇️ Download
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="actions-bar">
                        <button className="secondary-button" onClick={handleReset}>
                            🔄 Start Over
                        </button>
                        <button className="download-button" onClick={handleDownloadAll}>
                            📦 Download All as ZIP
                        </button>
                    </div>
                </>
            )}

            {/* Processing Overlay */}
            {isProcessing && (
                <div className="processing-overlay">
                    <div className="processing-content">
                        <div className="processing-spinner" />
                        <div className="processing-text">Generating Images...</div>
                        <div className="processing-hint">This may take a moment</div>
                    </div>
                </div>
            )}
        </div>
    )
}
