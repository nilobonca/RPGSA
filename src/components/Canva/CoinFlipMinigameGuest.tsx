import React from 'react';
import clsx from 'clsx';
import { Dices } from 'lucide-react';

interface CoinFlipMinigameGuestProps {
  clickerConfig: any;
  coinState: 'idle' | 'spinning' | 'result';
  coinResultFace: 'heads' | 'tails' | null;
  coinCanInteract: boolean;
  onCoinClick: () => void;
}

export const CoinFlipMinigameGuest: React.FC<CoinFlipMinigameGuestProps> = ({
  clickerConfig,
  coinState,
  coinResultFace,
  coinCanInteract,
  onCoinClick,
}) => {
  return (
    <div className="w-full bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center">
      <h2 className="text-xl font-bold mb-2 text-amber-400">
        {clickerConfig?.config?.title || 'Cara ou Coroa'}
      </h2>
      <p className="text-sm text-neutral-400 mb-6">
        Clique na moeda para girar!
      </p>

      <button
        onClick={onCoinClick}
        disabled={!coinCanInteract || coinState !== 'idle'}
        className={clsx(
          "w-36 h-36 rounded-full flex flex-col items-center justify-center font-bold text-white shadow-xl transition-all",
          coinState === 'spinning' && "animate-spin bg-amber-500/20 border-2 border-amber-500",
          coinState === 'result' && "bg-amber-600 border-2 border-amber-300",
          coinState === 'idle' && coinCanInteract && "bg-amber-500 hover:bg-amber-400 border-2 border-amber-300/50 cursor-pointer active:scale-95",
          coinState === 'idle' && !coinCanInteract && "bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700"
        )}
      >
        <Dices size={36} className="mb-2" />
        {coinState === 'spinning'
          ? 'Girando...'
          : coinState === 'result'
          ? coinResultFace === 'heads' ? 'Cara!' : 'Coroa!'
          : 'GIRAR!'}
      </button>
    </div>
  );
};

export default CoinFlipMinigameGuest;
