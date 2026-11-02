import React, { useEffect } from 'react'
import { ALL_TOOLS, TOOL_PATHS, Tool } from '../../constants/tools'
import { SITE_URL } from '../../constants/site'
import { ArrowRight, ShieldCheck, Zap, Lock, Sparkles } from 'lucide-react'

export type CategorySlug = 'image-tools' | 'pdf-tools' | 'privacy-tools'

interface CategoryConfig {
    title: string
    metaTitle: string
    metaDescription: string
    h1: string
    subtitle: string
    intro: string
    highlights: Array<{ title: string; desc: string }>
    toolCategories: string[]
}

const CATEGORY_MAP: Record<CategorySlug, CategoryConfig> = {
    'image-tools': {
        title: 'Free Online Image Tools — Resize, Compress, Edit in Browser',
        metaTitle: 'Free Online Image Tools — Fast & Private | ImageKit Pro',
        metaDescription: 'Free browser-based image tools: compress, resize, crop, rotate, extract palettes, convert to ASCII, and remove backgrounds with zero uploads.',
        h1: 'Free Online Image Tools — 100% Private & In-Browser',
        subtitle: 'Professional image editing tools running entirely on your device. No watermarks, no account required, and unlimited free use.',
        intro: 'ImageKit Pro provides high-performance client-side image editing utilities powered by HTML5 Canvas, WebGL, and Web Workers. Your files are processed locally on your CPU/GPU and never sent across the internet, guaranteeing complete data sovereignty and zero upload wait times.',
        highlights: [
            { title: 'Zero Uploads', desc: 'All operations run in local browser RAM. No servers see your photographs.' },
            { title: 'Lossless & Perceptual Compression', desc: 'Reduce file sizes up to 90% with WebP and modern quantizers.' },
            { title: 'Batch & Instant Preview', desc: 'Real-time side-by-side rendering with instant export.' },
        ],
        toolCategories: ['core', 'edit', 'design', 'social', 'accessibility'],
    },
    'pdf-tools': {
        title: 'Free Online PDF Tools — Image to PDF & PDF to Image',
        metaTitle: 'Free Online PDF Tools — Convert Private In-Browser | ImageKit Pro',
        metaDescription: 'Convert images to PDF and extract PDF pages to high-resolution PNG in your browser. 100% client-side, confidential documents never leave your computer.',
        h1: 'Free Online PDF Tools — Private In-Browser Conversion',
        subtitle: 'Turn multi-page scans into PDFs or extract crystal-clear images from existing PDF documents without third-party server exposure.',
        intro: 'Handling sensitive tax records, contracts, identity papers, or business presentations requires uncompromising confidentiality. Our PDF tools leverage Mozilla PDF.js and jsPDF running inside sandboxed Web Workers directly in your browser tab, ensuring not a single byte touches external cloud servers.',
        highlights: [
            { title: 'Confidentiality Guaranteed', desc: 'Contracts, receipts, and IDs never upload to an unknown cloud.' },
            { title: 'High-Resolution Extraction', desc: 'Render PDF vectors at up to 300 DPI for pristine print-ready PNGs.' },
            { title: 'Multi-Image PDF Assembly', desc: 'Combine multiple JPEGs, PNGs, and WebPs into a clean, uniform PDF.' },
        ],
        toolCategories: ['pdf'],
    },
    'privacy-tools': {
        title: 'Free Privacy & Security Tools — Remove EXIF, OCR, Find Duplicates',
        metaTitle: 'Free Image Privacy Tools — Clean EXIF & OCR | ImageKit Pro',
        metaDescription: 'Strip GPS metadata, extract text offline with Tesseract OCR, and find duplicate photos locally without cloud scanning.',
        h1: 'Privacy & Security Image Tools — Strip Metadata & OCR Locally',
        subtitle: 'Protect your location, clean sensitive photo EXIF tags, scan text offline, and detect duplicates securely in your browser.',
        intro: 'Modern digital photographs embed precise GPS coordinates, camera serial numbers, and personal timestamps. Our privacy suite strips EXIF and IPTC metadata down to zero, extracts OCR text using on-device WebAssembly engines, and hashes photo similarity with local Hamming distance algorithms.',
        highlights: [
            { title: 'GPS & Metadata Stripping', desc: 'Purge geolocation, device identifiers, and date tags before sharing.' },
            { title: 'Local Offline OCR', desc: 'Recognize text across 12 languages with Tesseract WASM without sending images away.' },
            { title: 'Perceptual Duplicate Detection', desc: 'Detect duplicate images locally in RAM using 64-bit dHash.' },
        ],
        toolCategories: ['privacy'],
    },
}

