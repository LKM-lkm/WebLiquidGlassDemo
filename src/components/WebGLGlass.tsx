/**
 * WebGL Glass Component — drop-in replacement for SVG GlassComponent.
 * Uses WebGL2 for GPU-accelerated glass refraction.
 * Supports algorithms: kyant, liquidglassstudio, ybouane.
 */

import React, { useRef, useEffect, useState, type ReactNode } from 'react';
import { GlassRenderer, DEFAULT_GLASS_RENDERER_PARAMS, type GlassRendererParams } from '../lib/webgl/renderer';
import type { GlassParams } from './SharedUI';

export type WebGLGlassAlgorithm = 'kyant' | 'liquidglassstudio' | 'ybouane';

interface WebGLGlassProps {
  id: string;
  width?: number | string;
  height?: number | string;
  maxWidth?: number | string;
  params: GlassParams;
  sceneUrl?: string;
  children?: ReactNode;
  overflowVisible?: boolean;
  algorithm?: WebGLGlassAlgorithm;
}

function loadImageToCanvas(url: string, w: number, h: number): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const canvasAspect = w / h;
      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
      if (imgAspect > canvasAspect) {
        sw = img.naturalHeight * canvasAspect;
        sx = (img.naturalWidth - sw) / 2;
      } else {
        sh = img.naturalWidth / canvasAspect;
        sy = (img.naturalHeight - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
      resolve(canvas);
    };
    img.onerror = reject;
    img.src = url;
  });
}

/** Per-algorithm default parameter overrides */
const ALGO_DEFAULTS: Record<WebGLGlassAlgorithm, Partial<GlassRendererParams>> = {
  kyant: {
    refractionHeight: 15,
    ior: 1.5,
    chromaticAberration: 3,
    blurMix: 0.6,
    vibrancy: 0.5,
    tintAmount: 0.15,
    highlightIntensity: 0.5,
  },
  liquidglassstudio: {
    refractionHeight: 20,
    ior: 1.4,
    chromaticAberration: 5,
    blurMix: 0.8,
    vibrancy: 0.3,
    tintAmount: 0.25,
    highlightIntensity: 0.7,
  },
  ybouane: {
    refractionHeight: 12,
    ior: 1.52,
    chromaticAberration: 2,
    blurMix: 0.5,
    vibrancy: 0.6,
    tintAmount: 0.1,
    highlightIntensity: 0.4,
  },
};

export function WebGLGlass({
  id,
  width,
  height,
  maxWidth,
  params,
  sceneUrl,
  children,
  overflowVisible = false,
  algorithm = 'kyant',
}: WebGLGlassProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GlassRenderer | null>(null);
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });
  const sceneCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [sceneReady, setSceneReady] = useState(false);

  // Track container size
  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      if (w > 0 && h > 0) {
        setDimensions(prev => (prev.w === w && prev.h === h ? prev : { w, h }));
      }
    };
    update();
    const observer = new ResizeObserver(() => requestAnimationFrame(update));
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  // Load scene image → upload to renderer → trigger render
  useEffect(() => {
    if (!sceneUrl || dimensions.w < 1 || dimensions.h < 1) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pw = Math.round(dimensions.w * dpr);
    const ph = Math.round(dimensions.h * dpr);
    let cancelled = false;
    setSceneReady(false);

    loadImageToCanvas(sceneUrl, pw, ph).then(canvas => {
      if (cancelled) return;
      sceneCanvasRef.current = canvas;
      if (rendererRef.current) {
        rendererRef.current.uploadScene(canvas, pw, ph);
      }
      setSceneReady(true);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [sceneUrl, dimensions.w, dimensions.h]);

  // Initialize renderer and render
  useEffect(() => {
    if (!canvasRef.current || dimensions.w < 1 || dimensions.h < 1) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pw = Math.round(dimensions.w * dpr);
    const ph = Math.round(dimensions.h * dpr);

    if (!rendererRef.current) {
      try {
        rendererRef.current = new GlassRenderer(canvasRef.current);
      } catch {
        return;
      }
    }

    const renderer = rendererRef.current;
    renderer.resize(pw, ph);

    // Upload scene if available
    if (sceneCanvasRef.current) {
      renderer.uploadScene(sceneCanvasRef.current, pw, ph);
    }

    // Build render params with algorithm-specific defaults
    const algoDefaults = ALGO_DEFAULTS[algorithm] || {};
    const p = params;
    const radius = p.radius ?? 20;
    const tintR = p.tintColor ? hexToRgb(p.tintColor).r / 255 : 0;
    const tintG = p.tintColor ? hexToRgb(p.tintColor).g / 255 : 0;
    const tintB = p.tintColor ? hexToRgb(p.tintColor).b / 255 : 0;

    const renderParams: GlassRendererParams = {
      ...DEFAULT_GLASS_RENDERER_PARAMS,
      ...algoDefaults,
      rectX: 0,
      rectY: 0,
      rectW: dimensions.w,
      rectH: dimensions.h,
      radius,
      dpr,
      refractionHeight: (p.refractionHeight as number) ?? algoDefaults.refractionHeight ?? 15,
      ior: (p.ior ?? p.refractiveIndex as number) ?? algoDefaults.ior ?? 1.52,
      chromaticAberration: (p.chromaticAberration as number) ?? algoDefaults.chromaticAberration ?? 3,
      blurRadius: p.blur ?? 4,
      vibrancy: (p.vibrancy as number) ?? algoDefaults.vibrancy ?? 0.5,
      tintR, tintG, tintB,
      tintAmount: (p.tintAmount as number) ?? algoDefaults.tintAmount ?? 0.15,
      highlightIntensity: p.specularOpacity ?? algoDefaults.highlightIntensity ?? 0.4,
      highlightAngle: (p.specularAngle as number) ?? 0,
      tintColorR: tintR,
      tintColorG: tintG,
      tintColorB: tintB,
      tintOpacity: p.tintOpacity ?? 0,
    };

    renderer.render(renderParams);
  }, [dimensions, params, algorithm, sceneReady]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
    };
  }, []);

  const radius = params.radius ?? 20;

  return (
    <div
      ref={containerRef}
      className="relative group inline-block"
      style={{
        width: width || 'auto',
        height: height || 'auto',
        maxWidth: maxWidth || 'none',
      }}
    >
      {/* WebGL canvas (behind content) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          width: '100%',
          height: '100%',
          borderRadius: radius,
        }}
      />

      {/* Tint overlay */}
      {params.tintOpacity != null && params.tintOpacity > 0 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 5,
            borderRadius: radius,
            backgroundColor: params.tintColor || 'transparent',
            opacity: params.tintOpacity || 0,
          }}
        />
      )}

      {/* Content */}
      <div
        className={`relative z-10 ${overflowVisible ? 'overflow-visible' : 'overflow-hidden'}`}
        style={{
          borderRadius: radius,
          height: !height || height === 'auto' ? undefined : height,
          minHeight: !height || height === 'auto' ? undefined : height,
          width: !width || width === 'auto' ? undefined : width,
        }}
      >
        <div style={{ height: !height || height === 'auto' ? 'auto' : '100%' }}>
          {children}
        </div>
      </div>

      {/* Shadow */}
      <div
        className="absolute inset-0 -z-10 blur-3xl opacity-20 bg-black/40 translate-y-4 pointer-events-none"
        style={{ borderRadius: radius }}
      />
    </div>
  );
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}
