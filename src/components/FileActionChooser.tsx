import {
    Crop,
    Eraser,
    FileText,
    Maximize2,
    Minimize2,
    Palette,
    ScanText,
    ShieldCheck,
    X,
} from 'lucide-react'

interface FileActionChooserProps {
    file: File | null
    onSelectTool: (toolId: string) => void
    onClose: () => void
}

const COMMON_ACTIONS = [
    { id: 'compressor', title: 'Compress Image', desc: 'Reduce file size while preserving quality', icon: <Minimize2 size={18} /> },
    { id: 'background-remover', title: 'Remove Background', desc: 'Isolate subject with client-side AI', icon: <Eraser size={18} /> },
    { id: 'cropper', title: 'Crop Image', desc: 'Crop to exact dimensions or aspect ratios', icon: <Crop size={18} /> },
    { id: 'resizer', title: 'Social Media Resizer', desc: 'Resize for Instagram, YouTube, LinkedIn, X', icon: <Maximize2 size={18} /> },
    { id: 'image-to-pdf', title: 'Convert to PDF', desc: 'Turn this image into a formatted PDF page', icon: <FileText size={18} /> },
    { id: 'exif-cleaner', title: 'Clean EXIF Metadata', desc: 'Strip GPS and camera info for privacy', icon: <ShieldCheck size={18} /> },
    { id: 'ocr', title: 'Extract Text (OCR)', desc: 'Scan and extract editable text in 12 languages', icon: <ScanText size={18} /> },
    { id: 'color-palette', title: 'Extract Palette', desc: 'Get HEX/RGB swatches and CSS gradients', icon: <Palette size={18} /> },
]

export default function FileActionChooser({
    file,
    onSelectTool,
    onClose,
}: FileActionChooserProps) {
    if (!file) return null

    return (
        <div className="cmd-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Choose action for file">
            <div className="cmd-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
                <div className="cmd-input-wrap" style={{ justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                            What do you want to do with this image?
                        </div>
                        <div className="tabular-nums" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>
                            {file.name} · {(file.size / 1024).toFixed(1)} KB
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: 4 }}
                        aria-label="Close dialog"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="cmd-list" style={{ padding: 'var(--spacing-3)' }}>
                    {COMMON_ACTIONS.map((action) => (
                        <button
                            key={action.id}
                            type="button"
                            className="cmd-item"
                            onClick={() => {
                                onSelectTool(action.id)
                                onClose()
                            }}
                        >
                            <div className="cmd-item-icon">{action.icon}</div>
                            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                                <div className="cmd-item-name">{action.title}</div>
                                <div className="cmd-item-desc">{action.desc}</div>
                            </div>
                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>→</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

