import React, { useState } from 'react';
import { Activity, LogOut, Wifi, Dices, Pencil, Check, X } from 'lucide-react';

interface GuestTopBarProps {
    username: string;
    ping: number | null;
    activeCount: number;
    isDiceTrayOpen: boolean;
    onToggleDiceTray: () => void;
    onLeave: () => void;
    onUpdateUsername?: (newName: string) => void;
}

export const GuestTopBar: React.FC<GuestTopBarProps> = ({
    username,
    ping,
    activeCount,
    isDiceTrayOpen,
    onToggleDiceTray,
    onLeave,
    onUpdateUsername
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(username);

    const handleSave = () => {
        const trimmed = editValue.trim();
        if (trimmed && trimmed !== username && onUpdateUsername) {
            onUpdateUsername(trimmed);
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditValue(username);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    return (
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4 mb-6">
            <div className="flex items-center gap-3">
                <span className="flex h-3.5 w-3.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                </span>
                <div>
                    {isEditing ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                                className="bg-neutral-900 border border-neutral-700 focus:border-indigo-500 rounded px-2 py-0.5 text-sm font-semibold text-white focus:outline-none w-40"
                                placeholder="Seu nome"
                                maxLength={24}
                            />
                            <button
                                onClick={handleSave}
                                className="p-1 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 rounded border border-emerald-500/30 transition-colors"
                                title="Salvar nome"
                            >
                                <Check size={14} />
                            </button>
                            <button
                                onClick={handleCancel}
                                className="p-1 bg-neutral-800 text-neutral-400 hover:text-white rounded transition-colors"
                                title="Cancelar"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 group">
                            <h3 className="font-semibold text-white tracking-tight leading-none text-sm">{username}</h3>
                            {onUpdateUsername && (
                                <button
                                    onClick={() => {
                                        setEditValue(username);
                                        setIsEditing(true);
                                    }}
                                    className="opacity-60 group-hover:opacity-100 text-neutral-400 hover:text-indigo-400 transition-all p-0.5 rounded cursor-pointer"
                                    title="Alterar seu nome"
                                >
                                    <Pencil size={12} />
                                </button>
                            )}
                        </div>
                    )}
                    <span className="text-[10px] text-neutral-400 uppercase tracking-widest mt-1 block">Ouvinte Conectado</span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Latency Indicator */}
                <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-full px-3 py-1 text-xs">
                    <Wifi size={12} className={ping !== null && ping < 150 ? 'text-emerald-400' : 'text-yellow-500'} />
                    <span className="text-neutral-300 font-mono">{ping !== null ? `${ping}ms` : 'calculando...'}</span>
                </div>

                {/* Active Audio Count */}
                <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-full px-3 py-1 text-xs">
                    <Activity size={12} className="text-indigo-400" />
                    <span className="text-neutral-300 font-mono">{activeCount} canais</span>
                </div>

                {/* Dice Button */}
                <button
                    onClick={onToggleDiceTray}
                    className={`flex items-center gap-1.5 border px-3 py-1 text-xs rounded-full transition-colors cursor-pointer ${
                        isDiceTrayOpen 
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                    }`}
                    title="Rolar Dados"
                >
                    <Dices size={12} />
                    Dados
                </button>

                {/* Disconnect Button */}
                <button
                    onClick={onLeave}
                    className="bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 p-2 rounded-full transition-colors cursor-pointer"
                    title="Sair da Sessão"
                >
                    <LogOut size={16} />
                </button>
            </div>
        </div>
    );
};
