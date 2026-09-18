import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { HomeUI } from '../components/HomeUI';
import { SCENES, DEFAULT_GLASS_PARAMS } from '../constants';

export function Home() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = React.useState(
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true,
  );

  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const bg = isDark ? '#08080a' : '#fafafa';
  const textColor = isDark ? 'text-white' : 'text-gray-900';

  return (
    <div
      className={`min-h-screen ${textColor} selection:bg-white/20 overflow-x-hidden transition-colors duration-300`}
      style={{ background: bg }}
    >
      {/* Atmospheric background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {isDark ? (
          <>
            <div className="absolute top-[-30%] left-[20%] w-[800px] h-[800px] rounded-full blur-[200px]" style={{ background: 'radial-gradient(circle, rgba(100,116,139,0.08) 0%, transparent 70%)' }} />
            <div className="absolute bottom-[-20%] right-[10%] w-[600px] h-[600px] rounded-full blur-[180px]" style={{ background: 'radial-gradient(circle, rgba(71,85,105,0.06) 0%, transparent 70%)' }} />
          </>
        ) : (
          <>
            <div className="absolute top-[-30%] left-[20%] w-[800px] h-[800px] rounded-full blur-[200px]" style={{ background: 'radial-gradient(circle, rgba(148,163,184,0.12) 0%, transparent 70%)' }} />
            <div className="absolute bottom-[-20%] right-[10%] w-[600px] h-[600px] rounded-full blur-[180px]" style={{ background: 'radial-gradient(circle, rgba(203,213,225,0.1) 0%, transparent 70%)' }} />
          </>
        )}
        {/* Grid pattern */}
        <div
          className="absolute inset-0"
          style={{
            opacity: isDark ? 0.03 : 0.06,
            backgroundImage: isDark
              ? 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)'
              : 'linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px)',
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
            onStart={() => navigate('/studio')}
            onOpenDocs={() => navigate('/docs')}
            sceneUrl={SCENES[0].url}
            globalParams={DEFAULT_GLASS_PARAMS}
            isDark={isDark}
          />
        </motion.div>
      </main>
    </div>
  );
}
