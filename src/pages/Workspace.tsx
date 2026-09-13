import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Settings2, Droplets, ChevronRight, ChevronLeft,
  Wifi, Battery, Signal, Sparkles, Play,
  ListMusic, Airplay, Volume2, MoreHorizontal, RefreshCw,
  Maximize2, Clock, Sliders, ToggleLeft,
} from 'lucide-react';
import { GlassComponent, ControlSlider } from '../components/SharedUI';
import { ControlCenter } from '../components/ControlCenter';
import { SCENES, DEFAULT_GLASS_PARAMS } from '../constants';
import {
  CustomPlayIcon, CustomPauseIcon, CustomPrevIcon, CustomNextIcon,
} from '../components/NavIcons';

const UI_SCENARIOS = [
  { id: 'player', name: '音乐播放', icon: <Play className="w-3.5 h-3.5" /> },
  { id: 'search', name: '搜索框', icon: <Search className="w-3.5 h-3.5" /> },
  { id: 'slider', name: '滑块', icon: <Sliders className="w-3.5 h-3.5" /> },
  { id: 'switch', name: '开关', icon: <ToggleLeft className="w-3.5 h-3.5" /> },
  { id: 'playground', name: '实验室', icon: <Sparkles className="w-3.5 h-3.5" /> },
];

