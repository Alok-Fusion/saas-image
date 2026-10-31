import { FileImage, X } from 'lucide-react'
import { formatFileSize } from '../utils/imageProcessing'

interface FileChipProps {
    name: string
    sizeText?: string
    sizeBytes?: number
    width?: number
    height?: number
    thumbnailUrl?: string | null
    onRemove?: () => void
    className?: string
}

export default function FileChip({
    name,
    sizeText,
    sizeBytes,
    width,
    height,
    thumbnailUrl,
    onRemove,
    className = '',
}: FileChipProps) {
    let metaText = sizeText
    if (!metaText && sizeBytes !== undefined) {
        metaText = formatFileSize(sizeBytes)
    }
    if (width && height) {
        metaText = metaText ? `${width}×${height} · ${metaText}` : `${width}×${height}`
    }

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
                {metaText && (
                    <span
                        className="tabular-nums"
                        style={{
                            fontSize: 11,
                            color: 'var(--color-text-muted)',
                        }}
                    >
                        {metaText}
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
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                    }}
                >
                    <X size={14} />
                </button>
            )}
        </div>
    )
}
