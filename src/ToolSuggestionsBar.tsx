import { ArrowRight, Sparkles } from 'lucide-react'
import { getToolSuggestions } from './utils/toolSuggestions'

interface Props {
    currentTool: string
    onSelectTool: (tool: string) => void
    hasActiveImage?: boolean
}

export default function ToolSuggestionsBar({
    currentTool,
    onSelectTool,
    hasActiveImage = false,
}: Props) {
    const suggestions = getToolSuggestions(currentTool)

    if (suggestions.length === 0) return null

    return (
        <div className="chaining-bar" role="region" aria-label="Tool chaining suggestions">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-muted)' }}>
                <Sparkles size={13} style={{ color: 'var(--color-accent)' }} />
                {hasActiveImage ? 'Open this image in:' : 'Next tool:'}
            </span>

            {suggestions.map((s) => (
                <button
                    key={s.id}
                    type="button"
                    className="chain-chip"
                    onClick={() => onSelectTool(s.id)}
                    title={s.description}
                >
                    <span>{s.title}</span>
                    <ArrowRight size={11} style={{ opacity: 0.6 }} />
                </button>
            ))}
        </div>
    )
}
