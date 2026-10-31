import type { ReactNode } from 'react'

interface WorkspaceLayoutProps {
    header: ReactNode
    controls: ReactNode
    canvas: ReactNode
    actionBar?: ReactNode
    chainingBar?: ReactNode
    canvasToolbar?: ReactNode
    className?: string
}

export default function WorkspaceLayout({
    header,
    controls,
    canvas,
    actionBar,
    chainingBar,
    canvasToolbar,
    className = '',
}: WorkspaceLayoutProps) {
    return (
        <div className={`workspace-shell ${className}`}>
            {header}

            <div className="workspace-body">
                {/* Left Controls Rail */}
                <aside className="workspace-rail" aria-label="Tool controls">
                    {controls}
                </aside>

                {/* Center Canvas */}
                <main className="workspace-canvas-wrap">
                    {canvasToolbar && <div className="canvas-float-bar">{canvasToolbar}</div>}
                    <div className="workspace-canvas-viewport">
                        {canvas}
                    </div>

                    {/* Bottom Action Bar */}
                    {actionBar && (
                        <div className="workspace-actionbar" role="toolbar" aria-label="Action bar">
                            {actionBar}
                        </div>
                    )}

                    {/* Chaining Suggestions */}
                    {chainingBar}
                </main>
            </div>
        </div>
    )
}
