import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = resolve(__dirname, '../dist')
const publicDir = resolve(__dirname, '../public')
const templatePath = resolve(distDir, 'index.html')

const baseTemplate = await readFile(templatePath, 'utf8')
const SITE_URL = process.env.VITE_SITE_URL || 'https://imagekitpro.cc'
const TODAY = new Date().toISOString().split('T')[0]

// 20 Core Tools with Rich Search-Optimized Content
const TOOLS = [
    {
        id: 'compressor',
        path: 'compress-image',
        legacyAliases: ['compressor'],
        title: 'Compress Image Online Free — High Quality WebP & JPG | ImageKit Pro',
        desc: 'Compress images free in your browser with zero uploads. Reduce JPEG, PNG, and WebP file sizes up to 90% while preserving sharp visual quality.',
        h1: 'Compress Images Online Free — 100% Private & In-Browser',
        category: 'core',
        catName: 'Essential Image Tools',
        catPath: 'image-tools',
        formats: 'JPEG, PNG, WebP, AVIF',
        howTo: [
            { step: '1', title: 'Select Image', text: 'Drag and drop your JPEG, PNG, or WebP photo into the workspace or browse your files.' },
            { step: '2', title: 'Adjust Compression Level', text: 'Use the quality slider (70%–85% recommended) or choose your preferred target format.' },
            { step: '3', title: 'Download Instantly', text: 'Inspect the real-time byte counter and download your lightweight compressed image.' },
        ],
        faqs: [
            { q: 'Is my photo uploaded to a remote server during compression?', a: 'No. ImageKit Pro runs entirely inside your web browser using HTML5 Canvas and WebAssembly. Your photos remain in local RAM and never leave your machine.' },
            { q: 'How much can I reduce my image size without losing quality?', a: 'Most photographic images can be compressed by 65% to 85% with zero perceptible difference under normal viewing conditions.' },
            { q: 'Which formats are supported for compression?', a: 'We support input and output for JPEG, PNG, WebP, and modern browser-supported image formats.' },
            { q: 'Is there a limit on how many images I can compress?', a: 'No. Because processing uses your own device hardware rather than our servers, there are zero daily caps or paywalls.' },
        ],
        article: `
            <p>High-resolution photos from modern smartphones and digital cameras can easily exceed 10 to 25 megabytes in size. Uploading uncompressed images to websites slows down page loading speeds, hurts Google Core Web Vitals rankings, and triggers email attachment size errors.</p>
            <h3>How Browser-Based Compression Works</h3>
            <p>ImageKit Pro uses HTML5 Canvas2D rendering contexts coupled with perceptual quantization algorithms. By discarding high-frequency chromatic variations that the human eye cannot detect, file sizes are dramatically lowered while maintaining crisp edges and vibrant color fidelity.</p>
            <h3>Why Client-Side Matters for Image Privacy</h3>
            <p>Traditional online compressors send your files to remote cloud servers. ImageKit Pro performs every calculation in your browser memory. This guarantees that confidential contracts, personal family photos, and internal UI designs remain strictly private.</p>
        `,
    },
    {
        id: 'resizer',
        path: 'resize-image',
        legacyAliases: ['resizer'],
        title: 'Resize Image for Social Media — Exact Dimensions | ImageKit Pro',
        desc: 'Resize images for Instagram, YouTube, LinkedIn, X, Facebook, and TikTok. 100% free client-side image resizer with instant export.',
        h1: 'Social Media Image Resizer — Instant Aspect Presets',
        category: 'core',
        catName: 'Essential Image Tools',
        catPath: 'image-tools',
        formats: 'JPEG, PNG, WebP',
        howTo: [
            { step: '1', title: 'Drop Your Media', text: 'Upload any graphic or photograph from your desktop or phone.' },
            { step: '2', title: 'Pick Platform Preset', text: 'Choose from official aspect presets for YouTube thumbnails, Instagram posts, or LinkedIn banners.' },
            { step: '3', title: 'Export Dimensioned Image', text: 'Download the resized graphic with pixel-accurate dimensions.' },
        ],
        faqs: [
            { q: 'Does resizing distort my image proportions?', a: 'No. You can toggle between smart crop, fit-with-blur padding, or proportional scaling.' },
            { q: 'What social media presets are included?', a: 'Official presets include Instagram Square, Portrait, Story, YouTube Thumbnail, Banner, LinkedIn Cover, and Twitter/X header.' },
            { q: 'Can I set custom width and height in pixels?', a: 'Yes. You can switch from presets to custom mode and type exact pixel dimensions.' },
        ],
        article: `
            <p>Every major social network enforces distinct aspect ratio and pixel dimension specifications. Posting an image with mismatched dimensions leads to awkward automatic cropping, blurry downsampling, and loss of critical branding elements.</p>
            <h3>Exact Social Media Dimensions (2026 Updated)</h3>
            <p>Our presets automatically match the latest platform guidelines: 1080×1080 for Instagram Square, 1080×1350 for Portrait, 1280×720 for YouTube thumbnails, and 1584×396 for LinkedIn banners. All bilinear resampling runs on your local GPU.</p>
        `,
    },
    {
        id: 'background-remover',
        path: 'remove-background',
        legacyAliases: ['background-remover'],
        title: 'Remove Background from Image Free — AI In-Browser | ImageKit Pro',
        desc: 'Remove image backgrounds automatically with on-device AI. 100% private, transparent PNG export, zero server uploads, no sign-up required.',
        h1: 'AI Background Remover — 100% Free & In-Browser',
        category: 'core',
        catName: 'Essential Image Tools',
        catPath: 'image-tools',
        formats: 'PNG, JPEG, WebP',
        howTo: [
            { step: '1', title: 'Upload Photo', text: 'Select an image featuring people, products, animals, or graphics.' },
            { step: '2', title: 'Automatic Neural Cutout', text: 'The on-device machine learning model isolates your foreground subject.' },
            { step: '3', title: 'Export Transparent PNG', text: 'Download your cutout with transparent alpha or replace with solid colors.' },
        ],
        faqs: [
            { q: 'How does on-device AI background removal work?', a: 'We run quantized neural segmentation models directly in your browser using ONNX Runtime Web and WebAssembly.' },
            { q: 'Are my personal photos sent to an AI training server?', a: 'Never. The neural network model executes strictly on your computer CPU/GPU. No weights or photos are uploaded.' },
            { q: 'Can I export with transparent backgrounds?', a: 'Yes. Transparent PNG output is the default export format.' },
        ],
        article: `
            <p>Creating clean product listings, profile headshots, and marketing collaterals traditionally required complex Photoshop pen tool selections or subscription services that upload your personal images to the cloud.</p>
            <h3>On-Device Neural Segmentation</h3>
            <p>ImageKit Pro executes segmentation networks directly in browser threads using WebAssembly SIMD instructions. This achieves professional edge detection around hair, fur, and complex contours with zero privacy risk.</p>
        `,
    },
    {
        id: 'cropper',
        path: 'crop-image',
        legacyAliases: ['cropper'],
        title: 'Crop Image Online Free — Fixed Aspect Ratios | ImageKit Pro',
        desc: 'Crop images with preset aspect ratios (1:1, 16:9, 4:3, 9:16) or freeform crop. Clean, fast, pixel-accurate in-browser image cropper.',
        h1: 'Free Online Image Cropper — Precision Aspect Ratios',
        category: 'edit',
        catName: 'Edit & Transform Tools',
        catPath: 'image-tools',
        formats: 'JPEG, PNG, WebP',
        howTo: [
            { step: '1', title: 'Load Image', text: 'Drag and drop any picture into the interactive cropping canvas.' },
            { step: '2', title: 'Set Framing', text: 'Select a fixed ratio like 1:1 or 16:9, or drag crop handles freely.' },
            { step: '3', title: 'Save Cropped Image', text: 'Export the cropped pixel area instantly without compression loss.' },
        ],
        faqs: [
            { q: 'Can I crop to specific aspect ratios like 16:9 or 1:1?', a: 'Yes. We offer one-click presets for 1:1, 16:9, 4:3, 3:2, 9:16, and freeform.' },
            { q: 'Does cropping reduce the sharpness of the cropped region?', a: 'No. Cropping extracts original pixel data directly from the source bitmap without generational loss.' },
        ],
        article: `
            <p>Trimming extraneous backgrounds and centering focal subjects is the most common image adjustment task. ImageKit Pro provides smooth, accelerated canvas cropping handles with real-time pixel dimension overlays.</p>
        `,
    },
    {
        id: 'rotator',
        path: 'rotate-image',
        legacyAliases: ['rotator'],
        title: 'Rotate Image Online & Flip Horizontally/Vertically | ImageKit Pro',
        desc: 'Rotate images 90, 180, 270 degrees and flip horizontal or vertical. Fast, loss-free, in-browser orientation tool.',
        h1: 'Rotate & Flip Images Online — Lossless Canvas Transforms',
        category: 'edit',
        catName: 'Edit & Transform Tools',
        catPath: 'image-tools',
        formats: 'JPEG, PNG, WebP',
        howTo: [
            { step: '1', title: 'Upload Picture', text: 'Drop photos that were taken sideways or upside down.' },
            { step: '2', title: 'Click Rotate or Flip', text: 'Use the 90° clockwise, counter-clockwise, or flip buttons.' },
            { step: '3', title: 'Export Result', text: 'Download the corrected image with updated orientation headers.' },
        ],
        faqs: [
            { q: 'Why do smartphone photos sometimes appear sideways?', a: 'Smartphones store rotation in EXIF orientation tags. Some software ignores this tag. Our tool corrects the physical pixel grid.' },
            { q: 'Does flipping mirror the text in an image?', a: 'Horizontal flip creates a mirror image, useful for selfie camera corrections.' },
        ],
        article: `
            <p>Fixing incorrectly oriented photos shouldn't require installing desktop photo editors. ImageKit Pro performs fast 2D matrix transformations directly on GPU canvas buffers.</p>
        `,
    },
    {
        id: 'watermark',
        path: 'add-watermark',
        legacyAliases: ['watermark'],
        title: 'Add Watermark to Images Online Free — Protect Photos | ImageKit Pro',
        desc: 'Add custom text watermarks to photos in your browser. Customize font, opacity, rotation, and position. 100% private in-browser utility.',
        h1: 'Add Watermark to Photos — Custom Typography & Opacity',
        category: 'edit',
        catName: 'Edit & Transform Tools',
        catPath: 'image-tools',
        formats: 'JPEG, PNG, WebP',
        howTo: [
            { step: '1', title: 'Load Photos', text: 'Select the photos you need to copyright or mark.' },
            { step: '2', title: 'Configure Watermark', text: 'Type your copyright text, pick font style, size, opacity, and anchor position.' },
            { step: '3', title: 'Download Watermarked File', text: 'Export high-resolution copies ready for public distribution.' },
        ],
        faqs: [
            { q: 'Can I control the transparency of the watermark?', a: 'Yes. An interactive slider lets you dial transparency from 5% to 100%.' },
            { q: 'Can I add watermarks across the center or corners?', a: 'You can anchor text to top-left, top-right, center, bottom-left, or bottom-right.' },
        ],
        article: `
            <p>Photographers and content creators need quick protection before publishing preview proofs. Add discreet copyright notices or bold diagonal security watermarks with zero latency.</p>
        `,
    },
    {
        id: 'watermark-remover',
        path: 'remove-watermark',
        legacyAliases: ['watermark-remover'],
        title: 'Remove Watermark from Image Free — Inpaint & Blur | ImageKit Pro',
        desc: 'Remove unwanted watermarks, date stamps, and logos using client-side inpainting and blur brushes. 100% free and private.',
        h1: 'Remove Watermark from Photos — Inpaint & Blur Brushes',
        category: 'edit',
        catName: 'Edit & Transform Tools',
        catPath: 'image-tools',
        formats: 'JPEG, PNG, WebP',
        howTo: [
            { step: '1', title: 'Open Image', text: 'Import the photo containing timestamps or logos.' },
            { step: '2', title: 'Brush Over Object', text: 'Paint over the watermark with the adjustable brush tool.' },
            { step: '3', title: 'Apply Inpaint', text: 'Watch the algorithm interpolate surrounding textures to erase the mark.' },
        ],
        faqs: [
            { q: 'How does client-side inpainting work?', a: 'It samples surrounding pixel color distributions and gradients to blend over the marked area seamlessly.' },
            { q: 'Can I adjust the brush diameter?', a: 'Yes. Customize brush radius and feathering for precise edge control.' },
        ],
        article: `
            <p>Erase camera timestamps, stray objects, or unwanted graphic marks. Using fast algorithmic convolution, pixels are synthesized locally without cloud dependencies.</p>
        `,
    },
    {
        id: 'image-to-pdf',
        path: 'image-to-pdf',
        legacyAliases: [],
        title: 'Image to PDF Converter Online Free — Merge JPG & PNG | ImageKit Pro',
        desc: 'Convert multiple JPG, PNG, and WebP images into a single PDF document. Private client-side PDF maker, reorder pages, custom margins.',
        h1: 'Convert Images to PDF — 100% Private In-Browser Merge',
        category: 'pdf',
        catName: 'PDF Suite',
        catPath: 'pdf-tools',
        formats: 'JPEG, PNG, WebP, PDF',
        howTo: [
            { step: '1', title: 'Add Multiple Images', text: 'Select receipts, document scans, or photos in any order.' },
            { step: '2', title: 'Organize & Format', text: 'Drag to reorder pages and set page size (A4, Letter) and orientation.' },
            { step: '3', title: 'Generate PDF', text: 'Download a clean, uniform PDF document compiled directly in your browser.' },
        ],
        faqs: [
            { q: 'Can I combine multiple images into one PDF?', a: 'Yes. Add dozens of images, rearrange page sequence, and export a single PDF file.' },
            { q: 'Are my confidential documents uploaded to a server?', a: 'No. The PDF generation engine runs entirely inside your browser tab using jsPDF.' },
        ],
        article: `
            <p>Creating consolidated PDF dossiers from receipts, invoices, and photo scans is essential for business, legal, and educational workflows. ImageKit Pro compiles PDFs in local RAM with zero risk of document interception.</p>
        `,
    },
    {
        id: 'pdf-to-image',
        path: 'pdf-to-image',
        legacyAliases: [],
        title: 'PDF to Image Converter Free — High Resolution PNG | ImageKit Pro',
        desc: 'Extract and convert PDF pages into high-resolution PNG or JPG images in browser. Powered by Mozilla PDF.js, confidential & private.',
        h1: 'Convert PDF to Images — Extract Pages to Crisp PNGs',
        category: 'pdf',
        catName: 'PDF Suite',
        catPath: 'pdf-tools',
        formats: 'PDF to PNG, JPEG',
        howTo: [
            { step: '1', title: 'Upload PDF Document', text: 'Select any multi-page PDF file.' },
            { step: '2', title: 'Choose Page Range & DPI', text: 'Render specific pages or all pages at standard (150 DPI) or high resolution (300 DPI).' },
            { step: '3', title: 'Download Image Files', text: 'Save individual page images or export all pages as a bundled ZIP.' },
        ],
        faqs: [
            { q: 'Can I extract high-resolution 300 DPI images?', a: 'Yes. You can adjust the render scale multiplier for print-ready raster exports.' },
            { q: 'Does this handle password-protected PDFs?', a: 'If you have the password, you can enter it locally to decrypt and extract pages in browser.' },
        ],
        article: `
            <p>Rasterize complex vector PDF documents into crisp PNG or JPEG slides. Powered by Mozilla PDF.js workers, vectors and embedded typography are rendered with high fidelity.</p>
        `,
    },
    {
        id: 'exif-cleaner',
        path: 'remove-exif-data',
        legacyAliases: ['remove-exif'],
        title: 'Remove EXIF Data Online — Strip GPS & Metadata | ImageKit Pro',
        desc: 'Strip GPS coordinates, camera model, date, and personal metadata from photos before sharing online. 100% private browser EXIF scrubber.',
        h1: 'Strip EXIF Metadata & GPS Coordinates — Privacy Scrubber',
        category: 'privacy',
        catName: 'Privacy & Security',
        catPath: 'privacy-tools',
        formats: 'JPEG, PNG, WebP, TIFF',
        howTo: [
            { step: '1', title: 'Inspect Photo Metadata', text: 'Drop any JPEG to view camera model, GPS coordinates, shutter speed, and timestamp.' },
            { step: '2', title: 'Purge Metadata Blocks', text: 'Click Scrub EXIF to erase all IPTC, XMP, and EXIF header markers.' },
            { step: '3', title: 'Save Anonymized File', text: 'Download a clean, sanitized image safe to share on public forums.' },
        ],
        faqs: [
            { q: 'What metadata is embedded inside smartphone photos?', a: 'Photos often contain your home latitude/longitude, camera serial numbers, and exact capture dates.' },
            { q: 'Does cleaning EXIF affect image visual quality?', a: 'No. Visual pixel data is preserved without re-compression degradation.' },
        ],
        article: `
            <p>Digital privacy starts with awareness of hidden metadata. Smartphones quietly write your location coordinates into every photo file. Our EXIF cleaner removes these headers completely before photos are shared on the web.</p>
        `,
    },
    {
        id: 'duplicate-finder',
        path: 'find-duplicate-images',
        legacyAliases: ['duplicate-finder'],
        title: 'Duplicate Image Finder Online — Perceptual Hashing | ImageKit Pro',
        desc: 'Find duplicate and similar photos client-side using difference hashing (dHash). Clean your photo library locally without uploading images.',
        h1: 'Find Duplicate & Similar Photos — Perceptual dHash Engine',
        category: 'privacy',
        catName: 'Privacy & Security',
        catPath: 'privacy-tools',
        formats: 'JPEG, PNG, WebP',
        howTo: [
            { step: '1', title: 'Add Photo Batch', text: 'Drop dozens or hundreds of photos from your hard drive.' },
            { step: '2', title: 'Compute Hashes', text: 'The browser generates 64-bit perceptual hashes in parallel workers.' },
            { step: '3', title: 'Review Clustered Duplicates', text: 'Inspect similar images grouped by Hamming distance and pick which to keep.' },
        ],
        faqs: [
            { q: 'How does perceptual hashing find duplicates?', a: 'Unlike cryptographic hashes (SHA-256), perceptual dHash identifies visual similarity even if photos were resized or slightly edited.' },
            { q: 'Can it scan my photos without uploading them to the cloud?', a: 'Yes. All image decoding and hash comparisons run inside local web workers.' },
        ],
        article: `
            <p>Clear out repetitive bursts, duplicate social media downloads, and cluttered screenshots. Perceptual hashing algorithms detect visual duplicates at lightning speeds without transmitting your photos.</p>
        `,
    },
    {
        id: 'ocr',
        path: 'image-to-text',
        legacyAliases: ['ocr'],
        title: 'OCR Image to Text Extractor — 12+ Languages | ImageKit Pro',
        desc: 'Extract text from images, receipts, and scans in 12+ languages. In-browser OCR powered by Tesseract WebAssembly with zero data tracking.',
        h1: 'OCR Text Extractor — In-Browser Optical Character Recognition',
        category: 'privacy',
        catName: 'Privacy & Security',
        catPath: 'privacy-tools',
        formats: 'JPEG, PNG, WebP, PDF',
        howTo: [
            { step: '1', title: 'Upload Scanned Document', text: 'Select an image featuring printed text, invoices, or book pages.' },
            { step: '2', title: 'Select Recognition Language', text: 'Choose from English, Spanish, German, French, Chinese, Japanese, and more.' },
            { step: '3', title: 'Copy Extracted Text', text: 'Copy formatted text directly to clipboard or export as TXT.' },
        ],
        faqs: [
            { q: 'Does OCR require an internet connection?', a: 'Once the WASM worker and language data are loaded, recognition runs offline on your CPU.' },
            { q: 'Can I extract text from handwritten notes?', a: 'Printed text yields the highest accuracy; clear handwriting is supported on high-contrast scans.' },
        ],
        article: `
            <p>Convert raster scans into searchable, editable text. Powered by Tesseract OCR compiled to WebAssembly, confidential agreements and medical invoices are parsed with zero third-party disclosure.</p>
        `,
    },
    {
        id: 'color-palette',
        path: 'color-palette-extractor',
        legacyAliases: ['color-palette'],
        title: 'Color Palette Extractor — HEX, RGB & CSS Gradients | ImageKit Pro',
        desc: 'Extract dominant color palettes and CSS gradient code from any image in your browser. Fast, accurate, creative color picker.',
        h1: 'Color Palette Extractor — Dominant Colors & CSS Gradients',
        category: 'design',
        catName: 'Design & Creative',
        catPath: 'image-tools',
        formats: 'JPEG, PNG, WebP, SVG',
        howTo: [
            { step: '1', title: 'Drop Graphic or Photo', text: 'Select any artwork, brand asset, or photograph.' },
            { step: '2', title: 'View Dominant Colors', text: 'Inspect the top 6 to 12 harmonized colors with HEX, RGB, and HSL values.' },
            { step: '3', title: 'Copy CSS & ASE', text: 'One-click copy CSS color codes or export gradient styling for web design.' },
        ],
        faqs: [
            { q: 'How are dominant colors calculated?', a: 'We employ median cut color quantization to cluster pixel values into perceptual palettes.' },
            { q: 'Can I copy HEX codes with one click?', a: 'Yes. Click any color swatch to copy its HEX code instantly to your clipboard.' },
        ],
        article: `
            <p>Speed up creative design workflows by extracting harmonious palettes directly from reference photography and moodboards.</p>
        `,
    },
    {
        id: 'device-mockup',
        path: 'device-mockup-generator',
        legacyAliases: ['device-mockup'],
        title: 'Device Mockup Generator — iPhone, iPad & MacBook | ImageKit Pro',
        desc: 'Create professional screenshots inside realistic iPhone, iPad, and MacBook frames with custom backgrounds. 100% free and in-browser.',
        h1: 'Device Mockup Generator — Professional Hardware Frames',
        category: 'design',
        catName: 'Design & Creative',
        catPath: 'image-tools',
        formats: 'PNG, JPEG, WebP',
        howTo: [
            { step: '1', title: 'Upload UI Screenshot', text: 'Import your app screenshot or website landing page preview.' },
            { step: '2', title: 'Select Device Frame', text: 'Choose from iPhone 15 Pro, MacBook Pro, iPad Pro, or minimalist studio frames.' },
            { step: '3', title: 'Export High-Res Mockup', text: 'Customize shadow depth and background gradients, then export 4K PNGs.' },
        ],
        faqs: [
            { q: 'Are device mockups high resolution?', a: 'Yes. Mockups are rendered with high-DPI canvas output suitable for App Store listings.' },
            { q: 'Can I export with a transparent background?', a: 'Yes. Toggle off the background gradient to export device-only PNGs.' },
        ],
        article: `
            <p>Present app prototypes and portfolio screenshots in stunning 3D device hardware frames. No expensive design subscriptions needed.</p>
        `,
    },
    {
        id: 'ascii-art',
        path: 'image-to-ascii-art',
        legacyAliases: ['ascii-art', 'ascii-art-generator'],
        title: 'ASCII Art Generator — Convert Photos to Text Art | ImageKit Pro',
        desc: 'Convert photos to retro ASCII text art in your browser. Customize character sets, inverted shades, and export as text or PNG.',
        h1: 'ASCII Art Generator — Convert Images to Retro Text Art',
        category: 'design',
        catName: 'Design & Creative',
        catPath: 'image-tools',
        formats: 'JPEG, PNG to ASCII Text/HTML/PNG',
        howTo: [
            { step: '1', title: 'Drop Photo', text: 'Upload any graphic or portrait image.' },
            { step: '2', title: 'Adjust Character Density', text: 'Customize character ramps, matrix width, and invert brightness.' },
            { step: '3', title: 'Copy Text or Save Image', text: 'Copy the raw monospace text or download a retro terminal PNG.' },
        ],
        faqs: [
            { q: 'Can I copy the ASCII text into code comments or terminals?', a: 'Yes. Copy the text block with one click to paste into READMEs, terminals, or code.' },
        ],
        article: `
            <p>Experience the timeless charm of retro ASCII computer graphics. Our client-side mapper translates pixel luminance values into density-matched typographic glyphs.</p>
        `,
    },
    {
        id: 'thumbnail',
        path: 'thumbnail-maker',
        legacyAliases: ['thumbnail'],
        title: 'Thumbnail Maker Online Free — YouTube & Social Media | ImageKit Pro',
        desc: 'Design high-converting YouTube and social media thumbnails in browser. Add bold typography, stickers, badges, and filters.',
        h1: 'YouTube Thumbnail Maker — High-Click-Through Design Canvas',
        category: 'design',
        catName: 'Design & Creative',
        catPath: 'image-tools',
        formats: 'JPEG, PNG (1280x720)',
        howTo: [
            { step: '1', title: 'Select Background', text: 'Upload your focal photo or select dynamic gradient backdrops.' },
            { step: '2', title: 'Add Catchy Headlines', text: 'Type bold typography with drop shadows, stroke outlines, and badge highlights.' },
            { step: '3', title: 'Export 1280×720 Graphic', text: 'Download a lightweight, crisp thumbnail ready for YouTube upload.' },
        ],
        faqs: [
            { q: 'What is the ideal YouTube thumbnail resolution?', a: 'YouTube recommends 1280×720 pixels with a 16:9 aspect ratio and file size under 2MB.' },
        ],
        article: `
            <p>Capture viewer curiosity in competitive video feeds. Design vibrant, high-contrast video thumbnails with custom typography and attention-grabbing frames.</p>
        `,
    },
    {
        id: 'instagram-grid',
        path: 'instagram-grid-splitter',
        legacyAliases: ['instagram-grid'],
        title: 'Instagram Grid Splitter — 3x3, 3x2, 3x1 Carousel | ImageKit Pro',
        desc: 'Split panoramic photos into seamless 3x3, 3x2, or 3x1 Instagram carousel grids. Export numbered tiles or a single ZIP file.',
        h1: 'Instagram Grid Splitter — Split Panoramic Photos into Tiles',
        category: 'social',
        catName: 'Social Media Tools',
        catPath: 'image-tools',
        formats: 'JPEG, PNG, ZIP',
        howTo: [
            { step: '1', title: 'Load Panoramic Photo', text: 'Select a landscape or wide photograph.' },
            { step: '2', title: 'Select Grid Structure', text: 'Choose 3×1, 3×2, or 3×3 tile layouts and align crop boundaries.' },
            { step: '3', title: 'Download Numbered Tiles', text: 'Download each individual tile numbered for sequential posting.' },
        ],
        faqs: [
            { q: 'How do I post the split images to Instagram?', a: 'Post tiles in reverse order (Tile 9 down to Tile 1) so they align correctly on your profile profile grid.' },
        ],
        article: `
            <p>Transform your Instagram profile header into an awe-inspiring giant panoramic mosaic. Precision cutting ensures zero gap artifacts between tiles.</p>
        `,
    },
    {
        id: 'favicon',
        path: 'favicon-generator',
        legacyAliases: ['favicon'],
        title: 'Favicon Generator — ICO, Apple Touch & Manifest | ImageKit Pro',
        desc: 'Generate complete favicon packages: 16x16, 32x32, 180x180 Apple touch icons, manifest.json, and ready-to-paste HTML tags.',
        h1: 'Favicon Generator — Complete Multi-Resolution Icon Package',
        category: 'social',
        catName: 'Social Media Tools',
        catPath: 'image-tools',
        formats: 'ICO, PNG, JSON, HTML',
        howTo: [
            { step: '1', title: 'Drop Your Logo', text: 'Select a high-resolution square logo or graphic.' },
            { step: '2', title: 'Preview All Sizes', text: 'Preview how your icon looks at 16px, 32px, 192px, and in browser tabs.' },
            { step: '3', title: 'Download ZIP & HTML', text: 'Download the compiled favicon ZIP and copy pre-written HTML link tags.' },
        ],
        faqs: [
            { q: 'What favicon sizes are included?', a: 'Includes favicon.ico (16×16, 32×32, 48×48), apple-touch-icon.png (180×180), and android-chrome-512x512.png.' },
        ],
        article: `
            <p>Deliver crisp brand icons across every operating system, bookmark bar, and mobile home screen shortcut with our comprehensive generator.</p>
        `,
    },
    {
        id: 'color-blindness',
        path: 'color-blindness-simulator',
        legacyAliases: ['color-blindness'],
        title: 'Color Blindness Simulator — Accessibility Checker | ImageKit Pro',
        desc: 'Test your designs against Protanopia, Deuteranopia, Tritanopia, and Achromatopsia vision deficiencies. Verify WCAG compliance in browser.',
        h1: 'Color Blindness Simulator — Test Design Accessibility',
        category: 'accessibility',
        catName: 'Accessibility Tools',
        catPath: 'image-tools',
        formats: 'JPEG, PNG, WebP',
        howTo: [
            { step: '1', title: 'Drop UI Design', text: 'Import screenshots of your website, app, charts, or maps.' },
            { step: '2', title: 'Switch Deficiency Filter', text: 'Toggle between Red-blind (Protanopia), Green-blind (Deuteranopia), and Blue-blind (Tritanopia).' },
            { step: '3', title: 'Verify Contrast & Legibility', text: 'Ensure charts and buttons remain distinguishable before pushing to production.' },
        ],
        faqs: [
            { q: 'Why is color vision testing important for UX design?', a: 'Over 8% of men and 0.5% of women have color vision deficiencies. Testing ensures critical data is conveyed via shape as well as color.' },
        ],
        article: `
            <p>Design inclusive digital experiences that meet WCAG 2.1 AA accessibility guidelines. Test charts, badges, and alerts across 8 physiological vision models.</p>
        `,
    },
    {
        id: 'image-comparison',
        path: 'image-comparison-slider',
        legacyAliases: ['image-comparison'],
        title: 'Image Comparison Slider — Before & After | ImageKit Pro',
        desc: 'Compare two images side-by-side with an interactive comparison slider. Keyboard and touch-friendly, export comparison screenshots.',
        h1: 'Before & After Image Comparison Slider — Interactive Visual Diff',
        category: 'accessibility',
        catName: 'Accessibility Tools',
        catPath: 'image-tools',
        formats: 'JPEG, PNG, WebP',
        howTo: [
            { step: '1', title: 'Upload Before & After', text: 'Select your original photo and the edited or compressed variant.' },
            { step: '2', title: 'Drag Comparison Divider', text: 'Slide the interactive separator handle across the canvas.' },
            { step: '3', title: 'Inspect Fine Details', text: 'Zoom in to inspect pixel differences, color grading, or retouched artifacts.' },
        ],
        faqs: [
            { q: 'Can I export the side-by-side comparison?', a: 'Yes. Export a composite comparison graphic to showcase client work or design audits.' },
        ],
        article: `
            <p>Showcase retouched photography, visual regressions, architectural renders, or compression fidelity with smooth split-view sliders.</p>
        `,
    },
]

