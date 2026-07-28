import React from 'react';
import { MinigameWindow } from './MinigameWindow';
import { useMinigamesStore } from '@/store/minigamesStore';
import { useThemeStore } from '@/store/themeStore';
import { MinigamePresetBar } from './MinigamePresetBar';
import clsx from 'clsx';
import { Coins, Sparkles, Zap, Shield, Play, Square, RotateCcw, Eye, Hand } from 'lucide-react';

interface SessionListener {
  listenerId: string;
  name: string;
  status?: string;
}

export const CoinFlipMinigameHost: React.FC<{ id: string, sessionListeners: SessionListener[] }> = ({ id, sessionListeners }) => {
  const { activeGames, updateGame, playerProgress, broadcastEvent, clearProgress } = useMinigamesStore();
  const { theme } = useThemeStore();
  const game = activeGames.find(g => g.id === id);

  if (!game) return null;

  const maxFlips = game.config?.maxFlips ?? 1;
  const permissions = game.config?.permissions || {};
  const predefinedResult = game.config?.predefinedResult || 'random';

  const handleStart = () => {
    clearProgress();
    updateGame(id, { status: 'running' });
    
    if (broadcastEvent) {
      broadcastEvent({
        type: 'minigame_start',
        payload: {
          gameId: id,
          gameType: 'coin_flip',
          title: game.config?.customTitle || undefined,
          description: game.config?.customSubtitle || undefined,
          config: { 
            maxFlips: parseInt(maxFlips as string) || 1,
            permissions,
            predefinedResult
          }
        }
      });
    }
  };

  const handleForceResult = (result: 'heads' | 'tails') => {
    if (broadcastEvent) {
      broadcastEvent({
        type: 'force_coin_result',
        payload: {
          gameId: id,
          result
        }
      });
    }
  };

  const isEthereal = theme === 'ethereal';

  const glassInputClass = clsx(
    "w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400/50 transition-all font-sans text-sm",
    isEthereal 
      ? "bg-white/5 border-white/10 text-white placeholder-neutral-500" 
      : "bg-neutral-950/60 border-neutral-800 text-neutral-200 placeholder-neutral-500"
  );

  return (
    <MinigameWindow id={id} title={game.title || "Cara ou Coroa"}>
      {(!game.status || game.status === 'idle') && (
        <div className="space-y-4 flex flex-col flex-1 overflow-y-auto pr-1">
          {/* Preset Manager Bar */}
          <div className="p-1 rounded-xl bg-amber-500/5 border border-amber-500/10">
            <MinigamePresetBar activeGameId={id} gameId="coin_flip" currentConfig={game.config} />
          </div>

          {/* Custom Guest Title & Subtitle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 border border-white/10 rounded-2xl bg-neutral-950/40 backdrop-blur-md shadow-inner">
            <div>
              <label className="block text-xs mb-1 text-amber-300/80 font-[Cinzel] font-semibold uppercase tracking-wider">
                Título para Convidados
              </label>
              <input 
                type="text" 
                placeholder="Padrão: Cara ou Coroa"
                className={clsx(glassInputClass, "text-xs py-1.5")}
                value={game.config?.customTitle || ''} 
                onChange={e => {
                  const val = e.target.value;
                  updateGame(id, { config: { ...game.config, customTitle: val } });
                }} 
              />
            </div>
            <div>
              <label className="block text-xs mb-1 text-amber-300/80 font-[Cinzel] font-semibold uppercase tracking-wider">
                Subtítulo para Convidados
              </label>
              <input 
                type="text" 
                placeholder="Padrão: Clique na moeda..."
                className={clsx(glassInputClass, "text-xs py-1.5")}
                value={game.config?.customSubtitle || ''} 
                onChange={e => {
                  const val = e.target.value;
                  updateGame(id, { config: { ...game.config, customSubtitle: val } });
                }} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1 text-neutral-300 font-[Cinzel] font-semibold uppercase tracking-wider">
                Máximo de Giros
              </label>
              <input 
                type="number" 
                className={clsx(glassInputClass, "font-['JetBrains_Mono']")}
                value={maxFlips} 
                onChange={e => {
                  const val = e.target.value;
                  updateGame(id, { config: { ...game.config, maxFlips: val === '' ? '' : parseInt(val) } });
                }} 
              />
            </div>

            <div>
              <label className="block text-xs mb-1 text-neutral-300 font-[Cinzel] font-semibold uppercase tracking-wider">
                Resultado Predefinido
              </label>
              <select
                className={glassInputClass}
                value={predefinedResult}
                onChange={e => updateGame(id, { config: { ...game.config, predefinedResult: e.target.value } })}
              >
                <option value="random" className="bg-neutral-900 text-neutral-200">Aleatório (Sorte)</option>
                <option value="heads" className="bg-neutral-900 text-yellow-300">Sempre Cara (👑)</option>
                <option value="tails" className="bg-neutral-900 text-zinc-300">Sempre Coroa (🪙)</option>
              </select>
            </div>
          </div>
          
          {/* Guest Permissions */}
          <div className="p-3 border border-white/10 rounded-2xl bg-neutral-950/30 backdrop-blur-md">
            <div className="flex items-center gap-1.5 mb-2 text-neutral-300">
              <Shield size={14} className="text-amber-400" />
              <label className="text-xs font-[Cinzel] font-bold uppercase tracking-wider">
                Permissões dos Jogadores
              </label>
            </div>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {sessionListeners.map(listener => {
                const p = permissions[listener.listenerId] || { canSee: true, canInteract: false };
                return (
                  <div key={listener.listenerId} className="flex items-center justify-between p-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md">
                    <span className="text-xs font-medium text-neutral-200 truncate max-w-[110px]" title={listener.name}>
                      {listener.name || listener.listenerId}
                    </span>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white cursor-pointer transition-colors">
                        <input 
                          type="checkbox" 
                          className="rounded border-white/20 bg-black/40 text-amber-500 focus:ring-amber-500/20"
                          checked={p.canSee} 
                          onChange={(e) => {
                            const newPerms = { ...permissions, [listener.listenerId]: { ...p, canSee: e.target.checked } };
                            updateGame(id, { config: { ...game.config, permissions: newPerms } });
                          }} 
                        />
                        <Eye size={12} /> Ver
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white cursor-pointer transition-colors">
                        <input 
                          type="checkbox" 
                          className="rounded border-white/20 bg-black/40 text-amber-500 focus:ring-amber-500/20"
                          checked={p.canInteract} 
                          onChange={(e) => {
                            const newPerms = { ...permissions, [listener.listenerId]: { ...p, canInteract: e.target.checked } };
                            updateGame(id, { config: { ...game.config, permissions: newPerms } });
                          }} 
                        />
                        <Hand size={12} /> Interagir
                      </label>
                    </div>
                  </div>
                );
              })}
              {sessionListeners.length === 0 && (
                <div className="text-xs text-neutral-500 italic p-3 border border-dashed border-neutral-800 rounded-xl text-center">
                  Nenhum jogador na sessão no momento.
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-auto pt-2">
            <button 
              onClick={handleStart}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-neutral-950 font-[Cinzel] font-bold tracking-wider uppercase rounded-xl shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Play size={16} fill="currentColor" />
              Iniciar Desafio
            </button>
          </div>
        </div>
      )}
      
      {(game.status === 'running' || game.status === 'finished') && (
        <div className="space-y-4 flex flex-col flex-1">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <Coins size={16} className="text-amber-400" />
              <h3 className="text-xs text-amber-200 font-[Cinzel] font-bold uppercase tracking-wider">
                Progresso dos Jogadores
              </h3>
            </div>
            {game.status === 'finished' && (
              <span className="text-xs font-[Cinzel] font-bold uppercase bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                Finalizado
              </span>
            )}
            {game.status === 'running' && (
              <span className="text-xs font-[Cinzel] font-bold uppercase bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30 animate-pulse">
                Em andamento
              </span>
            )}
          </div>
          
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {Object.entries(playerProgress).map(([listenerId, progress]) => {
              const flips = progress.clicks || 0;
              return (
                <div key={listenerId} className="flex flex-col gap-2 p-3 rounded-2xl border border-white/10 bg-neutral-950/40 backdrop-blur-md shadow-md">
                  <div className="flex justify-between items-center text-xs text-neutral-200">
                    <span className="font-medium truncate max-w-[150px]" title={listenerId}>
                      {progress.name || listenerId}
                    </span>
                    <span className="font-['JetBrains_Mono'] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      {flips} / {maxFlips} giros
                    </span>
                  </div>

                  {progress.coinResult && (
                    <div className={clsx(
                      "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-inner",
                      progress.coinResult === 'heads' 
                        ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/10 text-yellow-300 border border-yellow-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]" 
                        : "bg-gradient-to-r from-zinc-500/20 to-slate-500/10 text-zinc-200 border border-zinc-500/40 shadow-[0_0_15px_rgba(212,212,216,0.15)]"
                    )}>
                      <div className="flex items-center gap-2">
                        <span className="text-base">{progress.coinResult === 'heads' ? '👑' : '🪙'}</span>
                        <span className="font-[Cinzel] tracking-wider uppercase text-sm">
                          {progress.coinResult === 'heads' ? 'Cara (Heads)' : 'Coroa (Tails)'}
                        </span>
                      </div>
                      <Sparkles size={14} className={progress.coinResult === 'heads' ? 'text-yellow-400' : 'text-zinc-300'} />
                    </div>
                  )}

                  {progress.spinning && !progress.coinResult && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      <Coins size={16} className="animate-spin text-amber-400" />
                      <span className="font-['JetBrains_Mono'] animate-pulse">Girando moeda...</span>
                    </div>
                  )}

                  {game.status === 'running' && progress.spinning && !progress.coinResult && (
                    <div className="flex gap-2 mt-1">
                      <button 
                        onClick={() => handleForceResult('heads')} 
                        className="flex-1 py-1.5 text-xs bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/40 rounded-xl transition-all font-semibold font-[Cinzel] uppercase tracking-wider flex items-center justify-center gap-1 active:scale-95"
                      >
                        <Zap size={12} /> Forçar Cara
                      </button>
                      <button 
                        onClick={() => handleForceResult('tails')} 
                        className="flex-1 py-1.5 text-xs bg-zinc-500/20 hover:bg-zinc-500/30 text-zinc-200 border border-zinc-500/40 rounded-xl transition-all font-semibold font-[Cinzel] uppercase tracking-wider flex items-center justify-center gap-1 active:scale-95"
                      >
                        <Zap size={12} /> Forçar Coroa
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            
            {Object.keys(playerProgress).length === 0 && (
              <div className="flex flex-col items-center justify-center h-24 border border-dashed border-white/10 rounded-2xl bg-neutral-950/20">
                <Coins size={24} className="text-neutral-600 mb-1" />
                <p className="text-xs text-neutral-500 font-['JetBrains_Mono']">Aguardando jogadas dos convidados...</p>
              </div>
            )}
          </div>

          <div className="mt-auto pt-2">
            {game.status === 'running' && (
               <button 
                 onClick={() => {
                   updateGame(id, { status: 'finished' });
                   if (broadcastEvent) broadcastEvent({ type: 'minigame_end', payload: { gameId: id } });
                 }}
                 className="w-full py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl font-[Cinzel] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-500/10 active:scale-95"
               >
                 <Square size={14} fill="currentColor" />
                 Encerrar Agora
               </button>
            )}
            {game.status === 'finished' && (
               <button 
                 onClick={() => {
                   clearProgress();
                   updateGame(id, { status: 'idle' });
                 }}
                 className="w-full py-2.5 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-xl font-[Cinzel] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
               >
                 <RotateCcw size={14} />
                 Novo Desafio
               </button>
            )}
          </div>
        </div>
      )}
    </MinigameWindow>
  );
};

