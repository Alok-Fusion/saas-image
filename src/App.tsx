import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import { useFavorites } from './hooks/useFavorites'
import { useRecentlyUsed } from './hooks/useRecentlyUsed'
import ToolSuggestionsBar from './ToolSuggestionsBar'

type Tool = 'home' | 'compressor' | 'resizer' | 'background-remover' | 'exif-cleaner' | 'color-palette' | 'instagram-grid' | 'favicon' | 'ocr' | 'device-mockup' | 'color-blindness' | 'ascii-art' | 'image-comparison' | 'duplicate-finder' | 'image-to-pdf' | 'pdf-to-image' | 'cropper' | 'rotator' | 'watermark' | 'watermark-remover' | 'thumbnail'

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

// SEO title/description per tool
const TOOL_SEO: Record<string, { title: string; desc: string }> = {
    'home': { title: 'ImageKit Pro — Free Online Image Tools', desc: '20 free image tools right in your browser. No uploads, no sign-ups.' },
    'compressor': { title: 'Image Compressor — ImageKit Pro', desc: 'Compress images while maintaining quality. JPEG, PNG, WebP supported.' },
    'resizer': { title: 'Social Media Resizer — ImageKit Pro', desc: 'Resize images for Instagram, YouTube, LinkedIn & more.' },
    'background-remover': { title: 'Background Remover — ImageKit Pro', desc: 'AI-powered background removal. Works right in your browser.' },
    'exif-cleaner': { title: 'EXIF Privacy Cleaner — ImageKit Pro', desc: 'Remove GPS, camera info & metadata from your images.' },
    'color-palette': { title: 'Color Palette Extractor — ImageKit Pro', desc: 'Extract colors with HEX, RGB & CSS gradients.' },
    'instagram-grid': { title: 'Instagram Grid Splitter — ImageKit Pro', desc: 'Split images into 3×3, 3×2, 3×1 grids for carousel.' },
    'favicon': { title: 'Favicon Generator — ImageKit Pro', desc: 'Generate all favicon sizes + manifest.json + HTML snippet.' },
    'ocr': { title: 'OCR Text Extractor — ImageKit Pro', desc: 'Extract text from images in 12 languages.' },
    'device-mockup': { title: 'Device Mockup Generator — ImageKit Pro', desc: 'iPhone, MacBook, iPad device frame mockups.' },
    'color-blindness': { title: 'Color Blindness Simulator — ImageKit Pro', desc: 'See how designs appear to color blind users.' },
    'ascii-art': { title: 'ASCII Art Generator — ImageKit Pro', desc: 'Convert images to ASCII text art.' },
    'image-comparison': { title: 'Image Comparison Slider — ImageKit Pro', desc: 'Side-by-side image comparison with slider.' },
    'duplicate-finder': { title: 'Duplicate Image Finder — ImageKit Pro', desc: 'Find similar images using perceptual hashing.' },
    'image-to-pdf': { title: 'Image to PDF — ImageKit Pro', desc: 'Convert multiple images into a single PDF.' },
    'pdf-to-image': { title: 'PDF to Image — ImageKit Pro', desc: 'Convert PDF pages to PNG images.' },
    'cropper': { title: 'Image Cropper — ImageKit Pro', desc: 'Crop images with preset aspect ratios.' },
    'rotator': { title: 'Image Rotator — ImageKit Pro', desc: 'Rotate 90°/180° and flip images.' },
    'watermark': { title: 'Watermark Adder — ImageKit Pro', desc: 'Add text watermarks with custom position & style.' },
    'watermark-remover': { title: 'Watermark Remover — ImageKit Pro', desc: 'Remove watermarks using inpaint, blur, or pixelate.' },
    'thumbnail': { title: 'Thumbnail Maker — ImageKit Pro', desc: 'Create thumbnails with images, text & emojis.' },
}

