import React, { useEffect } from 'react'
import { GUIDES } from '../../data/guidesData'
import { SITE_URL } from '../../constants/site'
import { BookOpen, Clock, Calendar, ArrowRight, Shield } from 'lucide-react'

interface GuidesHubProps {
    onNavigate: (path: string) => void
    onSelectTool: (id: string) => void
}

export const GuidesHub: React.FC<GuidesHubProps> = ({ onNavigate, onSelectTool }) => {
    useEffect(() => {
        document.title = 'Image & PDF Optimization Guides (2026) | ImageKit Pro'
        const metaDesc = document.querySelector('meta[name="description"]')
        if (metaDesc) {
            metaDesc.setAttribute(
                'content',
                'Comprehensive guides on image compression, format selection (WebP vs JPG vs PNG), PDF conversion, EXIF privacy stripping, and social media dimensions.'
            )
        }

        let canonical = document.querySelector('link[rel="canonical"]')
        if (!canonical) {
            canonical = document.createElement('link')
            canonical.setAttribute('rel', 'canonical')
            document.head.appendChild(canonical)
        }
        canonical.setAttribute('href', `${SITE_URL}/guides`)
    }, [])

    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'CollectionPage',
                '@id': `${SITE_URL}/guides#collection`,
                url: `${SITE_URL}/guides`,
                name: 'Image & PDF Optimization Guides (2026)',
                description: 'In-depth articles and tutorials on digital image optimization, format conversions, privacy stripping, and vector rendering.',
                isPartOf: {
                    '@type': 'WebSite',
                    '@id': `${SITE_URL}/#website`,
                    name: 'ImageKit Pro',
                    url: SITE_URL,
                },
            },
            {
                '@type': 'BreadcrumbList',
                '@id': `${SITE_URL}/guides#breadcrumbs`,
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
                        name: 'Guides',
                        item: `${SITE_URL}/guides`,
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
                    <span className="current">Guides</span>
                </nav>

                <h1>Image & PDF Optimization Guides</h1>
                <p className="seo-hub-subtitle">
                    Practical, in-depth tutorials on image compression, format conversion, web performance, and privacy protection written by creative developers.
                </p>

                <div className="seo-hub-badge-row">
                    <span className="seo-badge"><BookOpen size={14} /> 8 Practical Guides</span>
                    <span className="seo-badge"><Shield size={14} /> 100% Client-Side Workflows</span>
                </div>
            </header>

            <section className="seo-guides-grid">
                {GUIDES.map((guide) => (
                    <article
                        key={guide.slug}
                        className="seo-guide-card"
                        onClick={() => onNavigate(`/guides/${guide.slug}`)}
                    >
                        <div className="seo-guide-card-header">
                            <span className="seo-guide-meta-pill">
                                <Clock size={12} /> {guide.readTime}
                            </span>
                            <span className="seo-guide-meta-pill">
                                <Calendar size={12} /> {guide.publishDate}
                            </span>
                        </div>
                        <h3>{guide.title}</h3>
                        <p className="seo-guide-summary">{guide.summary}</p>
                        <div className="seo-guide-card-footer">
                            <a
                                href={`/guides/${guide.slug}`}
                                className="seo-guide-link"
                                onClick={(e) => {
                                    e.preventDefault()
                                    onNavigate(`/guides/${guide.slug}`)
                                }}
                            >
                                Read Guide <ArrowRight size={14} />
                            </a>
                        </div>
                    </article>
                ))}
            </section>
        </div>
    )
}

export default GuidesHub
