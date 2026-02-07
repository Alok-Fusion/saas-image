import JSZip from 'jszip'
import { useCallback, useRef, useState } from 'react'
import { downloadBlob } from '../utils/imageProcessing'

interface InstagramGridSplitterProps {
    onBack: () => void
}

type GridType = '3x1' | '3x2' | '3x3'

interface GridTile {
    row: number
    col: number
    blob: Blob
    url: string
}

export default function InstagramGridSplitter({ onBack }: InstagramGridSplitterProps) {
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [gridType, setGridType] = useState<GridType>('3x3')
    const [tiles, setTiles] = useState<GridTile[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Get grid dimensions
    const getGridDimensions = (type: GridType): [number, number] => {
        switch (type) {
            case '3x1': return [3, 1]
            case '3x2': return [3, 2]
            case '3x3': return [3, 3]
            default: return [3, 3]
        }
    }

    // Split image into grid
    const splitImage = async (imageFile: File, type: GridType): Promise<GridTile[]> => {
        return new Promise((resolve, reject) => {
            const img = new Image()
            const url = URL.createObjectURL(imageFile)

            img.onload = async () => {
                URL.revokeObjectURL(url)

                const [cols, rows] = getGridDimensions(type)
                const tileSize = 1080 // Instagram square size

                // Calculate crop dimensions for center crop
                const sourceRatio = img.width / img.height
                const targetRatio = cols / rows

                let sourceWidth: number
                let sourceHeight: number
                let sourceX: number
                let sourceY: number

                if (sourceRatio > targetRatio) {
                    sourceHeight = img.height
                    sourceWidth = sourceHeight * targetRatio
                    sourceX = (img.width - sourceWidth) / 2
                    sourceY = 0
                } else {
                    sourceWidth = img.width
                    sourceHeight = sourceWidth / targetRatio
                    sourceX = 0
                    sourceY = (img.height - sourceHeight) / 2
                }

                const tileSourceWidth = sourceWidth / cols
                const tileSourceHeight = sourceHeight / rows

                const newTiles: GridTile[] = []

                for (let row = 0; row < rows; row++) {
                    for (let col = 0; col < cols; col++) {
                        const canvas = document.createElement('canvas')
                        canvas.width = tileSize
                        canvas.height = tileSize

                        const ctx = canvas.getContext('2d')
                        if (!ctx) {
                            reject(new Error('Failed to get canvas context'))
                            return
                        }

                        ctx.drawImage(
                            img,
                            sourceX + col * tileSourceWidth,
                            sourceY + row * tileSourceHeight,
                            tileSourceWidth,
                            tileSourceHeight,
                            0,
                            0,
                            tileSize,
                            tileSize
                        )

                        const blob = await new Promise<Blob>((res, rej) => {
                            canvas.toBlob(
                                (b) => b ? res(b) : rej(new Error('Failed to create tile')),
                                'image/jpeg',
                                0.95
                            )
                        })

                        newTiles.push({
                            row,
                            col,
                            blob,
                            url: URL.createObjectURL(blob)
                        })
                    }
                }

                resolve(newTiles)
            }

            img.onerror = () => {
                URL.revokeObjectURL(url)
                reject(new Error('Failed to load image'))
            }

            img.src = url
        })
    }

    // Handle file selection
    const handleFile = useCallback(async (selectedFile: File) => {
        if (!selectedFile.type.startsWith('image/')) {
            alert('Please select an image file')
            return
        }

        setFile(selectedFile)
        const url = URL.createObjectURL(selectedFile)
        setPreview(url)

        // Clear old tiles
        tiles.forEach(t => URL.revokeObjectURL(t.url))
        setTiles([])
    }, [tiles])

    // Generate grid
    const handleGenerate = async () => {
        if (!file) return

        setIsProcessing(true)
        try {
            tiles.forEach(t => URL.revokeObjectURL(t.url))
            const newTiles = await splitImage(file, gridType)
            setTiles(newTiles)
        } catch (error) {
            console.error('Error splitting image:', error)
            alert('Error processing image')
        } finally {
            setIsProcessing(false)
        }
    }

    // Handle grid type change
    const handleGridTypeChange = async (type: GridType) => {
        setGridType(type)
        if (file && tiles.length > 0) {
            setIsProcessing(true)
            try {
                tiles.forEach(t => URL.revokeObjectURL(t.url))
                const newTiles = await splitImage(file, type)
                setTiles(newTiles)
            } catch (error) {
                console.error('Error splitting image:', error)
            } finally {
                setIsProcessing(false)
            }
        }
    }

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

    // Download all as ZIP
    const handleDownloadAll = async () => {
        if (tiles.length === 0) return

        const zip = new JSZip()
        const baseName = file?.name.replace(/\.[^/.]+$/, '') || 'grid'
        const [cols, rows] = getGridDimensions(gridType)

        // Order tiles from right to left, top to bottom (Instagram carousel order)
        for (let row = 0; row < rows; row++) {
            for (let col = cols - 1; col >= 0; col--) {
                const tile = tiles.find(t => t.row === row && t.col === col)
                if (tile) {
                    const index = row * cols + (cols - 1 - col) + 1
                    zip.file(`${index}_${baseName}.jpg`, tile.blob)
                }
            }
        }

        const content = await zip.generateAsync({ type: 'blob' })
        downloadBlob(content, `${baseName}_instagram_grid.zip`)
    }

    // Download single tile
    const handleDownloadTile = (tile: GridTile) => {
        const baseName = file?.name.replace(/\.[^/.]+$/, '') || 'tile'
        const [cols] = getGridDimensions(gridType)
        const index = tile.row * cols + tile.col + 1
        downloadBlob(tile.blob, `${baseName}_tile_${index}.jpg`)
    }

    // Reset
    const handleReset = () => {
        if (preview) URL.revokeObjectURL(preview)
        tiles.forEach(t => URL.revokeObjectURL(t.url))
        setFile(null)
        setPreview(null)
        setTiles([])
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const [cols, rows] = getGridDimensions(gridType)

    return (
        <div className="tool-page">
            <div className="tool-header">
                <button className="back-button" onClick={onBack}>←</button>
                <h1 className="tool-title">Instagram Grid Splitter</h1>
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
                        <p className="dropzone-hint">Split images into grids for Instagram carousel posts</p>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                        style={{ display: 'none' }}
                    />
                </div>
            ) : tiles.length === 0 ? (
                <>
                    {/* Preview with grid overlay */}
                    <div className="image-preview-container">
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <img src={preview!} alt="Preview" className="image-preview" />
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'grid',
                                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                                gridTemplateRows: `repeat(${rows}, 1fr)`,
                                pointerEvents: 'none'
                            }}>
                                {Array.from({ length: cols * rows }).map((_, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            border: '2px dashed rgba(255,255,255,0.5)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontSize: '1.5rem',
                                            fontWeight: 'bold',
                                            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                                        }}
                                    >
                                        {i + 1}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Grid Type Selection */}
                    <div className="controls-panel" style={{ marginTop: '1.5rem' }}>
                        <div className="control-group">
                            <label className="control-label">
                                <span>Grid Layout</span>
                            </label>
                            <div className="select-buttons">
                                <button
                                    className={`select-button ${gridType === '3x1' ? 'active' : ''}`}
                                    onClick={() => handleGridTypeChange('3x1')}
                                >
                                    3×1 (Panorama)
                                </button>
                                <button
                                    className={`select-button ${gridType === '3x2' ? 'active' : ''}`}
                                    onClick={() => handleGridTypeChange('3x2')}
                                >
                                    3×2 (6 tiles)
                                </button>
                                <button
                                    className={`select-button ${gridType === '3x3' ? 'active' : ''}`}
                                    onClick={() => handleGridTypeChange('3x3')}
                                >
                                    3×3 (9 tiles)
                                </button>
                            </div>
                        </div>

                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(102, 126, 234, 0.1)', borderRadius: '12px' }}>
                            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
                                📌 Tiles are numbered in Instagram posting order. Upload them from #1 to #{cols * rows} for perfect alignment.
                            </p>
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
                            disabled={isProcessing}
                        >
                            {isProcessing ? '⏳ Processing...' : `✂️ Split into ${cols * rows} Tiles`}
                        </button>
                    </div>
                </>
            ) : (
                <>
                    {/* Grid Preview */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${cols}, 1fr)`,
                        gap: '0.5rem',
                        maxWidth: '600px',
                        margin: '0 auto'
                    }}>
                        {tiles.map((tile, index) => (
                            <div
                                key={index}
                                className="result-card"
                                style={{ padding: '0.5rem', cursor: 'pointer' }}
                                onClick={() => handleDownloadTile(tile)}
                            >
                                <img
                                    src={tile.url}
                                    alt={`Tile ${index + 1}`}
                                    style={{ width: '100%', borderRadius: '8px' }}
                                />
                                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                                    #{index + 1}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{
                        marginTop: '1.5rem',
                        textAlign: 'center',
                        padding: '1rem',
                        background: 'rgba(56, 239, 125, 0.1)',
                        borderRadius: '12px'
                    }}>
                        <p style={{ color: '#38ef7d', fontSize: '0.9rem' }}>
                            ✅ Post tiles from #1 to #{tiles.length} on Instagram for perfect grid alignment!
                        </p>
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
                        <div className="processing-text">Splitting Image...</div>
                    </div>
                </div>
            )}
        </div>
    )
}
