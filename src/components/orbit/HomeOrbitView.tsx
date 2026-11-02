import React, { useRef, useEffect, useCallback } from 'react'
import { Sparkles, Search, Play, Grid, Box, Upload, ArrowRight, Sun, Moon, Star, Camera } from 'lucide-react'
import { useScene } from '../scene/sceneContext'
import { getSampleImageFile } from '../../utils/sampleImage'
import { suggestToolsForFile } from '../../utils/toolSuggestions'
import ToolHoverCard from './ToolHoverCard'
import GuidedTourOverlay from './GuidedTourOverlay'
import { ORBIT_TOOLS, OrbitToolDefinition } from '../../constants/orbitTools'
import { useBreakpoint } from '../../hooks/useBreakpoint'

export interface ToolItemDef {
    id: string
    title: string
    description: string
    category: string
    icon: React.ReactNode
    isNew?: boolean
}

interface HomeOrbitViewProps {
    onSelectTool: (toolId: string) => void
    onOpenSearch: () => void
    onDropFile: (file: File) => void
    favorites: string[]
    isFavorite: (tool: string) => boolean
    toggleFavorite: (tool: string) => void
    is3DEnabled: boolean
    onToggle3D: () => void
    allTools: ToolItemDef[]
    theme: 'dark' | 'light'
    onToggleTheme: () => void
}

const CATEGORIES = [
    { key: 'all', label: 'All 20 Tools' },
    { key: 'core', label: 'Essentials' },
    { key: 'edit', label: 'Edit & Transform' },
    { key: 'pdf', label: 'PDF Suite' },
    { key: 'privacy', label: 'Privacy' },
    { key: 'design', label: 'Design' },
    { key: 'social', label: 'Social' },
    { key: 'accessibility', label: 'Accessibility' },
]

