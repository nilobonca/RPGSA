import React from 'react';
import { MinigameWindow } from './MinigameWindow';
import { useMinigamesStore } from '@/store/minigamesStore';
import { useThemeStore } from '@/store/themeStore';
import { MinigamePresetBar } from './MinigamePresetBar';
import { useIDB } from '@/utils/indexedDB';
import clsx from 'clsx';
import { MousePointerClick, Trophy, Timer, Image as ImageIcon, Upload, Shield, Play, Square, RotateCcw, Users, Eye, Hand } from 'lucide-react';

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 300;
        let { width, height } = img;
        if (width > height && width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      };
    };
  });
};

interface SessionListener {
  listenerId: string;
  name: string;
  status?: string;
}

export const ClickerMinigameHost: React.FC<{ id: string, sessionListeners?: SessionListener[] }> = ({ id, sessionListeners = [] }) => {
  const { activeGames, updateGame, playerProgress, broadcastEvent, clearProgress } = useMinigamesStore();
  const { theme } = useThemeStore();
  const { savedImages } = useIDB();
  const game = activeGames.find(g => g.id === id);

  if (!game) return null;

  const targetClicks = game.config?.targetClicks ?? 100;
  const timeLimit = game.config?.timeLimit ?? 30;
  const imageUrl = game.config?.imageUrl || '';
  const hideTarget = game.config?.hideTarget ?? false;
  const autoClose = game.config?.autoClose ?? false;
  const fadeoutTime = game.config?.fadeoutTime ?? 2;
  const isCooperative = game.config?.isCooperative ?? false;
  const permissions = game.config?.permissions || {};

  const handleStart = () => {
    clearProgress();
    updateGame(id, { status: 'running' });
    
    if (broadcastEvent) {
      broadcastEvent({
        type: 'minigame_start',
        payload: {
          gameId: id,
          gameType: 'clicker',
          title: game.config?.customTitle || undefined,
          description: game.config?.customSubtitle || undefined,
          config: { 
            targetClicks: parseInt(targetClicks as string) || 100, 
            timeLimit: parseInt(timeLimit as string) || 30, 
            imageUrl,
            hideTarget,
            autoClose,
            fadeoutTime,
            isCooperative,
            permissions
          }
        }
      });
    }

    // Auto-finish after time limit
    setTimeout(() => {
      updateGame(id, { status: 'finished' });
      if (broadcastEvent) {
        broadcastEvent({
          type: 'minigame_end',
          payload: { gameId: id }
        });
      }
    }, timeLimit * 1000);
  };

  const isEthereal = theme === 'ethereal';

  const glassInputClass = clsx(
    "w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400/50 transition-all font-sans text-sm",
    isEthereal 
      ? "bg-white/5 border-white/10 text-white placeholder-neutral-500" 
      : "bg-neutral-950/60 border-neutral-800 text-neutral-200 placeholder-neutral-500"
  );

  const totalCooperativeClicks = Object.values(playerProgress).reduce((acc, curr) => acc + (curr.clicks || 0), 0);
  const coopPercent = Math.min((totalCooperativeClicks / targetClicks) * 100, 100);

  return (
    <MinigameWindow id={id} title={game.title || "Desafio de Cliques"}>
      {(!game.status || game.status === 'idle') && (
        <div className="space-y-4 flex flex-col flex-1 overflow-y-auto pr-1">
          {/* Preset Manager Bar */}
          <div className="p-1 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
            <MinigamePresetBar activeGameId={id} gameId="clicker" currentConfig={game.config} />
          </div>

          {/* Custom Guest Title & Subtitle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 border border-white/10 rounded-2xl bg-neutral-950/40 backdrop-blur-md shadow-inner">
            <div>
              <label className="block text-xs mb-1 text-indigo-300/80 font-[Cinzel] font-semibold uppercase tracking-wider">
                Título para Convidados
              </label>
              <input 
                type="text" 
                placeholder="Padrão: Desafio de Cliques"
                className={clsx(glassInputClass, "text-xs py-1.5")}
                value={game.config?.customTitle || ''} 
                onChange={e => {
                  const val = e.target.value;
                  updateGame(id, { config: { ...game.config, customTitle: val } });
                }} 
              />
            </div>
            <div>
              <label className="block text-xs mb-1 text-indigo-300/80 font-[Cinzel] font-semibold uppercase tracking-wider">
                Subtítulo para Convidados
              </label>
              <input 
                type="text" 
                placeholder="Padrão: Clique o mais rápido..."
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
              <label className="block text-xs mb-1 text-neutral-300 font-[Cinzel] font-semibold uppercase tracking-wider flex items-center gap-1">
                <MousePointerClick size={12} className="text-indigo-400" />
                Cliques Necessários
              </label>
              <input 
                type="text" 
                className={clsx(glassInputClass, "font-['JetBrains_Mono']")}
                value={targetClicks} 
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  updateGame(id, { config: { ...game.config, targetClicks: val === '' ? '' : parseInt(val) } });
                }} 
              />
            </div>
            <div>
              <label className="block text-xs mb-1 text-neutral-300 font-[Cinzel] font-semibold uppercase tracking-wider flex items-center gap-1">
                <Timer size={12} className="text-indigo-400" />
                Tempo Limite (segundos)
              </label>
              <input 
                type="text" 
                className={clsx(glassInputClass, "font-['JetBrains_Mono']")}
                value={timeLimit} 
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  updateGame(id, { config: { ...game.config, timeLimit: val === '' ? '' : parseInt(val) } });
                }} 
              />
            </div>
          </div>

          {/* Central Image Picker */}
          <div className="p-3 border border-white/10 rounded-2xl bg-neutral-950/40 backdrop-blur-md space-y-2">
            <label className="block text-xs text-neutral-300 font-[Cinzel] font-semibold uppercase tracking-wider flex items-center gap-1">
              <ImageIcon size={12} className="text-indigo-400" />
              Imagem Central do Botão (Opcional)
            </label>
            <div className="flex gap-2">
              <select 
                className={clsx(glassInputClass, "flex-1 text-xs py-1.5")}
                value=""
                onChange={async e => {
                  const selectedId = parseInt(e.target.value);
                  if (isNaN(selectedId)) {
                    updateGame(id, { config: { ...game.config, imageUrl: '' } });
                    return;
                  }
                  const img = savedImages?.find(i => i.id === selectedId);
                  if (img?.file) {
                    const b64 = await compressImage(img.file);
                    updateGame(id, { config: { ...game.config, imageUrl: b64 } });
                  }
                }}
              >
                <option value="" className="bg-neutral-900 text-neutral-300">Selecionar da Galeria...</option>
                {savedImages?.map(img => (
                  <option key={img.id} value={img.id} className="bg-neutral-900 text-neutral-200">{img.name}</option>
                ))}
              </select>

              <label className="flex items-center gap-1.5 px-3 py-1.5 border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-medium text-neutral-200 rounded-xl cursor-pointer transition-colors">
                <Upload size={12} />
                Upload
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const b64 = await compressImage(file);
                    updateGame(id, { config: { ...game.config, imageUrl: b64 } });
                  }
                }} />
              </label>
            </div>
            <input 
              type="text" 
              placeholder="Ou cole uma URL https://..."
              className={clsx(glassInputClass, "text-xs py-1.5")}
              value={imageUrl} 
              onChange={e => updateGame(id, { config: { ...game.config, imageUrl: e.target.value } })} 
            />
          </div>

          {/* Options & Checkboxes */}
          <div className="space-y-2.5 p-3 border border-white/10 rounded-2xl bg-neutral-950/30 backdrop-blur-md">
            <label className="flex items-center gap-2.5 text-xs text-indigo-200 font-semibold cursor-pointer p-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/15 transition-colors">
              <input 
                type="checkbox" 
                className="rounded border-white/20 bg-neutral-900 text-indigo-500 focus:ring-indigo-500/20 w-4 h-4"
                checked={isCooperative}
                onChange={e => updateGame(id, { config: { ...game.config, isCooperative: e.target.checked } })}
              />
              <Users size={14} className="text-indigo-400" />
              <span>Modo Cooperativo (Somar cliques de todos os convidados)</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer hover:text-white transition-colors">
                <input 
                  type="checkbox" 
                  className="rounded border-white/20 bg-neutral-900 text-indigo-500 focus:ring-indigo-500/20"
                  checked={hideTarget}
                  onChange={e => updateGame(id, { config: { ...game.config, hideTarget: e.target.checked } })}
                />
                Esconder Alvo dos Jogadores
              </label>

              <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer hover:text-white transition-colors">
                <input 
                  type="checkbox" 
                  className="rounded border-white/20 bg-neutral-900 text-indigo-500 focus:ring-indigo-500/20"
                  checked={autoClose}
                  onChange={e => updateGame(id, { config: { ...game.config, autoClose: e.target.checked } })}
                />
                Auto-encerrar ao atingir alvo
              </label>
            </div>

            {autoClose && (
              <div className="flex items-center justify-between pl-6 gap-2 pt-1">
                <span className="text-xs text-neutral-400">Fadeout (segundos):</span>
                <input 
                  type="text" 
                  className={clsx(glassInputClass, "w-16 h-7 text-xs text-center p-0 font-['JetBrains_Mono']")}
                  value={fadeoutTime}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    updateGame(id, { config: { ...game.config, fadeoutTime: val === '' ? '' : parseInt(val) } });
                  }}
                />
              </div>
            )}
          </div>

          {/* Guest Permissions List */}
          <div className="p-3 border border-white/10 rounded-2xl bg-neutral-950/30 backdrop-blur-md">
            <div className="flex items-center gap-1.5 mb-2 text-neutral-300">
              <Shield size={14} className="text-indigo-400" />
              <label className="text-xs font-[Cinzel] font-bold uppercase tracking-wider">
                Permissões dos Convidados
              </label>
            </div>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {sessionListeners.map(listener => {
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
                          className="rounded border-white/20 bg-black/40 text-indigo-500 focus:ring-indigo-500/20"
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
                          className="rounded border-white/20 bg-black/40 text-indigo-500 focus:ring-indigo-500/20"
                          checked={p.canInteract} 
                          onChange={(e) => {
                            const newPerms = { ...permissions, [listener.listenerId]: { ...p, canInteract: e.target.checked } };
                            updateGame(id, { config: { ...game.config, permissions: newPerms } });
                            if (broadcastEvent) {
                              broadcastEvent({ type: 'update_clicker_permissions', payload: { gameId: id, permissions: newPerms } });
                            }
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
                  Nenhum convidado conectado no momento.
                </div>
              )}
            </div>
          </div>

          <div className="mt-auto pt-2">
            <button 
              onClick={handleStart}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-[Cinzel] font-bold tracking-wider uppercase rounded-xl shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
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
              <Trophy size={16} className="text-indigo-400" />
              <h3 className="text-xs text-indigo-200 font-[Cinzel] font-bold uppercase tracking-wider">
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

          {isCooperative && (
            <div className="p-3 rounded-2xl border border-indigo-500/30 bg-indigo-950/40 backdrop-blur-md space-y-2 shadow-inner">
              <div className="flex justify-between items-center text-xs text-indigo-200 font-bold">
                <span className="font-[Cinzel] tracking-wider uppercase flex items-center gap-1.5">
                  <Users size={14} className="text-indigo-400" />
                  Progresso Coletivo Total
                </span>
                <span className="font-['JetBrains_Mono'] text-indigo-300">
                  {totalCooperativeClicks} / {targetClicks} ({Math.round(coopPercent)}%)
                </span>
              </div>
              <div className="h-3 w-full bg-black/50 rounded-full overflow-hidden border border-indigo-500/30 p-0.5">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-300 shadow-[0_0_12px_rgba(99,102,241,0.5)]" 
                  style={{ width: `${coopPercent}%` }} 
                />
              </div>
            </div>
          )}
          
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {Object.entries(playerProgress).map(([listenerId, progress]) => {
              const clicks = progress.clicks || 0;
              const percent = Math.min((clicks / targetClicks) * 100, 100);
              
              return (
                <div key={listenerId} className="flex flex-col gap-1.5 p-2.5 rounded-2xl border border-white/10 bg-neutral-950/40 backdrop-blur-md">
                  <div className="flex justify-between items-center text-xs text-neutral-200">
                    <span className="font-medium truncate max-w-[150px]" title={listenerId}>
                      {progress.name || listenerId}
                    </span>
                    <span className="font-['JetBrains_Mono'] text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                      {clicks} / {targetClicks}
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-full overflow-hidden border border-white/10 bg-black/50 p-0.5">
                    <div 
                      className={clsx(
                        "h-full rounded-full transition-all duration-300 relative",
                        percent >= 100 ? "bg-gradient-to-r from-emerald-500 to-teal-400" : "bg-gradient-to-r from-indigo-500 to-purple-500"
                      )}
                      style={{ width: `${percent}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20" style={{ transform: 'skewX(-20deg) translateX(-100%)', animation: percent >= 100 ? 'shimmer 2s infinite' : 'none' }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {Object.keys(playerProgress).length === 0 && (
              <div className="flex flex-col items-center justify-center h-24 border border-dashed border-white/10 rounded-2xl bg-neutral-950/20">
                <MousePointerClick size={24} className="text-neutral-600 mb-1" />
                <p className="text-xs text-neutral-500 font-['JetBrains_Mono']">Aguardando cliques dos jogadores...</p>
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
                 onClick={() => updateGame(id, { status: 'idle' })}
                 className="w-full py-2.5 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 rounded-xl font-[Cinzel] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
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

