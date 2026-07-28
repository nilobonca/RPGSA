import React, { useRef, useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { SoundboardItem, Audios } from '@/interfaces/utils/indexedDB';
import { RotateCcw, Square, Play, Repeat, Settings, X, Scissors, Activity, Radio, Volume2 } from 'lucide-react';
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
    shortcutKey?: string;
}

const FILTER_OPTIONS: { value: SoundboardItem['filterType']; label: string }[] = [
    { value: 'none', label: 'Nenhum' },
    { value: 'lowpass', label: 'Passa-Baixas' },
    { value: 'wall', label: 'Parede' },
    { value: 'telephone', label: 'Telefone' },
];

export const PRESET_PAD_COLORS = [
    { name: 'Azul Studio', value: '#3b82f6', border: 'border-blue-500', glow: 'rgba(59,130,246,0.6)', text: 'text-blue-400', bgActive: 'bg-blue-500/20' },
    { name: 'Rosa Neon', value: '#ec4899', border: 'border-pink-500', glow: 'rgba(236,72,153,0.6)', text: 'text-pink-400', bgActive: 'bg-pink-500/20' },
    { name: 'Verde Synth', value: '#10b981', border: 'border-emerald-500', glow: 'rgba(16,185,129,0.6)', text: 'text-emerald-400', bgActive: 'bg-emerald-500/20' },
    { name: 'Âmbar Fogo', value: '#f59e0b', border: 'border-amber-500', glow: 'rgba(245,158,11,0.6)', text: 'text-amber-400', bgActive: 'bg-amber-500/20' },
    { name: 'Roxo Cyber', value: '#8b5cf6', border: 'border-purple-500', glow: 'rgba(139,92,246,0.6)', text: 'text-purple-400', bgActive: 'bg-purple-500/20' },
    { name: 'Vermelho Laser', value: '#ef4444', border: 'border-red-500', glow: 'rgba(239,68,68,0.6)', text: 'text-red-400', bgActive: 'bg-red-500/20' },
    { name: 'Ciano Tron', value: '#06b6d4', border: 'border-cyan-500', glow: 'rgba(6,182,212,0.6)', text: 'text-cyan-400', bgActive: 'bg-cyan-500/20' },
];

// Simple helper to pick a deterministic color if item.color is not set
function getPadColor(item: SoundboardItem) {
    if (item.color) {
        const found = PRESET_PAD_COLORS.find(c => c.value.toLowerCase() === item.color?.toLowerCase());
        if (found) return found;
        return {
            name: 'Personalizado',
            value: item.color,
            border: 'border-blue-500',
            glow: item.color,
            text: 'text-blue-400',
            bgActive: 'bg-blue-500/20'
        };
    }
    let hash = 0;
    for (let i = 0; i < item.id.length; i++) {
        hash = (hash << 5) - hash + item.id.charCodeAt(i);
        hash |= 0;
    }
    const idx = Math.abs(hash) % PRESET_PAD_COLORS.length;
    return PRESET_PAD_COLORS[idx];
}

