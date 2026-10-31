# Changelog — ImageKit Pro

All notable changes and architectural enhancements to ImageKit Pro are documented here.

## [1.0.0-pro] - 2026-10-31

### Phase 1: Bug Fixes & Reliability
- **Type Checking (`tsc`)**:
  - Fixed unused variable `key` in `BackgroundRemover.tsx`.
  - Fixed unused `originalInfo` in `ColorBlindnessSimulator.tsx` and `DeviceMockupGenerator.tsx`.
  - Fixed pdfjs-dist v5 bug in `PdfToImage.tsx` where `page.render()` required the canvas element `{ canvasContext, viewport, canvas }`.
- **Bundled PDF Worker**:
  - Replaced broken cdnjs URL with bundled offline worker: `import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'` and `GlobalWorkerOptions.workerSrc = workerUrl`.
  - Added graceful error handling for password-protected PDFs and memory cleanup releasing rendered canvases sequentially.
- **ESLint 9 Flat Configuration**:
  - Added flat config `eslint.config.js` with `typescript-eslint`, `react-hooks`, and `react-refresh`.
  - Fixed missing hook dependencies, stale closures, and cleanup unmounting.
- **Removed Postinstall Hack**:
  - Removed unnecessary postinstall permissions script.
- **Format & Transparency Preservation**:
  - Fixed `resizeImage` in `src/utils/imageProcessing.ts` to preserve transparency for PNG and WebP instead of forcing white JPEG.
  - Fixed `compressImage` to detect when compressed output is larger than input, warning user and offering original.
- **Storage Safety**:
  - Wrapped `localStorage` in `useFavorites` and `useRecentlyUsed` with try/catch to prevent crashes in private browsing or quota-constrained storage.
- **Dead Code Cleanup**:
  - Removed unused and leaky `OutputBranding.ts` utility.

### Phase 2: Performance
- **Dynamic Code Splitting**:
  - Converted all 20 tools in `App.tsx` from static imports to `React.lazy` with skeleton fallback loaders.
  - Configured Rollup `manualChunks` in `vite.config.ts` to isolate `react`, `pdfjs`, `jspdf`, `pdf-lib`, `tesseract`, `jszip`, and `onnxruntime-web`.
  - Reduced initial bundle download from ~1.4 MB (482 KB gzip) to **166.9 KB (52.65 KB gzip)** (~89% reduction).
  - Added route chunk prefetching on tool card hover and keyboard focus.
- **Web Worker Offloading**:
  - Created `src/workers/image.worker.ts` and `src/utils/imageWorker.ts`.
  - Offloaded CPU-heavy algorithms: Color Blindness matrix transformation, Watermark boundary-fill inpainting, Perceptual difference hashing, Color Palette extraction, and ASCII Art generation.
  - Implemented progress reporting and task cancellation (`AbortError`) to keep UI at 60 FPS without main-thread blocking.
- **Concurrency Limiting**:
  - Created `src/utils/concurrency.ts` to map multi-file operations with hardware-concurrency pool (clamped between 1 and 4).
- **Resource Lifecycle Management**:
  - Created `src/hooks/useObjectUrl.ts` for leak-free blob URL creation and automatic revocation on unmount or input change.
- **Unified File Intake**:
  - Created `src/utils/fileIntake.ts` and shared `src/components/Dropzone.tsx` component.
  - Supports drag and drop, file picker, clipboard paste, format verification, 50 MB file size limit, 100 MP pixel safety guard, and informative HEIC unsupported messages.

### Phase 3: UX & Accessibility
- **Error Boundaries & Feedback**:
  - Wrapped tools and root app with `ErrorBoundary.tsx`.
  - Added global `ToastProvider` and `useToast` hook for status and error notifications.
  - Added clear before/after file size comparisons and action buttons disabled during processing.
  - Added meaningful output file names (e.g., `original-compressed.webp`).
