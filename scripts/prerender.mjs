import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = resolve(__dirname, '../dist')
const templatePath = resolve(distDir, 'index.html')

const baseTemplate = await readFile(templatePath, 'utf8')

const ROUTES = [
    {
        path: 'compress-image',
        title: 'Image Compressor — Free Online Image Tool | ImageKit Pro',
        desc: 'Compress images while maintaining high visual quality. JPEG, PNG, and WebP supported directly in your browser.',
        h1: 'Free Online Image Compressor',
        howTo: 'Drop your image, choose your desired quality or target format, preview the compressed result, and download instantly without uploading to any server.',
    },
    {
        path: 'resize-image',
        title: 'Social Media Resizer — Free Online Image Tool | ImageKit Pro',
        desc: 'Resize images with presets for Instagram, YouTube, LinkedIn, Twitter/X, Facebook, and more.',
        h1: 'Social Media Image Resizer',
        howTo: 'Select your target platform and preset format, adjust crop or fit mode, and download your perfectly dimensioned image.',
    },
    {
        path: 'remove-background',
        title: 'Background Remover — AI-Powered In Browser | ImageKit Pro',
        desc: 'Remove image backgrounds automatically using client-side AI. 100% private, no uploads.',
        h1: 'AI Background Remover',
        howTo: 'Upload your photo to run AI background separation entirely on your device, toggle solid or transparent background, and export in PNG or JPEG.',
    },
    {
        path: 'crop-image',
        title: 'Image Cropper — Preset Aspect Ratios | ImageKit Pro',
        desc: 'Crop images with custom or preset aspect ratios (1:1, 16:9, 4:3, 9:16) with pixel precision.',
        h1: 'Online Image Cropper',
        howTo: 'Choose an aspect ratio or free crop, drag to frame the area, and export the exact cropped pixels.',
    },
    {
        path: 'rotate-image',
        title: 'Image Rotator & Flip — ImageKit Pro',
        desc: 'Rotate images 90°, 180°, 270° and flip horizontally or vertically in your browser.',
        h1: 'Image Rotator & Flipper',
        howTo: 'Rotate or flip your image with one click, preview instantly, and download the transformed image.',
    },
    {
        path: 'watermark',
        title: 'Watermark Adder — Protect Your Photos | ImageKit Pro',
        desc: 'Add text watermarks with custom positioning, font size, opacity, and color.',
        h1: 'Add Watermark to Images',
        howTo: 'Type your watermark text, pick position, size, and opacity, and save your watermarked image.',
    },
    {
        path: 'remove-watermark',
        title: 'Watermark Remover — Inpaint & Blur | ImageKit Pro',
        desc: 'Remove watermarks and unwanted objects with client-side inpaint or blur brush.',
        h1: 'Watermark Remover',
        howTo: 'Brush over watermarks, timestamps, or unwanted logos to seamlessly fill them using worker-powered inpainting.',
    },
    {
        path: 'image-to-pdf',
        title: 'Image to PDF Converter — Merge Images | ImageKit Pro',
        desc: 'Convert multiple JPG, PNG, and WebP images into a single formatted PDF document.',
        h1: 'Image to PDF Converter',
        howTo: 'Select one or more images, reorder them, choose page size and orientation, and download your unified PDF.',
    },
    {
        path: 'pdf-to-image',
        title: 'PDF to Image Converter — High Resolution PNG | ImageKit Pro',
        desc: 'Extract PDF pages into crisp PNG images completely offline in your browser.',
        h1: 'PDF to Image Converter',
        howTo: 'Upload your PDF file, render pages with bundled PDF.js worker, and download individual pages or a full ZIP.',
    },
    {
        path: 'remove-exif',
        title: 'EXIF Privacy Cleaner — Strip GPS & Metadata | ImageKit Pro',
        desc: 'Inspect and strip GPS coordinates, camera maker, date, and metadata before sharing photos.',
        h1: 'EXIF Metadata & Privacy Cleaner',
        howTo: 'Inspect detected EXIF tags and GPS coordinates, click Clean EXIF to strip metadata while preserving visual quality.',
    },
    {
        path: 'duplicate-finder',
        title: 'Duplicate Image Finder — Perceptual Hashing | ImageKit Pro',
        desc: 'Find visually duplicate or similar photos client-side using difference hashing algorithms.',
        h1: 'Duplicate & Similar Image Finder',
        howTo: 'Select multiple photos to compute 64-bit perceptual hashes in parallel and view clustered duplicates.',
    },
    {
        path: 'image-to-text',
        title: 'OCR Image to Text Extractor — 12+ Languages | ImageKit Pro',
        desc: 'Extract editable text from scanned documents, receipts, and images using in-browser OCR.',
        h1: 'OCR Text Extractor',
        howTo: 'Upload an image with text, select your language, let Tesseract run in the browser, and copy or download the text.',
    },
    {
        path: 'color-palette',
        title: 'Color Palette Extractor — HEX, RGB & Gradients | ImageKit Pro',
        desc: 'Extract dominant color palettes and CSS gradient code from any image.',
        h1: 'Color Palette Extractor',
        howTo: 'Drop an image to extract the top dominant colors, view hex/rgb codes, and copy CSS gradients.',
    },
    {
        path: 'device-mockup',
        title: 'Device Mockup Generator — iPhone, iPad, MacBook | ImageKit Pro',
        desc: 'Wrap your screenshots inside beautiful iPhone, iPad, and MacBook frames.',
        h1: 'Device Mockup Generator',
        howTo: 'Upload your UI screenshot, select your frame device and background gradient, and export high-res mockups.',
    },
    {
        path: 'ascii-art',
        title: 'ASCII Art Generator — Retro Text Art | ImageKit Pro',
        desc: 'Convert photos into retro ASCII text art with customizable character sets and width.',
        h1: 'ASCII Art Generator',
        howTo: 'Choose characters, adjust width and inversion, and copy or download your ASCII masterpiece.',
    },
    {
        path: 'thumbnail-maker',
        title: 'Thumbnail Maker — YouTube & Social Media | ImageKit Pro',
        desc: 'Design high-converting YouTube and video thumbnails with text, badges, and gradient backgrounds.',
        h1: 'Online Thumbnail Maker',
        howTo: 'Upload your focal photo, add custom headlines, badges, and filters, and export in 1280x720.',
    },
    {
        path: 'instagram-grid',
        title: 'Instagram Grid Splitter — 3x3, 3x2, 3x1 Carousel | ImageKit Pro',
        desc: 'Split photos into seamless Instagram grid tiles and carousel posts.',
        h1: 'Instagram Grid Splitter',
        howTo: 'Choose a 3x1, 3x2, or 3x3 layout, adjust framing, and download each numbered tile or a single ZIP.',
    },
    {
        path: 'favicon-generator',
        title: 'Favicon Generator — ICO, PNG & Web App Manifest | ImageKit Pro',
        desc: 'Generate complete favicon sets (16, 32, 48, 180, 192, 512), manifest.json, and HTML meta tags.',
        h1: 'Complete Favicon Generator',
        howTo: 'Upload your logo or icon to generate multi-size ICO, Apple touch icons, Android manifest, and copy the head tags.',
    },
    {
        path: 'color-blindness',
        title: 'Color Blindness Simulator — Accessibility Checker | ImageKit Pro',
        desc: 'Simulate 8 types of color vision deficiencies to verify accessibility compliance.',
        h1: 'Color Blindness Simulator',
        howTo: 'View your designs through Protanopia, Deuteranopia, Tritanopia, and Achromatopsia color matrices.',
    },
    {
        path: 'image-comparison',
        title: 'Image Comparison Slider — Before & After | ImageKit Pro',
        desc: 'Compare two images side-by-side with an interactive comparison slider.',
        h1: 'Before and After Image Comparison Slider',
        howTo: 'Upload two images to view them overlaid with a draggable comparison slider with keyboard and touch support.',
    },
]