// 3 Category Hub Pages
const CATEGORIES = [
    {
        slug: 'image-tools',
        title: 'Free Online Image Tools — Resize, Compress, Edit in Browser',
        desc: 'Free browser-based image tools: compress, resize, crop, rotate, extract palettes, convert to ASCII, and remove backgrounds with zero uploads.',
        h1: 'Free Online Image Tools — 100% Private & In-Browser',
        subtitle: 'Professional image editing tools running entirely on your device. No watermarks, no account required, and unlimited free use.',
    },
    {
        slug: 'pdf-tools',
        title: 'Free Online PDF Tools — Image to PDF & PDF to Image',
        desc: 'Convert images to PDF and extract PDF pages to high-resolution PNG in your browser. 100% client-side, confidential documents never leave your computer.',
        h1: 'Free Online PDF Tools — Private In-Browser Conversion',
        subtitle: 'Turn multi-page scans into PDFs or extract crystal-clear images from existing PDF documents without third-party server exposure.',
    },
    {
        slug: 'privacy-tools',
        title: 'Free Privacy & Security Tools — Remove EXIF, OCR, Find Duplicates',
        desc: 'Strip GPS metadata, extract text offline with Tesseract OCR, and find duplicate photos locally without cloud scanning.',
        h1: 'Privacy & Security Image Tools — Strip Metadata & OCR Locally',
        subtitle: 'Protect your location, clean sensitive photo EXIF tags, scan text offline, and detect duplicates securely in your browser.',
    },
]

