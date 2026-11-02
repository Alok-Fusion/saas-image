import React from 'react'
import { TOOL_SEO_DATA } from '../../data/toolSeoData'
import { ALL_TOOLS, TOOL_PATHS, Tool } from '../../constants/tools'
import { SITE_URL } from '../../constants/site'
import { ShieldCheck, ArrowRight, HelpCircle } from 'lucide-react'

interface ToolSeoSectionProps {
    toolId: Tool
    onSelectTool: (id: string) => void
}

export const ToolSeoSection: React.FC<ToolSeoSectionProps> = ({ toolId, onSelectTool }) => {
    const data = TOOL_SEO_DATA[toolId]
    if (!data) return null

    const toolMeta = ALL_TOOLS.find((t) => t.id === toolId)
    const categoryName = toolMeta?.category || 'utility'
    const canonicalUrl = `${SITE_URL}${data.canonicalPath}`

    // Category display name
    const categoryLabels: Record<string, string> = {
        core: 'Essential Image Tools',
        edit: 'Edit & Transform Tools',
        pdf: 'PDF Utilities',
        privacy: 'Privacy & Security',
        design: 'Design & Creative',
        social: 'Social Media Tools',
        accessibility: 'Accessibility Tools',
    }
    const catLabel = categoryLabels[categoryName] || 'Tools'

    // Structured Data (JSON-LD) for SoftwareApplication, HowTo, FAQPage, and BreadcrumbList
    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'WebApplication',
                '@id': `${canonicalUrl}#software`,
                name: data.h1,
                url: canonicalUrl,
                applicationCategory: 'MultimediaApplication',
                operatingSystem: 'Any',
                browserRequirements: 'Requires JavaScript. Works in Chrome, Firefox, Safari, Edge.',
                offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'USD',
                },
                description: data.metaDescription,
                featureList: data.tagline,
                creator: {
                    '@type': 'Person',
                    name: 'Alok Kushwaha',
                    url: 'https://github.com/Alok-Fusion',
                },
            },
            {
                '@type': 'HowTo',
                '@id': `${canonicalUrl}#howto`,
                name: `How to use ${toolMeta?.title || 'this tool'} online`,
                description: data.tagline,
                step: data.howToSteps.map((step, idx) => ({
                    '@type': 'HowToStep',
                    position: idx + 1,
                    name: step.name,
                    text: step.text,
                    url: `${canonicalUrl}#step-${idx + 1}`,
                })),
            },
            {
                '@type': 'FAQPage',
                '@id': `${canonicalUrl}#faq`,
                mainEntity: data.faqs.map((faq) => ({
                    '@type': 'Question',
                    name: faq.question,
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: faq.answer,
                    },
                })),
            },
            {
                '@type': 'BreadcrumbList',
                '@id': `${canonicalUrl}#breadcrumbs`,
                itemListElement: [
                    {
                        '@type': 'ListItem',
                        position: 1,
                        name: 'Home',
                        item: `${SITE_URL}/`,
                    },
                    {
                        '@type': 'ListItem',
                        position: 2,
                        name: catLabel,
                        item: `${SITE_URL}/#${categoryName}`,
                    },
                    {
                        '@type': 'ListItem',
                        position: 3,
                        name: toolMeta?.title || 'Tool',
                        item: canonicalUrl,
                    },
                ],
            },
        ],
    }

    return (
        <section className="tool-seo-section-root" aria-label="Tool Guide, FAQs & Information">
            {/* Inject Valid JSON-LD */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div className="tool-seo-inner">
                {/* Breadcrumb Navigation */}
                <nav className="tool-seo-breadcrumbs" aria-label="Breadcrumb">
                    <ol>
                        <li>
                            <a href="/" onClick={(e) => { e.preventDefault(); onSelectTool('home'); }}>
                                Home
                            </a>
                        </li>
                        <li className="sep">/</li>
                        <li>
                            <span>{catLabel}</span>
                        </li>
                        <li className="sep">/</li>
                        <li aria-current="page">
                            <span className="current">{toolMeta?.title}</span>
                        </li>
                    </ol>
                </nav>

                {/* Primary Content Card */}
                <div className="tool-seo-card">
                    <header className="tool-seo-header">
                        <div className="tool-seo-tag">
                            <ShieldCheck size={14} color="var(--color-electric-lime)" />
                            <span>100% Client-Side Privacy Guaranteed</span>
                        </div>
                        <h2 className="tool-seo-h2">{data.h1}</h2>
                        <p className="tool-seo-lead">{data.tagline}</p>
                    </header>

                    {/* 3-Step How-To Section */}
                    <div className="tool-seo-howto">
                        <h3 className="tool-seo-h3">How to use in 3 simple steps:</h3>
                        <div className="howto-steps-grid">
                            {data.howToSteps.map((step, idx) => (
                                <div key={idx} id={`step-${idx + 1}`} className="howto-step-card">
                                    <div className="step-number">{idx + 1}</div>
                                    <h4 className="step-title">{step.name}</h4>
                                    <p className="step-text">{step.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Informative Article Sections */}
                    <div className="tool-seo-articles">
                        {data.articleSections.map((sec, idx) => (
                            <article key={idx} className="tool-article-block">
                                <h3 className="tool-seo-h3">{sec.heading}</h3>
                                <p className="tool-article-text">{sec.body}</p>
                            </article>
                        ))}
                    </div>

                    {/* Supported Formats & Privacy Assurance */}
                    <div className="tool-seo-specs">
                        <div className="spec-item">
                            <span className="spec-label">Supported Formats:</span>
                            <span className="spec-value">{data.supportedFormats}</span>
                        </div>
                        <div className="spec-item">
                            <span className="spec-label">Privacy Guarantee:</span>
                            <span className="spec-value">{data.privacyNote}</span>
                        </div>
                    </div>

                    {/* FAQs Accordion / List */}
                    <div className="tool-seo-faqs">
                        <div className="faqs-header">
                            <HelpCircle size={18} color="var(--color-electric-lime)" />
                            <h3 className="tool-seo-h3">Frequently Asked Questions</h3>
                        </div>
                        <div className="faqs-list">
                            {data.faqs.map((faq, idx) => (
                                <details key={idx} className="faq-item" open={idx === 0}>
                                    <summary className="faq-question">
                                        <span>{faq.question}</span>
                                    </summary>
                                    <p className="faq-answer">{faq.answer}</p>
                                </details>
                            ))}
                        </div>
                    </div>

                    {/* Related Tools Links */}
                    <div className="tool-seo-related">
                        <h3 className="tool-seo-h3">Related Precision Image Tools</h3>
                        <div className="related-tools-grid">
                            {data.relatedTools.map((relId) => {
                                const relMeta = ALL_TOOLS.find((t) => t.id === relId)
                                if (!relMeta) return null
                                const relPath = TOOL_PATHS[relId as Tool] || `/${relId}`
                                return (
                                    <a
                                        key={relId}
                                        href={relPath}
                                        className="related-tool-card"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            onSelectTool(relId)
                                        }}
                                    >
                                        <div className="related-tool-info">
                                            <div className="related-tool-icon">{relMeta.icon}</div>
                                            <div>
                                                <h4 className="related-tool-title">{relMeta.title}</h4>
                                                <p className="related-tool-desc">{relMeta.description}</p>
                                            </div>
                                        </div>
                                        <ArrowRight size={16} className="related-arrow" />
                                    </a>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default ToolSeoSection