for (const route of ROUTES) {
    const routeUrl = `https://imagekitpro.com/${route.path}`
    let html = baseTemplate
        .replace(/<title>.*?<\/title>/i, `<title>${route.title}</title>`)
        .replace(/<meta name="description" content=".*?" \/>/i, `<meta name="description" content="${route.desc}" />`)
        .replace(/<link rel="canonical" href=".*?" \/>/i, `<link rel="canonical" href="${routeUrl}" />`)
        .replace(/<meta property="og:url" content=".*?" \/>/i, `<meta property="og:url" content="${routeUrl}" />`)
        .replace(/<meta property="og:title" content=".*?" \/>/i, `<meta property="og:title" content="${route.title}" />`)
        .replace(/<meta property="og:description" content=".*?" \/>/i, `<meta property="og:description" content="${route.desc}" />`)
        .replace(/<meta property="twitter:title" content=".*?" \/>/i, `<meta property="twitter:title" content="${route.title}" />`)
        .replace(/<meta property="twitter:description" content=".*?" \/>/i, `<meta property="twitter:description" content="${route.desc}" />`)
        .replace(
            '<div id="root"></div>',
            `<div id="root"><main class="main-container" style="padding-top:2rem"><div class="tool-page"><div class="tool-header"><h1>${route.h1}</h1><p class="tool-description">${route.desc}</p></div><div class="card" style="padding:1.5rem;margin-top:1rem;color:rgba(255,255,255,0.85);line-height:1.6"><h2 style="font-size:1.15rem;margin-bottom:0.5rem">How to use this tool:</h2><p>${route.howTo}</p><p style="margin-top:0.75rem;font-size:0.9rem;opacity:0.75">🔒 All processing happens directly inside your web browser. Your images are never uploaded to any remote server.</p></div></div></main></div>`
        )

    const outDir = resolve(distDir, route.path)
    await mkdir(outDir, { recursive: true })
    await writeFile(resolve(outDir, 'index.html'), html, 'utf8')
}

console.log(`Prerendered ${ROUTES.length} static HTML route pages in dist/`)

