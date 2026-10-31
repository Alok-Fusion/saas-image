import { useCallback, useEffect, useRef, useState } from 'react'
import { Archive, Download, Grid, RotateCcw, Scissors } from 'lucide-react'
import Button from '../components/Button'
import ControlGroup from '../components/ControlGroup'
import Dropzone from '../components/Dropzone'
import FileChip from '../components/FileChip'
import SegmentedControl from '../components/SegmentedControl'
import StatTile from '../components/StatTile'
import ToolHeader from '../components/ToolHeader'
import { useToast } from '../components/Toast'
import WorkspaceLayout from '../components/WorkspaceLayout'
import { useObjectUrl } from '../hooks/useObjectUrl'
import { canvasToBlob, downloadBlob, getImageInfo, loadImage, type ImageInfo } from '../utils/imageProcessing'
import { createSampleImage } from '../utils/sampleImage'

interface InstagramGridSplitterProps {
    onBack: () => void
    initialFile?: File | null
}

type GridType = '3x1' | '3x2' | '3x3'

interface GridTile {
    row: number
    col: number
    blob: Blob
    url: string
}

const GRID_OPTIONS = [
    { value: '3x1', label: '3×1 (Banner)' },
    { value: '3x2', label: '3×2 (6-Grid)' },
    { value: '3x3', label: '3×3 (9-Grid)' },
]

