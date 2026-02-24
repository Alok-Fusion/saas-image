export interface ToolSuggestion {
    id: string
    icon: string
    title: string
    description: string
}

const TOOL_META: Record<string, { icon: string; title: string; description: string }> = {
    'compressor': { icon: '📦', title: 'Image Compressor', description: 'Reduce file size while maintaining quality.' },
    'resizer': { icon: '📱', title: 'Social Media Resizer', description: 'Resize for Instagram, YouTube, LinkedIn & more.' },
    'background-remover': { icon: '🎭', title: 'Background Remover', description: 'AI-powered background removal.' },
    'exif-cleaner': { icon: '🔐', title: 'EXIF Privacy Cleaner', description: 'Remove GPS, camera info & metadata.' },
    'color-palette': { icon: '🎨', title: 'Color Palette Extractor', description: 'Extract colors with HEX/RGB & CSS gradients.' },
    'instagram-grid': { icon: '📸', title: 'Instagram Grid Splitter', description: 'Split into grids for carousel.' },
    'favicon': { icon: '🖼️', title: 'Favicon Generator', description: 'All sizes + manifest.json + HTML snippet.' },
    'ocr': { icon: '📝', title: 'OCR Text Extractor', description: 'Extract text from images.' },
    'device-mockup': { icon: '📱', title: 'Device Mockup Generator', description: 'iPhone, MacBook, iPad frames.' },
    'color-blindness': { icon: '👁️', title: 'Color Blindness Simulator', description: 'See how designs appear to color blind users.' },
    'ascii-art': { icon: '🖌️', title: 'ASCII Art Generator', description: 'Convert images to ASCII text art.' },
    'image-comparison': { icon: '↔️', title: 'Image Comparison Slider', description: 'Before/after comparison with slider.' },
    'duplicate-finder': { icon: '🔍', title: 'Duplicate Finder', description: 'Find similar images using perceptual hashing.' },
    'image-to-pdf': { icon: '📄', title: 'Image to PDF', description: 'Convert multiple images into a single PDF.' },
    'pdf-to-image': { icon: '📑', title: 'PDF to Image', description: 'Convert PDF pages to PNG images.' },
    'cropper': { icon: '✂️', title: 'Image Cropper', description: 'Crop with preset aspect ratios.' },
    'rotator': { icon: '🔄', title: 'Image Rotator', description: 'Rotate 90°/180° and flip.' },
    'watermark': { icon: '©', title: 'Watermark Adder', description: 'Add text watermarks with custom position & style.' },
    'watermark-remover': { icon: '🧹', title: 'Watermark Remover', description: 'Remove watermarks using inpaint, blur, or pixelate.' },
    'thumbnail': { icon: '🎬', title: 'Thumbnail Maker', description: 'Create thumbnails with images, text & emojis.' },
}

const SUGGESTIONS_MAP: Record<string, string[]> = {
    'compressor': ['resizer', 'background-remover', 'cropper'],
    'resizer': ['compressor', 'instagram-grid', 'device-mockup'],
    'background-remover': ['compressor', 'device-mockup', 'thumbnail'],
    'exif-cleaner': ['compressor', 'watermark-remover', 'duplicate-finder'],
    'color-palette': ['color-blindness', 'ascii-art', 'device-mockup'],
    'instagram-grid': ['resizer', 'cropper', 'compressor'],
    'favicon': ['resizer', 'compressor', 'color-palette'],
    'ocr': ['image-to-pdf', 'pdf-to-image', 'cropper'],
    'device-mockup': ['resizer', 'background-remover', 'thumbnail'],
    'color-blindness': ['color-palette', 'image-comparison', 'ascii-art'],
    'ascii-art': ['color-palette', 'thumbnail', 'image-comparison'],
    'image-comparison': ['color-blindness', 'duplicate-finder', 'compressor'],
    'duplicate-finder': ['exif-cleaner', 'compressor', 'image-comparison'],
    'image-to-pdf': ['pdf-to-image', 'compressor', 'ocr'],
    'pdf-to-image': ['image-to-pdf', 'ocr', 'compressor'],
    'cropper': ['rotator', 'resizer', 'compressor'],
    'rotator': ['cropper', 'resizer', 'watermark'],
    'watermark': ['watermark-remover', 'compressor', 'thumbnail'],
    'watermark-remover': ['watermark', 'exif-cleaner', 'background-remover'],
    'thumbnail': ['background-remover', 'device-mockup', 'resizer'],
}

export function getToolSuggestions(currentTool: string): ToolSuggestion[] {
    const ids = SUGGESTIONS_MAP[currentTool] || []
    return ids
        .filter(id => TOOL_META[id])
        .map(id => ({ id, ...TOOL_META[id] }))
}

export function getToolMeta(toolId: string) {
    return TOOL_META[toolId] || null
}