// 8 In-Depth Guides
const GUIDES = [
    {
        slug: 'how-to-compress-images-without-losing-quality',
        title: 'How to Compress Images Without Losing Quality (Complete 2026 Guide)',
        desc: 'Learn how to reduce image file size by up to 90% without visible quality loss. Discover modern WebP encoding, lossy vs lossless, and free tools.',
        h1: 'How to Compress Images Without Losing Quality',
    },
    {
        slug: 'jpg-vs-png-vs-webp-best-format-websites',
        title: 'JPG vs PNG vs WebP: Which Image Format is Best for Websites?',
        desc: 'Compare JPG, PNG, and WebP for web performance, transparency, and SEO. Learn when to use each format for faster page speed and higher rankings.',
        h1: 'JPG vs PNG vs WebP: Which Image Format is Best for Websites?',
    },
    {
        slug: 'how-to-convert-jpg-to-pdf',
        title: 'How to Convert JPG to PDF for Free Without Uploading Documents',
        desc: 'Step-by-step tutorial on converting multiple JPG and PNG images into a single formatted PDF in your browser. 100% confidential and secure.',
        h1: 'How to Convert JPG to PDF for Free Without Uploading Documents',
    },
    {
        slug: 'how-to-remove-exif-metadata',
        title: 'How to Remove EXIF Metadata and GPS Location from Photos',
        desc: 'Learn what EXIF data your smartphone embeds in photos and how to strip GPS location, camera serial numbers, and timestamps before sharing.',
        h1: 'How to Remove EXIF Metadata and GPS Location from Photos',
    },
    {
        slug: 'how-to-extract-text-from-image-ocr',
        title: 'How to Extract Text from Images and Scanned PDFs Using OCR',
        desc: 'Extract editable text from scanned documents, receipts, and book photos using free in-browser Optical Character Recognition (OCR).',
        h1: 'How to Extract Text from Images and Scanned PDFs Using OCR',
    },
    {
        slug: 'how-to-remove-background-without-photoshop',
        title: 'How to Remove Image Backgrounds Without Photoshop (Free AI Method)',
        desc: 'Remove backgrounds from portrait and product photos in seconds using on-device neural networks. No Photoshop required.',
        h1: 'How to Remove Image Backgrounds Without Photoshop',
    },
    {
        slug: 'social-media-image-sizes-guide',
        title: 'Social Media Image Sizes Guide 2026: Instagram, YouTube, LinkedIn, X',
        desc: 'All official social media dimensions, aspect ratios, and resolutions for Instagram, YouTube, LinkedIn, X, Facebook, and TikTok in 2026.',
        h1: 'Social Media Image Sizes Guide (2026 Updated)',
    },
    {
        slug: 'how-to-make-favicon-for-website',
        title: 'How to Create a Favicon for Your Website: Complete 2026 Guide',
        desc: 'Create ICO, PNG, and Apple touch favicons. Learn the correct dimensions, manifest.json configuration, and HTML head tags for all browsers.',
        h1: 'How to Create a Favicon for Your Website',
    },
]

