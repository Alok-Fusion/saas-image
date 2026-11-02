import React, { useEffect } from 'react'
import { SITE_URL } from '../../constants/site'
import { Mail, Code2, ShieldCheck } from 'lucide-react'

interface ContactPageProps {
    onSelectTool: (id: string) => void
}

export const ContactPage: React.FC<ContactPageProps> = ({ onSelectTool }) => {
    useEffect(() => {
        document.title = 'Contact & Support | ImageKit Pro'
        const metaDesc = document.querySelector('meta[name="description"]')
        if (metaDesc) {
            metaDesc.setAttribute(
                'content',
                'Contact the ImageKit Pro team for support, feature suggestions, or security vulnerability disclosures. We are here to help.'
            )
        }

        let canonical = document.querySelector('link[rel="canonical"]')
        if (!canonical) {
            canonical = document.createElement('link')
            canonical.setAttribute('rel', 'canonical')
            document.head.appendChild(canonical)
        }
        canonical.setAttribute('href', `${SITE_URL}/contact`)
    }, [])

    return (
        <div className="seo-hub-page">
            <header className="seo-hub-hero">
                <nav className="seo-breadcrumbs" aria-label="Breadcrumbs">
                    <a href="/" onClick={(e) => { e.preventDefault(); onSelectTool('home'); }}>Home</a>
                    <span className="sep">/</span>
                    <span className="current">Contact</span>
                </nav>

                <h1>Contact & Feedback</h1>
                <p className="seo-hub-subtitle">
                    Have a question, suggested tool feature, or encountered a bug? Reach out directly.
                </p>
            </header>

            <div className="seo-contact-grid">
                <div className="seo-contact-card">
                    <Mail size={28} className="seo-contact-icon" />
                    <h3>Direct Email</h3>
                    <p>For inquiries, partnerships, or support requests:</p>
                    <a href="mailto:contact@imagekitpro.cc" className="seo-contact-link">
                        contact@imagekitpro.cc
                    </a>
                </div>

                <div className="seo-contact-card">
                    <Code2 size={28} className="seo-contact-icon" />
                    <h3>GitHub Issues</h3>
                    <p>Open source bug tracking, feature requests, and code contributions:</p>
                    <a
                        href="https://github.com/Alok-Fusion/saas-image/issues"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="seo-contact-link"
                    >
                        github.com/Alok-Fusion/saas-image
                    </a>
                </div>

                <div className="seo-contact-card">
                    <ShieldCheck size={28} className="seo-contact-icon" />
                    <h3>Security Disclosures</h3>
                    <p>Report security considerations or read our vulnerability disclosure policy:</p>
                    <a href="/.well-known/security.txt" className="seo-contact-link">
                        /.well-known/security.txt
                    </a>
                </div>
            </div>
        </div>
    )
}

export default ContactPage
