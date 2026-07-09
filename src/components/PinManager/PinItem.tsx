
import React, { useState } from 'react';
import { Reorder } from 'framer-motion';
import { GripVertical, Eye, EyeOff, Edit2, Trash2, User, Ear, MapPin } from 'lucide-react';
import { ActivePin } from '@/interfaces/utils/indexedDB';

interface PinItemProps {
    pin: ActivePin;
    onToggle: (pin: ActivePin) => void;
    onRename: (pin: ActivePin, newName: string) => void;
    onUpdate: (pin: ActivePin) => void;
    onDelete: (id: string) => void;
}

export const PinItem: React.FC<PinItemProps> = ({ pin, onToggle, onRename, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(pin.name);

    const handleRename = () => {
        if (editName.trim()) {
            onRename(pin, editName);
        } else {
            setEditName(pin.name); // Revert if empty
        }
        setIsEditing(false);
    };

    const cycleIcon = () => {
        const nextIcon = (pin.icon === 'pin' || !pin.icon) ? 'person' : pin.icon === 'person' ? 'ear' : 'pin';
        onUpdate({ ...pin, icon: nextIcon });
    };

    const Icon = pin.icon === 'person' ? User : pin.icon === 'ear' ? Ear : MapPin;

    return (
        <Reorder.Item
            value={pin}
            onContextMenu={(e) => e.preventDefault()}
            className={`group flex items-center justify-between p-2 rounded-xl border transition-all duration-200 ${
                pin.enabled 
                ? 'bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm border-transparent shadow-sm hover:shadow-md hover:border-violet-500/30' 
                : 'bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm border-transparent opacity-60 hover:opacity-100'
            }`}
        >
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="cursor-grab active:cursor-grabbing p-1 text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical size={14} />
                </div>

                {/* Icon Toggle */}
                <button
                    onClick={cycleIcon}
                    className="p-1.5 flex-shrink-0 text-violet-500 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400 rounded-lg hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
                    title="Mudar Ícone"
                >
                    <Icon size={14} />
                </button>

                {isEditing ? (
                    <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename();
                            if (e.key === 'Escape') {
                                setEditName(pin.name);
                                setIsEditing(false);
                            }
                        }}
                        autoFocus
                        className="flex-1 bg-white/50 dark:bg-neutral-900/50 border border-violet-500 rounded-lg px-2 min-w-0 h-7 text-[13px] outline-none focus:ring-2 focus:ring-violet-500/20"
                    />
                ) : (
                    <span
                        className="text-[13px] font-medium text-gray-700 dark:text-neutral-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors flex-1 truncate cursor-pointer ml-1"
                        onDoubleClick={() => setIsEditing(true)}
                        title={pin.name}
                    >
                        {pin.name}
                    </span>
                )}
            </div>

            <div className="flex items-center gap-0.5 ml-2">
                <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 text-gray-400 hover:text-violet-500 rounded-lg hover:bg-white dark:hover:bg-neutral-700 transition-colors opacity-0 group-hover:opacity-100"
                    title="Renomear"
                >
                    <Edit2 size={14} />
                </button>
                <button
                    onClick={() => onToggle(pin)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-neutral-200 rounded-lg hover:bg-white dark:hover:bg-neutral-700 transition-colors"
                    title={pin.enabled ? "Ocultar" : "Mostrar"}
                >
                    {pin.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                    onClick={() => onDelete(pin.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors opacity-0 group-hover:opacity-100"
                    title="Excluir"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </Reorder.Item>
    );
};

