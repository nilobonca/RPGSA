import React from 'react';

interface GuestMinigamesOverlayProps {
    isClickerActive: boolean;
    isFadingOut: boolean;
    clickerConfig: any;
    gameOver: boolean;
    timeLeft: number;
    localClicks: number;
    clickEffect: boolean;
    coinState: 'idle' | 'spinning' | 'result';
    coinResultFace: 'heads' | 'tails' | null;
    coinCanInteract: boolean;
    cardState: { index: number | null; flipped: Record<number, boolean> };
    cardPermissions: { canSee: boolean; canInteract: boolean; canSeeResult: boolean };
    clickerPermissions: { canSee: boolean; canInteract: boolean };
    cooperativeTotalClicks: number;
    onMinigameClick: () => void;
    onCoinClick: () => void;
    onCardClick: (index: number) => void;
}

export const GuestMinigamesOverlay: React.FC<GuestMinigamesOverlayProps> = ({
    isClickerActive,
    isFadingOut,
    clickerConfig,
    gameOver,
    timeLeft,
    localClicks,
    clickEffect,
    coinState,
    coinResultFace,
    coinCanInteract,
    cardState,
    cardPermissions,
    clickerPermissions,
    cooperativeTotalClicks,
    onMinigameClick,
    onCoinClick,
    onCardClick
}) => {
    if (!isClickerActive) return null;

    return (
        <div 
            className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl overflow-hidden transition-opacity ease-out ${isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            style={{ transitionDuration: `${clickerConfig?.config?.fadeoutTime !== undefined ? clickerConfig.config.fadeoutTime : 2}s` }}
        >
            {/* Animated Background Elements */}
            <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-white/5 rounded-full blur-[120px] opacity-50 animate-pulse" />
            <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-neutral-600/5 rounded-full blur-[120px] opacity-50 animate-pulse" style={{ animationDelay: '2s' }} />

            <div className="relative z-10 flex flex-col items-center justify-center p-8 w-full max-w-2xl font-sans">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-light text-white/90 tracking-wide mb-3">
                        {clickerConfig?.title || (
                            clickerConfig?.gameType === 'coin_flip' 
                                ? "Cara ou Coroa" 
                                : clickerConfig?.gameType === 'cards' 
                                    ? "Escolha uma Carta" 
                                    : "Desafio de Cliques"
                        )}
                    </h2>
                    <p className="text-base text-neutral-400 font-light">
                        {clickerConfig?.description || (
                            clickerConfig?.gameType === 'coin_flip' 
                                ? (coinCanInteract ? "Clique na moeda para girar." : "Aguarde o giro da moeda.") 
                                : clickerConfig?.gameType === 'cards' 
                                    ? "Selecione uma das cartas disponíveis para revelar seu conteúdo." 
                                    : "Clique o mais rápido possível!"
                        )}
                    </p>
                </div>

                {clickerConfig?.gameType === 'coin_flip' ? (
                    <>
                        <style dangerouslySetInnerHTML={{ __html: `
                            @keyframes spinY {
                                from { transform: rotateY(0deg); }
                                to { transform: rotateY(360deg); }
                            }
                        ` }} />
                        <div 
                            className={`mb-20 w-64 h-64 ${coinCanInteract && coinState === 'idle' ? 'cursor-pointer hover:scale-105' : ''} transition-transform duration-300 mx-auto`} 
                            style={{ perspective: '1000px' }}
                            onClick={onCoinClick}
                        >
                            <div 
                                className="relative w-full h-full"
                                style={{
                                    transformStyle: 'preserve-3d',
                                    transform: coinState === 'result' ? (coinResultFace === 'tails' ? 'rotateY(180deg)' : 'rotateY(0deg)') : 'rotateY(0deg)',
                                    animation: coinState === 'spinning' ? 'spinY 0.3s linear infinite' : 'none',
                                    transition: coinState !== 'spinning' ? 'transform 0.5s ease-out' : 'none'
                                }}
                            >
                                {/* Front Face (Heads) */}
                                <div className="absolute inset-0 bg-yellow-500 rounded-full flex flex-col items-center justify-center border-[8px] border-yellow-600 shadow-[0_0_30px_rgba(234,179,8,0.3)]" style={{ backfaceVisibility: 'hidden' }}>
                                    <span className="text-5xl font-bold text-yellow-900 tracking-wider">CARA</span>
                                </div>
                                {/* Back Face (Tails) */}
                                <div className="absolute inset-0 bg-gray-300 rounded-full flex flex-col items-center justify-center border-[8px] border-gray-400 shadow-[0_0_30px_rgba(156,163,175,0.3)]" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                                    <span className="text-5xl font-bold text-gray-800 tracking-wider">COROA</span>
                                </div>
                            </div>
                        </div>
                    </>
                ) : clickerConfig?.gameType === 'cards' ? (
                    <div className="w-full flex flex-col items-center">
                        {/* Timer if applicable */}
                        {clickerConfig?.config?.timeLimit > 0 && (
                            <div className="mb-8">
                                <div className="text-4xl font-light text-white/90 font-mono tabular-nums tracking-tighter">
                                    00:{timeLeft.toString().padStart(2, '0')}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-4 justify-center max-w-4xl">
                            {Array.from({ length: clickerConfig.config.quantity || 3 }).map((_, i) => {
                                const isFlipped = cardState.flipped[i] || clickerConfig.config.initialFace === 'up';
                                const canInteract = cardPermissions.canInteract && !gameOver && cardState.index === null;
                                const cards = clickerConfig.config.cards || [];
                                const card = cards.length > 0 ? cards[i % cards.length] : null;

                                return (
                                    <div 
                                        key={i}
                                        onClick={() => canInteract && onCardClick(i)}
                                        className={`relative w-32 h-48 sm:w-40 sm:h-56 rounded-xl shadow-lg transition-transform duration-300 mx-auto ${canInteract ? 'cursor-pointer hover:scale-105 hover:-translate-y-2' : ''} ${cardState.index === i ? 'ring-4 ring-indigo-500 ring-offset-4 ring-offset-neutral-900' : ''}`}
                                        style={{ perspective: '1000px' }}
                                    >
                                        <div 
                                            className="relative w-full h-full"
                                            style={{
                                                transformStyle: 'preserve-3d',
                                                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                                                transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                                            }}
                                        >
                                            {/* Front (Card Back) */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl border-2 border-indigo-500/30 flex items-center justify-center shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]" style={{ backfaceVisibility: 'hidden' }}>
                                                <div className="w-12 h-12 border-2 border-indigo-400/30 rotate-45 flex items-center justify-center">
                                                    <div className="w-8 h-8 border border-indigo-400/20 rotate-45"></div>
                                                </div>
                                            </div>
                                            {/* Back (Card Face) */}
                                            <div className="absolute inset-0 bg-neutral-100 rounded-xl flex items-center justify-center border-2 border-neutral-300 overflow-hidden flex-col" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                                                {!cardPermissions.canSeeResult && clickerConfig.config.initialFace === 'down' ? (
                                                    <span className="text-5xl">❓</span>
                                                ) : card?.type === 'image' && card.value ? (
                                                    <>
                                                        <img src={card.value} alt={`Card ${i+1}`} className="w-full flex-1 object-cover" />
                                                        {card.title && card.showTitle && (
                                                            <div className="w-full bg-black/80 text-white text-center py-1 text-xs font-semibold px-1 break-words">
                                                                {card.title}
                                                            </div>
                                                        )}
                                                    </>
                                                ) : card?.type === 'text' && card.value ? (
                                                    <span className="text-3xl font-bold text-neutral-800 text-center px-4 break-words">{card.value}</span>
                                                ) : (
                                                    <span className="text-3xl font-bold text-neutral-800">{i + 1}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Timer */}
                        <div className="mb-16">
                            <div className="text-7xl font-light text-white/90 font-mono tabular-nums tracking-tighter">
                                00:{timeLeft.toString().padStart(2, '0')}
                            </div>
                        </div>

                        {/* The Big Button */}
                        <button
                            onClick={onMinigameClick}
                            disabled={!clickerPermissions.canInteract || gameOver}
                            className={`relative group mb-20 focus:outline-none transition-transform duration-300 ease-out ${!clickerPermissions.canInteract ? 'opacity-60 cursor-not-allowed' : clickEffect ? 'scale-[0.98]' : 'scale-100 hover:scale-[1.02]'} ${clickerConfig?.config?.imageUrl ? '' : 'rounded-full'}`}
                        >
                            {clickerConfig?.config?.imageUrl ? (
                                <div className="w-64 h-64 relative flex items-center justify-center drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)] group-hover:drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)] transition-all duration-500">
                                    <img 
                                        src={clickerConfig.config.imageUrl} 
                                        alt="Minigame target" 
                                        className="w-full h-full object-contain pointer-events-none"
                                    />
                                </div>
                            ) : (
                                <div className="relative w-48 h-48 bg-neutral-900/50 border border-white/5 rounded-full flex items-center justify-center shadow-[0_20px_40px_rgba(0,0,0,0.4)] group-hover:shadow-[0_25px_50px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all duration-500">
                                    <div className="w-32 h-32 bg-[#111] rounded-full shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] flex items-center justify-center border border-white/5">
                                        {!clickerPermissions.canInteract ? (
                                            <span className="text-amber-400/90 font-semibold text-xs tracking-wider select-none text-center px-2">ESPECTADOR</span>
                                        ) : (
                                            <span className="text-neutral-500 font-light text-xl tracking-[0.2em] select-none group-hover:text-neutral-300 transition-colors">CLICAR</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </button>

                        {/* Progress Bar */}
                        {(() => {
                            const currentClicks = clickerConfig?.config?.isCooperative ? Math.max(localClicks, cooperativeTotalClicks) : localClicks;
                            return (
                                <>
                                    {!clickerConfig?.config?.hideTarget && (
                                        <div className="w-full max-w-sm bg-neutral-900/50 border border-white/5 rounded-full h-2.5 relative overflow-hidden backdrop-blur-sm">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-300 ease-out relative ${clickerConfig?.config?.isCooperative ? 'bg-gradient-to-r from-indigo-500 to-emerald-400' : 'bg-[#D4C4A8] opacity-80'}`}
                                                style={{ width: `${Math.min(100, (currentClicks / (clickerConfig?.config?.targetClicks || 100)) * 100)}%` }}
                                            />
                                        </div>
                                    )}
                                    <div className="mt-4 text-xs font-light text-neutral-400 tracking-wider flex flex-col items-center gap-1">
                                        {clickerConfig?.config?.isCooperative && (
                                            <span className="text-indigo-400 font-bold text-xs">
                                                🤝 Cliques Coletivos Somados
                                            </span>
                                        )}
                                        {clickerConfig?.config?.hideTarget ? (
                                            <span>Cliques: {currentClicks}</span>
                                        ) : (
                                            <span>{currentClicks} / {clickerConfig?.config?.targetClicks || 100}</span>
                                        )}
                                    </div>
                                </>
                            );
                        })()}
                    </>
                )}
            </div>
        </div>
    );
};
