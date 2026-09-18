# Liquid Glass Refactoring Plan

## Architecture Overview

### Current State
- **Rendering**: SVG `backdrop-filter` + `feDisplacementMap` (LiuNian/刘念 algorithm)
- **Tech**: React + Vite + Tailwind + Motion
- **Pages**: Home (Landing), Workspace, Docs
- **Components**: `GlassComponent` (SVG-based), `ControlSlider`

### Target State
- **Rendering**: Unified WebGL2 component (Kyant algorithm default) + SVG variants
- **Algorithms**: liunian (SVG), deepika (SVG), liquidglassstudio (WebGL), kyant (WebGL), ybouane (WebGL)
- **Pages**: Home (modern Landing, kyant WebGL), Studio (renamed from Workspace, all algorithms), Docs
- **UI**: iOS 26 Liquid Glass panels, Apple-style sliders, light/dark mode (system)

---

## Phase 1: WebGL Foundation & Kyant Algorithm

### 1.1 WebGL2 Rendering Core

Create `src/lib/webgl/` with the shared rendering infrastructure:

```
src/lib/webgl/
├── core.ts              # WebGL2 context setup, shader compilation, FBO management
├── pipeline.ts          # Multi-pass render orchestrator (background → blur → glass → composite)
├── shaders/
│   ├── vertex.glsl      # Fullscreen quad vertex shader
│   ├── blur.glsl        # Separable Gaussian blur fragment (2-pass H+V)
│   ├── kawase.glsl      # Kawase blur fragment (N-iteration ping-pong)
│   ├── scene-bg.glsl    # Background pass + shadow
│   ├── scene-fg.glsl    # Foreground text/icon composite
│   ├── sdf.glsl         # SDF primitives: sdRoundedRect, smin, superellipseCorner
│   └── utils.glsl       # Color space conversions (sRGB↔LCH), math helpers
├── fbo.ts               # FBO pool: create/resize/recycle RGBA16F framebuffers
└── capture.ts           # DOM-to-canvas capture (html-to-image or native html2canvas)
```

**Core pipeline** (4 passes, matching Martin-Kyant architecture):
1. **Scene pass**: Render background image/video → `fboA`
2. **Blur pass**: Separable Gaussian (2-pass) or Kawase → `blurFbo`
3. **Element pass**: SDF clip + refraction + effects → `elFbo` (per-element bbox size)
4. **Composite**: `elFbo` → scene FBO (premultiplied alpha SrcOver blend)

**Key technical decisions**:
- Use **WebGL2** (not WebGL1) for RGBA16F support, matching liquidglassstudio
- Use **separable Gaussian blur** as default (matches liquidglassstudio), Kawase as optional fast path
- Use **SDF-based shapes** (superellipse corners) for glass geometry
- Scene capture: Use `html-to-image` library (like ybouane) for DOM→canvas rasterization
- Per-element `<canvas>` overlay approach (like ybouane), NOT `backdrop-filter`

### 1.2 Kyant Algorithm Implementation

Create `src/lib/webgl/algorithms/kyant.ts`:

The Kyant fragment shader implements `circleMap()` refraction from the Martin port:
- **Refraction**: `circleMap(uv, SDF gradient, refractionHeight)` — displaces UV along SDF gradient direction
- **Chromatic dispersion**: 7-channel (ROYGBV + purple), per-channel weighted accumulation
- **Blur mix**: Edge-weighted blend of sharp and blurred backdrop samples
- **Vibrancy**: Brightness/contrast/saturation color controls
- **Tint**: BlendMode.Hue (HSV hue replacement)
- **Highlight**: 3-pass rim highlight (Canvas2D stroke mask → blur → composite with dot(grad,normal) falloff)
- **Shadow**: SDF Gaussian falloff: `0.5 * exp(-sd^2 / (2*sigma^2))`

Reference files:
- `reference/martin-kyant-webgl/src/components/liquid-glass/shaders/element.ts` (main shader)
- `reference/martin-kyant-webgl/src/components/liquid-glass/shaders/element-utils.ts` (circleMap, utilities)
- `reference/martin-kyant-webgl/src/components/liquid-glass/renderer/methods-render-glass-pef.ts` (5-step pipeline)

### 1.3 Unified WebGL GlassComponent

Create `src/components/WebGLGlass.tsx`:

```tsx
// Drop-in replacement for SVG GlassComponent
interface WebGLGlassProps {
  id: string;
  width?: number | string;
  height?: number | string;
  params: GlassParams;
  sceneUrl?: string;
  children?: ReactNode;
  algorithm?: 'kyant' | 'liquidglassstudio' | 'ybouane';  // default: 'kyant'
}
```

**Architecture**:
- Mounts a `<canvas>` as position:absolute behind children (same as current SVG glass layer)
- Uses `ResizeObserver` for size changes (debounced)
- Creates/destroys WebGL context per mount/unmount
- Supports dynamic specular angle tracking (mouse move)
- Falls back to `backdrop-filter: blur()` in Safari/Firefox

