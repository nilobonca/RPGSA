import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface GuestVolumeControlProps {
    guestVolume: number;
    isMuted: boolean;
    onVolumeChange: (newVolume: number) => void;
    onToggleMute: () => void;
}

export const GuestVolumeControl: React.FC<GuestVolumeControlProps> = ({
    guestVolume,
    isMuted,
    onVolumeChange,
    onToggleMute
}) => {
    return (
        <div className="fixed bottom-6 right-6 z-[100] group flex items-center flex-row-reverse gap-3 select-none">
            {/* Floating Trigger Button */}
            <button
                type="button"
                onClick={onToggleMute}
                className={`w-12 h-12 rounded-full flex items-center justify-center border shadow-2xl backdrop-blur-md transition-all cursor-pointer ${
                    isMuted || guestVolume === 0
                        ? 'bg-rose-950/90 border-rose-500/40 text-rose-400 hover:bg-rose-900'
                        : 'bg-neutral-900/90 border-neutral-700/80 text-emerald-400 hover:border-emerald-500/50 hover:bg-neutral-800'
                }`}
                title={isMuted ? 'Desmutar' : 'Volume Master'}
            >
                {isMuted || guestVolume === 0 ? <VolumeX size={22} /> : <Volume2 size={22} />}
            </button>

            {/* Hover / Focus Slider Box */}
            <div className="opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-all duration-200 ease-out transform translate-x-2 group-hover:translate-x-0 group-focus-within:translate-x-0 bg-neutral-900/95 border border-neutral-800 rounded-2xl p-3 shadow-2xl backdrop-blur-xl flex items-center gap-3 w-64">
                <button
                    type="button"
                    onClick={onToggleMute}
                    className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        isMuted
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    }`}
                    title={isMuted ? 'Desmutar' : 'Mutar'}
                >
                    {isMuted || guestVolume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>

                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : guestVolume}
                    onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="flex-1 accent-emerald-500 h-2 bg-neutral-800 rounded-lg cursor-pointer touch-none"
                />

                <span className="text-xs font-mono font-bold text-emerald-400 w-10 text-right">
                    {isMuted ? 'OFF' : `${Math.round(guestVolume * 100)}%`}
                </span>
            </div>
        </div>
    );
};
