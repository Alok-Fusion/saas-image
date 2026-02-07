import { useState } from 'react'
import AsciiArtGenerator from './tools/AsciiArtGenerator'
import BackgroundRemover from './tools/BackgroundRemover'
import ColorBlindnessSimulator from './tools/ColorBlindnessSimulator'
import ColorPaletteExtractor from './tools/ColorPaletteExtractor'
import DeviceMockupGenerator from './tools/DeviceMockupGenerator'
import DuplicateFinder from './tools/DuplicateFinder'
import ExifCleaner from './tools/ExifCleaner'
import FaviconGenerator from './tools/FaviconGenerator'
import ImageComparisonSlider from './tools/ImageComparisonSlider'
import ImageCompressor from './tools/ImageCompressor'
import ImageCropper from './tools/ImageCropper'
import ImageRotator from './tools/ImageRotator'
import ImageToPdf from './tools/ImageToPdf'
import InstagramGridSplitter from './tools/InstagramGridSplitter'
import OcrExtractor from './tools/OcrExtractor'
import PdfToImage from './tools/PdfToImage'
import SocialMediaResizer from './tools/SocialMediaResizer'
import WatermarkAdder from './tools/WatermarkAdder'
import WatermarkRemover from './tools/WatermarkRemover'
import ThumbnailMaker from './tools/ThumbnailMaker'

type Tool = 'home' | 'compressor' | 'resizer' | 'background-remover' | 'exif-cleaner' | 'color-palette' | 'instagram-grid' | 'favicon' | 'ocr' | 'device-mockup' | 'color-blindness' | 'ascii-art' | 'image-comparison' | 'duplicate-finder' | 'image-to-pdf' | 'pdf-to-image' | 'cropper' | 'rotator' | 'watermark' | 'watermark-remover' | 'thumbnail'

interface ToolCardProps { icon: string; iconClass: string; title: string; description: string; isNew?: boolean; onClick: () => void }

function ToolCard({ icon, iconClass, title, description, isNew, onClick }: ToolCardProps) {
    return (
        <div className="tool-card" onClick={onClick}>
            {isNew && <div className="tool-card-badge">NEW</div>}
            <div className={`tool-card-icon ${iconClass}`}>{icon}</div>
            <h3 className="tool-card-title">{title}</h3>
            <p className="tool-card-description">{description}</p>
            <div className="tool-card-arrow">→</div>
        </div>
    )
}

function Header({ onLogoClick }: { onLogoClick: () => void }) {
    return (
        <header className="header">
            <div className="header-content">
                <div className="logo" onClick={onLogoClick}>
                    <div className="logo-icon">✨</div>
                    ImageKit Pro
                </div>
                <nav className="nav-links">
                    <span className="nav-badge">20 Tools Available</span>
                </nav>
            </div>
        </header>
    )
}

