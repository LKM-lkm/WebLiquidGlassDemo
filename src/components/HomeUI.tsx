import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Droplets, Github, Zap, Layers, Eye, Code2, ArrowRight } from 'lucide-react';
import { WebGLGlass } from './WebGLGlass';
import type { GlassParams } from './SharedUI';

interface HomeUIProps {
  onStart?: () => void;
  onOpenDocs?: () => void;
  sceneUrl?: string;
  globalParams?: GlassParams;
  isDark?: boolean;
}

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
};

export function HomeUI({ onStart, onOpenDocs, sceneUrl, globalParams, isDark = true }: HomeUIProps) {
  const textPrimary = isDark ? 'text-white/90' : 'text-gray-900';
  const textSecondary = isDark ? 'text-white/40' : 'text-gray-500';
  const textMuted = isDark ? 'text-white/25' : 'text-gray-400';
  const borderColor = isDark ? 'border-white/[0.08]' : 'border-gray-200';
  const borderColorHover = isDark ? 'hover:border-white/[0.15]' : 'hover:border-gray-300';
  const cardBg = isDark ? 'bg-white/[0.02]' : 'bg-white/60';
  const navBg = isDark ? 'bg-white/[0.04]' : 'bg-gray-100';
  const codeBg = isDark ? 'bg-[#0a0a0c]' : 'bg-gray-50';
  const metricBg = isDark ? 'bg-[#08080a]' : 'bg-white';

  const features = [
    {
      icon: <Eye className="w-5 h-5" />,
      title: 'Physical Refraction',
      desc: "Snell's Law computed per-pixel. Light bends through a simulated glass medium — not a static overlay or blur trick.",
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: 'GPU Pipeline',
      desc: 'WebGL2 fragment shaders run entirely on the GPU. SDF-based refraction computed in real-time at 60fps.',
    },
    {
      icon: <Layers className="w-5 h-5" />,
      title: 'Multi-Algorithm',
      desc: 'Five glass algorithms — SVG physics (LiuNian, Deepika) and WebGL (Kyant, Studio, Ybouane) — switchable in real-time.',
    },
    {
      icon: <Code2 className="w-5 h-5" />,
      title: 'Zero Dependencies',
      desc: 'One function call. Works with React, Vue, Svelte, or vanilla JS. No build plugins, no runtime overhead.',
    },
  ];

  const defaultParams: GlassParams = {
    radius: globalParams?.radius ?? 20,
    blur: globalParams?.blur ?? 4,
    thickness: globalParams?.thickness ?? 60,
    edgeWidth: globalParams?.edgeWidth ?? 25,
    ior: globalParams?.ior ?? 1.52,
    specularOpacity: globalParams?.specularOpacity ?? 0.4,
    specularHardness: globalParams?.specularHardness ?? 2,
    backdropSaturation: globalParams?.backdropSaturation ?? 1.2,
    refractionHeight: 15,
    chromaticAberration: 3,
    vibrancy: 0.5,
    tintAmount: 0.15,
  };

  return (
    <div className="w-full">
      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
      >
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-md ${navBg} border ${borderColor} flex items-center justify-center`}>
              <Droplets className={`w-3.5 h-3.5 ${textSecondary}`} />
            </div>
            <span className={`text-[14px] font-semibold tracking-tight ${textSecondary}`}>LiquidGlass</span>
            <span className={`text-[9px] font-mono ${textMuted} ${navBg} px-1.5 py-0.5 rounded border ${borderColor}`}>v2.0</span>
          </div>
          <div className="flex items-center gap-5">
            <button onClick={onOpenDocs} className={`text-[12px] ${textMuted} hover:${textSecondary} transition-colors`}>
              Documentation
            </button>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className={`${textMuted} hover:${textSecondary} transition-colors`}>
              <Github className="w-4 h-4" />
            </a>
            <button
              onClick={onStart}
              className={`text-[12px] font-medium ${isDark ? 'text-white/60 hover:text-white/90 bg-white/[0.04] hover:bg-white/[0.08]' : 'text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200'} px-4 py-1.5 rounded-full border ${borderColor} transition-all`}
            >
              Open Studio
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section — asymmetric layout */}
      <section className="relative min-h-screen flex items-center px-6 pt-24 pb-20">
        <div className="max-w-[1200px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Text */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeUp} className="mb-8">
              <span className={`inline-flex items-center gap-2 text-[10px] font-medium ${textMuted} ${cardBg} border ${borderColor} px-3 py-1 rounded-full uppercase tracking-[0.2em]`}>
                <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                Physics-based rendering for the web
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-[48px] sm:text-[56px] md:text-[68px] lg:text-[80px] font-extrabold tracking-[-0.04em] leading-[0.88] mb-8"
            >
              <span className={textPrimary}>Liquid</span>
              <br />
              <span className={textSecondary}>Glass</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className={`text-[16px] md:text-[18px] ${textMuted} font-normal leading-[1.7] max-w-[480px] mb-12`}
            >
              Real-time refraction optics for any DOM element.
              <br />
              Five algorithms. WebGL2 GPU. Zero compromises.
            </motion.p>

            <motion.div variants={fadeUp} className="flex items-center gap-3">
              <button
                onClick={onStart}
                className={`group inline-flex items-center gap-2 px-6 py-3 rounded-full ${isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-gray-900 text-white hover:bg-gray-800'} text-[14px] font-semibold transition-all`}
              >
                Launch Studio
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={onOpenDocs}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-full ${cardBg} hover:${isDark ? 'bg-white/[0.08]' : 'bg-gray-100'} border ${borderColor} ${textSecondary} text-[14px] font-medium transition-all`}
              >
                Documentation
              </button>
            </motion.div>
          </motion.div>

          {/* Right: Glass Demo Card with Background */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full"
          >
            <div className="relative rounded-[20px] overflow-hidden">
              {/* Background landscape image */}
              <div className="relative aspect-[4/3]">
                <img
                  src={sceneUrl}
                  alt="Background landscape"
                  className="absolute inset-0 w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-b from-black/20 via-transparent to-black/40' : 'bg-gradient-to-b from-white/10 via-transparent to-white/20'}`} />

                {/* Grid overlay behind glass */}
                <div
                  className="absolute inset-0 opacity-[0.08]"
                  style={{
                    backgroundImage: isDark
                      ? 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)'
                      : 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                  }}
                />

                {/* Glass cards over the image */}
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="flex gap-4 p-6">
                    {[
                      { label: 'Refraction', value: 'n = 1.52', icon: <Droplets className="w-5 h-5 text-white/40" /> },
                      { label: 'Performance', value: '60 FPS', icon: <Zap className="w-5 h-5 text-white/40" /> },
                      { label: 'Algorithms', value: '5 Types', icon: <Layers className="w-5 h-5 text-white/40" /> },
                    ].map((item, i) => (
                      <WebGLGlass
                        key={item.label}
                        id={`hero-card-${i}`}
                        width={160}
                        height={160}
                        sceneUrl={sceneUrl}
                        params={{
                          ...defaultParams,
                          radius: 20,
                          specularOpacity: 0.3,
                          tintColor: isDark ? '#1a1a2e' : '#ffffff',
                          tintOpacity: isDark ? 0.15 : 0.25,
                        }}
                      >
                        <div className="w-full h-full flex flex-col items-center justify-center p-5 gap-2">
                          {item.icon}
                          <span className="text-[9px] font-medium text-white/30 uppercase tracking-[0.2em]">{item.label}</span>
                          <span className="text-[20px] font-bold text-white/70 tracking-tight">{item.value}</span>
                        </div>
                      </WebGLGlass>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Metrics */}
      <section className="py-24 px-6">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className={`grid grid-cols-1 md:grid-cols-3 gap-[1px] ${isDark ? 'bg-white/[0.04]' : 'bg-gray-200'} rounded-[14px] overflow-hidden`}
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
                className={`p-8 ${metricBg}`}
              >
                <div className={`text-[9px] font-medium ${textMuted} uppercase tracking-[0.2em] mb-4`}>{m.label}</div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className={`text-[44px] font-extrabold tracking-[-0.03em] ${isDark ? 'text-white/80' : 'text-gray-800'} leading-none`}>{m.value}</span>
                  <span className={`text-[13px] font-medium ${textMuted}`}>{m.unit}</span>
                </div>
                <p className={`text-[12px] ${textMuted}`}>{m.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <h2 className={`text-[32px] md:text-[40px] font-extrabold tracking-[-0.03em] leading-[1.05] ${isDark ? 'text-white/80' : 'text-gray-800'}`}>
              Engineered for precision.
            </h2>
            <p className={`text-[15px] ${textMuted} mt-3 max-w-[480px]`}>
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
                className={`p-6 rounded-[12px] ${cardBg} border ${borderColor} ${borderColorHover} transition-colors group`}
              >
                <div className={`w-8 h-8 rounded-md ${isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-gray-100 border-gray-200'} border flex items-center justify-center mb-4 ${textMuted} group-hover:${textSecondary} transition-colors`}>
                  {f.icon}
                </div>
                <h3 className={`text-[15px] font-semibold ${isDark ? 'text-white/70' : 'text-gray-700'} tracking-tight mb-2`}>{f.title}</h3>
                <p className={`text-[13px] ${textMuted} leading-[1.7]`}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Code Example */}
      <section className="py-24 px-6">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="mb-10"
          >
            <h2 className={`text-[32px] md:text-[40px] font-extrabold tracking-[-0.03em] leading-[1.05] ${isDark ? 'text-white/80' : 'text-gray-800'}`}>
              One import. <span className={textMuted}>One call.</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
            className={`rounded-[12px] overflow-hidden border ${borderColor} ${codeBg}`}
          >
            <div className={`flex items-center gap-2 px-4 py-2 border-b ${borderColor}`}>
              <div className="flex gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-white/[0.06]' : 'bg-gray-300'}`} />
                <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-white/[0.06]' : 'bg-gray-300'}`} />
                <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-white/[0.06]' : 'bg-gray-300'}`} />
              </div>
              <span className={`text-[9px] ${textMuted} font-mono ml-2`}>main.ts</span>
            </div>
            <pre className="p-6 text-[12px] leading-[1.8] font-mono overflow-x-auto">
              <code>
                <span className={textMuted}>{'import'}</span>{' '}
                <span className={isDark ? 'text-white/60' : 'text-gray-600'}>{'{ liquidGlass }'}</span>{' '}
                <span className={textMuted}>{'from'}</span>{' '}
                <span className={isDark ? 'text-white/40' : 'text-gray-400'}>{'\'liquid-glass\''}</span>
                <span className={textMuted}>;</span>
                {'\n\n'}
                <span className={textMuted}>{'const'}</span>{' '}
                <span className={isDark ? 'text-white/60' : 'text-gray-600'}>glass</span>{' '}
                <span className={textMuted}>{'='}</span>{' '}
                <span className={isDark ? 'text-white/50' : 'text-gray-500'}>liquidGlass</span>
                <span className={textMuted}>(</span>
                <span className={isDark ? 'text-white/50' : 'text-gray-500'}>document.querySelector</span>
                <span className={textMuted}>(</span>
                <span className={isDark ? 'text-white/40' : 'text-gray-400'}>{'.my-card'}</span>
                <span className={textMuted}>),</span>
                {'\n'}
                {'  '}
                <span className={textMuted}>{'{'}</span>
                {'\n'}
                {'    '}
                <span className={isDark ? 'text-white/40' : 'text-gray-400'}>radius</span>
                <span className={textMuted}>:</span>{' '}
                <span className={isDark ? 'text-white/50' : 'text-gray-500'}>32</span>
                <span className={textMuted}>,</span>
                {'\n'}
                {'    '}
                <span className={isDark ? 'text-white/40' : 'text-gray-400'}>thickness</span>
                <span className={textMuted}>:</span>{' '}
                <span className={isDark ? 'text-white/50' : 'text-gray-500'}>60</span>
                <span className={textMuted}>,</span>
                {'\n'}
                {'    '}
                <span className={isDark ? 'text-white/40' : 'text-gray-400'}>ior</span>
                <span className={textMuted}>:</span>{' '}
                <span className={isDark ? 'text-white/50' : 'text-gray-500'}>1.52</span>
                <span className={textMuted}>,</span>
                {' '}
                <span className={textMuted}>{'// index of refraction'}</span>
                {'\n'}
                {'  '}
                <span className={textMuted}>{'}'}</span>
                <span className={textMuted}>);</span>
              </code>
            </pre>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="max-w-[600px] mx-auto text-center"
        >
          <h2 className={`text-[40px] md:text-[52px] font-extrabold tracking-[-0.04em] leading-[1.0] ${isDark ? 'text-white/80' : 'text-gray-800'} mb-5`}>
            Start building.
          </h2>
          <p className={`text-[14px] ${textMuted} leading-[1.7] mb-10`}>
            Open source. MIT licensed. No vendor lock-in.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onStart}
              className={`group inline-flex items-center gap-2 px-7 py-3.5 rounded-full ${isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-gray-900 text-white hover:bg-gray-800'} text-[14px] font-semibold transition-all`}
            >
              Open Studio
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={onOpenDocs}
              className={`inline-flex items-center gap-2 px-7 py-3.5 rounded-full ${cardBg} hover:${isDark ? 'bg-white/[0.08]' : 'bg-gray-100'} border ${borderColor} ${textSecondary} text-[14px] font-medium transition-all`}
            >
              Read Documentation
            </button>
          </div>

          <div className={`mt-20 pt-6 border-t ${borderColor} flex items-center justify-center gap-6 text-[10px] ${textMuted} font-mono`}>
            <span>React + WebGL2</span>
            <span>·</span>
            <span>v2.0</span>
            <span>·</span>
            <span>MIT</span>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
