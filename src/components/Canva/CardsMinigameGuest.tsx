import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Clock, CheckCircle2, Lock, Eye } from 'lucide-react';
import clsx from 'clsx';

export interface CardsMinigameGuestProps {
  clickerConfig: any;
  cardState: { index: number | null; flipped: Record<number, boolean> };
  cardPermissions: { canSee: boolean; canInteract: boolean; canSeeResult: boolean };
  onCardClick: (index: number) => void;
  timeLeft?: number;
  gameOver?: boolean;
}

export const CardsMinigameGuest: React.FC<CardsMinigameGuestProps> = ({
  clickerConfig,
  cardState,
  cardPermissions,
  onCardClick,
  timeLeft,
  gameOver = false,
}) => {
  const cards = clickerConfig?.config?.cards || [];
  const quantity = clickerConfig?.config?.quantity || (cards.length > 0 ? cards.length : 3);
  const initialFace = clickerConfig?.config?.initialFace || 'down';
  
  const title = clickerConfig?.title || clickerConfig?.config?.customTitle || 'Escolha uma Carta';
  const subtitle = clickerConfig?.description || clickerConfig?.config?.customSubtitle || 'Selecione a carta da sua escolha!';

  const remainingTime = timeLeft ?? clickerConfig?.config?.timeLimit ?? 0;

  return (
    <div className="w-full flex flex-col items-center justify-center font-['Outfit',sans-serif] relative z-10">
      {/* High-Fidelity Glassmorphic Hero Panel */}
      <div className="relative w-full max-w-4xl bg-[#090912]/75 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] flex flex-col items-center text-center overflow-hidden">
        
        {/* Glowing Background Ambient Orbs */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-amber-500/10 rounded-full blur-[90px] pointer-events-none animate-pulse" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-indigo-500/15 rounded-full blur-[90px] pointer-events-none animate-pulse" style={{ animationDelay: '1.5s' }} />

        {/* Header Title & Subtitle */}
        <div className="relative z-10 mb-6 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={20} className="text-amber-400 animate-pulse" />
            <h2 className="font-['Cinzel',serif] text-2xl sm:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-indigo-100 to-purple-300 drop-shadow-md tracking-wider">
              {title}
            </h2>
            <Sparkles size={20} className="text-purple-400 animate-pulse" style={{ animationDelay: '0.7s' }} />
          </div>

          <p className="text-xs sm:text-sm text-neutral-300/80 max-w-md font-medium">
            {subtitle}
          </p>

          {/* Optional Timer Pill */}
          {remainingTime > 0 && (
            <div className="mt-4 px-4 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-full text-xs font-mono font-bold flex items-center gap-2 shadow-inner">
              <Clock size={14} className="animate-spin text-amber-400" />
              <span>Tempo Restante: 00:{remainingTime.toString().padStart(2, '0')}</span>
            </div>
          )}
        </div>

        {/* Cards Grid with Staggered Framer-Motion Animations */}
        <div className="relative z-10 flex flex-wrap gap-4 sm:gap-6 justify-center items-center w-full my-4">
          {Array.from({ length: quantity }).map((_, idx) => {
            const isFlipped = cardState.flipped[idx] || initialFace === 'up';
            const isSelected = cardState.index === idx;
            const canInteract = cardPermissions.canInteract && !gameOver && cardState.index === null;
            const cardData = cards.length > 0 ? cards[idx % cards.length] : null;

            return (
              <motion.div
                key={idx}
                initial={{ 
                  opacity: 0, 
                  scale: 0.4, 
                  y: -50, 
                  rotateZ: (idx - Math.floor(quantity / 2)) * 5 
                }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  y: 0, 
                  rotateZ: 0 
                }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 260, 
                  damping: 22, 
                  delay: idx * 0.08 
                }}
                className={clsx(
                  "relative w-28 h-44 sm:w-36 sm:h-56 rounded-2xl transition-all duration-300 select-none",
                  canInteract ? "cursor-pointer group hover:scale-105 hover:-translate-y-2" : "cursor-default",
                  isSelected && "ring-4 ring-amber-400 ring-offset-4 ring-offset-black shadow-[0_0_30px_rgba(245,158,11,0.5)]"
                )}
                style={{ perspective: '1200px' }}
                onClick={() => canInteract && onCardClick(idx)}
              >
                {/* 3D Card Flipping Container */}
                <motion.div
                  className="relative w-full h-full"
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Card Back (Unrevealed / Face Down) */}
                  <div
                    className={clsx(
                      "absolute inset-0 rounded-2xl border-2 flex flex-col items-center justify-center p-3 shadow-2xl transition-all overflow-hidden",
                      canInteract 
                        ? "bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 border-indigo-500/40 group-hover:border-amber-400/70 group-hover:shadow-[0_0_25px_rgba(245,158,11,0.3)]" 
                        : "bg-slate-950 border-white/10 opacity-80"
                    )}
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    {/* Dark Fantasy Geometric Back Pattern */}
                    <div className="absolute inset-2 border border-white/10 rounded-xl flex items-center justify-center bg-black/20">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 border-2 border-amber-400/30 rotate-45 flex items-center justify-center bg-indigo-900/20">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 border border-indigo-400/40 rotate-45 flex items-center justify-center bg-purple-900/30">
                          <span className="font-['Cinzel',serif] text-xs sm:text-sm font-bold text-amber-200/80 -rotate-45">
                            #{idx + 1}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Click Prompt Indicator */}
                    {canInteract && (
                      <span className="absolute bottom-2.5 text-[10px] font-['Cinzel',serif] tracking-wider text-amber-300/80 uppercase font-semibold group-hover:text-amber-200 transition-colors">
                        Revelar
                      </span>
                    )}
                  </div>

                  {/* Card Front (Revealed / Face Up) */}
                  <div
                    className="absolute inset-0 rounded-2xl border-2 border-amber-400/50 bg-gradient-to-b from-slate-900 via-indigo-950 to-purple-950 flex flex-col items-center justify-between p-2.5 sm:p-3 shadow-2xl overflow-hidden"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                  >
                    {!cardPermissions.canSeeResult && initialFace === 'down' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-center p-2 bg-black/40 rounded-xl border border-amber-500/20">
                        <Lock size={28} className="text-amber-400/80 mb-2 animate-bounce" />
                        <span className="font-['Cinzel',serif] text-xs text-amber-200 font-bold">
                          Resultado Oculto
                        </span>
                        <span className="text-[10px] text-neutral-400 mt-1 font-medium">
                          Carta registrada!
                        </span>
                      </div>
                    ) : cardData?.type === 'image' && cardData.value ? (
                      <div className="w-full h-full relative flex flex-col justify-between overflow-hidden rounded-xl border border-white/10 shadow-inner">
                        <img 
                          src={cardData.value} 
                          alt={cardData.title || `Carta ${idx + 1}`} 
                          className="w-full h-full object-cover rounded-xl"
                        />
                        {cardData.title && cardData.showTitle && (
                          <div className="absolute bottom-0 inset-x-0 bg-black/85 backdrop-blur-md text-[10px] sm:text-xs font-['Cinzel',serif] text-amber-200 text-center py-1.5 px-1 truncate font-bold border-t border-amber-500/30">
                            {cardData.title}
                          </div>
                        )}
                      </div>
                    ) : cardData?.type === 'text' && cardData.value ? (
                      <div className="w-full h-full flex flex-col items-center justify-center p-3 bg-black/40 rounded-xl border border-indigo-400/30">
                        <span className="font-['Cinzel',serif] text-base sm:text-lg font-extrabold text-amber-200 text-center break-words line-clamp-6 drop-shadow-md">
                          {cardData.value}
                        </span>
                        {cardData.title && cardData.showTitle && (
                          <span className="text-[10px] font-['Outfit',sans-serif] text-indigo-300 mt-2 font-medium">
                            {cardData.title}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-3 bg-black/40 rounded-xl border border-indigo-400/30">
                        <span className="font-['Cinzel',serif] text-2xl font-black text-amber-300">
                          {idx + 1}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* Guest Feedback & Status Message */}
        <div className="relative z-10 mt-4 text-xs font-medium">
          {cardState.index !== null ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-full flex items-center gap-2 shadow-md"
            >
              <CheckCircle2 size={16} />
              <span>Você escolheu a <strong>Carta #{cardState.index + 1}</strong>! Aguardando os demais jogadores.</span>
            </motion.div>
          ) : !cardPermissions.canInteract ? (
            <div className="px-4 py-2 bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded-full flex items-center gap-2 shadow-md">
              <Eye size={15} />
              <span>Modo Espectador: Você está observando a rodada.</span>
            </div>
          ) : (
            <div className="text-neutral-400 italic">
              Clique em uma das cartas para fazer sua escolha!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardsMinigameGuest;
