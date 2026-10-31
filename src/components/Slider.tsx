import type { ChangeEvent } from 'react'

interface SliderProps {
    label?: string
    value: number
    min?: number
    max?: number
    step?: number
    unit?: string
    onChange: (value: number) => void
    disabled?: boolean
    ariaLabel?: string
    className?: string
}

export default function Slider({
    label,
    value,
    min = 0,
    max = 100,
    step = 1,
    unit = '',
    onChange,
    disabled = false,
    ariaLabel,
    className = '',
}: SliderProps) {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        onChange(Number(e.target.value))
    }

    return (
        <div className={`slider-container ${className}`}>
            {(label || unit) && (
                <div className="slider-header">
                    {label && <span className="slider-label">{label}</span>}
                    <span className="slider-value-badge" style={{ marginLeft: label ? 'auto' : undefined }}>
                        {value}
                        {unit}
                    </span>
                </div>
            )}
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                disabled={disabled}
                aria-label={ariaLabel || label || 'Value'}
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={value}
                onChange={handleChange}
            />
        </div>
    )
}
