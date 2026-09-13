import React, { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { liquidGlass, type LiquidGlassOptions, type LiquidGlassInstance } from '../lib/liquid-glass';

export interface GlassParams {
  radius?: number;
  blur?: number;
  thickness?: number;
  edgeWidth?: number;
  ior?: number;
  specularOpacity?: number;
  specularHardness?: number;
  specularAngle?: number;
  dynamicSpecular?: boolean;
  backdropSaturation?: number;
  displacementScale?: number;
  tintColor?: string;
  tintOpacity?: number;
  colorScheme?: 'light' | 'dark';
  magnifyingScale?: number;
  [key: string]: unknown;
}

interface GlassComponentProps {
  id: string;
  width?: number | string;
  height?: number | string;
  maxWidth?: number | string;
  params: GlassParams;
  sceneUrl?: string;
  children?: ReactNode;
  overflowVisible?: boolean;
}

export function GlassComponent({
  id,
  width,
  height,
  maxWidth,
  params,
  children,
  overflowVisible = false,
}: GlassComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const glassLayerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<LiquidGlassInstance | null>(null);
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });

  // Stable params key for effect dependency
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

  // Apply liquid glass effect via the standalone library
  useEffect(() => {
    if (!glassLayerRef.current || dimensions.w < 1 || dimensions.h < 1) return;

    // Destroy previous instance
    if (instanceRef.current) {
      instanceRef.current.destroy();
      instanceRef.current = null;
    }

    const opts: LiquidGlassOptions = {
      radius: params.radius ?? 20,
      blur: params.blur ?? 4,
      thickness: (params as any).glassThickness ?? params.thickness ?? 60,
      edgeWidth: (params as any).bezelWidth ?? params.edgeWidth ?? 25,
      ior: (params as any).refractiveIndex ?? params.ior ?? 1.52,
      displacementScale: (params as any).scaleRatio ?? params.displacementScale ?? 1,
      specularOpacity: params.specularOpacity ?? 0.4,
      specularHardness: params.specularHardness ?? 2,
      specularAngle: params.specularAngle as number | undefined,
      backdropSaturation: (params as any).refractionSaturation ?? params.backdropSaturation ?? 1.2,
      tintColor: params.tintColor,
      tintOpacity: params.tintOpacity,
      colorScheme: params.colorScheme,
      magnifyingScale: params.magnifyingScale as number | undefined,
    };

    instanceRef.current = liquidGlass(glassLayerRef.current, opts);

    return () => {
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, [dimensions.w, dimensions.h, paramsKey, id]);

  // Dynamic specular: track mouse position and update light angle
  useEffect(() => {
    if (!params.dynamicSpecular || !containerRef.current) return;
    const el = containerRef.current;
    const defaultAngle = (params.specularAngle as number) ?? Math.PI / 3;
    let rafId = 0;
    let lastAngle = defaultAngle;
    const ANGLE_THRESHOLD = 0.05; // ~3° — skip re-bake if delta is smaller

    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        if (Math.abs(angle - lastAngle) > ANGLE_THRESHOLD) {
          lastAngle = angle;
          instanceRef.current?.setSpecularAngle(angle);
        }
      });
    };

    const handleMouseLeave = () => {
      cancelAnimationFrame(rafId);
      lastAngle = defaultAngle;
      instanceRef.current?.setSpecularAngle(defaultAngle);
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(rafId);
    };
  }, [params.dynamicSpecular, params.specularAngle]);

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
      {/* Glass refraction layer */}
      <div
        ref={glassLayerRef}
        className="absolute inset-0 overflow-hidden pointer-events-none z-0"
        style={{
          borderRadius: params.radius,
          willChange: 'backdrop-filter',
        }}
      />

      {/* Tint overlay */}
      {params.tintOpacity != null && params.tintOpacity > 0 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 5,
            borderRadius: params.radius,
            backgroundColor: params.tintColor || 'transparent',
            opacity: params.tintOpacity || 0,
          }}
        />
      )}

      <div
        className={`relative z-10 ${overflowVisible ? 'overflow-visible' : 'overflow-hidden'}`}
        style={{
          borderRadius: params.radius,
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
        style={{ borderRadius: params.radius }}
      />
    </div>
  );
}

interface ControlSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  icon?: ReactNode;
}

export function ControlSlider({ label, value, min, max, step = 1, onChange, icon }: ControlSliderProps) {
  return (
    <div className="space-y-3 group/slider">
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-2.5 text-[12px] font-extrabold text-white/30 uppercase tracking-[0.1em] font-heading group-hover/slider:text-white/60 transition-colors">
          {icon}
          <span>{label}</span>
        </div>
        <span className="text-[12px] font-mono text-white/80 bg-white/10 px-2 py-1 rounded-lg border border-white/10 group-hover/slider:bg-white/15 group-hover/slider:border-white/20 group-hover/slider:text-white transition-all tabular-nums">{value}</span>
      </div>
      <div className="px-1">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-white hover:accent-blue-400 transition-all shadow-inner"
        />
      </div>
    </div>
  );
}
