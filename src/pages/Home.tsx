import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { HomeUI } from '../components/HomeUI';
import { SCENES, DEFAULT_GLASS_PARAMS } from '../constants';

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#08080a] text-white selection:bg-white/20 overflow-x-hidden">
      {/* Atmospheric background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-30%] left-[20%] w-[800px] h-[800px] rounded-full blur-[200px]" style={{ background: 'radial-gradient(circle, rgba(100,116,139,0.08) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] right-[10%] w-[600px] h-[600px] rounded-full blur-[180px]" style={{ background: 'radial-gradient(circle, rgba(71,85,105,0.06) 0%, transparent 70%)' }} />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
            maskImage: 'radial-gradient(ellipse at center, white 20%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, white 20%, transparent 80%)',
          }}
        />
      </div>

      <main className="relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
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