// Trust Pages
const TRUST_PAGES = [
    {
        path: 'about',
        title: 'About ImageKit Pro — Fast, Private In-Browser Image Utilities',
        desc: 'Learn about ImageKit Pro, built by Alok Kushwaha. Discover our zero-upload privacy architecture, WebAssembly engines, and browser-first design philosophy.',
        h1: 'About ImageKit Pro — Mission & Authorship',
    },
    {
        path: 'privacy',
        title: 'Privacy Policy — 100% Client-Side Guarantee | ImageKit Pro',
        desc: 'ImageKit Pro privacy policy: Zero server uploads, zero cookies, zero image storage. All image and PDF operations run entirely in local browser memory.',
        h1: 'Privacy Policy & Zero Server Upload Guarantee',
    },
    {
        path: 'contact',
        title: 'Contact & Support | ImageKit Pro',
        desc: 'Contact the ImageKit Pro team for support, feature suggestions, or security vulnerability disclosures. We are here to help.',
        h1: 'Contact & Community Feedback',
    },
]

// Helper to replace standard meta tags
function injectMeta(html, { title, desc, url }) {
    return html
        .replace(/<title>.*?<\/title>/is, `<title>${title}</title>`)
        .replace(/<meta\s+name="description"[\s\S]*?\/?>/i, `<meta name="description" content="${desc}" />`)
        .replace(/<link\s+rel="canonical"[\s\S]*?\/?>/i, `<link rel="canonical" href="${url}" />`)
        .replace(/<meta\s+property="og:url"[\s\S]*?\/?>/i, `<meta property="og:url" content="${url}" />`)
        .replace(/<meta\s+property="og:title"[\s\S]*?\/?>/i, `<meta property="og:title" content="${title}" />`)
        .replace(/<meta\s+property="og:description"[\s\S]*?\/?>/i, `<meta property="og:description" content="${desc}" />`)
        .replace(/<meta\s+property="twitter:url"[\s\S]*?\/?>/i, `<meta property="twitter:url" content="${url}" />`)
        .replace(/<meta\s+property="twitter:title"[\s\S]*?\/?>/i, `<meta property="twitter:title" content="${title}" />`)
        .replace(/<meta\s+property="twitter:description"[\s\S]*?\/?>/i, `<meta property="twitter:description" content="${desc}" />`)
}

