interface ToggleProps {
    label: string
    description?: string
    checked: boolean
    onChange: (checked: boolean) => void
    disabled?: boolean
    className?: string
}

export default function Toggle({
    label,
    description,
    checked,
    onChange,
    disabled = false,
    className = '',
}: ToggleProps) {
    return (
        <div
            className={`toggle-row ${className}`}
            onClick={() => !disabled && onChange(!checked)}
            role="switch"
            aria-checked={checked}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : 0}
            onKeyDown={(e) => {
                if (disabled) return
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault()
                    onChange(!checked)
                }
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>
                    {label}
                </span>
                {description && (
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                        {description}
                    </span>
                )}
            </div>
            <div className={`toggle-switch ${checked ? 'is-on' : ''}`}>
                <div className="toggle-knob" />
            </div>
        </div>
    )
}
