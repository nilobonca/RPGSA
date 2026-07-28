import React, { useState, useEffect } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { Maximize2, X, GripHorizontal, Search, Trash2, Wifi, WifiOff, Users, Volume2 } from 'lucide-react';
import { useViewportResize } from '@/hooks/useViewportResize';
import { useCanvasGlobalStore } from '@/store/canvasStore';

interface SessionListener {
    listenerId: string;
    name: string;
    ping?: number | null;
}

interface ListenersMenuProps {
    listeners: SessionListener[];
    onClose: () => void;
    onInteraction?: () => void;
    onLocateListener?: (listenerId: string) => void;
    onKickListener?: (listenerId: string) => void;
}

const ListenersMenu: React.FC<ListenersMenuProps> = ({
    listeners = [],
    onClose,
    onInteraction,
    onLocateListener,
    onKickListener
}) => {
    const dragControls = useDragControls();
    const [searchTerm, setSearchTerm] = useState('');
    const { guestMasterVolume, setGuestMasterVolume } = useCanvasGlobalStore();

    const { size, setSize, position, setPosition, onDragEnd, handleResizeStart, constraintRef, x, y, width, height } = useViewportResize({
        menuId: 'listeners',
        initialSize: { width: 300, height: 380 },
        initialPosition: { x: typeof window !== 'undefined' ? window.innerWidth - 340 : 800, y: 150 },
        minWidth: 260,
        minHeight: 220
    });

    const menuRef = React.useRef<HTMLDivElement>(null);


    const filteredListeners = listeners.filter(l =>
        l.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getPingColorClass = (pingVal?: number | null) => {
        if (pingVal === undefined || pingVal === null) return 'text-neutral-400';
        if (pingVal < 80) return 'text-emerald-500';
        if (pingVal < 180) return 'text-yellow-500';
        return 'text-red-500';
    };

    const renderContent = () => (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Guest Master Volume Slider */}
            <div className="p-2.5 border-b border-gray-200 dark:border-neutral-800 bg-indigo-50/40 dark:bg-indigo-950/20 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700 dark:text-neutral-300 flex items-center gap-1.5">
                        <Volume2 size={13} className="text-indigo-500" />
                        Volume Master Convidados
                    </span>
                    <span className="text-xs font-mono text-gray-500 dark:text-neutral-400">
                        {Math.round(guestMasterVolume * 100)}%
                    </span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={guestMasterVolume}
                    onChange={(e) => setGuestMasterVolume(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 h-1.5 cursor-pointer"
                    title="Volume mestre para todos os ouvintes"
                />
            </div>

            {/* Search Box */}
            <div className="p-2 border-b border-gray-200 dark:border-neutral-800">
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                    <input
                        type="text"
                        placeholder="Buscar ouvintes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-2 py-1 text-sm bg-gray-100 dark:bg-neutral-800 rounded border-none focus:ring-1 focus:ring-blue-500 text-gray-700 dark:text-neutral-200"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {filteredListeners.length > 0 ? (
                    filteredListeners.map(listener => (
                        <div 
                            key={listener.listenerId} 
                            className="bg-white dark:bg-neutral-800/50 rounded border border-gray-100 dark:border-neutral-800 p-2.5 flex items-center justify-between"
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-xs text-gray-800 dark:text-neutral-200 truncate block">
                                        {listener.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-1 select-none">
                                    {listener.ping !== undefined && listener.ping !== null ? (
                                        <>
                                            <Wifi size={10} className={getPingColorClass(listener.ping)} />
                                            <span className="text-[10px] text-gray-400 dark:text-neutral-500 font-mono">
                                                {listener.ping} ms
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <WifiOff size={10} className="text-neutral-400" />
                                            <span className="text-[10px] text-gray-400 dark:text-neutral-500">
                                                calculando ping...
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                {onLocateListener && (
                                    <button
                                        onClick={() => onLocateListener(listener.listenerId)}
                                        className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 hover:text-blue-500 rounded transition-colors"
                                        title="Localizar Pin no Canvas"
                                    >
                                        <Maximize2 size={13} />
                                    </button>
                                )}
                                {onKickListener && (
                                    <button
                                        onClick={() => onKickListener(listener.listenerId)}
                                        className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 text-gray-400 hover:text-red-500 rounded transition-colors"
                                        title="Desconectar Ouvinte"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-400 dark:text-neutral-500 text-xs">
                        {searchTerm ? 'Nenhum ouvinte encontrado.' : 'Nenhum ouvinte conectado.'}
                    </div>
                )}
            </div>

            {/* Footer status count */}
            <div className="p-2 border-t border-gray-200 dark:border-neutral-800 text-[10px] text-gray-500 dark:text-neutral-500 text-center">
                {listeners.length} ouvintes na sessão
            </div>
        </div>
    );

    return (
        <motion.div
            ref={menuRef}
            layout={false}
            initial={false}
            style={{ x, y,
                width,
                height,
                maxHeight: '75vh',
                zIndex: 65
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
            <div className={`flex flex-col h-full select-none`}>
                {/* Header Titlebar */}
                <div
                    className="w-full flex justify-between items-center mb-1 relative flex-shrink-0 touch-none cursor-move select-none"
                    onPointerDown={(e) => {
                        window.getSelection()?.removeAllRanges();
                        document.body.style.userSelect = 'none';
                        document.body.style.webkitUserSelect = 'none';
                        if (e.cancelable) e.preventDefault();
                        dragControls.start(e);
                    }}
                >
                    <span className="font-semibold text-sm text-gray-700 dark:text-neutral-200 flex items-center gap-1.5">
                        <Users size={14} className="text-indigo-500" />
                        Ouvintes Conectados
                    </span>
                    <div className="flex items-center gap-1.5">
                        <GripHorizontal className="text-gray-400" size={16} />
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded text-gray-400 hover:text-red-600 dark:text-neutral-400"
                                onPointerDown={(e) => e.stopPropagation()}
                                title="Fechar"
                            >
                                <X size={15} />
                            </button>
                        )}
                    </div>
                </div>

                {renderContent()}

                {/* Resizing Handle */}
                <div
                    className="absolute bottom-0 right-0 p-1 cursor-nwse-resize hover:bg-neutral-800 rounded-tl z-50 hidden md:block"
                    onMouseDown={handleResizeStart}
                >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-500">
                        <path d="M21 15v6" />
                        <path d="M15 21h6" />
                    </svg>
                </div>
            </div>
        </motion.div>
    );
};

export default ListenersMenu;
