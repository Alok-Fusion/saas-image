import {
    Columns2,
    CopyCheck,
    Crop,
    Eraser,
    Eye,
    FileText,
    Grid3X3,
    ImageDown,
    Layers,
    Maximize2,
    Minimize2,
    Palette,
    RotateCw,
    ScanText,
    Search,
    ShieldCheck,
    Smartphone,
    Sparkles,
    Star,
    Terminal,
    Type,
    Video,
    Wand2,
} from 'lucide-react'
import { lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react'
import CommandPalette from './components/CommandPalette'
import ErrorBoundary from './components/ErrorBoundary'
import FileActionChooser from './components/FileActionChooser'
import ThemeToggle from './components/ThemeToggle'
import { useFavorites } from './hooks/useFavorites'
import { useRecentlyUsed } from './hooks/useRecentlyUsed'
import ToolSuggestionsBar from './ToolSuggestionsBar'

type Tool =
    | 'home'
    | 'compressor'
    | 'resizer'
    | 'background-remover'
    | 'exif-cleaner'
    | 'color-palette'
    | 'instagram-grid'
    | 'favicon'
    | 'ocr'
    | 'device-mockup'
    | 'color-blindness'
    | 'ascii-art'
    | 'image-comparison'
    | 'duplicate-finder'
    | 'image-to-pdf'
    | 'pdf-to-image'
    | 'cropper'
    | 'rotator'
    | 'watermark'
    | 'watermark-remover'
    | 'thumbnail'

const TOOL_LOADERS = {
    'ascii-art': () => import('./tools/AsciiArtGenerator'),
    'background-remover': () => import('./tools/BackgroundRemover'),
    'color-blindness': () => import('./tools/ColorBlindnessSimulator'),
    'color-palette': () => import('./tools/ColorPaletteExtractor'),
    'device-mockup': () => import('./tools/DeviceMockupGenerator'),
    'duplicate-finder': () => import('./tools/DuplicateFinder'),
    'exif-cleaner': () => import('./tools/ExifCleaner'),
    'favicon': () => import('./tools/FaviconGenerator'),
    'image-comparison': () => import('./tools/ImageComparisonSlider'),
    'compressor': () => import('./tools/ImageCompressor'),
    'cropper': () => import('./tools/ImageCropper'),
    'rotator': () => import('./tools/ImageRotator'),
    'image-to-pdf': () => import('./tools/ImageToPdf'),
    'instagram-grid': () => import('./tools/InstagramGridSplitter'),
    'ocr': () => import('./tools/OcrExtractor'),
    'pdf-to-image': () => import('./tools/PdfToImage'),
    'resizer': () => import('./tools/SocialMediaResizer'),
    'thumbnail': () => import('./tools/ThumbnailMaker'),
    'watermark': () => import('./tools/WatermarkAdder'),
    'watermark-remover': () => import('./tools/WatermarkRemover'),
}

const AsciiArtGenerator = lazy(TOOL_LOADERS['ascii-art'])
const BackgroundRemover = lazy(TOOL_LOADERS['background-remover'])
const ColorBlindnessSimulator = lazy(TOOL_LOADERS['color-blindness'])
const ColorPaletteExtractor = lazy(TOOL_LOADERS['color-palette'])
const DeviceMockupGenerator = lazy(TOOL_LOADERS['device-mockup'])
const DuplicateFinder = lazy(TOOL_LOADERS['duplicate-finder'])
const ExifCleaner = lazy(TOOL_LOADERS['exif-cleaner'])
const FaviconGenerator = lazy(TOOL_LOADERS['favicon'])
const ImageComparisonSlider = lazy(TOOL_LOADERS['image-comparison'])
const ImageCompressor = lazy(TOOL_LOADERS['compressor'])
const ImageCropper = lazy(TOOL_LOADERS['cropper'])
const ImageRotator = lazy(TOOL_LOADERS['rotator'])
const ImageToPdf = lazy(TOOL_LOADERS['image-to-pdf'])
const InstagramGridSplitter = lazy(TOOL_LOADERS['instagram-grid'])
const OcrExtractor = lazy(TOOL_LOADERS['ocr'])
const PdfToImage = lazy(TOOL_LOADERS['pdf-to-image'])
const SocialMediaResizer = lazy(TOOL_LOADERS['resizer'])
const ThumbnailMaker = lazy(TOOL_LOADERS['thumbnail'])
const WatermarkAdder = lazy(TOOL_LOADERS['watermark'])
const WatermarkRemover = lazy(TOOL_LOADERS['watermark-remover'])

function prefetchTool(tool: Tool): void {
    if (tool !== 'home') void TOOL_LOADERS[tool]()
}

const TOOL_PATHS: Record<Tool, string> = {
    home: '/',
    compressor: '/compress-image',
    resizer: '/resize-image',
    'background-remover': '/remove-background',
    'exif-cleaner': '/remove-exif',
    'color-palette': '/color-palette',
    'instagram-grid': '/instagram-grid',
    favicon: '/favicon-generator',
    ocr: '/image-to-text',
    'device-mockup': '/device-mockup',
    'color-blindness': '/color-blindness',
    'ascii-art': '/ascii-art',
    'image-comparison': '/image-comparison',
    'duplicate-finder': '/duplicate-finder',
    'image-to-pdf': '/image-to-pdf',
    'pdf-to-image': '/pdf-to-image',
    cropper: '/crop-image',
    rotator: '/rotate-image',
    watermark: '/watermark',
    'watermark-remover': '/remove-watermark',
    thumbnail: '/thumbnail-maker',
}

const PATH_TO_TOOL = new Map<string, Tool>(
    (Object.entries(TOOL_PATHS) as [Tool, string][]).map(([tool, path]) => [path, tool])
)

const TOOL_SEO: Record<string, { title: string; desc: string }> = {
    home: { title: 'ImageKit Pro — Fast, Private In-Browser Image Tools', desc: '20 client-side image tools. Zero server uploads, absolute privacy.' },
    compressor: { title: 'Image Compressor — ImageKit Pro', desc: 'Compress images while maintaining quality. JPEG, PNG, WebP supported.' },
    resizer: { title: 'Social Media Resizer — ImageKit Pro', desc: 'Resize images for Instagram, YouTube, LinkedIn & more.' },
    'background-remover': { title: 'Background Remover — ImageKit Pro', desc: 'AI-powered background removal running in your browser.' },
    'exif-cleaner': { title: 'EXIF Privacy Cleaner — ImageKit Pro', desc: 'Remove GPS, camera info & metadata from your images.' },
    'color-palette': { title: 'Color Palette Extractor — ImageKit Pro', desc: 'Extract colors with HEX, RGB & CSS gradients.' },
    'instagram-grid': { title: 'Instagram Grid Splitter — ImageKit Pro', desc: 'Split images into 3×3, 3×2, 3×1 grids for carousel.' },
    favicon: { title: 'Favicon Generator — ImageKit Pro', desc: 'Generate all favicon sizes + manifest.json + HTML snippet.' },
    ocr: { title: 'OCR Text Extractor — ImageKit Pro', desc: 'Extract text from images in 12 languages.' },
    'device-mockup': { title: 'Device Mockup Generator — ImageKit Pro', desc: 'iPhone, MacBook, iPad device frame mockups.' },
    'color-blindness': { title: 'Color Blindness Simulator — ImageKit Pro', desc: 'See how designs appear to color blind users.' },
    'ascii-art': { title: 'ASCII Art Generator — ImageKit Pro', desc: 'Convert images to ASCII text art.' },
    'image-comparison': { title: 'Image Comparison Slider — ImageKit Pro', desc: 'Side-by-side image comparison with slider.' },
    'duplicate-finder': { title: 'Duplicate Image Finder — ImageKit Pro', desc: 'Find similar images using perceptual hashing.' },
    'image-to-pdf': { title: 'Image to PDF — ImageKit Pro', desc: 'Convert multiple images into a single PDF.' },
    'pdf-to-image': { title: 'PDF to Image — ImageKit Pro', desc: 'Convert PDF pages to PNG images.' },
    cropper: { title: 'Image Cropper — ImageKit Pro', desc: 'Crop images with preset aspect ratios.' },
    rotator: { title: 'Image Rotator — ImageKit Pro', desc: 'Rotate 90°/180° and flip images.' },
    watermark: { title: 'Watermark Adder — ImageKit Pro', desc: 'Add text watermarks with custom position & style.' },
    'watermark-remover': { title: 'Watermark Remover — ImageKit Pro', desc: 'Remove watermarks using inpaint, blur, or pixelate.' },
    thumbnail: { title: 'Thumbnail Maker — ImageKit Pro', desc: 'Create thumbnails with images, text & emojis.' },
}

interface ToolDefinition {
    id: Tool
    icon: ReactNode
    title: string
    description: string
    isNew?: boolean
    category: 'core' | 'edit' | 'pdf' | 'privacy' | 'design' | 'social' | 'accessibility'
}

const ALL_TOOLS: ToolDefinition[] = [
    { id: 'compressor', icon: <Minimize2 size={18} />, title: 'Image Compressor', description: 'Reduce file size while maintaining visual quality.', category: 'core' },
    { id: 'resizer', icon: <Maximize2 size={18} />, title: 'Social Media Resizer', description: 'Resize for Instagram, YouTube, LinkedIn & more.', category: 'core' },
    { id: 'background-remover', icon: <Eraser size={18} />, title: 'Background Remover', description: 'AI-powered background removal.', category: 'core' },
    { id: 'cropper', icon: <Crop size={18} />, title: 'Image Cropper', description: 'Crop with preset aspect ratios (1:1, 16:9, 4:3).', isNew: true, category: 'edit' },
    { id: 'rotator', icon: <RotateCw size={18} />, title: 'Image Rotator', description: 'Rotate 90°/180° and flip horizontal/vertical.', isNew: true, category: 'edit' },
    { id: 'watermark', icon: <Type size={18} />, title: 'Watermark Adder', description: 'Add text watermarks with custom position & style.', isNew: true, category: 'edit' },
    { id: 'watermark-remover', icon: <Wand2 size={18} />, title: 'Watermark Remover', description: 'Remove watermarks using inpaint, blur, or pixelate.', isNew: true, category: 'edit' },
    { id: 'image-to-pdf', icon: <FileText size={18} />, title: 'Image to PDF', description: 'Convert multiple images into a single PDF.', isNew: true, category: 'pdf' },
    { id: 'pdf-to-image', icon: <ImageDown size={18} />, title: 'PDF to Image', description: 'Convert PDF pages to PNG images.', isNew: true, category: 'pdf' },
    { id: 'exif-cleaner', icon: <ShieldCheck size={18} />, title: 'EXIF Privacy Cleaner', description: 'Remove GPS, camera info & metadata.', isNew: true, category: 'privacy' },
    { id: 'duplicate-finder', icon: <CopyCheck size={18} />, title: 'Duplicate Finder', description: 'Find similar images using perceptual hashing.', isNew: true, category: 'privacy' },
    { id: 'ocr', icon: <ScanText size={18} />, title: 'OCR Text Extractor', description: 'Extract text from images in 12 languages.', isNew: true, category: 'privacy' },
    { id: 'color-palette', icon: <Palette size={18} />, title: 'Color Palette Extractor', description: 'Extract colors with HEX/RGB & CSS gradients.', isNew: true, category: 'design' },
    { id: 'device-mockup', icon: <Smartphone size={18} />, title: 'Device Mockup Generator', description: 'iPhone, MacBook, iPad device frames.', isNew: true, category: 'design' },
    { id: 'ascii-art', icon: <Terminal size={18} />, title: 'ASCII Art Generator', description: 'Convert images to ASCII text art.', isNew: true, category: 'design' },
    { id: 'thumbnail', icon: <Video size={18} />, title: 'Thumbnail Maker', description: 'Create thumbnails with images, text & emojis.', isNew: true, category: 'design' },
    { id: 'instagram-grid', icon: <Grid3X3 size={18} />, title: 'Instagram Grid Splitter', description: 'Split into 3×3/3×2/3×1 grids for carousel.', isNew: true, category: 'social' },
    { id: 'favicon', icon: <Layers size={18} />, title: 'Favicon Generator', description: 'All sizes + manifest.json + HTML snippet.', isNew: true, category: 'social' },
    { id: 'color-blindness', icon: <Eye size={18} />, title: 'Color Blindness Simulator', description: 'See how designs appear to color blind users.', isNew: true, category: 'accessibility' },
    { id: 'image-comparison', icon: <Columns2 size={18} />, title: 'Image Comparison Slider', description: 'Before/after comparison with slider.', isNew: true, category: 'accessibility' },
]

interface ToolCardProps {
    icon: ReactNode
    title: string
    description: string
    isNew?: boolean
    onClick: () => void
    onPrefetch?: () => void
    isFavorite?: boolean
    onToggleFavorite?: (e: React.MouseEvent) => void
}

function ToolCard({
    icon,
    title,
    description,
    isNew,
    onClick,
    onPrefetch,
    isFavorite,
    onToggleFavorite,
}: ToolCardProps) {
    return (
        <div
            className="tool-card"
            role="button"
            tabIndex={0}
            onClick={onClick}
            onMouseEnter={onPrefetch}
            onFocus={onPrefetch}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onClick()
                }
            }}
        >
            <div className="tool-card-top">
                <div className="tool-card-icon-box">{icon}</div>
                <div className="tool-card-actions">
                    {isNew && <span className="new-badge">NEW</span>}
                    {onToggleFavorite && (
                        <button
                            type="button"
                            className={`fav-star-btn ${isFavorite ? 'is-favorite' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation()
                                onToggleFavorite(e)
                            }}
                            aria-label={isFavorite ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
                            aria-pressed={isFavorite}
                        >
                            <Star size={15} fill={isFavorite ? 'currentColor' : 'none'} />
                        </button>
                    )}
                </div>
            </div>
            <h3 className="tool-card-title">{title}</h3>
            <p className="tool-card-desc">{description}</p>
        </div>
    )
}

function Header({
    onLogoClick,
    onOpenSearch,
}: {
    onLogoClick: () => void
    onOpenSearch: () => void
}) {
    return (
        <header className="app-header">
            <div className="header-inner">
                <button type="button" className="brand-logo" onClick={onLogoClick} aria-label="ImageKit Pro Home">
                    <span className="brand-mark">
                        <Sparkles size={16} />
                    </span>
                    <span className="brand-name">ImageKit Pro</span>
                    <span className="brand-badge">PRO</span>
                </button>

                <button
                    type="button"
                    className="header-search-btn"
                    onClick={onOpenSearch}
                    aria-label="Search tools"
                >
                    <Search size={15} />
                    <span>Search tools…</span>
                    <span className="header-search-hint">Ctrl K</span>
                </button>

                <div className="header-actions">
                    <div className="privacy-pill">
                        <span className="privacy-dot" />
                        <span>100% In-Browser</span>
                    </div>
                    <ThemeToggle />
                </div>
            </div>
        </header>
    )
}

interface HomePageProps {
    onSelectTool: (tool: Tool) => void
    onOpenSearch: () => void
    favorites: string[]
    recentTools: string[]
    isFavorite: (tool: string) => boolean
    toggleFavorite: (tool: string) => void
    onDropFile: (file: File) => void
}

function HomePage({
    onSelectTool,
    onOpenSearch,
    favorites,
    recentTools,
    isFavorite,
    toggleFavorite,
    onDropFile,
}: HomePageProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [isDraggingOver, setIsDraggingOver] = useState(false)

    const categories = [
        { key: 'all', label: 'All Tools' },
        { key: 'core', label: 'Core Essentials' },
        { key: 'edit', label: 'Edit & Transform' },
        { key: 'pdf', label: 'PDF Utilities' },
        { key: 'privacy', label: 'Privacy & Security' },
        { key: 'design', label: 'Design & Creative' },
        { key: 'social', label: 'Social Media' },
        { key: 'accessibility', label: 'Accessibility' },
    ]

    const favTools = ALL_TOOLS.filter((t) => favorites.includes(t.id))
    const recentToolCards = recentTools
        .map((id) => ALL_TOOLS.find((t) => t.id === id))
        .filter((t): t is ToolDefinition => !!t)

    const filteredTools =
        selectedCategory === 'all'
            ? ALL_TOOLS
            : ALL_TOOLS.filter((t) => t.category === selectedCategory)

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDraggingOver(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDraggingOver(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDraggingOver(false)
        const dropped = e.dataTransfer.files[0]
        if (dropped) onDropFile(dropped)
    }

    return (
        <div className="home-container">
            {/* Hero */}
            <div className="hero-section">
                <h1 className="hero-headline">Fast, private image tools</h1>
                <p className="hero-subtext">
                    20 free utilities running directly in your browser. No server uploads, no sign-ups.
                </p>
                <div style={{ marginTop: 'var(--spacing-6)' }}>
                    <button
                        type="button"
                        className="header-search-btn"
                        style={{ margin: '0 auto', maxWidth: 440, height: 42, fontSize: 'var(--font-size-sm)' }}
                        onClick={onOpenSearch}
                    >
                        <Search size={16} />
                        <span>Search all 20 image tools…</span>
                        <span className="header-search-hint">Ctrl K</span>
                    </button>
                </div>
            </div>

            {/* Quick Start 3-Card Strip */}
            <div className="quick-start-grid">
                <button
                    type="button"
                    className="quick-start-tile"
                    onClick={() => onSelectTool('compressor')}
                    onMouseEnter={() => prefetchTool('compressor')}
                >
                    <div className="tile-icon-wrap"><Minimize2 size={20} /></div>
                    <div className="tile-text-wrap">
                        <div className="tile-title">Compress Image</div>
                        <div className="tile-desc">Reduce size with WebP/JPEG precision</div>
                    </div>
                </button>

                <button
                    type="button"
                    className="quick-start-tile"
                    onClick={() => onSelectTool('background-remover')}
                    onMouseEnter={() => prefetchTool('background-remover')}
                >
                    <div className="tile-icon-wrap"><Eraser size={20} /></div>
                    <div className="tile-text-wrap">
                        <div className="tile-title">Remove Background</div>
                        <div className="tile-desc">AI-powered cutout on your device</div>
                    </div>
                </button>

                <button
                    type="button"
                    className="quick-start-tile"
                    onClick={() => onSelectTool('resizer')}
                    onMouseEnter={() => prefetchTool('resizer')}
                >
                    <div className="tile-icon-wrap"><Maximize2 size={20} /></div>
                    <div className="tile-text-wrap">
                        <div className="tile-title">Social Media Resizer</div>
                        <div className="tile-desc">Presets for Instagram, YouTube, X</div>
                    </div>
                </button>
            </div>

            {/* Drop Anywhere Affordance */}
            <div
                className={`home-drop-banner ${isDraggingOver ? 'is-drag-over' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <Sparkles size={16} />
                <span>
                    <strong>Drop an image anywhere</strong> to instantly select an action (Compress, Resize, Crop, Remove BG…)
                </span>
            </div>

            {/* Favorites Section */}
            {favTools.length > 0 && (
                <>
                    <div className="section-label">★ Favorites</div>
                    <div className="tools-grid" style={{ marginBottom: 'var(--spacing-8)' }}>
                        {favTools.map((t) => (
                            <ToolCard
                                key={t.id}
                                {...t}
                                onClick={() => onSelectTool(t.id)}
                                onPrefetch={() => prefetchTool(t.id)}
                                isFavorite={true}
                                onToggleFavorite={() => toggleFavorite(t.id)}
                            />
                        ))}
                    </div>
                </>
            )}

            {/* Recently Used Section */}
            {recentToolCards.length > 0 && (
                <>
                    <div className="section-label">Recently Used</div>
                    <div className="tools-grid" style={{ marginBottom: 'var(--spacing-8)' }}>
                        {recentToolCards.map((t) => (
                            <ToolCard
                                key={`recent-${t.id}`}
                                {...t}
                                onClick={() => onSelectTool(t.id)}
                                onPrefetch={() => prefetchTool(t.id)}
                                isFavorite={isFavorite(t.id)}
                                onToggleFavorite={() => toggleFavorite(t.id)}
                            />
                        ))}
                    </div>
                </>
            )}

            {/* Category Filter Chips */}
            <div className="filter-bar">
                {categories.map((cat) => {
                    const count =
                        cat.key === 'all'
                            ? ALL_TOOLS.length
                            : ALL_TOOLS.filter((t) => t.category === cat.key).length
                    const isActive = selectedCategory === cat.key

                    return (
                        <button
                            key={cat.key}
                            type="button"
                            className={`filter-chip ${isActive ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(cat.key)}
                        >
                            <span>{cat.label}</span>
                            <span className="filter-chip-count">{count}</span>
                        </button>
                    )
                })}
            </div>

            {/* Tools Grid */}
            <div className="tools-grid">
                {filteredTools.map((t) => (
                    <ToolCard
                        key={t.id}
                        {...t}
                        onClick={() => onSelectTool(t.id)}
                        onPrefetch={() => prefetchTool(t.id)}
                        isFavorite={isFavorite(t.id)}
                        onToggleFavorite={() => toggleFavorite(t.id)}
                    />
                ))}
            </div>
        </div>
    )
}

function ToolLoading() {
    return (
        <div className="workspace-shell" aria-busy="true" aria-label="Loading tool">
            <div className="workspace-topbar">
                <div className="skeleton" style={{ height: 28, width: 140 }} />
                <div className="skeleton" style={{ height: 28, width: 80 }} />
            </div>
            <div className="workspace-body">
                <div className="workspace-rail">
                    <div className="skeleton" style={{ height: 36, width: '100%', marginBottom: 16 }} />
                    <div className="skeleton" style={{ height: 80, width: '100%', marginBottom: 16 }} />
                    <div className="skeleton" style={{ height: 120, width: '100%' }} />
                </div>
                <div className="workspace-canvas-wrap">
                    <div className="workspace-canvas-viewport">
                        <div className="skeleton" style={{ height: 380, width: '80%' }} />
                    </div>
                </div>
            </div>
        </div>
    )
}

function normalizePath(path: string): string {
    const trimmed = path.replace(/\/+$/, '')
    return trimmed === '' ? '/' : trimmed
}

function getToolFromLocation(): Tool {
    const legacyHash = window.location.hash.replace(/^#\/?/, '')
    if (legacyHash) {
        const tool =
            PATH_TO_TOOL.get(normalizePath(legacyHash)) ??
            (ALL_TOOLS.some((t) => t.id === legacyHash) ? (legacyHash as Tool) : 'home')
        history.replaceState(null, '', TOOL_PATHS[tool])
        return tool
    }
    return PATH_TO_TOOL.get(normalizePath(window.location.pathname)) ?? 'home'
}

function setPathForTool(tool: Tool) {
    history.pushState(null, '', TOOL_PATHS[tool])
}

function App() {
    const [currentTool, setCurrentTool] = useState<Tool>(getToolFromLocation)
    const [activeFile, setActiveFile] = useState<File | null>(null)
    const [droppedFile, setDroppedFile] = useState<File | null>(null)
    const [cmdOpen, setCmdOpen] = useState(false)
    const { favorites, toggleFavorite, isFavorite } = useFavorites()
    const { recentTools, addRecent } = useRecentlyUsed()

    // Navigation popstate
    useEffect(() => {
        const handler = () => setCurrentTool(getToolFromLocation())
        window.addEventListener('popstate', handler)
        return () => window.removeEventListener('popstate', handler)
    }, [])

    // Global Cmd+K / Ctrl+K shortcut
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault()
                setCmdOpen((o) => !o)
            }
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [])

    // SEO updates
    useEffect(() => {
        const seo = TOOL_SEO[currentTool] || TOOL_SEO.home
        document.title = seo.title
        const metaDesc = document.querySelector('meta[name="description"]')
        if (metaDesc) metaDesc.setAttribute('content', seo.desc)
        const canonical = document.querySelector('link[rel="canonical"]')
        if (canonical) canonical.setAttribute('href', `https://imagekitpro.com${TOOL_PATHS[currentTool]}`)
        const ogUrl = document.querySelector('meta[property="og:url"]')
        if (ogUrl) ogUrl.setAttribute('content', `https://imagekitpro.com${TOOL_PATHS[currentTool]}`)
    }, [currentTool])

    const handleSelectTool = useCallback(
        (tool: Tool | string) => {
            const t = tool as Tool
            setCurrentTool(t)
            setPathForTool(t)
            if (t !== 'home') addRecent(t)
        },
        [addRecent]
    )

    const handleBack = useCallback(() => {
        setCurrentTool('home')
        setPathForTool('home')
    }, [])

    const handleDropOnHome = useCallback((file: File) => {
        setDroppedFile(file)
    }, [])

    const handleChooserSelect = (toolId: string) => {
        if (droppedFile) {
            setActiveFile(droppedFile)
            setDroppedFile(null)
        }
        handleSelectTool(toolId)
    }

    const renderTool = () => {
        switch (currentTool) {
            case 'compressor':
                return (
                    <ImageCompressor
                        onBack={handleBack}
                        initialFile={activeFile}
                        onProduceFile={setActiveFile}
                    />
                )
            case 'resizer':
                return (
                    <SocialMediaResizer
                        onBack={handleBack}
                        initialFile={activeFile}
                        onProduceFile={setActiveFile}
                    />
                )
            case 'background-remover':
                return (
                    <BackgroundRemover
                        onBack={handleBack}
                        initialFile={activeFile}
                        onProduceFile={setActiveFile}
                    />
                )
            case 'exif-cleaner':
                return <ExifCleaner onBack={handleBack} />
            case 'color-palette':
                return <ColorPaletteExtractor onBack={handleBack} />
            case 'instagram-grid':
                return <InstagramGridSplitter onBack={handleBack} />
            case 'favicon':
                return <FaviconGenerator onBack={handleBack} />
            case 'ocr':
                return <OcrExtractor onBack={handleBack} />
            case 'device-mockup':
                return <DeviceMockupGenerator onBack={handleBack} />
            case 'color-blindness':
                return <ColorBlindnessSimulator onBack={handleBack} />
            case 'ascii-art':
                return <AsciiArtGenerator onBack={handleBack} />
            case 'image-comparison':
                return <ImageComparisonSlider onBack={handleBack} />
            case 'duplicate-finder':
                return <DuplicateFinder onBack={handleBack} />
            case 'image-to-pdf':
                return <ImageToPdf onBack={handleBack} />
            case 'pdf-to-image':
                return <PdfToImage onBack={handleBack} />
            case 'cropper':
                return <ImageCropper onBack={handleBack} />
            case 'rotator':
                return <ImageRotator onBack={handleBack} />
            case 'watermark':
                return <WatermarkAdder onBack={handleBack} />
            case 'watermark-remover':
                return <WatermarkRemover onBack={handleBack} />
            case 'thumbnail':
                return <ThumbnailMaker onBack={handleBack} />
            default:
                return null
        }
    }

    return (
        <div className="app-root">
            <Header onLogoClick={handleBack} onOpenSearch={() => setCmdOpen(true)} />

            <main className="main-viewport">
                {currentTool === 'home' ? (
                    <HomePage
                        onSelectTool={handleSelectTool}
                        onOpenSearch={() => setCmdOpen(true)}
                        favorites={favorites}
                        recentTools={recentTools}
                        isFavorite={isFavorite}
                        toggleFavorite={toggleFavorite}
                        onDropFile={handleDropOnHome}
                    />
                ) : (
                    <>
                        <ErrorBoundary resetKey={currentTool}>
                            <Suspense fallback={<ToolLoading />}>{renderTool()}</Suspense>
                        </ErrorBoundary>
                        <ToolSuggestionsBar
                            currentTool={currentTool}
                            onSelectTool={handleSelectTool}
                            hasActiveImage={!!activeFile}
                        />
                    </>
                )}
            </main>

            <footer className="app-footer">
                <div className="footer-inner">
                    <div>
                        © 2026 ImageKit Pro · 100% Client-Side Image Tools · MIT License
                    </div>
                    <div>
                        Crafted with precision by <strong>Alok Kushwaha</strong>
                    </div>
                </div>
            </footer>

            {/* Global Command Palette (Ctrl+K) */}
            <CommandPalette
                isOpen={cmdOpen}
                onClose={() => setCmdOpen(false)}
                items={ALL_TOOLS.map((t) => ({
                    id: t.id,
                    title: t.title,
                    description: t.description,
                    category: t.category,
                    icon: t.icon,
                }))}
                onSelect={(id) => handleSelectTool(id)}
            />

            {/* Drop On Home File Action Chooser */}
            <FileActionChooser
                file={droppedFile}
                onSelectTool={handleChooserSelect}
                onClose={() => setDroppedFile(null)}
            />
        </div>
    )
}

export default App
