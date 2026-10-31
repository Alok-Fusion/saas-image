import type { ReactNode } from 'react'

export interface SegmentedOption<T extends string | number> {
    value: T
    label: string
    icon?: ReactNode
}

interface SegmentedControlProps<T extends string | number> {
    options: SegmentedOption<T>[]
    value: T
    onChange: (value: T) => void
    disabled?: boolean
    className?: string
}

export default function SegmentedControl<T extends string | number>({
    options,
    value,
    onChange,
    disabled = false,
    className = '',
}: SegmentedControlProps<T>) {
    return (
        <div
            className={`segmented-control ${className}`}
            role="radiogroup"
            aria-disabled={disabled}
        >
            {options.map((opt) => {
                const isSelected = opt.value === value
                return (
                    <button
                        key={String(opt.value)}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        disabled={disabled}
                        className={`segmented-option ${isSelected ? 'active' : ''}`}
                        onClick={() => onChange(opt.value)}
                    >
                        {opt.icon}
                        <span>{opt.label}</span>
                    </button>
                )
            })}
        </div>
    )
}

