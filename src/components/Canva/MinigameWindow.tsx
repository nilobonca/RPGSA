import React, { ReactNode } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { X, Minus } from 'lucide-react';
import clsx from 'clsx';
import { useThemeStore } from '@/store/themeStore';
import { useMinigamesStore } from '@/store/minigamesStore';

interface MinigameWindowProps {
  id: string;
  title: string;
  children: ReactNode;
}

export const MinigameWindow: React.FC<MinigameWindowProps> = ({ id, title, children }) => {
  const { theme } = useThemeStore();
  const { toggleMinimize, removeGame, activeGames } = useMinigamesStore();
  const game = activeGames.find(g => g.id === id);
  const dragControls = useDragControls();

  if (!game || game.isMinimized) return null;

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragControls={dragControls}
      dragListener={false}
      initial={{ x: window.innerWidth / 2 - 150, y: window.innerHeight / 2 - 100 }}
      style={{ position: 'fixed', zIndex: 1000 }}
      className={clsx(
        "flex flex-col overflow-hidden resize",
        theme === 'ethereal' 
          ? "bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl" 
          : "bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl",
        "min-w-[300px] min-h-[200px] max-w-[80vw] max-h-[80vh]"
      )}
    >
      {/* Title bar */}
      <div 
        onPointerDown={(e) => dragControls.start(e)}
        className={clsx(
          "flex items-center justify-between p-3 border-b cursor-grab active:cursor-grabbing",
          theme === 'ethereal' ? "border-white/10 bg-white/5" : "border-neutral-800 bg-neutral-950"
        )}
      >
        <span className={clsx("font-medium select-none text-sm pointer-events-none", theme === 'ethereal' ? "text-white" : "text-neutral-200")}>
          {title}
        </span>
        <div className="flex items-center gap-2">
          <button onClick={() => toggleMinimize(id)} className={clsx("p-1.5 rounded-full transition-colors", theme === 'ethereal' ? "hover:bg-white/10 text-neutral-400 hover:text-white" : "hover:bg-neutral-800 text-neutral-400 hover:text-white")}>
            <Minus size={14} />
          </button>
          <button onClick={() => removeGame(id)} className={clsx("p-1.5 rounded-full transition-colors", theme === 'ethereal' ? "hover:bg-red-500/20 text-neutral-400 hover:text-red-400" : "hover:bg-red-900/50 text-neutral-400 hover:text-red-400")}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto flex flex-col">
        {children}
      </div>
    </motion.div>
  );
};
