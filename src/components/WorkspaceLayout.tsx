import { useState, useRef, useEffect, useCallback, type ReactNode, type PointerEvent } from 'react'
import { PanelLeftClose, PanelLeftOpen, ChevronUp, ChevronDown, Sliders } from 'lucide-react'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { useVisualViewport } from '../hooks/useVisualViewport'

export type SheetSnapPoint = 'peek' | 'half' | 'full'

interface WorkspaceLayoutProps {
    header?: ReactNode
    controls?: ReactNode
    leftControls?: ReactNode
    canvas?: ReactNode
    centerCanvas?: ReactNode
    actionBar?: ReactNode
    bottomBar?: ReactNode
    chainingBar?: ReactNode
    canvasToolbar?: ReactNode
    hasFile?: boolean
    className?: string
}

export default function WorkspaceLayout({
    header,
    controls,
    leftControls,
    canvas,
    centerCanvas,
    actionBar,
    bottomBar,
    chainingBar,
    canvasToolbar,
    hasFile = true,
    className = '',
}: WorkspaceLayoutProps) {
    const activeControls = controls ?? leftControls
    const activeCanvas = canvas ?? centerCanvas
    const activeActionBar = actionBar ?? bottomBar

    const { isMobile } = useBreakpoint()
    const { keyboardOffset, isKeyboardOpen } = useVisualViewport()

    // Desktop/Tablet rail collapse state
    const [isRailCollapsed, setIsRailCollapsed] = useState(false)

    // Mobile bottom sheet snap state: 'peek' | 'half' | 'full'
    const [snapPoint, setSnapPoint] = useState<SheetSnapPoint>('peek')

    // Drag tracking for mobile bottom sheet
    const dragStartYRef = useRef<number | null>(null)

    // Auto-adjust snap point when virtual keyboard opens
    useEffect(() => {
        if (!isKeyboardOpen) return
        const timer = requestAnimationFrame(() => {
            setSnapPoint((prev) => (prev === 'peek' ? 'half' : prev))
        })
        return () => cancelAnimationFrame(timer)
    }, [isKeyboardOpen])

    // Keyboard listener (Escape closes full sheet to peek)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isMobile && snapPoint !== 'peek') {
                e.preventDefault()
                setSnapPoint('peek')
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isMobile, snapPoint])

    const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
        dragStartYRef.current = e.clientY
        ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    }

    const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
        if (dragStartYRef.current === null) return
        const deltaY = e.clientY - dragStartYRef.current
        dragStartYRef.current = null

        // Swipe UP (negative delta) moves: peek -> half -> full
        // Swipe DOWN (positive delta) moves: full -> half -> peek
        if (deltaY < -40) {
            setSnapPoint((prev) => (prev === 'peek' ? 'half' : prev === 'half' ? 'full' : prev))
        } else if (deltaY > 40) {
            setSnapPoint((prev) => (prev === 'full' ? 'half' : prev === 'half' ? 'peek' : prev))
        }
    }

    const cycleSnapPoint = useCallback(() => {
        setSnapPoint((prev) => {
            if (prev === 'peek') return 'half'
            if (prev === 'half') return 'full'
            return 'peek'
        })
    }, [])

    return (
        <div className={`workspace-shell ${isMobile ? 'is-mobile-layout' : 'is-desktop-layout'} ${className}`}>
            {/* Top Workspace Header */}
            {header}

            <div className="workspace-body">
                {/* Desktop / Tablet Left Controls Rail */}
                {!isMobile && hasFile && activeControls && (
                    <aside
                        className={`workspace-rail ${isRailCollapsed ? 'is-collapsed' : ''}`}
                        aria-label="Tool controls"
                    >
                        <div className="rail-top-actions">
                            <button
                                type="button"
                                className="rail-collapse-btn"
                                onClick={() => setIsRailCollapsed((c) => !c)}
                                aria-label={isRailCollapsed ? 'Expand controls rail' : 'Collapse controls rail'}
                                title={isRailCollapsed ? 'Expand rail (Ctrl+\\)' : 'Collapse rail (Ctrl+\\)'}
                            >
                                {isRailCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
                                <span className="rail-collapse-text">
                                    {isRailCollapsed ? 'Controls' : 'Hide'}
                                </span>
                            </button>
                        </div>
                        {!isRailCollapsed && <div className="rail-content">{activeControls}</div>}
                    </aside>
                )}

                {/* Center Canvas Viewport */}
                <main
                    className={`workspace-canvas-wrap ${
                        !hasFile || !activeControls || (!isMobile && isRailCollapsed) ? 'full-width' : ''
                    }`}
                >
                    {canvasToolbar && <div className="canvas-float-bar">{canvasToolbar}</div>}

                    {/* Uncollapsed rail toggle button when collapsed on desktop */}
                    {!isMobile && hasFile && activeControls && isRailCollapsed && (
                        <button
                            type="button"
                            className="canvas-rail-toggle-btn"
                            onClick={() => setIsRailCollapsed(false)}
                            aria-label="Open tool controls"
                            title="Open controls"
                        >
                            <PanelLeftOpen size={16} />
                            <span>Controls</span>
                        </button>
                    )}

                    {/* Canvas Area */}
                    <div
                        className={`workspace-canvas-viewport ${isMobile ? `sheet-snap-${snapPoint}` : ''}`}
                    >
                        {activeCanvas}
                    </div>

                    {/* Mobile Bottom Sheet for Controls (< 768px) */}
                    {isMobile && hasFile && activeControls && (
                        <section
                            className={`workspace-mobile-sheet snap-${snapPoint}`}
                            style={{
                                bottom: `calc(var(--actionbar-height, 60px) + ${keyboardOffset}px + var(--safe-bottom))`,
                            }}
                            role="region"
                            aria-label="Tool controls bottom sheet"
                            aria-expanded={snapPoint !== 'peek'}
                        >
                            {/* Drag Handle & Tap Banner */}
                            <div
                                className="sheet-handle-bar"
                                onPointerDown={handlePointerDown}
                                onPointerUp={handlePointerUp}
                                onClick={cycleSnapPoint}
                                role="button"
                                tabIndex={0}
                                aria-label={`Controls panel: ${snapPoint}. Tap to cycle snap size.`}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault()
                                        cycleSnapPoint()
                                    }
                                }}
                            >
                                <div className="sheet-drag-pill" />
                                <div className="sheet-handle-info">
                                    <span className="sheet-handle-title">
                                        <Sliders size={13} />
                                        <span>Settings & Adjustments</span>
                                    </span>
                                    <span className="sheet-handle-indicator">
                                        {snapPoint === 'peek' && (
                                            <>
                                                <span>Expand</span>
                                                <ChevronUp size={14} />
                                            </>
                                        )}
                                        {snapPoint === 'half' && (
                                            <>
                                                <span>Full / Minimize</span>
                                                <ChevronUp size={14} />
                                            </>
                                        )}
                                        {snapPoint === 'full' && (
                                            <>
                                                <span>Close</span>
                                                <ChevronDown size={14} />
                                            </>
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* Sheet Scrollable Body */}
                            <div className="sheet-body-content">
                                {activeControls}
                            </div>
                        </section>
                    )}

                    {/* Bottom Action Bar (Pinned, safe-area aware, above virtual keyboard) */}
                    {hasFile && activeActionBar && (
                        <div
                            className="workspace-actionbar"
                            style={{
                                transform: keyboardOffset > 0 ? `translateY(-${keyboardOffset}px)` : undefined,
                            }}
                            role="toolbar"
                            aria-label="Action bar"
                        >
                            {activeActionBar}
                        </div>
                    )}

                    {/* Chaining Suggestions */}
                    {chainingBar}
                </main>
            </div>
        </div>
    )
}
