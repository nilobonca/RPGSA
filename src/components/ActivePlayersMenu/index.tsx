import React, { useState, useEffect } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { Maximize2, X, GripHorizontal, Search, Volume2, VolumeX } from 'lucide-react';
import { Players, ActiveArea, Audios } from '@/interfaces/utils/indexedDB';
import { useViewportResize } from '@/hooks/useViewportResize';
import { useCanvasGlobalStore } from '@/store/canvasStore';
import AudioPlayerList from '../player-list';
import { useAudioEditorStore } from '@/store/audioEditorStore';

interface ActivePlayersMenuProps {
    activePlayers: Players[];
    activeAreas?: ActiveArea[];
    savedAudios?: Audios[];
    activeAudioIds?: Set<number>;
    activeAreaIds?: Set<string>;
    onClose: () => void;
    onInteraction?: () => void;
    onLocatePlayer?: (x: number, y: number) => void;
    onDeletePlayer?: (id: string, type: 'player' | 'area') => void;
    proximityVolumes?: Map<number, number>;
    spatialPans?: Map<number, number>;
  spatial3D?: Map<number, {x: number, y: number}>;
  is3DEnabled?: boolean;
    audioFilters?: Map<number, 'none' | 'lowpass' | 'wall' | 'telephone'>;
    onUpdateArea?: (area: ActiveArea) => void;
    isPreviewInstance?: boolean;
    isHiddenReal?: boolean;
}

