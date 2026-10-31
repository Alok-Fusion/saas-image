<div align="center">
  <h1>✨ ImageKit Pro</h1>
  <p>
    <strong>Award-Level Cinematic Creative Suite · 20 Client-Side Image Tools</strong>
  </p>
  <p>
    <img src="https://img.shields.io/badge/Privacy-100%25%20In--Browser-success?style=for-the-badge&logo=shield" alt="Privacy First" />
    <img src="https://img.shields.io/badge/Tools-20%20Precision%20Instruments-blue?style=for-the-badge&logo=tools" alt="20 Tools" />
    <img src="https://img.shields.io/badge/3D%20Experience-Three.js%20%2B%20GSAP-black?style=for-the-badge&logo=three.js" alt="3D Immersive" />
    <img src="https://img.shields.io/badge/Initial%20JS-22.4%20kB%20gzip-d4ff3a?style=for-the-badge&color=282833&labelColor=0d0d12" alt="Bundle Size" />
    <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
  </p>
  
  <p>
    <em>A cinematic, scroll-driven visual journey where visitors experience 3D transformations before diving into 20 private, instant browser utilities.</em>
  </p>

  <p>
    Developed with ❤️ by <strong>Alok Kushwaha</strong>
  </p>
</div>

---

## 🌟 The Cinematic Front Door (Awwwards / FWA Experience)

ImageKit Pro features an immersive, scroll-choreographed 3D experience powered by **Three.js**, **@react-three/fiber**, **GSAP ScrollTrigger**, and **Lenis** smooth scrolling:

```
[00 Intro]       Floating photo stack in dark studio with volumetric rim lighting & cursor parallax
      ↓
[01 Squeeze]     Stack compresses into a dense crystal block; telemetry countdown 8.4 MB → 640 KB
      ↓
[02 Framing]     Golden crop reticles snap to coordinates; aspect ratio morphs 1:1 → 16:9 → 9:16
      ↓
[03 Separation]  Subject elevates on Z-axis (+1.8 units); background dissolves into noise particles
      ↓
[04 Synthesis]   Images fold and stack into a neat 3D PDF binder folio
      ↓
[05 Inscription] Electric cyan laser sweeps down; 3D characters fly off the document surface
      ↓
[06 Zero Trace]  Iridescent forcefield wraps photo; GPS & camera EXIF tags peel off and dissipate
      ↓
[07 Stage]       Photo lands onto a 3D smartphone OLED glass display, rotating with perspective
      ↓
[Constellation]  Camera accelerates back to reveal all 20 tools as interactive floating 3D tiles
```

---

## ⚡ Performance & Zero-Compromise Fallback

- **Sub-25 kB Initial Gzip Payload**: The entire 3D WebGL engine and Three.js runtime are strictly dynamic-imported (`React.lazy`) after the first contentful paint.
- **Automatic Capability Detection**: Systems with `prefers-reduced-motion`, low memory (`< 4 GB`), low concurrency (`< 4 threads`), or mobile viewports automatically render the high-contrast CSS fallback without loading the 3D pipeline.
- **Manual "Minimal FX" Toggle**: Visitors can switch between full 3D and reduced effects at any time via the header toggle.
- **Zero Background GPU Leaks**: The WebGL canvas is automatically unmounted and its contexts released when a tool is opened, dedicating 100% of device resources to local image algorithms.

---

## 🛠️ The 20 In-Browser Precision Tools

All 20 tools operate **100% locally in your browser** with zero uploads, zero tracking, and absolute privacy.

### ⭐ Core Essentials
| Tool | Route | Description |
|:--- |:--- |:--- |
| **📦 Image Compressor** | `/compress-image` | High-fidelity JPEG, PNG, and WebP compression with real-time savings telemetry. |
| **📱 Social Media Resizer** | `/resize-image` | Batch presets for Instagram, YouTube, LinkedIn, X, and Facebook with cover/contain modes. |
| **🎭 Background Remover** | `/remove-background` | Client-side neural network cutout running via ONNX WebAssembly. |
| **↔️ Comparison Slider** | `/image-comparison` | Touch and keyboard split-view comparison slider with transparency backplate. |