// All tool definitions for the homepage grid
const ALL_TOOLS: { id: Tool; icon: string; iconClass: string; title: string; description: string; isNew?: boolean; category: string }[] = [
    { id: 'compressor', icon: '📦', iconClass: 'compress', title: 'Image Compressor', description: 'Reduce file size while maintaining quality.', category: 'core' },
    { id: 'resizer', icon: '📱', iconClass: 'resize', title: 'Social Media Resizer', description: 'Resize for Instagram, YouTube, LinkedIn & more.', category: 'core' },
    { id: 'background-remover', icon: '🎭', iconClass: 'remove-bg', title: 'Background Remover', description: 'AI-powered background removal.', category: 'core' },
    { id: 'cropper', icon: '✂️', iconClass: 'crop', title: 'Image Cropper', description: 'Crop with preset aspect ratios (1:1, 16:9, 4:3).', isNew: true, category: 'edit' },
    { id: 'rotator', icon: '🔄', iconClass: 'rotate', title: 'Image Rotator', description: 'Rotate 90°/180° and flip horizontal/vertical.', isNew: true, category: 'edit' },
    { id: 'watermark', icon: '©', iconClass: 'watermark', title: 'Watermark Adder', description: 'Add text watermarks with custom position & style.', isNew: true, category: 'edit' },
    { id: 'watermark-remover', icon: '🧹', iconClass: 'wmremover', title: 'Watermark Remover', description: 'Remove watermarks using inpaint, blur, or pixelate.', isNew: true, category: 'edit' },
    { id: 'image-to-pdf', icon: '📄', iconClass: 'pdf', title: 'Image to PDF', description: 'Convert multiple images into a single PDF.', isNew: true, category: 'pdf' },
    { id: 'pdf-to-image', icon: '📑', iconClass: 'pdfimg', title: 'PDF to Image', description: 'Convert PDF pages to PNG images.', isNew: true, category: 'pdf' },
    { id: 'exif-cleaner', icon: '🔐', iconClass: 'privacy', title: 'EXIF Privacy Cleaner', description: 'Remove GPS, camera info & metadata.', isNew: true, category: 'privacy' },
    { id: 'duplicate-finder', icon: '🔍', iconClass: 'duplicate', title: 'Duplicate Finder', description: 'Find similar images using perceptual hashing.', isNew: true, category: 'privacy' },
    { id: 'ocr', icon: '📝', iconClass: 'ocr', title: 'OCR Text Extractor', description: 'Extract text from images. 12 languages.', isNew: true, category: 'privacy' },
    { id: 'color-palette', icon: '🎨', iconClass: 'palette', title: 'Color Palette Extractor', description: 'Extract colors with HEX/RGB & CSS gradients.', isNew: true, category: 'design' },
    { id: 'device-mockup', icon: '📱', iconClass: 'mockup', title: 'Device Mockup Generator', description: 'iPhone, MacBook, iPad device frames.', isNew: true, category: 'design' },
    { id: 'ascii-art', icon: '🖌️', iconClass: 'ascii', title: 'ASCII Art Generator', description: 'Convert images to ASCII text art.', isNew: true, category: 'design' },
    { id: 'thumbnail', icon: '🎬', iconClass: 'thumbnail', title: 'Thumbnail Maker', description: 'Create thumbnails with images, text & emojis.', isNew: true, category: 'design' },
    { id: 'instagram-grid', icon: '📸', iconClass: 'instagram', title: 'Instagram Grid Splitter', description: 'Split into 3×3/3×2/3×1 grids for carousel.', isNew: true, category: 'social' },
    { id: 'favicon', icon: '🖼️', iconClass: 'favicon', title: 'Favicon Generator', description: 'All sizes + manifest.json + HTML snippet.', isNew: true, category: 'social' },
    { id: 'color-blindness', icon: '👁️', iconClass: 'colorblind', title: 'Color Blindness Simulator', description: 'See how designs appear to color blind users.', isNew: true, category: 'accessibility' },
    { id: 'image-comparison', icon: '↔️', iconClass: 'compare', title: 'Image Comparison Slider', description: 'Before/after comparison with slider.', isNew: true, category: 'accessibility' },
]

interface ToolCardProps {
    icon: string; iconClass: string; title: string; description: string; isNew?: boolean; onClick: () => void
    onPrefetch?: () => void
    isFavorite?: boolean; onToggleFavorite?: (e: React.MouseEvent) => void
}

