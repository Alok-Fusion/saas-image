import React from 'react'
import { useScene } from '../scene/sceneContext'
import { ORBIT_TOOLS } from '../../constants/orbitTools'
import { ArrowUpRight } from 'lucide-react'

export const ToolHoverCard: React.FC<{ onOpenTool: (id: string) => void }> = ({ onOpenTool }) => {
    const { hoveredToolId } = useScene()

    if (!hoveredToolId) return null

    const tool = ORBIT_TOOLS.find((t) => t.id === hoveredToolId)
    if (!tool) return null

    return (
        <div
            className="tool-hover-card-root"
            role="dialog"
            aria-label={`${tool.title} preview`}
            onClick={() => onOpenTool(tool.id)}
        >
            <div className="hover-card-header">
                <div className="hover-card-title-group">
                    <span
                        className="hover-card-badge"
                        style={{
                            backgroundColor: `${tool.color}22`,
                            color: tool.color,
                            borderColor: `${tool.color}55`,
                        }}
                    >
                        {tool.categoryLabel}
                    </span>
                    <h3 className="hover-card-title">{tool.title}</h3>
                </div>
                <button
                    type="button"
                    className="hover-card-open-btn"
                    style={{ backgroundColor: tool.color }}
                    aria-label={`Open ${tool.title}`}
                >
                    <ArrowUpRight size={14} />
                </button>
            </div>

            {/* Mini Live Preview Canvas / Animation */}
            <div className="hover-card-preview-stage">
                {renderMiniPreview(tool.id, tool.color)}
            </div>

            <div className="hover-card-footer">
                <p className="hover-card-desc">{getToolDescription(tool.id)}</p>
                <div className="hover-card-action-hint">
                    <span>Click node or card to launch</span>
                    <kbd className="hover-card-kbd">↵ Enter</kbd>
                </div>
            </div>
        </div>
    )
}

function getToolDescription(id: string): string {
    switch (id) {
        case 'compressor':
            return 'Compress JPEG, PNG & WebP by up to 90% without visible quality loss.'
        case 'resizer':
            return 'Batch resize images to exact aspect ratios for Instagram, YouTube, and LinkedIn.'
        case 'background-remover':
            return 'AI-powered background cutout directly in browser memory. 100% private.'
        case 'cropper':
            return 'Pixel-perfect cropping with golden ratio and standard social aspect presets.'
        case 'rotator':
            return 'Lossless rotation and horizontal/vertical flipping in milliseconds.'
        case 'watermark':
            return 'Apply customizable text or stamp watermarks with opacity and angle controls.'
        case 'watermark-remover':
            return 'Intelligent multi-pass inpainting to erase stamps, logos and unwanted artifacts.'
        case 'image-to-pdf':
            return 'Combine multiple high-res images into a unified, lightweight PDF document.'
        case 'pdf-to-image':
            return 'Render multi-page PDF files into crisp individual PNG images locally.'
        case 'exif-cleaner':
            return 'Purge GPS coordinates, camera serials, and privacy-leaking EXIF metadata.'
        case 'duplicate-finder':
            return 'Perceptual hashing algorithm to detect duplicate and near-identical photos.'
        case 'ocr':
            return 'Extract readable text, numbers, and tables from images across 12 languages.'
        case 'device-mockup':
            return 'Present designs inside gorgeous iPhone, iPad, and MacBook hardware frames.'
        case 'color-palette':
            return 'Extract vibrant dominant palettes with copyable HEX, RGB and CSS gradients.'
        case 'ascii-art':
            return 'Transform any image into stylized ASCII monospace text art with color options.'
        case 'thumbnail':
            return 'Design click-worthy YouTube and blog thumbnails with typography and badges.'
        case 'instagram-grid':
            return 'Slice large panoramas into 3x3, 3x2, or 3x1 seamless carousel puzzle grids.'
        case 'favicon':
            return 'Generate full multi-resolution favicon bundle + manifest.json + HTML tags.'
        case 'color-blindness':
            return 'Simulate protanopia, deuteranopia, and tritanopia to verify accessible contrast.'
        case 'image-comparison':
            return 'Interactive side-by-side split comparison slider for before and after reviews.'
        default:
            return 'High-precision client-side image utility.'
    }
}

function renderMiniPreview(id: string, color: string): React.ReactNode {
    switch (id) {
        case 'compressor':
            return (
                <div className="mini-preview-compress">
                    <div className="compress-box-anim" style={{ borderColor: color }} />
                    <div className="compress-stats">
                        <span className="stat-before">2.4 MB</span>
                        <span className="stat-arrow">→</span>
                        <span className="stat-after" style={{ color }}>380 KB (-84%)</span>
                    </div>
                </div>
            )
        case 'background-remover':
            return (
                <div className="mini-preview-cutout">
                    <div className="cutout-checkerboard" />
                    <div className="cutout-floating-subject" style={{ borderColor: color }}>
                        <div className="cutout-person-silhouette" />
                    </div>
                    <span className="cutout-badge" style={{ color }}>Subject Isolated</span>
                </div>
            )
        case 'cropper':
            return (
                <div className="mini-preview-crop">
                    <div className="crop-photo-bg" />
                    <div className="crop-brackets-anim" style={{ borderColor: color }}>
                        <div className="crop-rule-of-thirds" />
                    </div>
                </div>
            )
        case 'ocr':
            return (
                <div className="mini-preview-ocr">
                    <div className="ocr-text-lines">
                        <div className="ocr-line" />
                        <div className="ocr-line" />
                        <div className="ocr-line" />
                    </div>
                    <div className="ocr-laser-beam" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }} />
                </div>
            )
        case 'color-palette':
            return (
                <div className="mini-preview-palette">
                    <div className="palette-chip" style={{ backgroundColor: '#6366f1' }} />
                    <div className="palette-chip" style={{ backgroundColor: '#38bdf8' }} />
                    <div className="palette-chip" style={{ backgroundColor: '#d4ff3a' }} />
                    <div className="palette-chip" style={{ backgroundColor: '#f43f5e' }} />
                    <div className="palette-chip" style={{ backgroundColor: '#a855f7' }} />
                </div>
            )
        case 'image-comparison':
            return (
                <div className="mini-preview-compare">
                    <div className="compare-side-left">ORIGINAL</div>
                    <div className="compare-divider-bar" style={{ backgroundColor: color }} />
                    <div className="compare-side-right" style={{ color }}>OPTIMIZED</div>
                </div>
            )
        default:
            return (
                <div className="mini-preview-generic">
                    <div className="generic-pulse-dot" style={{ backgroundColor: color }} />
                    <span className="generic-tool-active">Precision Algorithm Ready</span>
                </div>
            )
    }
}

export default ToolHoverCard
