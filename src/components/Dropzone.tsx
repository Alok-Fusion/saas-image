import { UploadCloud, Camera } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { IMAGE_ACCEPT_ATTRIBUTE, validateFiles } from '../utils/fileIntake'
import { useToast } from './Toast'

interface DropzoneProps {
    onFiles: (files: File[]) => void
    kind?: 'image' | 'pdf'
    accept?: string | Record<string, string[]>
    multiple?: boolean
    icon?: ReactNode
    title?: string
    hint?: string
    disabled?: boolean
    enablePaste?: boolean
    enableCamera?: boolean
    onTrySample?: () => void
    children?: ReactNode
    className?: string
}

export default function Dropzone({
    onFiles,
    kind = 'image',
    accept,
    multiple = false,
    icon,
    title = 'Drop an image, click to browse, or paste from clipboard',
    hint,
    disabled = false,
    enablePaste = true,
    enableCamera = true,
    onTrySample,
    children,
    className = '',
}: DropzoneProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [isChecking, setIsChecking] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const cameraInputRef = useRef<HTMLInputElement>(null)
    const { error } = useToast()

    const handleFiles = useCallback(
        async (incoming: FileList | File[] | null) => {
            if (!incoming || disabled) return
            const list = Array.from(incoming)
            if (list.length === 0) return

            setIsChecking(true)
            try {
                const { valid, errors } = await validateFiles(list, kind)
                errors.forEach((message) => error(message))
                if (valid.length > 0) onFiles(multiple ? valid : [valid[0]])
            } finally {
                setIsChecking(false)
            }
        },
        [disabled, error, kind, multiple, onFiles]
    )

    useEffect(() => {
        if (!enablePaste) return
        const onPaste = (event: ClipboardEvent) => {
            if (disabled) return
            const files = event.clipboardData?.files
            if (files && files.length > 0) {
                event.preventDefault()
                void handleFiles(files)
            }
        }
        window.addEventListener('paste', onPaste)
        return () => window.removeEventListener('paste', onPaste)
    }, [disabled, enablePaste, handleFiles])

    const busy = disabled || isChecking
    const computedAccept = typeof accept === 'string'
        ? accept
        : accept
        ? Object.entries(accept).flatMap(([mime, exts]) => [mime, ...exts]).join(',')
        : kind === 'pdf'
        ? 'application/pdf,.pdf'
        : IMAGE_ACCEPT_ATTRIBUTE

    return (
        <div
            className={`dropzone ${isDragging ? 'dragging' : ''} ${busy ? 'is-busy' : ''} ${className}`}
            role="button"
            tabIndex={busy ? -1 : 0}
            aria-disabled={busy}
            aria-busy={isChecking}
            aria-label={title}
            onClick={() => !busy && inputRef.current?.click()}
            onKeyDown={(event) => {
                if (busy) return
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    inputRef.current?.click()
                }
            }}
            onDragOver={(event) => {
                event.preventDefault()
                if (!busy) setIsDragging(true)
            }}
            onDragLeave={(event) => {
                event.preventDefault()
                setIsDragging(false)
            }}
            onDrop={(event) => {
                event.preventDefault()
                setIsDragging(false)
                void handleFiles(event.dataTransfer.files)
            }}
        >
            <div className="dropzone-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="dropzone-icon-box" aria-hidden="true">
                    {icon || <UploadCloud size={24} />}
                </div>
                <p className="dropzone-text">{isChecking ? 'Checking file…' : title}</p>
                {hint && <p className="dropzone-hint">{hint}</p>}

                <div className="dropzone-actions-row" style={{ display: 'flex', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-3)', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {enableCamera && kind === 'image' && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                cameraInputRef.current?.click()
                            }}
                            className="btn btn-secondary btn-sm"
                            aria-label="Take photo with camera"
                        >
                            <Camera size={14} />
                            <span>Take Photo</span>
                        </button>
                    )}

                    {onTrySample && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                onTrySample()
                            }}
                            className="btn btn-secondary btn-sm"
                        >
                            Try sample image
                        </button>
                    )}
                </div>

                {children}
            </div>
            <input
                ref={inputRef}
                type="file"
                accept={computedAccept}
                multiple={multiple}
                onChange={(event) => {
                    void handleFiles(event.target.files)
                    event.target.value = ''
                }}
                style={{ display: 'none' }}
            />
            {enableCamera && kind === 'image' && (
                <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(event) => {
                        void handleFiles(event.target.files)
                        event.target.value = ''
                    }}
                    style={{ display: 'none' }}
                />
            )}
        </div>
    )
}