interface CategoryPageProps {
    slug: CategorySlug
    onSelectTool: (id: string) => void
}

export const CategoryPage: React.FC<CategoryPageProps> = ({ slug, onSelectTool }) => {
    const config = CATEGORY_MAP[slug] || CATEGORY_MAP['image-tools']
    const matchingTools = ALL_TOOLS.filter((t) => config.toolCategories.includes(t.category))

    useEffect(() => {
        document.title = config.metaTitle
        const metaDesc = document.querySelector('meta[name="description"]')
        if (metaDesc) metaDesc.setAttribute('content', config.metaDescription)

        let canonical = document.querySelector('link[rel="canonical"]')
        if (!canonical) {
            canonical = document.createElement('link')
            canonical.setAttribute('rel', 'canonical')
            document.head.appendChild(canonical)
        }
        canonical.setAttribute('href', `${SITE_URL}/${slug}`)
    }, [config, slug])

    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'CollectionPage',
                '@id': `${SITE_URL}/${slug}#collection`,
                url: `${SITE_URL}/${slug}`,
                name: config.title,
                description: config.metaDescription,
                isPartOf: {
                    '@type': 'WebSite',
                    '@id': `${SITE_URL}/#website`,
                    name: 'ImageKit Pro',
                    url: SITE_URL,
                },
            },
            {
                '@type': 'BreadcrumbList',
                '@id': `${SITE_URL}/${slug}#breadcrumbs`,
                itemListElement: [
                    {
                        '@type': 'ListItem',
                        position: 1,
                        name: 'Home',
                        item: SITE_URL,
                    },
                    {
                        '@type': 'ListItem',
                        position: 2,
                        name: config.title,
                        item: `${SITE_URL}/${slug}`,
                    },
                ],
            },
        ],
    }

    return (
        <div className="seo-hub-page">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <header className="seo-hub-hero">
                <nav className="seo-breadcrumbs" aria-label="Breadcrumbs">
                    <a href="/" onClick={(e) => { e.preventDefault(); onSelectTool('home'); }}>Home</a>
                    <span className="sep">/</span>
                    <span className="current">{config.title}</span>
                </nav>

                <h1>{config.h1}</h1>
                <p className="seo-hub-subtitle">{config.subtitle}</p>

                <div className="seo-hub-badge-row">
                    <span className="seo-badge"><ShieldCheck size={14} /> 100% Client-Side Memory</span>
                    <span className="seo-badge"><Lock size={14} /> Zero Cloud Uploads</span>
                    <span className="seo-badge"><Zap size={14} /> Instant GPU/WASM Processing</span>
                </div>
            </header>

            <section className="seo-hub-intro-card">
                <p>{config.intro}</p>
            </section>

            <section className="seo-hub-highlights">
                {config.highlights.map((h, i) => (
                    <div key={i} className="seo-highlight-card">
                        <Sparkles size={20} className="seo-highlight-icon" />
                        <h3>{h.title}</h3>
                        <p>{h.desc}</p>
                    </div>
                ))}
            </section>

            <section className="seo-hub-tools-section">
                <h2>Available Tools ({matchingTools.length})</h2>
                <div className="seo-hub-tools-grid">
                    {matchingTools.map((t) => (
                        <div
                            key={t.id}
                            className="seo-hub-tool-card"
                            onClick={() => onSelectTool(t.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter') onSelectTool(t.id); }}
                        >
                            <div className="seo-tool-card-icon">{t.icon}</div>
                            <div className="seo-tool-card-body">
                                <h3>{t.title}</h3>
                                <p>{t.description}</p>
                            </div>
                            <a
                                href={TOOL_PATHS[t.id as Tool]}
                                className="seo-tool-card-link"
                                onClick={(e) => {
                                    e.preventDefault()
                                    onSelectTool(t.id)
                                }}
                            >
                                Open Tool <ArrowRight size={14} />
                            </a>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}

export default CategoryPage
