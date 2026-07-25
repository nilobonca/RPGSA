import React, { useRef, useState, useEffect } from 'react';
import { SoundboardItem, Audios } from '@/interfaces/utils/indexedDB';
import { RotateCcw, Square, Play, Repeat, Settings, X, Scissors } from 'lucide-react';
import { playSoundboardAudio, stopSoundboardAudio, activeSoundboardAudios } from './activeAudios';
import { useIDB } from '@/utils/indexedDB';
import { useAudioEditorStore } from '@/store/audioEditorStore';

interface SoundboardButtonProps {
    item: SoundboardItem;
    audio?: Audios;
    onClick: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
    onDropAudio: (audioId: number) => void;
    onUpdate?: (updated: Partial<SoundboardItem>) => void;
    isRenaming?: boolean;
    onRename?: (newName: string) => void;
}

const FILTER_OPTIONS: { value: SoundboardItem['filterType']; label: string }[] = [
    { value: 'none', label: 'Nenhum' },
    { value: 'lowpass', label: 'Passa-Baixas' },
    { value: 'wall', label: 'Parede' },
    { value: 'telephone', label: 'Telefone' },
];

export const SoundboardButton: React.FC<SoundboardButtonProps> = ({
    item, audio, onClick, onContextMenu, onDropAudio, onUpdate, isRenaming, onRename
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = useState(item.name);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const { saveAudio } = useIDB();

    // Poll playing state from the global map
    useEffect(() => {
        const check = () => {
            const active = activeSoundboardAudios.get(item.id);
            setIsPlaying(!!active && active.length > 0);
        };
        check();
        const interval = setInterval(check, 150);
        return () => clearInterval(interval);
    }, [item.id]);

    // Sync input value when item name changes or renaming starts
    useEffect(() => {
        setInputValue(item.name);
    }, [item.name, isRenaming]);

    // Focus input when renaming starts
    useEffect(() => {
        if (isRenaming && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isRenaming]);

    const handleClick = () => {
        if (isRenaming || showSettings) return;

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
        onClick();
    };

    const handleStop = (e: React.MouseEvent) => {
        e.stopPropagation();
        stopSoundboardAudio(item.id);
    };

    const handleRestart = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (audio && audio.url) {
            stopSoundboardAudio(item.id);
            playSoundboardAudio(
                item.id, 
                audio.url, 
                'restart', 
                item.pitch || 1.0, 
                item.volume, 
                audio.id, 
                item.filterType, 
                item.trimStart, 
                item.trimEnd
            );
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const itemType = e.dataTransfer.getData('itemType');
        const itemId = e.dataTransfer.getData('itemId');
        if (itemType === 'audio' && itemId) {
            onDropAudio(Number(itemId));
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleRenameSubmit = () => {
        if (onRename) onRename(inputValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleRenameSubmit();
    };

    const volumePercent = Math.round((item.volume ?? 1.0) * 100);

    return (
        <div className="relative flex flex-col" style={{ width: 112 }}>
            {/* Main button */}
            <div
                className={`
                    group relative rounded-2xl flex flex-col items-center justify-center p-2 cursor-pointer transition-all duration-300 select-none overflow-hidden
                    ${isPlaying
                        ? 'bg-blue-500/20 dark:bg-blue-500/20 border-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                        : audio
                            ? 'bg-white/60 dark:bg-neutral-800/60 hover:bg-white/90 dark:hover:bg-neutral-700/90 border-white/20 hover:border-blue-400/30 hover:shadow-lg'
                            : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border-dashed border-gray-300/50 dark:border-neutral-600/50'}
                    border backdrop-blur-sm
                    ${isRenaming ? 'ring-2 ring-violet-500 shadow-lg' : ''}
                `}
                style={{ width: 112, height: 112 }}
                onClick={handleClick}
                onContextMenu={onContextMenu}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                draggable={!isRenaming}
                onDragStart={(e) => {
                    if (isRenaming) { e.preventDefault(); return; }
                    e.dataTransfer.setData('itemType', 'soundboardItem');
                    e.dataTransfer.setData('itemId', item.id);
                    e.dataTransfer.effectAllowed = 'copy';
                }}
                title={audio ? `${audio.name} — clique para tocar` : 'Arraste um áudio aqui'}
            >
                {/* Playing indicator */}
                {isPlaying && (
                    <span className="absolute top-2.5 left-2.5 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse" />
                )}

                {/* Settings button */}
                {audio && !isRenaming && (
                    <button
                        className="absolute top-1.5 right-1.5 w-7 h-7 flex items-center justify-center rounded-lg bg-black/5 dark:bg-white/5 hover:bg-white dark:hover:bg-neutral-700 text-gray-500 dark:text-neutral-300 opacity-0 group-hover:opacity-100 transition-all z-10"
                        onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
                        title="Configurações do botão"
                    >
                        {showSettings ? <X size={14} /> : <Settings size={14} />}
                    </button>
                )}

                {/* Title or Input */}
                {isRenaming ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onBlur={handleRenameSubmit}
                        onKeyDown={handleKeyDown}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full text-center text-xs bg-white dark:bg-neutral-800 border border-violet-500 rounded px-1 py-0.5 outline-none font-medium text-gray-800 dark:text-white"
                    />
                ) : (
                    <span className={`text-[11px] text-center font-semibold break-words w-full overflow-hidden px-1 ${isPlaying ? 'text-blue-800 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200'}`}>
                        {item.name || (audio ? audio.name : 'Vazio')}
                    </span>
                )}

                {/* Bottom controls */}
                {!isRenaming && (
                    <div
                        className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {isPlaying ? (
                            <>
                                <button
                                    onClick={handleRestart}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/80 dark:bg-neutral-700/80 backdrop-blur hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 transition-colors shadow-sm"
                                    title="Tocar do início"
                                >
                                    <RotateCcw size={14} />
                                </button>
                                <button
                                    onClick={handleStop}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/80 dark:bg-neutral-700/80 backdrop-blur hover:bg-red-100 dark:hover:bg-red-900/80 text-red-600 dark:text-red-400 transition-colors shadow-sm"
                                    title="Parar"
                                >
                                    <Square size={14} />
                                </button>
                            </>
                        ) : audio ? (
                            <span className="w-6 h-6 flex items-center justify-center opacity-50">
                                {item.playbackMode === 'restart'
                                    ? <Repeat size={13} className="text-blue-500" />
                                    : <Play size={13} className="text-blue-500" />}
                            </span>
                        ) : null}
                    </div>
                )}
            </div>

            {/* Settings panel */}
            {showSettings && audio && !isRenaming && (
                <div
                    className="absolute top-[116px] left-0 z-50 w-52 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-xl border border-white/20 dark:border-neutral-700 rounded-xl shadow-2xl p-4 flex flex-col gap-4"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    {/* Volume */}
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-gray-600 dark:text-neutral-300">Volume</span>
                            <span className="text-[11px] font-mono text-gray-500 dark:text-neutral-400">{volumePercent}%</span>
                        </div>
                        <input
                            type="range"
                            min="0" max="1" step="0.01"
                            value={item.volume ?? 1.0}
                            onChange={(e) => onUpdate?.({ volume: parseFloat(e.target.value) })}
                            className="w-full accent-blue-500 h-1.5"
                        />
                    </div>

                    {/* Filter */}
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-semibold text-gray-600 dark:text-neutral-300">Efeito</span>
                        <div className="grid grid-cols-2 gap-1">
                            {FILTER_OPTIONS.map(f => (
                                <button
                                    key={f.value}
                                    onClick={() => onUpdate?.({ filterType: f.value })}
                                    className={`text-[11px] px-2 py-1 rounded border transition-colors font-medium
                                        ${(item.filterType ?? 'none') === f.value
                                            ? 'bg-blue-500 border-blue-500 text-white'
                                            : 'bg-gray-50 dark:bg-neutral-700 border-gray-200 dark:border-neutral-600 text-gray-600 dark:text-neutral-300 hover:border-blue-400'
                                        }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mode */}
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-semibold text-gray-600 dark:text-neutral-300">Modo de Reprodução</span>
                        <div className="grid grid-cols-2 gap-1">
                            {[{ value: 'overlap', label: 'Sobrepor' }, { value: 'restart', label: 'Reiniciar' }].map(m => (
                                <button
                                    key={m.value}
                                    onClick={() => onUpdate?.({ playbackMode: m.value as 'overlap' | 'restart' })}
                                    className={`text-[11px] px-2 py-1 rounded border transition-colors font-medium
                                        ${(item.playbackMode ?? 'overlap') === m.value
                                            ? 'bg-blue-500 border-blue-500 text-white'
                                            : 'bg-gray-50 dark:bg-neutral-700 border-gray-200 dark:border-neutral-600 text-gray-600 dark:text-neutral-300 hover:border-blue-400'
                                        }`}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Cut / Edit Audio Button */}
                    <div className="pt-1 border-t border-gray-200 dark:border-neutral-700">
                        <button
                            onClick={() => {
                                setShowSettings(false);
                                useAudioEditorStore.getState().openEditor({
                                    audio,
                                    initialTrimStart: item.trimStart || 0,
                                    initialTrimEnd: item.trimEnd,
                                    onSaveTrimRange: (trimStart, trimEnd) => {
                                        onUpdate?.({ trimStart, trimEnd });
                                    }
                                });
                            }}
                            className="w-full py-1.5 px-2 bg-blue-50 dark:bg-neutral-700 hover:bg-blue-100 dark:hover:bg-neutral-600 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        >
                            <Scissors size={14} />
                            Editar / Cortar Áudio
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
