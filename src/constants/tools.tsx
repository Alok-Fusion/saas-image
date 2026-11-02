import { type ReactNode } from 'react'
import {
    Columns2,
    CopyCheck,
    Crop,
    Eraser,
    Eye,
    FileText,
    Grid3X3,
    ImageDown,
    Layers,
    Maximize2,
    Minimize2,
    Palette,
    RotateCw,
    ScanText,
    ShieldCheck,
    Smartphone,
    Terminal,
    Type,
    Video,
    Wand2,
} from 'lucide-react'
import { TOOL_SEO_DATA } from '../data/toolSeoData'

export type Tool =
    | 'home'
    | 'compressor'
    | 'resizer'
    | 'background-remover'
    | 'exif-cleaner'
    | 'color-palette'
    | 'instagram-grid'
    | 'favicon'
    | 'ocr'
    | 'device-mockup'
    | 'color-blindness'
    | 'ascii-art'
    | 'image-comparison'
    | 'duplicate-finder'
    | 'image-to-pdf'
    | 'pdf-to-image'
    | 'cropper'
    | 'rotator'
    | 'watermark'
    | 'watermark-remover'
    | 'thumbnail'

export const TOOL_PATHS: Record<Tool, string> = {
    home: '/',
    compressor: '/compress-image',
    resizer: '/resize-image',
    'background-remover': '/remove-background',
    'exif-cleaner': '/remove-exif-data',
    'color-palette': '/color-palette-extractor',
    'instagram-grid': '/instagram-grid-splitter',
    favicon: '/favicon-generator',
    ocr: '/image-to-text',
    'device-mockup': '/device-mockup-generator',
    'color-blindness': '/color-blindness-simulator',
    'ascii-art': '/image-to-ascii-art',
    'image-comparison': '/image-comparison-slider',
    'duplicate-finder': '/find-duplicate-images',
    'image-to-pdf': '/image-to-pdf',
    'pdf-to-image': '/pdf-to-image',
    cropper: '/crop-image',
    rotator: '/rotate-image',
    watermark: '/add-watermark',
    'watermark-remover': '/remove-watermark',
    thumbnail: '/thumbnail-maker',
}

export const CATEGORY_PATHS = {
    'image-tools': '/image-tools',
    'pdf-tools': '/pdf-tools',
    'privacy-tools': '/privacy-tools',
} as const

export const STATIC_PAGE_PATHS = {
    guides: '/guides',
    about: '/about',
    privacy: '/privacy',
    contact: '/contact',
} as const

export const PATH_TO_TOOL = new Map<string, Tool>([
    ...(Object.entries(TOOL_PATHS) as [Tool, string][]).map(([tool, path]) => [path, tool] as [string, Tool]),
    // Legacy backwards-compatible aliases
    ['/remove-exif', 'exif-cleaner'],
    ['/watermark', 'watermark'],
    ['/duplicate-finder', 'duplicate-finder'],
    ['/color-palette', 'color-palette'],
    ['/device-mockup', 'device-mockup'],
    ['/color-blindness', 'color-blindness'],
    ['/ascii-art', 'ascii-art'],
    ['/ascii-art-generator', 'ascii-art'],
    ['/instagram-grid', 'instagram-grid'],
    ['/image-comparison', 'image-comparison'],
    ['/compressor', 'compressor'],
    ['/resizer', 'resizer'],
    ['/background-remover', 'background-remover'],
    ['/cropper', 'cropper'],
    ['/rotator', 'rotator'],
    ['/watermark-remover', 'watermark-remover'],
    ['/ocr', 'ocr'],
    ['/favicon', 'favicon'],
    ['/thumbnail', 'thumbnail'],
])

export const TOOL_SEO: Record<string, { title: string; desc: string }> = {
    home: {
        title: 'ImageKit Pro — Fast, Private In-Browser Image Tools',
        desc: '20 client-side image tools. Zero server uploads, absolute privacy, 100% free.',
    },
    ...Object.fromEntries(
        Object.entries(TOOL_SEO_DATA).map(([id, data]) => [
            id,
            { title: data.metaTitle, desc: data.metaDescription },
        ])
    ),
}

