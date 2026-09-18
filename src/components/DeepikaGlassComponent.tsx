/**
 * Deepika Glass Component — uses the deepika SVG algorithm
 * (gradient ramp displacement + chromatic aberration).
 */

import React, { useRef, useEffect, useState, type ReactNode } from 'react';
import { deepikaGlass, type DeepikaInstance } from '../lib/svg/algorithms/deepika';
import type { GlassParams } from './SharedUI';

interface DeepikaGlassProps {
  id: string;
  width?: number | string;
  height?: number | string;
  maxWidth?: number | string;
  params: GlassParams;
  sceneUrl?: string;
  children?: ReactNode;
  overflowVisible?: boolean;
}

export function DeepikaGlassComponent({
  id,
  width,
  height,
  maxWidth,
  params,
  children,
  overflowVisible = false,
}: DeepikaGlassProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const glassLayerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<DeepikaInstance | null>(null);
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });

  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      if (w !== dimensions.w || h !== dimensions.h) {
        setDimensions({ w, h });
      }
    };
    update();
    const observer = new ResizeObserver(() => requestAnimationFrame(update));
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update);
    };
  }, [dimensions.w, dimensions.h]);

  useEffect(() => {
    if (!glassLayerRef.current || dimensions.w < 1 || dimensions.h < 1) return;
    if (instanceRef.current) {
      instanceRef.current.destroy();
      instanceRef.current = null;
    }

    const radius = params.radius ?? 20;
    const blur = params.blur ?? 4;
    const saturation = (params as any).refractionSaturation ?? params.backdropSaturation ?? 1.5;

    instanceRef.current = deepikaGlass(glassLayerRef.current, {
      scale: -112,
      chroma: 6,
      border: 0.07,
      mapBlur: 12,
      blur,
      saturate: saturation,
      radius,
      fallbackBlur: 16,
    });

    return () => {
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, [dimensions.w, dimensions.h, paramsKey, id]);

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
      <div
        ref={glassLayerRef}
        className="absolute inset-0 overflow-hidden pointer-events-none z-0"
        style={{
          borderRadius: radius,
          willChange: 'backdrop-filter',
        }}
      />

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

      <div
        className="absolute inset-0 -z-10 blur-3xl opacity-20 bg-black/40 translate-y-4 pointer-events-none"
        style={{ borderRadius: radius }}
      />
    </div>
  );
}
