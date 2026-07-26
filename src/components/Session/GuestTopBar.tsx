import React from 'react';
import { Activity, LogOut, Wifi, Dices } from 'lucide-react';

interface GuestTopBarProps {
    username: string;
    ping: number | null;
    activeCount: number;
    isDiceTrayOpen: boolean;
    onToggleDiceTray: () => void;
    onLeave: () => void;
}

export const GuestTopBar: React.FC<GuestTopBarProps> = ({
    username,
    ping,
    activeCount,
    isDiceTrayOpen,
    onToggleDiceTray,
    onLeave
}) => {
    return (
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4 mb-6">
            <div className="flex items-center gap-3">
                <span className="flex h-3.5 w-3.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                </span>
                <div>
                    <h3 className="font-semibold text-white tracking-tight leading-none text-sm">{username}</h3>
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
