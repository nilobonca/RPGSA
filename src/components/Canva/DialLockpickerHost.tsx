import React from 'react';
import { MinigameWindow } from './MinigameWindow';
import { useMinigamesStore } from '@/store/minigamesStore';
import { useThemeStore } from '@/store/themeStore';
import { MinigamePresetBar } from './MinigamePresetBar';
import clsx from 'clsx';
import { KeyRound, Shield, Play, Square, RotateCcw, Lock, Unlock, AlertTriangle, Users, Eye, Hand } from 'lucide-react';

interface SessionListener {
  listenerId: string;
  name: string;
  status?: string;
}

export const DialLockpickerHost: React.FC<{ id: string; sessionListeners?: SessionListener[] }> = ({
  id,
  sessionListeners = []
}) => {
  const { activeGames, updateGame, playerProgress, broadcastEvent, clearProgress } = useMinigamesStore();
  const { theme } = useThemeStore();
  const game = activeGames.find((g) => g.id === id);

  if (!game) return null;

  const stages = game.config?.stages ?? 3;
  const tolerance = game.config?.tolerance ?? 6;
  const maxAttempts = game.config?.maxAttempts ?? 5;
  const fakeSpotsCount = game.config?.fakeSpotsCount ?? 0;
  const permissions = game.config?.permissions || {};

  const handleStart = () => {
    clearProgress();
    updateGame(id, { status: 'running' });

    if (broadcastEvent) {
      broadcastEvent({
        type: 'minigame_start',
        payload: {
          gameId: id,
          gameType: 'dial_lock',
          title: game.config?.customTitle || 'Decodificador de Fechadura Rúnica',
          description: game.config?.customSubtitle || 'Posicione a agulha, encontre o ponto pelo tremor e gire o cilindro!',
          config: {
            stages: parseInt(stages as string) || 3,
            tolerance: parseInt(tolerance as string) || 6,
            maxAttempts: parseInt(maxAttempts as string) || 5,
            fakeSpotsCount: parseInt(fakeSpotsCount as string) || 0,
            permissions
          }
        }
      });
    }
  };

  const isEthereal = theme === 'ethereal';

  const glassInputClass = clsx(
    'w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400/50 transition-all font-sans text-sm',
    isEthereal
      ? 'bg-white/5 border-white/10 text-white placeholder-neutral-500'
      : 'bg-neutral-950/60 border-neutral-800 text-neutral-200 placeholder-neutral-500'
  );

  return (
    <MinigameWindow id={id} title={game.title || 'Lockpicker de Precisão'}>
      {(!game.status || game.status === 'idle') && (
        <div className="space-y-4 flex flex-col flex-1 overflow-y-auto pr-1">
          {/* Preset Manager Bar */}
          <div className="p-1 rounded-xl bg-amber-500/5 border border-amber-500/10">
            <MinigamePresetBar activeGameId={id} gameId="dial_lock" currentConfig={game.config} />
          </div>

          {/* Título & Subtítulo para Convidados */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 border border-white/10 rounded-2xl bg-neutral-950/40 backdrop-blur-md shadow-inner">
            <div>
              <label className="block text-xs mb-1 text-amber-300/80 font-semibold uppercase tracking-wider">
                Título para Convidados
              </label>
              <input
                type="text"
                placeholder="Padrão: Decodificador de Fechadura Rúnica"
                className={clsx(glassInputClass, 'text-xs py-1.5')}
                value={game.config?.customTitle || ''}
                onChange={(e) => updateGame(id, { config: { ...game.config, customTitle: e.target.value } })}
              />
            </div>
            <div>
              <label className="block text-xs mb-1 text-amber-300/80 font-semibold uppercase tracking-wider">
                Subtítulo para Convidados
              </label>
              <input
                type="text"
                placeholder="Padrão: Encontre o ponto exato..."
                className={clsx(glassInputClass, 'text-xs py-1.5')}
                value={game.config?.customSubtitle || ''}
                onChange={(e) => updateGame(id, { config: { ...game.config, customSubtitle: e.target.value } })}
              />
            </div>
          </div>

          {/* Configurações de Dificuldade do Lockpick */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs mb-1 text-neutral-300 font-semibold uppercase tracking-wider flex items-center gap-1">
                <Lock size={12} className="text-amber-400" />
                Nº Pinos
              </label>
              <input
                type="text"
                className={clsx(glassInputClass, "font-['JetBrains_Mono']")}
                value={stages}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  updateGame(id, { config: { ...game.config, stages: val === '' ? '' : Math.max(1, Math.min(6, parseInt(val))) } });
                }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1 text-neutral-300 font-semibold uppercase tracking-wider flex items-center gap-1">
                <KeyRound size={12} className="text-amber-400" />
                Tolerância (°)
              </label>
              <input
                type="text"
                className={clsx(glassInputClass, "font-['JetBrains_Mono']")}
                value={tolerance}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  updateGame(id, { config: { ...game.config, tolerance: val === '' ? '' : Math.max(2, Math.min(20, parseInt(val))) } });
                }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1 text-neutral-300 font-semibold uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle size={12} className="text-amber-400" />
                Tentativas
              </label>
              <input
                type="text"
                className={clsx(glassInputClass, "font-['JetBrains_Mono']")}
                value={maxAttempts}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  updateGame(id, { config: { ...game.config, maxAttempts: val === '' ? '' : Math.max(1, Math.min(10, parseInt(val))) } });
                }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1 text-amber-300 font-semibold uppercase tracking-wider flex items-center gap-1" title="Pontos adicionais onde a agulha estabiliza mas a chave não gira">
                <Shield size={12} className="text-amber-400" />
                Pinos Falsos
              </label>
              <input
                type="text"
                placeholder="0"
                className={clsx(glassInputClass, "font-['JetBrains_Mono'] border-amber-500/30 text-amber-200")}
                value={fakeSpotsCount}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  updateGame(id, { config: { ...game.config, fakeSpotsCount: val === '' ? '' : Math.max(0, Math.min(5, parseInt(val))) } });
                }}
              />
            </div>
          </div>

          {/* Permissões dos Convidados */}
          <div className="p-3 border border-white/10 rounded-2xl bg-neutral-950/30 backdrop-blur-md">
            <div className="flex items-center gap-1.5 mb-2 text-neutral-300">
              <Shield size={14} className="text-amber-400" />
              <label className="text-xs font-bold uppercase tracking-wider">Permissões dos Convidados</label>
            </div>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {sessionListeners.map((listener) => {
                const p = permissions[listener.listenerId] || { canSee: true, canInteract: true };
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
                            if (broadcastEvent) {
                              broadcastEvent({ type: 'update_clicker_permissions', payload: { gameId: id, permissions: newPerms } });
                            }
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
                            if (broadcastEvent) {
                              broadcastEvent({ type: 'update_clicker_permissions', payload: { gameId: id, permissions: newPerms } });
                            }
                          }}
                        />
                        <Hand size={12} /> Jogar
                      </label>
                    </div>
                  </div>
                );
              })}
              {sessionListeners.length === 0 && (
                <div className="text-xs text-neutral-500 italic p-3 border border-dashed border-neutral-800 rounded-xl text-center">
                  Nenhum convidado conectado no momento.
                </div>
              )}
            </div>
          </div>

          <div className="mt-auto pt-2">
            <button
              onClick={handleStart}
              className="w-full py-2.5 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-bold tracking-wider uppercase rounded-xl shadow-lg shadow-amber-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Play size={16} fill="currentColor" />
              Iniciar Desafio de Lockpick
            </button>
          </div>
        </div>
      )}

      {(game.status === 'running' || game.status === 'finished') && (
        <div className="space-y-4 flex flex-col flex-1">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <KeyRound size={16} className="text-amber-400" />
              <h3 className="text-xs text-amber-200 font-bold uppercase tracking-wider">Progresso dos Lockpickers</h3>
            </div>
            {game.status === 'finished' && (
              <span className="text-xs font-bold uppercase bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Finalizado
              </span>
            )}
            {game.status === 'running' && (
              <span className="text-xs font-bold uppercase bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30 animate-pulse">
                Em andamento
              </span>
            )}
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {Object.entries(playerProgress).map(([listenerId, progress]) => {
              const completedPins = progress.clicks || 0;
              const statusStr = progress.coinResult || 'jogando';
              const percent = Math.min((completedPins / stages) * 100, 100);

              return (
                <div key={listenerId} className="flex flex-col gap-1.5 p-2.5 rounded-2xl border border-white/10 bg-neutral-950/40 backdrop-blur-md">
                  <div className="flex justify-between items-center text-xs text-neutral-200">
                    <span className="font-medium truncate max-w-[150px]" title={listenerId}>
                      {progress.name || listenerId}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                        {completedPins} / {stages} Pinos
                      </span>
                      {statusStr === 'success' && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                          <Unlock size={10} /> Aberto
                        </span>
                      )}
                      {statusStr === 'failed' && (
                        <span className="text-[10px] font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/30 flex items-center gap-1">
                          <Lock size={10} /> Quebrou
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-2.5 w-full rounded-full overflow-hidden border border-white/10 bg-black/50 p-0.5">
                    <div
                      className={clsx(
                        'h-full rounded-full transition-all duration-300',
                        statusStr === 'success'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                          : statusStr === 'failed'
                          ? 'bg-rose-600 opacity-60'
                          : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                      )}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {Object.keys(playerProgress).length === 0 && (
              <div className="flex flex-col items-center justify-center h-24 border border-dashed border-white/10 rounded-2xl bg-neutral-950/20">
                <KeyRound size={24} className="text-neutral-600 mb-1" />
                <p className="text-xs text-neutral-500 font-mono">Aguardando tentativas dos jogadores...</p>
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
                className="w-full py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Square size={14} fill="currentColor" />
                Encerrar Desafio
              </button>
            )}
            {game.status === 'finished' && (
              <button
                onClick={() => updateGame(id, { status: 'idle' })}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-xl font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95"
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
