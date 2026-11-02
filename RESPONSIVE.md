# ImageKit Pro — Responsive Design & Mobile Architecture (`RESPONSIVE.md`)

This document records all responsive foundations, mobile adaptations, touch optimizations, hardware guardrails, and QA test matrices implemented for **ImageKit Pro** (`https://imagekitpro.cc`).

---

## 1. Foundation: Mobile-First Breakpoints & Fluid Tokens

All breakpoints are defined once as CSS custom properties in `src/styles/tokens.css` and mirrored in `src/hooks/useBreakpoint.ts`:

| Token | Breakpoint | Target Form Factor | Layout Pattern |
|---|---|---|---|
| `--bp-xs` | `360px` | Ultra-compact phones (iPhone SE1, Fold cover) | 1-col grid, stacked actions |
| `--bp-sm` | `480px` | Standard compact smartphones | 2-col cards, compact headers |
| `--bp-md` | `768px` | Small tablets & phablets in portrait | Bottom sheet transitions to side rail |
| `--bp-lg` | `1024px` | Standard tablets, iPad Air/Pro portrait, small laptops | 320px fixed left rail + canvas |
| `--bp-xl` | `1440px` | Standard desktops & high-res laptops | 360px collapsible left rail + centered canvas |
| `--bp-2xl` | `1920px+` | Ultrawide & 4K desktop displays (up to 3440px) | 400px rail, padded preview viewport |

### Fluid Typography & Spacing Scale
- Fluid scales are calculated using CSS `clamp()` anchored against viewport width:
  - `--font-size-base`: `clamp(0.9375rem, 0.9rem + 0.25vw, 1rem)` (15px – 16px)
  - Inputs, selects, and textareas strictly enforce `font-size: max(16px, 1rem)` on screens below 768px to **prevent iOS Safari auto-zooming** upon focus.
  - Line length is capped at `72ch` (`--reading-max-width`) for reading surfaces (guides, privacy policy, SEO intros).

### Viewport & Safe-Area Insets
- Modern dynamic viewports are prioritized: `100dvh` (with `100vh` fallback).
- Safe area CSS environment variables are factored into headers, navigation bars, bottom sheets, and action bars:
  - `--safe-top: env(safe-area-inset-top, 0px)`
  - `--safe-bottom: env(safe-area-inset-bottom, 0px)`
  - `--safe-left: env(safe-area-inset-left, 0px)`
  - `--safe-right: env(safe-area-inset-right, 0px)`

### Touch Targets & Pointer Modalities
- On devices with coarse pointers (`@media (pointer: coarse)`), interactive elements (buttons, segmented controls, star toggles, sliders, chips) have a minimum hit target of **44×44px**.
- Sliders feature touch thumbs expanded to 28×28px with 12px touch padding.
- `touch-action: manipulation` disables double-tap-to-zoom delays on buttons and controls.

---

## 2. Mobile Home Screen Architecture (< 768px)

On mobile screens, 3D WebGL orbit rendering is gracefully bypassed in favor of a zero-scroll, high-performance 100dvh native mobile interface:
1. **Direct Drop & File Intake**:
   - Prominent full-width `"Choose or drop an image"` button.
   - Secondary quick-action row with direct **"Take Photo"** camera trigger and **"Try Sample"**.
2. **Category Navigation**:
   - Horizontally swipeable pill chips (`mobile-chips`) without intrusive scrollbars.
3. **Dedicated 2-Column / 1-Column Tool Cards**:
   - Phones with width >= 360px display 2 columns; ultra-compact (< 360px) display 1 column.
   - Smooth touch feedback (`:active` transform and border highlight).
   - Star favorite toggles with explicit 44×44px hit bounds.

---

## 3. Tool Workspace: Draggable Mobile Bottom Sheet

