<div align="center">
  <h1>✨ ImageKit Pro</h1>
  <p>
    <strong>Single-Screen 100dvh 3D Orbit Experience · 20 Client-Side Image Tools</strong>
  </p>
  <p>
    <img src="https://img.shields.io/badge/Privacy-100%25%20In--Browser-success?style=for-the-badge&logo=shield" alt="Privacy First" />
    <img src="https://img.shields.io/badge/Tools-20%20Precision%20Instruments-blue?style=for-the-badge&logo=tools" alt="20 Tools" />
    <img src="https://img.shields.io/badge/3D%20Experience-Three.js%20Orbit-black?style=for-the-badge&logo=three.js" alt="3D Orbit" />
    <img src="https://img.shields.io/badge/Initial%20JS-21.0%20kB%20gzip-d4ff3a?style=for-the-badge&color=282833&labelColor=0d0d12" alt="Bundle Size" />
    <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
  </p>
  
  <p>
    <em>A cinematic, single-screen 3D creative instrument. Zero long scrolling. Instant speed to action: drop an image in &lt; 2 seconds, inside a working tool in &lt; 2 clicks.</em>
  </p>

  <p>
    Developed with ❤️ by <strong>Alok Kushwaha</strong>
  </p>
</div>

---

## 🌟 The Single-Screen 3D Orbit Experience

ImageKit Pro replaces long, fatigue-inducing scrolling pages with an **instantaneous single-screen 3D creative instrument** (`100dvh`):

```
+----------------------------------------------------------------------------------------------------+
|  LAYER 3: HTML UI (Top Bar: Logo | Category Chips | Search Cmd+K | Tour | List View | FX | Theme)  |
|                                                                                                    |
|                                       Fast, private image tools.                                   |
|                          20 precision client-side utilities. Zero server uploads.                  |
|                                                                                                    |
|                     +-------------------------------------------------------+                      |
|                     |        [↑] Drop an image, paste, or click to start     |                      |
|                     |                   Try a sample image                  |                      |
|                     +-------------------------------------------------------+                      |
|                                                                                                    |
|         LAYER 2: 3D TOOL ORBIT (20 Category-Colored Nodes in 3 Concentric Rings)                   |
|                    (Hover -> Pull forward, slow orbit, dim rest, show mini-demo)                   |
|                                                                                                    |
|         LAYER 1: WEBGL STUDIO SCENE (Floating Center Photo Stack + 600 Pixel Dust Particles)       |
|                                                                                                    |
|  LAYER 3: HTML FOOTER (Single Thin Line: MIT License · Alok Kushwaha · 100% In-Browser Privacy)   |
+----------------------------------------------------------------------------------------------------+
```

### Three Concentric Orbit Rings
- **Inner Ring (Radius 3.25)**: Core Essentials (`Compressor`, `Resizer`, `Background Remover`, `Comparison Slider`).
- **Middle Ring (Radius 4.85)**: Edit & PDF (`Cropper`, `Rotator`, `Watermark Adder`, `Watermark Remover`, `Image to PDF`, `PDF to Image`).
- **Outer Ring (Radius 6.45)**: Privacy, Design, Social & A11y (`EXIF Cleaner`, `Duplicate Finder`, `OCR Text Extractor`, `Device Mockup`, `Color Palette`, `ASCII Art`, `Thumbnail Maker`, `Instagram Grid`, `Favicon`, `Color Blindness`).

### Drop-First Flow & Smart Re-Sorting
- **Aperture Opening**: Dropping or pasting an image on home causes the center 3D stack to open like an iris and emit an electric glow.
- **Smart Analysis**: `suggestToolsForFile(file)` detects format, size, and dimensions.
- **Dynamic Glide**: The top suggested tools smoothly glide to the front of the orbit with an illuminated pulsing badge for instant 1-click launch.

### Guided 20-Second Tour
- Click **"20s Tour"** in the top bar to watch the camera glide smoothly through key tools with live micro-preview cards and captions. Esc or click exits immediately.

### Accessible 2D List Fallback
- Click **"List View"** to swap the 3D canvas for a full accessible 2D grid of all 20 tools with instant keyboard navigation, category filtering, and favorite starring.

---

## ⚡ Performance & Zero-Compromise Fallback

- **Sub-22 kB Initial Gzip Payload**: The Three.js WebGL engine is strictly code-split (`React.lazy`) and loads asynchronously after the initial paint.
- **Automatic Capability Detection**: Systems with `prefers-reduced-motion`, low memory (`< 4 GB`), low concurrency (`< 4 threads`), or mobile viewports can toggle between 3D Orbit and 2D List View at any time.
- **Zero Background GPU Leaks**: The WebGL canvas unmounts immediately when entering any tool workspace, dedicating 100% of GPU and memory to processing your image.
- **100% Local Privacy Guarantee**: All image operations run in browser memory using Web Workers, Canvas, and WebAssembly. No photos are ever uploaded.

---

## 🛠️ The 20 In-Browser Precision Tools

### 📦 Essentials
1. **Image Compressor**: High-efficiency compression for JPEG, PNG, and WebP with real-time preview and size savings counter.
2. **Social Media Resizer**: Export to exact dimensions for Instagram, YouTube, LinkedIn, X/Twitter, and Facebook.
3. **Background Remover**: Local AI model isolates subjects in seconds with zero server dependencies.
4. **Image Comparison Slider**: Interactive split-pane before/after slider with synced zoom.

### ✂️ Edit & Transform
5. **Image Cropper**: Precision crop with golden ratio, 1:1, 16:9, and custom aspect ratios.
6. **Image Rotator**: Lossless 90°/180° rotation and horizontal/vertical flip.
7. **Watermark Adder**: Custom text stamps with opacity, font, position, and rotation angle.
8. **Watermark Remover**: Intelligent multi-pass inpainting to erase unwanted stamps and logos.

### 📄 PDF Suite
9. **Image to PDF**: Combine multiple photos into a single paginated, print-ready PDF document.
10. **PDF to Image**: Render multi-page PDF documents into individual high-resolution PNGs.

### 🛡️ Privacy & Security
11. **EXIF Privacy Cleaner**: Permanently scrub GPS coordinates, camera serials, and device metadata.
12. **Duplicate Finder**: Perceptual dHash algorithm to locate identical or similar photos.
13. **OCR Text Extractor**: Offline optical character recognition supporting 12 languages.

### 🎨 Design, Social & Accessibility
14. **Device Mockup Generator**: Frame screenshots in photorealistic iPhone, iPad, and MacBook hardware.
15. **Color Palette Extractor**: Extract dominant swatches with copyable HEX, RGB, and CSS gradient code.
16. **ASCII Art Generator**: Convert images into stylish terminal-ready monospace text art.
17. **Thumbnail Maker**: Design click-worthy social thumbnails with banners, badges, and text.
18. **Instagram Grid Splitter**: Slice panoramic images into 3×3, 3×2, or 3×1 carousel tiles.
19. **Favicon Generator**: Create complete cross-platform favicon packages with `manifest.json`.
20. **Color Blindness Simulator**: Preview designs under protanopia, deuteranopia, and tritanopia color filters.

---

## 🚀 Development & Verification

```bash
# Install dependencies
npm install

# Type check
npm run typecheck

# Lint check
npm run lint

# Run unit tests
npm test

# Build production bundle & prerender static HTML routes
npm run build
```

---

## 📄 License

MIT © [Alok Kushwaha](https://github.com/Alok-Fusion). Free for personal and commercial use.