- **Accessibility (A11y)**:
  - Converted tool cards to keyboard-operable elements with `role="button"`, `tabIndex={0}`, and Enter/Space triggers.
  - Added `:focus-visible` styling with 2px accent outlines.
  - Added `aria-label` attributes to back buttons and favorite stars (`aria-pressed`).
  - Added ARIA slider semantics (`role="slider"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, arrow key navigation) to Image Comparison Slider.
  - Added image alt text across preview surfaces.
- **Mobile Responsiveness**:
  - Adjusted grids and containers to scale smoothly down to 360px viewports.
  - Implemented pointer events with `touchAction: none` for touch compatibility on crop handles and sliders.

### Phase 4: SEO, PWA & Architecture
- **Brand Assets**:
  - Generated SVG favicon, 32x32 PNG favicon, 180x180 Apple touch icon, 192x192 & 512x512 PWA icons, and 1200x630 Open Graph preview image.
  - Updated `index.html` with canonical URL, Open Graph, Twitter Cards, and schema.org JSON-LD web application metadata.
- **PWA Service Worker**:
  - Configured `vite-plugin-pwa` with `manifest.webmanifest` and Workbox caching app shell and tool chunks offline.
- **SEO & Static Prerendering**:
  - Migrated hash routes to clean paths (e.g. `/compress-image`, `/remove-background`) while preserving automatic redirection from legacy `#/compressor` URLs.
  - Configured `vercel.json` rewrites and caching headers.
  - Added `scripts/prerender.mjs` to output static HTML files for all 20 routes with customized titles, descriptions, H1 headings, and how-to guides.
- **Dependency & Tech Stack Audit**:
  - Removed unused dependencies `exif-js`, `pako`, and `file-saver`.
  - Replaced external EXIF parsing with pure binary JPEG parser in `src/utils/exif.ts`.
  - Replaced inaccurate OpenCV badge in `README.md` with Canvas API and PWA badges.
- **Automated Testing & CI**:
  - Added Vitest 5 suite with 8 test files and 48 unit tests covering `imageProcessing`, `socialPresets`, `fileIntake`, `toolSuggestions`, `duplicateHashing`, `concurrency`, `exif`, and custom hooks.
  - Added GitHub Actions CI workflow in `.github/workflows/ci.yml`.

### Phase 5: Design System & UX Redesign (Linear / Raycast / Figma Aesthetic)
- **Calm, Tool-Like Aesthetic**:
  - Replaced generic purple/pink gradients, glassmorphism blur, and glow shadows with a focused, professional creative utility aesthetic.
  - Neutral surfaces (`#0b0b0e` / `#16161c` dark, `#fafafa` / `#ffffff` light) with 1px hairline borders (`#26262e` / `#e4e4e9`).
  - Single confident accent color: electric indigo (`#4f46e5` / `#6366f1`) for primary actions, focus rings, sliders, and active tabs.
- **First-Class Dual Themes (Light & Dark)**:
  - System preference auto-detection with header theme switcher toggle.
  - Persisted in `localStorage` with safe exception handling.
  - Zero-flash inline theme bootstrap script in `<head>` of `index.html`.
  - Full WCAG AA contrast compliance across all text levels and controls in both themes.
- **Self-Hosted Typography & Mono Scale**:
  - Replaced Google Fonts CDN requests with self-hosted Geist (`@fontsource/geist-sans` and `@fontsource/geist-mono`) with `font-display: swap`.
  - Pure tabular numerals (`.tabular-nums`) for file sizes, dimensions, percentages, and timer counters.
- **Unified Lucide Icons**:
  - Replaced all emoji tool and action icons with tree-shaken `lucide-react` icons in tinted squares.
- **Modular CSS Architecture**:
  - Split global stylesheet into `src/styles/` (`tokens.css`, `base.css`, `layout.css`, `components.css`, `workspace.css`, `tools.css`) with CSS custom properties and backwards-compatibility variable aliases.
- **Shared Atomic UI Library**:
  - Built reusable, accessible components in `src/components/`: `Button`, `ControlGroup`, `Slider`, `SegmentedControl`, `Toggle`, `StatTile`, `FileChip`, `ProgressBar`, `EmptyState`, `CompareView`, `ToolHeader`, `WorkspaceLayout`, `CommandPalette`, `ThemeToggle`, `FileActionChooser`, and `Dropzone`.
- **Desktop 2-Column Workspace Layout Across All 20 Tools**:
  - Replaced repetitive stacked layouts with a 2-column workspace: fixed left controls rail (320–360px), center checkerboard canvas with pan/zoom/fit/compare affordances, and sticky bottom action bar with mono StatTiles.
  - Single-column responsive adaptation for tablet and mobile viewports.
  - Migrated all 20 image tools to `WorkspaceLayout` and `ToolHeader`.
- **Command Palette & Home Drag-and-Drop Action Chooser**:
  - Added global Cmd+K / Ctrl+K spotlight dialog for jumping to any of the 20 tools by title or keywords.
  - Dropping any image onto the Home page opens an interactive "What do you want to do with this image?" chooser modal that launches the chosen tool with the file already loaded.
- **Seamless Cross-Tool Image Chaining**:
  - Added bottom tool chaining suggestion chips carrying the active output file from one tool to the next.

### Phase 6: Award-Level Cinematic Front Door & 3D Scroll Journey (Awwwards / FWA Standard)
- **Cinematic 3D Scroll-Driven Story**:
  - Implemented continuous 3D canvas stage using `three` + `@react-three/fiber` with Three.js studio three-point lighting, atmospheric fog, and cursor-reactive parallax.
  - Scrubbed scroll choreography via `GSAP` + `ScrollTrigger` and `Lenis` smooth scrolling across 7 interactive transformation chapters:
    1. *Squeeze*: photo stack compresses into a dense crystal block with live telemetry countdown (8.4 MB → 640 KB) and exploding pixel dust.
    2. *Framing*: golden crop reticles snap to coordinates; aspect ratio morphs 1:1 → 16:9 → 9:16.
    3. *Separation*: subject lifts on Z-axis (+1.8 units) with dissolving alpha noise grid.
    4. *Synthesis*: photos fold and stack into a 3D multi-page PDF folio.
    5. *Inscription*: electric cyan laser sweep with flying extruded typographic glyphs.
    6. *Zero Trace*: glowing iridescent forcefield wraps photo while EXIF & GPS metadata badges peel away and dissipate.
    7. *Instant Stage*: photo lands onto a rotating 3D OLED smartphone display.
    8. *The Constellation*: camera accelerates backward into an amphitheater of 20 interactive floating 3D tool tiles with hover and click fly-through.
- **Micro-Interactions & Transitions**:
  - Built minimal preloader (0-100 counter and razor progress line, capped at 1.2s).
  - Built custom cursor with trailing elastic ring, hover growth, and contextual labels.
  - Added 500-600ms full-screen shutter curtain route transitions between home and tools.
- **Zero-Compromise Performance & Fallbacks**:
  - Dynamic code-splitting: initial critical JS is **22.42 kB gzip**, with Three.js and 3D canvas lazy-loaded strictly on demand.
  - Automatic hardware detection: low memory (`< 4 GB`), low concurrency (`< 4`), `prefers-reduced-motion`, or mobile automatically runs high-contrast CSS fallback without loading the 3D pipeline.
  - Added header "Minimal FX" / "3D Immersive" toggle persisting in `localStorage`.
  - WebGL context is completely disposed and unmounted when entering a tool workspace, freeing 100% of device GPU and memory for local image operations.

---

## Deliberately Preserved Architectural Choices

1. **Zero-Backend Privacy Guarantee**: All image processing remains 100% inside the browser using HTML5 Canvas, OffscreenCanvas, and Web Workers. No remote uploads or analytics transmitting image data.
2. **Legacy URL Compatibility**: Preserved backwards compatibility for existing `#/<tool>` links by redirecting them transparently to the canonical path-based routes.
3. **No Unnecessary External Dependencies**: UI redesign implemented purely using standard CSS variables, modern HTML, and `lucide-react` without bloated UI component libraries.

---

## Recommended Next Steps

1. **WebGPU Acceleration**: Leverage WebGPU for AI models (`@imgly/background-removal`) where supported for faster inference.
2. **WebAssembly HEIC Decoder**: Bundle a lightweight WASM decoder (such as `libheif-js`) conditionally so iPhone users can convert HEIC images directly without pre-exporting.
3. **Batch Processing**: Extend multi-file concurrency queues to image resizing and watermark application.

