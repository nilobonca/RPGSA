import React, { useEffect } from 'react';
import { MinigameWindow } from './MinigameWindow';
import { useMinigamesStore } from '@/store/minigamesStore';
import { useThemeStore } from '@/store/themeStore';
import { useIDB } from '@/utils/indexedDB';
import clsx from 'clsx';

interface SessionListener {
  listenerId: string;
  name: string;
  status?: string;
}

export const CardsMinigameHost: React.FC<{ id: string, sessionListeners: SessionListener[] }> = ({ id, sessionListeners }) => {
  const { activeGames, updateGame, updateGameConfig, playerProgress, broadcastEvent, clearProgress } = useMinigamesStore();
  const { theme } = useThemeStore();
  const { savedImages } = useIDB();
  const game = activeGames.find(g => g.id === id);

  useEffect(() => {
    const handleDrop = (e: any) => {
      const { idx, itemId } = e.detail;
      const img = savedImages.find(i => i.id === parseInt(itemId));
      if (img && img.url) {
        updateGameConfig(id, (prev) => {
          const newCards = [...(prev.cards || [])];
          newCards[idx] = { ...newCards[idx], value: img.url };
          return { ...prev, cards: newCards };
        });
      }
    };
    window.addEventListener('cards_minigame_drop_image', handleDrop);
    return () => window.removeEventListener('cards_minigame_drop_image', handleDrop);
  }, [id, savedImages, updateGameConfig]);

  if (!game) return null;

  const cards = game.config?.cards || [];
  const quantity = game.config?.quantity ?? 3;
  const initialFace = game.config?.initialFace || 'down';
  const timeLimit = game.config?.timeLimit ?? 0;
  const permissions = game.config?.permissions || {};

  const handleStart = () => {
    clearProgress();
    updateGame(id, { status: 'running' });
    
    // Parse images from comma separated or newlines
    let finalCards = [...cards];
    if (finalCards.length === 0) {
      // Default placeholder if none provided
      finalCards = [{ type: 'image', value: 'https://placehold.co/150x200' }];
    }

    if (broadcastEvent) {
      broadcastEvent({
        type: 'minigame_start',
        payload: {
          gameId: id,
          gameType: 'cards',
          config: { 
            cards: finalCards,
            quantity: parseInt(quantity as string) || 3,
            initialFace,
            timeLimit: parseInt(timeLimit as string) || 0,
            permissions
          }
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
    <MinigameWindow id={id} title={game.title || "Escolha uma Carta"}>
      {(!game.status || game.status === 'idle') && (
        <div className="space-y-4 flex flex-col flex-1 overflow-y-auto">
          <div>
            <label className="block text-sm mb-2 text-neutral-400">Conteúdo das Cartas</label>
            <div className="space-y-2 mb-2 max-h-40 overflow-y-auto pr-1">
              {cards.map((card: any, idx: number) => (
                <div key={idx} className={clsx("flex flex-col gap-2 p-2 rounded border", isEthereal ? "border-white/10 bg-white/5" : "border-neutral-700 bg-neutral-800")}>
                    <div className="flex justify-between items-center w-full">
                      <select
                        className={clsx(inputClass, "w-auto text-xs py-1")}
                        value={card.type}
                        onChange={e => {
                          const val = e.target.value as 'image' | 'text';
                          updateGameConfig(id, (prev) => {
                            const newCards = [...(prev.cards || [])];
                            newCards[idx] = { type: val, value: '' };
                            return { ...prev, cards: newCards };
                          });
                        }}
                      >
                        <option value="image">Imagem</option>
                        <option value="text">Texto/Número</option>
                      </select>
                      
                      <button 
                        onClick={() => {
                          updateGameConfig(id, (prev) => {
                            const newCards = (prev.cards || []).filter((_: any, i: number) => i !== idx);
                            return { ...prev, cards: newCards };
                          });
                        }}
                        className="text-rose-500 hover:text-rose-400 p-1 rounded hover:bg-rose-500/10 transition-colors"
                        title="Remover Carta"
                      >
                        Ã—
                      </button>
                    </div>
                    
                    {card.type === 'text' ? (
                      <textarea 
                        placeholder="Ex: 10, Dragão, etc..."
                        className={clsx(inputClass, "w-full text-xs py-1 resize-y min-h-[40px] max-h-[120px]")}
                        rows={2}
                        value={card.value || ''}
                        onPointerDownCapture={e => e.stopPropagation()}
                        onPointerDown={e => e.stopPropagation()}
                        onMouseDown={e => e.stopPropagation()}
                        onTouchStart={e => e.stopPropagation()}
                        onChange={e => {
                          const val = e.target.value;
                          updateGameConfig(id, (prev) => {
                            const newCards = [...(prev.cards || [])];
                            newCards[idx] = { ...newCards[idx], value: val };
                            return { ...prev, cards: newCards };
                          });
                        }}
                      />
                    ) : (
                      <div className="w-full flex flex-col gap-2">
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="URL da Imagem ou solte do Assets..."
                            className={clsx(inputClass, "flex-1 text-xs py-1")}
                            value={card.value?.startsWith('data:') ? 'Imagem carregada' : (card.value || '')}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const itemType = e.dataTransfer.getData('itemType');
                              const itemId = e.dataTransfer.getData('itemId');
                              if (itemType === 'image') {
                                // Event will be caught if we had access to savedImages, 
                                // but we need useIDB hook. Let's dispatch a custom event or we can just 
                                // get it from the store if we add useIDB to the component.
                                // We will implement useIDB in the component body and use it here.
                                const event = new CustomEvent('cards_minigame_drop_image', { detail: { idx, itemId }});
                                window.dispatchEvent(event);
                              }
                            }}
                            onChange={e => {
                              if (e.target.value !== 'Imagem carregada') {
                                  const val = e.target.value;
                                  updateGameConfig(id, (prev) => {
                                    const newCards = [...(prev.cards || [])];
                                    newCards[idx] = { ...newCards[idx], value: val };
                                    return { ...prev, cards: newCards };
                                  });
                              }
                            }}
                          />
                          <label className={clsx(inputClass, "w-auto text-xs py-1 cursor-pointer text-center hover:opacity-80 flex items-center justify-center")}>
                            <span>Upload</span>
                            <input 
                              type="file" 
                              accept="image/*"
                              className="hidden"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (ev) => {
                                    const base64 = ev.target?.result as string;
                                    updateGameConfig(id, (prev) => {
                                      const newCards = [...(prev.cards || [])];
                                      newCards[idx] = { ...newCards[idx], value: base64 };
                                      return { ...prev, cards: newCards };
                                    });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            placeholder="Título da carta (opcional)..."
                            className={clsx(inputClass, "flex-1 text-xs py-1")}
                            value={card.title || ''}
                            onChange={e => {
                              const val = e.target.value;
                              updateGameConfig(id, (prev) => {
                                const newCards = [...(prev.cards || [])];
                                newCards[idx] = { ...newCards[idx], title: val };
                                return { ...prev, cards: newCards };
                              });
                            }}
                          />
                          <label className="flex items-center gap-1 text-[10px] text-neutral-400 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={card.showTitle ?? false}
                              onChange={e => {
                                const checked = e.target.checked;
                                updateGameConfig(id, (prev) => {
                                  const newCards = [...(prev.cards || [])];
                                  newCards[idx] = { ...newCards[idx], showTitle: checked };
                                  return { ...prev, cards: newCards };
                                });
                              }}
                            />
                            Mostrar aos Convidados
                          </label>
                        </div>
                      </div>
                    )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  updateGameConfig(id, (prev) => {
                    const newCards = [...(prev.cards || []), { type: 'image', value: '' }];
                    return { ...prev, cards: newCards };
                  });
                }}
                className="flex-1 py-1.5 text-xs bg-neutral-700 hover:bg-neutral-600 text-white rounded transition-colors"
              >
                + Adicionar Carta
              </button>
              <button
                type="button"
                onClick={() => {
                  updateGameConfig(id, (prev) => {
                    const cards = [...(prev.cards || [])];
                    for (let i = cards.length - 1; i > 0; i--) {
                      const j = Math.floor(Math.random() * (i + 1));
                      [cards[i], cards[j]] = [cards[j], cards[i]];
                    }
                    return { ...prev, cards };
                  });
                }}
                className="flex-1 py-1.5 text-xs bg-indigo-600/50 hover:bg-indigo-500/50 text-indigo-200 border border-indigo-500/30 rounded transition-colors"
                title="Embaralha a ordem das cartas atuais"
              >
                Embaralhar Cartas
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm mb-1 text-neutral-400">Qtd. Cartas</label>
              <input 
                type="number" 
                className={inputClass}
                value={quantity} 
                min={1}
                onChange={e => {
                  const val = e.target.value;
                  updateGame(id, { config: { ...game.config, quantity: val === '' ? '' : parseInt(val) } });
                }} 
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm mb-1 text-neutral-400">Tempo (s) - 0 = âˆž</label>
              <input 
                type="number" 
                className={inputClass}
                value={timeLimit} 
                min={0}
                onChange={e => {
                  const val = e.target.value;
                  updateGame(id, { config: { ...game.config, timeLimit: val === '' ? 0 : parseInt(val) } });
                }} 
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm mb-1 text-neutral-400">Face Inicial</label>
            <select
              className={inputClass}
              value={initialFace}
              onChange={e => updateGame(id, { config: { ...game.config, initialFace: e.target.value } })}
            >
              <option value="down">Para Baixo (Oculta)</option>
              <option value="up">Para Cima (Revelada)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm mb-2 text-neutral-400">Permissões dos Jogadores</label>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {sessionListeners.map(listener => {
                // Default permissions
                const p = permissions[listener.listenerId] || { canSee: true, canInteract: true, canSeeResult: false };
                return (
                  <div key={listener.listenerId} className={clsx("flex flex-col gap-2 p-2 rounded border", isEthereal ? "border-white/10 bg-white/5" : "border-neutral-700 bg-neutral-800")}>
                    <span className="text-sm font-medium truncate max-w-[150px]" title={listener.name}>{listener.name || listener.listenerId}</span>
                    <div className="flex gap-3 flex-wrap">
                      <label className="flex items-center gap-1 text-xs text-neutral-400">
                        <input type="checkbox" checked={p.canSee} onChange={(e) => {
                          const newPerms = { ...permissions, [listener.listenerId]: { ...p, canSee: e.target.checked } };
                          updateGame(id, { config: { ...game.config, permissions: newPerms } });
                          if (broadcastEvent) {
                            broadcastEvent({ 
                              type: 'update_card_permissions', 
                              payload: { 
                                gameId: id, 
                                gameType: 'cards',
                                config: { ...game.config, permissions: newPerms } 
                              } 
                            });
                          }
                        }} />
                        Ver
                      </label>
                      <label className="flex items-center gap-1 text-xs text-neutral-400">
                        <input type="checkbox" checked={p.canInteract} onChange={(e) => {
                          const newPerms = { ...permissions, [listener.listenerId]: { ...p, canInteract: e.target.checked } };
                          updateGame(id, { config: { ...game.config, permissions: newPerms } });
                          if (broadcastEvent) {
                            broadcastEvent({ 
                              type: 'update_card_permissions', 
                              payload: { 
                                gameId: id, 
                                gameType: 'cards',
                                config: { ...game.config, permissions: newPerms } 
                              } 
                            });
                          }
                        }} />
                        Interagir
                      </label>
                      {initialFace === 'down' && (
                        <label className="flex items-center gap-1 text-xs text-neutral-400">
                          <input type="checkbox" checked={p.canSeeResult} onChange={(e) => {
                            const newPerms = { ...permissions, [listener.listenerId]: { ...p, canSeeResult: e.target.checked } };
                            updateGame(id, { config: { ...game.config, permissions: newPerms } });
                            if (broadcastEvent) {
                              broadcastEvent({ 
                                type: 'update_card_permissions', 
                                payload: { 
                                  gameId: id, 
                                  gameType: 'cards',
                                  config: { ...game.config, permissions: newPerms } 
                                } 
                              });
                            }
                          }} />
                          Ver Resultado
                        </label>
                      )}
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
              return (
                <div key={listenerId} className="flex flex-col gap-1.5 p-2 rounded border border-neutral-700 bg-neutral-800/50">
                  <div className="flex justify-between text-xs text-neutral-300">
                    <span className="truncate max-w-[150px]" title={listenerId}>{progress.name || listenerId}</span>
                  </div>
                  {progress.cardResult ? (
                    <div className="flex flex-col gap-2 mt-1 px-2 py-1.5 rounded text-sm font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      <div className="flex items-center gap-2">
                        <span>Carta {progress.cardResult.index + 1}</span>
                        {progress.cardResult.card?.type === 'image' && progress.cardResult.card?.value && (
                          <img src={progress.cardResult.card.value} alt="Card" className="w-6 h-6 object-cover rounded" />
                        )}
                        {progress.cardResult.card?.type === 'text' && (
                          <span className="text-xs">({progress.cardResult.card.value})</span>
                        )}
                        {!progress.cardResult.card && progress.cardResult.imageUrl && (
                          <img src={progress.cardResult.imageUrl} alt="Card" className="w-6 h-6 object-cover rounded" />
                        )}
                      </div>
                      {progress.cardResult.card?.title && (
                        <div className="text-xs text-blue-200">
                          {progress.cardResult.card.title}
                        </div>
                      )}
                    </div>
                  ) : (
                     <div className="text-xs text-neutral-500">Aguardando escolha...</div>
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

          {game.status === 'running' && (
             <div className="mt-4 border-t border-neutral-700 pt-4">
                <label className="block text-sm mb-2 text-neutral-400">Atualizar Permissões em Tempo Real</label>
                <div className="space-y-2 max-h-24 overflow-y-auto pr-1">
                  {sessionListeners.map(listener => {
                    const p = permissions[listener.listenerId] || { canSee: true, canInteract: true, canSeeResult: false };
                    return (
                      <div key={listener.listenerId} className="flex flex-col gap-1 text-xs">
                        <span className="font-medium text-neutral-300">{listener.name}</span>
                        <div className="flex gap-2">
                           <label className="flex items-center gap-1"><input type="checkbox" checked={p.canSee} onChange={(e) => {
                              const newPerms = { ...permissions, [listener.listenerId]: { ...p, canSee: e.target.checked } };
                              updateGame(id, { config: { ...game.config, permissions: newPerms } });
                              if (broadcastEvent) {
                                broadcastEvent({ type: 'update_card_permissions', payload: { gameId: id, permissions: newPerms }});
                              }
                           }} /> Ver</label>
                           <label className="flex items-center gap-1"><input type="checkbox" checked={p.canInteract} onChange={(e) => {
                              const newPerms = { ...permissions, [listener.listenerId]: { ...p, canInteract: e.target.checked } };
                              updateGame(id, { config: { ...game.config, permissions: newPerms } });
                              if (broadcastEvent) {
                                broadcastEvent({ type: 'update_card_permissions', payload: { gameId: id, permissions: newPerms }});
                              }
                           }} /> Interagir</label>
                           {initialFace === 'down' && (
                              <label className="flex items-center gap-1"><input type="checkbox" checked={p.canSeeResult} onChange={(e) => {
                                 const newPerms = { ...permissions, [listener.listenerId]: { ...p, canSeeResult: e.target.checked } };
                                 updateGame(id, { config: { ...game.config, permissions: newPerms } });
                                 if (broadcastEvent) {
                                   broadcastEvent({ type: 'update_card_permissions', payload: { gameId: id, permissions: newPerms }});
                                 }
                              }} /> Ver Result.</label>
                           )}
                        </div>
                      </div>
                    );
                  })}
                </div>
             </div>
          )}

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
