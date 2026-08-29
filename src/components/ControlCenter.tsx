import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Airplay, Volume2, Sun, Moon, Bluetooth, Link, Globe,
  Lightbulb, RefreshCw, Battery,
} from 'lucide-react';
import { GlassComponent } from './SharedUI';
import type { GlassParams } from './SharedUI';
import {
  CustomAirplaneIcon, CustomWifiIcon, CustomSignalIcon,
  CustomCameraIcon, CustomMuteIcon, CustomScreenMirrorIcon,
  CustomPrevIcon, CustomNextIcon, CustomPlayIcon, CustomPauseIcon,
} from './NavIcons';

interface ControlCenterProps {
  sceneUrl: string;
  params: GlassParams;
}

export function ControlCenter({ sceneUrl, params }: ControlCenterProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const largeTile = { ...params, radius: 48, bezelWidth: 32 };
  const smallTile = { ...params, radius: 40, bezelWidth: 24 };
  const sliderTile = { ...params, radius: 40, bezelWidth: 32 };
  const focusTile = { ...params, radius: 40, bezelWidth: 28 };

  return (
    <motion.div
      key="control-ui"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="grid grid-cols-4 gap-3 w-[356px] h-[540px] pointer-events-auto"
    >
      {/* Connectivity */}
      <div className="col-span-2 row-span-2">
        <GlassComponent id="ctrl-conn" width={172} height={172} sceneUrl={sceneUrl} params={largeTile}>
          <div className="p-4 grid grid-cols-2 gap-3 h-full">
            <div className="w-full aspect-square rounded-full bg-white/10 text-white flex items-center justify-center shadow-lg hover:bg-white/20 transition-all cursor-pointer">
              <CustomAirplaneIcon className="w-8 h-8" />
            </div>
            <div className="w-full aspect-square rounded-full bg-white/10 text-white flex items-center justify-center shadow-lg hover:bg-white/20 transition-all cursor-pointer">
              <Airplay className="w-8 h-8" />
            </div>
            <div className="w-full aspect-square rounded-full bg-blue-500 text-white flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:bg-blue-400 transition-all cursor-pointer">
              <CustomWifiIcon className="w-8 h-8" />
            </div>
            <div className="w-full aspect-square rounded-2xl bg-white/5 p-2 grid grid-cols-2 gap-1 cursor-pointer hover:bg-white/10 transition-all">
              <div className="rounded-full bg-green-500 flex items-center justify-center"><CustomSignalIcon className="w-4 h-4" /></div>
              <div className="rounded-full bg-blue-600 flex items-center justify-center"><Bluetooth className="w-4 h-4 text-white" /></div>
              <div className="rounded-full bg-white/20 flex items-center justify-center"><Link className="w-4 h-4 text-white" /></div>
              <div className="rounded-full bg-white/20 flex items-center justify-center"><Globe className="w-4 h-4 text-white" /></div>
            </div>
          </div>
        </GlassComponent>
      </div>

      {/* Media player */}
      <div className="col-span-2 row-span-2">
        <GlassComponent id="ctrl-media" width={172} height={172} sceneUrl={sceneUrl} params={largeTile}>
          <div className="p-4 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-xl bg-white/10 overflow-hidden shadow-2xl border border-white/10">
                <img src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=200" className="w-full h-full object-cover" />
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 text-blue-400 flex items-center justify-center">
                <Airplay className="w-5 h-5 fill-current" />
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-[15px] font-black truncate tracking-tight">Midnight City</div>
              <div className="text-[11px] text-white/40 font-bold truncate tracking-wide">M83</div>
            </div>
            <div className="flex items-center justify-between px-1">
              <div className="p-1 px-2 text-white/30 hover:text-white transition-colors cursor-pointer">
                <CustomPrevIcon className="w-7 h-7 fill-current" />
              </div>
              <button onClick={() => setIsPlaying(!isPlaying)} className="p-1 text-white hover:scale-110 transition-transform">
                {isPlaying ? <CustomPauseIcon className="w-9 h-9 fill-current" /> : <CustomPlayIcon className="w-9 h-9 fill-current ml-0.5" />}
              </button>
              <div className="p-1 px-2 text-white/30 hover:text-white transition-colors cursor-pointer">
                <CustomNextIcon className="w-7 h-7 fill-current" />
              </div>
            </div>
          </div>
        </GlassComponent>
      </div>

      {/* Camera */}
      <div className="col-span-1">
        <GlassComponent id="ctrl-camera" width={80} height={80} sceneUrl={sceneUrl} params={smallTile}>
          <div className="h-full w-full flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer">
            <CustomCameraIcon className="w-8 h-8" />
          </div>
        </GlassComponent>
      </div>

      {/* Mute */}
      <div className="col-span-1">
        <GlassComponent id="ctrl-mute" width={80} height={80} sceneUrl={sceneUrl} params={smallTile}>
          <div className="h-full w-full flex items-center justify-center bg-white hover:bg-white/90 transition-all cursor-pointer">
            <CustomMuteIcon className="w-8 h-8" />
          </div>
        </GlassComponent>
      </div>

      {/* Brightness */}
      <div className="col-span-1 row-span-2">
        <GlassComponent id="ctrl-brightness" width={80} height={172} sceneUrl={sceneUrl} params={sliderTile}>
          <div className="h-full w-full relative flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-x-0 bottom-0 top-[40%] bg-white/95 shadow-[0_-2px_10px_rgba(255,255,255,0.2)]" />
            <Sun className="w-10 h-10 relative z-10 text-yellow-500 mix-blend-difference" />
          </div>
        </GlassComponent>
      </div>

      {/* Volume */}
      <div className="col-span-1 row-span-2">
        <GlassComponent id="ctrl-volume" width={80} height={172} sceneUrl={sceneUrl} params={sliderTile}>
          <div className="h-full w-full relative flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-x-0 bottom-0 top-[60%] bg-white/95 shadow-[0_-2px_10px_rgba(255,255,255,0.2)]" />
            <Volume2 className="w-10 h-10 relative z-10 text-blue-500 mix-blend-difference" />
          </div>
        </GlassComponent>
      </div>

      {/* Focus mode */}
      <div className="col-span-2 text-white/90">
        <GlassComponent id="ctrl-focus" width={172} height={80} sceneUrl={sceneUrl} params={focusTile}>
          <div className="h-full w-full flex items-center px-4 gap-3 hover:bg-white/10 transition-all cursor-pointer truncate">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shadow-inner">
              <Moon className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-black tracking-tight truncate">专注模式</div>
              <div className="text-[10px] text-white/30 font-extrabold uppercase tracking-widest truncate">已开启</div>
            </div>
          </div>
        </GlassComponent>
      </div>

      {/* Home */}
      <div className="col-span-2 row-span-2">
        <GlassComponent id="ctrl-home" width={172} height={172} sceneUrl={sceneUrl} params={largeTile}>
          <div className="p-4 h-full flex flex-col justify-between hover:bg-white/5 transition-all cursor-pointer group">
            <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
              <Lightbulb className="w-7 h-7 text-yellow-300" />
            </div>
            <div className="space-y-0.5">
              <div className="text-[15px] font-black tracking-tight">我的家</div>
              <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest">3 个配件开启</div>
            </div>
          </div>
        </GlassComponent>
      </div>

      {/* Rotate */}
      <div className="col-span-1">
        <GlassComponent id="ctrl-rotate" width={80} height={80} sceneUrl={sceneUrl} params={smallTile}>
          <div className="h-full w-full flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer">
            <RefreshCw className="w-8 h-8 opacity-80" />
          </div>
        </GlassComponent>
      </div>

      {/* Screen mirror */}
      <div className="col-span-1">
        <GlassComponent id="ctrl-mirror" width={80} height={80} sceneUrl={sceneUrl} params={smallTile}>
          <div className="h-full w-full flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer">
            <CustomScreenMirrorIcon className="w-8 h-8" />
          </div>
        </GlassComponent>
      </div>

      {/* Battery */}
      <div className="col-span-1">
        <GlassComponent id="ctrl-battery" width={80} height={80} sceneUrl={sceneUrl} params={smallTile}>
          <div className="h-full w-full flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer">
            <Battery className="w-8 h-8 opacity-80" />
          </div>
        </GlassComponent>
      </div>
    </motion.div>
  );
}
