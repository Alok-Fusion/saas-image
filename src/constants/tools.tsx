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
    'exif-cleaner': '/remove-exif',
    'color-palette': '/color-palette',
    'instagram-grid': '/instagram-grid',
    favicon: '/favicon-generator',
    ocr: '/image-to-text',
    'device-mockup': '/device-mockup',
    'color-blindness': '/color-blindness',
    'ascii-art': '/ascii-art',
    'image-comparison': '/image-comparison',
    'duplicate-finder': '/duplicate-finder',
    'image-to-pdf': '/image-to-pdf',
    'pdf-to-image': '/pdf-to-image',
    cropper: '/crop-image',
    rotator: '/rotate-image',
    watermark: '/watermark',
    'watermark-remover': '/remove-watermark',
    thumbnail: '/thumbnail-maker',
}

export const PATH_TO_TOOL = new Map<string, Tool>(
    (Object.entries(TOOL_PATHS) as [Tool, string][]).map(([tool, path]) => [path, tool])
)

export const TOOL_SEO: Record<string, { title: string; desc: string }> = {
    home: { title: 'ImageKit Pro — Fast, Private In-Browser Image Tools', desc: '20 client-side image tools. Zero server uploads, absolute privacy.' },
    compressor: { title: 'Image Compressor — ImageKit Pro', desc: 'Compress images while maintaining quality. JPEG, PNG, WebP supported.' },
    resizer: { title: 'Social Media Resizer — ImageKit Pro', desc: 'Resize images for Instagram, YouTube, LinkedIn & more.' },
    'background-remover': { title: 'Background Remover — ImageKit Pro', desc: 'AI-powered background removal running in your browser.' },
    'exif-cleaner': { title: 'EXIF Privacy Cleaner — ImageKit Pro', desc: 'Remove GPS, camera info & metadata from your images.' },
    'color-palette': { title: 'Color Palette Extractor — ImageKit Pro', desc: 'Extract colors with HEX, RGB & CSS gradients.' },
    'instagram-grid': { title: 'Instagram Grid Splitter — ImageKit Pro', desc: 'Split images into 3×3, 3×2, 3×1 grids for carousel.' },
    favicon: { title: 'Favicon Generator — ImageKit Pro', desc: 'Generate all favicon sizes + manifest.json + HTML snippet.' },
    ocr: { title: 'OCR Text Extractor — ImageKit Pro', desc: 'Extract text from images in 12 languages.' },
    'device-mockup': { title: 'Device Mockup Generator — ImageKit Pro', desc: 'iPhone, MacBook, iPad device frame mockups.' },
    'color-blindness': { title: 'Color Blindness Simulator — ImageKit Pro', desc: 'See how designs appear to color blind users.' },
    'ascii-art': { title: 'ASCII Art Generator — ImageKit Pro', desc: 'Convert images to ASCII text art.' },
    'image-comparison': { title: 'Image Comparison Slider — ImageKit Pro', desc: 'Side-by-side image comparison with slider.' },
    'duplicate-finder': { title: 'Duplicate Image Finder — ImageKit Pro', desc: 'Find similar images using perceptual hashing.' },
    'image-to-pdf': { title: 'Image to PDF — ImageKit Pro', desc: 'Convert multiple images into a single PDF.' },
    'pdf-to-image': { title: 'PDF to Image — ImageKit Pro', desc: 'Convert PDF pages to PNG images.' },
    cropper: { title: 'Image Cropper — ImageKit Pro', desc: 'Crop images with preset aspect ratios.' },
    rotator: { title: 'Image Rotator — ImageKit Pro', desc: 'Rotate 90°/180° and flip images.' },
    watermark: { title: 'Watermark Adder — ImageKit Pro', desc: 'Add text watermarks with custom position & style.' },
    'watermark-remover': { title: 'Watermark Remover — ImageKit Pro', desc: 'Remove watermarks using inpaint, blur, or pixelate.' },
    thumbnail: { title: 'Thumbnail Maker — ImageKit Pro', desc: 'Create thumbnails with images, text & emojis.' },
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
