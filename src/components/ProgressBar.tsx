import { XCircle } from 'lucide-react'

interface ProgressBarProps {
    progress: number
    stageText?: string
    onCancel?: () => void
    className?: string
}

export default function ProgressBar({
    progress,
    stageText = 'Processing…',
    onCancel,
    className = '',
}: ProgressBarProps) {
    const clamped = Math.max(0, Math.min(100, Math.round(progress)))

    return (
        <div className={`progress-container ${className}`} role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
            <div className="progress-header">
                <span className="progress-stage">{stageText}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="progress-pct tabular-nums">{clamped}%</span>
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="btn btn-ghost btn-sm"
                            style={{ height: 20, padding: '0 4px', fontSize: 11 }}
                            aria-label="Cancel task"
                        >
                            <XCircle size={13} style={{ marginRight: 2 }} />
                            Cancel
                        </button>
                    )}
                </div>
            </div>
            <div className="progress-track">
                <div className="progress-fill" style={{ width: `${clamped}%` }} />
            </div>
        </div>
    )
}