export function Workspace() {
  const navigate = useNavigate();
  const [activeScene, setActiveScene] = useState(0);
  const [activeUI, setActiveUI] = useState('player');
  const [params, setParams] = useState({
    // Use old alias keys — these match what the UI sliders read/write
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

  const isLightBackground = activeScene === 0;
  const sceneUrl = SCENES[activeScene].url;
  const nextScene = () => setActiveScene((prev) => (prev + 1) % SCENES.length);
  const prevScene = () => setActiveScene((prev) => (prev - 1 + SCENES.length) % SCENES.length);
  const handleParamChange = (key: string, value: number | string) => setParams(prev => ({ ...prev, [key]: value }));

  const textColor = isLightBackground ? 'text-black' : 'text-white';
  const textColorMuted = isLightBackground ? 'text-black/40' : 'text-white/40';
  const navActive = isNavMoving || isNavPressed;

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
        </motion.div>
      </AnimatePresence>

      {/* Top bar */}
      <header className="relative z-50 w-full px-6 md:px-8 py-4 md:py-6 flex justify-between items-center bg-transparent">
        <div className="flex items-center gap-4 md:gap-10">
          {/* Logo */}
          <div className="flex items-center gap-2.5 md:gap-3 group cursor-pointer" onClick={() => navigate('/')}>
            <GlassComponent
              id="logo-glass" width={32} height={32} sceneUrl={sceneUrl}
              params={{ ...params, bezelWidth: 10, scaleRatio: 0.3, blur: 0, radius: 16, tintOpacity: 0 }}
            >
              <div className="w-full h-full flex items-center justify-center group-hover:bg-white/10 transition-all">
                <Droplets className="w-5 h-5 text-blue-400" />
              </div>
            </GlassComponent>
            <span className={`text-xl font-black tracking-[-0.03em] font-heading transition-colors ${textColor}`}>LiquidGlass</span>
          </div>

          {/* Nav pill */}
          <GlassComponent
            id="nav-pill" width="auto" height={38} sceneUrl={sceneUrl} overflowVisible
            params={{ ...params, blur: 16, glassThickness: 20, bezelWidth: 8, refractiveIndex: 1.05, radius: 19, tintOpacity: 0.2, tintColor: '#ffffff' }}
          >
            <nav
              className="flex items-center px-1.5 py-0.5 h-full relative overflow-visible"
              onMouseDown={() => setIsNavPressed(true)}
              onMouseUp={() => setIsNavPressed(false)}
              onMouseLeave={() => setIsNavPressed(false)}
            >
              {UI_SCENARIOS.map((ui) => (
                <button
                  key={ui.id}
                  onClick={() => setActiveUI(ui.id)}
                  className={`relative flex items-center justify-center gap-2 px-5 h-full rounded-full transition-all duration-300 ${activeUI === ui.id ? textColor : textColorMuted + ' hover:' + (isLightBackground ? 'text-black' : 'text-white')}`}
                >
                  {activeUI === ui.id && (
                    <motion.div
                      layoutId="nav-pill-indicator"
                      className="absolute z-0 pointer-events-none"
                      initial={false}
                      animate={{
                        top: navActive ? -10 : 2,
                        bottom: navActive ? -10 : 2,
                        left: navActive ? -24 : 0,
                        right: navActive ? -24 : 0,
                        scale: navActive ? 1.05 : 1,
                        opacity: 1,
                      }}
                      transition={{ type: 'spring', stiffness: 1800, damping: 80, mass: 1 }}
                    >
                      <GlassComponent
                        id="nav-active-indicator" width="100%" height="100%" sceneUrl={sceneUrl}
                        params={{
                          ...params,
                          glassThickness: navActive ? 60 : 0,
                          bezelWidth: navActive ? 12 : 0,
                          refractiveIndex: navActive ? 1.5 : 1.0,
                          blur: 0,
                          specularOpacity: navActive ? 0.3 : 0,
                          specularHardness: 2,
                          refractionSaturation: 1.2,
                          radius: navActive ? 28 : 19,
                          tintOpacity: 0,
                        }}
                      >
                        <motion.div
                          className="w-full h-full"
                          animate={{
                            backgroundColor: navActive ? 'rgba(255,255,255,0.05)' : 'rgba(220,222,225,0.98)',
                            boxShadow: navActive ? '0 4px 20px rgba(0,0,0,0.06)' : '0 1px 2px rgba(0,0,0,0.04)',
                          }}
                          style={{ borderRadius: navActive ? 28 : 19 }}
                        />
                      </GlassComponent>
                    </motion.div>
                  )}
                  <div className={`relative z-10 flex items-center gap-2 text-[12px] font-bold tracking-tight ${activeUI === ui.id ? textColor : textColorMuted}`}>
                    <span className="scale-90">{ui.icon}</span>
                    <span className="whitespace-nowrap">{ui.name}</span>
                  </div>
                </button>
              ))}
            </nav>
          </GlassComponent>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-4 md:gap-8">
          <div className={`hidden sm:flex items-center gap-5 font-medium text-sm transition-colors ${textColorMuted}`}>
            <Signal className="w-4 h-4" />
            <Wifi className="w-4 h-4" />
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${isLightBackground ? 'bg-black/5 border-black/5' : 'bg-white/5 border-white/5'}`}>
              <span className="text-[11px]">88%</span>
              <Battery className="w-5 h-5" />
            </div>
          </div>
          <button
            onClick={() => setIsControlsOpen(!isControlsOpen)}
            className={`w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full border transition-all shadow-lg overflow-hidden group/btn ${isLightBackground ? 'bg-black/5 border-black/10 hover:bg-black/10' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
          >
            <Settings2 className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-all duration-500 group-hover/btn:rotate-90 ${isLightBackground ? 'text-black/60' : 'text-white/60'}`} />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 relative z-10 flex flex-col items-center justify-center px-8">
        <div className="w-full flex flex-col items-center justify-center">
          {/* Scene switcher */}
          <div className="flex items-center gap-8 mb-16">
            <button onClick={prevScene} className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all group shadow-xl">
              <ChevronLeft className="w-5 h-5 text-white/30 group-hover:text-white" />
            </button>
            <div className="text-center">
              <motion.h2
                key={SCENES[activeScene].name}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-6xl font-black tracking-tight mb-4 font-heading"
              >
                {SCENES[activeScene].name}
              </motion.h2>
              <p className="text-white/40 uppercase tracking-[0.5em] text-[10px] font-extrabold font-heading">Refraction Engine v1.2</p>
            </div>
            <button onClick={nextScene} className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all group shadow-xl">
              <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white" />
            </button>
          </div>

          {/* UI scenarios */}
          <div className="relative w-full flex items-center justify-center min-h-[450px]">
            <AnimatePresence mode="wait">
              {activeUI === 'player' && (
                <motion.div key="player-ui" initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }} className="w-full flex justify-center px-8">
                  <GlassComponent
                    id="player-glass" width="100%" maxWidth={880} height={76} sceneUrl={sceneUrl}
                    params={{ ...params, radius: 38, bezelWidth: 28, glassThickness: 80, refractiveIndex: 1.3 }}
                  >
                    <div className="flex items-center px-8 h-full justify-between gap-12">
                      <div className="flex items-center gap-6">
                        <div className="text-white/20 hover:text-white transition-colors cursor-pointer"><Settings2 className="w-4 h-4" /></div>
                        <div className="text-white/70 hover:text-white hover:scale-110 transition-all cursor-pointer"><CustomPrevIcon className="w-5 h-5 fill-current" /></div>
                        <button onClick={() => setIsPlaying(!isPlaying)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all border border-white/5">
                          {isPlaying ? <CustomPauseIcon className="w-5 h-5 fill-current" /> : <CustomPlayIcon className="w-5 h-5 fill-current ml-0.5" />}
                        </button>
                        <div className="text-white/70 hover:text-white hover:scale-110 transition-all cursor-pointer"><CustomNextIcon className="w-5 h-5 fill-current" /></div>
                        <div className="text-white/20 hover:text-white transition-colors cursor-pointer"><RefreshCw className="w-4 h-4" /></div>
                      </div>
                      <div className="flex-1 flex items-center gap-6 min-w-0">
                        <div className="w-12 h-12 rounded-lg bg-white/10 overflow-hidden border border-white/10 shadow-lg flex-shrink-0">
                          <img src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=200" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col gap-2">
                          <div className="flex justify-between items-end">
                            <div className="truncate pr-4">
                              <span className="text-[14px] font-bold text-white mr-2">Midnight City</span>
                              <span className="text-[10px] text-white/30 font-medium">M83</span>
                            </div>
                            <span className="text-[9px] font-mono text-white/20 tabular-nums">02:44 / 04:03</span>
                          </div>
                          <div className="h-[3px] bg-white/5 rounded-full overflow-hidden relative">
                            <div className="absolute inset-y-0 left-0 bg-white/40 w-[63%] rounded-full shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-white/20 hover:text-white hover:scale-110 transition-all cursor-pointer"><MoreHorizontal className="w-5 h-5" /></div>
                        <div className="text-white/20 hover:text-white hover:scale-110 transition-all cursor-pointer"><ListMusic className="w-5 h-5" /></div>
                        <div className="text-white/20 hover:text-white hover:scale-110 transition-all cursor-pointer"><Airplay className="w-4 h-4" /></div>
                        <div className="text-white/20 hover:text-white hover:scale-110 transition-all cursor-pointer"><Volume2 className="w-5 h-5" /></div>
                      </div>
                    </div>
                  </GlassComponent>
                </motion.div>
              )}

              {activeUI === 'control' && <ControlCenter sceneUrl={sceneUrl} params={params} />}

              {activeUI === 'slider' && (
                <motion.div key="slider-ui" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full flex flex-col items-center gap-6">
                  {/* Glass slider — from original slider.txt */}
                  <GlassComponent
                    id="slider-demo"
                    width={330}
                    height={60}
                    sceneUrl={sceneUrl}
                    params={{ ...params, radius: 30, bezelWidth: 16, glassThickness: 80, refractiveIndex: 1.45 }}
                  >
                    <div className="w-full h-full flex items-center px-4 gap-4">
                      <div className="flex-1 h-[14px] bg-white/10 rounded-full overflow-hidden relative cursor-pointer">
                        <div className="absolute inset-y-0 left-0 bg-blue-500/80 rounded-full" style={{ width: '45%' }} />
                      </div>
                      <div className="text-[11px] font-mono text-white/50 tabular-nums w-8 text-right">45%</div>
                    </div>
                  </GlassComponent>
                  <p className="text-[11px] text-white/20">拖拽玻璃滑块查看折射效果 · 原始 Slider Demo</p>

                  {/* Second slider variant */}
                  <GlassComponent
                    id="slider-demo-2"
                    width={330}
                    height={60}
                    sceneUrl={sceneUrl}
                    params={{ ...params, radius: 30, bezelWidth: 20, glassThickness: 100, refractiveIndex: 1.5 }}
                  >
                    <div className="w-full h-full flex items-center px-4 gap-4">
                      <div className="flex-1 h-[14px] bg-white/10 rounded-full overflow-hidden relative cursor-pointer">
                        <div className="absolute inset-y-0 left-0 bg-purple-500/80 rounded-full" style={{ width: '72%' }} />
                      </div>
                      <div className="text-[11px] font-mono text-white/50 tabular-nums w-8 text-right">72%</div>
                    </div>
                  </GlassComponent>
                </motion.div>
              )}

              {activeUI === 'switch' && (
                <motion.div key="switch-ui" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full flex flex-col items-center gap-8">
                  {/* Glass switch — from original switch.txt */}
                  <GlassComponent
                    id="switch-demo"
                    width={160}
                    height={67}
                    sceneUrl={sceneUrl}
                    params={{ ...params, radius: 34, bezelWidth: 19, glassThickness: 47, refractiveIndex: 1.5 }}
                  >
                    <div className="w-full h-full flex items-center px-2">
                      <div className="w-[54px] h-[54px] rounded-full bg-white/20 shadow-lg cursor-pointer transition-all" />
                    </div>
                  </GlassComponent>
                  <p className="text-[11px] text-white/20">拖拽玻璃开关 · 原始 Switch Demo</p>

                  {/* Second switch variant — toggled on */}
                  <GlassComponent
                    id="switch-demo-on"
                    width={160}
                    height={67}
                    sceneUrl={sceneUrl}
                    params={{ ...params, radius: 34, bezelWidth: 19, glassThickness: 47, refractiveIndex: 1.5 }}
                  >
                    <div className="w-full h-full flex items-center justify-end px-2">
                      <div className="w-[54px] h-[54px] rounded-full bg-emerald-500/60 shadow-lg cursor-pointer transition-all" />
                    </div>
                  </GlassComponent>
                </motion.div>
              )}

              {activeUI === 'playground' && (
                <motion.div key="playground-ui" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative w-full h-[600px] flex items-center justify-center pointer-events-none">
                  <div className="absolute inset-0 flex items-center justify-center gap-12 overflow-visible">
                    <motion.div drag dragMomentum={false} className="pointer-events-auto cursor-move" onDrag={() => window.dispatchEvent(new Event('scroll'))}>
                      <GlassComponent id="pg-dynamic" width={params.pgWidth} height={params.pgHeight} sceneUrl={sceneUrl} params={params}>
                        <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                          <Sparkles className="w-8 h-8 text-blue-400 mb-3" />
                          <div className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-1">液态交互实验室</div>
                          <div className="text-[10px] text-white/20">拖动组件 & 调整尺寸</div>
                        </div>
                      </GlassComponent>
                    </motion.div>
                    <motion.div drag dragMomentum={false} className="pointer-events-auto cursor-move translate-y-20" onDrag={() => window.dispatchEvent(new Event('scroll'))}>
                      <GlassComponent id="pg-circle-dyn" width={params.pgCircleSize} height={params.pgCircleSize} sceneUrl={sceneUrl} params={{ ...params, radius: params.pgCircleSize / 2 }}>
                        <div className="h-full flex items-center justify-center text-white/40 font-bold uppercase tracking-widest text-[9px]">物理球体</div>
                      </GlassComponent>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {activeUI === 'search' && (
                <motion.div key="search-ui" initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -30, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}>
                  <GlassComponent id="search-glass" width={640} height={64} sceneUrl={sceneUrl} params={{ ...params, radius: 32 }}>
                    <div className="flex items-center px-6 h-full gap-5">
                      <Search className="w-6 h-6 text-white/60" />
                      <input type="text" placeholder="搜索内容..." className="bg-transparent border-none outline-none text-xl w-full placeholder:text-white/40 font-semibold tracking-tight" autoFocus />
                    </div>
                  </GlassComponent>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Controls panel */}
      <AnimatePresence>
        {isControlsOpen && (
          <motion.div initial={{ x: 360, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 360, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="absolute right-6 top-1/2 -translate-y-1/2 z-[200]">
            <div className="w-[320px] bg-[#0c0c0e]/90 backdrop-blur-xl rounded-[16px] border border-white/[0.08] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.7)] max-h-[85vh] overflow-y-auto custom-scrollbar">
              {/* Header */}
              <div className="sticky top-0 z-20 flex items-center justify-between px-6 pt-5 pb-4 bg-gradient-to-b from-[#0c0c0e] via-[#0c0c0e] to-transparent">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">Parameters</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setParams({
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
                      dynamicSpecular: false,
                      pgWidth: 300,
                      pgHeight: 200,
                      pgCircleSize: 200,
                    })}
                    className="text-[10px] text-white/25 hover:text-white/50 transition-colors px-2 py-1 rounded-md hover:bg-white/5"
                  >
                    Reset
                  </button>
                  <button onClick={() => setIsControlsOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/5 transition-all">
                    <ChevronRight className="w-3.5 h-3.5 text-white/30" />
                  </button>
                </div>
              </div>

              <div className="px-6 pb-8 space-y-7">
                {/* 光学 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-1 pb-1 border-b border-white/[0.04]">
                    <Droplets className="w-3 h-3 text-white/20" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/25">光学 Optics</span>
                  </div>
                  <ControlSlider label="折射率 (IOR)" value={params.refractiveIndex} min={1} max={3} step={0.01} onChange={(v) => handleParamChange('refractiveIndex', v)} />
                  <ControlSlider label="折射饱和度" value={params.refractionSaturation} min={0} max={3} step={0.1} onChange={(v) => handleParamChange('refractionSaturation', v)} />
                  <ControlSlider label="模糊等级" value={params.blur} min={0} max={20} step={0.5} onChange={(v) => handleParamChange('blur', v)} />
                </div>

                {/* 几何 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-1 pb-1 border-b border-white/[0.04]">
                    <Maximize2 className="w-3 h-3 text-white/20" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/25">几何 Geometry</span>
                  </div>
                  <ControlSlider label="玻璃厚度" value={params.glassThickness} min={0} max={150} onChange={(v) => handleParamChange('glassThickness', v)} />
                  <ControlSlider label="边缘倒角" value={params.bezelWidth} min={0} max={40} onChange={(v) => handleParamChange('bezelWidth', v)} />
                  <ControlSlider label="物理圆角" value={params.radius} min={0} max={100} onChange={(v) => handleParamChange('radius', v)} />
                </div>

                {/* 美学 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-1 pb-1 border-b border-white/[0.04]">
                    <Sparkles className="w-3 h-3 text-white/20" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/25">美学 Aesthetics</span>
                  </div>
                  <ControlSlider label="镜面反射透明度" value={params.specularOpacity} min={0} max={1} step={0.05} onChange={(v) => handleParamChange('specularOpacity', v)} />
                  <ControlSlider label="镜面饱和度" value={params.specularHardness} min={1} max={10} step={1} onChange={(v) => handleParamChange('specularHardness', v)} />

                  {/* 动态高光 */}
                  <div className="space-y-3 pt-1">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[11px] font-medium text-white/30">动态高光跟随</span>
                      <button
                        onClick={() => handleParamChange('dynamicSpecular', params.dynamicSpecular ? 0 : 1)}
                        className={`w-9 h-[18px] rounded-full transition-all relative ${params.dynamicSpecular ? 'bg-white/20' : 'bg-white/[0.06]'}`}
                      >
                        <div className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white/80 shadow transition-transform ${params.dynamicSpecular ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                      </button>
                    </div>
                    <div className={params.dynamicSpecular ? 'opacity-30 pointer-events-none' : ''}>
                      <ControlSlider
                        label="高光角度"
                        value={Math.round((params.specularAngle / Math.PI) * 180)}
                        min={0} max={360} step={1}
                        onChange={(v) => handleParamChange('specularAngle', (v / 180) * Math.PI)}
                      />
                    </div>
                  </div>

                  {/* 蒙层 */}
                  <div className="pt-2 space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[11px] font-medium text-white/30">蒙层色彩</span>
                      <input type="color" value={params.tintColor} onChange={(e) => handleParamChange('tintColor', e.target.value)} className="w-7 h-7 rounded-md bg-transparent border border-white/[0.08] cursor-pointer" />
                    </div>
                    <ControlSlider label="Tint Opacity" value={params.tintOpacity} min={0} max={1} step={0.01} onChange={(v) => handleParamChange('tintOpacity', v)} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
