/**
 * liquid-glass.js — Physics-based liquid glass refraction for any element.
 *
 * Usage:
 *   import { liquidGlass } from './liquid-glass';
 *   const glass = liquidGlass(document.querySelector('.my-card'), {
 *     radius: 32, edgeWidth: 25, thickness: 60, ior: 1.52,
 *   });
 *   glass.refresh();  // recompute after manual resize
 *   glass.destroy();  // clean up all resources
 *
 * Zero framework dependencies. Works with any DOM element.
 * SVG filter, displacement maps, resize handling, and browser fallback
 * are all managed internally.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LiquidGlassOptions {
  /** Corner radius (px). Default: reads element's border-radius */
  radius?: number;
  /** Backdrop blur applied behind the glass interior (px). Default: 4 */
  blur?: number;
  /**
   * Simulated glass medium thickness (px).
   * Controls refraction strength via Snell's Law — thicker glass = stronger
   * bending of light at the curved edge. Default: 60
   */
  thickness?: number;
  /**
   * Width of the curved bezel/edge zone (px).
   * Only pixels within this edge band receive refraction displacement.
   * The interior stays flat (neutral). Default: 25
   */
  edgeWidth?: number;
  /**
   * Index of Refraction (IOR). Physical glass ≈ 1.52, diamond ≈ 2.42.
   * Higher values produce stronger edge distortion. Default: 1.52
   */
  ior?: number;
  /**
   * Multiplier for the displacement map intensity.
   * 1.0 = physically accurate, <1 = subtle, >1 = exaggerated. Default: 1
   */
  displacementScale?: number;
  /** Specular highlight opacity (0 = invisible, 1 = fully visible). Default: 0.4 */
  specularOpacity?: number;
  /** Specular highlight sharpness exponent (higher = tighter glint). Default: 2 */
  specularHardness?: number;
  /**
   * Color saturation of the backdrop content seen through the glass.
   * 1.0 = unchanged, >1 = vivid, <1 = desaturated. Default: 1.2
   */
  backdropSaturation?: number;
  /** Frosted-glass blur fallback for unsupported browsers (px). Default: 16 */
  fallbackBlur?: number;
  /** Tint overlay color (CSS color string). Default: none */
  tintColor?: string;
  /** Tint overlay opacity (0-1). Default: 0 */
  tintOpacity?: number;
  /** Brightness adjustment for the source before refraction. Default: none */
  colorScheme?: 'light' | 'dark';
  /** Radial magnification displacement scale. Omit to disable. */
  magnifyingScale?: number;
  /**
   * Angle (radians) of the specular highlight light source.
   * 0 = right, π/2 = bottom, π = left, 3π/2 = top.
   * Default: π/3 (≈60°, upper-right).
   */
  specularAngle?: number;
  /** Device pixel ratio override (capped at 2 internally). Default: window.devicePixelRatio */
  dpr?: number;

  // ── Backward-compatible aliases (deprecated) ──
  /** @deprecated Use `thickness` */
  glassThickness?: number;
  /** @deprecated Use `edgeWidth` */
  bezelWidth?: number;
  /** @deprecated Use `ior` */
  refractiveIndex?: number;
  /** @deprecated Use `displacementScale` */
  scaleRatio?: number;
  /** @deprecated Use `backdropSaturation` */
  refractionSaturation?: number;
}

export interface LiquidGlassInstance {
  /** Whether the browser supports SVG-filtered backdrop-filter */
  supported: boolean;
  /** Recompute the displacement map (call after size change) */
  refresh: () => void;
  /**
   * Update only the specular highlight angle (radians).
   * Lightweight — re-bakes only the specular map, not the displacement map.
   */
  setSpecularAngle: (angle: number) => void;
  /** Remove all effects, observers, and injected elements */
  destroy: () => void;
}

/** Internal resolved options — all fields present, no aliases. */
interface ResolvedOpts {
  radius: number;
  blur: number;
  thickness: number;
  edgeWidth: number;
  ior: number;
  displacementScale: number;
  specularOpacity: number;
  specularHardness: number;
  backdropSaturation: number;
  fallbackBlur: number;
  tintColor: string;
  tintOpacity: number;
  colorScheme?: 'light' | 'dark';
  magnifyingScale?: number;
  specularAngle: number;
  dpr: number;
}

