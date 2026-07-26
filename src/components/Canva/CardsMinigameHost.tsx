import React, { useEffect, useState } from 'react';
import { Trash2, Sparkles, Layers, Eye, X } from 'lucide-react';
import { motion, useDragControls } from 'framer-motion';
import { MinigameWindow } from './MinigameWindow';
import { useMinigamesStore } from '@/store/minigamesStore';
import { useThemeStore } from '@/store/themeStore';
import { MinigamePresetBar } from './MinigamePresetBar';
import { useCanvasGlobalStore } from '@/store/canvasStore';
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
  const menuZIndices = useCanvasGlobalStore(state => state.menuZIndices);
  const bringToFront = useCanvasGlobalStore(state => state.bringToFront);
  const menuPositions = useCanvasGlobalStore(state => state.menuPositions);
  const setMenuPosition = useCanvasGlobalStore(state => state.setMenuPosition);

  const game = activeGames.find(g => g.id === id);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const savedPreview = menuPositions.cardsPreview;
  const [previewSize, setPreviewSize] = useState({
    width: savedPreview?.width || 340,
    height: savedPreview?.height || 220
  });
  const previewDragControls = useDragControls();

  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    bringToFront('cardsPreview');
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = previewSize.width;
    const startHeight = previewSize.height;

    let finalW = startWidth;
    let finalH = startHeight;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      finalW = Math.max(280, Math.min(900, startWidth + deltaX));
      finalH = Math.max(180, Math.min(650, startHeight + deltaY));
      setPreviewSize({ width: finalW, height: finalH });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      const defaultX = typeof window !== 'undefined' ? Math.max(100, window.innerWidth - 450) : 500;
      setMenuPosition('cardsPreview', {
        x: savedPreview?.x ?? defaultX,
        y: savedPreview?.y ?? 160,
        width: finalW,
        height: finalH
      });
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

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
          title: game.config?.customTitle || undefined,
          description: game.config?.customSubtitle || undefined,
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
    <>
      <MinigameWindow id={id} title={game.title || "Escolha uma Carta"}>
      {(!game.status || game.status === 'idle') && (
        <div className="space-y-4 flex flex-col flex-1 overflow-y-auto">
          {/* Preset Manager Bar */}
          <MinigamePresetBar activeGameId={id} gameId="cards" currentConfig={game.config} />

          {/* Custom Guest Title & Subtitle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 border border-neutral-700/60 rounded-xl bg-neutral-900/40">
            <div>
              <label className="block text-xs mb-1 text-neutral-400 font-semibold">Título para Convidados</label>
              <input 
                type="text" 
                placeholder="Padrão: Escolha uma Carta"
                className={clsx(inputClass, "text-xs py-1")}
                value={game.config?.customTitle || ''} 
                onChange={e => {
                  const val = e.target.value;
                  updateGameConfig(id, prev => ({ ...prev, customTitle: val }));
                }} 
              />
            </div>
            <div>
              <label className="block text-xs mb-1 text-neutral-400 font-semibold">Subtítulo para Convidados</label>
              <input 
                type="text" 
                placeholder="Padrão: Selecione uma das cartas..."
                className={clsx(inputClass, "text-xs py-1")}
                value={game.config?.customSubtitle || ''} 
                onChange={e => {
                  const val = e.target.value;
                  updateGameConfig(id, prev => ({ ...prev, customSubtitle: val }));
                }} 
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm text-neutral-400 font-semibold">Conteúdo das Cartas ({cards.length})</label>
              <button
                type="button"
                onClick={() => {
                  if (!showPreviewModal) bringToFront('cardsPreview');
                  setShowPreviewModal(!showPreviewModal);
                }}
                className={clsx(
                  "px-2 py-1 text-xs rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer",
                  showPreviewModal
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-md shadow-amber-500/10"
                    : "bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-300"
                )}
                title="Abrir/Fechar preview móvel das cartas"
              >
                <Eye size={13} />
                {showPreviewModal ? "Fechar Preview" : "Preview Flutuante"}
              </button>
            </div>
            <div className="space-y-2 mb-2 p-1.5 border border-neutral-700/60 rounded-xl resize-y overflow-auto min-h-[140px] max-h-[500px] scrollbar-thin">
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
                        className="text-rose-400 hover:text-rose-300 p-1.5 rounded hover:bg-rose-500/10 transition-colors flex items-center gap-1 text-xs"
                        title="Remover Carta"
                      >
                        <Trash2 size={14} />
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
                              multiple
                              className="hidden"
                              onChange={e => {
                                const files = Array.from(e.target.files || []);
                                if (files.length > 0) {
                                  Promise.all(
                                    files.map(file => new Promise<{ base64: string, name: string }>((resolve) => {
                                      const reader = new FileReader();
                                      reader.onload = (ev) => resolve({
                                        base64: ev.target?.result as string,
                                        name: file.name.replace(/\.[^/.]+$/, "")
                                      });
                                      reader.readAsDataURL(file);
                                    }))
                                  ).then(items => {
                                    updateGameConfig(id, (prev) => {
                                      const newCards = [...(prev.cards || [])];
                                      // First image replaces current card at idx
                                      newCards[idx] = { ...newCards[idx], type: 'image', value: items[0].base64, title: newCards[idx]?.title || items[0].name };
                                      // Append subsequent images as new cards
                                      for (let i = 1; i < items.length; i++) {
                                        newCards.push({ type: 'image', value: items[i].base64, title: items[i].name, showTitle: false });
                                      }
                                      return { ...prev, cards: newCards };
                                    });
                                  });
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
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => {
                  updateGameConfig(id, (prev) => {
                    const newCards = [...(prev.cards || []), { type: 'image', value: '' }];
                    return { ...prev, cards: newCards };
                  });
                }}
                className="flex-1 py-1.5 px-2 text-xs bg-neutral-700 hover:bg-neutral-600 text-white rounded transition-colors"
              >
                + Adicionar Carta
              </button>
              <label className="flex-1 py-1.5 px-2 text-xs bg-indigo-600/70 hover:bg-indigo-500/80 text-white rounded transition-colors cursor-pointer text-center flex items-center justify-center gap-1 font-medium">
                <span>+ Várias Imagens</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) {
                      Promise.all(
                        files.map(file => new Promise<{ base64: string, name: string }>((resolve) => {
                          const reader = new FileReader();
                          reader.onload = (ev) => resolve({
                            base64: ev.target?.result as string,
                            name: file.name.replace(/\.[^/.]+$/, "")
                          });
                          reader.readAsDataURL(file);
                        }))
                      ).then(items => {
                        updateGameConfig(id, (prev) => {
                          const newCards = [...(prev.cards || [])];
                          items.forEach(item => {
                            newCards.push({ type: 'image', value: item.base64, title: item.name, showTitle: false });
                          });
                          return { ...prev, cards: newCards };
                        });
                      });
                    }
                  }}
                />
              </label>
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
                className="py-1.5 px-3 text-xs bg-neutral-800 hover:bg-neutral-700 text-indigo-200 border border-neutral-700 rounded transition-colors"
                title="Embaralha a ordem das cartas atuais"
              >
                Embaralhar
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
              <label className="block text-sm mb-1 text-neutral-400">Tempo (s) - 0 = ∞ (Sem Limite)</label>
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
              <div className="flex flex-col gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!showPreviewModal) bringToFront('cardsPreview');
                    setShowPreviewModal(!showPreviewModal);
                  }}
                  className={clsx(
                    "w-full py-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                    showPreviewModal
                      ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                      : "bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border-indigo-500/30"
                  )}
                >
                  <Eye size={14} />
                  {showPreviewModal ? "Fechar Preview Flutuante" : "Ver Preview Flutuante das Cartas"}
                </button>
                <button 
                  onClick={() => {
                    updateGame(id, { status: 'finished' });
                    if (broadcastEvent) broadcastEvent({ type: 'minigame_end', payload: { gameId: id } });
                  }}
                  className="w-full py-2 bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 border border-rose-500/30 rounded-lg font-medium transition-colors"
                >
                  Encerrar Agora
                </button>
              </div>
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

      {/* Floating Draggable Cards Preview Modal - Overlap Layering & Resizable */}
      {showPreviewModal && (
        <motion.div
          drag
          dragListener={false}
          dragControls={previewDragControls}
          dragMomentum={false}
          initial={{
            x: savedPreview?.x ?? (typeof window !== 'undefined' ? Math.max(100, window.innerWidth - 450) : 500),
            y: savedPreview?.y ?? 160,
            scale: 0.95,
            opacity: 0
          }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onDragEnd={(e, info) => {
            const defaultX = typeof window !== 'undefined' ? Math.max(100, window.innerWidth - 450) : 500;
            const curX = savedPreview?.x ?? defaultX;
            const curY = savedPreview?.y ?? 160;
            setMenuPosition('cardsPreview', {
              x: curX + info.offset.x,
              y: curY + info.offset.y
            });
          }}
          onPointerDownCapture={() => bringToFront('cardsPreview')}
          onMouseDown={() => bringToFront('cardsPreview')}
          className={clsx(
            "fixed p-4 rounded-2xl border shadow-2xl backdrop-blur-xl flex flex-col gap-3 pointer-events-auto overflow-hidden min-w-[280px] min-h-[180px] max-w-[90vw] max-h-[85vh]",
            isEthereal
              ? "bg-black/95 border-white/20 text-white shadow-black/80"
              : "bg-neutral-900/98 border-neutral-700 text-white shadow-black/80"
          )}
          style={{
            width: previewSize.width,
            height: previewSize.height,
            zIndex: menuZIndices.cardsPreview || 120
          }}
        >
          {/* Modal Header */}
          <div
            onPointerDown={(e) => previewDragControls.start(e)}
            className="flex items-center justify-between border-b border-neutral-700/60 pb-2.5 cursor-grab active:cursor-grabbing select-none group"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400 animate-pulse" />
              <span className="text-sm font-bold text-neutral-200">Preview das Cartas ({cards.length})</span>
            </div>
            <button
              onClick={() => setShowPreviewModal(false)}
              className="p-1 rounded-lg hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 transition-colors"
              title="Fechar Preview"
            >
              <X size={16} />
            </button>
          </div>

          {/* Cards Content Scroll */}
          {cards.length === 0 ? (
            <div className="text-center py-6 text-xs text-neutral-500 italic border border-dashed border-neutral-700/60 rounded-xl flex-1 flex items-center justify-center">
              Nenhuma carta configurada ainda.
            </div>
          ) : (
            <div className="flex gap-2.5 overflow-x-auto overflow-y-hidden pb-2 pt-1 flex-1 items-center scrollbar-thin">
              {cards.map((card: any, idx: number) => (
                <div
                  key={idx}
                  className="flex-shrink-0 w-24 h-36 rounded-xl border border-indigo-500/40 bg-neutral-950 flex flex-col items-center justify-between p-1.5 relative overflow-hidden shadow-lg transition-transform hover:scale-105"
                >
                  <span className="absolute top-1.5 left-1.5 text-[9px] bg-indigo-600/90 text-white font-mono px-1.5 py-0.5 rounded z-10 font-bold shadow">
                    #{idx + 1}
                  </span>

                  {card.type === 'image' && card.value ? (
                    <div className="w-full h-full relative flex flex-col justify-between overflow-hidden rounded-lg">
                      <img
                        src={card.value}
                        alt={`Carta ${idx + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      {card.title && card.showTitle && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/85 text-[8px] text-white text-center py-1 truncate px-1 font-medium">
                          {card.title}
                        </div>
                      )}
                    </div>
                  ) : card.type === 'text' && card.value ? (
                    <div className="w-full h-full flex items-center justify-center p-2 bg-neutral-900 rounded-lg border border-neutral-800">
                      <span className="text-xs font-bold text-indigo-200 text-center break-words line-clamp-5">
                        {card.value}
                      </span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-neutral-600">
                      <span className="text-2xl mb-1">🃏</span>
                      <span className="text-[10px]">Vazia</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Bottom-Right Custom Resize Handle */}
          <div
            onPointerDown={handleResizePointerDown}
            className="absolute bottom-1 right-1 w-6 h-6 cursor-se-resize flex items-center justify-center text-neutral-400 hover:text-amber-400 z-30 group"
            title="Arraste para redimensionar"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" className="fill-current opacity-60 group-hover:opacity-100 transition-opacity">
              <line x1="11" y1="3" x2="3" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="11" y1="7" x2="7" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </motion.div>
      )}
    </>
  );
};
