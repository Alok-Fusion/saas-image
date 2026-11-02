import React, { useEffect } from 'react'
import { GUIDES, GUIDE_BY_SLUG } from '../../data/guidesData'
import { ALL_TOOLS, TOOL_PATHS, Tool } from '../../constants/tools'
import { SITE_URL } from '../../constants/site'
import { Clock, Calendar, ArrowRight, UserCheck, ShieldCheck } from 'lucide-react'

interface GuideViewProps {
    slug: string
    onNavigate: (path: string) => void
    onSelectTool: (id: string) => void
}

export const GuideView: React.FC<GuideViewProps> = ({ slug, onNavigate, onSelectTool }) => {
    const guide = GUIDE_BY_SLUG.get(slug) || GUIDES.find((g) => g.slug === slug)

    useEffect(() => {
        if (!guide) return
        document.title = guide.metaTitle
        const metaDesc = document.querySelector('meta[name="description"]')
        if (metaDesc) metaDesc.setAttribute('content', guide.metaDescription)

        let canonical = document.querySelector('link[rel="canonical"]')
        if (!canonical) {
            canonical = document.createElement('link')
            canonical.setAttribute('rel', 'canonical')
            document.head.appendChild(canonical)
        }
        canonical.setAttribute('href', `${SITE_URL}/guides/${guide.slug}`)
    }, [guide])

    if (!guide) {
        return (
            <div className="seo-hub-page">
                <header className="seo-hub-hero">
                    <h1>Guide Not Found</h1>
                    <p className="seo-hub-subtitle">The requested article could not be located.</p>
                    <button
                        className="seo-back-home-button"
                        onClick={() => onNavigate('/guides')}
                    >
                        Return to Guides
                    </button>
                </header>
            </div>
        )
    }

    const primaryTool = ALL_TOOLS.find((t) => t.id === guide.primaryToolId)
    const primaryToolUrl = primaryTool ? TOOL_PATHS[primaryTool.id as Tool] : '/'

    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Article',
                '@id': `${SITE_URL}/guides/${guide.slug}#article`,
                headline: guide.title,
                description: guide.metaDescription,
                datePublished: guide.publishDate,
                dateModified: guide.publishDate,
                mainEntityOfPage: `${SITE_URL}/guides/${guide.slug}`,
                author: {
                    '@type': 'Person',
                    name: 'Alok Kushwaha',
                    url: `${SITE_URL}/about`,
                },
                publisher: {
                    '@type': 'Organization',
                    name: 'ImageKit Pro',
                    url: SITE_URL,
                    logo: {
                        '@type': 'ImageObject',
                        url: `${SITE_URL}/icons/icon-512x512.png`,
                    },
                },
            },
            {
                '@type': 'BreadcrumbList',
                '@id': `${SITE_URL}/guides/${guide.slug}#breadcrumbs`,
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
                    {
                        '@type': 'ListItem',
                        position: 3,
                        name: guide.title,
                        item: `${SITE_URL}/guides/${guide.slug}`,
                    },
                ],
            },
        ],
    }

    return (
        <article className="seo-article-page">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <nav className="seo-breadcrumbs" aria-label="Breadcrumbs">
                <a href="/" onClick={(e) => { e.preventDefault(); onSelectTool('home'); }}>Home</a>
                <span className="sep">/</span>
                <a href="/guides" onClick={(e) => { e.preventDefault(); onNavigate('/guides'); }}>Guides</a>
                <span className="sep">/</span>
                <span className="current">{guide.title}</span>
            </nav>

            <header className="seo-article-header">
                <h1>{guide.title}</h1>
                <div className="seo-article-byline">
                    <span className="byline-item"><UserCheck size={14} /> By Alok Kushwaha</span>
                    <span className="byline-item"><Calendar size={14} /> Updated {guide.publishDate}</span>
                    <span className="byline-item"><Clock size={14} /> {guide.readTime}</span>
                </div>
            </header>

            {primaryTool && (
                <div className="seo-article-cta-box">
                    <div className="cta-icon">{primaryTool.icon}</div>
                    <div className="cta-text">
                        <h4>Try the tool mentioned in this guide:</h4>
                        <p>{primaryTool.description}</p>
                    </div>
                    <a
                        href={primaryToolUrl}
                        className="cta-button"
                        onClick={(e) => {
                            e.preventDefault()
                            onSelectTool(primaryTool.id)
                        }}
                    >
                        {guide.primaryToolCta} <ArrowRight size={14} />
                    </a>
                </div>
            )}

            <div
                className="seo-article-body"
                dangerouslySetInnerHTML={{ __html: guide.contentHtml }}
            />

            <div className="seo-article-footer-note">
                <ShieldCheck size={20} className="note-icon" />
                <p>
                    <strong>100% Client-Side Privacy:</strong> ImageKit Pro tools process all media files directly in your web browser. No photos, PDFs, or extracted text ever touch remote servers.
                </p>
            </div>
        </article>
    )
}

export default GuideView

