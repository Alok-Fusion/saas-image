import React, { useEffect } from 'react'
import { SITE_URL } from '../../constants/site'
import { ShieldCheck, Cpu, Code2, Award } from 'lucide-react'

interface AboutPageProps {
    onSelectTool: (id: string) => void
}

export const AboutPage: React.FC<AboutPageProps> = ({ onSelectTool }) => {
    useEffect(() => {
        document.title = 'About ImageKit Pro — Private In-Browser Image Utilities'
        const metaDesc = document.querySelector('meta[name="description"]')
        if (metaDesc) {
            metaDesc.setAttribute(
                'content',
                'Learn about ImageKit Pro, built by Alok Kushwaha. Discover our zero-upload privacy architecture, WebAssembly engines, and browser-first design philosophy.'
            )
        }

        let canonical = document.querySelector('link[rel="canonical"]')
        if (!canonical) {
            canonical = document.createElement('link')
            canonical.setAttribute('rel', 'canonical')
            document.head.appendChild(canonical)
        }
        canonical.setAttribute('href', `${SITE_URL}/about`)
    }, [])

    return (
        <div className="seo-hub-page">
            <header className="seo-hub-hero">
                <nav className="seo-breadcrumbs" aria-label="Breadcrumbs">
                    <a href="/" onClick={(e) => { e.preventDefault(); onSelectTool('home'); }}>Home</a>
                    <span className="sep">/</span>
                    <span className="current">About</span>
                </nav>

                <h1>About ImageKit Pro</h1>
                <p className="seo-hub-subtitle">
                    Fast, zero-upload creative utilities engineered for privacy, precision, and speed.
                </p>
            </header>

            <section className="seo-trust-card">
                <h2>Our Mission: Absolute Client-Side Privacy</h2>
                <p>
                    Most online image and PDF converters upload your confidential personal photos, tax records, identification scans, and proprietary design files to unknown cloud servers. These servers log your metadata, consume unnecessary bandwidth, and introduce security vulnerabilities.
                </p>
                <p>
                    <strong>ImageKit Pro takes the opposite approach:</strong> every single tool runs 100% locally in your web browser. Utilizing modern web capabilities—including HTML5 Canvas, WebGL, Web Workers, WebAssembly (WASM), and client-side ONNX neural inference—your images never leave your local device memory.
                </p>
            </section>

            <section className="seo-features-grid">
                <div className="seo-feature-box">
                    <ShieldCheck size={28} className="seo-feature-icon" />
                    <h3>Zero Server Storage</h3>
                    <p>No backend servers, no database logs, no cloud storage buckets. When you close or refresh your browser tab, memory is instantly reclaimed by your operating system.</p>
                </div>
                <div className="seo-feature-box">
                    <Cpu size={28} className="seo-feature-icon" />
                    <h3>Hardware Acceleration</h3>
                    <p>Leverages your local GPU and multi-core CPU via Web Workers and WebAssembly for instantaneous transformations without waiting on network uploads.</p>
                </div>
                <div className="seo-feature-box">
                    <Code2 size={28} className="seo-feature-icon" />
                    <h3>Open Standards</h3>
                    <p>Built with React 18, TypeScript, Vite, Mozilla PDF.js, Tesseract.js, jsPDF, and ONNX Runtime Web. Clean, auditable, standard web technology.</p>
                </div>
            </section>

            <section className="seo-trust-card">
                <h2>Author & Engineering</h2>
                <div className="seo-author-profile">
                    <div className="seo-author-avatar">
                        <Award size={36} />
                    </div>
                    <div className="seo-author-bio">
                        <h3>Alok Kushwaha</h3>
                        <p className="seo-author-title">Senior Creative Developer & Systems Architect</p>
                        <p>
                            ImageKit Pro was designed and built by <strong>Alok Kushwaha</strong> with the conviction that essential digital utilities should be completely free, respectful of personal privacy, and delightful to use. By replacing heavy server-side processing pipelines with lean, client-side browser engines, ImageKit Pro sets a new standard for modern web applications.
                        </p>
                        <p>
                            Connect with Alok on <a href="https://github.com/Alok-Fusion" target="_blank" rel="noopener noreferrer">GitHub</a> or visit the project repository to inspect source code and submit feature suggestions.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default AboutPage