export const SoundboardButton: React.FC<SoundboardButtonProps> = ({
    item, audio, onClick, onContextMenu, onDropAudio, onUpdate, isRenaming, onRename, shortcutKey
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const padButtonRef = useRef<HTMLDivElement>(null);
    const [inputValue, setInputValue] = useState(item.name);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [popoverPos, setPopoverPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const [progress, setProgress] = useState<number>(0);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [vuLevels, setVuLevels] = useState<number[]>([0, 0, 0, 0, 0]);
    const { saveAudio } = useIDB();

    const colorScheme = useMemo(() => getPadColor(item), [item.color, item.id]);

    // Calculate popover position when opening settings
    useEffect(() => {
        if (showSettings && padButtonRef.current) {
            const rect = padButtonRef.current.getBoundingClientRect();
            const popoverHeight = 340;
            const spaceBelow = window.innerHeight - rect.bottom;
            let top = rect.bottom + 6;

            if (spaceBelow < popoverHeight && rect.top > popoverHeight) {
                top = rect.top - popoverHeight - 6;
            }

            let left = rect.left + rect.width / 2 - 120; // 120 is half of 240px (w-60)
            left = Math.max(12, Math.min(window.innerWidth - 252, left));

            setPopoverPos({ top, left });
        }
    }, [showSettings]);

    // Poll playing state and track audio progress / VU meter from activeSoundboardAudios
    useEffect(() => {
        const check = () => {
            const active = activeSoundboardAudios.get(item.id);
            if (active && active.length > 0) {
                setIsPlaying(true);
                // Extract latest active audio element
                const mainAudio = active[active.length - 1].sound;
                if (mainAudio && mainAudio.duration && !isNaN(mainAudio.duration)) {
                    const cur = mainAudio.currentTime || 0;
                    const dur = mainAudio.duration || 1;
                    setCurrentTime(cur);
                    setDuration(dur);
                    setProgress(Math.min(100, Math.max(0, (cur / dur) * 100)));

                    // Generate realistic mini VU meter levels based on playback progress & random movement
                    const now = performance.now();
                    const wave = Math.sin(now / 90) * 0.4 + 0.6;
                    const bars = [
                        wave > 0.2 ? Math.random() * 0.5 + 0.5 : 0.2,
                        wave > 0.35 ? Math.random() * 0.6 + 0.4 : 0.15,
                        wave > 0.5 ? Math.random() * 0.7 + 0.3 : 0.1,
                        wave > 0.7 ? Math.random() * 0.8 + 0.2 : 0.05,
                        wave > 0.85 ? Math.random() * 0.9 + 0.1 : 0.0,
                    ];
                    setVuLevels(bars);
                } else {
                    setVuLevels([0.5, 0.4, 0.3, 0.2, 0.1]);
                }
            } else {
                setIsPlaying(false);
                setProgress(0);
                setCurrentTime(0);
                setDuration(0);
                setVuLevels([0, 0, 0, 0, 0]);
            }
        };

        check();
        const interval = setInterval(check, 50);
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

    // Format time display (e.g. 01:23)
    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="relative flex flex-col items-center select-none" style={{ width: 116 }}>
            {/* MPC Studio Pad Frame */}
            <div
                ref={padButtonRef}
                className={`
                    group relative rounded-2xl flex flex-col items-center justify-between p-2 cursor-pointer transition-all duration-200 overflow-hidden
                    bg-neutral-900/90 dark:bg-neutral-950/90 backdrop-blur-md border-2
                    ${isRenaming ? 'ring-2 ring-violet-400 ring-offset-2 ring-offset-neutral-900 shadow-2xl' : ''}
                    ${isPlaying
                        ? 'scale-[0.98] shadow-2xl'
                        : audio
                            ? 'hover:scale-[1.02] shadow-md hover:shadow-xl'
                            : 'border-dashed border-neutral-700/60 hover:border-neutral-500 bg-neutral-900/40'}
                `}
                style={{
                    width: 116,
                    height: 116,
                    borderColor: audio ? colorScheme.value : undefined,
                    boxShadow: isPlaying
                        ? `0 0 24px ${colorScheme.glow}, inset 0 0 16px ${colorScheme.glow}`
                        : audio
                            ? `inset 0 1px 2px rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.6), 0 0 8px ${colorScheme.value}22`
                            : undefined
                }}
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
                {/* Backlight Glow Overlay for Active Sound */}
                {isPlaying && (
                    <div
                        className="absolute inset-0 pointer-events-none opacity-40 animate-pulse transition-opacity"
                        style={{
                            background: `radial-gradient(circle at center, ${colorScheme.value} 0%, transparent 75%)`
                        }}
                    />
                )}

                {/* Top Pad Header Bar: Shortcut Badge & LED Indicator */}
                <div className="w-full flex items-center justify-between z-10 pointer-events-none">
                    {/* Keyboard Shortcut Badge */}
                    {shortcutKey ? (
                        <span
                            className={`
                                text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md border backdrop-blur-sm
                                ${isPlaying
                                    ? 'bg-white text-black border-white shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                                    : 'bg-black/60 text-neutral-300 border-neutral-700/80 group-hover:border-neutral-500'}
                            `}
                        >
                            {shortcutKey}
                        </span>
                    ) : <div />}

                    {/* LED Status Light */}
                    <div className="flex items-center gap-1">
                        {isPlaying ? (
                            <span
                                className="w-2.5 h-2.5 rounded-full animate-ping"
                                style={{ backgroundColor: colorScheme.value, boxShadow: `0 0 10px ${colorScheme.value}` }}
                            />
                        ) : null}
                        <span
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                isPlaying
                                    ? 'shadow-[0_0_10px_#22c55e] bg-emerald-400'
                                    : audio
                                        ? 'bg-neutral-600 group-hover:bg-emerald-500/70'
                                        : 'bg-neutral-800'
                            }`}
                            style={{
                                backgroundColor: isPlaying ? colorScheme.value : undefined
                            }}
                        />
                    </div>
                </div>

                {/* Settings Gear Button (shows on hover) */}
                {audio && !isRenaming && (
                    <button
                        className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-md bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 opacity-0 group-hover:opacity-100 transition-all z-20"
                        onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
                        title="Configurações do pad"
                    >
                        {showSettings ? <X size={12} /> : <Settings size={12} />}
                    </button>
                )}

                {/* Center Title or Input */}
                <div className="w-full flex-1 flex items-center justify-center px-1 z-10 my-1">
                    {isRenaming ? (
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onBlur={handleRenameSubmit}
                            onKeyDown={handleKeyDown}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-center text-xs bg-neutral-800 border border-violet-400 rounded px-1 py-0.5 outline-none font-medium text-white shadow-inner"
                        />
                    ) : (
                        <span className={`text-[11px] text-center font-semibold leading-tight line-clamp-2 break-words w-full ${isPlaying ? 'text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]' : audio ? 'text-neutral-200 group-hover:text-white' : 'text-neutral-500'}`}>
                            {item.name || (audio ? audio.name : 'Vazio')}
                        </span>
                    )}
                </div>

                {/* Mini VU Meter & Progress Bar (Inside the Pad) */}
                {audio && !isRenaming && (
                    <div className="w-full flex flex-col gap-1 z-10">
                        {/* 5-Segment VU Meter Display */}
                        <div className="w-full flex items-center justify-between px-0.5 gap-0.5">
                            {vuLevels.map((val, idx) => {
                                // Colors from green (low) to yellow to red (clip)
                                const colors = ['#22c55e', '#10b981', '#eab308', '#f97316', '#ef4444'];
                                const isLit = isPlaying && val > 0.15;
                                return (
                                    <div
                                        key={idx}
                                        className="h-1 flex-1 rounded-full transition-all duration-75"
                                        style={{
                                            backgroundColor: isLit ? colors[idx] : '#262626',
                                            boxShadow: isLit ? `0 0 6px ${colors[idx]}` : 'none'
                                        }}
                                    />
                                );
                            })}
                        </div>

                        {/* Progress Bar & Time */}
                        <div className="w-full bg-neutral-950/80 rounded-full h-1.5 overflow-hidden relative border border-neutral-800 flex items-center">
                            <div
                                className="h-full rounded-full transition-all duration-100"
                                style={{
                                    width: `${isPlaying ? progress : 0}%`,
                                    backgroundColor: colorScheme.value,
                                    boxShadow: `0 0 8px ${colorScheme.value}`
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Bottom Action Controls (Hover or Active) */}
                {!isRenaming && (
                    <div
                        className="absolute inset-x-0 bottom-1 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-neutral-900/90 py-1 backdrop-blur-sm border-t border-neutral-800"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {isPlaying ? (
                            <>
                                <button
                                    onClick={handleRestart}
                                    className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-blue-400 transition-colors border border-neutral-700"
                                    title="Tocar do início"
                                >
                                    <RotateCcw size={12} />
                                </button>
                                <button
                                    onClick={handleStop}
                                    className="p-1 rounded bg-neutral-800 hover:bg-red-900/50 text-red-400 transition-colors border border-neutral-700"
                                    title="Parar"
                                >
                                    <Square size={12} />
                                </button>
                            </>
                        ) : audio ? (
                            <span className="flex items-center gap-1 text-[10px] text-neutral-400 font-mono">
                                {item.playbackMode === 'restart' ? (
                                    <>
                                        <Repeat size={11} className="text-blue-400" />
                                        <span>RESTART</span>
                                    </>
                                ) : (
                                    <>
                                        <Play size={11} className="text-emerald-400" />
                                        <span>OVERLAP</span>
                                    </>
                                )}
                            </span>
                        ) : null}
                    </div>
                )}
            </div>

            {/* Soundboard Pad Settings Popover (rendered via Portal outside Soundboard Menu overflow container) */}
            {showSettings && audio && !isRenaming && typeof window !== 'undefined' && createPortal(
                <>
                    {/* Transparent Click-Outside Overlay (sem blur no canvas) */}
                    <div
                        className="fixed inset-0 z-[9998]"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowSettings(false);
                        }}
                    />

                    {/* Compact Popover Panel (w-60 original size, floating outside menu) */}
                    <div
                        className="fixed z-[9999] w-60 bg-neutral-900/95 backdrop-blur-2xl border border-neutral-700/80 rounded-xl shadow-2xl p-4 flex flex-col gap-3 text-neutral-200 text-xs animate-in fade-in zoom-in-95 duration-150"
                        style={{ top: popoverPos.top, left: popoverPos.left }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                            <span className="font-bold text-neutral-100 flex items-center gap-1.5">
                                <Radio size={14} className="text-blue-400" />
                                Configurações do Pad
                            </span>
                            <button
                                onClick={() => setShowSettings(false)}
                                className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Pad Color / Category Selector */}
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[11px] font-semibold text-neutral-400">Cor do Pad / Categoria</span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {PRESET_PAD_COLORS.map(c => (
                                    <button
                                        key={c.value}
                                        onClick={() => onUpdate?.({ color: c.value })}
                                        className={`w-6 h-6 rounded-full border-2 transition-transform ${item.color === c.value ? 'scale-125 border-white shadow-lg' : 'border-transparent hover:scale-110'}`}
                                        style={{ backgroundColor: c.value }}
                                        title={c.name}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Volume Slider */}
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
                                    <Volume2 size={12} /> Volume
                                </span>
                                <span className="text-[11px] font-mono text-blue-400">{volumePercent}%</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="1" step="0.01"
                                value={item.volume ?? 1.0}
                                onChange={(e) => onUpdate?.({ volume: parseFloat(e.target.value) })}
                                className="w-full accent-blue-500 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        {/* Filter Type */}
                        <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-semibold text-neutral-400">Efeito DSP</span>
                            <div className="grid grid-cols-2 gap-1">
                                {FILTER_OPTIONS.map(f => (
                                    <button
                                        key={f.value}
                                        onClick={() => onUpdate?.({ filterType: f.value })}
                                        className={`text-[10px] px-2 py-1 rounded border transition-colors font-medium ${
                                            (item.filterType ?? 'none') === f.value
                                                ? 'bg-blue-600 border-blue-500 text-white shadow'
                                                : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:border-neutral-500'
                                        }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Playback Mode */}
                        <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-semibold text-neutral-400">Modo de Disparo</span>
                            <div className="grid grid-cols-2 gap-1">
                                {[
                                    { value: 'overlap', label: 'Sobrepor' },
                                    { value: 'restart', label: 'Reiniciar' }
                                ].map(m => (
                                    <button
                                        key={m.value}
                                        onClick={() => onUpdate?.({ playbackMode: m.value as 'overlap' | 'restart' })}
                                        className={`text-[10px] px-2 py-1 rounded border transition-colors font-medium ${
                                            (item.playbackMode ?? 'overlap') === m.value
                                                ? 'bg-blue-600 border-blue-500 text-white shadow'
                                                : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:border-neutral-500'
                                        }`}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Edit / Trim Audio Button */}
                        <div className="pt-2 border-t border-neutral-800">
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
                                className="w-full py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 text-blue-400 border border-neutral-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                            >
                                <Scissors size={14} />
                                Editar / Cortar Áudio
                            </button>
                        </div>
                    </div>
                </>,
                document.body
            )}
        </div>
    );
};
