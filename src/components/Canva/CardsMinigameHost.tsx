import React, { useEffect, useState } from 'react';
import { 
  Trash2, Sparkles, Eye, X, Shuffle, Plus, Upload, Play, 
  StopCircle, RefreshCw, Sliders, ShieldCheck, FileImage, Type, Clock
} from 'lucide-react';
import { motion, useDragControls, AnimatePresence } from 'framer-motion';
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

export const CardsMinigameHost: React.FC<{ id: string; sessionListeners: SessionListener[] }> = ({ id, sessionListeners }) => {
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
    width: savedPreview?.width || 360,
    height: savedPreview?.height || 240
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
    
    let finalCards = [...cards];
    if (finalCards.length === 0) {
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
    "w-full px-3 py-2 text-xs rounded-xl border transition-all font-['Outfit',sans-serif] focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400/50",
    isEthereal 
      ? "bg-white/[0.04] border-white/10 text-white placeholder-white/30 backdrop-blur-md" 
      : "bg-neutral-900/80 border-white/10 text-neutral-200 placeholder-neutral-500 backdrop-blur-md"
  );

  const glassCardClass = clsx(
    "rounded-xl border p-3 backdrop-blur-md transition-all shadow-lg",
    isEthereal
      ? "bg-white/[0.03] border-white/10 hover:border-white/20"
      : "bg-black/30 border-white/10 hover:border-white/15"
  );

  return (
    <>
      <MinigameWindow id={id} title={game.title || "Escolha uma Carta"}>
        <div className="font-['Outfit',sans-serif] flex flex-col flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Preset Manager Bar */}
          <MinigamePresetBar activeGameId={id} gameId="cards" currentConfig={game.config} />

          {(!game.status || game.status === 'idle') && (
            <div className="space-y-4 flex flex-col flex-1">
              {/* Custom Titles Section */}
              <div className={clsx(glassCardClass, "grid grid-cols-1 sm:grid-cols-2 gap-3")}>
                <div>
                  <label className="block text-[11px] mb-1 text-neutral-300 font-semibold tracking-wide flex items-center gap-1.5">
                    <Sliders size={12} className="text-amber-400" />
                    Título para Convidados
                  </label>
                  <input 
                    type="text" 
                    placeholder="Padrão: Escolha uma Carta"
                    className={inputClass}
                    value={game.config?.customTitle || ''} 
                    onChange={e => {
                      const val = e.target.value;
                      updateGameConfig(id, prev => ({ ...prev, customTitle: val }));
                    }} 
                  />
                </div>
                <div>
                  <label className="block text-[11px] mb-1 text-neutral-300 font-semibold tracking-wide flex items-center gap-1.5">
                    <Sparkles size={12} className="text-indigo-400" />
                    Subtítulo para Convidados
                  </label>
                  <input 
                    type="text" 
                    placeholder="Padrão: Selecione uma das cartas..."
                    className={inputClass}
                    value={game.config?.customSubtitle || ''} 
                    onChange={e => {
                      const val = e.target.value;
                      updateGameConfig(id, prev => ({ ...prev, customSubtitle: val }));
                    }} 
                  />
                </div>
              </div>

              {/* Cards List Section */}
              <div className={glassCardClass}>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-amber-200 tracking-wider flex items-center gap-1.5 uppercase">
                    <Sparkles size={14} className="text-amber-400" />
                    Conteúdo das Cartas ({cards.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (!showPreviewModal) bringToFront('cardsPreview');
                      setShowPreviewModal(!showPreviewModal);
                    }}
                    className={clsx(
                      "px-2.5 py-1 text-xs rounded-lg border font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-md",
                      showPreviewModal
                        ? "bg-amber-500/20 border-amber-400/50 text-amber-300 shadow-amber-500/10"
                        : "bg-white/5 hover:bg-white/10 border-white/10 text-neutral-300"
                    )}
                    title="Abrir/Fechar preview móvel das cartas"
                  >
                    <Eye size={13} />
                    {showPreviewModal ? "Fechar Preview" : "Preview Flutuante"}
                  </button>
                </div>

                <div className="space-y-2 mb-3 p-1 resize-y overflow-auto min-h-[140px] max-h-[450px] scrollbar-thin">
                  <AnimatePresence initial={false}>
                    {cards.map((card: any, idx: number) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col gap-2 p-2.5 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md shadow-md"
                      >
                        <div className="flex justify-between items-center w-full">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold">
                              #{idx + 1}
                            </span>
                            <select
                              className={clsx(inputClass, "w-auto text-xs py-1 px-2")}
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
                              <option value="image">Imagem 🖼️</option>
                              <option value="text">Texto / Valor ✍️</option>
                            </select>
                          </div>
                          
                          <button 
                            onClick={() => {
                              updateGameConfig(id, (prev) => {
                                const newCards = (prev.cards || []).filter((_: any, i: number) => i !== idx);
                                return { ...prev, cards: newCards };
                              });
                            }}
                            className="text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-500/15 transition-colors flex items-center gap-1 text-xs"
                            title="Remover Carta"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        
                        {card.type === 'text' ? (
                          <textarea 
                            placeholder="Conteúdo ou valor (ex: Dragão, 10, Artefato Ritual)..."
                            className={clsx(inputClass, "w-full font-['Cinzel',serif] text-xs py-1.5 resize-y min-h-[44px] max-h-[120px]")}
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
                                placeholder="URL da Imagem ou arraste um Asset..."
                                className={clsx(inputClass, "flex-1")}
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
                              <label className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 rounded-xl text-xs cursor-pointer text-center font-medium transition-all flex items-center justify-center gap-1 shadow-sm">
                                <Upload size={12} />
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
                                          newCards[idx] = { ...newCards[idx], type: 'image', value: items[0].base64, title: newCards[idx]?.title || items[0].name };
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
                                placeholder="Nome da carta (ex: Espada Arcana)..."
                                className={clsx(inputClass, "flex-1 font-['Cinzel',serif]")}
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
                              <label className="flex items-center gap-1.5 text-[11px] text-neutral-300 cursor-pointer select-none">
                                <input 
                                  type="checkbox" 
                                  checked={card.showTitle ?? false}
                                  className="accent-amber-500 rounded"
                                  onChange={e => {
                                    const checked = e.target.checked;
                                    updateGameConfig(id, (prev) => {
                                      const newCards = [...(prev.cards || [])];
                                      newCards[idx] = { ...newCards[idx], showTitle: checked };
                                      return { ...prev, cards: newCards };
                                    });
                                  }}
                                />
                                Exibir Nome
                              </label>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="flex gap-2 flex-wrap pt-1">
                  <button
                    onClick={() => {
                      updateGameConfig(id, (prev) => {
                        const newCards = [...(prev.cards || []), { type: 'image', value: '' }];
                        return { ...prev, cards: newCards };
                      });
                    }}
                    className="flex-1 py-1.5 px-3 text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Plus size={13} className="text-emerald-400" />
                    Adicionar Carta
                  </button>

                  <label className="flex-1 py-1.5 px-3 text-xs bg-gradient-to-r from-indigo-600/40 to-purple-600/40 hover:from-indigo-600/60 hover:to-purple-600/60 border border-indigo-400/30 text-indigo-100 rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 font-medium shadow-md">
                    <FileImage size={13} className="text-indigo-300" />
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
                        const cardsCopy = [...(prev.cards || [])];
                        for (let i = cardsCopy.length - 1; i > 0; i--) {
                          const j = Math.floor(Math.random() * (i + 1));
                          [cardsCopy[i], cardsCopy[j]] = [cardsCopy[j], cardsCopy[i]];
                        }
                        return { ...prev, cards: cardsCopy };
                      });
                    }}
                    className="py-1.5 px-3 text-xs bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border border-amber-500/30 rounded-xl transition-all font-medium flex items-center justify-center gap-1.5 shadow-sm"
                    title="Embaralha a ordem das cartas"
                  >
                    <Shuffle size={13} className="text-amber-400" />
                    Embaralhar
                  </button>
                </div>
              </div>

              {/* Game Parameters */}
              <div className={clsx(glassCardClass, "grid grid-cols-1 sm:grid-cols-3 gap-3")}>
                <div>
                  <label className="block text-[11px] mb-1 text-neutral-300 font-semibold flex items-center gap-1">
                    Qtd. Cartas
                  </label>
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
                <div>
                  <label className="block text-[11px] mb-1 text-neutral-300 font-semibold flex items-center gap-1">
                    <Clock size={12} className="text-amber-400" />
                    Tempo (s) - 0 = ∞
                  </label>
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
                <div>
                  <label className="block text-[11px] mb-1 text-neutral-300 font-semibold flex items-center gap-1">
                    Face Inicial
                  </label>
                  <select
                    className={inputClass}
                    value={initialFace}
                    onChange={e => updateGame(id, { config: { ...game.config, initialFace: e.target.value } })}
                  >
                    <option value="down">Para Baixo (Oculta 🃏)</option>
                    <option value="up">Para Cima (Revelada 👁️)</option>
                  </select>
                </div>
              </div>

              {/* Permissions Section */}
              <div className={glassCardClass}>
                <label className="block text-xs font-bold text-indigo-300 tracking-wider flex items-center gap-1.5 mb-2.5 uppercase">
                  <ShieldCheck size={14} className="text-indigo-400" />
                  Permissões dos Jogadores
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                  {sessionListeners.map(listener => {
                    const p = permissions[listener.listenerId] || { canSee: true, canInteract: true, canSeeResult: false };
                    return (
                      <div key={listener.listenerId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-xl border border-white/10 bg-black/30 backdrop-blur-md">
                        <span className="text-xs font-medium text-neutral-200 truncate max-w-[150px]" title={listener.name}>
                          {listener.name || listener.listenerId}
                        </span>
                        <div className="flex gap-3 flex-wrap">
                          <label className="flex items-center gap-1 text-[11px] text-neutral-300 cursor-pointer">
                            <input type="checkbox" className="accent-indigo-500 rounded" checked={p.canSee} onChange={(e) => {
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
                          <label className="flex items-center gap-1 text-[11px] text-neutral-300 cursor-pointer">
                            <input type="checkbox" className="accent-indigo-500 rounded" checked={p.canInteract} onChange={(e) => {
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
                            <label className="flex items-center gap-1 text-[11px] text-neutral-300 cursor-pointer">
                              <input type="checkbox" className="accent-indigo-500 rounded" checked={p.canSeeResult} onChange={(e) => {
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
                    <div className="text-xs text-neutral-500 italic py-2 text-center">Nenhum jogador na sessão no momento.</div>
                  )}
                </div>
              </div>
              
              <div className="mt-auto pt-2">
                <button 
                  onClick={handleStart}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-600 hover:from-amber-400 hover:via-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold tracking-wide transition-all shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play size={16} fill="currentColor" />
                  Iniciar Desafio de Cartas
                </button>
              </div>
            </div>
          )}
          
          {(game.status === 'running' || game.status === 'finished') && (
            <div className="space-y-4 flex flex-col flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-400" />
                  Progresso dos Jogadores
                </h3>
                {game.status === 'finished' && (
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Finalizado
                  </span>
                )}
                {game.status === 'running' && (
                  <span className="text-xs bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Em andamento
                  </span>
                )}
              </div>
              
              <div className="space-y-2.5 flex-1 overflow-y-auto pr-1 scrollbar-thin">
                {Object.entries(playerProgress).map(([listenerId, progress]) => {
                  return (
                    <motion.div 
                      key={listenerId} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col gap-2 p-3 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md shadow-md"
                    >
                      <div className="flex justify-between text-xs text-neutral-300 font-medium">
                        <span className="truncate max-w-[180px]" title={listenerId}>{progress.name || listenerId}</span>
                      </div>
                      {progress.cardResult ? (
                        <div className="flex flex-col gap-2 p-2 rounded-xl text-sm font-medium bg-indigo-500/15 border border-indigo-400/30 text-indigo-200 shadow-inner">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-indigo-600/40 border border-indigo-400/40 text-indigo-100">
                              Carta #{progress.cardResult.index + 1}
                            </span>
                            {progress.cardResult.card?.type === 'image' && progress.cardResult.card?.value && (
                              <img src={progress.cardResult.card.value} alt="Card" className="w-8 h-10 object-cover rounded-lg border border-indigo-400/40 shadow-sm" />
                            )}
                            {progress.cardResult.card?.type === 'text' && (
                              <span className="text-xs font-['Cinzel',serif] font-bold text-amber-300 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                                "{progress.cardResult.card.value}"
                              </span>
                            )}
                            {!progress.cardResult.card && progress.cardResult.imageUrl && (
                              <img src={progress.cardResult.imageUrl} alt="Card" className="w-8 h-10 object-cover rounded-lg border border-indigo-400/40 shadow-sm" />
                            )}
                          </div>
                          {progress.cardResult.card?.title && (
                            <div className="text-xs font-['Cinzel',serif] font-semibold text-amber-200/90 pl-1">
                              {progress.cardResult.card.title}
                            </div>
                          )}
                        </div>
                      ) : (
                         <div className="text-xs text-neutral-400 italic bg-white/5 p-2 rounded-lg border border-white/5 flex items-center gap-2">
                          <RefreshCw size={12} className="animate-spin text-amber-400" />
                          Aguardando escolha do jogador...
                         </div>
                      )}
                    </motion.div>
                  );
                })}
                
                {Object.keys(playerProgress).length === 0 && (
                  <div className="flex flex-col items-center justify-center h-28 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                    <Sparkles size={20} className="text-neutral-500 mb-1 animate-pulse" />
                    <p className="text-xs text-neutral-400 italic">Aguardando jogadas dos participantes...</p>
                  </div>
                )}
              </div>

              {game.status === 'running' && (
                <div className={glassCardClass}>
                  <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">Permissões em Tempo Real</label>
                  <div className="space-y-2 max-h-28 overflow-y-auto pr-1 scrollbar-thin">
                    {sessionListeners.map(listener => {
                      const p = permissions[listener.listenerId] || { canSee: true, canInteract: true, canSeeResult: false };
                      return (
                        <div key={listener.listenerId} className="flex flex-col gap-1 text-xs p-2 rounded-lg bg-black/30 border border-white/5">
                          <span className="font-medium text-neutral-300">{listener.name}</span>
                          <div className="flex gap-3">
                             <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" className="accent-indigo-500 rounded" checked={p.canSee} onChange={(e) => {
                                const newPerms = { ...permissions, [listener.listenerId]: { ...p, canSee: e.target.checked } };
                                updateGame(id, { config: { ...game.config, permissions: newPerms } });
                                if (broadcastEvent) {
                                  broadcastEvent({ type: 'update_card_permissions', payload: { gameId: id, permissions: newPerms }});
                                }
                             }} /> Ver</label>
                             <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" className="accent-indigo-500 rounded" checked={p.canInteract} onChange={(e) => {
                                const newPerms = { ...permissions, [listener.listenerId]: { ...p, canInteract: e.target.checked } };
                                updateGame(id, { config: { ...game.config, permissions: newPerms } });
                                if (broadcastEvent) {
                                  broadcastEvent({ type: 'update_card_permissions', payload: { gameId: id, permissions: newPerms }});
                                }
                             }} /> Interagir</label>
                             {initialFace === 'down' && (
                                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" className="accent-indigo-500 rounded" checked={p.canSeeResult} onChange={(e) => {
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

              <div className="mt-auto pt-2 space-y-2">
                {game.status === 'running' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (!showPreviewModal) bringToFront('cardsPreview');
                        setShowPreviewModal(!showPreviewModal);
                      }}
                      className={clsx(
                        "w-full py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md",
                        showPreviewModal
                          ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                          : "bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-200 border-indigo-500/30"
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
                      className="w-full py-2 bg-rose-600/20 hover:bg-rose-600/35 text-rose-300 border border-rose-500/40 rounded-xl font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <StopCircle size={15} />
                      Encerrar Agora
                    </button>
                  </>
                )}
                {game.status === 'finished' && (
                   <button 
                     onClick={() => {
                       clearProgress();
                       updateGame(id, { status: 'idle' });
                     }}
                     className="w-full py-2.5 rounded-xl font-bold transition-all border border-white/10 bg-white/5 hover:bg-white/10 text-white flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                   >
                     <RefreshCw size={15} />
                     Novo Desafio
                   </button>
                )}
              </div>
            </div>
          )}
        </div>
      </MinigameWindow>

      {/* Floating Draggable Cards Preview Modal - Glassmorphic high-fidelity */}
      <AnimatePresence>
        {showPreviewModal && (
          <motion.div
            drag
            dragListener={false}
            dragControls={previewDragControls}
            dragMomentum={false}
            initial={{
              x: savedPreview?.x ?? (typeof window !== 'undefined' ? Math.max(100, window.innerWidth - 450) : 500),
              y: savedPreview?.y ?? 160,
              scale: 0.9,
              opacity: 0
            }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
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
              "fixed p-4 rounded-2xl border shadow-2xl backdrop-blur-2xl flex flex-col gap-3 pointer-events-auto overflow-hidden min-w-[280px] min-h-[180px] max-w-[90vw] max-h-[85vh] font-['Outfit',sans-serif]",
              isEthereal
                ? "bg-black/90 border-white/20 text-white shadow-black/90"
                : "bg-[#0c0c16]/95 border-white/15 text-white shadow-black/90"
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
              className="flex items-center justify-between border-b border-white/10 pb-2.5 cursor-grab active:cursor-grabbing select-none group"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-400 animate-pulse" />
                <span className="text-xs font-bold text-amber-200 uppercase tracking-wider">Preview das Cartas ({cards.length})</span>
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
              <div className="text-center py-6 text-xs text-neutral-400 italic border border-dashed border-white/10 rounded-xl flex-1 flex items-center justify-center">
                Nenhuma carta configurada ainda.
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto overflow-y-hidden pb-2 pt-1 flex-1 items-center scrollbar-thin">
                {cards.map((card: any, idx: number) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex-shrink-0 w-28 h-40 rounded-xl border border-indigo-500/40 bg-gradient-to-b from-slate-900 to-indigo-950 flex flex-col items-center justify-between p-1.5 relative overflow-hidden shadow-xl transition-all hover:scale-105 hover:border-amber-400/60"
                  >
                    <span className="absolute top-1.5 left-1.5 text-[9px] bg-amber-500/90 text-black font-mono font-bold px-1.5 py-0.5 rounded-md z-10 shadow">
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
                          <div className="absolute bottom-0 inset-x-0 bg-black/85 text-[9px] font-['Cinzel',serif] text-amber-200 text-center py-1 truncate px-1 font-semibold">
                            {card.title}
                          </div>
                        )}
                      </div>
                    ) : card.type === 'text' && card.value ? (
                      <div className="w-full h-full flex items-center justify-center p-2 bg-black/40 rounded-lg border border-white/5">
                        <span className="text-xs font-['Cinzel',serif] font-bold text-amber-200 text-center break-words line-clamp-5">
                          {card.value}
                        </span>
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500">
                        <span className="text-3xl mb-1">🃏</span>
                        <span className="text-[10px]">Vazia</span>
                      </div>
                    )}
                  </motion.div>
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
      </AnimatePresence>
    </>
  );
};
