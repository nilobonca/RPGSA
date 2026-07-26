import React from 'react';
import { Wifi } from 'lucide-react';

interface GuestReconnectingOverlayProps {
    reconnectAttempt: number;
    onLeave: () => void;
    title?: string;
    message?: string;
}

export const GuestReconnectingOverlay: React.FC<GuestReconnectingOverlayProps> = ({
    reconnectAttempt,
    onLeave,
    title = 'Servidor do Mestre Desconectado',
    message = 'A sala do Mestre parece ter sido fechada ou a conexão caiu. Aguardando o Mestre abrir a sala novamente...',
}) => {
    return (
        <div className="fixed inset-0 bg-neutral-950/85 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center text-amber-400 mb-4 animate-pulse">
                <Wifi size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-sm text-neutral-300 max-w-md mb-6 leading-relaxed">
                {message}
            </p>
            <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-full px-5 py-2.5 text-xs font-mono text-amber-400 shadow-xl mb-6">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                Reconectando automaticamente (Tentativa {reconnectAttempt})...
            </div>
            <button
                onClick={onLeave}
                className="text-xs text-neutral-400 hover:text-rose-400 transition-colors underline cursor-pointer"
            >
                Sair da Sessão e voltar ao menu
            </button>
        </div>
    );
};

export default GuestReconnectingOverlay;
