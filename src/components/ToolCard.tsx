import React, { type ReactNode } from 'react'
import { Star } from 'lucide-react'

export interface ToolCardProps {
    icon: ReactNode
    title: string
    description: string
    isNew?: boolean
    onClick: () => void
    onPrefetch?: () => void
    isFavorite?: boolean
    onToggleFavorite?: (e: React.MouseEvent) => void
}

export const ToolCard: React.FC<ToolCardProps> = ({
    icon,
    title,
    description,
    isNew,
    onClick,
    onPrefetch,
    isFavorite,
    onToggleFavorite,
}) => {
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
            <div className="tool-card-top">
                <div className="tool-card-icon-box">{icon}</div>
                <div className="tool-card-actions">
                    {isNew && <span className="new-badge">NEW</span>}
                    {onToggleFavorite && (
                        <button
                            type="button"
                            className={`fav-star-btn ${isFavorite ? 'is-favorite' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation()
                                onToggleFavorite(e)
                            }}
                            aria-label={isFavorite ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
                            aria-pressed={isFavorite}
                        >
                            <Star size={15} fill={isFavorite ? 'currentColor' : 'none'} />
                        </button>
                    )}
                </div>
            </div>
            <h3 className="tool-card-title">{title}</h3>
            <p className="tool-card-desc">{description}</p>
        </div>
    )
}

export default ToolCard
