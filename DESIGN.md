# ImageKit Pro — Design System & UX Architecture

ImageKit Pro is designed as a calm, precise, professional browser-based creative utility suite inspired by Linear, Raycast, and Figma. Every tool processes 100% locally in the browser with no uploads, zero tracking, and absolute privacy.

---

## 1. Design Principles & Aesthetic Direction

1. **Tool, Not Landing Page**: Eliminate flashy gradient hero blobs, oversized emojis, bouncy hover transforms, and generic glassmorphism. Surfaces use precise 1px hairline borders, calm neutral grays, and clear information hierarchy.
2. **First-Class Dual Themes**: Light (`theme-light`) and Dark (`theme-dark`) designed from ground up with WCAG AA contrast compliance. Persistent in `localStorage` with zero-flash inline bootstrap.
3. **Monochromatic Neutral Scale + Single Confident Accent**: A single electric indigo accent (`#4f46e5` / `#6366f1`) reserved exclusively for primary calls-to-action, focus indicators, active selection tabs, and slider thumbs.
4. **Information Density with Precision**: Tabular numerals for numbers and file sizes, self-hosted typography via `@fontsource/geist-sans` and `@fontsource/geist-mono` with `font-display: swap`, and uniform Lucide icons in small tinted icon squares.
5. **Purposeful Workspace Layout**: Tools replace tall stacked pages with desktop two-column work environments (fixed control rail on the left, expansive canvas on the right) and fluid mobile adaptations.

---

## 2. Color System & Semantic Tokens

### Dark Theme (`:root[data-theme="dark"]` / system default)
- **Backgrounds & Surfaces**:
  - `bg-app`: `#0b0b0e` (Deep obsidian viewport background)
  - `bg-subtle`: `#121216` (Toolbars, inactive control tracks, canvas wells)
  - `bg-surface`: `#16161c` (Cards, left control rails, headers)
  - `bg-surface-elevated`: `#1c1c24` (Command palette, dropdowns, floating modals)
  - `bg-overlay`: `rgba(11, 11, 14, 0.78)` (Backdrop blur scrim)
- **Borders & Dividers**:
  - `border-subtle`: `#1e1e26` (Hairline section dividers)
  - `border-default`: `#282833` (Card outlines, input borders)
  - `border-strong`: `#383847` (Active boundaries, hover states)
- **Text & Foreground**:
  - `text-primary`: `#f3f3f6` (Primary titles, active labels — contrast 14.8:1)
  - `text-secondary`: `#9d9da8` (Secondary descriptions, metadata — contrast 6.2:1)
  - `text-muted`: `#686875` (Placeholders, hotkey hints — contrast 4.6:1)
  - `text-inverse`: `#0b0b0e` (Text on bright accent buttons)
- **Accent & Interaction**:
  - `accent-default`: `#4f46e5` (Electric Indigo)
  - `accent-hover`: `#6366f1` (Indigo Bright)
  - `accent-active`: `#4338ca` (Indigo Deep)
  - `accent-subtle`: `rgba(79, 70, 229, 0.16)` (Icon square tint, badge fills)
  - `accent-contrast`: `#ffffff`
  - `focus-ring`: `0 0 0 2px #0b0b0e, 0 0 0 4px #6366f1`
- **Feedback**:
  - `success`: `#10b981` / `success-subtle`: `rgba(16, 185, 129, 0.14)`
  - `warning`: `#f59e0b` / `warning-subtle`: `rgba(245, 158, 11, 0.14)`
  - `danger`: `#ef4444` / `danger-subtle`: `rgba(239, 68, 68, 0.14)`

### Light Theme (`:root[data-theme="light"]`)
- **Backgrounds & Surfaces**:
  - `bg-app`: `#fafafa` (Warm minimal off-white)
  - `bg-subtle`: `#f3f3f6` (Canvas backgrounds, control tracks)
  - `bg-surface`: `#ffffff` (Cards, sidebar rail, top header)
  - `bg-surface-elevated`: `#ffffff` (Elevated modals, command palette)
  - `bg-overlay`: `rgba(250, 250, 250, 0.82)`