**Performance optimizations from Martin port**:
- Per-element FBO (bbox-sized, not fullscreen)
- Dirty-rect tracking: only re-render when glass position/content changes
- FBO pooling and reuse
- Dynamic downsample for blur (based on blur radius)

---

## Phase 2: SVG Algorithm Variants

### 2.1 LiuNian Algorithm (Current)

Rename/organize existing code into `src/lib/svg/algorithms/liunian.ts`:
- Move `glass-logic.ts` functions: `computeRefractionCurve`, `bakeDisplacementMap`, `bakeSpecularLayer`, `bakeMagnificationMap`
- Move `liquid-glass.ts` SVG filter builder logic
- Keep the full Snell's Law + squircle profile + specular pipeline

### 2.2 Deepika Algorithm

Create `src/lib/svg/algorithms/deepika.ts`:

Port from `reference/deepika-svg/liquid-glass.js`:
- **Displacement map**: Canvas gradient ramps (R=horizontal, B=vertical) + blurred gray inset mask
- **Chromatic aberration**: 3-pass staggered displacement with per-channel isolation (R→scale, G→scale+chroma, B→scale+2*chroma)
- **Blend**: Screen mode for channel recombination
- **Parameters**: `scale`, `chroma`, `border`, `mapBlur`, `blur`, `saturate`

### 2.3 SVG GlassComponent

Create `src/components/SVGGlass.tsx`:
- Wraps existing SVG-based rendering
- Accepts `algorithm: 'liunian' | 'deepika'` prop
- Used in Studio for SVG algorithm comparison

---

## Phase 3: Home Page Redesign

### 3.1 Layout & Design

**Design direction**: Modern landing page, NOT centered/cramped. Spread across viewport.

```
┌─────────────────────────────────────────────────────────┐
│ Nav: Logo · Docs · GitHub · [Light/Dark toggle]         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Hero Section (full-width, asymmetric)                   │
│  ┌──────────────────┐  ┌───────────────────────────┐   │
│  │                    │  │                             │   │
│  │  Liquid Glass      │  │  [WebGL Glass Card]         │   │
│  │  Refraction Engine │  │  with live kyant effect      │   │
│  │                    │  │  on grid/landscape bg         │   │
│  │  [CTA buttons]     │  │                             │   │
│  └──────────────────┘  └───────────────────────────┘   │
│                                                          │
│  Features Grid (spread, 3-column)                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                   │
│  │ Refract │ │   GPU   │ │  Multi  │                   │
│  │ physics │ │ pipeline│ │ layer   │                   │
│  └─────────┘ └─────────┘ └─────────┘                   │
│                                                          │
│  Glass Demo Showcase (multiple cards with kyant WebGL)   │
│  ┌────┐ ┌────────────┐ ┌────┐                          │
│  │Card│ │   Wide     │ │Card│                          │
│  │ 1  │ │   Card     │ │ 3  │                          │
│  └────┘ └────────────┘ └────┘                          │
│                                                          │
│  CTA Section                                             │
└─────────────────────────────────────────────────────────┘
```

**Key changes**:
- Replace all `GlassComponent` with `WebGLGlass` (kyant algorithm)
- Background: Clean gradient + grid pattern (NOT just dark)
- Glass cards: Below each card → grid container or landscape image
- Shadows, highlights, modern depth effects
- Animations: `motion` (Framer Motion) for scroll-reveal, hover states
- Light/Dark mode: Follow system preference via `prefers-color-scheme`
- Responsive: Cards reflow on mobile

### 3.2 Dark/Light Mode Implementation

- Use CSS custom properties + Tailwind `dark:` variants
- Detect via `window.matchMedia('(prefers-color-scheme: dark)')`
- Glass params adjust: dark mode → darker tint, light mode → lighter tint
- Background: dark mode = subtle grid on #08080a, light mode = subtle grid on #fafafa

### 3.3 Glass Card with Background

Each glass showcase card includes:
- A landscape/grid image positioned behind the glass effect
- The WebGL glass renders on top, refracting the image
- Hover: subtle scale + specular angle animation

---

## Phase 4: Studio Page Redesign

### 4.1 Rename Workspace → Studio

- Rename `src/pages/Workspace.tsx` → `src/pages/Studio.tsx`
- Update route in `App.tsx`
- Update all navigation links

### 4.2 Algorithm Switcher UI

**Two-level switching**:
1. **Rough type**: SVG | WebGL (tab/toggle)
2. **Specific algorithm**: 
   - SVG → liunian | deepika
   - WebGL → liquidglassstudio | kyant | ybouane

**UI placement**: Top of Studio, as a segmented control

```tsx
<div className="flex items-center gap-2">
  <SegmentedControl 
    sections={[
      { label: 'SVG', children: ['liunian', 'deepika'] },
      { label: 'WebGL', children: ['liquidglassstudio', 'kyant', 'ybouane'] }
    ]}
    value={activeAlgorithm}
    onChange={setActiveAlgorithm}
  />
</div>
```

