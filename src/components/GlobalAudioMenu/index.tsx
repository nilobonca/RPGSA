import React, { useState, useRef, useEffect } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { Plus, X, GripHorizontal, Globe, Mic, Scissors, Volume2, VolumeX, AlertOctagon } from 'lucide-react';
import { useIDB } from '@/utils/indexedDB';
import { useCanvasGlobalStore } from '@/store/canvasStore';
import { ActiveGlobalTrack } from '@/interfaces/utils/indexedDB';
import { useViewportResize } from '@/hooks/useViewportResize';
import { getMasterAudioNodes } from '@/utils/audio/audioContext';
import AudioPlayerList from '../player-list';
import MicPlayerList from '../MicPlayerList';
import { v4 as uuidv4 } from 'uuid';
import { useAudioEditorStore } from '@/store/audioEditorStore';

interface GlobalAudioMenuProps {
    projectId: string;
    onClose: () => void;
    onInteraction?: () => void;
    zIndex?: number;
    isVisible?: boolean;
    isPreviewInstance?: boolean;
    isHiddenReal?: boolean;
}

function MasterFrequencyVisualizer() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        let animId: number;
        const numBars = 24;
        const peaks = new Array(numBars).fill(0);

        const draw = () => {
            animId = requestAnimationFrame(draw);
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const width = canvas.width;
            const height = canvas.height;
            ctx.clearRect(0, 0, width, height);

            const { masterAnalyser } = getMasterAudioNodes();
            let dataArray = new Uint8Array(numBars);
            let hasSignal = false;

            if (masterAnalyser) {
                const tempArray = new Uint8Array(masterAnalyser.frequencyBinCount);
                masterAnalyser.getByteFrequencyData(tempArray);
                const step = Math.floor(tempArray.length / numBars);
                for (let i = 0; i < numBars; i++) {
                    const val = tempArray[i * step] || 0;
                    dataArray[i] = val;
                    if (val > 5) hasSignal = true;
                }
            }

            const barGap = 3;
            const totalWidth = width - 8;
            const barWidth = (totalWidth - (numBars - 1) * barGap) / numBars;
            const startX = 4;

            // Background baseline grid
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.fillRect(0, height - 2, width, 1);

            const now = Date.now() * 0.003;

            for (let i = 0; i < numBars; i++) {
                let val = dataArray[i];
                // Idle ambient motion if no active audio signal
                if (!hasSignal) {
                    const wave = Math.sin(now + i * 0.3) * 0.5 + 0.5;
                    val = Math.floor(wave * 10 + 2);
                }

                const percent = Math.min(1, val / 255);
                const barHeight = Math.max(3, percent * (height - 6));
                const x = startX + i * (barWidth + barGap);
                const y = height - barHeight - 2;

                // Multi-stop Studio Spectrum Gradient: Emerald -> Cyan -> Purple -> Rose Peak
                const grad = ctx.createLinearGradient(0, height, 0, 0);
                grad.addColorStop(0, '#10b981');   // Emerald
                grad.addColorStop(0.5, '#06b6d4'); // Cyan
                grad.addColorStop(0.8, '#a855f7'); // Purple
                grad.addColorStop(1, '#f43f5e');   // Rose peak

                ctx.fillStyle = grad;
                ctx.beginPath();
                if (typeof ctx.roundRect === 'function') {
                    ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
                } else {
                    ctx.rect(x, y, barWidth, barHeight);
                }
                ctx.fill();

                // Peak calculation & gravity decay
                if (barHeight > peaks[i]) {
                    peaks[i] = barHeight;
                } else {
                    peaks[i] = Math.max(0, peaks[i] - 0.7);
                }

                // Draw floating white peak cap
                if (peaks[i] > 4) {
                    const peakY = height - peaks[i] - 2;
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                    ctx.fillRect(x, Math.max(0, peakY - 2), barWidth, 1.5);
                }
            }
        };

        draw();
        return () => cancelAnimationFrame(animId);
    }, []);

    return (
        <canvas
            ref={canvasRef}
            width={320}
            height={36}
            className="w-full h-9 rounded-lg bg-black/50 border border-white/10 shadow-inner mt-2 pointer-events-none"
        />
    );
}

