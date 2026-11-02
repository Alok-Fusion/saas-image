import React from 'react'
import { ALL_TOOLS, TOOL_PATHS, Tool } from '../constants/tools'
import { Sparkles, Shield, Heart } from 'lucide-react'

interface FooterProps {
    onSelectTool: (id: string) => void
}

export const Footer: React.FC<FooterProps> = ({ onSelectTool }) => {
    const coreTools = ALL_TOOLS.filter((t) => ['core', 'edit'].includes(t.category))
    const pdfTools = ALL_TOOLS.filter((t) => t.category === 'pdf')
    const privacyTools = ALL_TOOLS.filter((t) => ['privacy', 'accessibility'].includes(t.category))
    const designTools = ALL_TOOLS.filter((t) => ['design', 'social'].includes(t.category))

    return (
        <footer className="site-master-footer" role="contentinfo">
            <div className="footer-container">
                {/* Brand & Mission Column */}
                <div className="footer-brand-col">
                    <a
                        href="/"
                        className="footer-brand"
                        onClick={(e) => {
                            e.preventDefault()
                            onSelectTool('home')
                        }}
                    >
                        <Sparkles size={16} color="var(--color-electric-lime)" />
                        <span>ImageKit Pro</span>
                    </a>
                    <p className="footer-mission">
                        20 precision image and PDF utilities designed for speed, privacy, and zero compromise.
                        All processing executes locally in your browser memory — no cloud uploads, no tracking.
                    </p>
                    <div className="footer-privacy-badge">
                        <Shield size={13} color="var(--color-electric-lime)" />
                        <span>100% Client-Side Privacy Promise</span>
                    </div>
                </div>

                {/* Column 1: Image & Edit Tools */}
                <div className="footer-col">
                    <h4 className="footer-heading">
                        <a href="/image-tools" onClick={(e) => { e.preventDefault(); onSelectTool('image-tools'); }}>
                            Image Tools
                        </a>
                    </h4>
                    <ul className="footer-links">
                        {coreTools.map((t) => (
                            <li key={t.id}>
                                <a
                                    href={TOOL_PATHS[t.id as Tool] || `/${t.id}`}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        onSelectTool(t.id)
                                    }}
                                >
                                    {t.title}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Column 2: PDF & Privacy Tools */}
                <div className="footer-col">
                    <h4 className="footer-heading">
                        <a href="/pdf-tools" onClick={(e) => { e.preventDefault(); onSelectTool('pdf-tools'); }}>
                            PDF & Privacy
                        </a>
                    </h4>
                    <ul className="footer-links">
                        {pdfTools.map((t) => (
                            <li key={t.id}>
                                <a
                                    href={TOOL_PATHS[t.id as Tool] || `/${t.id}`}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        onSelectTool(t.id)
                                    }}
                                >
                                    {t.title}
                                </a>
                            </li>
                        ))}
                        {privacyTools.map((t) => (
                            <li key={t.id}>
                                <a
                                    href={TOOL_PATHS[t.id as Tool] || `/${t.id}`}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        onSelectTool(t.id)
                                    }}
                                >
                                    {t.title}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Column 3: Creative & Design Tools */}
                <div className="footer-col">
                    <h4 className="footer-heading">Design & Social</h4>
                    <ul className="footer-links">
                        {designTools.map((t) => (
                            <li key={t.id}>
                                <a
                                    href={TOOL_PATHS[t.id as Tool] || `/${t.id}`}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        onSelectTool(t.id)
                                    }}
                                >
                                    {t.title}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Column 4: Guides & Company */}
                <div className="footer-col">
                    <h4 className="footer-heading">Resources & Trust</h4>
                    <ul className="footer-links">
                        <li>
                            <a href="/guides" onClick={(e) => { e.preventDefault(); onSelectTool('guides'); }}>
                                Image Optimization Guides
                            </a>
                        </li>
                        <li>
                            <a href="/image-tools" onClick={(e) => { e.preventDefault(); onSelectTool('image-tools'); }}>
                                All Image Tools Hub
                            </a>
                        </li>
                        <li>
                            <a href="/pdf-tools" onClick={(e) => { e.preventDefault(); onSelectTool('pdf-tools'); }}>
                                PDF Suite Hub
                            </a>
                        </li>
                        <li>
                            <a href="/privacy-tools" onClick={(e) => { e.preventDefault(); onSelectTool('privacy-tools'); }}>
                                Privacy & EXIF Hub
                            </a>
                        </li>
                        <li>
                            <a href="/about" onClick={(e) => { e.preventDefault(); onSelectTool('about'); }}>
                                About & Authorship
                            </a>
                        </li>
                        <li>
                            <a href="/privacy" onClick={(e) => { e.preventDefault(); onSelectTool('privacy'); }}>
                                Privacy Policy
                            </a>
                        </li>
                        <li>
                            <a href="/contact" onClick={(e) => { e.preventDefault(); onSelectTool('contact'); }}>
                                Contact & Feedback
                            </a>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="footer-bottom-bar">
                <div className="footer-bottom-inner">
                    <div>
                        © 2026 ImageKit Pro · Open Source under MIT License · Free for personal and commercial use.
                    </div>
                    <div className="footer-author-credit">
                        Crafted with <Heart size={12} fill="#ef4444" color="#ef4444" style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} /> by{' '}
                        <a
                            href="https://github.com/Alok-Fusion"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="author-link"
                        >
                            <strong>Alok Kushwaha</strong>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
