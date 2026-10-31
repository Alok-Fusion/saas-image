# ImageKit Pro — Immersive 3D Experience & Design Architecture
*Award-level creative engineering specification for ImageKit Pro (Awwwards / FWA standard).*

---

## 1. Creative Direction & Philosophy

ImageKit Pro unites two opposing worlds:
1. **The Pure Creative Utility**: 20 zero-compromise, 100% in-browser image tools with absolute privacy (no uploads, no telemetry, no backend).
2. **The Cinematic Front Door**: An atmospheric, scroll-driven visual journey where visitors experience image transformations directly in interactive 3D before diving into any tool.

### Design Tone
- **Confident & Minimal**: Minimal prose, oversized typography, cinematic negative space.
- **Physicality & Light**: Dark studio stage (`#07070a`), directional rim lighting, volumetric light rays, tactile material physics (roughness, metalness, glass transmission).
- **Intentional Motion**: No arbitrary bouncy fluff. Every animation is anchored to scroll physics, user intent, or visual metaphor.
- **Dual Engine Architecture**: WebGL 3D canvas acts as a decorative backdrop (`aria-hidden="true"`), layered beneath an accessible semantic DOM with complete keyboard navigability, screen reader support, and instant low-power fallback.

---

## 2. Color Palette & Lighting System

### Primary Canvas Palette
| Token | Hex | Role |
| :--- | :--- | :--- |
| `bg-void` | `#07070a` | Deepest background void, cinematic letterbox tone |
| `bg-studio` | `#0d0d12` | Studio floor & backdrop vignette |
| `bg-surface-glass` | `rgba(18, 18, 24, 0.72)` | Frosted glass panel backgrounds (`backdrop-filter: blur(16px)`) |
| `border-glass` | `rgba(255, 255, 255, 0.08)` | 1px hairline card borders catching specular light |
| `border-focus` | `rgba(212, 255, 58, 0.6)` | Electric lime focus ring highlight |
| `text-hero` | `#fbfbfd` | Optical display white (98% luminance) |
| `text-dim` | `#9e9ea8` | Narrative paragraph text (65% luminance) |
| `text-whisper` | `#585864` | Chapter numbers, coordinates, hotkey chips |

### Electric Accents
- **Key Electric Accent (Electric Lime)**: `#d4ff3a` — High-energy creative punch for primary triggers, active badges, and particle emissions.
- **Secondary Accent (Electric Cyan)**: `#00f0ff` — Scan lines, OCR laser sweeps, privacy shield fields.
- **Warm Glow (Amber Specular)**: `#ff9e3b` — Warm studio rim light on 3D photo layers.

### 3D Lighting Setup (Three.js Studio)
- **Key Light**: Directional Light (`#ffffff`, intensity: `2.4`), positioned at `[5, 8, 5]`, cast soft shadow.
- **Rim / Kicker Light**: Directional Light (`#d4ff3a`, intensity: `3.0`), positioned at `[-6, 4, -4]` to outline photo card edges with lime sheen.
- **Fill Light**: Point Light (`#00f0ff`, intensity: `1.2`), positioned at `[0, -4, 2]` for subtle blue-cyan underfill.
- **Atmospheric Fog**: Exponential squared fog (`#07070a`, density: `0.035`) ensuring distant objects dissolve naturally into darkness.

---

## 3. Typography Scale & Hierarchy

### Fonts
1. **Display Face**: `Instrument Serif` (Italic & Regular via `@fontsource/instrument-serif`) — Sculptural, literary, and high-fashion editorial contrast.
2. **Interface Sans**: `Geist Sans` (via `@fontsource/geist-sans`) — Razor-sharp geometric legibility for controls, tabs, and toolbars.
3. **Data Mono**: `Geist Mono` (via `@fontsource/geist-mono`) — Tabular figures for file sizes, dimensions, percentages, and chapter markers.

### Type Hierarchy
| Level | Font | Size (Clamp) | Tracking | Leading | Role |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Headline Hero** | Instrument Serif | `clamp(56px, 9vw, 150px)` | `-0.03em` | `0.92` | "Raw power. Zero trace." |
| **Chapter Title** | Instrument Serif | `clamp(40px, 6vw, 96px)` | `-0.02em` | `0.98` | Chapter headlines |
| **Numeral Index** | Geist Mono | `clamp(18px, 2.5vw, 36px)` | `0.1em` | `1.0` | `01`, `02`, `07` |
| **Body Narrative** | Geist Sans | `clamp(15px, 1.2vw, 18px)` | `-0.01em` | `1.6` | Narrative subtitles |
| **Button / Chip** | Geist Sans | `13px` / `14px` | `0.02em` | `1.2` | Action triggers, badges |
| **Metric Telemetry**| Geist Mono | `13px` | `0.04em` | `1.0` | `8.4 MB → 640 KB` |

---

## 4. Motion Choreography & Named Physics

All kinetic motion adheres to three physics models:

