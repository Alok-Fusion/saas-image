import React, { useEffect } from 'react'
import { ALL_TOOLS, TOOL_PATHS, Tool } from '../../constants/tools'
import { ArrowRight, Compass } from 'lucide-react'

interface NotFoundPageProps {
    onSelectTool: (id: string) => void
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onSelectTool }) => {
    useEffect(() => {
        document.title = '404: Page Not Found | ImageKit Pro'
        let robots = document.querySelector('meta[name="robots"]')
        if (!robots) {
            robots = document.createElement('meta')
            robots.setAttribute('name', 'robots')
            document.head.appendChild(robots)
        }
        robots.setAttribute('content', 'noindex, follow')
        return () => {
            robots?.setAttribute('content', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1')
        }
    }, [])

    return (
        <div className="seo-hub-page">
            <header className="seo-hub-hero">
                <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(255,255,255,0.04)', borderRadius: '50%', marginBottom: '16px' }}>
                    <Compass size={40} style={{ color: 'var(--accent, #6366f1)' }} />
                </div>
                <h1>404 — Page Not Found</h1>
                <p className="seo-hub-subtitle">
                    The URL you requested does not exist or has been moved. Explore one of our 20 free in-browser tools below:
                </p>
                <div style={{ marginTop: '20px' }}>
                    <button
                        className="seo-back-home-button"
                        onClick={() => onSelectTool('home')}
                    >
                        Go to Homepage
                    </button>
                </div>
            </header>

            <section className="seo-hub-tools-section">
                <h2>Popular Free Tools</h2>
                <div className="seo-hub-tools-grid">
                    {ALL_TOOLS.slice(0, 8).map((t) => (
                        <div
                            key={t.id}
                            className="seo-hub-tool-card"
                            onClick={() => onSelectTool(t.id)}
                            role="button"
                            tabIndex={0}
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

export default NotFoundPage

