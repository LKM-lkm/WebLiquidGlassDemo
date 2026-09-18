/**
 * Apple-style slider — iOS 26 Liquid Glass aesthetic.
 * Rounded track, glowing thumb, floating value label on drag.
 */

import React, { useRef, useState, useCallback, type ReactNode } from 'react';

interface AppleSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  icon?: ReactNode;
  accentColor?: string;
}

export function AppleSlider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  icon,
  accentColor = '#3b82f6',
}: AppleSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const pct = ((value - min) / (max - min)) * 100;

  const handleInteraction = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const raw = min + ratio * (max - min);
      const stepped = Math.round(raw / step) * step;
      onChange(Math.max(min, Math.min(max, stepped)));
    },
    [min, max, step, onChange],
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    handleInteraction(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    handleInteraction(e.clientX);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const active = isDragging || isHovered;

  return (
    <div
      className="group/slider select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Label row */}
      <div className="flex justify-between items-center px-1 mb-2.5">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-white/30 uppercase tracking-[0.12em] transition-colors group-hover/slider:text-white/50">
          {icon}
          <span>{label}</span>
        </div>
        <span
          className={`text-[11px] font-mono tabular-nums transition-all duration-200 ${
            active
              ? 'text-white bg-white/15 px-2 py-0.5 rounded-md border border-white/15'
              : 'text-white/40 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]'
          }`}
        >
          {typeof value === 'number' ? (Number.isInteger(step) || step >= 1 ? value.toFixed(0) : value.toFixed(2)) : value}
        </span>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        className="relative h-5 flex items-center cursor-pointer touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Track background */}
        <div className="absolute left-0 right-0 h-[4px] rounded-full bg-white/[0.08] overflow-hidden">
          {/* Fill */}
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              background: active
                ? `linear-gradient(90deg, ${accentColor}cc, ${accentColor})`
                : `linear-gradient(90deg, ${accentColor}88, ${accentColor}aa)`,
              boxShadow: active ? `0 0 8px ${accentColor}40` : 'none',
            }}
          />
        </div>

        {/* Thumb */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-150 ${
            isDragging ? 'scale-110' : active ? 'scale-105' : 'scale-100'
          }`}
          style={{ left: `${pct}%` }}
        >
          <div
            className={`w-[18px] h-[18px] rounded-full bg-white shadow-lg transition-all ${
              active ? 'shadow-[0_0_12px_rgba(255,255,255,0.3)]' : 'shadow-[0_1px_4px_rgba(0,0,0,0.3)]'
            }`}
          />
          {/* Glow ring on drag */}
          {isDragging && (
            <div
              className="absolute inset-[-4px] rounded-full animate-pulse"
              style={{ boxShadow: `0 0 16px ${accentColor}60` }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
