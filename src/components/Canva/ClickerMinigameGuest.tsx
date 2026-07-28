import React from 'react';
import clsx from 'clsx';
import { MousePointerClick, Zap, CheckCircle2 } from 'lucide-react';

interface ClickerMinigameGuestProps {
  clickerConfig: any;
  localClicks: number;
  gameOver: boolean;
  clickEffect: boolean;
  onMinigameClick: () => void;
}

export const ClickerMinigameGuest: React.FC<ClickerMinigameGuestProps> = ({
  clickerConfig,
  localClicks,
  gameOver,
  clickEffect,
  onMinigameClick,
}) => {
  const targetClicks = clickerConfig?.config?.targetClicks || 100;
  const imageUrl = clickerConfig?.config?.imageUrl;
  const hideTarget = clickerConfig?.config?.hideTarget ?? false;
  const progressPercent = Math.min((localClicks / targetClicks) * 100, 100);

  return (
    <div className="relative w-full max-w-md bg-neutral-950/85 backdrop-blur-2xl border border-indigo-500/30 shadow-[0_0_60px_rgba(99,102,241,0.2)] rounded-3xl p-8 flex flex-col items-center text-center overflow-hidden">
      {/* Background ambient lighting */}
      <div 
        className={clsx(
          "absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-500",
          gameOver ? "bg-emerald-500/20" : "bg-indigo-600/30"
        )} 
      />

      {/* Header Title */}
      <h2 className="text-2xl font-[Cinzel] font-black mb-1 bg-gradient-to-r from-indigo-200 via-purple-300 to-pink-300 bg-clip-text text-transparent tracking-widest uppercase drop-shadow-[0_2px_12px_rgba(129,140,248,0.5)]">
        {clickerConfig?.config?.title || 'Desafio de Cliques'}
      </h2>
      <p className="text-xs text-neutral-300 font-light mb-6 tracking-wide">
        {clickerConfig?.config?.description || 'Clique no botão o mais rápido que puder!'}
      </p>

      {/* Arcade Power Progress Gauge */}
      <div className="w-full mb-4">
        <div className="flex justify-between items-center text-xs mb-1.5 font-['JetBrains_Mono']">
          <span className="text-neutral-400 font-semibold uppercase tracking-wider flex items-center gap-1">
            <Zap size={12} className="text-indigo-400" /> ENERGIA
          </span>
          <span className="text-indigo-300 font-bold">
            {Math.round(progressPercent)}%
          </span>
        </div>
        <div className="w-full bg-black/60 rounded-full h-4 p-0.5 border border-indigo-500/30 overflow-hidden shadow-inner">
          <div
            className={clsx(
              "h-full rounded-full transition-all duration-150 relative shadow-[0_0_15px_rgba(99,102,241,0.6)]",
              gameOver 
                ? "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300"
                : "bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500"
            )}
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute inset-0 bg-white/25" style={{ transform: 'skewX(-20deg) translateX(-100%)', animation: 'shimmer 1.5s infinite' }} />
          </div>
        </div>
      </div>

      {/* Numerical Counter Display */}
      <div className="mb-6 px-4 py-2 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 backdrop-blur-md shadow-inner flex items-center justify-center gap-2">
        <span className="font-['JetBrains_Mono'] text-xl font-extrabold text-indigo-200 tracking-wider">
          {localClicks}
        </span>
        {!hideTarget && (
          <span className="font-['JetBrains_Mono'] text-sm text-indigo-400/70">
            / {targetClicks} cliques
          </span>
        )}
      </div>

      {/* 3D Tactile Arcade Button */}
      <div className="relative my-2 select-none">
        {/* Outer Chrome Bezel Rim */}
        <div className="w-44 h-44 rounded-full p-3 bg-gradient-to-b from-neutral-700 via-neutral-900 to-neutral-950 shadow-[0_16px_32px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.2)] flex items-center justify-center border border-white/10">
          <button
            onClick={onMinigameClick}
            disabled={gameOver}
            className={clsx(
              "w-full h-full rounded-full flex flex-col items-center justify-center font-bold text-white transition-all duration-700 relative overflow-hidden select-none focus:outline-none",
              gameOver
                ? "bg-neutral-800 border-2 border-neutral-700 text-neutral-500 cursor-not-allowed shadow-none"
                : clickEffect
                ? "bg-gradient-to-tr from-indigo-500 via-purple-400 to-pink-400 border-2 border-white scale-95 shadow-[0_4px_0_#312e81,0_8px_15px_rgba(0,0,0,0.5)] translate-y-[6px]"
                : "bg-gradient-to-tr from-indigo-700 via-indigo-500 to-purple-400 border-2 border-indigo-300/50 shadow-[0_10px_0_#312e81,0_15px_25px_rgba(0,0,0,0.6)] hover:brightness-110 active:translate-y-[6px] active:shadow-[0_4px_0_#312e81,0_8px_15px_rgba(0,0,0,0.5)] cursor-pointer"
            )}
          >
            {/* Button Inner Specular Highlight */}
            <div className="absolute top-1/6 left-1/4 w-1/2 h-1/4 bg-white/20 rounded-full blur-xs pointer-events-none" />

            {/* Custom Image or Icon */}
            {imageUrl ? (
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/40 shadow-md mb-1 bg-black/40 flex items-center justify-center">
                <img src={imageUrl} alt="Target" className="w-full h-full object-cover" />
              </div>
            ) : gameOver ? (
              <CheckCircle2 size={38} className="mb-1 text-emerald-400 drop-shadow-md" />
            ) : (
              <MousePointerClick size={38} className="mb-1 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]" />
            )}

            <span className="font-['Cinzel'] font-black tracking-widest text-sm uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
              {gameOver ? 'CONCLUÍDO!' : 'CLIQUE!'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClickerMinigameGuest;

