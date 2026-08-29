import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { GlassComponent } from './SharedUI';
import type { GlassParams } from './SharedUI';

interface HomeUIProps {
  onStart?: () => void;
  onOpenDocs?: () => void;
  sceneUrl?: string;
  globalParams?: GlassParams;
}

export function HomeUI({ onStart, onOpenDocs, sceneUrl, globalParams }: HomeUIProps) {
  const metrics = [
    { label: "RENDERING", value: "60FPS", desc: "Hardware Accelerated Pipeline", glassId: "m-render" },
    { label: "INDEX OF REFRACTION", value: "n=1.52", desc: "Physically Accurate Optics", glassId: "m-physics" },
    { label: "GHOSTING", value: "Zero", desc: "Pixel-perfect Alignment", glassId: "m-sync" }
  ];

  return (
    <div className="w-full flex flex-col items-center justify-center py-20 px-10 text-center max-w-[1400px] mx-auto min-h-full">
      <div className="space-y-16 mt-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="inline-flex items-center gap-4 px-5 py-2 rounded-full border border-white/5 bg-white/[0.02]"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.4)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50 font-heading">v1.2.5 Spatial Interface</span>
        </motion.div>

        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10"
          >
            <h1 className="text-[160px] font-black tracking-[-0.05em] leading-[0.8] mb-12 text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/30 selection:bg-transparent font-heading">
              Glass.<br />
              Refined.
            </h1>
            <p className="text-xl text-white/30 font-medium max-w-2xl mx-auto leading-relaxed mt-10 tracking-wide">
              The physics-based refraction engine for web. <br /> Precision optics, zero artifacts.
            </p>
          </motion.div>

        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-24"
      >
        {metrics.map((m) => (
          <GlassComponent
            key={m.glassId} id={m.glassId} width="100%" height={220} sceneUrl={sceneUrl}
            params={globalParams || { radius: 32, blur: 2, glassThickness: 60, bezelWidth: 25, refractionSaturation: 1.6 }}
          >
            <div className="p-8 text-left h-full flex flex-col justify-between cursor-default">
              <div className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-black font-heading">{m.label}</div>
              <div>
                <h3 className="text-4xl font-black mb-2 tracking-tighter text-white/90 font-heading">{m.value}</h3>
                <p className="text-[13px] text-white/30 font-medium tracking-wide">{m.desc}</p>
              </div>
            </div>
          </GlassComponent>
        ))}
      </motion.div>

      {/* Professional Footer Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mt-20 w-full max-w-5xl pt-10 flex flex-col md:flex-row items-center justify-between gap-10"
      >
        <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16">
          <div className="flex flex-col gap-1.5 text-left">
            <span className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-bold">Architecture</span>
            <span className="text-sm font-mono text-white/80">React + SVG Filter</span>
          </div>
          <div className="flex flex-col gap-1.5 text-left">
            <span className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-bold">Release</span>
            <span className="text-sm font-mono text-white/80">v1.2.5 LTS</span>
          </div>
          <div className="flex flex-col gap-1.5 text-left">
            <span className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-bold">License</span>
            <span className="text-sm font-mono text-white/80">MIT Open Source</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={onStart}
            className="group relative px-8 py-4 rounded-xl overflow-hidden bg-white text-black hover:bg-white/90 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.4)] flex items-center gap-3 font-bold text-[13px] uppercase tracking-[0.15em] active:scale-95"
          >
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-[pulse_2s_ease-in-out_infinite]" />
            Launch Workspace
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform stroke-[3]" />
          </button>

          <div className="flex gap-3">
            <button 
              onClick={onOpenDocs}
              className="px-8 py-4 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 transition-colors flex items-center justify-center font-bold text-[12px] uppercase tracking-[0.2em] text-white/80 hover:text-white"
            >
              阅读项目文档
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