- **Borders & Dividers**:
  - `border-subtle`: `#eaeaf0`
  - `border-default`: `#dfdfe6`
  - `border-strong`: `#c5c5d2`
- **Text & Foreground**:
  - `text-primary`: `#111116` (contrast 16.5:1)
  - `text-secondary`: `#555562` (contrast 7.1:1)
  - `text-muted`: `#828290` (contrast 4.7:1)
  - `text-inverse`: `#ffffff`
- **Accent & Interaction**:
  - `accent-default`: `#4f46e5`
  - `accent-hover`: `#4338ca`
  - `accent-active`: `#3730a3`
  - `accent-subtle`: `rgba(79, 70, 229, 0.08)`
  - `accent-contrast`: `#ffffff`
  - `focus-ring`: `0 0 0 2px #ffffff, 0 0 0 4px #4f46e5`

---

## 3. Typography Scale & Font System

Self-hosted via `@fontsource/geist-sans` and `@fontsource/geist-mono` (no external network hits to Google Fonts).

- **Font Families**:
  - `var(--font-sans)`: `'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
  - `var(--font-mono)`: `'Geist Mono', SFMono-Regular, Menlo, Monaco, Consolas, monospace`
- **Type Hierarchy**:
  - `text-xs`: 11px / 0.75rem | line-height: 1.3 | uppercase track 0.05em (Badges, stats microcopy)
  - `text-sm`: 13px / 0.8125rem | line-height: 1.4 | standard UI labels, tooltips, secondary text
  - `text-base`: 14px / 0.875rem | line-height: 1.5 | inputs, primary body, button labels
  - `text-md`: 16px / 1.0rem | line-height: 1.4 | card titles, group headers
  - `text-lg`: 18px / 1.125rem | line-height: 1.3 | panel titles, hero subheaders
  - `text-xl`: 22px / 1.375rem | line-height: 1.25 | tool headers
  - `text-2xl`: 28px / 1.75rem | line-height: 1.2 | section titles
  - `text-3xl`: 38px / 2.375rem | line-height: 1.15 | hero primary display
- **Tabular Numbers**:
  - Metric counters, coordinate readouts, file size chips, and compression percentages enforce:
    `font-family: var(--font-mono); font-variant-numeric: tabular-nums; letter-spacing: -0.02em;`

---

## 4. Spacing, Shapes, Shadows & Motion

- **Spacing Scale (4px base)**:
  `2px`, `4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`, `48px`, `64px`
- **Radii**:
  - `radius-sm`: `6px` (badges, small tags)
  - `radius-md`: `8px` (buttons, inputs, select triggers, slider tracks)
  - `radius-lg`: `12px` (cards, control panels, dialog windows, dropzones)
  - `radius-xl`: `16px` (preview containers, canvas viewport)
  - `radius-full`: `9999px` (pills, switches, circular avatar buttons)
- **Shadows**:
  - Dark mode: Almost shadowless, relying on 1px borders (`border-default`) and background surface contrasts. Subtle ambient: `0 4px 20px rgba(0, 0, 0, 0.45)` for elevated popovers.
  - Light mode: Soft diffuse: `0 1px 3px rgba(0, 0, 0, 0.05), 0 8px 24px rgba(0, 0, 0, 0.06)` for cards; `0 16px 40px rgba(0, 0, 0, 0.10)` for elevated modals.
- **Transitions & Motion**:
  - All transitions standardized at `150ms ease-out` (`cubic-bezier(0.16, 1, 0.3, 1)`).
  - Explicit `@media (prefers-reduced-motion: reduce)` disables non-essential animations.

---

## 5. Component Library & State Matrix

| Component | Variants | States Handled |
| :--- | :--- | :--- |
| **`Button`** | `primary`, `secondary`, `ghost`, `danger`, `outline` | Default, Hover, Active, Focus-Visible, Disabled, Loading (spinner) |
| **`IconButton`** | `sm`, `md`, `lg` (in square or rounded frame) | Default, Hover, Focus-Visible, Active / Pressed (`aria-pressed`) |
| **`Dropzone`** | `full-canvas`, `compact`, `inline` | Idle, Dragging (`is-drag-over`), Checking, Error, Disabled |
| **`Slider`** | Standard numeric, Range slider | Idle, Hover, Active Drag, Focus-Visible, Tabular readout badge |
| **`SegmentedControl`** | 2 to 5 options | Inactive, Active (animated / clean pill), Disabled item |
| **`Select` / `Input`** | Text, Number, Hex color picker | Normal, Hover, Focus, Error, Disabled, Icon prefix / suffix |
| **`Toggle`** | Checkbox switch | Off, On, Focused, Disabled |
| **`StatTile`** | Standard metric, Delta comparison (Before vs After) | Plain value, Percentage drop pill, Dimension readout |
| **`ProgressBar`** | Linear with percentage + stage caption | Indeterminate, Progressing (0-100%), Error stage, Cancel action |
| **`FileChip`** | Thumbnail icon, Filename, Size, Close button | Queued, Processing, Complete, Failed, Active selection |
| **`CompareView`** | Split slider (before / after overlay), Side-by-side | Pointer dragging, Touch pan, Keyboard step (ArrowLeft / ArrowRight) |
| **`CommandPalette`** | Spotlight overlay (Cmd/Ctrl + K) | Open, Searching, Filtered matches, Selected item, Keyboard navigate |
| **`Toast`** | `success`, `error`, `info` | Slide-in, Auto-dismiss, Manual close, Stacking |
| **`ThemeToggle`** | Sun / Moon icon switch | System match, Manual override, Transition-safe |

---

## 6. Layout Architecture & Wireframes

### A. Home Page Wireframe
```
+----------------------------------------------------------------------------------------------------+
|  [✨ ImageKit Pro]    [🔍 Search tools (Ctrl+K)]             [🌓 Theme]  [🔒 100% Private (No upload)] |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|                                Fast, Private Image Tools                                            |
|                  20 free browser-based utilities. Zero server uploads, ever.                       |
|                                                                                                    |
|            +-------------------------------------------------------------------------+             |
|            | 🔍 Search all 20 image tools...                              [ Ctrl+K ] |             |
|            +-------------------------------------------------------------------------+             |
|                                                                                                    |
|      [ Quick Start ]                                                                               |
|      +---------------------------+ +---------------------------+ +-------------------------------+ |
|      | 📦 Compress Image         | | 🎭 Remove Background      | | 📱 Social Media Resizer       | |
|      | Reduce size, keep quality | | Instant AI isolation      | | Presets for Instagram & X     | |
|      +---------------------------+ +---------------------------+ +-------------------------------+ |
|                                                                                                    |
|   + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -+   |
|   :  📂 Drop any image here to instantly choose a tool (Compress, Resize, Crop, BG Remover...) :   |
|   + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -+   |
|                                                                                                    |
|   [⭐ Favorites (2)]                 [🕐 Recently Used (3)]                                         |
|                                                                                                    |
|   CATEGORIES: [All (20)]  [Core (3)]  [Edit (4)]  [PDF (2)]  [Privacy (3)]  [Design (4)]  ...      |
|                                                                                                    |
|   +-----------------------+ +-----------------------+ +-----------------------+ +----------------+ |
|   | [Icon] Tool Name      | | [Icon] Tool Name      | | [Icon] Tool Name      | | ...            | |
|   | Description line      | | Description line      | | Description line      | |                | |
|   | [★]                   | | [★]                   | | [★]             [NEW] | |                | |
|   +-----------------------+ +-----------------------+ +-----------------------+ +----------------+ |
|                                                                                                    |
|   Footer: © 2026 ImageKit Pro · Client-side privacy guaranteed · MIT License · Alok Kushwaha       |
+----------------------------------------------------------------------------------------------------+
```

### B. Single-File Tool Wireframe (Desktop Workspace Layout >= 1024px)
```
+----------------------------------------------------------------------------------------------------+
|  [← All Tools]  [📦] Image Compressor  [▼ Switch tool]                           [↺ Reset]  [🌓 Theme] |
+------------------------------------+---------------------------------------------------------------+
| LEFT CONTROL RAIL (340px)          | MAIN WORKSPACE CANVAS                                         |
|                                    |                                                               |
| [ File: hero-banner.png  2.4 MB ]  | +-----------------------------------------------------------+ |
| [ Dimensions: 2400 × 1600 px    ]  | |                                                           | |
| ---------------------------------- | |                   TRANSPARENT CHECKERBOARD                | |
| Format                             | |                                                           | |
| [ Auto (Original) | WEBP | JPEG ]  | |                    [ Image Preview Area ]                 | |
|                                    | |                                                           | |
| Quality: 85%                       | |           [🔍 -]  [ Fit ]  [ 100% ]  [🔍 +]             | |
| [========●-----------------]       | |                                                           | |
|                                    | +-----------------------------------------------------------+ |
| Advanced Options                   |                                                               |
| [x] Max width limit: [ 1920 ] px   | BOTTOM WORKSPACE ACTION BAR                                   |
| [ ] Strip EXIF metadata            | +-----------------------------------------------------------+ |
|                                    | | Stats: 2.4 MB -> 480 KB (-80%) | 1920x1280                   | |
|                                    | | [🚀 Compress Image]         [💾 Download WebP (480 KB)]    | |
|                                    | +-----------------------------------------------------------+ |
|                                    |                                                               |
|                                    | Chaining: [Open in Resizer →]  [Open in Watermark →]          |
+------------------------------------+---------------------------------------------------------------+
```

### C. Multi-File Tool Wireframe (e.g. Image to PDF, Duplicate Finder)
```
+----------------------------------------------------------------------------------------------------+
|  [← All Tools]  [📄] Image to PDF  [▼ Switch tool]                               [↺ Reset]  [🌓 Theme] |
+------------------------------------+---------------------------------------------------------------+
| LEFT CONTROL RAIL (340px)          | MAIN WORKSPACE CANVAS                                         |
|                                    |                                                               |
| Page Setup                         | [ Drag to reorder 4 images ]                  [+ Add Images]  |
| Orientation: [Portrait|Landscape]  | +-----------+  +-----------+  +-----------+  +-----------+    |
| Margin:      [None | Normal ]      | | 1         |  | 2         |  | 3         |  | 4         |    |
| Fit Mode:    [Contain|Cover ]      | | [Thumb 1] |  | [Thumb 2] |  | [Thumb 3] |  | [Thumb 4] |    |
|                                    | | page-1.png|  | page-2.png|  | chart.jpg |  | end.png   |    |
| Document Name                      | | 800 KB    |  | 1.1 MB    |  | 420 KB    |  | 980 KB    |    |
| [ document.pdf                 ]   | | [x]       |  | [x]       |  | [x]       |  | [x]       |    |
|                                    | +-----------+  +-----------+  +-----------+  +-----------+    |
|                                    |                                                               |
|                                    | BOTTOM WORKSPACE ACTION BAR                                   |
|                                    | +-----------------------------------------------------------+ |
|                                    | | 4 pages ready | Est. 3.2 MB total PDF                       | |
|                                    | |                              [📄 Generate & Download PDF]  | |
|                                    | +-----------------------------------------------------------+ |
+------------------------------------+---------------------------------------------------------------+
```

---

## 7. Migration & Modular CSS Architecture

The legacy monolithic `src/index.css` is refactored into clean, scoped modules:
1. `src/styles/tokens.css`: All theme color variables, surface levels, typography tokens, radius and spacing.
2. `src/styles/base.css`: CSS reset, font-face declarations, dark/light html tags, focus-visible baseline.
3. `src/styles/layout.css`: AppShell grid, top header, home hero, tools grid, footer, responsive breakpoints.
4. `src/styles/components.css`: Buttons, sliders, segmented controls, inputs, dropdowns, StatTiles, command palette, toast.
5. `src/styles/workspace.css`: Left control rail, center checkerboard canvas, bottom action bar, zoom/pan controls.
6. `src/styles/tools.css`: Specialized tool widgets (cropper handles, comparison slider handle, color palette chips, favicon grid, etc.).

All tool processing logic, Web Worker APIs, file intake validations, and hash-redirects are strictly preserved.
