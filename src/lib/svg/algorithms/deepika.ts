/**
 * Deepika SVG algorithm — gradient ramp displacement + chromatic aberration.
 * Reference: https://github.com/deepika-builds/liquid-glass
 *
 * Technique: Canvas gradient ramps (R=horizontal, B=vertical) with a blurred
 * gray inset mask create the displacement map. 3 passes at staggered scales
 * with per-channel isolation produce chromatic aberration at the edge.
 *
 * No physics (no Snell's Law, no surface normals). Purely visual.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

export interface DeepikaOptions {
  /** Displacement strength (negative = magnifying). Default: -112 */
  scale?: number;
  /** Per-channel stagger for chromatic aberration. Default: 6 */
  chroma?: number;
  /** Neutral inset as fraction of smaller side. Default: 0.07 */
  border?: number;
  /** Edge-curvature softness (px). Default: 12 */
  mapBlur?: number;
  /** Backdrop blur (px). Default: 3 */
  blur?: number;
  /** Backdrop saturation. Default: 1.5 */
  saturate?: number;
  /** Corner radius override (px). Default: reads element's border-radius */
  radius?: number;
  /** Frosted blur fallback (px). Default: 16 */
  fallbackBlur?: number;
}

export interface DeepikaInstance {
  supported: boolean;
  refresh: () => void;
  destroy: () => void;
}

/** Generate the gradient ramp displacement map as a data URL. */
function makeDeepikaMap(
  w: number,
  h: number,
  radius: number,
  border: number,
  mapBlur: number,
): string {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Red X-ramp (horizontal gradient)
  const gx = ctx.createLinearGradient(0, 0, w, 0);
  gx.addColorStop(0, 'rgb(0,0,0)');
  gx.addColorStop(1, 'rgb(255,0,0)');
  ctx.fillStyle = gx;
  ctx.fillRect(0, 0, w, h);

  // Blue Y-ramp (vertical gradient, difference blend)
  const gy = ctx.createLinearGradient(0, 0, 0, h);
  gy.addColorStop(0, 'rgb(0,0,0)');
  gy.addColorStop(1, 'rgb(0,0,255)');
  ctx.globalCompositeOperation = 'difference';
  ctx.fillStyle = gy;
  ctx.fillRect(0, 0, w, h);

  // Neutralizing interior: blurred gray inset rounded rect
  ctx.globalCompositeOperation = 'source-over';
  const inset = border * Math.min(w, h);
  ctx.filter = `blur(${mapBlur}px)`;
  ctx.fillStyle = 'rgba(128,128,128,0.93)';
  ctx.beginPath();
  ctx.roundRect(inset, inset, w - inset * 2, h - inset * 2, Math.max(radius - inset, 2));
  ctx.fill();
  ctx.filter = 'none';

  return canvas.toDataURL('image/png');
}

/** Build the SVG filter with 3-pass chromatic aberration. */
function buildDeepikaFilter(
  id: string,
  scales: number[],
): { filter: SVGFilterElement; feImage: SVGElement } {
  const filter = document.createElementNS(SVG_NS, 'filter');
  filter.setAttribute('id', id);
  filter.setAttribute('x', '0');
  filter.setAttribute('y', '0');
  filter.setAttribute('width', '100%');
  filter.setAttribute('height', '100%');
  filter.setAttribute('color-interpolation-filters', 'sRGB');

  const feImage = document.createElementNS(SVG_NS, 'feImage');
  feImage.setAttribute('x', '0');
  feImage.setAttribute('y', '0');
  feImage.setAttribute('result', 'map');
  feImage.setAttribute('preserveAspectRatio', 'none');
  filter.appendChild(feImage);

  // Channel isolation matrices: R, G, B
  const keep = [
    '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0',
    '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0',
    '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0',
  ];

  const channels: string[] = [];
  for (let i = 0; i < 3; i++) {
    const disp = document.createElementNS(SVG_NS, 'feDisplacementMap');
    disp.setAttribute('in', 'SourceGraphic');
    disp.setAttribute('in2', 'map');
    disp.setAttribute('scale', String(scales[i]));
    disp.setAttribute('xChannelSelector', 'R');
    disp.setAttribute('yChannelSelector', 'B');
    disp.setAttribute('result', `d${i}`);
    filter.appendChild(disp);

    const cm = document.createElementNS(SVG_NS, 'feColorMatrix');
    cm.setAttribute('in', `d${i}`);
    cm.setAttribute('type', 'matrix');
    cm.setAttribute('values', keep[i]);
    cm.setAttribute('result', `c${i}`);
    filter.appendChild(cm);
    channels.push(`c${i}`);
  }

  // Screen blend: c0 + c1 → c01, then c01 + c2
  const blend1 = document.createElementNS(SVG_NS, 'feBlend');
  blend1.setAttribute('in', channels[0]);
  blend1.setAttribute('in2', channels[1]);
  blend1.setAttribute('mode', 'screen');
  blend1.setAttribute('result', 'c01');
  filter.appendChild(blend1);

  const blend2 = document.createElementNS(SVG_NS, 'feBlend');
  blend2.setAttribute('in', 'c01');
  blend2.setAttribute('in2', channels[2]);
  blend2.setAttribute('mode', 'screen');
  filter.appendChild(blend2);

  return { filter, feImage };
}

