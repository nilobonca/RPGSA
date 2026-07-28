import React, { useState, useEffect, useCallback } from 'react';
import { useIDB } from '@/utils/indexedDB';
import { SoundboardButton, PRESET_PAD_COLORS } from './SoundboardButton';
import ContextMenu from '@/components/ContextMenu';
import { SoundboardItem } from '@/interfaces/utils/indexedDB';
import { Plus, Square, Disc, Sliders, Keyboard } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { stopSoundboardAudio, activeSoundboardAudios, playSoundboardAudio } from './activeAudios';

interface SoundboardMenuProps {
    onItemContextMenu?: (e: React.MouseEvent, itemId: string) => void;
    editingItemId?: string | null;
    onRename?: (id: string, newName: string) => void;
}

const SHORTCUT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];

export const SoundboardMenu: React.FC<SoundboardMenuProps> = ({ onItemContextMenu, editingItemId, onRename }) => {
    const { soundboardItems, addSoundboardItem, updateSoundboardItem, deleteSoundboardItem, savedAudios } = useIDB();
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: SoundboardItem } | null>(null);

    // Global keyboard listener to fire soundboard shortcuts (1-9, etc)
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Ignore keydowns inside text inputs or contentEditable elements
        const target = e.target as HTMLElement | null;
        if (
            target &&
            (target.tagName === 'INPUT' ||
             target.tagName === 'TEXTAREA' ||
             target.tagName === 'SELECT' ||
             target.isContentEditable)
        ) {
            return;
        }

        const pressedKey = e.key.toUpperCase();
        const index = SHORTCUT_KEYS.indexOf(pressedKey);
        if (index !== -1 && index < soundboardItems.length) {
            const item = soundboardItems[index];
            if (item) {
                const audio = savedAudios.find(a => a.id === item.audioId || a.id === Number(item.audioId));
                if (audio && audio.url) {
                    playSoundboardAudio(
                        item.id,
                        audio.url,
                        item.playbackMode || 'overlap',
                        item.pitch || 1.0,
                        item.volume,
                        audio.id,
                        item.filterType,
                        item.trimStart,
                        item.trimEnd
                    );
                }
            }
        }
    }, [soundboardItems, savedAudios]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const handleStopAll = () => {
        activeSoundboardAudios.forEach((_, id) => {
            stopSoundboardAudio(id);
        });
    };

    const handleDropOnMenu = (e: React.DragEvent) => {
        e.preventDefault();
        const itemType = e.dataTransfer.getData('itemType');
        const itemId = e.dataTransfer.getData('itemId');

        if (itemType === 'audio' && itemId) {
            const audioId = Number(itemId);
            const audio = savedAudios.find(a => a.id === audioId);
            if (audio) {
                const newItem: SoundboardItem = {
                    id: uuidv4(),
                    name: audio.name,
                    audioId: audioId,
                    order: soundboardItems.length,
                    playbackMode: 'overlap'
                };
                addSoundboardItem(newItem);
            }
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleAddButton = () => {
        const newItem: SoundboardItem = {
            id: uuidv4(),
            name: 'Novo Pad',
            audioId: null,
            order: soundboardItems.length,
            playbackMode: 'overlap'
        };
        addSoundboardItem(newItem);
    };

    return (
        <div className="flex flex-col w-full h-full bg-neutral-950 text-neutral-100 rounded-xl overflow-hidden select-none border border-neutral-800">
            {/* Studio Rack Control Deck Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-neutral-900 border-b border-neutral-800 backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <Disc size={16} className="text-blue-500 animate-spin-slow" />
                    <span className="text-xs font-mono font-bold tracking-wider text-neutral-300">
                        MPC SOUNDBOARD
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                        {soundboardItems.length} PADS
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-neutral-500">
                        <Keyboard size={12} />
                        <span>ATALHOS 1-9</span>
                    </div>

                    {/* Panic / Stop All Button */}
                    <button
                        onClick={handleStopAll}
                        className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/80 transition-all shadow-sm active:scale-95"
                        title="Parar todos os sons ativos"
                    >
                        <Square size={10} className="fill-current" />
                        <span>PARAR TODOS</span>
                    </button>
                </div>
            </div>

            {/* Soundboard Pads Grid Area */}
            <div
                className="w-full h-full min-h-[220px] p-3 grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-3 auto-rows-min content-start overflow-y-auto bg-neutral-950/90 custom-scrollbar"
                onDrop={handleDropOnMenu}
                onDragOver={handleDragOver}
                onContextMenu={(e) => e.stopPropagation()}
            >
                {soundboardItems.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center text-neutral-500 py-10 border-2 border-dashed border-neutral-800 rounded-2xl bg-neutral-900/30">
                        <Disc size={32} className="mb-2 text-neutral-600 opacity-60" />
                        <p className="text-xs font-semibold text-neutral-300">Nenhum Pad no Soundboard</p>
                        <p className="text-[11px] opacity-70 text-center mt-1">
                            Arraste arquivos de áudio para esta área ou clique em "+ Novo Pad"
                        </p>
                    </div>
                )}

                {soundboardItems.map((item, index) => {
                    const audio = savedAudios.find(a => a.id === item.audioId || a.id === Number(item.audioId));
                    const shortcutKey = index < SHORTCUT_KEYS.length ? SHORTCUT_KEYS[index] : undefined;

                    return (
                        <SoundboardButton
                            key={item.id}
                            item={item}
                            audio={audio}
                            shortcutKey={shortcutKey}
                            onClick={() => { }}
                            isRenaming={editingItemId === item.id}
                            onRename={(newName) => onRename && onRename(item.id, newName)}
                            onUpdate={(updated) => updateSoundboardItem({ ...item, ...updated })}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (onItemContextMenu) {
                                    onItemContextMenu(e, item.id);
                                } else {
                                    setContextMenu({ x: e.clientX, y: e.clientY, item });
                                }
                            }}
                            onDropAudio={(audioId) => {
                                const audio = savedAudios.find(a => a.id === audioId);
                                if (audio) {
                                    updateSoundboardItem({ ...item, name: audio.name, audioId: audioId });
                                }
                            }}
                        />
                    );
                })}

                {/* Add New Pad Button */}
                <button
                    onClick={handleAddButton}
                    className="group w-[116px] h-[116px] rounded-2xl border-2 border-dashed border-neutral-800 hover:border-blue-500/80 bg-neutral-900/40 hover:bg-neutral-900 flex flex-col items-center justify-center text-neutral-500 hover:text-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all duration-200"
                    title="Adicionar Novo Pad"
                >
                    <Plus size={24} className="mb-1 transition-transform duration-200 group-hover:scale-125" />
                    <span className="text-[10px] font-mono font-medium">NOVO PAD</span>
                </button>
            </div>

            {/* Custom Context Menu */}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    options={[
                        {
                            label: 'Renomear Pad',
                            icon: '✏️',
                            onClick: () => {
                                const newName = window.prompt('Novo nome do Pad:', contextMenu.item.name);
                                if (newName) {
                                    updateSoundboardItem({ ...contextMenu.item, name: newName });
                                }
                                setContextMenu(null);
                            }
                        },
                        {
                            label: contextMenu.item.playbackMode === 'restart' ? 'Modo: Reiniciar' : 'Modo: Sobrepor',
                            icon: contextMenu.item.playbackMode === 'restart' ? '🔄' : '▶️',
                            onClick: () => {
                                const newMode = contextMenu.item.playbackMode === 'restart' ? 'overlap' : 'restart';
                                updateSoundboardItem({ ...contextMenu.item, playbackMode: newMode });
                                setContextMenu(null);
                            }
                        },
                        {
                            label: 'Excluir Pad',
                            icon: '🗑️',
                            onClick: () => {
                                if (window.confirm('Deseja excluir este pad?')) {
                                    stopSoundboardAudio(contextMenu.item.id);
                                    deleteSoundboardItem(contextMenu.item.id);
                                }
                                setContextMenu(null);
                            }
                        }
                    ]}
                />
            )}
        </div>
    );
};