export const HomeOrbitView: React.FC<HomeOrbitViewProps> = ({
    onSelectTool,
    onOpenSearch,
    onDropFile,
    favorites,
    isFavorite,
    toggleFavorite,
    is3DEnabled,
    onToggle3D,
    allTools,
    theme,
    onToggleTheme,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const cameraInputRef = useRef<HTMLInputElement>(null)
    const { isMobile, breakpoint } = useBreakpoint()
    const {
        selectedCategory,
        setSelectedCategory,
        suggestedTools,
        setSuggestedTools,
        isDraggingFile,
        setIsDraggingFile,
        setIsTourActive,
        viewMode,
        setViewMode,
        setActiveImageSrc,
        hoveredToolId,
        setHoveredToolId,
    } = useScene()

    // Process uploaded/dropped/sample file
    const processFile = useCallback(
        (file: File) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string
                setActiveImageSrc(dataUrl)
            }
            reader.readAsDataURL(file)

            // Calculate smart suggested tools
            const suggested = suggestToolsForFile(file)
            setSuggestedTools(suggested)

            // Pass to parent handler
            onDropFile(file)
        },
        [setActiveImageSrc, setSuggestedTools, onDropFile]
    )

    // Lock body to 100dvh when on home in 3D orbit mode
    useEffect(() => {
        if (viewMode === '3d') {
            document.body.classList.add('home-locked')
        } else {
            document.body.classList.remove('home-locked')
        }
        return () => {
            document.body.classList.remove('home-locked')
        }
    }, [viewMode])

    // Window drag-and-drop listener to trigger 3D iris aperture open
    useEffect(() => {
        let dragCounter = 0

        const handleDragEnter = (e: DragEvent) => {
            e.preventDefault()
            dragCounter++
            if (e.dataTransfer?.types.includes('Files')) {
                setIsDraggingFile(true)
            }
        }

        const handleDragLeave = (e: DragEvent) => {
            e.preventDefault()
            dragCounter--
            if (dragCounter <= 0) {
                setIsDraggingFile(false)
                dragCounter = 0
            }
        }

        const handleDragOver = (e: DragEvent) => {
            e.preventDefault()
        }

        const handleDrop = (e: DragEvent) => {
            e.preventDefault()
            dragCounter = 0
            setIsDraggingFile(false)
            const file = e.dataTransfer?.files[0]
            if (file) {
                processFile(file)
            }
        }

        window.addEventListener('dragenter', handleDragEnter)
        window.addEventListener('dragleave', handleDragLeave)
        window.addEventListener('dragover', handleDragOver)
        window.addEventListener('drop', handleDrop)

        return () => {
            window.removeEventListener('dragenter', handleDragEnter)
            window.removeEventListener('dragleave', handleDragLeave)
            window.removeEventListener('dragover', handleDragOver)
            window.removeEventListener('drop', handleDrop)
        }
    }, [setIsDraggingFile, processFile])

    // Global clipboard paste listener (Ctrl+V / Cmd+V)
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
                const file = e.clipboardData.files[0]
                processFile(file)
            }
        }

        window.addEventListener('paste', handlePaste)
        return () => window.removeEventListener('paste', handlePaste)
    }, [processFile])

    // Keyboard arrow keys navigation around 3D orbit
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if active in an input
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return

            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault()
                const currentIdx = ORBIT_TOOLS.findIndex((t: OrbitToolDefinition) => t.id === hoveredToolId)
                const nextIdx = (currentIdx + 1) % ORBIT_TOOLS.length
                setHoveredToolId(ORBIT_TOOLS[nextIdx].id)
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault()
                const currentIdx = ORBIT_TOOLS.findIndex((t: OrbitToolDefinition) => t.id === hoveredToolId)
                const prevIdx = currentIdx <= 0 ? ORBIT_TOOLS.length - 1 : currentIdx - 1
                setHoveredToolId(ORBIT_TOOLS[prevIdx].id)
            } else if (e.key === 'Enter' && hoveredToolId) {
                e.preventDefault()
                onSelectTool(hoveredToolId)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [hoveredToolId, setHoveredToolId, onSelectTool])

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            processFile(file)
        }
    }

    const handleSampleClick = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        const sampleFile = await getSampleImageFile()
        processFile(sampleFile)
    }

    const categoriesList =
        favorites.length > 0
            ? [{ key: 'favorites', label: `★ Favorites (${favorites.length})` }, ...CATEGORIES]
            : CATEGORIES

    const filteredTools =
        selectedCategory === 'favorites'
            ? allTools.filter((t) => favorites.includes(t.id))
            : selectedCategory === 'all'
            ? allTools
            : allTools.filter((t) => t.category === selectedCategory)

    return (
        <div className={`home-orbit-shell ${isMobile ? 'is-mobile-home' : ''}`}>
            {/* Hidden native file input for media library */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
            />

            {/* Hidden native file input for direct camera capture */}
            <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
            />

            {/* Topbar Navigation Layer */}
            <header className="orbit-topbar">
                <div className="orbit-topbar-left">
                    <button
                        type="button"
                        className="orbit-brand-btn"
                        onClick={() => {
                            setSelectedCategory('all')
                            setSuggestedTools([])
                        }}
                    >
                        <Sparkles size={16} color="var(--color-electric-lime)" />
                        <span>ImageKit</span>
                        <span className="orbit-brand-badge">PRO</span>
                    </button>

                    {/* Category Filter Chips (on desktop / tablet) */}
                    {!isMobile && (
                        <nav className="orbit-categories-nav" aria-label="Tool categories">
                            {categoriesList.map((cat) => (
                                <button
                                    key={cat.key}
                                    type="button"
                                    className={`orbit-cat-chip ${selectedCategory === cat.key ? 'is-active' : ''}`}
                                    onClick={() => setSelectedCategory(cat.key)}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </nav>
                    )}
                </div>

                <div className="orbit-topbar-right">
                    {/* Search Command Palette Trigger */}
                    <button
                        type="button"
                        className="orbit-action-pill-btn"
                        onClick={onOpenSearch}
                        aria-label="Search tools (Ctrl+K)"
                    >
                        <Search size={14} />
                        <span className="search-btn-text">{isMobile ? 'Search' : 'Search tools'}</span>
                        {!isMobile && <kbd style={{ fontSize: '10px', opacity: 0.6 }}>⌘K</kbd>}
                    </button>

                    {/* Desktop/Tablet-only buttons */}
                    {!isMobile && (
                        <>
                            {/* 20-Second Guided Tour */}
                            <button
                                type="button"
                                className="orbit-action-pill-btn tour-btn"
                                onClick={() => setIsTourActive(true)}
                                aria-label="Watch 20-second guided tour"
                            >
                                <Play size={12} fill="currentColor" />
                                <span>20s Tour</span>
                            </button>

                            {/* 3D Orbit / 2D List View Toggle */}
                            <button
                                type="button"
                                className="orbit-action-pill-btn"
                                onClick={() => setViewMode(viewMode === '3d' ? 'list' : '3d')}
                                aria-label={viewMode === '3d' ? 'Switch to 2D list view' : 'Switch to 3D orbit'}
                            >
                                {viewMode === '3d' ? <Grid size={13} /> : <Box size={13} />}
                                <span>{viewMode === '3d' ? 'List View' : '3D Orbit'}</span>
                            </button>

                            {/* Minimal FX Toggle */}
                            <button
                                type="button"
                                className="orbit-action-pill-btn"
                                onClick={onToggle3D}
                                aria-label={is3DEnabled ? 'Disable 3D effects' : 'Enable 3D effects'}
                            >
                                <span>{is3DEnabled ? '3D Active' : 'Minimal FX'}</span>
                            </button>
                        </>
                    )}

                    {/* Theme Toggle */}
                    <button
                        type="button"
                        className="orbit-action-pill-btn"
                        onClick={onToggleTheme}
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                    </button>
                </div>
            </header>

            {/* Mobile View: Dedicated Compact 100dvh UI with Drop Button & Scrollable Grid */}
            {isMobile ? (
                <div className="orbit-mobile-shell">
                    {/* Compact Hero & Drop Intake */}
                    <div className="orbit-mobile-hero">
                        <h1 className="orbit-mobile-headline">Fast, private image tools.</h1>
                        <p className="orbit-mobile-subtext">20 in-browser utilities · Zero uploads</p>

                        {/* Full-width Big Drop Target Button */}
                        <div className="orbit-mobile-drop-wrap">
                            <button
                                type="button"
                                className="orbit-mobile-choose-btn"
                                onClick={() => fileInputRef.current?.click()}
                                aria-label="Choose or drop an image"
                            >
                                <Upload size={18} />
                                <span>Choose or drop an image</span>
                            </button>

                            <div className="orbit-mobile-subactions">
                                <button
                                    type="button"
                                    className="orbit-mobile-sub-btn"
                                    onClick={() => cameraInputRef.current?.click()}
                                    aria-label="Take a photo with camera"
                                >
                                    <Camera size={14} />
                                    <span>Take Photo</span>
                                </button>
                                <button
                                    type="button"
                                    className="orbit-mobile-sub-btn"
                                    onClick={handleSampleClick}
                                    aria-label="Try with sample image"
                                >
                                    <Sparkles size={14} color="var(--color-electric-lime)" />
                                    <span>Try Sample</span>
                                </button>
                            </div>
                        </div>

                        {/* Category Filter Chips on Mobile (horizontal scrolling) */}
                        <nav className="orbit-categories-nav mobile-chips" aria-label="Tool categories">
                            {categoriesList.map((cat) => (
                                <button
                                    key={cat.key}
                                    type="button"
                                    className={`orbit-cat-chip ${selectedCategory === cat.key ? 'is-active' : ''}`}
                                    onClick={() => setSelectedCategory(cat.key)}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Scrollable Tool Grid (2 cols on phones, 1 col < 360px) */}
                    <div
                        className={`orbit-mobile-tools-scroll ${breakpoint === 'xs' ? 'cols-1' : 'cols-2'}`}
                        role="region"
                        aria-label="All tools grid"
                    >
                        <div className="orbit-mobile-tools-grid">
                            {filteredTools.map((t) => (
                                <div
                                    key={t.id}
                                    className="orbit-mobile-card"
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => onSelectTool(t.id)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault()
                                            onSelectTool(t.id)
                                        }
                                    }}
                                >
                                    <div className="orbit-mobile-card-top">
                                        <div className="orbit-mobile-card-icon">{t.icon}</div>
                                        <button
                                            type="button"
                                            className={`fav-star-btn ${isFavorite(t.id) ? 'is-favorite' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                toggleFavorite(t.id)
                                            }}
                                            aria-label={
                                                isFavorite(t.id)
                                                    ? `Remove ${t.title} from favorites`
                                                    : `Add ${t.title} to favorites`
                                            }
                                        >
                                            <Star size={14} fill={isFavorite(t.id) ? 'currentColor' : 'none'} />
                                        </button>
                                    </div>
                                    <h2 className="orbit-mobile-card-title">{t.title}</h2>
                                    <p className="orbit-mobile-card-desc">{t.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : viewMode === '3d' ? (
                <div className="orbit-hero-container">
                    <h1 className="orbit-hero-headline">Fast, private image tools.</h1>
                    <p className="orbit-hero-subtext">
                        20 precision client-side utilities. Zero server uploads.
                    </p>

                    {/* Drop Well */}
                    <div
                        className={`orbit-drop-well ${isDraggingFile ? 'is-dragging' : ''}`}
                        onClick={() => fileInputRef.current?.click()}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                fileInputRef.current?.click()
                            }
                        }}
                        aria-label="Drop an image, paste, or click to upload"
                    >
                        <div className="orbit-drop-content">
                            <div className="orbit-drop-icon">
                                <Upload size={18} />
                            </div>
                            <div className="orbit-drop-text-group">
                                <span className="orbit-drop-main-text">
                                    Drop an image, paste, or click to start
                                </span>
                                <span className="orbit-drop-sub-text">
                                    JPEG, PNG, WebP, SVG, PDF up to 50MB
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Sample Image Link */}
                    <button
                        type="button"
                        className="orbit-sample-btn"
                        onClick={handleSampleClick}
                        aria-label="Try a sample image without uploading"
                    >
                        <span>Try a sample image</span>
                        <ArrowRight size={12} />
                    </button>

                    {/* Suggested Tools Re-Sort Pill */}
                    {suggestedTools.length > 0 && (
                        <div className="orbit-suggested-strip">
                            <span className="orbit-suggested-label">Suggested for your image:</span>
                            <div className="orbit-suggested-actions">
                                {suggestedTools.map((id) => {
                                    const meta = ORBIT_TOOLS.find((t: OrbitToolDefinition) => t.id === id)
                                    return (
                                        <button
                                            key={id}
                                            type="button"
                                            className="orbit-suggested-chip"
                                            onClick={() => onSelectTool(id)}
                                        >
                                            {meta?.title || id}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            ) : null}

            {/* Accessible 2D List / Grid View Fallback (When toggled or on low-power) */}
            {viewMode === 'list' && (
                <div className="orbit-list-view-container">
                    <div className="orbit-list-view-inner">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
                            <div>
                                <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#ffffff', margin: 0 }}>
                                    All 20 Precision Image Tools
                                </h2>
                                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
                                    Full accessible list with instant keyboard navigation.
                                </p>
                            </div>
                            <button
                                type="button"
                                className="orbit-action-pill-btn"
                                onClick={() => setViewMode('3d')}
                            >
                                <Box size={13} />
                                <span>Return to 3D Orbit</span>
                            </button>
                        </div>

                        {/* Grid */}
                        <div className="tools-grid">
                            {filteredTools.map((t) => (
                                <div
                                    key={t.id}
                                    className="tool-card"
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => onSelectTool(t.id)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault()
                                            onSelectTool(t.id)
                                        }
                                    }}
                                >
                                    <div className="tool-card-top">
                                        <div className="tool-card-icon-box">{t.icon}</div>
                                        <div className="tool-card-actions">
                                            {t.isNew && <span className="new-badge">NEW</span>}
                                            <button
                                                type="button"
                                                className={`fav-star-btn ${isFavorite(t.id) ? 'is-favorite' : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    toggleFavorite(t.id)
                                                }}
                                                aria-label={isFavorite(t.id) ? `Remove ${t.title} from favorites` : `Add ${t.title} to favorites`}
                                            >
                                                <Star size={14} fill={isFavorite(t.id) ? 'currentColor' : 'none'} />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="tool-card-title">{t.title}</h3>
                                    <p className="tool-card-desc">{t.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 3D Orbit Tool Hover Card (Inspector on Desktop/Tablet only) */}
            {!isMobile && viewMode === '3d' && <ToolHoverCard onOpenTool={onSelectTool} />}

            {/* Guided 20-Second Tour Overlay (Desktop/Tablet) */}
            {!isMobile && <GuidedTourOverlay onSelectTool={onSelectTool} />}

            {/* Footer */}
            <footer className="orbit-footer">
                <div>© 2026 ImageKit Pro · 100% In-Browser Privacy · MIT License</div>
                <div className="orbit-footer-author">
                    Crafted with precision by <strong>Alok Kushwaha</strong>
                </div>
            </footer>
        </div>
    )
}

export default HomeOrbitView
