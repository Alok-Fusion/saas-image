import { ArrowLeft, ChevronDown, RotateCcw } from 'lucide-react'
import { useState, type ReactNode } from 'react'

interface ToolItem {
    id: string
    title: string
}

interface ToolHeaderProps {
    title: string
    icon: ReactNode
    onBack: () => void
    onReset?: () => void
    tools?: ToolItem[]
    currentToolId?: string
    onSelectTool?: (toolId: string) => void
    extraActions?: ReactNode
}

export default function ToolHeader({
    title,
    icon,
    onBack,
    onReset,
    tools,
    currentToolId,
    onSelectTool,
    extraActions,
}: ToolHeaderProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false)

    return (
        <header className="workspace-topbar">
            <div className="workspace-topbar-left">
                <button
                    type="button"
                    className="workspace-back-btn"
                    onClick={onBack}
                    aria-label="Back to tools"
                >
                    <ArrowLeft size={16} />
                    <span>Tools</span>
                </button>

                <div className="workspace-divider" />

                <div className="workspace-title-wrap">
                    <div className="workspace-tool-icon">{icon}</div>
                    <span className="workspace-tool-title">{title}</span>

                    {tools && tools.length > 0 && onSelectTool && (
                        <div style={{ position: 'relative' }}>
                            <button
                                type="button"
                                className="workspace-tool-switcher"
                                onClick={() => setDropdownOpen(o => !o)}
                                aria-label="Switch tool"
                                aria-expanded={dropdownOpen}
                            >
                                <ChevronDown size={14} />
                            </button>

                            {dropdownOpen && (
                                <>
                                    <div
                                        style={{ position: 'fixed', inset: 0, zIndex: 150 }}
                                        onClick={() => setDropdownOpen(false)}
                                    />
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            marginTop: 6,
                                            width: 220,
                                            maxHeight: 300,
                                            overflowY: 'auto',
                                            backgroundColor: 'var(--color-bg-surface-elevated)',
                                            border: '1px solid var(--color-border-default)',
                                            borderRadius: 'var(--radius-md)',
                                            boxShadow: 'var(--shadow-md)',
                                            padding: 4,
                                            zIndex: 200,
                                        }}
                                    >
                                        {tools.map(t => (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => {
                                                    setDropdownOpen(false)
                                                    onSelectTool(t.id)
                                                }}
                                                style={{
                                                    display: 'block',
                                                    width: '100%',
                                                    padding: '6px 10px',
                                                    textAlign: 'left',
                                                    fontSize: 'var(--font-size-xs)',
                                                    borderRadius: 'var(--radius-xs)',
                                                    color: t.id === currentToolId ? 'var(--color-accent)' : 'var(--color-text-primary)',
                                                    backgroundColor: t.id === currentToolId ? 'var(--color-accent-subtle)' : 'transparent',
                                                    fontWeight: t.id === currentToolId ? 'var(--font-weight-semibold)' : 'normal',
                                                }}
                                            >
                                                {t.title}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="workspace-topbar-right">
                {extraActions}
                {onReset && (
                    <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={onReset}
                        title="Reset tool"
                        aria-label="Reset tool"
                    >
                        <RotateCcw size={14} />
                        <span>Reset</span>
                    </button>
                )}
            </div>
        </header>
    )
}
