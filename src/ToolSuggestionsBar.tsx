import { getToolSuggestions } from './utils/toolSuggestions'

interface Props {
    currentTool: string
    onSelectTool: (tool: string) => void
}

export default function ToolSuggestionsBar({ currentTool, onSelectTool }: Props) {
    const suggestions = getToolSuggestions(currentTool)

    if (suggestions.length === 0) return null

    return (
        <div className="suggestions-bar">
            <div className="suggestions-header">
                <span className="suggestions-icon">💡</span>
                <span>You might also like</span>
            </div>
            <div className="suggestions-grid">
                {suggestions.map(s => (
                    <div
                        key={s.id}
                        className="suggestion-card"
                        onClick={() => onSelectTool(s.id)}
                    >
                        <span className="suggestion-emoji">{s.icon}</span>
                        <div className="suggestion-info">
                            <div className="suggestion-title">{s.title}</div>
                            <div className="suggestion-desc">{s.description}</div>
                        </div>
                        <span className="suggestion-arrow">→</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