```css
/* Named Cubic-Bezier Easings */
--ease-cinematic: cubic-bezier(0.16, 1, 0.3, 1);    /* Smooth camera & page wipes */
--ease-snappy: cubic-bezier(0.25, 1, 0.5, 1);       /* Cursor rings, card pulls */
--ease-elastic: cubic-bezier(0.34, 1.56, 0.64, 1);  /* Badge snaps, drop triggers */
```

### Durations & Scrubbing
- **Smooth Scroll (Lenis)**: `lerp: 0.08`, `duration: 1.2s`, `wheelMultiplier: 0.9`. Respects touch inertia and OS trackpads.
- **ScrollTrigger Timelines**: 100% scrubbed against viewport progress (`scrub: 0.8`), ensuring bidirectional perfection (scrolling up reverses the animation identically).
- **Page Route Transitions**: `600ms` full-screen dual-tone shutter curtain (`#0d0d12` sliding over `#d4ff3a` hairline).
- **Hover Micro-interactions**: `180ms --ease-snappy` for cursor growth, letter rolling, and button magnetics.

---

## 5. Chapter-by-Chapter Storyboard

### Chapter 00: Opening & Hero (0 to 100% Preloader → Studio Rise)
- **Visual**: Minimal progress line across bottom (0% → 100%), with monospace counter ticking up. Resolves within 400ms if assets are ready, capped strictly at 1.5s.
- **Transition**: Line expands into full-width razor wire, text fades in via masked vertical rise (`transform: translateY(100%) → translateY(0%)`).
- **3D Scene**: Three high-resolution floating image planes hover in perspective with gentle multi-axis harmonic drift (`sin(t * 0.8)`). Cursor position creates reactive 3D tilt. A volumetric pixel dust cloud (1,200 particle instances) floats in the background.
- **Call-to-Action**: "Explore 20 Tools" pill button with magnetic pull + subtle "Scroll to inspect" mouse icon.

### Chapter 01: Squeeze (Image Compression)
- **Visual Metaphor**: The 3 photo planes coalesce into one, then compress violently inward along the Z and X axes into a dense, solid, crystalline block.
- **Telemetry**: Monospace telemetry HUD animates from `8.4 MB` countdown to `640 KB` (`-92.4%`).
- **Particles**: Compressed pixel dust explodes outward in ring geometry as the compression reaches maximum density.
- **Action**: "Open Image Compressor →" routes directly to `/compress-image`.

### Chapter 02: Framing (Smart Crop & Aspect Morph)
- **Visual Metaphor**: Four illuminated golden corner crop reticles slide from the edges and snap onto the image plane.
- **Morphing**: The image plane aspect ratio morphs seamlessly through standard formats: `1:1 (Square)` → `16:9 (Landscape)` → `9:16 (Story)`. The crop reticles track vertex coordinates in real time.
- **Action**: "Open Image Cropper →" routes to `/crop-image`.

### Chapter 03: Separation (Background Removal)
- **Visual Metaphor**: The foreground subject elevates forward on the Z-axis (+2.0 units) into crisp silhouette focus.
- **Dissolve**: The background plate breaks down into an alpha noise grid, dissolving into floating holographic particles that scatter into the void.
- **Action**: "Open Background Remover →" routes to `/remove-background`.

### Chapter 04: Synthesis (Image to PDF & Multi-page Binder)
- **Visual Metaphor**: Multiple scattered photo plates fly into a neat vertical stack. A paper fold distortion bends the sheets, binding them into an elegant 3D PDF document folio that flips its cover toward the viewer.
- **Action**: "Open Image to PDF →" routes to `/image-to-pdf`.

### Chapter 05: Inscription (OCR Text Extraction)
- **Visual Metaphor**: A glowing horizontal laser beam (electric cyan) sweeps vertically across the image document.
- **Typographic Flight**: As the beam scans pixels, 3D extruded monospace characters (`A`, `9`, `&`, `K`, `0`) detach from the surface, fly toward the camera, and assemble into formatted digital text strings.
- **Action**: "Open OCR Extractor →" routes to `/extract-text`.

### Chapter 06: Zero-Knowledge (EXIF Sanitization & Privacy)
- **Visual Metaphor**: Floating metadata badges (`GPS: 37.7749° N`, `Camera: Sony A7R IV`, `Date: 2026:10:31`) hover around the photo. An iridescent spherical forcefield envelopes the photo plane; the metadata tags peel off like burnt foil and disintegrate into thin smoke.
- **Headline**: *"Nothing leaves your machine. Ever."*
- **Action**: "Open EXIF Cleaner →" routes to `/clean-exif`.

### Chapter 07: Manifestation (3D Device Mockups)
- **Visual Metaphor**: A photorealistic extruded 3D smartphone frame (iPhone vector geometry) sweeps into center view. The processed image snaps perfectly onto its OLED glass display. The phone rotates 45 degrees along the Y-axis to showcase bezel reflections and real-time shadows.
- **Action**: "Open Mockup Generator →" routes to `/device-mockup`.

