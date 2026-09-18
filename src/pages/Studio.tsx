/**
 * Studio Page — Liquid Glass interactive playground.
 * Features: algorithm switching (SVG: liunian/deepika, WebGL: kyant),
 * iOS 26 Liquid Glass panels, Apple-style sliders, demo components.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Settings2, Droplets, ChevronRight, ChevronLeft,
  Wifi, Battery, Signal, Sparkles, Play,
  ListMusic, Airplay, Volume2, MoreHorizontal, RefreshCw,
  Maximize2, Sliders, ToggleLeft, Layers, MonitorSmartphone,
  Cpu, Paintbrush,
} from 'lucide-react';
import { UnifiedGlass, ALGORITHMS, getAlgorithmType, type GlassAlgorithm, type AlgorithmType } from '../components/UnifiedGlass';
import { AppleSlider } from '../components/AppleSlider';
import { ControlCenter } from '../components/ControlCenter';
import { SCENES, DEFAULT_GLASS_PARAMS } from '../constants';
import type { GlassParams } from '../components/SharedUI';
import {
  CustomPlayIcon, CustomPauseIcon, CustomPrevIcon, CustomNextIcon,
} from '../components/NavIcons';

const UI_SCENARIOS = [
  { id: 'player', name: '音乐播放', icon: <Play className="w-3.5 h-3.5" /> },
  { id: 'slider', name: '滑块', icon: <Sliders className="w-3.5 h-3.5" /> },
  { id: 'switch', name: '开关', icon: <ToggleLeft className="w-3.5 h-3.5" /> },
  { id: 'search', name: '搜索框', icon: <Search className="w-3.5 h-3.5" /> },
  { id: 'control', name: '控制中心', icon: <MonitorSmartphone className="w-3.5 h-3.5" /> },
  { id: 'playground', name: '实验室', icon: <Sparkles className="w-3.5 h-3.5" /> },
];

export function Studio() {
  const navigate = useNavigate();
  const [activeScene, setActiveScene] = useState(0);
  const [activeUI, setActiveUI] = useState('player');
  const [algorithm, setAlgorithm] = useState<GlassAlgorithm>('liunian');
  const [algoType, setAlgoType] = useState<AlgorithmType>('svg');
  const [params, setParams] = useState({
    radius: DEFAULT_GLASS_PARAMS.radius,
    blur: DEFAULT_GLASS_PARAMS.blur,
    refractiveIndex: DEFAULT_GLASS_PARAMS.ior,
    refractionSaturation: DEFAULT_GLASS_PARAMS.backdropSaturation,
    glassThickness: DEFAULT_GLASS_PARAMS.thickness,
    bezelWidth: DEFAULT_GLASS_PARAMS.edgeWidth,
    specularOpacity: DEFAULT_GLASS_PARAMS.specularOpacity,
    specularHardness: DEFAULT_GLASS_PARAMS.specularHardness,
    displacementScale: DEFAULT_GLASS_PARAMS.displacementScale,
    tintColor: '#000000',
    tintOpacity: 0,
    specularAngle: Math.PI / 3,
    dynamicSpecular: true,
    // WebGL-specific
    refractionHeight: 15,
    chromaticAberration: 3,
    vibrancy: 0.5,
    tintAmount: 0.15,
    // Playground sizes
    pgWidth: 300,
    pgHeight: 200,
    pgCircleSize: 200,
  });

  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isNavMoving, setIsNavMoving] = useState(false);
  const [isNavPressed, setIsNavPressed] = useState(false);

  useEffect(() => {
    setIsNavMoving(true);
    const timer = setTimeout(() => setIsNavMoving(false), 500);
    return () => clearTimeout(timer);
  }, [activeUI]);

  const sceneUrl = SCENES[activeScene].url;
  const nextScene = () => setActiveScene((prev) => (prev + 1) % SCENES.length);
  const prevScene = () => setActiveScene((prev) => (prev - 1 + SCENES.length) % SCENES.length);
  const handleParamChange = (key: string, value: number | string) => setParams(prev => ({ ...prev, [key]: value }));

  const handleAlgoTypeSwitch = (type: AlgorithmType) => {
    setAlgoType(type);
    setAlgorithm(ALGORITHMS[type][0].id as GlassAlgorithm);
  };

  const handleAlgorithmSwitch = (algo: string) => {
    setAlgorithm(algo as GlassAlgorithm);
  };

  const isLightBackground = activeScene === 0;
  const textColor = isLightBackground ? 'text-black' : 'text-white';
  const textColorMuted = isLightBackground ? 'text-black/40' : 'text-white/40';
  const navActive = isNavMoving || isNavPressed;

  // Unified params for the glass component
  const glassParams: GlassParams = {
    ...params,
    radius: params.radius,
    blur: params.blur,
    thickness: params.glassThickness,
    edgeWidth: params.bezelWidth,
    ior: params.refractiveIndex,
    specularOpacity: params.specularOpacity,
    specularHardness: params.specularHardness,
    specularAngle: params.specularAngle,
    dynamicSpecular: params.dynamicSpecular,
    backdropSaturation: params.refractionSaturation,
    displacementScale: params.displacementScale,
    tintColor: params.tintColor,
    tintOpacity: params.tintOpacity,
    refractionHeight: params.refractionHeight,
    chromaticAberration: params.chromaticAberration,
    vibrancy: params.vibrancy,
    tintAmount: params.tintAmount,
  };

  // Per-algorithm accent colors
  const algoAccent: Record<string, string> = {
    liunian: '#6366f1',
    deepika: '#8b5cf6',
    kyant: '#3b82f6',
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-white/20 overflow-hidden flex flex-col font-sans antialiased">
      {/* Background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={sceneUrl}
          initial={{ filter: 'blur(10px)', opacity: 0.1, scale: 1.02 }}
          animate={{ filter: 'blur(0px)', opacity: 1, scale: 1 }}
          exit={{ filter: 'blur(20px)', opacity: 0, scale: 1.05 }}
          transition={{ duration: 1.0, ease: 'easeInOut' }}
          className="absolute inset-0 z-0"
        >
          <img src={sceneUrl} alt="Background" className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* ── Top Bar ───────────────────────────────────────── */}
      <header className="relative z-50 w-full px-4 md:px-6 py-3 md:py-4 flex justify-between items-center bg-transparent">
        <div className="flex items-center gap-3 md:gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
            <UnifiedGlass
              id="logo-glass" width={30} height={30} sceneUrl={sceneUrl} algorithm={algorithm}
              params={{ ...glassParams, bezelWidth: 10, blur: 0, radius: 15, tintOpacity: 0 }}
            >
              <div className="w-full h-full flex items-center justify-center group-hover:bg-white/10 transition-all">
                <Droplets className="w-4 h-4 text-blue-400" />
              </div>
            </UnifiedGlass>
            <span className={`text-lg font-black tracking-[-0.03em] ${textColor} transition-colors`}>LiquidGlass</span>
            <span className="text-[9px] font-mono text-white/20 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">v2.0</span>
          </div>

          {/* Algorithm Switcher */}
          <div className="flex items-center gap-1 bg-white/[0.04] backdrop-blur-sm rounded-full border border-white/[0.08] p-0.5">
            {/* Type tabs */}
            {(['svg', 'webgl'] as AlgorithmType[]).map((type) => (
              <button
                key={type}
                onClick={() => handleAlgoTypeSwitch(type)}
                className={`relative px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
                  algoType === type ? 'text-white' : 'text-white/30 hover:text-white/50'
                }`}
              >
                {algoType === type && (
                  <motion.div
                    layoutId="algo-type-bg"
                    className="absolute inset-0 bg-white/10 rounded-full border border-white/10"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{type === 'svg' ? 'SVG' : 'WebGL'}</span>
              </button>
            ))}
            {/* Divider */}
            <div className="w-px h-4 bg-white/10 mx-1" />
            {/* Specific algorithm */}
            {ALGORITHMS[algoType].map((algo) => (
              <button
                key={algo.id}
                onClick={() => handleAlgorithmSwitch(algo.id)}
                className={`relative px-2.5 py-1 rounded-full text-[10px] font-bold tracking-tight transition-all ${
                  algorithm === algo.id ? 'text-white' : 'text-white/25 hover:text-white/50'
                }`}
              >
                {algorithm === algo.id && (
                  <motion.div
                    layoutId="algo-indicator"
                    className="absolute inset-0 rounded-full"
                    style={{ background: `${algoAccent[algo.id] || '#3b82f6'}30`, border: `1px solid ${algoAccent[algo.id] || '#3b82f6'}50` }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{algo.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: status + settings */}
        <div className="flex items-center gap-3">
          <div className={`hidden sm:flex items-center gap-4 font-medium text-sm ${textColorMuted}`}>
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] ${isLightBackground ? 'bg-black/5 border-black/5' : 'bg-white/5 border-white/5'}`}>
              <span>88%</span>
              <Battery className="w-4 h-4" />
            </div>
          </div>
          <button
            onClick={() => setIsControlsOpen(!isControlsOpen)}
            className={`w-8 h-8 flex items-center justify-center rounded-full border transition-all shadow-lg ${isLightBackground ? 'bg-black/5 border-black/10 hover:bg-black/10' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
          >
            <Settings2 className={`w-3.5 h-3.5 transition-all duration-500 ${isControlsOpen ? 'rotate-90' : ''} ${isLightBackground ? 'text-black/60' : 'text-white/60'}`} />
          </button>
        </div>
      </header>

      {/* ── Nav Pill ───────────────────────────────────────── */}
      <div className="relative z-40 w-full flex justify-center px-4 pt-2 pb-4">
        <UnifiedGlass
          id="nav-pill" width="auto" height={36} sceneUrl={sceneUrl} algorithm={algorithm} overflowVisible
          params={{ ...glassParams, blur: 16, glassThickness: 20, bezelWidth: 8, radius: 18, tintOpacity: 0.15, tintColor: '#ffffff' }}
        >
          <nav
            className="flex items-center px-1 py-0.5 h-full relative overflow-visible"
            onMouseDown={() => setIsNavPressed(true)}
            onMouseUp={() => setIsNavPressed(false)}
            onMouseLeave={() => setIsNavPressed(false)}
          >
            {UI_SCENARIOS.map((ui) => (
              <button
                key={ui.id}
                onClick={() => setActiveUI(ui.id)}
                className={`relative flex items-center justify-center gap-1.5 px-3.5 h-full rounded-full transition-all duration-300 ${activeUI === ui.id ? textColor : textColorMuted}`}
              >
                {activeUI === ui.id && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute z-0 pointer-events-none"
                    initial={false}
                    animate={{
                      top: navActive ? -8 : 2,
                      bottom: navActive ? -8 : 2,
                      left: navActive ? -16 : 0,
                      right: navActive ? -16 : 0,
                      scale: navActive ? 1.04 : 1,
                    }}
                    transition={{ type: 'spring', stiffness: 1800, damping: 80, mass: 1 }}
                  >
                    <div
                      className="w-full h-full rounded-full"
                      style={{
                        background: navActive ? 'rgba(255,255,255,0.08)' : 'rgba(220,222,225,0.95)',
                        boxShadow: navActive ? '0 4px 16px rgba(0,0,0,0.06)' : '0 1px 2px rgba(0,0,0,0.04)',
                        borderRadius: navActive ? 24 : 18,
                      }}
                    />
                  </motion.div>
                )}
                <div className={`relative z-10 flex items-center gap-1.5 text-[11px] font-bold tracking-tight ${activeUI === ui.id ? textColor : textColorMuted}`}>
                  <span className="scale-90">{ui.icon}</span>
                  <span className="whitespace-nowrap">{ui.name}</span>
                </div>
              </button>
            ))}
          </nav>
        </UnifiedGlass>
      </div>

      {/* ── Main Content ───────────────────────────────────── */}
      <main className="flex-1 relative z-10 flex flex-col items-center justify-center px-6">
        <div className="w-full flex flex-col items-center justify-center">
          {/* Scene switcher */}
          <div className="flex items-center gap-6 mb-10">
            <button onClick={prevScene} className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all group shadow-xl">
              <ChevronLeft className="w-4 h-4 text-white/30 group-hover:text-white" />
            </button>
            <div className="text-center">
              <motion.h2
                key={SCENES[activeScene].name}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-4xl md:text-5xl font-black tracking-tight mb-2"
              >
                {SCENES[activeScene].name}
              </motion.h2>
              <div className="flex items-center justify-center gap-3">
                <p className="text-white/30 uppercase tracking-[0.3em] text-[9px] font-bold">Refraction Engine v2.0</p>
                <span className="text-white/10">·</span>
                <p className="text-white/30 text-[9px] font-mono">
                  {algoType === 'svg' ? 'SVG' : 'WebGL'} / {algorithm}
                </p>
              </div>
            </div>
            <button onClick={nextScene} className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all group shadow-xl">
              <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white" />
            </button>
          </div>

          {/* UI Demo Area */}
          <div className="relative w-full flex items-center justify-center min-h-[420px]">
            <AnimatePresence mode="wait">
              {/* ── Music Player ────────────────────────────── */}
              {activeUI === 'player' && (
                <motion.div key={`player-${algorithm}`} initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }} transition={{ type: 'spring', damping: 25 }} className="w-full flex justify-center px-8">
                  <UnifiedGlass
                    id="player-glass" width="100%" maxWidth={860} height={76} sceneUrl={sceneUrl} algorithm={algorithm}
                    params={{ ...glassParams, radius: 38, bezelWidth: 28, glassThickness: 80, refractiveIndex: 1.3 }}
                  >
                    <div className="flex items-center px-7 h-full justify-between gap-10">
                      <div className="flex items-center gap-5">
                        <div className="text-white/20 hover:text-white transition-colors cursor-pointer"><Settings2 className="w-3.5 h-3.5" /></div>
                        <div className="text-white/70 hover:text-white hover:scale-110 transition-all cursor-pointer"><CustomPrevIcon className="w-4 h-4 fill-current" /></div>
                        <button onClick={() => setIsPlaying(!isPlaying)} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all border border-white/5">
                          {isPlaying ? <CustomPauseIcon className="w-4 h-4 fill-current" /> : <CustomPlayIcon className="w-4 h-4 fill-current ml-0.5" />}
                        </button>
                        <div className="text-white/70 hover:text-white hover:scale-110 transition-all cursor-pointer"><CustomNextIcon className="w-4 h-4 fill-current" /></div>
                        <div className="text-white/20 hover:text-white transition-colors cursor-pointer"><RefreshCw className="w-3.5 h-3.5" /></div>
                      </div>
                      <div className="flex-1 flex items-center gap-5 min-w-0">
                        <div className="w-11 h-11 rounded-lg bg-white/10 overflow-hidden border border-white/10 shadow-lg flex-shrink-0">
                          <img src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=200" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                          <div className="flex justify-between items-end">
                            <div className="truncate pr-4">
                              <span className="text-[13px] font-bold text-white mr-2">Midnight City</span>
                              <span className="text-[10px] text-white/30 font-medium">M83</span>
                            </div>
                            <span className="text-[9px] font-mono text-white/20 tabular-nums">02:44 / 04:03</span>
                          </div>
                          <div className="h-[3px] bg-white/5 rounded-full overflow-hidden relative">
                            <div className="absolute inset-y-0 left-0 bg-white/40 w-[63%] rounded-full shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-5">
                        <div className="text-white/20 hover:text-white hover:scale-110 transition-all cursor-pointer"><MoreHorizontal className="w-4 h-4" /></div>
                        <div className="text-white/20 hover:text-white hover:scale-110 transition-all cursor-pointer"><ListMusic className="w-4 h-4" /></div>
                        <div className="text-white/20 hover:text-white hover:scale-110 transition-all cursor-pointer"><Volume2 className="w-4 h-4" /></div>
                      </div>
                    </div>
                  </UnifiedGlass>
                </motion.div>
              )}

              {/* ── Slider ─────────────────────────────────── */}
              {activeUI === 'slider' && (
                <motion.div key={`slider-${algorithm}`} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full flex flex-col items-center gap-5">
                  <UnifiedGlass
                    id="slider-1" width={320} height={56} sceneUrl={sceneUrl} algorithm={algorithm}
                    params={{ ...glassParams, radius: 28, bezelWidth: 16, glassThickness: 80, refractiveIndex: 1.45 }}
                  >
                    <div className="w-full h-full flex items-center px-4 gap-4">
                      <div className="flex-1 h-[12px] bg-white/10 rounded-full overflow-hidden relative cursor-pointer">
                        <div className="absolute inset-y-0 left-0 bg-blue-500/80 rounded-full" style={{ width: '45%' }} />
                      </div>
                      <div className="text-[11px] font-mono text-white/50 tabular-nums w-8 text-right">45%</div>
                    </div>
                  </UnifiedGlass>
                  <UnifiedGlass
                    id="slider-2" width={320} height={56} sceneUrl={sceneUrl} algorithm={algorithm}
                    params={{ ...glassParams, radius: 28, bezelWidth: 20, glassThickness: 100, refractiveIndex: 1.5 }}
                  >
                    <div className="w-full h-full flex items-center px-4 gap-4">
                      <div className="flex-1 h-[12px] bg-white/10 rounded-full overflow-hidden relative cursor-pointer">
                        <div className="absolute inset-y-0 left-0 bg-purple-500/80 rounded-full" style={{ width: '72%' }} />
                      </div>
                      <div className="text-[11px] font-mono text-white/50 tabular-nums w-8 text-right">72%</div>
                    </div>
                  </UnifiedGlass>
                  <p className="text-[10px] text-white/15">Glass Slider · {algorithm.toUpperCase()}</p>
                </motion.div>
              )}

              {/* ── Switch ─────────────────────────────────── */}
              {activeUI === 'switch' && (
                <motion.div key={`switch-${algorithm}`} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full flex flex-col items-center gap-6">
                  <div className="flex items-center gap-6">
                    <UnifiedGlass
                      id="switch-off" width={150} height={62} sceneUrl={sceneUrl} algorithm={algorithm}
                      params={{ ...glassParams, radius: 31, bezelWidth: 18, glassThickness: 47, refractiveIndex: 1.5 }}
                    >
                      <div className="w-full h-full flex items-center px-2">
                        <div className="w-[48px] h-[48px] rounded-full bg-white/20 shadow-lg cursor-pointer transition-all" />
                      </div>
                    </UnifiedGlass>
                    <UnifiedGlass
                      id="switch-on" width={150} height={62} sceneUrl={sceneUrl} algorithm={algorithm}
                      params={{ ...glassParams, radius: 31, bezelWidth: 18, glassThickness: 47, refractiveIndex: 1.5 }}
                    >
                      <div className="w-full h-full flex items-center justify-end px-2">
                        <div className="w-[48px] h-[48px] rounded-full bg-emerald-500/60 shadow-lg cursor-pointer transition-all" />
                      </div>
                    </UnifiedGlass>
                  </div>
                  <p className="text-[10px] text-white/15">Glass Switch · {algorithm.toUpperCase()}</p>
                </motion.div>
              )}

              {/* ── Search ─────────────────────────────────── */}
              {activeUI === 'search' && (
                <motion.div key={`search-${algorithm}`} initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -30, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}>
                  <UnifiedGlass id="search-glass" width={620} height={60} sceneUrl={sceneUrl} algorithm={algorithm} params={{ ...glassParams, radius: 30 }}>
                    <div className="flex items-center px-5 h-full gap-4">
                      <Search className="w-5 h-5 text-white/60" />
                      <input type="text" placeholder="搜索内容..." className="bg-transparent border-none outline-none text-lg w-full placeholder:text-white/40 font-semibold tracking-tight" autoFocus />
                    </div>
                  </UnifiedGlass>
                </motion.div>
              )}

              {/* ── Control Center ─────────────────────────── */}
              {activeUI === 'control' && (
                <motion.div key={`control-${algorithm}`} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                  <ControlCenter sceneUrl={sceneUrl} params={glassParams} />
                </motion.div>
              )}

              {/* ── Playground ─────────────────────────────── */}
              {activeUI === 'playground' && (
                <motion.div key={`pg-${algorithm}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative w-full h-[550px] flex items-center justify-center pointer-events-none">
                  <div className="absolute inset-0 flex items-center justify-center gap-10 overflow-visible">
                    <motion.div drag dragMomentum={false} className="pointer-events-auto cursor-move" onDrag={() => window.dispatchEvent(new Event('scroll'))}>
                      <UnifiedGlass id="pg-rect" width={params.pgWidth} height={params.pgHeight} sceneUrl={sceneUrl} algorithm={algorithm} params={glassParams}>
                        <div className="h-full flex flex-col items-center justify-center p-5 text-center">
                          <Sparkles className="w-7 h-7 text-blue-400 mb-2" />
                          <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">液态交互实验室</div>
                          <div className="text-[9px] text-white/20">拖动组件 & 调整尺寸</div>
                        </div>
                      </UnifiedGlass>
                    </motion.div>
                    <motion.div drag dragMomentum={false} className="pointer-events-auto cursor-move translate-y-16" onDrag={() => window.dispatchEvent(new Event('scroll'))}>
                      <UnifiedGlass id="pg-circle" width={params.pgCircleSize} height={params.pgCircleSize} sceneUrl={sceneUrl} algorithm={algorithm} params={{ ...glassParams, radius: params.pgCircleSize / 2 }}>
                        <div className="h-full flex items-center justify-center text-white/40 font-bold uppercase tracking-widest text-[9px]">物理球体</div>
                      </UnifiedGlass>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* ── Controls Panel (iOS 26 Liquid Glass) ───────────── */}
      <AnimatePresence>
        {isControlsOpen && (
          <motion.div
            initial={{ x: 340, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 340, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-[200]"
          >
            <div className="w-[300px] bg-[#0c0c0e]/90 backdrop-blur-xl rounded-[18px] border border-white/[0.08] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.7)] max-h-[85vh] overflow-y-auto custom-scrollbar">
              {/* Panel Header */}
              <div className="sticky top-0 z-20 flex items-center justify-between px-5 pt-4 pb-3 bg-gradient-to-b from-[#0c0c0e] via-[#0c0c0e] to-transparent">
                <div className="flex items-center gap-2">
                  <Layers className="w-3 h-3 text-white/25" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Parameters</span>
                  <span className="text-[9px] font-mono text-white/15 bg-white/[0.04] px-1.5 py-0.5 rounded ml-1">{algorithm}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setParams(prev => ({
                      ...prev,
                      radius: DEFAULT_GLASS_PARAMS.radius,
                      blur: DEFAULT_GLASS_PARAMS.blur,
                      refractiveIndex: DEFAULT_GLASS_PARAMS.ior,
                      refractionSaturation: DEFAULT_GLASS_PARAMS.backdropSaturation,
                      glassThickness: DEFAULT_GLASS_PARAMS.thickness,
                      bezelWidth: DEFAULT_GLASS_PARAMS.edgeWidth,
                      specularOpacity: DEFAULT_GLASS_PARAMS.specularOpacity,
                      specularHardness: DEFAULT_GLASS_PARAMS.specularHardness,
                      refractionHeight: 15,
                      chromaticAberration: 3,
                    }))}
                    className="text-[9px] text-white/20 hover:text-white/50 transition-colors px-1.5 py-0.5 rounded hover:bg-white/5"
                  >
                    Reset
                  </button>
                  <button onClick={() => setIsControlsOpen(false)} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/5 transition-all">
                    <ChevronRight className="w-3 h-3 text-white/25" />
                  </button>
                </div>
              </div>

              <div className="px-5 pb-6 space-y-5">
                {/* ── Optics ──────────────────────────────── */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1 pb-1 border-b border-white/[0.04]">
                    <Droplets className="w-3 h-3 text-white/20" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/20">Optics</span>
                  </div>
                  <AppleSlider label="折射率 IOR" value={params.refractiveIndex} min={1} max={3} step={0.01} onChange={(v) => handleParamChange('refractiveIndex', v)} accentColor={algoAccent[algorithm]} />
                  <AppleSlider label="模糊等级" value={params.blur} min={0} max={20} step={0.5} onChange={(v) => handleParamChange('blur', v)} accentColor={algoAccent[algorithm]} />
                  <AppleSlider label="折射饱和度" value={params.refractionSaturation} min={0} max={3} step={0.1} onChange={(v) => handleParamChange('refractionSaturation', v)} accentColor={algoAccent[algorithm]} />
                </div>

                {/* ── Geometry ────────────────────────────── */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1 pb-1 border-b border-white/[0.04]">
                    <Maximize2 className="w-3 h-3 text-white/20" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/20">Geometry</span>
                  </div>
                  <AppleSlider label="玻璃厚度" value={params.glassThickness} min={0} max={150} onChange={(v) => handleParamChange('glassThickness', v)} accentColor={algoAccent[algorithm]} />
                  <AppleSlider label="边缘倒角" value={params.bezelWidth} min={0} max={40} onChange={(v) => handleParamChange('bezelWidth', v)} accentColor={algoAccent[algorithm]} />
                  <AppleSlider label="圆角半径" value={params.radius} min={0} max={100} onChange={(v) => handleParamChange('radius', v)} accentColor={algoAccent[algorithm]} />
                </div>

                {/* ── Aesthetics ──────────────────────────── */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1 pb-1 border-b border-white/[0.04]">
                    <Sparkles className="w-3 h-3 text-white/20" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/20">Aesthetics</span>
                  </div>
                  <AppleSlider label="镜面透明度" value={params.specularOpacity} min={0} max={1} step={0.05} onChange={(v) => handleParamChange('specularOpacity', v)} accentColor={algoAccent[algorithm]} />
                  <AppleSlider label="镜面硬度" value={params.specularHardness} min={1} max={10} step={1} onChange={(v) => handleParamChange('specularHardness', v)} accentColor={algoAccent[algorithm]} />

                  {/* Dynamic specular toggle */}
                  <div className="flex justify-between items-center px-1 pt-1">
                    <span className="text-[10px] font-medium text-white/25">动态高光跟随</span>
                    <button
                      onClick={() => handleParamChange('dynamicSpecular', params.dynamicSpecular ? 0 : 1)}
                      className={`w-8 h-[16px] rounded-full transition-all relative ${params.dynamicSpecular ? 'bg-white/20' : 'bg-white/[0.06]'}`}
                    >
                      <div className={`absolute top-[2px] w-[12px] h-[12px] rounded-full bg-white/80 shadow transition-transform ${params.dynamicSpecular ? 'translate-x-[16px]' : 'translate-x-[2px]'}`} />
                    </button>
                  </div>

                  {/* Tint overlay */}
                  <div className="flex justify-between items-center px-1 pt-1">
                    <span className="text-[10px] font-medium text-white/25">蒙层色彩</span>
                    <input type="color" value={params.tintColor} onChange={(e) => handleParamChange('tintColor', e.target.value)} className="w-6 h-6 rounded-md bg-transparent border border-white/[0.08] cursor-pointer" />
                  </div>
                  <AppleSlider label="蒙层透明度" value={params.tintOpacity} min={0} max={1} step={0.01} onChange={(v) => handleParamChange('tintOpacity', v)} accentColor={algoAccent[algorithm]} />
                </div>

                {/* ── WebGL-specific ──────────────────────── */}
                {algoType === 'webgl' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1 pb-1 border-b border-white/[0.04]">
                      <Cpu className="w-3 h-3 text-white/20" />
                      <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/20">WebGL</span>
                    </div>
                    <AppleSlider label="折射强度" value={params.refractionHeight} min={0} max={50} step={0.5} onChange={(v) => handleParamChange('refractionHeight', v)} accentColor={algoAccent[algorithm]} />
                    <AppleSlider label="色散" value={params.chromaticAberration} min={0} max={15} step={0.5} onChange={(v) => handleParamChange('chromaticAberration', v)} accentColor={algoAccent[algorithm]} />
                    <AppleSlider label="鲜艳度" value={params.vibrancy} min={0} max={2} step={0.05} onChange={(v) => handleParamChange('vibrancy', v)} accentColor={algoAccent[algorithm]} />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
