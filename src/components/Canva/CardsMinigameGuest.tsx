import React from 'react';
import clsx from 'clsx';

interface CardsMinigameGuestProps {
  clickerConfig: any;
  cardState: { index: number | null; flipped: Record<number, boolean> };
  cardPermissions: { canSee: boolean; canInteract: boolean; canSeeResult: boolean };
  onCardClick: (index: number) => void;
}

export const CardsMinigameGuest: React.FC<CardsMinigameGuestProps> = ({
  clickerConfig,
  cardState,
  cardPermissions,
  onCardClick,
}) => {
  const cards = clickerConfig?.config?.cards || [1, 2, 3];

  return (
    <div className="w-full bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center">
      <h2 className="text-xl font-bold mb-2 text-purple-400">
        {clickerConfig?.config?.title || 'Escolha uma Carta'}
      </h2>
      <p className="text-sm text-neutral-400 mb-6">
        Selecione a carta da sua escolha!
      </p>

      <div className="flex gap-4 justify-center flex-wrap">
        {cards.map((card: any, idx: number) => {
          const isFlipped = cardState.flipped[idx];
          return (
            <button
              key={idx}
              onClick={() => onCardClick(idx)}
              disabled={!cardPermissions.canInteract || cardState.index !== null}
              className={clsx(
                "w-24 h-36 rounded-xl border-2 flex flex-col items-center justify-center font-bold transition-all shadow-lg",
                isFlipped
                  ? "bg-purple-950/80 border-purple-400 text-purple-200"
                  : "bg-neutral-800 border-neutral-700 hover:border-purple-500/50 text-neutral-400 cursor-pointer active:scale-95"
              )}
            >
              <span className="text-2xl mb-1">🃏</span>
              <span className="text-xs font-semibold">Carta {idx + 1}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CardsMinigameGuest;