export interface ToolDefinition {
    id: Tool
    icon: ReactNode
    title: string
    description: string
    isNew?: boolean
    category: 'core' | 'edit' | 'pdf' | 'privacy' | 'design' | 'social' | 'accessibility'
}

export const ALL_TOOLS: ToolDefinition[] = [
    { id: 'compressor', icon: <Minimize2 size={18} />, title: 'Image Compressor', description: 'Reduce file size while maintaining visual quality.', category: 'core' },
    { id: 'resizer', icon: <Maximize2 size={18} />, title: 'Social Media Resizer', description: 'Resize for Instagram, YouTube, LinkedIn & more.', category: 'core' },
    { id: 'background-remover', icon: <Eraser size={18} />, title: 'Background Remover', description: 'AI-powered background removal.', category: 'core' },
    { id: 'cropper', icon: <Crop size={18} />, title: 'Image Cropper', description: 'Crop with preset aspect ratios (1:1, 16:9, 4:3).', isNew: true, category: 'edit' },
    { id: 'rotator', icon: <RotateCw size={18} />, title: 'Image Rotator', description: 'Rotate 90°/180° and flip horizontal/vertical.', isNew: true, category: 'edit' },
    { id: 'watermark', icon: <Type size={18} />, title: 'Watermark Adder', description: 'Add text watermarks with custom position & style.', isNew: true, category: 'edit' },
    { id: 'watermark-remover', icon: <Wand2 size={18} />, title: 'Watermark Remover', description: 'Remove watermarks using inpaint, blur, or pixelate.', isNew: true, category: 'edit' },
    { id: 'image-to-pdf', icon: <FileText size={18} />, title: 'Image to PDF', description: 'Convert multiple images into a single PDF.', isNew: true, category: 'pdf' },
    { id: 'pdf-to-image', icon: <ImageDown size={18} />, title: 'PDF to Image', description: 'Convert PDF pages to PNG images.', isNew: true, category: 'pdf' },
    { id: 'exif-cleaner', icon: <ShieldCheck size={18} />, title: 'EXIF Privacy Cleaner', description: 'Remove GPS, camera info & metadata.', isNew: true, category: 'privacy' },
    { id: 'duplicate-finder', icon: <CopyCheck size={18} />, title: 'Duplicate Finder', description: 'Find similar images using perceptual hashing.', isNew: true, category: 'privacy' },
    { id: 'ocr', icon: <ScanText size={18} />, title: 'OCR Text Extractor', description: 'Extract text from images in 12 languages.', isNew: true, category: 'privacy' },
    { id: 'color-palette', icon: <Palette size={18} />, title: 'Color Palette Extractor', description: 'Extract colors with HEX/RGB & CSS gradients.', isNew: true, category: 'design' },
    { id: 'device-mockup', icon: <Smartphone size={18} />, title: 'Device Mockup Generator', description: 'iPhone, MacBook, iPad device frames.', isNew: true, category: 'design' },
    { id: 'ascii-art', icon: <Terminal size={18} />, title: 'ASCII Art Generator', description: 'Convert images to ASCII text art.', isNew: true, category: 'design' },
    { id: 'thumbnail', icon: <Video size={18} />, title: 'Thumbnail Maker', description: 'Create thumbnails with images, text & emojis.', isNew: true, category: 'design' },
    { id: 'instagram-grid', icon: <Grid3X3 size={18} />, title: 'Instagram Grid Splitter', description: 'Split into 3×3/3×2/3×1 grids for carousel.', isNew: true, category: 'social' },
    { id: 'favicon', icon: <Layers size={18} />, title: 'Favicon Generator', description: 'All sizes + manifest.json + HTML snippet.', isNew: true, category: 'social' },
    { id: 'color-blindness', icon: <Eye size={18} />, title: 'Color Blindness Simulator', description: 'See how designs appear to color blind users.', isNew: true, category: 'accessibility' },
    { id: 'image-comparison', icon: <Columns2 size={18} />, title: 'Image Comparison Slider', description: 'Before/after comparison with slider.', isNew: true, category: 'accessibility' },
]
