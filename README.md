# Liquid Glass Refraction Engine v2.0

<div align="center">
  <p>Multi-algorithm Web liquid glass rendering system</p>
  <p>Five glass refraction algorithms — SVG physics, SVG gradient, and WebGL GPU — switchable in real-time.</p>
</div>

---

## Algorithms

| Algorithm | Type | Technique | Key Feature |
|-----------|------|-----------|-------------|
| **LiuNian (刘念)** | SVG | Snell's Law + squircle bezel profile | Physical refraction, specular highlights |
| **Deepika** | SVG | Gradient ramp displacement + 3-pass chromatic aberration | Prism fringe effect, fast generation |
| **Kyant** | WebGL2 | circleMap() + SDF gradient + Gaussian blur | GPU-native, 7-channel dispersion |

**SVG algorithms** use `backdrop-filter` with SVG `feDisplacementMap` — zero GPU context, DOM-native.  
**WebGL algorithms** render onto a `<canvas>` overlay — full GPU pipeline with real-time SDF refraction.

---

## Quick Start

```bash
npm install
npm run dev          # http://localhost:3000
```

### Pages

| Route | Description |
|-------|-------------|
| `/` | Modern landing page (Kyant WebGL glass cards, dark/light mode) |
| `/studio` | Interactive playground — switch algorithms, adjust parameters, test demos |
| `/docs` | Documentation browser |

---

## Architecture

```
src/
├── lib/
│   ├── liquid-glass.ts          # LiuNian algorithm (SVG, Snell's Law)
│   ├── glass-logic.ts           # Core physics: refraction curve, displacement map, specular layer
│   ├── webgl/
│   │   ├── core.ts              # WebGL2 context, shader compilation, FBO management
│   │   ├── shaders.ts           # GLSL shader sources (blur, SDF, Kyant glass)
│   │   ├── renderer.ts          # Multi-pass render pipeline
│   │   └── algorithms/kyant.ts  # Kyant algorithm parameters
│   └── svg/
│       ├── index.ts             # SVG algorithm exports
│       └── algorithms/
│           ├── liunian.ts       # Re-exports liquid-glass.ts
│           └── deepika.ts       # Gradient ramp + chromatic aberration
├── components/
│   ├── UnifiedGlass.tsx         # Algorithm dispatcher (routes to correct renderer)
│   ├── WebGLGlass.tsx           # WebGL canvas overlay component
│   ├── DeepikaGlassComponent.tsx # Deepika SVG component
│   ├── SharedUI.tsx             # GlassComponent (LiuNian SVG) + ControlSlider
│   ├── AppleSlider.tsx          # iOS-style slider for Studio controls
│   └── ...                      # HomeUI, ControlCenter, NavIcons, etc.
├── pages/
│   ├── Home.tsx                 # Landing page with WebGL glass cards
│   └── Studio.tsx               # Interactive algorithm playground
└── constants.ts                 # Scene URLs and default glass params
```

---

## Usage

### UnifiedGlass (recommended)

The `UnifiedGlass` component automatically dispatches to the correct renderer:

```tsx
import { UnifiedGlass } from './components/UnifiedGlass';

<UnifiedGlass
  id="my-glass"
  width={400}
  height={200}
  sceneUrl="https://example.com/background.jpg"
  algorithm="kyant"   // 'liunian' | 'deepika' | 'kyant'
  params={{
    radius: 24,
    blur: 8,
    ior: 1.52,
    specularOpacity: 0.4,
  }}
>
  <div>Your content here</div>
</UnifiedGlass>
```

### Individual Components

```tsx
// LiuNian (SVG, Snell's Law)
import { GlassComponent } from './components/SharedUI';

// Deepika (SVG, gradient ramps)
import { DeepikaGlassComponent } from './components/DeepikaGlassComponent';

// Kyant (WebGL2, GPU)
import { WebGLGlass } from './components/WebGLGlass';
```

### Standalone (vanilla JS)

```ts
import { liquidGlass } from './lib/liquid-glass';

const glass = liquidGlass(document.querySelector('.my-card'), {
  radius: 32,
  thickness: 60,
  ior: 1.52,
});
glass.refresh();   // recompute after resize
glass.destroy();   // cleanup
```

---

## GlassParams Interface

```ts
interface GlassParams {
  radius?: number;              // Corner radius (px)
  blur?: number;                // Backdrop blur (px)
  thickness?: number;           // Glass thickness (LiuNian)
  edgeWidth?: number;           // Bezel width (LiuNian)
  ior?: number;                 // Index of refraction
  specularOpacity?: number;     // Highlight opacity (0-1)
  specularHardness?: number;    // Highlight sharpness
  specularAngle?: number;       // Light direction (radians)
  dynamicSpecular?: boolean;    // Mouse-tracking highlight
  backdropSaturation?: number;  // Color saturation boost
  displacementScale?: number;   // Displacement multiplier
  tintColor?: string;           // Overlay color
  tintOpacity?: number;         // Overlay opacity (0-1)
  // WebGL-specific
  refractionHeight?: number;    // Refraction displacement strength
  chromaticAberration?: number; // Chromatic dispersion
  vibrancy?: number;            // Brightness + saturation boost
  tintAmount?: number;          // Hue blend amount
}
```

---

## Technical Details

### LiuNian (SVG)
- Snell's Law refraction curve with 128-sample bezel profile
- Squircle super-ellipse cross-section for realistic curved edges
- Lambert specular highlight with configurable light angle
- Per-pixel displacement map baking via Canvas `ImageData`
- DPR-aware rendering (capped at 2x)

### Deepika (SVG)
- Canvas gradient ramps (R=horizontal, B=vertical) for displacement
- Blurred gray inset mask confines refraction to edge band
- 3-pass staggered displacement with per-channel isolation
- Screen blending for chromatic aberration prism effect
- O(1) map generation (just gradient fills, no per-pixel math)

### Kyant (WebGL2)
- SDF-based rounded rectangle with superelliptical corners
- `circleMap()` refraction displacement along SDF gradient
- Separable 2-pass Gaussian blur (GPU-native, up to 200px)
- Per-channel chromatic dispersion
- Fresnel brightening in LCH color space
- Anisotropic specular glare based on surface normal angle
- RGBA16F framebuffer for HDR-quality intermediates

---

## Browser Support

| Feature | Chrome/Edge | Safari | Firefox |
|---------|------------|--------|---------|
| SVG refraction | Full | Fallback (blur only) | Fallback (blur only) |
| WebGL refraction | Full | Full | Full |

SVG algorithms require `backdrop-filter: url(#id)` support (Chromium only).  
WebGL algorithms work in any browser with WebGL2 support.

Browsers without SVG support get a frosted-glass CSS fallback: `backdrop-filter: blur(16px) saturate(1.2)`.

---

## Build

```bash
npm run build        # production build to dist/
npm run lint         # TypeScript check
npm run preview      # preview production build
```

---

## License

MIT License. Free for personal, open-source, and commercial use.