export default function InstagramGridSplitter({ onBack, initialFile }: InstagramGridSplitterProps) {
    const [file, setFile] = useState<File | null>(() => initialFile ?? null)
    const [prevInitialFile, setPrevInitialFile] = useState<File | null>(initialFile ?? null)
    const [originalInfo, setOriginalInfo] = useState<ImageInfo | null>(null)
    const [gridType, setGridType] = useState<GridType>('3x3')
    const [tiles, setTiles] = useState<GridTile[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const preview = useObjectUrl(file)
    const tilesRef = useRef<GridTile[]>([])
    const { error, success } = useToast()

    const clearTiles = useCallback(() => {
        tilesRef.current.forEach((tile) => URL.revokeObjectURL(tile.url))
        tilesRef.current = []
        setTiles([])
    }, [])

    if (initialFile && initialFile !== prevInitialFile) {
        setPrevInitialFile(initialFile)
        setFile(initialFile)
        setTiles([])
    }

    const handleFile = useCallback((selectedFile: File) => {
        setFile(selectedFile)
        clearTiles()
    }, [clearTiles])

    useEffect(() => {
        if (!file) return
        let cancelled = false
        void getImageInfo(file)
            .then((info) => {
                if (cancelled) return
                setOriginalInfo(info)
            })
            .catch(() => {
                if (cancelled) return
                setOriginalInfo(null)
            })
        return () => {
            cancelled = true
        }
    }, [file])

    useEffect(() => () => {
        tilesRef.current.forEach((tile) => URL.revokeObjectURL(tile.url))
    }, [])

    const getGridDimensions = (type: GridType): [number, number] => {
        switch (type) {
            case '3x1': return [3, 1]
            case '3x2': return [3, 2]
            case '3x3': return [3, 3]
            default: return [3, 3]
        }
    }

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

    const handleGenerate = async () => {
        if (!file) return
        setIsProcessing(true)
        try {
            clearTiles()
            const newTiles = await splitImage(file, gridType)
            tilesRef.current = newTiles
            setTiles(newTiles)
            success(`Split image into ${newTiles.length} tiles`)
        } catch (err) {
            error(err instanceof Error ? err.message : 'Could not split the image')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleGridTypeChange = async (type: string) => {
        const gType = type as GridType
        setGridType(gType)
        if (file && tiles.length > 0) {
            setIsProcessing(true)
            try {
                clearTiles()
                const newTiles = await splitImage(file, gType)
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
            success('Downloaded grid archive (.zip)')
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
        setOriginalInfo(null)
    }

    const [cols, rows] = getGridDimensions(gridType)

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
                label="Grid Layout"
                hint="3×3 creates a complete profile takeover (9 square tiles)"
            >
                <SegmentedControl
                    value={gridType}
                    onChange={(val) => void handleGridTypeChange(val)}
                    options={GRID_OPTIONS}
                />
            </ControlGroup>

            <ControlGroup label="Instagram Standard" hint="Each tile is generated at exact 1080×1080 px with no compression artifacts">
                <div className="stat-tile">
                    <span className="stat-tile-label">Tile Resolution</span>
                    <span className="stat-tile-value">1080 × 1080 px</span>
                </div>
            </ControlGroup>
        </>
    )

    const centerCanvas = !file ? (
        <Dropzone
            onFiles={(files) => handleFile(files[0])}
            icon="grid"
            title="Drop image to split for Instagram"
            hint="Create 3x1 banners, 3x2 grids, or 3x3 profile grids"
            onTrySample={async () => {
                const s = await createSampleImage()
                handleFile(s)
            }}
        />
    ) : tiles.length === 0 ? (
        <div style={{ textAlign: 'center', maxWidth: '700px', width: '100%' }}>
            <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
                <img
                    src={preview || undefined}
                    alt="Source preview"
                    style={{
                        maxHeight: '60vh',
                        maxWidth: '100%',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border-subtle)',
                        display: 'block',
                    }}
                />
            </div>
            <p style={{ marginTop: 'var(--spacing-3)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Click "Split Image" to carve this into {cols * rows} Instagram squares.
            </p>
        </div>
    ) : (
        <div style={{ maxWidth: '640px', width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gap: '4px',
                    padding: '4px',
                    backgroundColor: 'var(--color-border-subtle)',
                    borderRadius: 'var(--radius-md)',
                }}
            >
                {tiles.map((tile, idx) => (
                    <div
                        key={idx}
                        style={{
                            position: 'relative',
                            aspectRatio: '1',
                            overflow: 'hidden',
                            borderRadius: '2px',
                        }}
                    >
                        <img
                            src={tile.url}
                            alt={`Tile ${idx + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                        <span
                            style={{
                                position: 'absolute',
                                top: 4,
                                left: 4,
                                backgroundColor: 'rgba(0,0,0,0.65)',
                                color: '#ffffff',
                                fontSize: '10px',
                                fontWeight: 600,
                                padding: '2px 6px',
                                borderRadius: '2px',
                                fontFamily: 'var(--font-mono)',
                            }}
                        >
                            #{idx + 1}
                        </span>
                        <button
                            type="button"
                            onClick={() => handleDownloadTile(tile)}
                            style={{
                                position: 'absolute',
                                bottom: 4,
                                right: 4,
                                backgroundColor: 'rgba(0,0,0,0.65)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                            }}
                            title={`Download tile #${idx + 1}`}
                        >
                            <Download size={12} />
                        </button>
                    </div>
                ))}
            </div>
            <p style={{ margin: 0, textAlign: 'center', fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                💡 Posting tip: On Instagram, post the tiles in reverse order (Tile #{tiles.length} first, then #{tiles.length - 1} ... down to Tile #1 last).
            </p>
        </div>
    )

    const bottomBar = (
        <>
            <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                <StatTile label="Layout" value={`${cols} × ${rows}`} />
                <StatTile label="Total Tiles" value={cols * rows} />
                <StatTile label="Tile Size" value="1080px" />
            </div>

            <div className="workspace-action-group">
                <Button variant="ghost" onClick={handleReset} icon={<RotateCcw size={15} />}>
                    Reset
                </Button>
                {tiles.length === 0 ? (
                    <Button
                        variant="primary"
                        onClick={() => void handleGenerate()}
                        isLoading={isProcessing}
                        icon={<Scissors size={15} />}
                    >
                        Split Image
                    </Button>
                ) : (
                    <Button
                        variant="primary"
                        onClick={() => void handleDownloadAll()}
                        icon={<Archive size={15} />}
                    >
                        Download All Tiles (ZIP)
                    </Button>
                )}
            </div>
        </>
    )

    return (
        <div className="tool-view-wrapper">
            <ToolHeader
                toolName="Instagram Grid Splitter"
                toolIcon={<Grid size={18} />}
                toolId="instagram-grid"
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
