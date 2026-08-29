import React, { useState, useEffect, useRef, type ReactNode } from 'react';
import { GlassFilter } from './GlassFilter';

export interface GlassParams {
  radius?: number;
  blur?: number;
  glassThickness?: number;
  bezelWidth?: number;
  refractiveIndex?: number;
  specularOpacity?: number;
  specularHardness?: number;
  refractionSaturation?: number;
  scaleRatio?: number;
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
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });

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
      {dimensions.w > 0 && dimensions.h > 0 && (
        <GlassFilter id={id} width={dimensions.w} height={dimensions.h} {...params} />
      )}

      <div
        className="absolute inset-0 overflow-hidden pointer-events-none z-0"
        style={{
          borderRadius: params.radius,
          backdropFilter: dimensions.w > 0 ? `url(#${id})` : 'none',
          WebkitBackdropFilter: dimensions.w > 0 ? `url(#${id})` : 'none',
          willChange: 'backdrop-filter',
        }}
      />

      {/* Tint overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-5"
        style={{
          borderRadius: params.radius,
          backgroundColor: params.tintColor || 'transparent',
          opacity: params.tintOpacity || 0,
        }}
      />

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
        <span className="text-[12px] font-mono text-white/60 bg-white/5 px-2 py-1 rounded-lg border border-white/5 group-hover/slider:bg-white/10 group-hover/slider:border-white/10 group-hover/slider:text-white transition-all tabular-nums">{value}</span>
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