// Generate all pages
let pageCount = 0
const sitemapUrls = [
    { loc: `${SITE_URL}/`, priority: '1.0', changefreq: 'daily' },
]

// 1. Prerender 20 Tools
for (const tool of TOOLS) {
    const routeUrl = `${SITE_URL}/${tool.path}`
    sitemapUrls.push({ loc: routeUrl, priority: '0.9', changefreq: 'weekly' })

    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'WebApplication',
                '@id': `${routeUrl}#software`,
                name: tool.title,
                url: routeUrl,
                applicationCategory: 'MultimediaApplication',
                operatingSystem: 'Any',
                offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'USD',
                },
                featureList: [
                    '100% Client-Side Processing',
                    'Zero Server Uploads',
                    'High Performance WebAssembly & GPU Acceleration',
                ],
            },
            {
                '@type': 'HowTo',
                '@id': `${routeUrl}#howto`,
                name: `How to use ${tool.h1}`,
                step: tool.howTo.map((h, i) => ({
                    '@type': 'HowToStep',
                    position: i + 1,
                    name: h.title,
                    text: h.text,
                })),
            },
            {
                '@type': 'FAQPage',
                '@id': `${routeUrl}#faq`,
                mainEntity: tool.faqs.map((f) => ({
                    '@type': 'Question',
                    name: f.q,
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: f.a,
                    },
                })),
            },
            {
                '@type': 'BreadcrumbList',
                '@id': `${routeUrl}#breadcrumbs`,
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
                    { '@type': 'ListItem', position: 2, name: tool.catName, item: `${SITE_URL}/${tool.catPath}` },
                    { '@type': 'ListItem', position: 3, name: tool.h1, item: routeUrl },
                ],
            },
        ],
    }

    const howToHtml = tool.howTo.map((h) => `<div class="step-card"><strong>Step ${h.step}: ${h.title}</strong><p>${h.text}</p></div>`).join('')
    const faqHtml = tool.faqs.map((f) => `<div class="faq-item"><h3>${f.q}</h3><p>${f.a}</p></div>`).join('')

    let html = injectMeta(baseTemplate, { title: tool.title, desc: tool.desc, url: routeUrl })
        .replace(
            '</head>',
            `  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n</head>`
        )
        .replace(
            '<div id="root"></div>',
            `<div id="root">
                <main class="main-container" style="padding:2rem 1rem;max-width:1100px;margin:0 auto">
                    <nav aria-label="Breadcrumbs" style="font-size:0.85rem;margin-bottom:1rem;color:#9ca3af">
                        <a href="/" style="color:#6366f1;text-decoration:none">Home</a> / <a href="/${tool.catPath}" style="color:#6366f1;text-decoration:none">${tool.catName}</a> / <span>${tool.h1}</span>
                    </nav>
                    <h1>${tool.h1}</h1>
                    <p style="font-size:1.1rem;color:#d1d5db;margin-bottom:1.5rem">${tool.desc}</p>
                    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);padding:1.5rem;border-radius:12px;margin-bottom:2rem">
                        <p><strong>Supported Formats:</strong> ${tool.formats} · <strong>Privacy:</strong> 100% In-Browser Memory (Zero Cloud Uploads)</p>
                    </div>
                    <h2>How to use this tool</h2>
                    <div class="steps" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1rem;margin-bottom:2.5rem">
                        ${howToHtml}
                    </div>
                    <div class="article-content" style="line-height:1.7;margin-bottom:2.5rem;color:#e5e7eb">
                        ${tool.article}
                    </div>
                    <h2>Frequently Asked Questions</h2>
                    <div class="faq-list" style="margin-top:1rem">
                        ${faqHtml}
                    </div>
                </main>
            </div>`
        )

    const outDir = resolve(distDir, tool.path)
    await mkdir(outDir, { recursive: true })
    await writeFile(resolve(outDir, 'index.html'), html, 'utf8')
    pageCount++

    // Also generate legacy alias redirect pages
    for (const alias of tool.legacyAliases) {
        const aliasDir = resolve(distDir, alias)
        await mkdir(aliasDir, { recursive: true })
        const redirectHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Redirecting to ${tool.title}</title><link rel="canonical" href="${routeUrl}"><meta http-equiv="refresh" content="0; url=/${tool.path}"></head><body><p>Redirecting to <a href="/${tool.path}">/${tool.path}</a>...</p><script>window.location.replace("/${tool.path}");</script></body></html>`
        await writeFile(resolve(aliasDir, 'index.html'), redirectHtml, 'utf8')
    }
}

// 2. Prerender 3 Category Hubs
for (const cat of CATEGORIES) {
    const routeUrl = `${SITE_URL}/${cat.slug}`
    sitemapUrls.push({ loc: routeUrl, priority: '0.8', changefreq: 'weekly' })

    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'CollectionPage',
                '@id': `${routeUrl}#collection`,
                url: routeUrl,
                name: cat.title,
                description: cat.desc,
            },
            {
                '@type': 'BreadcrumbList',
                '@id': `${routeUrl}#breadcrumbs`,
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
                    { '@type': 'ListItem', position: 2, name: cat.title, item: routeUrl },
                ],
            },
        ],
    }

    let html = injectMeta(baseTemplate, { title: cat.title, desc: cat.desc, url: routeUrl })
        .replace('</head>', `  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n</head>`)
        .replace(
            '<div id="root"></div>',
            `<div id="root">
                <main class="main-container" style="padding:2rem 1rem;max-width:1100px;margin:0 auto">
                    <nav aria-label="Breadcrumbs" style="font-size:0.85rem;margin-bottom:1rem;color:#9ca3af">
                        <a href="/" style="color:#6366f1;text-decoration:none">Home</a> / <span>${cat.title}</span>
                    </nav>
                    <h1>${cat.h1}</h1>
                    <p style="font-size:1.15rem;color:#d1d5db;margin-bottom:2rem">${cat.subtitle}</p>
                    <p style="line-height:1.7;color:#e5e7eb">${cat.desc}</p>
                </main>
            </div>`
        )

    const outDir = resolve(distDir, cat.slug)
    await mkdir(outDir, { recursive: true })
    await writeFile(resolve(outDir, 'index.html'), html, 'utf8')
    pageCount++
}

