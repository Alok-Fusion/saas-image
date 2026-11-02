import React, { useEffect } from 'react'
import { SITE_URL } from '../../constants/site'
import { CheckCircle } from 'lucide-react'

interface PrivacyPolicyPageProps {
    onSelectTool: (id: string) => void
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onSelectTool }) => {
    useEffect(() => {
        document.title = 'Privacy Policy — 100% Client-Side Guarantee | ImageKit Pro'
        const metaDesc = document.querySelector('meta[name="description"]')
        if (metaDesc) {
            metaDesc.setAttribute(
                'content',
                'ImageKit Pro privacy policy: Zero server uploads, zero cookies, zero image storage. All image and PDF operations run entirely in local browser memory.'
            )
        }

        let canonical = document.querySelector('link[rel="canonical"]')
        if (!canonical) {
            canonical = document.createElement('link')
            canonical.setAttribute('rel', 'canonical')
            document.head.appendChild(canonical)
        }
        canonical.setAttribute('href', `${SITE_URL}/privacy`)
    }, [])

    return (
        <div className="seo-hub-page">
            <header className="seo-hub-hero">
                <nav className="seo-breadcrumbs" aria-label="Breadcrumbs">
                    <a href="/" onClick={(e) => { e.preventDefault(); onSelectTool('home'); }}>Home</a>
                    <span className="sep">/</span>
                    <span className="current">Privacy Policy</span>
                </nav>

                <h1>Privacy Policy & Data Guarantee</h1>
                <p className="seo-hub-subtitle">
                    Last updated: November 2026. The shortest and most transparent privacy policy you will ever read.
                </p>
            </header>

            <section className="seo-trust-card">
                <h2>1. Core Principle: Zero Server Transmission</h2>
                <p>
                    ImageKit Pro is architected as a pure client-side web application. When you select, drag, or drop an image, PDF, or file into any tool on this website:
                </p>
                <ul className="seo-policy-list">
                    <li><CheckCircle size={16} /> <strong>Your files are never transmitted to our servers or any third-party server.</strong></li>
                    <li><CheckCircle size={16} /> <strong>All computation runs strictly in your local device RAM and CPU/GPU.</strong></li>
                    <li><CheckCircle size={16} /> <strong>No logs, database records, thumbnails, or cache files are retained anywhere outside your current browser tab.</strong></li>
                </ul>
            </section>

            <section className="seo-trust-card">
                <h2>2. Cookies & Tracking</h2>
                <p>
                    We do not use tracking cookies, advertising cookies, or cross-site tracking pixels. We do not sell, rent, or monetize your personal data.
                </p>
                <p>
                    Local preferences—such as your chosen theme (dark vs. light mode) and your favorite tools list—are stored solely in your browser's private <code>localStorage</code> on your machine. This data remains on your computer and is never synced to external servers.
                </p>
            </section>

            <section className="seo-trust-card">
                <h2>3. EXIF & Geolocation Metadata</h2>
                <p>
                    Many cameras and smartphone photos contain embedded EXIF metadata, including your exact GPS latitude and longitude, camera serial numbers, and capture timestamps.
                </p>
                <p>
                    Our <a href="/remove-exif-data">EXIF Privacy Cleaner</a> strips all metadata blocks locally before you export, giving you peace of mind before publishing photos to social networks or sending files to third parties.
                </p>
            </section>

            <section className="seo-trust-card">
                <h2>4. Open Source & Verifiability</h2>
                <p>
                    We believe privacy should be verifiable, not merely promised. You can inspect your browser's Network Activity tab in Developer Tools at any time while using ImageKit Pro to confirm that zero file upload POST or PUT requests are generated during image compression, background removal, or PDF conversion.
                </p>
            </section>
        </div>
    )
}

export default PrivacyPolicyPage
