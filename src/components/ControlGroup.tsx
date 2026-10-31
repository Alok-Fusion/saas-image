import type { ReactNode } from 'react'

interface ControlGroupProps {
    label?: string
    hint?: string
    badge?: ReactNode
    children: ReactNode
    className?: string
}

export default function ControlGroup({
    label,
    hint,
    badge,
    children,
    className = '',
}: ControlGroupProps) {
    return (
        <div className={`control-group ${className}`}>
            {(label || badge) && (
                <div className="control-label">
                    {label && <span>{label}</span>}
                    {badge}
                </div>
            )}
            {children}
            {hint && <span className="control-hint">{hint}</span>}
        </div>
    )
}
