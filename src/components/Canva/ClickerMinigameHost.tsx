import React from 'react';
import { MinigameWindow } from './MinigameWindow';
import { useMinigamesStore } from '@/store/minigamesStore';
import { useThemeStore } from '@/store/themeStore';
import { MinigamePresetBar } from './MinigamePresetBar';
import { useIDB } from '@/utils/indexedDB';
import clsx from 'clsx';

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
  const inputClass = clsx(
    "w-full p-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500",
    isEthereal 
      ? "bg-white/5 border-white/10 text-white" 
      : "bg-neutral-800 border-neutral-700 text-neutral-200"
  );

  const totalCooperativeClicks = Object.values(playerProgress).reduce((acc, curr) => acc + (curr.clicks || 0), 0);
  const coopPercent = Math.min((totalCooperativeClicks / targetClicks) * 100, 100);

  return (
    <MinigameWindow id={id} title={game.title || "Desafio de Cliques"}>
      {(!game.status || game.status === 'idle') && (
        <div className="space-y-4 flex flex-col flex-1 overflow-y-auto">
          {/* Preset Manager Bar */}
          <MinigamePresetBar activeGameId={id} gameId="clicker" currentConfig={game.config} />

          {/* Custom Guest Title & Subtitle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 border border-neutral-700/60 rounded-xl bg-neutral-900/40">
            <div>
              <label className="block text-xs mb-1 text-neutral-400 font-semibold">Título para Convidados</label>
              <input 
                type="text" 
                placeholder="Padrão: Desafio de Cliques"
                className={clsx(inputClass, "text-xs py-1")}
                value={game.config?.customTitle || ''} 
                onChange={e => {
                  const val = e.target.value;
                  updateGame(id, { config: { ...game.config, customTitle: val } });
                }} 
              />
            </div>
            <div>
              <label className="block text-xs mb-1 text-neutral-400 font-semibold">Subtítulo para Convidados</label>
              <input 
                type="text" 
                placeholder="Padrão: Clique o mais rápido..."
                className={clsx(inputClass, "text-xs py-1")}
                value={game.config?.customSubtitle || ''} 
                onChange={e => {
                  const val = e.target.value;
                  updateGame(id, { config: { ...game.config, customSubtitle: val } });
                }} 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1 text-neutral-400">Cliques Necessários</label>
            <input 
              type="text" 
              className={inputClass}
              value={targetClicks} 
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '');
                updateGame(id, { config: { ...game.config, targetClicks: val === '' ? '' : parseInt(val) } });
              }} 
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-neutral-400">Tempo Limite (segundos)</label>
            <input 
              type="text" 
              className={inputClass}
              value={timeLimit} 
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '');
                updateGame(id, { config: { ...game.config, timeLimit: val === '' ? '' : parseInt(val) } });
              }} 
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-neutral-400">Imagem (Centro)</label>
            <div className="flex gap-2">
              <select 
                className={clsx(inputClass, "flex-1 text-sm")}
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
                <option value="">Selecionar da Galeria...</option>
                {savedImages?.map(img => (
                  <option key={img.id} value={img.id}>{img.name}</option>
                ))}
              </select>
              <label className={clsx("flex items-center justify-center px-3 border rounded-lg cursor-pointer transition-colors text-sm", isEthereal ? "bg-white/5 border-white/10 text-white hover:bg-white/10" : "bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700")}>
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
              className={clsx(inputClass, "mt-2")}
              value={imageUrl} 
              onChange={e => updateGame(id, { config: { ...game.config, imageUrl: e.target.value } })} 
            />
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-2 text-sm text-neutral-200 font-semibold cursor-pointer p-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10">
              <input 
                type="checkbox" 
                className="rounded border-neutral-700 bg-neutral-800 text-indigo-500 focus:ring-indigo-500/20 w-4 h-4"
                checked={isCooperative}
                onChange={e => updateGame(id, { config: { ...game.config, isCooperative: e.target.checked } })}
              />
              <span>Modo Cooperativo (Somar cliques de todos os convidados)</span>
            </label>

            <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
              <input 
                type="checkbox" 
                className="rounded border-neutral-700 bg-neutral-800 text-blue-500 focus:ring-blue-500/20"
                checked={hideTarget}
                onChange={e => updateGame(id, { config: { ...game.config, hideTarget: e.target.checked } })}
              />
              Esconder Número Alvo dos Jogadores
            </label>

            <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
              <input 
                type="checkbox" 
                className="rounded border-neutral-700 bg-neutral-800 text-blue-500 focus:ring-blue-500/20"
                checked={autoClose}
                onChange={e => updateGame(id, { config: { ...game.config, autoClose: e.target.checked } })}
              />
              Auto-encerrar ao atingir os cliques
            </label>

            {autoClose && (
              <div className="flex items-center justify-between pl-6 gap-2">
                <span className="text-xs text-neutral-400">Tempo do Fadeout (segundos):</span>
                <input 
                  type="text" 
                  className={clsx(inputClass, "w-16 h-8 text-xs text-center p-0")}
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
          <div>
            <label className="block text-sm mb-2 text-neutral-400 font-semibold">Permissões dos Convidados</label>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
              {sessionListeners.map(listener => {
                const p = permissions[listener.listenerId] || { canSee: true, canInteract: true };
                return (
                  <div key={listener.listenerId} className={clsx("flex items-center justify-between p-2 rounded-lg border", isEthereal ? "border-white/10 bg-white/5" : "border-neutral-700 bg-neutral-800")}>
                    <span className="text-xs font-medium truncate max-w-[110px]" title={listener.name}>{listener.name || listener.listenerId}</span>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-1 text-xs text-neutral-300 cursor-pointer">
                        <input type="checkbox" checked={p.canSee} onChange={(e) => {
                          const newPerms = { ...permissions, [listener.listenerId]: { ...p, canSee: e.target.checked } };
                          updateGame(id, { config: { ...game.config, permissions: newPerms } });
                          if (broadcastEvent) {
                            broadcastEvent({ type: 'update_clicker_permissions', payload: { gameId: id, permissions: newPerms } });
                          }
                        }} />
                        Ver
                      </label>
                      <label className="flex items-center gap-1 text-xs text-neutral-300 cursor-pointer">
                        <input type="checkbox" checked={p.canInteract} onChange={(e) => {
                          const newPerms = { ...permissions, [listener.listenerId]: { ...p, canInteract: e.target.checked } };
                          updateGame(id, { config: { ...game.config, permissions: newPerms } });
                          if (broadcastEvent) {
                            broadcastEvent({ type: 'update_clicker_permissions', payload: { gameId: id, permissions: newPerms } });
                          }
                        }} />
                        Interagir
                      </label>
                    </div>
                  </div>
                );
              })}
              {sessionListeners.length === 0 && (
                <div className="text-xs text-neutral-500 italic p-3 border border-dashed border-neutral-700/60 rounded-xl text-center">
                  Nenhum convidado conectado no momento.
                </div>
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
            <h3 className="text-sm text-neutral-400 font-medium">Progresso dos Jogadores</h3>
            {game.status === 'finished' && (
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/20">Finalizado</span>
            )}
            {game.status === 'running' && (
              <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full border border-amber-500/20">Em andamento</span>
            )}
          </div>

          {isCooperative && (
            <div className="p-3 rounded-xl border border-indigo-500/40 bg-indigo-950/40 space-y-1.5">
              <div className="flex justify-between text-xs text-indigo-200 font-bold">
                <span>🤝 Progresso Coletivo Total</span>
                <span className="font-mono">{totalCooperativeClicks} / {targetClicks} ({Math.round(coopPercent)}%)</span>
              </div>
              <div className="h-3 w-full bg-neutral-900 rounded-full overflow-hidden border border-indigo-500/30">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300" style={{ width: `${coopPercent}%` }} />
              </div>
            </div>
          )}
          
          <div className="space-y-3 flex-1 overflow-y-auto pr-1 scrollbar-thin">
            {Object.entries(playerProgress).map(([listenerId, progress]) => {
              const clicks = progress.clicks || 0;
              const percent = Math.min((clicks / targetClicks) * 100, 100);
              
              return (
                <div key={listenerId} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs text-neutral-300">
                    <span className="truncate max-w-[150px]" title={listenerId}>{progress.name || listenerId}</span>
                    <span className="font-mono">{clicks} / {targetClicks}</span>
                  </div>
                  <div className={clsx(
                    "h-2.5 w-full rounded-full overflow-hidden border",
                    isEthereal ? "bg-black/50 border-white/10" : "bg-neutral-800 border-neutral-700"
                  )}>
                    <div 
                      className={clsx(
                        "h-full transition-all duration-300 relative",
                        percent >= 100 ? "bg-emerald-500" : "bg-blue-500"
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
              <div className="flex items-center justify-center h-20 border border-dashed border-neutral-700 rounded-lg">
                <p className="text-xs text-neutral-500 italic">Aguardando cliques...</p>
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
                 onClick={() => updateGame(id, { status: 'idle' })}
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
