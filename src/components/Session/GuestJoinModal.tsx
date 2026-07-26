import React from 'react';
import { Users, User } from 'lucide-react';

interface GuestJoinModalProps {
    username: string;
    setUsername: (name: string) => void;
    onJoin: (e: React.FormEvent) => void;
    status?: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
    errorMessage?: string | null;
    avatarUrl?: string;
    buttonText?: string;
}

export const GuestJoinModal: React.FC<GuestJoinModalProps> = ({
    username,
    setUsername,
    onJoin,
    status = 'idle',
    errorMessage,
    avatarUrl,
    buttonText = 'Entrar no Canva',
}) => {
    const isConnecting = status === 'connecting';

    return (
        <div className="flex-1 flex items-center justify-center p-4 relative z-10">
            <div className="w-full max-w-md bg-neutral-900/80 backdrop-blur-md border border-neutral-800 rounded-xl p-8 shadow-2xl relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

                {/* Avatar Preview */}
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <div className="w-20 h-20 bg-indigo-500/10 border-2 border-indigo-500/30 rounded-full flex items-center justify-center text-indigo-400 overflow-hidden shadow-lg shadow-indigo-500/10">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt={username || 'Avatar'} className="w-full h-full object-cover" />
                            ) : username.trim() ? (
                                <span className="text-2xl font-bold uppercase tracking-wider text-indigo-300">
                                    {username.trim().slice(0, 2)}
                                </span>
                            ) : (
                                <Users size={36} />
                            )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-neutral-900 p-1 rounded-full border border-neutral-700 text-neutral-400">
                            <User size={12} />
                        </div>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-center mb-2 tracking-tight text-white">Entrar na Sessão</h2>
                <p className="text-sm text-neutral-400 text-center mb-8">
                    Digite seu nome de aventureiro para ouvir trilhas e efeitos sonoros 3D transmitidos em tempo real pelo Narrador.
                </p>

                <form onSubmit={onJoin} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                            Seu Nome
                        </label>
                        <input
                            type="text"
                            required
                            maxLength={30}
                            placeholder="Ex: Legolas, GM..."
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isConnecting || !username.trim()}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg hover:shadow-indigo-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        {isConnecting ? 'Conectando...' : buttonText}
                    </button>

                    {errorMessage && (
                        <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-2">
                            <span className="text-rose-400 text-lg leading-none">⚠️</span>
                            <p className="text-sm text-rose-300 leading-tight flex-1">
                                {errorMessage}
                            </p>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default GuestJoinModal;
