import React from 'react';
import clsx from 'clsx';
import { MousePointerClick } from 'lucide-react';

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
  const progressPercent = Math.min((localClicks / targetClicks) * 100, 100);

  return (
    <div className="w-full bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center">
      <h2 className="text-xl font-bold mb-2 text-indigo-400">
        {clickerConfig?.config?.title || 'Desafio de Cliques!'}
      </h2>
      <p className="text-sm text-neutral-400 mb-6">
        {clickerConfig?.config?.description || 'Clique no botão o mais rápido que puder!'}
      </p>

      {/* Progress Bar */}
      <div className="w-full bg-neutral-800 rounded-full h-4 mb-6 overflow-hidden border border-neutral-700 p-0.5">
        <div
          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-150"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="text-sm font-mono text-neutral-300 mb-6">
        {localClicks} / {targetClicks} cliques
      </div>

      <button
        onClick={onMinigameClick}
        disabled={gameOver}
        className={clsx(
          "w-32 h-32 rounded-full flex flex-col items-center justify-center font-bold text-white shadow-xl transition-transform active:scale-95",
          gameOver
            ? "bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700"
            : clickEffect
            ? "bg-indigo-400 scale-105"
            : "bg-indigo-600 hover:bg-indigo-500 border-2 border-indigo-400/50"
        )}
      >
        <MousePointerClick size={32} className="mb-1" />
        {gameOver ? 'Concluído!' : 'CLIQUE!'}
      </button>
    </div>
  );
};

export default ClickerMinigameGuest;
