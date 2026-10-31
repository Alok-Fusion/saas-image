import type { ReactNode } from 'react'

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

    return (
        <div className={`workspace-shell ${className}`}>
            {header}

            <div className="workspace-body">
                {/* Left Controls Rail (shown when file is loaded and controls exist) */}
                {hasFile && activeControls && (
                    <aside className="workspace-rail" aria-label="Tool controls">
                        {activeControls}
                    </aside>
                )}

                {/* Center Canvas */}
                <main className={`workspace-canvas-wrap ${!hasFile || !activeControls ? 'full-width' : ''}`}>
                    {canvasToolbar && <div className="canvas-float-bar">{canvasToolbar}</div>}
                    <div className="workspace-canvas-viewport">{activeCanvas}</div>

                    {/* Bottom Action Bar */}
                    {hasFile && activeActionBar && (
                        <div className="workspace-actionbar" role="toolbar" aria-label="Action bar">
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