// 3. Prerender Guides Hub & 8 Guides
const guidesHubUrl = `${SITE_URL}/guides`
sitemapUrls.push({ loc: guidesHubUrl, priority: '0.7', changefreq: 'weekly' })

let guidesHubHtml = injectMeta(baseTemplate, {
    title: 'Image & PDF Optimization Guides (2026) | ImageKit Pro',
    desc: 'Comprehensive guides on image compression, format selection (WebP vs JPG vs PNG), PDF conversion, and EXIF privacy stripping.',
    url: guidesHubUrl,
}).replace(
    '<div id="root"></div>',
    `<div id="root">
        <main class="main-container" style="padding:2rem 1rem;max-width:1100px;margin:0 auto">
            <h1>Image & PDF Optimization Guides</h1>
            <p>In-depth technical guides and tutorials written by creative developers.</p>
        </main>
    </div>`
)

const guidesHubDir = resolve(distDir, 'guides')
await mkdir(guidesHubDir, { recursive: true })
await writeFile(resolve(guidesHubDir, 'index.html'), guidesHubHtml, 'utf8')
pageCount++

for (const guide of GUIDES) {
    const routeUrl = `${SITE_URL}/guides/${guide.slug}`
    sitemapUrls.push({ loc: routeUrl, priority: '0.7', changefreq: 'monthly' })

    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Article',
                '@id': `${routeUrl}#article`,
                headline: guide.title,
                description: guide.desc,
                datePublished: '2026-11-01',
                dateModified: TODAY,
                mainEntityOfPage: routeUrl,
                author: {
                    '@type': 'Person',
                    name: 'Alok Kushwaha',
                    url: `${SITE_URL}/about`,
                },
                publisher: {
                    '@type': 'Organization',
                    name: 'ImageKit Pro',
                    url: SITE_URL,
                },
            },
            {
                '@type': 'BreadcrumbList',
                '@id': `${routeUrl}#breadcrumbs`,
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
                    { '@type': 'ListItem', position: 2, name: 'Guides', item: guidesHubUrl },
                    { '@type': 'ListItem', position: 3, name: guide.title, item: routeUrl },
                ],
            },
        ],
    }

    let html = injectMeta(baseTemplate, { title: `${guide.title} | ImageKit Pro`, desc: guide.desc, url: routeUrl })
        .replace('</head>', `  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n</head>`)
        .replace(
            '<div id="root"></div>',
            `<div id="root">
                <main class="main-container" style="padding:2rem 1rem;max-width:900px;margin:0 auto">
                    <nav aria-label="Breadcrumbs" style="font-size:0.85rem;margin-bottom:1rem;color:#9ca3af">
                        <a href="/" style="color:#6366f1;text-decoration:none">Home</a> / <a href="/guides" style="color:#6366f1;text-decoration:none">Guides</a> / <span>${guide.title}</span>
                    </nav>
                    <h1>${guide.h1}</h1>
                    <p style="color:#9ca3af;font-size:0.9rem;margin-bottom:2rem">By Alok Kushwaha · Updated ${TODAY}</p>
                    <p style="line-height:1.8;font-size:1.05rem;color:#e5e7eb">${guide.desc}</p>
                </main>
            </div>`
        )

    const guideDir = resolve(guidesHubDir, guide.slug)
    await mkdir(guideDir, { recursive: true })
    await writeFile(resolve(guideDir, 'index.html'), html, 'utf8')
    pageCount++
}

