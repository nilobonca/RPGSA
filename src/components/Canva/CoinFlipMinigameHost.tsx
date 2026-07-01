import React from 'react';
import { MinigameWindow } from './MinigameWindow';
import { useMinigamesStore } from '@/store/minigamesStore';
import { useThemeStore } from '@/store/themeStore';
import clsx from 'clsx';

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
  const inputClass = clsx(
    "w-full p-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500",
    isEthereal 
      ? "bg-white/5 border-white/10 text-white" 
      : "bg-neutral-800 border-neutral-700 text-neutral-200"
  );

  return (
    <MinigameWindow id={id} title={game.title || "Cara ou Coroa"}>
      {(!game.status || game.status === 'idle') && (
        <div className="space-y-4 flex flex-col flex-1">
          <div>
            <label className="block text-sm mb-1 text-neutral-400">Máximo de Giros</label>
            <input 
              type="number" 
              className={inputClass}
              value={maxFlips} 
              onChange={e => {
                const val = e.target.value;
                updateGame(id, { config: { ...game.config, maxFlips: val === '' ? '' : parseInt(val) } });
              }} 
            />
          </div>
          
          <div>
            <label className="block text-sm mb-1 text-neutral-400">Resultado Predefinido</label>
            <select
              className={inputClass}
              value={predefinedResult}
              onChange={e => updateGame(id, { config: { ...game.config, predefinedResult: e.target.value } })}
            >
              <option value="random">Aleatório</option>
              <option value="heads">Sempre Cara</option>
              <option value="tails">Sempre Coroa</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm mb-2 text-neutral-400">Permissões dos Jogadores</label>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {sessionListeners.map(listener => {
                const p = permissions[listener.listenerId] || { canSee: true, canInteract: false };
                return (
                  <div key={listener.listenerId} className={clsx("flex items-center justify-between p-2 rounded border", isEthereal ? "border-white/10 bg-white/5" : "border-neutral-700 bg-neutral-800")}>
                    <span className="text-sm truncate max-w-[100px]" title={listener.name}>{listener.name || listener.listenerId}</span>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1 text-xs text-neutral-400">
                        <input type="checkbox" checked={p.canSee} onChange={(e) => {
                          const newPerms = { ...permissions, [listener.listenerId]: { ...p, canSee: e.target.checked } };
                          updateGame(id, { config: { ...game.config, permissions: newPerms } });
                        }} />
                        Ver
                      </label>
                      <label className="flex items-center gap-1 text-xs text-neutral-400">
                        <input type="checkbox" checked={p.canInteract} onChange={(e) => {
                          const newPerms = { ...permissions, [listener.listenerId]: { ...p, canInteract: e.target.checked } };
                          updateGame(id, { config: { ...game.config, permissions: newPerms } });
                        }} />
                        Interagir
                      </label>
                    </div>
                  </div>
                );
              })}
              {sessionListeners.length === 0 && (
                <div className="text-xs text-neutral-500 italic">Nenhum jogador na sessão.</div>
              )}
            </div>
          </div>
          
          <div className="mt-auto pt-4">
            <button 
              onClick={handleStart}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Iniciar Desafio
            </button>
          </div>
        </div>
      )}
      
      {(game.status === 'running' || game.status === 'finished') && (
        <div className="space-y-4 flex flex-col flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm text-neutral-400 font-medium">Progresso</h3>
            {game.status === 'finished' && (
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/20">Finalizado</span>
            )}
            {game.status === 'running' && (
              <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full border border-amber-500/20">Em andamento</span>
            )}
          </div>
          
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {Object.entries(playerProgress).map(([listenerId, progress]) => {
              const flips = progress.clicks || 0;
              return (
                <div key={listenerId} className="flex flex-col gap-1.5 p-2 rounded border border-neutral-700 bg-neutral-800/50">
                  <div className="flex justify-between text-xs text-neutral-300">
                    <span className="truncate max-w-[150px]" title={listenerId}>{progress.name || listenerId}</span>
                    <span className="font-mono">{flips} / {maxFlips} giros</span>
                  </div>
                  {progress.coinResult && (
                    <div className={clsx(
                      "flex items-center gap-2 mt-1 px-2 py-1.5 rounded text-sm font-medium",
                      progress.coinResult === 'heads' 
                        ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30" 
                        : "bg-zinc-500/20 text-zinc-300 border border-zinc-500/30"
                    )}>
                      <span className="text-base">{progress.coinResult === 'heads' ? '👑' : '🪙'}</span>
                      <span>{progress.coinResult === 'heads' ? 'Cara' : 'Coroa'}</span>
                    </div>
                  )}
                  {progress.spinning && !progress.coinResult && (
                    <div className="flex items-center gap-2 mt-1 px-2 py-1.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <span className="animate-spin text-base">🪙</span>
                      <span>Girando...</span>
                    </div>
                  )}
                  {game.status === 'running' && progress.spinning && !progress.coinResult && (
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleForceResult('heads')} className="flex-1 py-1.5 text-xs bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-400 border border-yellow-500/30 rounded transition-colors font-medium">
                        ⚡ Forçar Cara
                      </button>
                      <button onClick={() => handleForceResult('tails')} className="flex-1 py-1.5 text-xs bg-zinc-600/20 hover:bg-zinc-600/40 text-zinc-400 border border-zinc-500/30 rounded transition-colors font-medium">
                        ⚡ Forçar Coroa
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            
            {Object.keys(playerProgress).length === 0 && (
              <div className="flex items-center justify-center h-20 border border-dashed border-neutral-700 rounded-lg">
                <p className="text-xs text-neutral-500 italic">Aguardando jogadas...</p>
              </div>
            )}
          </div>

          <div className="mt-auto pt-4">
            {game.status === 'running' && (
               <button 
                 onClick={() => {
                   updateGame(id, { status: 'finished' });
                   if (broadcastEvent) broadcastEvent({ type: 'minigame_end', payload: { gameId: id } });
                 }}
                 className="w-full py-2 bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 border border-rose-500/30 rounded-lg font-medium transition-colors mb-2"
               >
                 Encerrar Agora
               </button>
            )}
            {game.status === 'finished' && (
               <button 
                 onClick={() => {
                   clearProgress();
                   updateGame(id, { status: 'idle' });
                 }}
                 className={clsx(
                   "w-full py-2 rounded-lg font-medium transition-colors border",
                   isEthereal ? "bg-white/5 border-white/10 text-white hover:bg-white/10" : "bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700"
                 )}
               >
                 Novo Desafio
               </button>
            )}
          </div>
        </div>
      )}
    </MinigameWindow>
  );
};