### ✂️ Edit & Transform
| Tool | Route | Description |
|:--- |:--- |:--- |
| **✂️ Image Cropper** | `/crop-image` | Draggable rule-of-thirds grid with 8 locked aspect ratio presets. |
| **🔄 Image Rotator** | `/rotate-image` | 90°/180° step rotation, continuous 0–360° slider, and horizontal/vertical flipping. |
| **© Watermark Adder** | `/watermark` | Custom text watermarks with 5 placement points, opacity, and live preview. |
| **🧹 Watermark Remover** | `/remove-watermark` | Interactive marquee eraser powered by Inpaint, Blur, or Pixelate algorithms. |

### 📄 PDF Utilities
| Tool | Route | Description |
|:--- |:--- |:--- |
| **📄 Image to PDF** | `/image-to-pdf` | Multi-image sequencing, page ordering, margins, and A4/Letter/Fit sheet binding. |
| **📑 PDF to Image** | `/pdf-to-image` | Multi-page PDF rasterizer with 1x/2x/3x scale and bulk ZIP export. |

### 🔒 Privacy & Security
| Tool | Route | Description |
|:--- |:--- |:--- |
| **🔐 EXIF Cleaner** | `/remove-exif` | Deep tag inspector and one-click stripper for GPS coordinates and hardware serials. |
| **🔍 Duplicate Finder** | `/duplicate-finder` | Perceptual 64-bit difference hashing offloaded to multi-core Web Workers. |
| **📝 OCR Extractor** | `/image-to-text` | Tesseract.js client-side text extractor supporting 12+ international languages. |

### 🎨 Design & Social
| Tool | Route | Description |
|:--- |:--- |:--- |
| **🎬 Thumbnail Maker** | `/thumbnail-maker` | Canvas studio for YouTube, Instagram, and Twitter graphics with emoji stickers. |
| **🎨 Palette Extractor** | `/color-palette` | Dominant color cluster extraction with HEX, RGB, and CSS variable copying. |
| **📱 Device Mockup** | `/device-mockup` | Vector device frames (iPhone 14 Pro, SE, Android, MacBook, iPad, iMac). |
| **🖌️ ASCII Art** | `/ascii-art` | Retro terminal generator with standard, complex, and block character sets. |
| **📸 Instagram Grid** | `/instagram-grid` | 3x1, 3x2, and 3x3 profile tile splitter with direct ZIP packaging. |
| **🖼️ Favicon Generator** | `/favicon-generator` | Multi-resolution `.ico`, PNG matrix, `manifest.json`, and HTML `<head>` snippets. |
| **👁️ Color Blindness** | `/color-blindness` | Fast 8-mode simulation of protanopia, deuteranopia, tritanopia, and more. |

---

## 💻 Tech Stack & Architecture

- **Framework**: React 18 + TypeScript + Vite 6
- **Typography**: Self-hosted `Instrument Serif` (Display), `Geist Sans` (UI), `Geist Mono` (Data)
- **3D & Kinetic Engine**: `Three.js`, `@react-three/fiber`, `GSAP` + `ScrollTrigger`, `Lenis`
- **Client-Side AI/ML**: `@imgly/background-removal`, `onnxruntime-web`, `tesseract.js`
- **PDF Engine**: `pdfjs-dist` (bundled worker), `jspdf`, `pdf-lib`
- **Offline & PWA**: Workbox Service Worker, SSG Prerendering of all 20 routes

---

## 🔒 Absolute Privacy Guarantee

> **Your Files Never Leave Your Device.**

ImageKit Pro executes all image transformations strictly within browser client memory (Canvas API, OffscreenCanvas, and Web Workers). There are **no remote APIs, no server uploads, no analytics trackers, and no third-party CDNs**.
