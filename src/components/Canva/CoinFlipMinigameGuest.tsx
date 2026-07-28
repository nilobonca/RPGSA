import React from 'react';
import clsx from 'clsx';
import { Sparkles, Crown, Coins } from 'lucide-react';

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
  const isHeads = coinResultFace === 'heads';

  return (
    <div className="relative w-full max-w-md bg-neutral-950/80 backdrop-blur-2xl border border-amber-500/20 rounded-3xl p-8 shadow-[0_0_50px_rgba(245,158,11,0.15)] flex flex-col items-center text-center overflow-hidden">
      {/* Dynamic Keyframe style for 3D spin */}
      <style>{`
        @keyframes coin3DSpin {
          0% { transform: rotateY(0deg) scale(1); }
          50% { transform: rotateY(720deg) scale(1.18); }
          100% { transform: rotateY(1440deg) scale(1); }
        }
        .animate-coin-3d {
          animation: coin3DSpin 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>

      {/* Ambient background glow */}
      <div 
        className={clsx(
          "absolute inset-0 pointer-events-none transition-all duration-700 opacity-30 blur-3xl",
          coinState === 'spinning' && "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 opacity-50",
          coinState === 'result' && isHeads && "bg-yellow-400 opacity-40",
          coinState === 'result' && !isHeads && "bg-slate-300 opacity-40",
          coinState === 'idle' && "bg-amber-500/20"
        )} 
      />

      {/* Title */}
      <h2 className="text-2xl font-[Cinzel] font-bold mb-1 bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent uppercase tracking-widest drop-shadow-[0_2px_10px_rgba(245,158,11,0.3)]">
        {clickerConfig?.config?.title || 'Cara ou Coroa'}
      </h2>
      <p className="text-xs text-neutral-300 font-light mb-8 tracking-wider">
        {clickerConfig?.config?.description || 'Clique na moeda para girar!'}
      </p>

      {/* 3D Coin Container */}
      <div className="relative mb-8" style={{ perspective: '1000px' }}>
        <button
          onClick={onCoinClick}
          disabled={!coinCanInteract || coinState !== 'idle'}
          className={clsx(
            "w-44 h-44 rounded-full relative transition-all duration-700 focus:outline-none select-none",
            coinState === 'spinning' && "animate-coin-3d cursor-wait",
            coinState === 'idle' && coinCanInteract && "hover:scale-105 active:scale-95 cursor-pointer shadow-[0_0_30px_rgba(245,158,11,0.4)]",
            coinState === 'idle' && !coinCanInteract && "cursor-not-allowed opacity-60 grayscale-[40%]"
          )}
          style={{
            transformStyle: 'preserve-3d',
            transform: coinState === 'result'
              ? (coinResultFace === 'tails' ? 'rotateY(180deg)' : 'rotateY(0deg)')
              : undefined
          }}
        >
          {/* Front Face: Cara (Heads - Royal Crown Gold) */}
          <div 
            className="absolute inset-0 rounded-full flex flex-col items-center justify-center bg-gradient-to-tr from-amber-700 via-yellow-400 to-amber-200 border-4 border-yellow-200 shadow-[0_12px_28px_rgba(0,0,0,0.6),inset_0_2px_8px_rgba(255,255,255,0.8)]"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="w-36 h-36 rounded-full border-2 border-dashed border-amber-900/40 flex flex-col items-center justify-center p-2 bg-gradient-to-b from-amber-400/30 to-amber-600/30 backdrop-blur-xs">
              <Crown size={48} className="text-amber-950 drop-shadow-[0_2px_4px_rgba(255,255,255,0.5)] mb-1" />
              <span className="font-['Cinzel'] font-black text-amber-950 text-base tracking-widest uppercase">CARA</span>
              <span className="font-['JetBrains_Mono'] text-[10px] text-amber-900 font-bold uppercase tracking-tighter">ROYAL FACE</span>
            </div>
          </div>

          {/* Back Face: Coroa (Tails - Silver Platinum Emblem) */}
          <div 
            className="absolute inset-0 rounded-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-600 via-zinc-200 to-slate-100 border-4 border-zinc-200 shadow-[0_12px_28px_rgba(0,0,0,0.6),inset_0_2px_8px_rgba(255,255,255,0.9)]"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="w-36 h-36 rounded-full border-2 border-dashed border-slate-700/40 flex flex-col items-center justify-center p-2 bg-gradient-to-b from-slate-300/30 to-slate-500/30 backdrop-blur-xs">
              <Coins size={48} className="text-slate-900 drop-shadow-[0_2px_4px_rgba(255,255,255,0.6)] mb-1" />
              <span className="font-['Cinzel'] font-black text-slate-900 text-base tracking-widest uppercase">COROA</span>
              <span className="font-['JetBrains_Mono'] text-[10px] text-slate-800 font-bold uppercase tracking-tighter">TAILS EMBLEM</span>
            </div>
          </div>
        </button>
      </div>

      {/* State & Result Status */}
      <div className="w-full min-h-[48px] flex items-center justify-center">
        {coinState === 'spinning' && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-['JetBrains_Mono'] font-bold text-sm tracking-wider animate-pulse">
            <Coins size={18} className="animate-spin text-amber-400" />
            <span>GIRANDO...</span>
          </div>
        )}

        {coinState === 'result' && (
          <div className={clsx(
            "flex items-center gap-2 px-5 py-2.5 rounded-2xl border font-['Cinzel'] font-bold text-base tracking-widest uppercase shadow-lg animate-bounce",
            isHeads
              ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/30 text-yellow-300 border-yellow-500/40 shadow-yellow-500/20"
              : "bg-gradient-to-r from-slate-400/20 to-zinc-400/30 text-slate-200 border-zinc-400/40 shadow-zinc-400/20"
          )}>
            <Sparkles size={18} />
            <span>RESULTADO: {isHeads ? 'CARA!' : 'COROA!'}</span>
          </div>
        )}

        {coinState === 'idle' && (
          <div className={clsx(
            "px-5 py-2 rounded-2xl border font-['JetBrains_Mono'] font-bold text-xs tracking-wider uppercase transition-all",
            coinCanInteract
              ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
              : "bg-neutral-900 text-neutral-500 border-neutral-800"
          )}>
            {coinCanInteract ? '⚡ PRONTO PARA GIRAR ⚡' : '🔒 AGUARDANDO PERMISSÃO DO MESTRE'}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoinFlipMinigameGuest;

