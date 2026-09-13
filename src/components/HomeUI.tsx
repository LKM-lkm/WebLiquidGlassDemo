import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Droplets, Github, Zap, Layers, Eye, Code2, ArrowRight } from 'lucide-react';
import { GlassComponent } from './SharedUI';
import type { GlassParams } from './SharedUI';

interface HomeUIProps {
  onStart?: () => void;
  onOpenDocs?: () => void;
  sceneUrl?: string;
  globalParams?: GlassParams;
}

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
};

export function HomeUI({ onStart, onOpenDocs, sceneUrl, globalParams }: HomeUIProps) {
  const features = [
    {
      icon: <Eye className="w-5 h-5" />,
      title: 'Physical Refraction',
      desc: 'Snell\'s Law computed per-pixel. Light bends through a simulated glass medium — not a static overlay or blur trick.',
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: 'GPU Pipeline',
      desc: 'SVG filter chain runs entirely on the GPU. Displacement maps are baked once on the CPU, composited at 60fps with zero jank.',
    },
    {
      icon: <Layers className="w-5 h-5" />,
      title: 'Multi-Layer Optics',
      desc: 'Refraction displacement, specular highlights, backdrop saturation, and edge glow — each a physically separate rendering pass.',
    },
    {
      icon: <Code2 className="w-5 h-5" />,
      title: 'Zero Dependencies',
      desc: 'One function call. Works with React, Vue, Svelte, or vanilla JS. No build plugins, no runtime overhead.',
    },
  ];

  return (
    <div className="w-full">
      {/* ── Navigation ──────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
      >
        <div className="max-w-[1100px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
              <Droplets className="w-3.5 h-3.5 text-white/50" />
            </div>
            <span className="text-[14px] font-semibold tracking-tight text-white/70">LiquidGlass</span>
            <span className="text-[9px] font-mono text-white/20 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">v1.2</span>
          </div>
          <div className="flex items-center gap-5">
            <button onClick={onOpenDocs} className="text-[12px] text-white/30 hover:text-white/60 transition-colors">
              Documentation
            </button>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-white/20 hover:text-white/50 transition-colors">
              <Github className="w-4 h-4" />
            </a>
            <button
              onClick={onStart}
              className="text-[12px] font-medium text-white/60 hover:text-white/90 bg-white/[0.04] hover:bg-white/[0.08] px-4 py-1.5 rounded-full border border-white/[0.08] transition-all"
            >
              Open Workspace
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-20">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="relative z-10 text-center max-w-[860px] mx-auto"
        >
          <motion.div variants={fadeUp} className="mb-8">
            <span className="inline-flex items-center gap-2 text-[10px] font-medium text-white/30 bg-white/[0.03] border border-white/[0.06] px-3 py-1 rounded-full uppercase tracking-[0.2em]">
              <span className="w-1 h-1 rounded-full bg-white/40 animate-pulse" />
              Physics-based rendering for the web
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-[56px] sm:text-[68px] md:text-[84px] lg:text-[100px] font-extrabold tracking-[-0.04em] leading-[0.88] mb-8"
          >
            <span className="text-white/90">Liquid</span>
            <br />
            <span className="text-white/40">Glass</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-[16px] md:text-[18px] text-white/25 font-normal leading-[1.7] max-w-[480px] mx-auto mb-12"
          >
            Real-time refraction optics for any DOM element.
            <br />
            Snell's Law. SVG filters. Zero compromises.
          </motion.p>

          <motion.div variants={fadeUp} className="flex items-center justify-center gap-3 mb-20">
            <button
              onClick={onStart}
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black text-[14px] font-semibold hover:bg-white/90 transition-all"
            >
              Launch Playground
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={onOpenDocs}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/50 text-[14px] font-medium transition-all"
            >
              Documentation
            </button>
          </motion.div>

          {/* Hero Glass Demo */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[800px] mx-auto"
          >
            <div className="absolute -inset-6 bg-gradient-to-b from-white/[0.02] via-transparent to-transparent rounded-[32px] blur-2xl pointer-events-none" />
            <div className="relative rounded-[14px] overflow-hidden border border-white/[0.06] bg-white/[0.01]">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.04] bg-white/[0.01]">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-white/[0.06]" />
                  <div className="w-2 h-2 rounded-full bg-white/[0.06]" />
                  <div className="w-2 h-2 rounded-full bg-white/[0.06]" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-3 py-0.5 rounded bg-white/[0.03] border border-white/[0.04] text-[9px] text-white/15 font-mono">
                    localhost:3000
                  </div>
                </div>
              </div>
              {/* Glass demo */}
              <div className="relative aspect-[16/9] flex items-center justify-center overflow-hidden">
                <img
                  src={sceneUrl}
                  alt="Background landscape"
                  className="absolute inset-0 w-full h-full object-cover opacity-50"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#08080a]/30 via-transparent to-[#08080a]/50" />
                <div className="relative z-10 flex gap-4">
                  {[
                    { label: 'Refraction', value: 'n = 1.52', icon: <Droplets className="w-5 h-5 text-white/40" /> },
                    { label: 'Performance', value: '60 FPS', icon: <Zap className="w-5 h-5 text-white/40" /> },
                    { label: 'Ghosting', value: 'Zero', icon: <Eye className="w-5 h-5 text-white/40" /> },
                  ].map((item, i) => (
                    <GlassComponent
                      key={item.label}
                      id={`hero-card-${i}`}
                      width={180}
                      height={180}
                      sceneUrl={sceneUrl}
                      params={globalParams || { radius: 20, blur: 4, thickness: 60, edgeWidth: 25, ior: 1.52, specularOpacity: 0.4, specularHardness: 2, backdropSaturation: 1.2 }}
                    >
                      <div className="w-full h-full flex flex-col items-center justify-center p-5 gap-2">
                        {item.icon}
                        <span className="text-[9px] font-medium text-white/30 uppercase tracking-[0.2em]">{item.label}</span>
                        <span className="text-[20px] font-bold text-white/70 tracking-tight">{item.value}</span>
                      </div>
                    </GlassComponent>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Metrics ─────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-[860px] mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-white/[0.04] rounded-[14px] overflow-hidden"
          >
            {[
              { label: 'Rendering', value: '60', unit: 'FPS', desc: 'Hardware-accelerated pipeline' },
              { label: 'Refraction', value: '1.52', unit: 'IOR', desc: 'Physically accurate glass optics' },
              { label: 'Ghosting', value: '0', unit: 'px', desc: 'Pixel-perfect alignment' },
            ].map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-8 bg-[#08080a]"
              >
                <div className="text-[9px] font-medium text-white/20 uppercase tracking-[0.2em] mb-4">{m.label}</div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-[44px] font-extrabold tracking-[-0.03em] text-white/80 leading-none">{m.value}</span>
                  <span className="text-[13px] font-medium text-white/15">{m.unit}</span>
                </div>
                <p className="text-[12px] text-white/15">{m.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-[860px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <h2 className="text-[32px] md:text-[40px] font-extrabold tracking-[-0.03em] leading-[1.05] text-white/80">
              Engineered for precision.
            </h2>
            <p className="text-[15px] text-white/20 mt-3 max-w-[480px]">
              Every rendering pass is physically grounded. No shortcuts, no approximations.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="p-6 rounded-[12px] bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-colors group"
              >
                <div className="w-8 h-8 rounded-md bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4 text-white/30 group-hover:text-white/50 transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-[15px] font-semibold text-white/70 tracking-tight mb-2">{f.title}</h3>
                <p className="text-[13px] text-white/20 leading-[1.7]">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Code Example ────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-[860px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="mb-10"
          >
            <h2 className="text-[32px] md:text-[40px] font-extrabold tracking-[-0.03em] leading-[1.05] text-white/80">
              One import. <span className="text-white/25">One call.</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
            className="rounded-[12px] overflow-hidden border border-white/[0.06] bg-[#0a0a0c]"
          >
            <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.04]">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-white/[0.06]" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/[0.06]" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/[0.06]" />
              </div>
              <span className="text-[9px] text-white/15 font-mono ml-2">main.ts</span>
            </div>
            <pre className="p-6 text-[12px] leading-[1.8] font-mono overflow-x-auto">
              <code>
                <span className="text-white/30">{'import'}</span>{' '}
                <span className="text-white/60">{'{ liquidGlass }'}</span>{' '}
                <span className="text-white/30">{'from'}</span>{' '}
                <span className="text-white/40">{'\'liquid-glass\''}</span>
                <span className="text-white/15">;</span>
                {'\n\n'}
                <span className="text-white/30">{'const'}</span>{' '}
                <span className="text-white/60">glass</span>{' '}
                <span className="text-white/15">={'>'}{' '}</span>
                <span className="text-white/50">liquidGlass</span>
                <span className="text-white/15">(</span>
                <span className="text-white/50">document.querySelector</span>
                <span className="text-white/15">(</span>
                <span className="text-white/40">{'.my-card'}</span>
                <span className="text-white/15">),</span>
                {'\n'}
                {'  '}
                <span className="text-white/15">{'{'}</span>
                {'\n'}
                {'    '}
                <span className="text-white/40">radius</span>
                <span className="text-white/15">:</span>{' '}
                <span className="text-white/50">32</span>
                <span className="text-white/15">,</span>
                {'\n'}
                {'    '}
                <span className="text-white/40">thickness</span>
                <span className="text-white/15">:</span>{' '}
                <span className="text-white/50">60</span>
                <span className="text-white/15">,</span>
                {'\n'}
                {'    '}
                <span className="text-white/40">ior</span>
                <span className="text-white/15">:</span>{' '}
                <span className="text-white/50">1.52</span>
                <span className="text-white/15">,</span>
                {' '}
                <span className="text-white/12">{'// index of refraction'}</span>
                {'\n'}
                {'  '}
                <span className="text-white/15">{'}'}</span>
                <span className="text-white/15">)</span>
                <span className="text-white/15">;</span>
              </code>
            </pre>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────── */}
      <section className="py-32 px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="max-w-[600px] mx-auto text-center"
        >
          <h2 className="text-[40px] md:text-[52px] font-extrabold tracking-[-0.04em] leading-[1.0] text-white/80 mb-5">
            Start building.
          </h2>
          <p className="text-[14px] text-white/18 leading-[1.7] mb-10">
            Open source. MIT licensed. No vendor lock-in.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onStart}
              className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-black text-[14px] font-semibold hover:bg-white/90 transition-all"
            >
              Open Playground
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={onOpenDocs}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/40 text-[14px] font-medium transition-all"
            >
              Read Documentation
            </button>
          </div>

          <div className="mt-20 pt-6 border-t border-white/[0.04] flex items-center justify-center gap-6 text-[10px] text-white/12 font-mono">
            <span>React + SVG Filter</span>
            <span>·</span>
            <span>v1.2.5</span>
            <span>·</span>
            <span>MIT</span>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
