import React from 'react';
import { Activity } from 'lucide-react';

interface GuestSpectrogramCanvasProps {
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    showSpectrogram: boolean;
    setShowSpectrogram: (show: boolean) => void;
    activeCount: number;
    width?: number;
    height?: number;
}

export const GuestSpectrogramCanvas: React.FC<GuestSpectrogramCanvasProps> = ({
    canvasRef,
    showSpectrogram,
    setShowSpectrogram,
    activeCount,
    width = 800,
    height = 180,
}) => {
    return (
        <div className="w-full bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-4 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                    <Activity size={14} className="text-indigo-400" />
                    Espectrograma Acústico
                </span>
                <button
                    onClick={() => setShowSpectrogram(!showSpectrogram)}
                    className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-1 rounded transition-colors cursor-pointer font-medium"
                >
                    {showSpectrogram ? 'Ocultar Visualizador' : 'Mostrar Visualizador'}
                </button>
            </div>

            {showSpectrogram ? (
                <div className="bg-black/60 rounded-lg overflow-hidden border border-neutral-800/50 relative h-[180px] w-full">
                    <canvas
                        ref={canvasRef}
                        width={width}
                        height={height}
                        className="w-full h-full block bg-black"
                    />
                    {activeCount > 0 && showSpectrogram && (
                        <div className="absolute top-2 left-2 flex gap-1">
                            <div className="w-1 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-1 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    )}
                    {activeCount === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-[11px] text-neutral-600 font-mono uppercase tracking-widest">
                            Silêncio no Canvas
                        </div>
                    )}
                </div>
            ) : (
                <div className="border border-dashed border-neutral-800 rounded-lg py-8 text-center text-xs text-neutral-500 font-medium">
                    Visualizador desativado para economia de recursos.
                </div>
            )}
        </div>
    );
};

export default GuestSpectrogramCanvas;