On screens < 768px, tools render with an adaptive workspace layout (`src/components/WorkspaceLayout.tsx`):
- **Desktop/Tablet (>= 768px)**: Standard left control rail with quick collapse/expand button (`Ctrl+\`).
- **Mobile (< 768px)**: Draggable multi-snap bottom sheet:
  - **Peek (`snap-peek`, ~48px)**: Keeps canvas maximized while showing adjustments summary handle.
  - **Half (`snap-half`, ~46vh)**: Shows key tool sliders and options alongside active canvas preview.
  - **Full (`snap-full`)**: Expands full control panel with momentum scrolling.
- **Gesture Support**:
  - Pointer-based swipe tracking with `setPointerCapture`.
  - Tap or keyboard (`Enter`, `Space`) on handle bar cycles snap states.
  - `Escape` key immediately collapses an expanded sheet back to peek.
- **Virtual Keyboard Awareness (`useVisualViewport`)**:
  - Tracks `window.visualViewport` resize and scroll offsets.
  - Automatically shifts pinned bottom action bars above the on-screen keyboard (`translateY(-offset)`).
  - Automatically raises sheet from `peek` to `half` when an input is focused.

---

## 4. Hardware Guardrails & Native Capabilities

### iOS Safari Canvas Memory Ceiling
- **Issue**: iOS Safari allocates maximum ~16.7 megapixels (4096×4096) to HTML5 `<canvas>` elements; exceeding this causes silent canvas crashes or tab reloads.
- **Fix (`src/utils/imageProcessing.ts`)**:
  - `IOS_MAX_CANVAS_AREA`: `16,777,216` (16.7 MP).
  - `MOBILE_PREVIEW_MAX_DIM`: `2048px`.
  - `clampDimensionsForDevice(width, height, isMobile)` scales preview renders safely on mobile while keeping full resolution for final export.

### Native Mobile Downloads via Web Share API
- Mobile Safari and in-app browsers (Instagram, TikTok, Facebook) frequently fail standard `<a download="...">` blob anchors.
- `downloadBlob()` in `src/utils/imageProcessing.ts` automatically detects touch devices and uses `navigator.share({ files: [file] })` to summon the native iOS / Android share sheet, enabling direct saving to Apple Photos or Google Photos.
- Graceful fallbacks: standard anchor download, followed by `window.open(url, '_blank')`.

### Direct Camera Intake (`capture="environment"`)
- `Dropzone.tsx` includes `<input type="file" accept="image/*" capture="environment">` alongside the standard file picker.
- Mobile users can snap high-res receipts, documents, or photos straight into tools (OCR, Background Remover, Cropper, Scanner).

### Metered & Slow Connection Warnings
- Tools downloading neural networks or language packs (`BackgroundRemover.tsx` ~30MB, `OcrExtractor.tsx` traineddata) inspect `navigator.connection` (`saveData`, `2g`, `3g`).
- Displays an alert banner notifying the user before downloading heavy offline models.

### PWA Smart Install Prompt
- `InstallPrompt.tsx` monitors `beforeinstallprompt` and only prompts after a user successfully processes at least one image (`ik_task_completed`).

---

## 5. Automated E2E Test Suite (Playwright)

Full viewport matrix configured in `playwright.config.ts`:
1. `phone-xs-320x568` (iPhone SE1 / Fold outer)
2. `phone-compact-360x640` (Galaxy S8)
3. `iphone-x-375x812`
4. `iphone-14-390x844`
5. `phone-large-412x915` (Pixel 7)
6. `phone-max-430x932` (iPhone 14 Pro Max)
7. `phablet-landscape-812x375` (iPhone X Landscape)
8. `tablet-portrait-768x1024` (iPad Mini)
9. `tablet-landscape-1024x768` (iPad Mini Landscape)
10. `tablet-pro-820x1180` (iPad Air)
11. `laptop-compact-1280x800`
12. `desktop-standard-1440x900`
13. `desktop-large-1920x1080` (FHD)
14. `desktop-ultrawide-2560x1080` (Ultrawide)
15. `desktop-superwide-3440x1440` (34" Ultrawide)

Tests cover:
- Zero horizontal overflow across all routes (`scrollWidth === clientWidth`).
- Home single-screen 100dvh fit.
- Draggable bottom sheet gestures and snap points.
- 200% browser zoom readability and accessibility.

---

## 6. Manual QA Verification Checklist

Use this checklist when validating on physical devices:

- [ ] **Physical iPhone (Safari, iOS 16+)**:
  - [ ] Notch & home indicator respected (`env(safe-area-inset)`).
  - [ ] No zooming when tapping input fields (`>= 16px`).
  - [ ] Camera trigger opens native camera interface.
  - [ ] "Save / Download" opens native iOS Share sheet to save directly to Photos.
  - [ ] Canvas renders photos up to 48MP without tab reload (clamped preview).
- [ ] **Physical Android Phone (Chrome)**:
  - [ ] Dynamic address bar scrolling does not cause layout jumps (`100dvh`).
  - [ ] Bottom sheet drag handle moves smoothly between peek, half, and full.
  - [ ] On-screen keyboard shifts action bar without hiding inputs.
- [ ] **In-App Webview (Instagram / Twitter / Slack)**:
  - [ ] Web Share API fallback functions correctly.
  - [ ] Command palette (`Ctrl+K` button) opens full-screen modal with close button.
- [ ] **Tablet / Foldable (iPad / Surface / Galaxy Fold)**:
  - [ ] Seamless transition between folded (bottom sheet) and unfolded (side rail).
  - [ ] Orientation change from portrait to landscape maintains tool state and canvas ratio.
- [ ] **Desktop Browser Zoom (Ctrl + to 200%)**:
  - [ ] Content reflows without text overlapping or horizontal scrollbars.
  - [ ] Color contrast passes WCAG AA (4.5:1 text, 3:1 UI boundaries).