// 4. Prerender Trust Pages (about, privacy, contact)
for (const page of TRUST_PAGES) {
    const routeUrl = `${SITE_URL}/${page.path}`
    sitemapUrls.push({ loc: routeUrl, priority: '0.5', changefreq: 'monthly' })

    let html = injectMeta(baseTemplate, { title: page.title, desc: page.desc, url: routeUrl }).replace(
        '<div id="root"></div>',
        `<div id="root">
            <main class="main-container" style="padding:2rem 1rem;max-width:900px;margin:0 auto">
                <nav aria-label="Breadcrumbs" style="font-size:0.85rem;margin-bottom:1rem;color:#9ca3af">
                    <a href="/" style="color:#6366f1;text-decoration:none">Home</a> / <span>${page.title}</span>
                </nav>
                <h1>${page.h1}</h1>
                <p style="line-height:1.7;color:#e5e7eb">${page.desc}</p>
            </main>
        </div>`
    )

    const pageDir = resolve(distDir, page.path)
    await mkdir(pageDir, { recursive: true })
    await writeFile(resolve(pageDir, 'index.html'), html, 'utf8')
    pageCount++
}

// 5. Generate 404.html with noindex
const notFoundHtml = injectMeta(baseTemplate, {
    title: '404: Page Not Found | ImageKit Pro',
    desc: 'The requested tool or page could not be found. Explore 20 free in-browser image tools on ImageKit Pro.',
    url: `${SITE_URL}/404`,
})
    .replace('</head>', '  <meta name="robots" content="noindex, follow" />\n</head>')
    .replace(
    '<div id="root"></div>',
    `<div id="root">
        <main class="main-container" style="padding:4rem 1rem;text-align:center;max-width:700px;margin:0 auto">
            <h1 style="font-size:3rem;margin-bottom:1rem">404</h1>
            <h2>Page Not Found</h2>
            <p style="color:#9ca3af;margin:1rem 0 2rem">The link you followed may be broken or the page has been moved.</p>
            <a href="/" style="display:inline-block;background:#6366f1;color:#fff;padding:0.75rem 1.5rem;border-radius:8px;text-decoration:none;font-weight:500">Go to Homepage</a>
        </main>
    </div>`
)
await writeFile(resolve(distDir, '404.html'), notFoundHtml, 'utf8')
pageCount++

// 6. Generate Dynamic sitemap.xml with <lastmod>
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls
    .map(
        (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join('\n')}
</urlset>
`
await writeFile(resolve(distDir, 'sitemap.xml'), sitemapXml, 'utf8')
await writeFile(resolve(publicDir, 'sitemap.xml'), sitemapXml, 'utf8')

console.log(`Prerendered ${pageCount} static HTML route pages in dist/ and generated sitemap.xml with ${sitemapUrls.length} canonical URLs.`)
