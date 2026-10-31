import type { ChangeEvent } from 'react'

interface SliderProps {
    label: string
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
            <div className="slider-header">
                <span className="slider-label">{label}</span>
                <span className="slider-value-badge">
                    {value}
                    {unit}
                </span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                disabled={disabled}
                aria-label={ariaLabel || label}
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={value}
                onChange={handleChange}
            />
        </div>
    )
}
