# ImageKit Pro — Single-Screen 3D Orbit Experience & Design System
*Award-level creative engineering specification for ImageKit Pro (Single-Screen 100dvh Experience).*

---

## 1. Creative Direction & Philosophy

ImageKit Pro replaces long, fatigue-inducing scrolling landing pages with an **instantaneous single-screen creative instrument** (`100dvh`).

### Core Principle: Speed to Action
- **Zero Scroll**: The home page fits strictly within `100dvh` on desktop and mobile. No scrollbars, no wheel hijacking, no narrative scrolling chapters.
- **Two-Second Landing to Action**: Visitors can drag-and-drop an image, paste from clipboard, click the central drop well, or pick any of the 20 tools within 2 seconds of arrival.
- **Two Clicks to Result**: Dropping a file re-sorts the 3D orbit into an illuminated "Suggested" ring. One click opens the tool with the image already loaded in memory.
- **Tactile 3D Depth**: Depth, volumetric studio lighting, responsive cursor tilt, and kinetic orbit physics provide awe without friction.

---

## 2. One-Screen Architecture (Three Layers)

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
|         LAYER 2: 3D TOOL ORBIT (20 Category-Colored Nodes in Concentric Orbit Rings)                |
|                    (Hover -> Pull forward, slow orbit, dim rest, show mini-demo)                   |
|                                                                                                    |
|         LAYER 1: WEBGL STUDIO SCENE (Floating Center Photo Stack + 600 Pixel Dust Particles)       |
|                                                                                                    |
|  LAYER 3: HTML FOOTER (Single Thin Line: MIT License · Alok Kushwaha · 100% In-Browser Privacy)   |
+----------------------------------------------------------------------------------------------------+
```

### Layer 1: WebGL Studio Scene
- **Centerpiece**: Floating 3D image stack with procedural artwork, subtle harmonic drift (`sin(t * 0.7)`), and cursor parallax tilt.
- **Lighting**: Three-point studio lighting (Key Directional Light `2.4`, Electric Lime Rim Light `3.2`, Cyan Underfill `1.2`, Fog `0.035`).
- **Particles**: 600 floating pixel dust particles drifting gently in 3D studio space.
- **Drop Reactive**: Dragging a file over the viewport makes the photo planes open like an iris and emit an electric glow.

### Layer 2: 3D Tool Orbit
20 tools arranged as 3D orb/card nodes in 3 concentric orbit rings around the photo stack:
- **Inner Ring (Radius 3.2)**: Core Essentials (Compressor, Resizer, Background Remover, Comparison Slider).
- **Middle Ring (Radius 5.0)**: Edit & PDF (Cropper, Rotator, Watermark Adder, Watermark Remover, Image to PDF, PDF to Image).
- **Outer Ring (Radius 6.8)**: Privacy, Design, Social & A11y (EXIF Cleaner, Duplicate Finder, OCR, Device Mockup, Palette Extractor, ASCII Art, Thumbnail Maker, Grid Splitter, Favicon, Color Blindness).

#### Category Color Code
- **Essentials**: Electric Indigo (`#6366f1`)
- **Edit & Transform**: Sky Blue (`#38bdf8`)
- **PDF Utilities**: Rose Red (`#e11d48`)
- **Privacy & Security**: Emerald Green (`#10b981`)
- **Design & Creative**: Purple Violet (`#a855f7`)
- **Social Media**: Warm Amber (`#f59e0b`)
- **Accessibility**: Vivid Cyan (`#06b6d4`)

#### Node Micro-Interactions
- **Idle**: Gentle continuous orbital rotation around the Y-axis.
- **Hover**: Orbit slows smoothly (`lerp` to 10% speed). The hovered node scales up (`1.4x`) and pulls toward the camera (+1.2 units on Z). Other nodes dim to 30% opacity.
- **Hover Card**: Shows tool title, category badge, one-line summary, and a live SVG/CSS micro-animation (e.g. compress block squeezing, crop brackets snapping, background cutout elevating).
- **Click**: Camera accelerates forward into the node (500ms smooth push), triggering the tool workspace slide-in.
- **Keyboard**: Arrow keys step focus across the orbit ring; Enter executes tool launch.

### Layer 3: Semantic HTML UI Layer
- **Header**:
  - Logo with PRO badge
  - Live category filter chips (clicking a category illuminates its matching orbit nodes and dims others)
  - Search trigger with Cmd/Ctrl+K spotlight
  - **"20s Tour" Button**: Triggers a camera glide across key tools (Compress → Crop → BG Remove → PDF → OCR → Privacy) with clean on-screen overlays, skippable with Esc or click.
  - **"List / 3D" Toggle**: Lets visitors instantly switch between the 3D Orbit and an accessible 2D Grid view.
  - **"Minimal FX" Toggle**: Enables instant low-power mode.
  - Theme Toggle (Light / Dark).
- **Center Hero & Drop Well**:
  - Monumental display headline in Instrument Serif (`clamp(40px, 5.5vw, 76px)`).
  - Compact glass drop target (`height: 94px`) with drag-and-drop, file picker, clipboard paste listener, and "Try a sample image" shortcut.
- **Footer**: Single 32px slim bar with privacy pill, copyright, and author credit.

---

## 3. Drop-First Flow & Smart Re-Sorting

When a user drops, pastes, or loads an image on the home screen:
1. **Intake Animation**: Center photo planes open and transition to display the uploaded image.
2. **File Analysis**: `suggestToolsForFile(file)` evaluates MIME type, payload size, dimensions, and EXIF flags.
3. **Orbit Re-Sorting**: The top 3 recommended tools automatically glide to the front of the inner ring with an illuminated **"Suggested for this image"** pulsing badge.
4. **Instant Launch**: One click launches the chosen tool with the image already pre-loaded.

---

## 4. Mobile & Responsive Layout (`< 768px`)

- Viewport locked to `100dvh` (`overflow: hidden`).
- Orbit radius scaled adaptively so all interactive nodes remain easily tappable (minimum 44x44px touch targets).
- Quick switch to 2D List View available via prominent top pill.
- Touch drag rotates the orbit manually with momentum physics.

---

## 5. Performance Budgets & Fallbacks

- **Zero Scroll Hijacking**: Lenis and ScrollTrigger removed. Native event listeners handle pointer tilt and clicks.
- **Initial JS Gzip**: `< 100 kB`.
- **Three.js Chunking**: Isolated in `three-vendor` chunk; Canvas is lazy-loaded with a lightweight CSS skeleton for instant FCP (< 0.8s).
- **GPU Cleanup**: WebGL canvas unmounts immediately when entering any tool workspace.
