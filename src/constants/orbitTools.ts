export interface OrbitToolDefinition {
    id: string
    title: string
    shortName: string
    category: 'core' | 'edit' | 'pdf' | 'privacy' | 'design' | 'social' | 'accessibility'
    categoryLabel: string
    color: string
    ring: 1 | 2 | 3
}

export const ORBIT_TOOLS: OrbitToolDefinition[] = [
    // Ring 1 (Inner, Radius 3.25, 4 tools)
    { id: 'compressor', title: 'Image Compressor', shortName: 'Compress', category: 'core', categoryLabel: 'Essential', color: '#6366f1', ring: 1 },
    { id: 'resizer', title: 'Social Resizer', shortName: 'Resize', category: 'core', categoryLabel: 'Essential', color: '#6366f1', ring: 1 },
    { id: 'background-remover', title: 'Background Remover', shortName: 'BG Cutout', category: 'core', categoryLabel: 'Essential', color: '#6366f1', ring: 1 },
    { id: 'image-comparison', title: 'Comparison Slider', shortName: 'Compare', category: 'accessibility', categoryLabel: 'Essential', color: '#06b6d4', ring: 1 },

    // Ring 2 (Middle, Radius 4.85, 6 tools)
    { id: 'cropper', title: 'Image Cropper', shortName: 'Crop', category: 'edit', categoryLabel: 'Edit', color: '#38bdf8', ring: 2 },
    { id: 'rotator', title: 'Image Rotator', shortName: 'Rotate', category: 'edit', categoryLabel: 'Edit', color: '#38bdf8', ring: 2 },
    { id: 'watermark', title: 'Watermark Adder', shortName: 'Watermark', category: 'edit', categoryLabel: 'Edit', color: '#38bdf8', ring: 2 },
    { id: 'watermark-remover', title: 'Watermark Remover', shortName: 'Inpaint', category: 'edit', categoryLabel: 'Edit', color: '#38bdf8', ring: 2 },
    { id: 'image-to-pdf', title: 'Image to PDF', shortName: 'Img to PDF', category: 'pdf', categoryLabel: 'PDF', color: '#e11d48', ring: 2 },
    { id: 'pdf-to-image', title: 'PDF to Image', shortName: 'PDF to Img', category: 'pdf', categoryLabel: 'PDF', color: '#e11d48', ring: 2 },

    // Ring 3 (Outer, Radius 6.45, 10 tools)
    { id: 'exif-cleaner', title: 'EXIF Privacy Cleaner', shortName: 'EXIF Clean', category: 'privacy', categoryLabel: 'Privacy', color: '#10b981', ring: 3 },
    { id: 'duplicate-finder', title: 'Duplicate Finder', shortName: 'Duplicates', category: 'privacy', categoryLabel: 'Privacy', color: '#10b981', ring: 3 },
    { id: 'ocr', title: 'OCR Text Extractor', shortName: 'OCR Text', category: 'privacy', categoryLabel: 'Privacy', color: '#10b981', ring: 3 },
    { id: 'device-mockup', title: 'Device Mockup', shortName: 'Mockup', category: 'design', categoryLabel: 'Design', color: '#a855f7', ring: 3 },
    { id: 'color-palette', title: 'Color Palette', shortName: 'Palette', category: 'design', categoryLabel: 'Design', color: '#a855f7', ring: 3 },
    { id: 'ascii-art', title: 'ASCII Art Generator', shortName: 'ASCII Art', category: 'design', categoryLabel: 'Design', color: '#a855f7', ring: 3 },
    { id: 'thumbnail', title: 'Thumbnail Maker', shortName: 'Thumbnail', category: 'design', categoryLabel: 'Design', color: '#a855f7', ring: 3 },
    { id: 'instagram-grid', title: 'Instagram Grid', shortName: 'Grid Split', category: 'social', categoryLabel: 'Social', color: '#f59e0b', ring: 3 },
    { id: 'favicon', title: 'Favicon Generator', shortName: 'Favicon', category: 'social', categoryLabel: 'Social', color: '#f59e0b', ring: 3 },
    { id: 'color-blindness', title: 'Color Blindness', shortName: 'A11y Sim', category: 'accessibility', categoryLabel: 'A11y', color: '#06b6d4', ring: 3 },
]

export const RING_RADII = {
    1: 3.25,
    2: 4.85,
    3: 6.45,
}

