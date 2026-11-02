import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import CommandPalette from './components/CommandPalette'
import CustomCursor from './components/CustomCursor'
import ErrorBoundary from './components/ErrorBoundary'
import FileActionChooser from './components/FileActionChooser'
import Preloader from './components/Preloader'
import RouteTransition from './components/RouteTransition'
import { SceneProvider } from './components/scene/SceneProvider'
import { HomeOrbitView } from './components/orbit/HomeOrbitView'
import { useFavorites } from './hooks/useFavorites'
import { useRecentlyUsed } from './hooks/useRecentlyUsed'
import ToolSuggestionsBar from './ToolSuggestionsBar'
import { useCapabilities } from './utils/capabilities'
import { getInitialTheme, saveTheme, type Theme } from './utils/theme'
import { Tool, TOOL_PATHS, PATH_TO_TOOL, TOOL_SEO, ALL_TOOLS } from './constants/tools'

const ImmersiveCanvas = lazy(() => import('./components/scene/ImmersiveCanvas'))

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
    const [isRouteTransitioning, setIsRouteTransitioning] = useState(false)
    const [pendingTool, setPendingTool] = useState<Tool | null>(null)
    const [preloaderDone, setPreloaderDone] = useState(() => (typeof window === 'undefined' ? true : getToolFromLocation() !== 'home'))
    const [is3DLocal, setIs3DLocal] = useState(true)
    const [theme, setTheme] = useState<Theme>(getInitialTheme)

    const { favorites, toggleFavorite, isFavorite } = useFavorites()
    const { addRecent } = useRecentlyUsed()
    const { shouldRun3D } = useCapabilities()

    const toggle3D = useCallback(() => setIs3DLocal((v) => !v), [])

    const toggleTheme = useCallback(() => {
        setTheme((prev) => {
            const next = prev === 'dark' ? 'light' : 'dark'
            saveTheme(next)
            document.documentElement.setAttribute('data-theme', next)
            return next
        })
    }, [])

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
            if (t === currentTool) return
            prefetchTool(t)
            setPendingTool(t)
            setIsRouteTransitioning(true)
            setTimeout(() => {
                setCurrentTool(t)
                setPathForTool(t)
                if (t !== 'home') addRecent(t)
                window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
            }, 280)
        },
        [addRecent, currentTool]
    )

    const handleBack = useCallback(() => {
        if (currentTool === 'home') return
        setPendingTool('home')
        setIsRouteTransitioning(true)
        setTimeout(() => {
            setCurrentTool('home')
            setPathForTool('home')
            window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
        }, 280)
    }, [currentTool])

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
                return (
                    <ExifCleaner
                        onBack={handleBack}
                        initialFile={activeFile}
                        onProduceFile={setActiveFile}
                    />
                )
            case 'color-palette':
                return (
                    <ColorPaletteExtractor
                        onBack={handleBack}
                        initialFile={activeFile}
                    />
                )
            case 'instagram-grid':
                return (
                    <InstagramGridSplitter
                        onBack={handleBack}
                        initialFile={activeFile}
                    />
                )
            case 'favicon':
                return (
                    <FaviconGenerator
                        onBack={handleBack}
                        initialFile={activeFile}
                    />
                )
            case 'ocr':
                return (
                    <OcrExtractor
                        onBack={handleBack}
                        initialFile={activeFile}
                    />
                )
            case 'device-mockup':
                return (
                    <DeviceMockupGenerator
                        onBack={handleBack}
                        initialFile={activeFile}
                        onProduceFile={setActiveFile}
                    />
                )
            case 'color-blindness':
                return (
                    <ColorBlindnessSimulator
                        onBack={handleBack}
                        initialFile={activeFile}
                    />
                )
            case 'ascii-art':
                return (
                    <AsciiArtGenerator
                        onBack={handleBack}
                        initialFile={activeFile}
                    />
                )
            case 'image-comparison':
                return (
                    <ImageComparisonSlider
                        onBack={handleBack}
                        initialFile={activeFile}
                    />
                )
            case 'duplicate-finder':
                return <DuplicateFinder onBack={handleBack} />
            case 'image-to-pdf':
                return (
                    <ImageToPdf
                        onBack={handleBack}
                        initialFile={activeFile}
                    />
                )
            case 'pdf-to-image':
                return <PdfToImage onBack={handleBack} />
            case 'cropper':
                return (
                    <ImageCropper
                        onBack={handleBack}
                        initialFile={activeFile}
                        onProduceFile={setActiveFile}
                    />
                )
            case 'rotator':
                return (
                    <ImageRotator
                        onBack={handleBack}
                        initialFile={activeFile}
                        onProduceFile={setActiveFile}
                    />
                )
            case 'watermark':
                return (
                    <WatermarkAdder
                        onBack={handleBack}
                        initialFile={activeFile}
                        onProduceFile={setActiveFile}
                    />
                )
            case 'watermark-remover':
                return (
                    <WatermarkRemover
                        onBack={handleBack}
                        initialFile={activeFile}
                        onProduceFile={setActiveFile}
                    />
                )
            case 'thumbnail':
                return (
                    <ThumbnailMaker
                        onBack={handleBack}
                        initialFile={activeFile}
                        onProduceFile={setActiveFile}
                    />
                )
            default:
                return null
        }
    }

    const pendingTitle = pendingTool
        ? ALL_TOOLS.find((t) => t.id === pendingTool)?.title || 'ImageKit Pro'
        : undefined

    const is3DActive = shouldRun3D && is3DLocal

    return (
        <SceneProvider>
            <div className={`app-root ${currentTool === 'home' ? 'home-mode' : 'workspace-mode'}`}>
                <CustomCursor />

                {!preloaderDone && (
                    <Preloader onComplete={() => setPreloaderDone(true)} />
                )}

                <RouteTransition
                    isTransitioning={isRouteTransitioning}
                    targetToolTitle={pendingTitle}
                    onTransitionComplete={() => setIsRouteTransitioning(false)}
                />

                {/* 3D Immersive Canvas (Mounted ONLY on home when 3D is active, completely unmounted in tools) */}
                {is3DActive && currentTool === 'home' && (
                    <Suspense fallback={null}>
                        <ImmersiveCanvas onSelectTool={handleSelectTool} />
                    </Suspense>
                )}

                <main className="main-viewport">
                    {currentTool === 'home' ? (
                        <HomeOrbitView
                            onSelectTool={handleSelectTool}
                            onOpenSearch={() => setCmdOpen(true)}
                            onDropFile={handleDropOnHome}
                            favorites={favorites}
                            isFavorite={isFavorite}
                            toggleFavorite={toggleFavorite}
                            is3DEnabled={is3DActive}
                            onToggle3D={toggle3D}
                            allTools={ALL_TOOLS}
                            theme={theme}
                            onToggleTheme={toggleTheme}
                        />
                    ) : (
                        <div className="tool-view-container">
                            <ErrorBoundary resetKey={currentTool}>
                                <Suspense fallback={<ToolLoading />}>{renderTool()}</Suspense>
                            </ErrorBoundary>
                            <ToolSuggestionsBar
                                currentTool={currentTool}
                                onSelectTool={handleSelectTool}
                                hasActiveImage={!!activeFile}
                            />
                        </div>
                    )}
                </main>

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
        </SceneProvider>
    )
}

export default App