### Chapter 08: The Constellation (3D Tool Galaxy & Accessible Grid)
- **Visual Metaphor**: The camera accelerates backward (`z: 5 → 24`), revealing all 20 tools as an interactive constellation of 3D floating glass cards arranged in a curved cylindrical amphitheater.
- **Interaction**: Cursor hover pulls the target tool tile forward with specular highlight and dims non-hovered tiles. Clicking initiates a camera zoom into the tile and triggers the page transition into the tool.
- **Semantic Twin**: A fully accessible, screen-reader friendly HTML filterable grid with keyboard navigation, search bar, and Cmd/Ctrl+K command palette is integrated directly below.

---

## 6. ASCII Wireframes

### 6.1 Hero Section
```
+-----------------------------------------------------------------------+
| [IK] IMAGEKIT PRO            [Cmd+K Search]   [Reduce FX] [Theme]     |
|-----------------------------------------------------------------------|
|                                                                       |
|     ( 3D VOLUMETRIC SCENE: Floating Photo Stack + Pixel Dust )        |
|                                                                       |
|                     Raw power. Zero trace.                            |
|             20 studio image tools running 100% in your browser.       |
|                                                                       |
|                 [ Explore All Tools ]     (↓ Scroll)                  |
|                                                                       |
| [======================================] 100% PRIVATE CLIENT-SIDE    |
+-----------------------------------------------------------------------+
```

### 6.2 Scroll Chapter Layout (Pinned Viewport)
```
+-----------------------------------------------------------------------+
| (01/07)                                                               |
|                                                                       |
|  01                                                                   |
|  INSTANT                                                              |
|  SQUEEZE.             +-------------------------------+               |
|                       |   [3D Interactive Canvas]     |               |
|  8.4 MB → 640 KB      |   Photo compressing into      |   o (01)      |
|  No artifacting.      |   dense crystal cube with     |   . (02)      |
|                       |   bursting pixel dust         |   . (03)      |
|  [Open Compressor →]  |                               |   . (04)      |
|                       +-------------------------------+               |
|                                                                       |
+-----------------------------------------------------------------------+
```

### 6.3 Tool Field (Constellation / Grid)
```
+-----------------------------------------------------------------------+
|  THE SUITE                                                            |
|  20 precision tools. Select any to begin.                             |
|  [All] [Essentials] [Edit] [PDF] [Privacy] [Design] [Social]          |
|                                                                       |
|  +--------------------+  +--------------------+  +-----------------+  |
|  | [Icon] Compressor  |  | [Icon] Resizer     |  | [Icon] Remover  |  |
|  | Shrink JPEG/PNG    |  | Scale any preset   |  | AI cutout       |  |
|  +--------------------+  +--------------------+  +-----------------+  |
|  +--------------------+  +--------------------+  +-----------------+  |
|  | [Icon] Cropper     |  | [Icon] PDF to Img  |  | [Icon] Inpaint  |  |
|  | Aspect lock crops  |  | Convert PDF pages  |  | Erase watermarks|  |
|  +--------------------+  +--------------------+  +-----------------+  |
+-----------------------------------------------------------------------+
```

### 6.4 Tool Workspace Page
```
+-----------------------------------------------------------------------+
| [← Home] [Icon] Image Compressor        [Chain To...] [Reset]         |
|-----------------------------------------------------------------------|
| CONTROL RAIL (340px)        | CENTER WORKSPACE CANVAS                 |
|                             |                                         |
| File: photo-sample.jpg      | +-------------------------------------+ |
| Original: 3840x2160 (4.2 MB)| |                                     | |
| Target:   WebP @ 82%        | |   [ Checkerboard Stage with Zoom ]  | |
|                             | |                                     | |
| [Quality Slider: 82%]       | |   [ Before / After Compare Split ]  | |
| [Format: WebP | PNG | JPG]  | |                                     | |
|                             | +-------------------------------------+ |
| Savings: -78% (920 KB)      |                                         |
|-----------------------------------------------------------------------|
| [ + Drop New Image ]        | [ Reset Canvas ]   [ Download Output ]  |
+-----------------------------------------------------------------------+
```

---

## 7. Performance Budgets & Resilience

1. **Strict Fallback Triggers**:
   - WebGL context creation failure
   - Low hardware concurrency (`navigator.hardwareConcurrency < 4`)
   - Low device memory (`navigator.deviceMemory < 4`)
   - User preference `prefers-reduced-motion: reduce`
   - User clicks `Reduce effects` toggle (persisted in `localStorage`)
   - Mobile screen width `< 768px`
2. **Fallback Behavior**:
   - Zero WebGL instances initialized.
   - 3D canvas replaced with high-fidelity static layered illustrations with CSS parallax.
   - Lenis smooth scroll disabled; native scroll preserved.
3. **Resource Management**:
   - Frameloop set to `demand` when viewport is idle.
   - WebGL canvas unmounted / disposed during tool view active state to dedicate 100% of GPU/CPU resources to image processing algorithms (ONNX, Tesseract, Canvas 2D).
   - Single global WebGL context (`WebGLRenderer.dispose()` cleanly on exit).
