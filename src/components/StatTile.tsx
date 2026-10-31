import type { ReactNode } from 'react'

interface StatTileProps {
    label: string
    value: string | number
    delta?: string
    icon?: ReactNode
    className?: string
}

export default function StatTile({
    label,
    value,
    delta,
    icon,
    className = '',
}: StatTileProps) {
    return (
        <div className={`stat-tile ${className}`}>
            <span className="stat-tile-label">{label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {icon}
                <span className="stat-tile-value">{value}</span>
                {delta && <span className="stat-delta-badge">{delta}</span>}
            </div>
        </div>
    )
}