export default function GlobalAudioMenu({ projectId, onClose, onInteraction, zIndex = 50, isVisible = true, isPreviewInstance, isHiddenReal }: GlobalAudioMenuProps) {
    const { savedAudios, activeGlobalTracks, addGlobalTrackPersisted, updateGlobalTrackPersisted, deleteGlobalTrackPersisted } = useIDB();
    
    // Filter tracks by project. For backward compatibility, also include tracks without a projectId.
    const filteredTracks = activeGlobalTracks.filter(t => t.projectId === (projectId ?? '').toString() || !t.projectId);

    const { is3DEnabled, masterVolume, setMasterVolume } = useCanvasGlobalStore();
    const [isAdding, setIsAdding] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isPanicTriggered, setIsPanicTriggered] = useState(false);
    const [prevVolume, setPrevVolume] = useState(1.0);
    
    useEffect(() => {
        setMounted(true);
    }, []);
    
    const dragControls = useDragControls();
    const menuRef = useRef<HTMLDivElement>(null);
    const { size, setSize, position, setPosition, onDragEnd, handleResizeStart, constraintRef, x, y, width, height } = useViewportResize({
        menuId: 'globalTracks',
        initialSize: { width: 360, height: 460 },
        initialPosition: { x: typeof window !== 'undefined' && window.innerWidth >= 380 ? window.innerWidth - 380 : 20, y: 80 },
        minWidth: 360,
        minHeight: 250,
        margin: 20
    });

    const handlePanic = () => {
        setIsPanicTriggered(true);
        window.dispatchEvent(new CustomEvent('rpgsa-audio-panic'));
        
        filteredTracks.forEach(track => {
            if (track.isPlaying) {
                updateGlobalTrackPersisted({ ...track, isPlaying: false });
            }
        });

        setTimeout(() => {
            setIsPanicTriggered(false);
        }, 1200);
    };

    const toggleMute = () => {
        if (masterVolume > 0) {
            setPrevVolume(masterVolume);
            setMasterVolume(0);
        } else {
            setMasterVolume(prevVolume > 0 ? prevVolume : 1.0);
        }
    };

    const handleAddMicTrack = () => {
        addGlobalTrackPersisted({
            id: uuidv4(),
            type: 'globalTrack',
            linkedAudioId: -1,
            isMic: true,
            volume: 1.0,
            pitch: 1.0,
            isPlaying: true,
            order: filteredTracks.length,
            filterType: 'none',
        } as ActiveGlobalTrack, (projectId ?? '').toString());
    };

    const handleAddTrack = (audioId: number) => {
        const audio = savedAudios.find(a => a.id === audioId);
        if (!audio) return;

        addGlobalTrackPersisted({
            id: uuidv4(),
            type: 'globalTrack',
            linkedAudioId: audioId,
            volume: 0.5,
            isPlaying: true,
            order: filteredTracks.length,
            filterType: 'none',
        } as ActiveGlobalTrack, (projectId ?? '').toString());

        setIsAdding(false);
    };

    if (!mounted) return null;

    return (
        <motion.div
            ref={menuRef}
            layout={false}
            initial={false}
            style={{ x, y,
                width: width,
                height: height,
                left: position.x,
                top: position.y,
                maxHeight: '85vh',
                zIndex: zIndex,
                visibility: isVisible ? 'visible' : 'hidden',
                pointerEvents: isVisible ? 'auto' : 'none',
            }}
            drag
            dragListener={false}
            dragControls={dragControls}
            dragMomentum={false}
            dragElastic={0}
            onDragEnd={onDragEnd}
            dragConstraints={constraintRef}
            className={`absolute flex flex-col bg-white/70 dark:bg-neutral-900/70 backdrop-blur-2xl border border-white/40 dark:border-white/10 rounded-2xl shadow-2xl shadow-black/10 overflow-hidden pointer-events-auto p-4 select-none`}
            onContextMenu={(e) => e.preventDefault()}
            onPointerDownCapture={onInteraction}
        >
            <div className={`flex flex-col h-full block select-none`}>
                <div
                    className="w-full flex justify-between items-center mb-3 relative flex-shrink-0 touch-none cursor-move group/header select-none"
                    onPointerDown={(e) => {
                        window.getSelection()?.removeAllRanges();
                        document.body.style.userSelect = 'none';
                        document.body.style.webkitUserSelect = 'none';
                        if (e.cancelable) e.preventDefault();
                        dragControls.start(e);
                    }}
                >
                    <span className="font-semibold text-gray-700 dark:text-neutral-200 flex items-center gap-2">
                        <Globe size={16} className="text-gray-700 dark:text-neutral-200" />
                        Áudio Global
                    </span>
                    <div className="flex items-center gap-2">
                        {/* Panic Button (Icon-only) */}
                        <button
                            onClick={handlePanic}
                            className={`p-1.5 rounded-lg text-white transition-all duration-200 flex items-center justify-center shadow-md overflow-hidden ${
                                isPanicTriggered
                                    ? 'bg-red-700 ring-2 ring-red-400 scale-90 shadow-red-500/50'
                                    : 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 shadow-red-600/30 hover:shadow-red-500/50 active:scale-95 border border-red-400/30'
                            }`}
                            onPointerDown={(e) => e.stopPropagation()}
                            title="Botão de Pânico: Interrompe e silencia todas as faixas ativas imediatamente"
                        >
                            <AlertOctagon size={16} className={isPanicTriggered ? 'animate-bounce' : 'animate-pulse'} />
                        </button>

                        <button
                            onClick={handleAddMicTrack}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded text-gray-400 hover:text-green-500 dark:text-neutral-400"
                            onPointerDown={(e) => e.stopPropagation()}
                            title="Adicionar Microfone Global"
                        >
                            <Mic size={16} />
                        </button>
                        <button
                            onClick={() => setIsAdding(!isAdding)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded text-gray-400 hover:text-blue-500 dark:text-neutral-400"
                            onPointerDown={(e) => e.stopPropagation()}
                            title="Adicionar Áudio Global"
                        >
                            <Plus size={16} />
                        </button>
                        <GripHorizontal className="text-gray-400" />
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                            onPointerDown={(e) => e.stopPropagation()}
                            title="Fechar"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Master Volume Control Card with Real-time Percentage & Frequency Visualizer */}
                <div className="mb-3 bg-neutral-900/90 dark:bg-neutral-950/90 border border-gray-200/50 dark:border-white/10 rounded-xl p-3 shadow-md backdrop-blur-md flex flex-col gap-1.5 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-200 font-semibold text-xs tracking-wider uppercase">
                            <Volume2 size={14} className="text-emerald-500" />
                            <span>Volume Master</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
                                {Math.round(masterVolume * 100)}%
                            </span>
                            <button
                                onClick={toggleMute}
                                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors"
                                title={masterVolume > 0 ? "Mutar Master" : "Desmutar Master"}
                            >
                                {masterVolume > 0 ? <Volume2 size={15} /> : <VolumeX size={15} className="text-red-500" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full pt-1">
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={masterVolume}
                            onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                            className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-emerald-500 bg-neutral-800 border border-white/5"
                            style={{
                                background: `linear-gradient(to right, #10b981 0%, #06b6d4 ${masterVolume * 100}%, rgba(255, 255, 255, 0.1) ${masterVolume * 100}%)`
                            }}
                        />
                    </div>

                    <MasterFrequencyVisualizer />
                </div>

                <div className="flex flex-col h-full overflow-hidden mt-1">
                    {isAdding && (
                        <div className="p-2 border-b border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800/50 mb-2 rounded max-h-40 overflow-y-auto">
                            <h3 className="text-xs font-medium text-gray-500 dark:text-neutral-400 mb-2 uppercase tracking-wider">Selecione um áudio</h3>
                            <div className="space-y-1">
                                {savedAudios.map(audio => (
                                    <div key={audio.id} className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleAddTrack(audio.id)}
                                            className="flex-1 text-left px-3 py-2 text-sm text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded transition-colors truncate"
                                        >
                                            {audio.name}
                                        </button>
                                        <button
                                            onClick={() => useAudioEditorStore.getState().openEditor({ audio })}
                                            className="p-2 text-gray-400 hover:text-violet-500 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded transition-colors"
                                            title="Editar áudio"
                                        >
                                            <Scissors size={14} />
                                        </button>
                                    </div>
                                ))}
                                {savedAudios.length === 0 && (
                                    <p className="text-xs text-gray-500 italic">Nenhum áudio salvo.</p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-1 pr-2 space-y-3 custom-scrollbar">
                        {filteredTracks.length === 0 ? (
                            <div className="text-center text-gray-400 dark:text-neutral-500 text-sm mt-8">
                                Nenhuma trilha global adicionada.<br/>
                                Clique no + para adicionar.
                            </div>
                        ) : (
                            filteredTracks.map(track => {
                                const isMic = track.isMic;
                                let audio;
                                if (!isMic) {
                                    audio = savedAudios.find(a => a.id === track.linkedAudioId);
                                    if (!audio) return null;
                                }

                                return (
                                    <div key={track.id} className="group flex flex-col mb-4 bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-white/5 shadow-sm transition-all overflow-hidden">
                                        {isMic ? (
                                            <MicPlayerList
                                                trackId={track.id}
                                                onDelete={() => deleteGlobalTrackPersisted(track.id)}
                                                spatialPan={track.spatialPan || 0}
                                                filterType={track.filterType || 'none'}
                                                pitch={track.pitch || 1.0}
                                                volume={track.volume}
                                                isActive={track.isPlaying}
                                                onPlayStateChange={(playing) => updateGlobalTrackPersisted({ ...track, isPlaying: playing })}
                                                className="!bg-transparent dark:!bg-transparent !shadow-none !border-none !rounded-none"
                                            />
                                        ) : (
                                            <AudioPlayerList
                                                playerId={track.id}
                                                audio={audio!}
                                                onDelete={() => deleteGlobalTrackPersisted(track.id)}
                                                onDuplicate={() => {}}
                                                onEdit={(audio) => useAudioEditorStore.getState().openEditor({ audio })}
                                                forcePlay={track.isPlaying}
                                                proximityFactor={1}
                                                spatialPan={track.spatialPan || 0}
                                                filterType={track.filterType || 'none'}
                                                highlightedAudioId={null}
                                                pitch={track.pitch || 1.0}
                                                onPitchChange={(p) => updateGlobalTrackPersisted({ ...track, pitch: p })}
                                                volume={track.volume}
                                                onVolumeChange={(newVolume) => {
                                                    updateGlobalTrackPersisted({ ...track, volume: newVolume });
                                                }}
                                                onPlayStateChange={(playing) => {
                                                    updateGlobalTrackPersisted({ ...track, isPlaying: playing });
                                                }}
                                                className="!bg-transparent dark:!bg-transparent !shadow-none !border-none !rounded-none"
                                            />
                                        )}
                                        <div className="flex flex-col gap-3 px-3 py-3 border-t border-gray-200/50 dark:border-white/5 bg-transparent transition-all">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium w-20 flex-shrink-0">Pan</span>
                                                <div className="flex items-center gap-1 w-full text-[10px] text-neutral-500">
                                                    <input
                                                        type="range" min="-1" max="1" step="0.1"
                                                        value={track.spatialPan || 0}
                                                        onChange={(e) => updateGlobalTrackPersisted({ ...track, spatialPan: parseFloat(e.target.value) })}
                                                        className="w-full min-w-0 accent-emerald-500"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium w-20 flex-shrink-0 whitespace-nowrap">
                                                    {(() => {
                                                        const st = Math.round(12 * Math.log2(track.pitch || 1.0));
                                                        return `Tom (${st > 0 ? '+' : ''}${st})`;
                                                    })()}
                                                </span>
                                                <div className="flex items-center gap-1 w-full text-[10px] text-neutral-500">
                                                    <input
                                                        type="range" min="0.5" max="2" step="0.05"
                                                        value={track.pitch || 1.0}
                                                        onChange={(e) => updateGlobalTrackPersisted({ ...track, pitch: parseFloat(e.target.value) })}
                                                        className="w-full min-w-0 accent-emerald-500"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium w-20">Efeito</span>
                                                <select
                                                    value={track.filterType || 'none'}
                                                    onChange={(e) => updateGlobalTrackPersisted({ ...track, filterType: e.target.value as any })}
                                                    className="text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded px-1 py-0.5 w-full"
                                                >
                                                    <option value="none">Nenhum</option>
                                                    <option value="lowpass">Abafado (Lowpass)</option>
                                                    <option value="wall">Parede</option>
                                                    <option value="telephone">Telefone</option>
                                                </select>
                                            </div>
                                            {isMic && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-medium w-16 whitespace-nowrap">
                                                        {(() => {
                                                            const v = track.volume;
                                                            const db = v <= 0 ? '-∞' : Math.round(20 * Math.log10(v));
                                                            return `Vol (${db !== '-∞' && db > 0 ? '+' : ''}${db}dB)`;
                                                        })()}
                                                    </span>
                                                    <input
                                                        type="range" min="0" max="1" step="0.05"
                                                        value={track.volume}
                                                        onChange={(e) => updateGlobalTrackPersisted({ ...track, volume: parseFloat(e.target.value) })}
                                                        className="w-full accent-emerald-500"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Resize Handle */}
                <div
                    className="absolute bottom-0 right-0 p-2 cursor-nwse-resize text-gray-300 hover:text-gray-500 dark:hover:text-neutral-400 transition-colors touch-none"
                    onPointerDown={handleResizeStart as any}
                    title="Redimensionar"
                >
                    <svg width="10" height="10" viewBox="0 0 10 10"><path d="M 10 0 L 10 10 L 0 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
            </div>
        </motion.div>
    );
}

