import React from 'react';
import { X, GripHorizontal } from 'lucide-react';
import { motion, useDragControls, Reorder } from 'framer-motion';
import { useIDB } from '@/utils/indexedDB';
import { ActivePin } from '@/interfaces/utils/indexedDB';
import { useViewportResize } from '@/hooks/useViewportResize';
import { PinItem } from './PinItem';

interface PinManagerProps {
    pins: ActivePin[];
    onToggle: (pin: ActivePin) => void;
    onRename: (pin: ActivePin, newName: string) => void;
    onUpdate: (pin: ActivePin) => void;
    onDelete: (id: string) => void;
    onInteraction?: () => void;
    onClose?: () => void;
}

export const PinManager: React.FC<PinManagerProps> = ({ pins, onToggle, onRename, onUpdate, onDelete, onInteraction, onClose }) => {
    const dragControls = useDragControls();
    const { reorderPins } = useIDB();

    const { size, setSize, position, setPosition, onDragEnd, handleResizeStart, constraintRef, x, y, width, height } = useViewportResize({
        menuId: 'pin',
        initialSize: { width: 300, height: 400 },
        initialPosition: { x: typeof window !== 'undefined' ? window.innerWidth - 320 : 800, y: 100 },
        minWidth: 280,
        minHeight: 200
    });



    const menuRef = React.useRef<HTMLDivElement>(null);

    return (
        <motion.div
            ref={menuRef}
            layout={false}
            initial={false}
            style={{ x, y,
                width,
                height,
                maxHeight: '80vh',
                left: position.x,
                top: position.y
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
                    <span className="font-semibold text-gray-700 dark:text-neutral-200">Pins</span>
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

                <div onPointerDown={(e) => e.stopPropagation()} className="flex-1 overflow-y-auto min-h-0 pr-1 custom-scrollbar">
                    <div className="w-full flex flex-col min-h-0">
                        {pins.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-32 text-center text-gray-400 dark:text-neutral-500">
                                <span className="text-sm">Nenhum pin criado</span>
                            </div>
                        ) : (
                            <Reorder.Group axis="y" values={pins} onReorder={reorderPins} className="space-y-2 pb-2" layoutScroll>
                                {pins.map(pin => (
                                    <PinItem
                                        key={pin.id}
                                        pin={pin}
                                        onToggle={onToggle}
                                        onRename={onRename}
                                        onUpdate={onUpdate}
                                        onDelete={onDelete}
                                    />
                                ))}
                            </Reorder.Group>
                        )}
                    </div>
                </div>
            </div>
            {/* Resize handle */}
            <div
                className="absolute bottom-0 right-0 p-2 cursor-nwse-resize text-gray-300 hover:text-gray-500 dark:hover:text-neutral-400 transition-colors touch-none"
                onPointerDown={handleResizeStart as any}
                title="Redimensionar"
            >
                <svg width="10" height="10" viewBox="0 0 10 10"><path d="M 10 0 L 10 10 L 0 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
        </motion.div>
    );
};