function ToolCard({ icon, iconClass, title, description, isNew, onClick, onPrefetch, isFavorite, onToggleFavorite }: ToolCardProps) {
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
            {isNew && <div className="tool-card-badge">NEW</div>}
            {onToggleFavorite && (
                <button
                    className={`favorite-btn ${isFavorite ? 'active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(e) }}
                    aria-label={isFavorite ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
                    aria-pressed={isFavorite}
                >
                    {isFavorite ? '★' : '☆'}
                </button>
            )}
            <div className={`tool-card-icon ${iconClass}`}>{icon}</div>
            <h3 className="tool-card-title">{title}</h3>
            <p className="tool-card-description">{description}</p>
            <div className="tool-card-arrow">→</div>
        </div>
    )
}

function Header({ onLogoClick }: { onLogoClick: () => void }) {
    return (
        <header className="header">
            <div className="header-content">
                <div className="logo" onClick={onLogoClick}>
                    <div className="logo-icon">✨</div>
                    ImageKit Pro
                </div>
                <nav className="nav-links">
                    <span className="nav-badge">20 Tools Available</span>
                </nav>
            </div>
        </header>
    )
}

interface HomePageProps {
    onSelectTool: (tool: Tool) => void
    favorites: string[]
    recentTools: string[]
    isFavorite: (tool: string) => boolean
    toggleFavorite: (tool: string) => void
}

function HomePage({ onSelectTool, favorites, recentTools, isFavorite, toggleFavorite }: HomePageProps) {
    // Build favorite tool cards
    const favTools = ALL_TOOLS.filter(t => favorites.includes(t.id))
    // Build recent tool cards (exclude those already in favorites section to avoid duplication at top)
    const recentToolCards = recentTools
        .map(id => ALL_TOOLS.find(t => t.id === id))
        .filter((t): t is typeof ALL_TOOLS[0] => !!t)

    const categories: { key: string; label: string; icon: string }[] = [
        { key: 'core', label: 'Core Tools', icon: '⭐' },
        { key: 'edit', label: 'Edit & Transform', icon: '✂️' },
        { key: 'pdf', label: 'PDF Tools', icon: '📄' },
        { key: 'privacy', label: 'Privacy & Utilities', icon: '🔒' },
        { key: 'design', label: 'Design & Creative', icon: '🎨' },
        { key: 'social', label: 'Social Media & Web', icon: '🌐' },
        { key: 'accessibility', label: 'Accessibility & Analysis', icon: '♿' },
    ]

    return (
        <div className="hero">
            <h1 className="hero-title">Transform Your Images <span>Instantly</span></h1>
            <p className="hero-subtitle">Free, powerful image tools right in your browser. No uploads to servers, no sign-ups required.</p>

            {/* Favorites Section */}
            {favTools.length > 0 && (
                <>
                    <div className="section-title"><span className="section-icon">⭐</span>Your Favorites</div>
                    <div className="tools-grid">
                        {favTools.map(t => (
                            <ToolCard key={t.id} {...t} onClick={() => onSelectTool(t.id)}
                                onPrefetch={() => prefetchTool(t.id)}
                                isFavorite={true} onToggleFavorite={() => toggleFavorite(t.id)} />
                        ))}
                    </div>
                </>
            )}

            {/* Recently Used Section */}
            {recentToolCards.length > 0 && (
                <>
                    <div className="section-title"><span className="section-icon">🕐</span>Recently Used</div>
                    <div className="tools-grid">
                        {recentToolCards.map(t => (
                            <ToolCard key={`recent-${t.id}`} {...t} onClick={() => onSelectTool(t.id)}
                                onPrefetch={() => prefetchTool(t.id)}
                                isFavorite={isFavorite(t.id)} onToggleFavorite={() => toggleFavorite(t.id)} />
                        ))}
                    </div>
                </>
            )}

            {/* Category Sections */}
            {categories.map(cat => {
                const tools = ALL_TOOLS.filter(t => t.category === cat.key)
                return (
                    <div key={cat.key}>
                        <div className="section-title"><span className="section-icon">{cat.icon}</span>{cat.label}</div>
                        <div className="tools-grid">
                            {tools.map(t => (
                                <ToolCard key={t.id} {...t} onClick={() => onSelectTool(t.id)}
                                    onPrefetch={() => prefetchTool(t.id)}
                                    isFavorite={isFavorite(t.id)} onToggleFavorite={() => toggleFavorite(t.id)} />
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

function ToolLoading() {
    return (
        <div className="tool-page" aria-busy="true" aria-label="Loading tool">
            <div className="skeleton" style={{ height: 44, width: '45%', marginBottom: '1.5rem' }} />
            <div className="skeleton" style={{ height: 240, width: '100%', marginBottom: '1rem' }} />
            <div className="skeleton" style={{ height: 120, width: '100%' }} />
        </div>
    )
}

// ---- Path-based routing (legacy #/tool links are redirected) ----
function normalizePath(path: string): string {
    const trimmed = path.replace(/\/+$/, '')
    return trimmed === '' ? '/' : trimmed
}

function getToolFromLocation(): Tool {
    const legacyHash = window.location.hash.replace(/^#\/?/, '')
    if (legacyHash) {
        const tool = PATH_TO_TOOL.get(normalizePath(legacyHash)) ?? (ALL_TOOLS.some(t => t.id === legacyHash) ? legacyHash as Tool : 'home')
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
    const { favorites, toggleFavorite, isFavorite } = useFavorites()
    const { recentTools, addRecent } = useRecentlyUsed()

    // Listen for back/forward navigation
    useEffect(() => {
        const handler = () => setCurrentTool(getToolFromLocation())
        window.addEventListener('popstate', handler)
        return () => window.removeEventListener('popstate', handler)
    }, [])

    // Update SEO meta on tool change
    useEffect(() => {
        const seo = TOOL_SEO[currentTool] || TOOL_SEO['home']
        document.title = seo.title
        const metaDesc = document.querySelector('meta[name="description"]')
        if (metaDesc) metaDesc.setAttribute('content', seo.desc)
        const canonical = document.querySelector('link[rel="canonical"]')
        if (canonical) canonical.setAttribute('href', `https://imagekitpro.com${TOOL_PATHS[currentTool]}`)
        const ogUrl = document.querySelector('meta[property="og:url"]')
        if (ogUrl) ogUrl.setAttribute('content', `https://imagekitpro.com${TOOL_PATHS[currentTool]}`)
    }, [currentTool])

    const handleSelectTool = useCallback((tool: Tool | string) => {
        const t = tool as Tool
        setCurrentTool(t)
        setPathForTool(t)
        if (t !== 'home') addRecent(t)
    }, [addRecent])

    const handleBack = useCallback(() => {
        setCurrentTool('home')
        setPathForTool('home')
    }, [])

    const renderTool = () => {
        switch (currentTool) {
            case 'compressor': return <ImageCompressor onBack={handleBack} />
            case 'resizer': return <SocialMediaResizer onBack={handleBack} />
            case 'background-remover': return <BackgroundRemover onBack={handleBack} />
            case 'exif-cleaner': return <ExifCleaner onBack={handleBack} />
            case 'color-palette': return <ColorPaletteExtractor onBack={handleBack} />
            case 'instagram-grid': return <InstagramGridSplitter onBack={handleBack} />
            case 'favicon': return <FaviconGenerator onBack={handleBack} />
            case 'ocr': return <OcrExtractor onBack={handleBack} />
            case 'device-mockup': return <DeviceMockupGenerator onBack={handleBack} />
            case 'color-blindness': return <ColorBlindnessSimulator onBack={handleBack} />
            case 'ascii-art': return <AsciiArtGenerator onBack={handleBack} />
            case 'image-comparison': return <ImageComparisonSlider onBack={handleBack} />
            case 'duplicate-finder': return <DuplicateFinder onBack={handleBack} />
            case 'image-to-pdf': return <ImageToPdf onBack={handleBack} />
            case 'pdf-to-image': return <PdfToImage onBack={handleBack} />
            case 'cropper': return <ImageCropper onBack={handleBack} />
            case 'rotator': return <ImageRotator onBack={handleBack} />
            case 'watermark': return <WatermarkAdder onBack={handleBack} />
            case 'watermark-remover': return <WatermarkRemover onBack={handleBack} />
            case 'thumbnail': return <ThumbnailMaker onBack={handleBack} />
            default: return null
        }
    }

    return (
        <>
            <Header onLogoClick={handleBack} />
            <main className="main-container">
                {currentTool === 'home' ? (
                    <HomePage
                        onSelectTool={handleSelectTool}
                        favorites={favorites}
                        recentTools={recentTools}
                        isFavorite={isFavorite}
                        toggleFavorite={toggleFavorite}
                    />
                ) : (
                    <>
                        <ErrorBoundary resetKey={currentTool}>
                            <Suspense fallback={<ToolLoading />}>
                                {renderTool()}
                            </Suspense>
                        </ErrorBoundary>
                        <ToolSuggestionsBar currentTool={currentTool} onSelectTool={handleSelectTool} />
                    </>
                )}
            </main>
            <footer className="footer">
                <p>© 2026 ImageKit Pro. All processing happens in your browser - your images never leave your device.</p>
                <p style={{ marginTop: '0.5rem', opacity: 0.7 }}>Developed with ❤️ by <strong>Alok Kushwaha</strong></p>
            </footer>
        </>
    )
}

export default App
