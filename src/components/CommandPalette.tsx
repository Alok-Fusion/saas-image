import { Search, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

export interface CommandItem {
    id: string
    title: string
    description: string
    category: string
    icon: ReactNode
}

interface CommandPaletteProps {
    isOpen: boolean
    onClose: () => void
    items: CommandItem[]
    onSelect: (id: string) => void
}

export default function CommandPalette({
    isOpen,
    onClose,
    items,
    onSelect,
}: CommandPaletteProps) {
    const [query, setQuery] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => inputRef.current?.focus(), 20)
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    const filtered = items.filter(
        item =>
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.description.toLowerCase().includes(query.toLowerCase()) ||
            item.category.toLowerCase().includes(query.toLowerCase())
    )

    const activeIndex = Math.min(selectedIndex, Math.max(0, filtered.length - 1))

    const handleClose = () => {
        setQuery('')
        setSelectedIndex(0)
        onClose()
    }

    const handleSelect = (id: string) => {
        setQuery('')
        setSelectedIndex(0)
        onSelect(id)
        onClose()
    }

    useEffect(() => {
        if (!isOpen) return
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault()
                handleClose()
            } else if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelectedIndex(i => (i + 1 < filtered.length ? i + 1 : 0))
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelectedIndex(i => (i - 1 >= 0 ? i - 1 : filtered.length - 1))
            } else if (e.key === 'Enter') {
                e.preventDefault()
                if (filtered[activeIndex]) {
                    handleSelect(filtered[activeIndex].id)
                }
            }
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [filtered, isOpen, activeIndex]) // eslint-disable-line react-hooks/exhaustive-deps

    if (!isOpen) return null

    return (
        <div className="cmd-backdrop" onClick={handleClose} role="dialog" aria-modal="true" aria-label="Command palette">
            <div className="cmd-modal" onClick={e => e.stopPropagation()}>
                <div className="cmd-input-wrap">
                    <Search size={18} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                    <input
                        ref={inputRef}
                        type="text"
                        className="cmd-input"
                        placeholder="Search image tools by name or purpose…"
                        value={query}
                        onChange={e => {
                            setQuery(e.target.value)
                            setSelectedIndex(0)
                        }}
                    />
                    <button
                        type="button"
                        onClick={handleClose}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: 4 }}
                        aria-label="Close command palette"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="cmd-list" role="listbox">
                    {filtered.length === 0 ? (
                        <div style={{ padding: 'var(--spacing-6)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                            No tools match &ldquo;{query}&rdquo;
                        </div>
                    ) : (
                        filtered.map((item, idx) => {
                            const isSelected = idx === activeIndex
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    role="option"
                                    aria-selected={isSelected}
                                    className={`cmd-item ${isSelected ? 'selected' : ''}`}
                                    onClick={() => handleSelect(item.id)}
                                    onMouseEnter={() => setSelectedIndex(idx)}
                                >
                                    <div className="cmd-item-icon">{item.icon}</div>
                                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                                        <div className="cmd-item-name">{item.title}</div>
                                        <div className="cmd-item-desc">{item.description}</div>
                                    </div>
                                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                                        {item.category}
                                    </span>
                                </button>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}