const ActivePlayersMenu: React.FC<ActivePlayersMenuProps> = ({
    activePlayers,
    activeAreas = [],
    savedAudios = [],
    activeAudioIds = new Set(),
    activeAreaIds = new Set(),
    onClose,
    onInteraction,
    onLocatePlayer,
    onDeletePlayer,
    proximityVolumes = new Map(),
    spatialPans = new Map(),
    audioFilters = new Map(),
    onUpdateArea,
    isPreviewInstance,
    isHiddenReal
}) => {
    const dragControls = useDragControls();
    const [searchTerm, setSearchTerm] = useState('');

    // Fix Hydration Mismatch: Use safe server defaults
    const { size, setSize, position, setPosition, onDragEnd, handleResizeStart, constraintRef, x, y, width, height } = useViewportResize({
        menuId: 'activePlayers',
        initialSize: { width: 360, height: 400 },
        initialPosition: { x: 800, y: 100 },
        minWidth: 360,
        minHeight: 200
    });

    const masterVolume = useCanvasGlobalStore(state => state.masterVolume);
    const setMasterVolume = useCanvasGlobalStore(state => state.setMasterVolume);



    // Constraints effect removed as it was unused

    const menuRef = React.useRef<HTMLDivElement>(null);

    // Combine activePlayers and activeAreas (converted to player-like structure)
    const allPlayableItems = [
        ...activePlayers.map(p => ({ ...p, type: 'player' as const })),
        ...activeAreas
            .filter(a => a.linkedAudioId !== null)
            .map(a => {
                const audio = savedAudios.find(audio => audio.id === a.linkedAudioId);
                if (!audio) return null;

                // Calculate position (centroid or volume source)
                let x = 0, y = 0;
                if (a.volumeSourcePoint) {
                    x = a.volumeSourcePoint.x;
                    y = a.volumeSourcePoint.y;
                } else if (a.points && a.points.length > 0) {
                    a.points.forEach(p => { x += p.x; y += p.y; });
                    x /= a.points.length;
                    y /= a.points.length;
                }

                return {
                    id: a.id,
                    audio: audio,
                    position: { x, y },
                    type: 'area' as const,
                    original: a
                };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null)
    ];

    const filteredPlayers = allPlayableItems.filter(player =>
        player.audio.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderContent = () => (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="p-2 border-b border-gray-200/50 dark:border-white/5">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                    <input
                        type="text"
                        placeholder="Buscar players..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-sm bg-black/5 dark:bg-white/5 rounded-lg border border-transparent focus:border-blue-500/50 focus:bg-white/50 dark:focus:bg-neutral-800/50 focus:ring-1 focus:ring-blue-500/50 text-gray-700 dark:text-neutral-200 outline-none transition-all"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 pr-3 space-y-3 custom-scrollbar">
                <div className="flex flex-col bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-white/5 shadow-sm overflow-hidden mb-3">
                   <div className="flex items-center justify-between p-2">
                       <div className="flex items-center gap-2">
                          <button onClick={() => setMasterVolume(masterVolume === 0 ? 1 : 0)} className={`p-2 rounded-full transition-colors ${masterVolume === 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                             {masterVolume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                          </button>
                          <div className="flex flex-col">
                              <span className="text-sm font-semibold text-gray-800 dark:text-neutral-200 line-clamp-1">Volume Mestre (Global)</span>
                              <span className="text-[10px] text-gray-400 dark:text-neutral-500">Geral</span>
                          </div>
                       </div>
                       <div className="text-xs font-mono text-gray-500 w-10 text-right">
                          {Math.round(masterVolume * 100)}%
                       </div>
                   </div>
                   <div className="px-3 pb-3 pt-1">
                       <input
                           type="range"
                           min="0" max="1" step="0.01"
                           value={masterVolume}
                           onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                           className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-neutral-700 accent-blue-500"
                           title="Volume Mestre"
                           onPointerDown={(e) => e.stopPropagation()}
                       />
                   </div>
                </div>

                {filteredPlayers.length > 0 ? (
                    filteredPlayers.map(player => (
                        <div key={player.id} className="group">
                            <AudioPlayerList
                                playerId={player.id}
                                audio={player.audio}
                                onDelete={() => onDeletePlayer && onDeletePlayer(player.id, player.type)}
                                onDuplicate={() => { }} // Duplication not implemented for active players yet
                                onEdit={(audio) => useAudioEditorStore.getState().openEditor({ audio })}
                                forcePlay={player.type === 'area' ? activeAreaIds.has(player.id) : false}
                                proximityFactor={proximityVolumes.get(player.audio.id) ?? 1}
                                spatialPan={spatialPans.get(player.audio.id) ?? 0}
                                filterType={audioFilters.get(player.audio.id) ?? 'none'}
                                highlightedAudioId={null}
                                pitch={player.type === 'area' && 'original' in player ? ((player.original as ActiveArea).pitch ?? 1.0) : 1.0}
                                onPitchChange={(newPitch) => {
                                    if (player.type === 'area' && 'original' in player && onUpdateArea) {
                                        onUpdateArea({ ...(player.original as ActiveArea), pitch: newPitch });
                                    }
                                }}
                                volume={player.type === 'area' && 'original' in player ? ((player.original as ActiveArea).volume ?? 1.0) : 1.0}
                                audioRotation={player.type === 'area' && 'original' in player ? (player.original as any).audioRotation : undefined}
                                onRotationChange={(rotation) => {
                                    if (player.type === 'area' && 'original' in player && onUpdateArea) {
                                        onUpdateArea({ ...(player.original as any), audioRotation: rotation });
                                    }
                                }}
                                onVolumeChange={(newVolume) => {
                                    if (player.type === 'area' && 'original' in player && onUpdateArea) {
                                        onUpdateArea({ ...(player.original as ActiveArea), volume: newVolume });
                                    }
                                }}
                                isPreviewInstance={isPreviewInstance}
                                isHiddenReal={isHiddenReal}
                            />
                            
                                <div className="flex justify-between text-[10px] text-gray-500 dark:text-neutral-500 px-2 mt-1">
                                <div className="flex gap-2">
                                    <span className="font-medium bg-black/5 dark:bg-white/5 px-1.5 rounded">{player.type === 'area' ? 'Área' : 'Player'}</span>
                                    <span>X: {Math.round(player.position.x)}, Y: {Math.round(player.position.y)}</span>
                                </div>
                                {onLocatePlayer && (
                                    <button
                                        onClick={() => onLocatePlayer(player.position.x, player.position.y)}
                                        className="hover:text-blue-500 flex items-center gap-1 transition-colors"
                                    >
                                        <Maximize2 size={10} /> Localizar
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-400 dark:text-neutral-500 text-sm">
                        {searchTerm ? 'Nenhum player encontrado.' : 'Nenhum player ativo no canvas.'}
                    </div>
                )}
            </div>

            <div className="p-2 border-t border-gray-200/50 dark:border-white/5 text-xs text-gray-500 dark:text-neutral-500 font-medium text-center">
                {activePlayers.length} {activePlayers.length === 1 ? 'player ativo' : 'players ativos'}
            </div>
        </div>
    );

    if (isHiddenReal) {
        return <div style={{ display: 'none' }}>{renderContent()}</div>;
    }

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
                maxHeight: '80vh',
                zIndex: 50
            }}
            drag
            dragListener={false}
            dragControls={dragControls}
            dragMomentum={false}
            onDragEnd={onDragEnd}
            dragConstraints={constraintRef}
            className={`absolute flex flex-col bg-white/70 dark:bg-neutral-900/70 backdrop-blur-2xl border border-white/40 dark:border-white/10 rounded-2xl shadow-2xl shadow-black/10 overflow-hidden pointer-events-auto p-4 select-none`}
            onContextMenu={(e) => e.preventDefault()}
            onPointerDownCapture={onInteraction}
        >
            {/* Expanded View */}
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
                        Players Ativos
                    </span>
                    <div className="flex items-center gap-2">
                        <GripHorizontal className="text-gray-400" />
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                                onPointerDown={(e) => e.stopPropagation()}
                                title="Fechar"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {renderContent()}

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
};

export default ActivePlayersMenu;
