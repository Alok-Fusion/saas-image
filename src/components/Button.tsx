import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    icon?: ReactNode
    isLoading?: boolean
}

export default function Button({
    children,
    variant = 'secondary',
    size = 'md',
    icon,
    isLoading = false,
    disabled,
    className = '',
    ...rest
}: ButtonProps) {
    const isBusy = disabled || isLoading

    return (
        <button
            {...rest}
            disabled={isBusy}
            aria-disabled={isBusy}
            className={`btn btn-${variant} btn-${size} ${className}`}
        >
            {isLoading ? (
                <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin" />
            ) : (
                icon
            )}
            {children && <span>{children}</span>}
        </button>
    )
}