/** Resolve corner radius from element or override. */
function resolveRadius(el: HTMLElement, w: number, h: number, override?: number): number {
  if (override != null) return override;
  const raw = getComputedStyle(el).borderTopLeftRadius || '0px';
  const v = parseFloat(raw) || 0;
  return raw.trim().endsWith('%') ? (v / 100) * Math.min(w, h) : v;
}

// Shared SVG defs container
let svgDefs: SVGDefsElement | null = null;

function ensureDefs(): SVGDefsElement {
  if (svgDefs) return svgDefs;
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute';
  svg.style.pointerEvents = 'none';
  svgDefs = document.createElementNS(SVG_NS, 'defs');
  svg.appendChild(svgDefs);
  document.body.appendChild(svg);
  return svgDefs;
}

/**
 * Apply Deepika liquid glass effect to an element.
 */
export function deepikaGlass(el: HTMLElement, opts: DeepikaOptions = {}): DeepikaInstance {
  const o = {
    scale: opts.scale ?? -112,
    chroma: opts.chroma ?? 6,
    border: opts.border ?? 0.07,
    mapBlur: opts.mapBlur ?? 12,
    blur: opts.blur ?? 3,
    saturate: opts.saturate ?? 1.5,
    radius: opts.radius ?? null as number | null,
    fallbackBlur: opts.fallbackBlur ?? 16,
  };

  // Browser support detection
  const ua = navigator.userAgent;
  const isSafari = /Safari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua);
  const isFirefox = /Firefox/.test(ua);
  const supported = !isSafari && !isFirefox && CSS.supports('backdrop-filter', 'url(#lg-test)');

  if (!supported) {
    const frosted = `blur(${o.fallbackBlur}px) saturate(${o.saturate})`;
    el.style.backdropFilter = frosted;
    (el.style as any).webkitBackdropFilter = frosted;
    return {
      supported: false,
      refresh: () => {},
      destroy: () => {
        el.style.backdropFilter = '';
        (el.style as any).webkitBackdropFilter = '';
      },
    };
  }

  const id = `lg-deepika-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const scales = [o.scale, o.scale + o.chroma, o.scale + 2 * o.chroma];
  const { filter, feImage } = buildDeepikaFilter(id, scales);
  ensureDefs().appendChild(filter);

  function refresh() {
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (!w || !h) return;
    const radius = resolveRadius(el, w, h, o.radius ?? undefined);
    feImage.setAttribute('href', makeDeepikaMap(w, h, radius, o.border, o.mapBlur));
    feImage.setAttribute('width', String(w));
    feImage.setAttribute('height', String(h));
  }

  refresh();
  el.style.backdropFilter = `url(#${id}) blur(${o.blur}px) saturate(${o.saturate})`;
  (el.style as any).webkitBackdropFilter = el.style.backdropFilter;

  let timer: ReturnType<typeof setTimeout> | null = null;
  const ro = new ResizeObserver(() => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(refresh, 120);
  });
  ro.observe(el);

  return {
    supported: true,
    refresh,
    destroy: () => {
      ro.disconnect();
      if (timer) clearTimeout(timer);
      filter.remove();
      el.style.backdropFilter = '';
      (el.style as any).webkitBackdropFilter = '';
    },
  };
}
