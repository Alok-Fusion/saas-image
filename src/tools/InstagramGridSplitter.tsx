import { useCallback, useEffect, useRef, useState } from 'react'
import Dropzone from '../components/Dropzone'
import { useToast } from '../components/Toast'
import { useObjectUrl } from '../hooks/useObjectUrl'
import { canvasToBlob, downloadBlob, loadImage } from '../utils/imageProcessing'

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
    const [gridType, setGridType] = useState<GridType>('3x3')
    const [tiles, setTiles] = useState<GridTile[]>([])
    const [isProcessing, setIsProcessing] = useState(false)

    // Get grid dimensions
    const getGridDimensions = (type: GridType): [number, number] => {
        switch (type) {
            case '3x1': return [3, 1]
            case '3x2': return [3, 2]
            case '3x3': return [3, 3]
            default: return [3, 3]
        }
    }

    const preview = useObjectUrl(file)
    const tilesRef = useRef<GridTile[]>([])
    const { error, success } = useToast()

    const clearTiles = () => {
        tilesRef.current.forEach((tile) => URL.revokeObjectURL(tile.url))
        setTiles([])
    }

    useEffect(() => () => {
        tilesRef.current.forEach((tile) => URL.revokeObjectURL(tile.url))
    }, [])

    const splitImage = async (imageFile: File, type: GridType): Promise<GridTile[]> => {
        const img = await loadImage(imageFile)
        const [cols, rows] = getGridDimensions(type)
        const tileSize = 1080
        const imgWidth = img.naturalWidth || img.width
        const imgHeight = img.naturalHeight || img.height

        const sourceRatio = imgWidth / imgHeight
        const targetRatio = cols / rows

        let sourceWidth: number
        let sourceHeight: number
        let sourceX: number
        let sourceY: number

        if (sourceRatio > targetRatio) {
            sourceHeight = imgHeight
            sourceWidth = sourceHeight * targetRatio
            sourceX = (imgWidth - sourceWidth) / 2
            sourceY = 0
        } else {
            sourceWidth = imgWidth
            sourceHeight = sourceWidth / targetRatio
            sourceX = 0
            sourceY = (imgHeight - sourceHeight) / 2
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
                if (!ctx) throw new Error('Canvas is not available')

                ctx.imageSmoothingEnabled = true
                ctx.imageSmoothingQuality = 'high'
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

                const blob = await canvasToBlob(canvas, 'image/jpeg', 0.95)
                newTiles.push({ row, col, blob, url: URL.createObjectURL(blob) })
            }
        }

        return newTiles
    }

    const tileFileName = (tile: GridTile): string => {
        const baseName = file?.name.replace(/\.[^/.]+$/, '') || 'grid'
        const [cols] = getGridDimensions(gridType)
        return `${baseName}-tile-${tile.row * cols + tile.col + 1}.jpg`
    }

    const handleFile = useCallback((selectedFile: File) => {
        setFile(selectedFile)
        clearTiles()
    }, [])

    const handleGenerate = async () => {
        if (!file) return
        setIsProcessing(true)
        try {
            clearTiles()
            const newTiles = await splitImage(file, gridType)
            tilesRef.current = newTiles
            setTiles(newTiles)
        } catch (err) {
            error(err instanceof Error ? err.message : 'Could not split the image')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleGridTypeChange = async (type: GridType) => {
        setGridType(type)
        if (file && tiles.length > 0) {
            setIsProcessing(true)
            try {
                clearTiles()
                const newTiles = await splitImage(file, type)
                tilesRef.current = newTiles
                setTiles(newTiles)
            } catch (err) {
                error(err instanceof Error ? err.message : 'Could not split the image')
            } finally {
                setIsProcessing(false)
            }
        }
    }

    const handleDownloadAll = async () => {
        if (tiles.length === 0) return
        try {
            const { default: JSZip } = await import('jszip')
            const zip = new JSZip()
            const baseName = file?.name.replace(/\.[^/.]+$/, '') || 'grid'
            for (const tile of tiles) {
                zip.file(tileFileName(tile), tile.blob)
            }
            const content = await zip.generateAsync({ type: 'blob' })
            downloadBlob(content, `${baseName}-instagram-grid.zip`)
            success('Downloaded grid ZIP')
        } catch (err) {
            error(err instanceof Error ? err.message : 'Could not build the ZIP')
        }
    }

    const handleDownloadTile = (tile: GridTile) => {
        downloadBlob(tile.blob, tileFileName(tile))
    }

    const handleReset = () => {
        clearTiles()
        setFile(null)
    }

    const [cols, rows] = getGridDimensions(gridType)

    return (
        <div className="tool-page">
            <div className="tool-header">
                <button className="back-button" onClick={onBack}>←</button>
                <h1 className="tool-title">Instagram Grid Splitter</h1>
            </div>

            {!file ? (
                <Dropzone
                    onFiles={(files) => handleFile(files[0])}
                    icon="📱"
                    title="Drop your image here or click to browse"
                    hint="Split images into grids for Instagram carousel posts"
                />
            ) : tiles.length === 0 ? (
                <>
                    {/* Preview with grid overlay */}
                    <div className="image-preview-container">
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            {preview && <img src={preview} alt="Preview" className="image-preview" />}
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
