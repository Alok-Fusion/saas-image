export interface GuideArticle {
    slug: string;
    title: string;
    metaTitle: string;
    metaDescription: string;
    readTime: string;
    publishDate: string;
    primaryToolId: string;
    primaryToolSlug: string;
    primaryToolCta: string;
    summary: string;
    contentHtml: string;
    aliases?: string[];
}

export const GUIDES: GuideArticle[] = [
    {
        slug: 'reduce-image-size-without-losing-quality',
        aliases: ['how-to-compress-images-without-losing-quality'],
        title: 'How to Reduce Image Size Without Losing Quality (2026 Guide)',
        metaTitle: 'Reduce Image Size Without Losing Quality | ImageKit Pro',
        metaDescription: 'Learn how to reduce image file size by up to 90% without visible quality loss. Discover modern WebP encoding, lossy vs lossless, and free browser tools.',
        readTime: '4 min read',
        publishDate: '2026-11-01',
        primaryToolId: 'compressor',
        primaryToolSlug: 'compress-image',
        primaryToolCta: 'Compress Images Free in Browser',
        summary: 'Oversized images slow down website page speed, eat mobile data, and trigger email attachment size errors. Here is how modern compression algorithms reduce file sizes by up to 90% without degrading visual sharpness.',
        contentHtml: `
            <p>Whether you manage an e-commerce storefront, run a blog, or need to email photos, large image files are a major obstacle. Slow page load times hurt Google Core Web Vitals rankings, while massive JPEG and PNG files rapidly consume disk space.</p>

            <h2>Lossy vs Lossless Image Compression</h2>
            <p><strong>Lossless compression</strong> reduces file size by eliminating redundant metadata and optimizing internal byte encodings. The decoded pixel matrix remains identical down to the individual bit. This is ideal for medical scans and archival photography.</p>
            <p><strong>Lossy compression</strong> discards subtle high-frequency color variations that the human visual cortex cannot discern under normal viewing conditions. Perceptual quantization achieves 70% to 90% size reductions with no perceptible loss of sharpness.</p>

            <h2>Best Formats: WebP vs JPEG vs PNG</h2>
            <p>For photographic content on modern websites, <strong>WebP</strong> provides superior compression, saving 25% to 35% compared to legacy JPEG at equivalent visual fidelity. Use <strong>PNG</strong> only when crisp text overlays or alpha transparency channels are required.</p>

            <h2>Step-by-Step Compression Guide</h2>
            <ol>
                <li>Open the <a href="/compress-image">ImageKit Pro Image Compressor</a>.</li>
                <li>Drag and drop your JPEG, PNG, or WebP photo into the workspace.</li>
                <li>Adjust the quality slider to 75%–85% for photos, or 60%–70% for web banners.</li>
                <li>Verify the real-time size reduction counter and export your optimized file instantly.</li>
            </ol>
        `,
    },
    {
        slug: 'jpg-vs-png-vs-webp',
        aliases: ['jpg-vs-png-vs-webp-best-format-websites'],
        title: 'JPG vs PNG vs WebP: Which Image Format is Best for Websites?',
        metaTitle: 'JPG vs PNG vs WebP: Best Image Format for Web (2026)',
        metaDescription: 'Compare JPG, PNG, and WebP for web performance, transparency, and SEO. Learn when to use each format for faster page speed and higher rankings.',
        readTime: '5 min read',
        publishDate: '2026-11-01',
        primaryToolId: 'compressor',
        primaryToolSlug: 'compress-image',
        primaryToolCta: 'Convert & Optimize Images in Browser',
        summary: 'Choosing the wrong image format inflates website weight and degrades user experience. Understand the technical trade-offs between JPG, PNG, and WebP.',
        contentHtml: `
            <p>Selecting the right file extension is one of the highest-leverage optimizations for frontend web developers. Serving heavy uncompressed PNG files when WebP would suffice adds megabytes of unnecessary payload to every page load.</p>

            <h2>Quick Comparison Table</h2>
            <ul>
                <li><strong>JPG / JPEG:</strong> Best for real-world photography without transparency. Universal browser support, lossy compression.</li>
                <li><strong>PNG:</strong> Best for screenshots, illustrations, and logos with crisp vector-like edges and alpha transparency channels. Larger file sizes.</li>
                <li><strong>WebP:</strong> The modern web standard developed by Google. Supports both lossy and lossless modes, alpha transparency, and delivers 25%–35% smaller sizes than JPG.</li>
            </ul>

            <h2>When to Use WebP</h2>
            <p>As of 2026, over 97% of global web browsers natively decode WebP. Modern web performance budgets mandate using WebP as the default format for storefront banners, hero backgrounds, and editorial pictures.</p>
        `,
    },
    {
        slug: 'convert-jpg-to-pdf',
        aliases: ['how-to-convert-jpg-to-pdf'],
        title: 'How to Convert JPG to PDF for Free Without Uploading Documents',
        metaTitle: 'Convert JPG to PDF Free & Private in Browser | ImageKit Pro',
        metaDescription: 'Step-by-step tutorial on converting multiple JPG and PNG images into a single formatted PDF in your browser. 100% confidential and secure.',
        readTime: '3 min read',
        publishDate: '2026-11-01',
        primaryToolId: 'image-to-pdf',
        primaryToolSlug: 'image-to-pdf',
        primaryToolCta: 'Convert Images to PDF Free',
        summary: 'Need to submit scanned tax records, medical receipts, or identity documents as a PDF? Here is how to combine multiple images into a single PDF without uploading them to cloud servers.',
        contentHtml: `
            <p>Government agencies, universities, and corporate portals frequently require paperwork submitted as a single unified PDF document rather than separate image attachments.</p>

            <h2>Why Cloud PDF Converters are a Security Risk</h2>
            <p>Most free online PDF converters transmit your uploaded files to third-party servers where they may be stored, indexed, or analyzed. When converting sensitive documents like bank statements, driver licenses, or signed contracts, cloud conversion creates serious privacy risks.</p>

            <h2>Converting Images Locally in Browser</h2>
            <p>ImageKit Pro uses client-side JavaScript (jsPDF) running directly in your web browser tab. Documents are assembled in local RAM and exported directly to your Downloads folder without touching any remote API.</p>

            <ol>
                <li>Open the <a href="/image-to-pdf">Image to PDF tool</a>.</li>
                <li>Drop all images you want to include in the document.</li>
                <li>Drag tiles to rearrange page sequence.</li>
                <li>Click <strong>Export PDF</strong> to instantly compile your document.</li>
            </ol>
        `,
    },
    {
        slug: 'remove-exif-data-before-sharing',
        aliases: ['how-to-remove-exif-metadata'],
        title: 'How to Remove EXIF Metadata and GPS Location from Photos',
        metaTitle: 'Remove EXIF Metadata from Photos Free | ImageKit Pro',
        metaDescription: 'Learn what EXIF data your smartphone embeds in photos and how to strip GPS location, camera serial numbers, and timestamps before sharing.',
        readTime: '4 min read',
        publishDate: '2026-11-01',
        primaryToolId: 'exif-cleaner',
        primaryToolSlug: 'remove-exif-data',
        primaryToolCta: 'Strip EXIF & GPS Data Free',
        summary: 'Digital photos from smartphones quietly record your exact home latitude, longitude, and device serial numbers. Learn how to scrub this data clean before posting online.',
        contentHtml: `
            <p>Every time you take a photo with an iPhone or Android smartphone, the camera firmware automatically injects Exchangeable Image File Format (EXIF) headers directly into the image binary.</p>

            <h2>What Data is Hidden in Your Photos?</h2>
            <ul>
                <li><strong>GPS Coordinates:</strong> Exact latitude and longitude where the shutter clicked, often pinpointing your home address.</li>
                <li><strong>Camera Identifiers:</strong> Phone model, lens serial number, and firmware version.</li>
                <li><strong>Timestamps:</strong> Exact date, hour, minute, and second of capture.</li>
            </ul>

            <h2>How to Strip EXIF Metadata in Seconds</h2>
            <p>Use the <a href="/remove-exif-data">ImageKit Pro EXIF Privacy Cleaner</a> to inspect and strip all metadata headers locally before uploading photos to public forums or classified ads.</p>
        `,
    },
    {
        slug: 'compress-image-to-100kb',
        title: 'How to Compress an Image to Under 100KB for Web & Forms',
        metaTitle: 'Compress Image to 100KB Online Free | ImageKit Pro',
        metaDescription: 'Learn how to compress JPG and PNG images to under 100KB for passport applications, government portals, and web upload limits.',
        readTime: '3 min read',
        publishDate: '2026-11-01',
        primaryToolId: 'compressor',
        primaryToolSlug: 'compress-image',
        primaryToolCta: 'Compress Images Under 100KB',
        summary: 'Many job applications, university submission portals, and government forms enforce a strict 100KB or 200KB file size limit. Here is how to meet it without blurry pixelation.',
        contentHtml: `
            <p>Encountering a "file size must be under 100KB" validation error when submitting an online form is frustrating. Often, simply reducing JPEG quality to 10% produces illegible blur.</p>

            <h2>The Two-Step Strategy: Resize First, Then Compress</h2>
            <p>A 24-megapixel smartphone photo (6000×4000 pixels) cannot comfortably fit into 100KB without extreme compression artifacts. The secret is downsampling dimensions first:</p>
            <ol>
                <li>Resize width to 1200–1600 pixels using the <a href="/resize-image">Image Resizer</a>.</li>
                <li>Open the <a href="/compress-image">Image Compressor</a> and select 75% quality.</li>
                <li>Check the real-time byte counter to verify the output is under 100KB.</li>
            </ol>
        `,
    },
    {
        slug: 'remove-a-background-for-free',
        aliases: ['how-to-remove-background-without-photoshop'],
        title: 'How to Remove a Background for Free Without Photoshop',
        metaTitle: 'Remove Background from Image Free - AI Method | ImageKit Pro',
        metaDescription: 'Remove backgrounds from portrait and product photos in seconds using on-device neural networks. 100% free, private, no sign-up.',
        readTime: '4 min read',
        publishDate: '2026-11-01',
        primaryToolId: 'background-remover',
        primaryToolSlug: 'remove-background',
        primaryToolCta: 'Remove Background with On-Device AI',
        summary: 'Creating product cutouts, professional headshots, or YouTube thumbnails traditionally required expensive Photoshop licenses. Here is how modern on-device AI handles it in seconds.',
        contentHtml: `
            <p>E-commerce sellers on Amazon, Shopify, and eBay require clean white or transparent backgrounds for product catalogs. In the past, this meant manually tracing pen paths or paying per-image subscription services.</p>

            <h2>On-Device WebAssembly AI</h2>
            <p>ImageKit Pro executes state-of-the-art neural segmentation models directly in your browser using ONNX Runtime Web and WebAssembly. Your photos are never sent to external servers, and processing is completely free with no usage caps.</p>
        `,
    },
    {
        slug: 'extract-text-from-an-image',
        aliases: ['how-to-extract-text-from-image-ocr'],
        title: 'How to Extract Text from an Image Using Free In-Browser OCR',
        metaTitle: 'Extract Text from Images & Scanned PDFs Free | ImageKit Pro',
        metaDescription: 'Extract editable text from scanned documents, receipts, and book photos using free in-browser Optical Character Recognition (OCR).',
        readTime: '3 min read',
        publishDate: '2026-11-01',
        primaryToolId: 'ocr',
        primaryToolSlug: 'image-to-text',
        primaryToolCta: 'Extract Text with In-Browser OCR',
        summary: 'Need to copy text trapped inside a screenshot, scanned contract, or receipt? Optical Character Recognition (OCR) converts pixels into selectable, editable text.',
        contentHtml: `
            <p>Retyping long printed contracts, book passages, or expense receipts by hand wastes hours. Modern in-browser OCR reads glyphs directly from image bitmaps.</p>

            <h2>Tesseract WebAssembly Engine</h2>
            <p>Using <a href="/image-to-text">ImageKit Pro OCR</a>, recognition is executed locally using the Tesseract.js WebAssembly engine. Support for over a dozen languages allows you to transcribe receipts, business cards, and documents with high precision.</p>
        `,
    },
    {
        slug: 'resize-images-for-instagram',
        aliases: ['social-media-image-sizes-guide'],
        title: 'How to Resize Images for Instagram: Feed, Story & Carousel (2026)',
        metaTitle: 'Resize Images for Instagram Correctly (2026) | ImageKit Pro',
        metaDescription: 'All official Instagram aspect ratios and pixel dimensions for posts, stories, reels, and profiles. Resize photos with one click.',
        readTime: '4 min read',
        publishDate: '2026-11-01',
        primaryToolId: 'resizer',
        primaryToolSlug: 'resize-image',
        primaryToolCta: 'Resize for Instagram with Exact Presets',
        summary: 'Posting photos with incorrect dimensions causes Instagram to stretch or crop critical elements. Master the three primary Instagram aspect ratios: Square, Portrait, and Story.',
        contentHtml: `
            <p>Instagram enforces strict aspect ratio rules. If you upload a horizontal 16:9 photo to your feed, it appears small with black bars. If you upload an overly tall image, Instagram crops off the top and bottom.</p>

            <h2>Official 2026 Instagram Dimensions</h2>
            <ul>
                <li><strong>Square Post (1:1):</strong> 1080 × 1080 pixels. The classic standard.</li>
                <li><strong>Portrait Post (4:5):</strong> 1080 × 1350 pixels. Occupies the maximum vertical screen space in mobile feeds.</li>
                <li><strong>Story / Reel (9:16):</strong> 1080 × 1920 pixels. Full-screen mobile experience.</li>
            </ul>

            <p>Use the <a href="/resize-image">Social Media Resizer</a> to apply these exact presets in one click.</p>
        `,
    },
];

export const GUIDE_BY_SLUG = new Map<string, GuideArticle>(
    GUIDES.flatMap((g) => {
        const pairs: [string, GuideArticle][] = [[g.slug, g]];
        if (g.aliases) {
            for (const alias of g.aliases) {
                pairs.push([alias, g]);
            }
        }
        return pairs;
    })
);
