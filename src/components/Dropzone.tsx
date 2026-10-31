import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { IMAGE_ACCEPT_ATTRIBUTE, validateFiles } from '../utils/fileIntake'
import { useToast } from './Toast'

interface DropzoneProps {
    onFiles: (files: File[]) => void
    kind?: 'image' | 'pdf'
    multiple?: boolean
    icon?: string
    title: string
    hint?: string
    disabled?: boolean
    enablePaste?: boolean
    children?: ReactNode
}

export default function Dropzone({
    onFiles,
    kind = 'image',
    multiple = false,
    icon = '🖼️',
    title,
    hint,
    disabled = false,
    enablePaste = true,
    children,
}: DropzoneProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [isChecking, setIsChecking] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
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

    return (
        <div
            className={`dropzone ${isDragging ? 'dragging' : ''} ${busy ? 'is-busy' : ''}`}
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
            <div className="dropzone-content">
                <div className="dropzone-icon" aria-hidden="true">{icon}</div>
                <p className="dropzone-text">{isChecking ? 'Checking file…' : title}</p>
                {hint && <p className="dropzone-hint">{hint}</p>}
                {children}
            </div>
            <input
                ref={inputRef}
                type="file"
                accept={kind === 'pdf' ? 'application/pdf,.pdf' : IMAGE_ACCEPT_ATTRIBUTE}
                multiple={multiple}
                onChange={(event) => {
                    void handleFiles(event.target.files)
                    event.target.value = ''
                }}
                style={{ display: 'none' }}
            />
        </div>
    )
}