// ─── Browser Support Detection ──────────────────────────────────────────────

const isSupported = (() => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  const isSafari = /Safari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua);
  const isFirefox = /Firefox/.test(ua);
  if (isSafari || isFirefox) return false;
  if (!CSS.supports('backdrop-filter', 'url(#lg-test)')) return false;
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 4;
    c.getContext('2d')!.getImageData(0, 0, 1, 1);
    return true;
  } catch {
    return false;
  }
})();

// ─── Shared SVG defs container ──────────────────────────────────────────────

let svgDefs: SVGDefsElement | null = null;
let filterCounter = 0;

function ensureDefs(): SVGDefsElement {
  if (svgDefs) return svgDefs;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute';
  svg.style.pointerEvents = 'none';
  svgDefs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  svg.appendChild(svgDefs);
  document.body.appendChild(svg);
  return svgDefs;
}

// ─── Utilities ──────────────────────────────────────────────────────────────

function imageDataToDataURL(imageData: ImageData): string {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d')!;
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

function squircleProfile(t: number): number {
  return Math.pow(1 - Math.pow(1 - t, 4), 1 / 4);
}

/** Clamp a value, and guarantee integer (floor) for pixel dimensions. */
function ipx(v: number): number {
  return Math.max(1, Math.floor(v));
}

// ─── Refraction Curve (Snell's Law) ─────────────────────────────────────────

export function computeRefractionCurve(
  thickness: number,
  edgeWidth: number,
  ior: number,
  sampleCount = 128,
): number[] {
  const etaInverse = 1 / ior;

  function refract(normalX: number, normalY: number): [number, number] | null {
    const cosTheta = normalY;
    const discriminant = 1 - etaInverse * etaInverse * (1 - cosTheta * cosTheta);
    if (discriminant < 0) return null;
    const refractedY = Math.sqrt(discriminant);
    return [
      -(etaInverse * cosTheta + refractedY) * normalX,
      etaInverse - (etaInverse * cosTheta + refractedY) * normalY,
    ];
  }

  return Array.from({ length: sampleCount }, (_, i) => {
    const t = i / sampleCount;
    const height = squircleProfile(t);
    const epsilon = t < 1 ? 1e-4 : -1e-4;
    const dHeight = (squircleProfile(t + epsilon) - height) / epsilon;
    const normalLen = Math.sqrt(dHeight * dHeight + 1);
    const normalX = -dHeight / normalLen;
    const normalY = -1 / normalLen;
    const refracted = refract(normalX, normalY);
    if (!refracted) return 0;
    const rayLength = height * edgeWidth + thickness;
    return refracted[0] * (rayLength / refracted[1]);
  });
}

// ─── Displacement Map ───────────────────────────────────────────────────────

export function bakeDisplacementMap(
  width: number,
  height: number,
  cornerRadius: number,
  edgeWidth: number,
  maxOffset: number,
  refractionCurve: number[],
  pixelRatio: number,
): ImageData {
  const pw = ipx(width * pixelRatio);
  const ph = ipx(height * pixelRatio);
  const imageData = new ImageData(pw, ph);
  new Uint32Array(imageData.data.buffer).fill(0xFF008080); // R=128 G=128 neutral

  const r = cornerRadius * pixelRatio;
  const ew = Math.min(edgeWidth * pixelRatio, r);
  if (r < 1) return imageData; // no corners to refract

  const outerR2 = (r + 1) ** 2;
  const innerR2 = Math.max(0, r - ew) ** 2;
  const r2 = r ** 2;
  const cw = pw - r * 2;
  const ch = ph - r * 2;

  for (let row = 0; row < ph; row++) {
    for (let col = 0; col < pw; col++) {
      const dx = col < r ? col - r : col >= pw - r ? col - r - cw : 0;
      const dy = row < r ? row - r : row >= ph - r ? row - r - ch : 0;
      const dist2 = dx * dx + dy * dy;

      if (dist2 <= outerR2 && dist2 >= innerR2) {
        const dist = Math.sqrt(dist2);
        const depth = r - dist;
        const edge = dist2 < r2
          ? 1
          : 1 - (dist - Math.sqrt(r2)) / (Math.sqrt(outerR2) - Math.sqrt(r2));
        const ci = ((depth / ew) * refractionCurve.length) | 0;
        const off = refractionCurve[ci] ?? 0;
        const nx = dx / dist;
        const ny = dy / dist;
        const idx = (row * pw + col) * 4;
        imageData.data[idx]     = 128 + (-nx * off / maxOffset) * 127 * edge;
        imageData.data[idx + 1] = 128 + (-ny * off / maxOffset) * 127 * edge;
        imageData.data[idx + 2] = 0;
        imageData.data[idx + 3] = 255;
      }
    }
  }
  return imageData;
}

// ─── Specular Highlight ─────────────────────────────────────────────────────

export function bakeSpecularLayer(
  width: number,
  height: number,
  cornerRadius: number,
  edgeWidth: number,
  pixelRatio: number,
  hardness: number,
  lightAngle = Math.PI / 3,
): ImageData {
  const pw = ipx(width * pixelRatio);
  const ph = ipx(height * pixelRatio);
  const imageData = new ImageData(pw, ph);
  const r = cornerRadius * pixelRatio;
  const ew = Math.min(edgeWidth * pixelRatio, r);
  const lx = Math.cos(lightAngle);
  const ly = Math.sin(lightAngle);
  new Uint32Array(imageData.data.buffer).fill(0);

  if (r < 1) return imageData;

  const r2 = r ** 2;
  const outerR2 = (r + pixelRatio) ** 2;
  const innerR2 = Math.max(0, r - ew) ** 2;
  const cw = pw - r * 2;
  const ch = ph - r * 2;

  for (let row = 0; row < ph; row++) {
    for (let col = 0; col < pw; col++) {
      const dx = col < r ? col - r : col >= pw - r ? col - r - cw : 0;
      const dy = row < r ? row - r : row >= ph - r ? row - r - ch : 0;
      const dist2 = dx * dx + dy * dy;

      if (dist2 <= outerR2 && dist2 >= innerR2) {
        const dist = Math.sqrt(dist2);
        const depth = r - dist;
        const edge = dist2 < r2
          ? 1
          : 1 - (dist - Math.sqrt(r2)) / (Math.sqrt(outerR2) - Math.sqrt(innerR2));
        const nx = dx / dist;
        const ny = -dy / dist;
        const lambert = Math.abs(nx * lx + ny * ly);
        const edgeGlow = Math.sqrt(Math.max(0, 1 - (1 - depth / Math.max(pixelRatio, 0.01)) ** 2));
        const intensity = lambert * Math.pow(edgeGlow, hardness);
        const brightness = 255 * intensity;
        const idx = (row * pw + col) * 4;
        imageData.data[idx]     = brightness;
        imageData.data[idx + 1] = brightness;
        imageData.data[idx + 2] = brightness;
        imageData.data[idx + 3] = brightness * intensity * edge;
      }
    }
  }
  return imageData;
}

// ─── Magnification Map ──────────────────────────────────────────────────────

export function bakeMagnificationMap(width: number, height: number, pixelRatio: number): ImageData {
  const pw = ipx(width * pixelRatio);
  const ph = ipx(height * pixelRatio);
  const imageData = new ImageData(pw, ph);
  const maxR = Math.max(pw / 2, ph / 2);

  for (let row = 0; row < ph; row++) {
    for (let col = 0; col < pw; col++) {
      const idx = (row * pw + col) * 4;
      imageData.data[idx]     = 128 - ((col - pw / 2) / maxR) * 127;
      imageData.data[idx + 1] = 128 - ((row - ph / 2) / maxR) * 127;
      imageData.data[idx + 2] = 0;
      imageData.data[idx + 3] = 255;
    }
  }
  return imageData;
}

// ─── SVG Filter Builder ─────────────────────────────────────────────────────

function buildFilter(
  id: string,
  w: number,
  h: number,
  opts: ResolvedOpts,
): { filter: SVGFilterElement; refresh: (w: number, h: number) => void; updateSpecular: (angle: number) => void; destroy: () => void } {
  const NS = 'http://www.w3.org/2000/svg';

  // Compute refraction curve once (depends on physical params, not element size)
  const refractionCurve = computeRefractionCurve(opts.thickness, opts.edgeWidth, opts.ior);
  const maxOffset = Math.max(...refractionCurve.map(v => Math.abs(v)), 1);

  const filter = document.createElementNS(NS, 'filter');
  filter.setAttribute('id', id);
  filter.setAttribute('color-interpolation-filters', 'sRGB');
  filter.setAttribute('primitiveUnits', 'userSpaceOnUse');

  // FeImage data URL references (updated on refresh)
  let magnifyHref = '';
  let dispHref = '';
  let specHref = '';
  let currentSpecAngle = opts.specularAngle;
  let specFeImage: SVGElement | null = null;
  let currentW = w;
  let currentH = h;

  function updateFilterRegion(fw: number, fh: number) {
    // Use percentage-based region matching the element's bounding box.
    // The feImage width/height in userSpaceOnUse will be set to match.
    filter.setAttribute('x', '-20%');
    filter.setAttribute('y', '-20%');
    filter.setAttribute('width', '140%');
    filter.setAttribute('height', '140%');
  }

  function buildDOM(fw: number, fh: number) {
    while (filter.firstChild) filter.removeChild(filter.firstChild);

    let currentInput: string = 'SourceGraphic';

    // Optional magnification pre-pass
    if (opts.magnifyingScale != null && magnifyHref) {
      const feImg = document.createElementNS(NS, 'feImage');
      feImg.setAttribute('href', magnifyHref);
      feImg.setAttribute('result', 'magnify_map');
      feImg.setAttribute('x', '0'); feImg.setAttribute('y', '0');
      feImg.setAttribute('width', `${fw}`); feImg.setAttribute('height', `${fh}`);
      feImg.setAttribute('preserveAspectRatio', 'none');
      filter.appendChild(feImg);

      const feD = document.createElementNS(NS, 'feDisplacementMap');
      feD.setAttribute('in', 'SourceGraphic');
      feD.setAttribute('in2', 'magnify_map');
      feD.setAttribute('scale', `${opts.magnifyingScale}`);
      feD.setAttribute('xChannelSelector', 'R');
      feD.setAttribute('yChannelSelector', 'G');
      feD.setAttribute('result', 'magnified_src');
      feD.setAttribute('color-interpolation-filters', 'sRGB');
      filter.appendChild(feD);
      currentInput = 'magnified_src';
    }

    // Color scheme (brightness pre-adjust)
    if (opts.colorScheme) {
      const matrix = opts.colorScheme === 'dark'
        ? '0.8 0 0 0 0  0 0.8 0 0 0  0 0 0.8 0 0  0 0 0 1 0'
        : '1.2 0 0 0 0  0 1.2 0 0 0  0 0 1.2 0 0  0 0 0 1 0';
      const feCm = document.createElementNS(NS, 'feColorMatrix');
      feCm.setAttribute('in', currentInput);
      feCm.setAttribute('type', 'matrix');
      feCm.setAttribute('values', matrix);
      feCm.setAttribute('result', 'brightened');
      filter.appendChild(feCm);
      currentInput = 'brightened';
    }

    // Background blur (softens what's behind the glass)
    const feBlur = document.createElementNS(NS, 'feGaussianBlur');
    feBlur.setAttribute('in', currentInput);
    feBlur.setAttribute('stdDeviation', `${opts.blur}`);
    feBlur.setAttribute('result', 'blurred');
    filter.appendChild(feBlur);

    // Displacement map (the core refraction effect)
    const feImgDisp = document.createElementNS(NS, 'feImage');
    feImgDisp.setAttribute('href', dispHref);
    feImgDisp.setAttribute('result', 'disp_map');
    feImgDisp.setAttribute('x', '0'); feImgDisp.setAttribute('y', '0');
    feImgDisp.setAttribute('width', `${fw}`); feImgDisp.setAttribute('height', `${fh}`);
    feImgDisp.setAttribute('preserveAspectRatio', 'none');
    filter.appendChild(feImgDisp);

    const feDisp = document.createElementNS(NS, 'feDisplacementMap');
    feDisp.setAttribute('in', 'blurred');
    feDisp.setAttribute('in2', 'disp_map');
    feDisp.setAttribute('scale', `${maxOffset * opts.displacementScale}`);
    feDisp.setAttribute('xChannelSelector', 'R');
    feDisp.setAttribute('yChannelSelector', 'G');
    feDisp.setAttribute('result', 'refracted');
    feDisp.setAttribute('color-interpolation-filters', 'sRGB');
    filter.appendChild(feDisp);

    // Backdrop saturation boost
    const feSat = document.createElementNS(NS, 'feColorMatrix');
    feSat.setAttribute('in', 'refracted');
    feSat.setAttribute('type', 'saturate');
    feSat.setAttribute('values', `${opts.backdropSaturation}`);
    feSat.setAttribute('result', 'saturated');
    filter.appendChild(feSat);

    // Specular highlight layer (edge glint) — matching original compiled pipeline
    const feImgSpec = document.createElementNS(NS, 'feImage');
    feImgSpec.setAttribute('href', specHref);
    feImgSpec.setAttribute('result', 'spec_map');
    feImgSpec.setAttribute('x', '0'); feImgSpec.setAttribute('y', '0');
    feImgSpec.setAttribute('width', `${fw}`); feImgSpec.setAttribute('height', `${fh}`);
    feImgSpec.setAttribute('preserveAspectRatio', 'none');
    filter.appendChild(feImgSpec);
    specFeImage = feImgSpec;

    // Saturate specular colors using refracted backdrop
    const feSpecSat = document.createElementNS(NS, 'feComposite');
    feSpecSat.setAttribute('in', 'saturated');
    feSpecSat.setAttribute('in2', 'spec_map');
    feSpecSat.setAttribute('operator', 'in');
    feSpecSat.setAttribute('result', 'spec_saturated');
    filter.appendChild(feSpecSat);

    // Fade specular intensity
    const feAlpha = document.createElementNS(NS, 'feComponentTransfer');
    feAlpha.setAttribute('in', 'spec_map');
    feAlpha.setAttribute('result', 'spec_faded');
    const feFuncA = document.createElementNS(NS, 'feFuncA');
    feFuncA.setAttribute('type', 'linear');
    feFuncA.setAttribute('slope', `${opts.specularOpacity}`);
    feAlpha.appendChild(feFuncA);
    filter.appendChild(feAlpha);

    // Two-pass blend: saturated specular + faded specular over refracted
    const feBlend1 = document.createElementNS(NS, 'feBlend');
    feBlend1.setAttribute('in', 'spec_saturated');
    feBlend1.setAttribute('in2', 'refracted');
    feBlend1.setAttribute('mode', 'normal');
    feBlend1.setAttribute('result', 'with_saturation');
    filter.appendChild(feBlend1);

    const feBlend2 = document.createElementNS(NS, 'feBlend');
    feBlend2.setAttribute('in', 'spec_faded');
    feBlend2.setAttribute('in2', 'with_saturation');
    feBlend2.setAttribute('mode', 'normal');
    filter.appendChild(feBlend2);
  }

  function refresh(newW: number, newH: number) {
    if (newW < 1 || newH < 1) return;
    currentW = newW;
    currentH = newH;

    updateFilterRegion(newW, newH);

    // Bake displacement map
    const dispMap = bakeDisplacementMap(
      newW, newH, opts.radius, opts.edgeWidth, maxOffset, refractionCurve, opts.dpr,
    );
    dispHref = imageDataToDataURL(dispMap);

    // Bake specular highlight
    const invertedHardness = 4 / Math.max(0.1, opts.specularHardness);
    const specMap = bakeSpecularLayer(
      newW, newH, opts.radius, opts.edgeWidth, opts.dpr, invertedHardness, currentSpecAngle,
    );
    specHref = imageDataToDataURL(specMap);

    // Optional magnification map
    if (opts.magnifyingScale != null) {
      const magMap = bakeMagnificationMap(newW, newH, opts.dpr);
      magnifyHref = imageDataToDataURL(magMap);
    }

    buildDOM(newW, newH);
  }

  /** Lightweight update: re-bake only the specular layer with a new light angle. */
  function updateSpecular(angle: number) {
    currentSpecAngle = angle;
    const invertedHardness = 4 / Math.max(0.1, opts.specularHardness);
    const specMap = bakeSpecularLayer(
      currentW, currentH, opts.radius, opts.edgeWidth, opts.dpr, invertedHardness, angle,
    );
    specHref = imageDataToDataURL(specMap);
    if (specFeImage) {
      specFeImage.setAttribute('href', specHref);
    }
  }

  function destroy() {
    filter.remove();
  }

  refresh(w, h);
  return { filter, refresh, updateSpecular, destroy };
}

// ─── Resolve Options (alias support) ────────────────────────────────────────

function resolveOptions(raw: LiquidGlassOptions): ResolvedOpts {
  // DPR capped at 2 — higher values balloon map sizes (4× pixels at DPR 3)
  // with negligible visual gain. Mobile devices with DPR > 2 get crisp
  // rendering at 2× while avoiding multi-MB data URLs and per-pixel loops
  // that cause frame drops and rendering artifacts.
  const dpr = Math.min(2, raw.dpr ?? (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1));

  return {
    radius:                raw.radius ?? 20,
    blur:                  raw.blur ?? 4,
    thickness:             raw.thickness ?? raw.glassThickness ?? 60,
    edgeWidth:             raw.edgeWidth ?? raw.bezelWidth ?? 25,
    ior:                   raw.ior ?? raw.refractiveIndex ?? 1.52,
    displacementScale:     raw.displacementScale ?? raw.scaleRatio ?? 1,
    specularOpacity:       raw.specularOpacity ?? 0.4,
    specularHardness:      raw.specularHardness ?? 2,
    backdropSaturation:    raw.backdropSaturation ?? raw.refractionSaturation ?? 1.2,
    fallbackBlur:          raw.fallbackBlur ?? 16,
    tintColor:             raw.tintColor ?? '',
    tintOpacity:           raw.tintOpacity ?? 0,
    colorScheme:           raw.colorScheme,
    magnifyingScale:       raw.magnifyingScale,
    specularAngle:         raw.specularAngle ?? Math.PI / 3,
    dpr,
  };
}

// ─── Main API ───────────────────────────────────────────────────────────────

/**
 * Apply physics-based liquid glass refraction to any DOM element.
 *
 * @param el - Target DOM element
 * @param opts - Glass parameters (all optional with sensible defaults)
 * @returns Instance handle with `supported`, `refresh()`, and `destroy()`
 */
export function liquidGlass(el: HTMLElement, opts: LiquidGlassOptions = {}): LiquidGlassInstance {
  const o = resolveOptions(opts);

  // Resolve radius from element if not explicitly provided
  if (opts.radius == null) {
    const raw = getComputedStyle(el).borderTopLeftRadius || '0px';
    const v = parseFloat(raw) || 0;
    o.radius = raw.trim().endsWith('%') ? (v / 100) * Math.min(el.offsetWidth, el.offsetHeight) : v;
  }

  // Fallback for unsupported browsers (Safari, Firefox)
  if (!isSupported) {
    const frosted = `blur(${o.fallbackBlur}px) saturate(${o.backdropSaturation})`;
    el.style.backdropFilter = frosted;
    (el.style as any).webkitBackdropFilter = frosted;
    return {
      supported: false,
      refresh: () => {},
      setSpecularAngle: () => {},
      destroy: () => {
        el.style.backdropFilter = '';
        (el.style as any).webkitBackdropFilter = '';
      },
    };
  }

  const id = `lg-${++filterCounter}`;
  let currentW = el.offsetWidth;
  let currentH = el.offsetHeight;

  if (currentW < 1 || currentH < 1) {
    return { supported: true, refresh: () => {}, setSpecularAngle: () => {}, destroy: () => {} };
  }

  const built = buildFilter(id, currentW, currentH, o);
  ensureDefs().appendChild(built.filter);

  el.style.backdropFilter = `url(#${id})`;
  (el.style as any).webkitBackdropFilter = `url(#${id})`;

  // ResizeObserver with debounce
  let timer: ReturnType<typeof setTimeout> | null = null;
  const ro = new ResizeObserver(() => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (w > 0 && h > 0 && (w !== currentW || h !== currentH)) {
        currentW = w;
        currentH = h;
        built.refresh(w, h);
      }
    }, 120);
  });
  ro.observe(el);

  return {
    supported: true,
    refresh: () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (w > 0 && h > 0) {
        currentW = w;
        currentH = h;
        built.refresh(w, h);
      }
    },
    setSpecularAngle: (angle: number) => {
      built.updateSpecular(angle);
    },
    destroy: () => {
      ro.disconnect();
      if (timer) clearTimeout(timer);
      built.destroy();
      el.style.backdropFilter = '';
      (el.style as any).webkitBackdropFilter = '';
    },
  };
}
