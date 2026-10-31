import { FileImage, X } from 'lucide-react'

interface FileChipProps {
    name: string
    sizeText?: string
    thumbnailUrl?: string | null
    onRemove?: () => void
    className?: string
}

export default function FileChip({
    name,
    sizeText,
    thumbnailUrl,
    onRemove,
    className = '',
}: FileChipProps) {
    return (
        <div
            className={`file-item-card ${className}`}
            style={{
                display: 'inline-flex',
                flexDirection: 'row',
                alignItems: 'center',
                padding: '6px 10px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-bg-subtle)',
                border: '1px solid var(--color-border-default)',
                gap: 8,
                maxWidth: 280,
            }}
        >
            {thumbnailUrl ? (
                <img
                    src={thumbnailUrl}
                    alt=""
                    style={{
                        width: 28,
                        height: 28,
                        borderRadius: 'var(--radius-xs)',
                        objectFit: 'cover',
                        flexShrink: 0,
                    }}
                />
            ) : (
                <div
                    style={{
                        width: 28,
                        height: 28,
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: 'var(--color-accent-subtle)',
                        color: 'var(--color-accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <FileImage size={15} />
                </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                <span
                    style={{
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--color-text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {name}
                </span>
                {sizeText && (
                    <span
                        className="tabular-nums"
                        style={{
                            fontSize: 11,
                            color: 'var(--color-text-muted)',
                        }}
                    >
                        {sizeText}
                    </span>
                )}
            </div>
            {onRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    aria-label={`Remove ${name}`}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-text-muted)',
                        padding: 2,
                        borderRadius: 'var(--radius-xs)',
                    }}
                >
                    <X size={14} />
                </button>
            )}
        </div>
    )
}