function HomePage({ onSelectTool }: { onSelectTool: (tool: Tool) => void }) {
    return (
        <div className="hero">
            <h1 className="hero-title">Transform Your Images <span>Instantly</span></h1>
            <p className="hero-subtitle">Free, powerful image tools right in your browser. No uploads to servers, no sign-ups required.</p>

            <div className="section-title"><span className="section-icon">⭐</span>Core Tools</div>
            <div className="tools-grid">
                <ToolCard icon="📦" iconClass="compress" title="Image Compressor" description="Reduce file size while maintaining quality." onClick={() => onSelectTool('compressor')} />
                <ToolCard icon="📱" iconClass="resize" title="Social Media Resizer" description="Resize for Instagram, YouTube, LinkedIn & more." onClick={() => onSelectTool('resizer')} />
                <ToolCard icon="🎭" iconClass="remove-bg" title="Background Remover" description="AI-powered background removal." onClick={() => onSelectTool('background-remover')} />
            </div>

            <div className="section-title"><span className="section-icon">✂️</span>Edit & Transform</div>
            <div className="tools-grid">
                <ToolCard icon="✂️" iconClass="crop" title="Image Cropper" description="Crop with preset aspect ratios (1:1, 16:9, 4:3)." isNew onClick={() => onSelectTool('cropper')} />
                <ToolCard icon="🔄" iconClass="rotate" title="Image Rotator" description="Rotate 90°/180° and flip horizontal/vertical." isNew onClick={() => onSelectTool('rotator')} />
                <ToolCard icon="©" iconClass="watermark" title="Watermark Adder" description="Add text watermarks with custom position & style." isNew onClick={() => onSelectTool('watermark')} />
                <ToolCard icon="🧹" iconClass="wmremover" title="Watermark Remover" description="Remove watermarks using inpaint, blur, or pixelate." isNew onClick={() => onSelectTool('watermark-remover')} />
            </div>

            <div className="section-title"><span className="section-icon">📄</span>PDF Tools</div>
            <div className="tools-grid">
                <ToolCard icon="📄" iconClass="pdf" title="Image to PDF" description="Convert multiple images into a single PDF." isNew onClick={() => onSelectTool('image-to-pdf')} />
                <ToolCard icon="📑" iconClass="pdfimg" title="PDF to Image" description="Convert PDF pages to PNG images." isNew onClick={() => onSelectTool('pdf-to-image')} />
            </div>

            <div className="section-title"><span className="section-icon">🔒</span>Privacy & Utilities</div>
            <div className="tools-grid">
                <ToolCard icon="🔐" iconClass="privacy" title="EXIF Privacy Cleaner" description="Remove GPS, camera info & metadata." isNew onClick={() => onSelectTool('exif-cleaner')} />
                <ToolCard icon="🔍" iconClass="duplicate" title="Duplicate Finder" description="Find similar images using perceptual hashing." isNew onClick={() => onSelectTool('duplicate-finder')} />
                <ToolCard icon="📝" iconClass="ocr" title="OCR Text Extractor" description="Extract text from images. 12 languages." isNew onClick={() => onSelectTool('ocr')} />
            </div>

            <div className="section-title"><span className="section-icon">🎨</span>Design & Creative</div>
            <div className="tools-grid">
                <ToolCard icon="🎨" iconClass="palette" title="Color Palette Extractor" description="Extract colors with HEX/RGB & CSS gradients." isNew onClick={() => onSelectTool('color-palette')} />
                <ToolCard icon="📱" iconClass="mockup" title="Device Mockup Generator" description="iPhone, MacBook, iPad device frames." isNew onClick={() => onSelectTool('device-mockup')} />
                <ToolCard icon="🖌️" iconClass="ascii" title="ASCII Art Generator" description="Convert images to ASCII text art." isNew onClick={() => onSelectTool('ascii-art')} />
                <ToolCard icon="🎬" iconClass="thumbnail" title="Thumbnail Maker" description="Create thumbnails with images, text & emojis." isNew onClick={() => onSelectTool('thumbnail')} />
            </div>

            <div className="section-title"><span className="section-icon">🌐</span>Social Media & Web</div>
            <div className="tools-grid">
                <ToolCard icon="📸" iconClass="instagram" title="Instagram Grid Splitter" description="Split into 3×3/3×2/3×1 grids for carousel." isNew onClick={() => onSelectTool('instagram-grid')} />
                <ToolCard icon="🖼️" iconClass="favicon" title="Favicon Generator" description="All sizes + manifest.json + HTML snippet." isNew onClick={() => onSelectTool('favicon')} />
            </div>

            <div className="section-title"><span className="section-icon">♿</span>Accessibility & Analysis</div>
            <div className="tools-grid">
                <ToolCard icon="👁️" iconClass="colorblind" title="Color Blindness Simulator" description="See how designs appear to color blind users." isNew onClick={() => onSelectTool('color-blindness')} />
                <ToolCard icon="↔️" iconClass="compare" title="Image Comparison Slider" description="Before/after comparison with slider." isNew onClick={() => onSelectTool('image-comparison')} />
            </div>
        </div>
    )
}

function App() {
    const [currentTool, setCurrentTool] = useState<Tool>('home')
    const handleBack = () => setCurrentTool('home')

    return (
        <>
            <Header onLogoClick={handleBack} />
            <main className="main-container">
                {currentTool === 'home' && <HomePage onSelectTool={setCurrentTool} />}
                {currentTool === 'compressor' && <ImageCompressor onBack={handleBack} />}
                {currentTool === 'resizer' && <SocialMediaResizer onBack={handleBack} />}
                {currentTool === 'background-remover' && <BackgroundRemover onBack={handleBack} />}
                {currentTool === 'exif-cleaner' && <ExifCleaner onBack={handleBack} />}
                {currentTool === 'color-palette' && <ColorPaletteExtractor onBack={handleBack} />}
                {currentTool === 'instagram-grid' && <InstagramGridSplitter onBack={handleBack} />}
                {currentTool === 'favicon' && <FaviconGenerator onBack={handleBack} />}
                {currentTool === 'ocr' && <OcrExtractor onBack={handleBack} />}
                {currentTool === 'device-mockup' && <DeviceMockupGenerator onBack={handleBack} />}
                {currentTool === 'color-blindness' && <ColorBlindnessSimulator onBack={handleBack} />}
                {currentTool === 'ascii-art' && <AsciiArtGenerator onBack={handleBack} />}
                {currentTool === 'image-comparison' && <ImageComparisonSlider onBack={handleBack} />}
                {currentTool === 'duplicate-finder' && <DuplicateFinder onBack={handleBack} />}
                {currentTool === 'image-to-pdf' && <ImageToPdf onBack={handleBack} />}
                {currentTool === 'pdf-to-image' && <PdfToImage onBack={handleBack} />}
                {currentTool === 'cropper' && <ImageCropper onBack={handleBack} />}
                {currentTool === 'rotator' && <ImageRotator onBack={handleBack} />}
                {currentTool === 'watermark' && <WatermarkAdder onBack={handleBack} />}
                {currentTool === 'watermark-remover' && <WatermarkRemover onBack={handleBack} />}
                {currentTool === 'thumbnail' && <ThumbnailMaker onBack={handleBack} />}
            </main>
            <footer className="footer">
                <p>© 2024 ImageKit Pro. All processing happens in your browser - your images never leave your device.</p>
                <p style={{ marginTop: '0.5rem', opacity: 0.7 }}>Developed with ❤️ by <strong>Alok Kushwaha</strong></p>
            </footer>
        </>
    )
}

export default App