### 4.3 iOS 26 Liquid Glass Panel Design

**Panel style** (matching iOS 26 Liquid Glass Control Center):
- Semi-transparent background with backdrop refraction
- Soft inner shadow (inset) for depth
- Subtle border: 1px white/10
- Rounded corners: 20-24px radius
- Drop shadow: `0 8px 32px rgba(0,0,0,0.12)`
- The panel itself uses the currently-selected glass algorithm for its backdrop effect

**Dark mode**: Panel bg = rgba(30,30,30,0.7)
**Light mode**: Panel bg = rgba(255,255,255,0.6)

### 4.4 Apple-Style Sliders

Replace current `ControlSlider` with iOS 26 style:
- Track: thin (4px), rounded, subtle bg
- Thumb: 22px circle, white with shadow, slight glow
- Fill: system blue gradient
- Value label: floating pill above thumb on drag
- Haptic-feel: subtle spring animation on change

### 4.5 Demo Components

Studio demos (each demo uses the currently-selected algorithm):

1. **Music Player** (existing, enhanced)
   - Glass panel with album art, controls, progress bar
   - Apple Music-inspired layout

2. **Slider** (existing, enhanced)
   - Glass slider with real drag interaction
   - Volume/brightness variants

3. **Switch** (existing, enhanced)
   - Glass toggle switch with animation
   - On/off state changes glass params

4. **Tab Bar** (NEW)
   - iOS-style tab bar with glass background
   - Active tab indicator with glass effect

5. **Control Center** (existing, renamed)
   - iOS 26 Control Center grid layout

### 4.6 Grid Background

- SVG pattern grid: `linear-gradient(rgba(128,128,128,0.1) 1px, transparent 1px)`
- CSS: `background-size: 40px 40px`
- NOT on white background scenes
- Adaptive: scene image + grid overlay

### 4.7 Adjustable Refraction & Highlight

Studio exposes per-algorithm controls:

**Shared controls**:
- Refraction intensity / IOR
- Blur radius
- Saturation / vibrancy
- Tint color + opacity
- Corner radius

**LiuNian-specific**:
- Glass thickness, bezel width, specular hardness, specular angle

**Deepika-specific**:
- Scale, chroma, border fraction, mapBlur

**LiquidGlassStudio-specific**:
- refThickness, refFactor, refDispersion, refFresnelFactor, glareAngle, glareConvergence

**Kyant-specific**:
- refractionHeight, chromaticAberration, vibrancy, rimHighlight intensity/falloff

**Ybouane-specific**:
- bevelMode (biconvex/dome), distort, chroma, fresnel, edgeHL

---

## Phase 5: Documentation Update

### 5.1 Rewrite README.md

Based on actual code:
- Multi-algorithm architecture description
- API reference for WebGL and SVG GlassComponents
- Quick start with WebGL (kyant) default
- Algorithm comparison table
- Studio page description

### 5.2 Rewrite ALGORITHM.md

Detailed per-algorithm documentation:
- **LiuNian**: Snell's Law refraction curve, squircle bezel profile, specular pipeline
- **Deepika**: Gradient ramp displacement, chromatic aberration via staggered passes
- **LiquidGlassStudio**: SDF normal + Snell's edge refraction, Fresnel in LCH, anisotropic glare
- **Kyant**: circleMap() refraction, 7-channel dispersion, Kawase blur
- **Ybouane**: Half-circle bevel, dual-surface refraction, multi-light Blinn-Phong

### 5.3 Update NUXT_INTEGRATION.md

Update to reflect new WebGL GlassComponent API.

---

## Phase 6: Verification Checklist

After each major feature:

- [ ] WebGL GlassComponent renders kyant effect correctly on background image
- [ ] Dark/light mode follows system preference and applies correctly
- [ ] Home page: glass cards show refraction over landscape/grid backgrounds
- [ ] Studio: algorithm switcher toggles between SVG and WebGL variants
- [ ] Studio: all 5 algorithms render without errors
- [ ] Studio: parameter sliders update glass effect in real-time
- [ ] Studio: grid background shows on non-white scenes
- [ ] Studio: panels have iOS 26 Liquid Glass styling
- [ ] Safari/Firefox: graceful fallback to backdrop-filter: blur()
- [ ] All navigation links work correctly
- [ ] Documentation renders correctly on docs page
- [ ] No TypeScript errors (`npm run lint`)

---

## Implementation Order

1. **Phase 1** (WebGL foundation + Kyant) — Core rendering pipeline
2. **Phase 3** (Home page) — Landing page using kyant WebGL GlassComponent
3. **Phase 2** (SVG variants) — LiuNian and Deepika algorithm modules
4. **Phase 4** (Studio) — Full Studio with all algorithms and demos
5. **Phase 5** (Documentation) — Rewrite all docs
6. **Phase 6** (Verification) — End-to-end testing
