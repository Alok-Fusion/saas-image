export const SITE_URL = (
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SITE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_SITE_URL) ||
  'https://imagekitpro.cc'
).replace(/\/$/, '');
export const SITE_NAME = 'ImageKit Pro';
export const OG_IMAGE = `${SITE_URL}/og-image.png`;

export interface ToolSeo {
  slug: string;
  name: string;
  title: string;
  description: string;
  h1: string;
  category: 'Image' | 'PDF' | 'Privacy' | 'Design' | 'Social';
  toolId: string;
}

export const titleFor = (core: string) => `${core} | ${SITE_NAME}`;

export const TOOLS_SEO: ToolSeo[] = [
  {
    slug: 'compress-image',
    name: 'Image Compressor',
    title: 'Compress Image Online Free - Reduce Size',
    description: 'Compress JPG, PNG and WebP images online for free. Reduce file size up to 90% with no visible quality loss. No signup, no upload, runs in your browser.',
    h1: 'Compress Images Online',
    category: 'Image',
    toolId: 'compressor',
  },
  {
    slug: 'resize-image',
    name: 'Image Resizer',
    title: 'Resize Image Online Free - Exact Pixels',
    description: 'Resize images to exact pixels or percentage online for free. Keep the aspect ratio, pick a format and download instantly. Private, no signup.',
    h1: 'Resize Images Online',
    category: 'Image',
    toolId: 'resizer',
  },
  {
    slug: 'remove-background',
    name: 'Background Remover',
    title: 'Remove Background from Image Free - No Signup',
    description: 'Remove the background from any photo in seconds with AI. Free, no signup, no watermark, and your image never leaves your device.',
    h1: 'Remove Image Background',
    category: 'Image',
    toolId: 'background-remover',
  },
  {
    slug: 'crop-image',
    name: 'Image Cropper',
    title: 'Crop Image Online Free - Custom Aspect Ratios',
    description: 'Crop photos online with free-form or fixed ratios like 1:1, 16:9 and 4:5. Fast, private, no signup and no watermark.',
    h1: 'Crop Images Online',
    category: 'Image',
    toolId: 'cropper',
  },
  {
    slug: 'rotate-image',
    name: 'Image Rotator',
    title: 'Rotate & Flip Image Online Free',
    description: 'Rotate images 90, 180 or any angle and flip them horizontally or vertically. Free, instant and processed in your browser.',
    h1: 'Rotate and Flip Images',
    category: 'Image',
    toolId: 'rotator',
  },
  {
    slug: 'add-watermark',
    name: 'Watermark Adder',
    title: 'Add Watermark to Photos Online Free',
    description: 'Add text or logo watermarks to your photos in bulk. Control position, size and opacity. Free, private and no signup needed.',
    h1: 'Add a Watermark to Images',
    category: 'Image',
    toolId: 'watermark',
  },
  {
    slug: 'remove-watermark',
    name: 'Watermark Remover',
    title: 'Remove Watermark from Image Free',
    description: 'Remove watermarks and unwanted objects from your own images online. Free, private, and nothing is uploaded to a server.',
    h1: 'Remove Watermark from Images',
    category: 'Image',
    toolId: 'watermark-remover',
  },
  {
    slug: 'image-to-pdf',
    name: 'Image to PDF',
    title: 'Image to PDF Converter - JPG, PNG to PDF Free',
    description: 'Convert JPG, PNG and WebP images to a single PDF. Reorder pages, choose page size and download. Free, no signup, no upload.',
    h1: 'Convert Images to PDF',
    category: 'PDF',
    toolId: 'image-to-pdf',
  },
  {
    slug: 'pdf-to-image',
    name: 'PDF to Image',
    title: 'PDF to Image Converter - PDF to JPG, PNG Free',
    description: 'Turn every PDF page into a high-quality JPG or PNG. Free, works offline in your browser, and your file is never uploaded.',
    h1: 'Convert PDF to Images',
    category: 'PDF',
    toolId: 'pdf-to-image',
  },
  {
    slug: 'remove-exif-data',
    name: 'EXIF Cleaner',
    title: 'Remove EXIF Data from Photos - Free Cleaner',
    description: 'Strip GPS location, camera details and other hidden metadata from photos before you share them. Free and fully private.',
    h1: 'Remove EXIF Data from Photos',
    category: 'Privacy',
    toolId: 'exif-cleaner',
  },
  {
    slug: 'find-duplicate-images',
    name: 'Duplicate Finder',
    title: 'Find Duplicate Images Online - Free Finder',
    description: 'Find duplicate and near-duplicate photos using perceptual hashing. Free, private, and your images stay on your device.',
    h1: 'Find Duplicate Images',
    category: 'Privacy',
    toolId: 'duplicate-finder',
  },
  {
    slug: 'image-to-text',
    name: 'OCR Text Extractor',
    title: 'Image to Text Converter - Free Online OCR',
    description: 'Extract text from images and screenshots with free OCR. Supports many languages. No signup, and your image is never uploaded.',
    h1: 'Extract Text from Images',
    category: 'Image',
    toolId: 'ocr',
  },
  {
    slug: 'color-palette-extractor',
    name: 'Palette Extractor',
    title: 'Color Palette Generator from Image - Free',
    description: 'Extract dominant colors from any image and copy HEX or RGB codes. Free palette generator that runs in your browser.',
    h1: 'Extract Colors from an Image',
    category: 'Design',
    toolId: 'color-palette',
  },
  {
    slug: 'instagram-grid-splitter',
    name: 'Grid Splitter',
    title: 'Instagram Grid Splitter - Split Photo Free',
    description: 'Split one photo into a 3x3 or custom grid for Instagram and download all tiles as a ZIP. Free, no signup.',
    h1: 'Split an Image into an Instagram Grid',
    category: 'Social',
    toolId: 'instagram-grid',
  },
  {
    slug: 'favicon-generator',
    name: 'Favicon Generator',
    title: 'Favicon Generator - Create ICO & PNG Free',
    description: 'Generate favicon.ico, PNG sizes, Apple touch icon and a web manifest from one image. Free and ready to paste into your site.',
    h1: 'Generate Favicons',
    category: 'Design',
    toolId: 'favicon',
  },
  {
    slug: 'device-mockup-generator',
    name: 'Device Mockup',
    title: 'Device Mockup Generator - Phone & Laptop Free',
    description: 'Put your screenshot inside a phone, tablet or laptop frame in seconds. Free mockup generator, no signup, no watermark.',
    h1: 'Create Device Mockups',
    category: 'Design',
    toolId: 'device-mockup',
  },
  {
    slug: 'color-blindness-simulator',
    name: 'Color Blindness Simulator',
    title: 'Color Blindness Simulator - Test Your Image',
    description: 'See how your image looks with protanopia, deuteranopia and tritanopia. Free accessibility check that runs in your browser.',
    h1: 'Color Blindness Simulator',
    category: 'Design',
    toolId: 'color-blindness',
  },
  {
    slug: 'image-to-ascii-art',
    name: 'ASCII Art Generator',
    title: 'Image to ASCII Art Generator - Free Online',
    description: 'Convert any image to ASCII text art. Adjust width, density and character set, then copy or download. Free and instant.',
    h1: 'Convert Images to ASCII Art',
    category: 'Design',
    toolId: 'ascii-art',
  },
  {
    slug: 'image-comparison-slider',
    name: 'Comparison Slider',
    title: 'Before After Image Comparison Slider - Free',
    description: 'Compare two images with a draggable before and after slider. Great for edits, restorations and design reviews. Free.',
    h1: 'Before and After Image Slider',
    category: 'Design',
    toolId: 'image-comparison',
  },
  {
    slug: 'thumbnail-maker',
    name: 'Thumbnail Maker',
    title: 'YouTube Thumbnail Maker - Free Online',
    description: 'Create eye-catching 1280x720 thumbnails with text, emojis and effects. Free thumbnail maker, no signup and no watermark.',
    h1: 'Make YouTube Thumbnails',
    category: 'Social',
    toolId: 'thumbnail',
  },
];

export const TOOL_BY_SLUG = new Map<string, ToolSeo>(
  TOOLS_SEO.map((t) => [t.slug, t])
);

export const TOOL_BY_ID = new Map<string, ToolSeo>(
  TOOLS_SEO.map((t) => [t.toolId, t])
);
