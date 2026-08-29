import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { HomeUI } from '../components/HomeUI';
import { SCENES, DEFAULT_GLASS_PARAMS } from '../constants';

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-white/20 overflow-hidden flex flex-col font-sans antialiased">
      <div className="fixed inset-0 z-0 pointer-events-none bg-[#0a0a0b]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[400px] bg-white/[0.02] blur-[100px] rounded-full pointer-events-none" />
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(to right, rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(circle at center, white 0%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(circle at center, white 0%, transparent 70%)',
          }}
        />
      </div>

      <main className="flex-1 relative z-10 flex flex-col items-center justify-center px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="w-full h-full flex items-center justify-center"
        >
          <HomeUI
            onStart={() => navigate('/workspace')}
            onOpenDocs={() => navigate('/docs')}
            sceneUrl={SCENES[0].url}
            globalParams={DEFAULT_GLASS_PARAMS}
          />
        </motion.div>
      </main>
    </div>
  );
}
