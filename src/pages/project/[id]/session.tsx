import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { getSharedAudioContext, resumeAudioContext } from '@/utils/audio/audioContext';
import { Activity, Play, Volume2, LogOut, Wifi, MessageSquare, Dices, Users } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from '@/interfaces/chat';
import { SessionChat } from '@/components/Chat/SessionChat';
import { DiceTray } from '@/components/Dice/DiceTray';
import Head from 'next/head';

export default function ListenerSession() {
    const router = useRouter();
    const { id: projectId } = router.query;

    const [username, setUsername] = useState('');
    const [isJoined, setIsJoined] = useState(false);
    const [listenerId, setListenerId] = useState('');
    const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'disconnected'>('idle');
    const [ping, setPing] = useState<number | null>(null);
    const [showSpectrogram, setShowSpectrogram] = useState(true);
    const [activeCount, setActiveCount] = useState(0);

    // Chat State
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatClearedAt, setChatClearedAt] = useState<number | null>(null);
    const [isDiceTrayOpen, setIsDiceTrayOpen] = useState(false);
    const [chatSoundEnabled, setChatSoundEnabled] = useState(true);
    const chatSoundEnabledRef = useRef(true);

    // Clicker & Coin Flip Minigame State
    const [isClickerActive, setIsClickerActive] = useState(false);
    const isClickerActiveRef = useRef(isClickerActive);
    const [isFadingOut, setIsFadingOut] = useState(false);
    const [clickerConfig, setClickerConfig] = useState<any>(null);
    const clickerConfigRef = useRef<any>(null);
    const [localClicks, setLocalClicks] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [clickEffect, setClickEffect] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    
    // Coin Flip specific state
    const [coinState, setCoinState] = useState<'idle' | 'spinning' | 'result'>('idle');
    const [coinResultFace, setCoinResultFace] = useState<'heads' | 'tails' | null>(null);
    const [coinCanInteract, setCoinCanInteract] = useState(false);
    const coinSpinTimerRef = useRef<NodeJS.Timeout | null>(null);
    const coinStateRef = useRef<'idle' | 'spinning' | 'result'>('idle');
    const resolveCoinFlipRef = useRef<((forcedResult?: 'heads' | 'tails') => void) | null>(null);
    const forcedCoinResultRef = useRef<'heads' | 'tails' | null>(null);

    // Cards specific state
    const [cardState, setCardState] = useState<{ index: number | null, flipped: Record<number, boolean> }>({ index: null, flipped: {} });
    const [cardPermissions, setCardPermissions] = useState({ canSee: true, canInteract: true, canSeeResult: false });

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const streamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationRef = useRef<number | null>(null);
    const channelRef = useRef<any>(null);
    const peerRef = useRef<any>(null);
    const currentCallRef = useRef<any>(null);
    const audioElRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        isClickerActiveRef.current = isClickerActive;
    }, [isClickerActive]);

    useEffect(() => {
        clickerConfigRef.current = clickerConfig;
    }, [clickerConfig]);

    const playPing = () => {
        if (chatSoundEnabledRef.current) {
            try {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, ctx.currentTime);
                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.3);
            } catch (e) {
                console.error("Failed to play ping", e);
            }
        }
    };

    const sendClickProgress = useCallback((clicks: number, coinResult?: string, cardResult?: { index: number, card?: { type: string, value: string, title?: string }, imageUrl?: string }) => {
        if (channelRef.current) {
            channelRef.current.send({
                type: 'minigame_progress',
                payload: { clicks, coinResult, cardResult }
            });
        }
    }, []);

    const handleMinigameClick = useCallback(() => {
        if (!isClickerActive || gameOver) return;
        
        const newClicks = localClicks + 1;
        setLocalClicks(newClicks);
        
        setClickEffect(true);
        setTimeout(() => setClickEffect(false), 100);
        
        if (chatSoundEnabledRef.current) {
            try {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(60 + Math.random() * 20, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(80 + Math.random() * 20, ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.03);
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.15);
            } catch (e) {}
        }

        sendClickProgress(newClicks);

        if (clickerConfig?.config?.autoClose && newClicks >= (clickerConfig.config.targetClicks || 100)) {
            setGameOver(true);
            
            // Wait a moment so the user sees the final click (e.g., 100/100) before it starts fading out
            setTimeout(() => {
                setIsFadingOut(true);
                const fadeTime = clickerConfig.config.fadeoutTime !== undefined ? Number(clickerConfig.config.fadeoutTime) : 2;
                setTimeout(() => {
                    setIsClickerActive(false);
                    setIsFadingOut(false);
                }, fadeTime * 1000);
            }, 500);
        }
    }, [isClickerActive, gameOver, localClicks, sendClickProgress, clickerConfig]);

    const handleSendMessage = useCallback((text: string, isRoll?: boolean) => {
        if (!channelRef.current) return;

        const msg: ChatMessage = {
            id: uuidv4(),
            senderId: listenerId,
            senderName: username,
            text,
            timestamp: Date.now(),
            isRoll
        };

        // Send to host
        channelRef.current.send({ type: 'chat', payload: msg });

        // Add to local UI
        setChatMessages(prev => [...prev, msg]);
    }, [listenerId, username]);

    const handleCardClick = useCallback((index: number) => {
        if (!isClickerActive || gameOver || !cardPermissions.canInteract) return;
        
        // Prevent double clicking if already selected one
        if (cardState.index !== null) return;
        
        const cards = clickerConfig?.config?.cards || [];
        const card = cards.length > 0 ? cards[index % cards.length] : null;
        
        setCardState(prev => ({
            ...prev,
            index,
            flipped: { ...prev.flipped, [index]: true }
        }));
        
        sendClickProgress(localClicks + 1, undefined, { index, card });
        
        const initialFace = clickerConfig?.config?.initialFace || 'down';
        
        if (initialFace === 'down') {
            if (cardPermissions.canSeeResult) {
                handleSendMessage(`🃏 virou a carta **${index + 1}** e revelou sua escolha!`);
            } else {
                handleSendMessage(`🃏 escolheu a carta **${index + 1}** (secreta)!`);
            }
        } else {
            handleSendMessage(`🃏 escolheu a carta **${index + 1}**!`);
        }
    }, [isClickerActive, gameOver, cardPermissions, cardState.index, clickerConfig, localClicks, sendClickProgress, handleSendMessage]);

    const resolveCoinFlip = useCallback((forcedResult?: 'heads' | 'tails') => {
        if (coinSpinTimerRef.current) {
            clearTimeout(coinSpinTimerRef.current);
            coinSpinTimerRef.current = null;
        }
        const forced = forcedResult || forcedCoinResultRef.current;
        forcedCoinResultRef.current = null;
        const predefined = clickerConfig?.config?.predefinedResult;
        const result = forced 
            || (predefined === 'heads' || predefined === 'tails' ? predefined : undefined)
            || (Math.random() > 0.5 ? 'heads' : 'tails');
        
        const newClicks = localClicks + 1;
        setLocalClicks(newClicks);
        setCoinResultFace(result);
        setCoinState('result');
        coinStateRef.current = 'result';
        sendClickProgress(newClicks, result);
        handleSendMessage(`🪙 girou a moeda e tirou **${result === 'heads' ? 'Cara' : 'Coroa'}**!`, true);
    }, [clickerConfig, localClicks, sendClickProgress, handleSendMessage]);

    // Keep refs in sync
    useEffect(() => {
        resolveCoinFlipRef.current = resolveCoinFlip;
    }, [resolveCoinFlip]);

    const handleCoinClick = useCallback(() => {
        if (!isClickerActive || gameOver || !coinCanInteract || coinState !== 'idle') return;
        
        setCoinState('spinning');
        coinStateRef.current = 'spinning';
        if (channelRef.current) {
            channelRef.current.send({
                type: 'coin_spinning',
                payload: { spinning: true }
            });
        }
        
        if (coinSpinTimerRef.current) clearTimeout(coinSpinTimerRef.current);
        coinSpinTimerRef.current = setTimeout(() => {
            resolveCoinFlip();
        }, 4000);
    }, [isClickerActive, gameOver, coinCanInteract, coinState, resolveCoinFlip]);

    // Generate a unique listenerId on mount
    useEffect(() => {
        setListenerId(Math.random().toString(36).substring(2, 11));
    }, []);

    // Setup Web Audio Analyser
    const initAudioGraph = useCallback(() => {
        if (audioContextRef.current) return;
        
        resumeAudioContext();
        const ctx = getSharedAudioContext();
        if (!ctx) return;
        
        audioContextRef.current = ctx;
        
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyserRef.current = analyser;
    }, []);

    // Scroll spectrogram drawing loop
    const drawSpectrogram = useCallback(() => {
        if (!canvasRef.current || !analyserRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Scroll left by copying canvas and drawing offset
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
            tempCtx.drawImage(canvas, 0, 0);
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(tempCanvas, -1.0, 0);
        }

        // Draw new column at x = width - 1
        const x = width - 1;
        const barHeight = height / bufferLength;

        for (let i = 0; i < bufferLength; i++) {
            const value = dataArray[i]; // 0-255
            let r = 0, g = 0, b = 0;
            
            if (value > 0) {
                const percent = value / 255;
                r = Math.floor(Math.max(0, (percent - 0.25) / 0.75) * 255);
                g = Math.floor(Math.max(0, (percent - 0.5) / 0.5) * 200);
                b = Math.floor(Math.min(1.0, (1.0 - percent) * 1.5) * 180 + percent * 50);
            }

            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(x, height - (i * barHeight), 1, barHeight);
        }

        animationRef.current = requestAnimationFrame(drawSpectrogram);
    }, []);

    // Start/Stop Spectrogram drawing based on visibility and status
    useEffect(() => {
        if (isJoined && showSpectrogram && status === 'connected') {
            animationRef.current = requestAnimationFrame(drawSpectrogram);
        } else {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
        }
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isJoined, showSpectrogram, status, drawSpectrogram]);

    // Join Session
    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !projectId) return;

        setStatus('connecting');
        setErrorMessage(null);
        initAudioGraph();

        const initPeer = async () => {
            try {
                const Peer = (await import('peerjs')).default;
                const peer = new Peer(listenerId, {
                    debug: 1
                });
                peerRef.current = peer;

                peer.on('open', (id) => {

                    const gmPeerId = `visual-sound-design-${projectId}`;

                    
                    const conn = peer.connect(gmPeerId, {
                        metadata: { name: username }
                    });
                    channelRef.current = conn;

                    conn.on('open', () => {

                        setStatus('connected');
                        setIsJoined(true);
                    });

                    conn.on('data', (data: any) => {
                        if (!data) return;

                        if (data.type === 'ping') {
                            conn.send({
                                type: 'pong',
                                payload: { timestamp: data.payload.timestamp }
                            });
                        } else if (data.type === 'kick_listener') {
                            alert("Você foi desconectado da sessão pelo Narrador.");
                            handleLeave();
                        } else if (data.type === 'status_update') {
                            setActiveCount(data.payload.activeCount ?? 0);
                        } else if (data.type === 'chat') {
                            setChatMessages(prev => [...prev, data.payload]);
                            playPing();
                        } else if (data.type === 'minigame_start') {
                            const payload = data.payload;
                            if (payload.gameType === 'coin_flip') {
                                const permissions = payload.config?.permissions || {};
                                const userPerms = permissions[listenerId] || { canSee: true, canInteract: false };
                                
                                if (userPerms.canSee) {
                                    setIsClickerActive(true);
                                    setIsFadingOut(false);
                                    setClickerConfig(payload);
                                    setCoinCanInteract(userPerms.canInteract);
                                    setCoinState('idle');
                                    coinStateRef.current = 'idle';
                                    setCoinResultFace(null);
                                    setGameOver(false);
                                    setTimeLeft(payload.config?.timeLimit || 30);
                                }
                            } else if (payload.gameType === 'cards') {
                                const permissions = payload.config?.permissions || {};
                                const userPerms = permissions[listenerId] || { canSee: true, canInteract: true, canSeeResult: false };
                                
                                if (userPerms.canSee) {
                                    setIsClickerActive(true);
                                    setIsFadingOut(false);
                                    setClickerConfig(payload);
                                    setCardPermissions(userPerms);
                                    setCardState({ index: null, flipped: {} });
                                    setGameOver(false);
                                    setTimeLeft(payload.config?.timeLimit || 0);
                                }
                            } else {
                                setIsClickerActive(true);
                                setIsFadingOut(false);
                                setClickerConfig(payload);
                                setLocalClicks(0);
                                setGameOver(false);
                                setTimeLeft(payload.config?.timeLimit || 30);
                            }
                        } else if (data.type === 'update_card_permissions') {
                            if (clickerConfigRef.current?.gameType === 'cards') {
                                const permissions = data.payload?.config?.permissions || data.payload?.permissions || {};
                                const userPerms = permissions[listenerId];
                                if (userPerms) {
                                    setCardPermissions(userPerms);
                                    if (data.payload?.config) {
                                        setClickerConfig(data.payload);
                                    }
                                    if (!userPerms.canSee) {
                                        setIsClickerActive(false);
                                        setGameOver(true);
                                    } else {
                                        setIsClickerActive(true);
                                        setIsFadingOut(false);
                                        setGameOver(false);
                                    }
                                }
                            }
                        } else if (data.type === 'minigame_end') {
                            setIsClickerActive(false);
                            setGameOver(true);
                            setTimeout(() => {
                                setGameOver(false);
                            }, 3000);
                        } else if (data.type === 'force_coin_result') {
                            if (coinStateRef.current === 'spinning') {
                                forcedCoinResultRef.current = data.payload.result;
                            }
                        }
                    });

                    conn.on('close', () => {

                        setStatus('disconnected');
                        handleLeave();
                    });

                    conn.on('error', (err) => {
                        console.error('[DEBUG] GM connection error:', err);
                        setStatus('disconnected');
                        handleLeave();
                    });
                });

                // Listen for incoming live stream calls from GM
                peer.on('call', (call) => {

                    currentCallRef.current = call;
                    
                    // Answer the call with no outbound stream
                    call.answer();

                    call.on('stream', (remoteStream) => {

                        
                        // 1. Play the stream using the hidden audio element
                        if (audioElRef.current) {
                            audioElRef.current.srcObject = remoteStream;
                            audioElRef.current.play().catch(e => console.error("Play stream failed:", e));
                        }

                        // 2. Connect the stream to the local AudioContext for visual analysis
                        initAudioGraph();
                        const ctx = audioContextRef.current;
                        const analyser = analyserRef.current;
                        if (ctx && analyser) {
                            if (streamSourceRef.current) {
                                try { streamSourceRef.current.disconnect(); } catch (e) {}
                            }
                            const source = ctx.createMediaStreamSource(remoteStream);
                            source.connect(analyser);
                            streamSourceRef.current = source;
                        }
                    });
                });

                peer.on('error', (err: any) => {
                    console.error('[DEBUG] PeerJS client error:', err);
                    if (err.type === 'peer-unavailable') {
                        setErrorMessage('A sessão parece estar offline. Peça para o Mestre abrir a sala do Projeto primeiro.');
                    } else {
                        setErrorMessage('Erro de conexão: ' + err.message);
                    }
                    setStatus('disconnected');
                });
            } catch (err) {
                console.error('Failed to initialize listener PeerJS:', err);
                setStatus('disconnected');
            }
        };

        initPeer();
    };

    // Leave Session Cleanly
    const handleLeave = useCallback(() => {
        if (channelRef.current) {
            channelRef.current.close();
            channelRef.current = null;
        }
        if (currentCallRef.current) {
            currentCallRef.current.close();
            currentCallRef.current = null;
        }
        if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
        }

        // Clean up audio element
        if (audioElRef.current) {
            audioElRef.current.srcObject = null;
        }

        // Clean up Web Audio stream source
        if (streamSourceRef.current) {
            try { streamSourceRef.current.disconnect(); } catch (e) {}
            streamSourceRef.current = null;
        }

        setIsJoined(false);
        setStatus('idle');
        setPing(null);
        setActiveCount(0);
    }, []);

    // Unmount Cleanup
    useEffect(() => {
        return () => {
            if (channelRef.current) {
                channelRef.current.close();
            }
            if (currentCallRef.current) {
                currentCallRef.current.close();
            }
            if (peerRef.current) {
                peerRef.current.destroy();
            }
            if (streamSourceRef.current) {
                try { streamSourceRef.current.disconnect(); } catch (e) {}
            }
        };
    }, []);

    // Timer for clicker minigame
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isClickerActive && !gameOver && timeLeft > 0 && clickerConfig?.gameType !== 'coin_flip') {
            timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        setGameOver(true);
                        setTimeout(() => {
                            setIsClickerActive(false);
                            setGameOver(false);
                        }, 3000);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isClickerActive, gameOver, timeLeft, clickerConfig]);

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans relative overflow-hidden">
            <Head>
                <title>Sessão de Áudio Compartilhada</title>
                <meta name="description" content="Conecte-se para ouvir áudios espaciais 3D em tempo real do Narrador." />
            </Head>

            {/* Hidden audio element for WebRTC live stream playback */}
            <audio ref={audioElRef} style={{ display: 'none' }} />

            {/* Glowing background gradient elements for dark fantasy design */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-950/10 rounded-full blur-[120px] pointer-events-none" />

            {!isJoined ? (
                // 1. Name Input Login Screen
                <div className="flex-1 flex items-center justify-center p-4 relative z-10">
                    <div className="w-full max-w-md bg-neutral-900/80 backdrop-blur-md border border-neutral-800 rounded-xl p-8 shadow-2xl relative">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
                        
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400">
                                <Users size={32} />
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold text-center mb-2 tracking-tight text-white">Entrar na Sessão</h2>
                        <p className="text-sm text-neutral-400 text-center mb-8">
                            Digite seu nome de aventureiro para ouvir trilhas e efeitos sonoros 3D transmitidos em tempo real pelo Narrador.
                        </p>

                        <form onSubmit={handleJoin} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Seu Nome</label>
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
                                disabled={status === 'connecting'}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg hover:shadow-indigo-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                {status === 'connecting' ? 'Conectando...' : 'Entrar na Aventura'}
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
            ) : (
                // 2. Fully Connected Minimal Screen
                <div className="flex-1 flex flex-col p-6 max-w-5xl mx-auto w-full relative z-10">
                    {/* Top status bar */}
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
                                <Wifi size={12} className={ping && ping < 150 ? 'text-emerald-400' : 'text-yellow-500'} />
                                <span className="text-neutral-300 font-mono">{ping !== null ? `${ping}ms` : 'calculando...'}</span>
                            </div>

                            {/* Active Audio Count */}
                            <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-full px-3 py-1 text-xs">
                                <Activity size={12} className="text-indigo-400" />
                                <span className="text-neutral-300 font-mono">{activeCount} canais</span>
                            </div>

                            {/* Dice Button */}
                            <button
                                onClick={() => setIsDiceTrayOpen(!isDiceTrayOpen)}
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
                                onClick={handleLeave}
                                className="bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 p-2 rounded-full transition-colors cursor-pointer"
                                title="Sair da Sessão"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    </div>
                    
                    {/* Floating Dice Tray */}
                    {isDiceTrayOpen && (
                        <div className="absolute top-20 right-4 z-[60]">
                            <DiceTray 
                                onClose={() => setIsDiceTrayOpen(false)}
                                onRoll={(text, isPrivate) => {
                                    if (!isPrivate) {
                                        handleSendMessage(text, true);
                                    }
                                }}
                            />
                        </div>
                    )}

                    {/* Immersive Center Content */}
                    <div className="flex-1 flex flex-col justify-center items-center py-8">
                        <div className="text-center max-w-md mb-8">
                            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mx-auto mb-4 animate-pulse">
                                <Volume2 size={36} />
                            </div>
                            <h2 className="text-xl font-bold text-white tracking-tight mb-2">Transmissão Sintonizada</h2>
                            <p className="text-xs text-neutral-400 leading-relaxed">
                                Você está ouvindo o áudio posicional configurado pelo Narrador. Ajuste o balanço de seus fones de ouvido para imersão total.
                            </p>
                        </div>

                        {/* Spectrogram Canvas Section */}
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
                                        width={800}
                                        height={180}
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

                        {/* Chat Section */}
                        <div className="w-full mt-6 h-[400px]">
                            <SessionChat
                                messages={chatMessages.filter(m => !chatClearedAt || m.timestamp > chatClearedAt)}
                                currentUserId={username}
                                onSendMessage={handleSendMessage}
                                onClear={() => setChatClearedAt(Date.now())}
                                soundEnabled={chatSoundEnabled}
                                onToggleSound={() => {
                                    const nextState = !chatSoundEnabled;
                                    setChatSoundEnabled(nextState);
                                    chatSoundEnabledRef.current = nextState;
                                }}
                                className="h-full"
                            />
                        </div>
                    </div>

                    <div className="text-[10px] text-neutral-600 text-center pt-4 select-none">
                        ID Ouvinte: {listenerId} • Visual Sound Design Multiplayer Engine v1.0
                    </div>

                    {/* Clicker Minigame Overlay */}
                    {isClickerActive && (
                        <div 
                            className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl overflow-hidden transition-opacity ease-out ${isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                            style={{ transitionDuration: `${clickerConfig?.config?.fadeoutTime !== undefined ? clickerConfig.config.fadeoutTime : 2}s` }}
                        >
                            {/* Animated Background Elements */}
                            <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-white/5 rounded-full blur-[120px] opacity-50 animate-pulse" />
                            <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-neutral-600/5 rounded-full blur-[120px] opacity-50 animate-pulse" style={{ animationDelay: '2s' }} />

                            <div className="relative z-10 flex flex-col items-center justify-center p-8 w-full max-w-2xl font-sans">
                                <div className="text-center mb-16">
                                    <h2 className="text-3xl font-light text-white/90 tracking-wide mb-3">
                                        {clickerConfig?.title || (clickerConfig?.gameType === 'coin_flip' ? "Cara ou Coroa" : "Desafio de Cliques")}
                                    </h2>
                                    <p className="text-base text-neutral-400 font-light">
                                        {clickerConfig?.description || (clickerConfig?.gameType === 'coin_flip' ? (coinCanInteract ? "Clique na moeda para girar." : "Aguarde o giro da moeda.") : "Clique o mais rápido possível.")}
                                    </p>
                                </div>

                                {clickerConfig?.gameType === 'coin_flip' ? (
                                    <>
                                        <style dangerouslySetInnerHTML={{ __html: `
                                            @keyframes spinY {
                                                from { transform: rotateY(0deg); }
                                                to { transform: rotateY(360deg); }
                                            }
                                        ` }} />
                                        <div 
                                            className={`mb-20 w-64 h-64 ${coinCanInteract && coinState === 'idle' ? 'cursor-pointer hover:scale-105' : ''} transition-transform duration-300 mx-auto`} 
                                            style={{ perspective: '1000px' }}
                                            onClick={handleCoinClick}
                                        >
                                            <div 
                                                className="relative w-full h-full"
                                                style={{
                                                    transformStyle: 'preserve-3d',
                                                    transform: coinState === 'result' ? (coinResultFace === 'tails' ? 'rotateY(180deg)' : 'rotateY(0deg)') : 'rotateY(0deg)',
                                                    animation: coinState === 'spinning' ? 'spinY 0.3s linear infinite' : 'none',
                                                    transition: coinState !== 'spinning' ? 'transform 0.5s ease-out' : 'none'
                                                }}
                                            >
                                                {/* Front Face (Heads) */}
                                                <div className="absolute inset-0 bg-yellow-500 rounded-full flex flex-col items-center justify-center border-[8px] border-yellow-600 shadow-[0_0_30px_rgba(234,179,8,0.3)]" style={{ backfaceVisibility: 'hidden' }}>
                                                    <span className="text-5xl font-bold text-yellow-900 tracking-wider">CARA</span>
                                                </div>
                                                {/* Back Face (Tails) */}
                                                <div className="absolute inset-0 bg-gray-300 rounded-full flex flex-col items-center justify-center border-[8px] border-gray-400 shadow-[0_0_30px_rgba(156,163,175,0.3)]" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                                                    <span className="text-5xl font-bold text-gray-800 tracking-wider">COROA</span>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : clickerConfig?.gameType === 'cards' ? (
                                    <div className="w-full flex flex-col items-center">
                                        <style dangerouslySetInnerHTML={{ __html: `
                                            @keyframes flipCard {
                                                from { transform: rotateY(0deg); }
                                                to { transform: rotateY(180deg); }
                                            }
                                        ` }} />
                                        
                                        {/* Timer if applicable */}
                                        {clickerConfig?.config?.timeLimit > 0 && (
                                            <div className="mb-8">
                                                <div className="text-4xl font-light text-white/90 font-mono tabular-nums tracking-tighter">
                                                    00:{timeLeft.toString().padStart(2, '0')}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-4 justify-center max-w-4xl">
                                            {Array.from({ length: clickerConfig.config.quantity || 3 }).map((_, i) => {
                                                const isFlipped = cardState.flipped[i] || clickerConfig.config.initialFace === 'up';
                                                const canInteract = cardPermissions.canInteract && !gameOver && cardState.index === null;
                                                const cards = clickerConfig.config.cards || [];
                                                const card = cards.length > 0 ? cards[i % cards.length] : null;

                                                return (
                                                    <div 
                                                        key={i}
                                                        onClick={() => canInteract && handleCardClick(i)}
                                                        className={`relative w-32 h-48 sm:w-40 sm:h-56 rounded-xl shadow-lg transition-transform duration-300 mx-auto ${canInteract ? 'cursor-pointer hover:scale-105 hover:-translate-y-2' : ''} ${cardState.index === i ? 'ring-4 ring-indigo-500 ring-offset-4 ring-offset-neutral-900' : ''}`}
                                                        style={{ perspective: '1000px' }}
                                                    >
                                                        <div 
                                                            className="relative w-full h-full"
                                                            style={{
                                                                transformStyle: 'preserve-3d',
                                                                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                                                                transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                                                            }}
                                                        >
                                                            {/* Front (Card Back) */}
                                                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl border-2 border-indigo-500/30 flex items-center justify-center shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]" style={{ backfaceVisibility: 'hidden' }}>
                                                                <div className="w-12 h-12 border-2 border-indigo-400/30 rotate-45 flex items-center justify-center">
                                                                    <div className="w-8 h-8 border border-indigo-400/20 rotate-45"></div>
                                                                </div>
                                                            </div>
                                                            {/* Back (Card Face) */}
                                                            <div className="absolute inset-0 bg-neutral-100 rounded-xl flex items-center justify-center border-2 border-neutral-300 overflow-hidden flex-col" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                                                                {!cardPermissions.canSeeResult && clickerConfig.config.initialFace === 'down' ? (
                                                                    <span className="text-5xl">❓</span>
                                                                ) : card?.type === 'image' && card.value ? (
                                                                    <>
                                                                      <img src={card.value} alt={`Card ${i+1}`} className="w-full flex-1 object-cover" />
                                                                      {card.title && card.showTitle && (
                                                                        <div className="w-full bg-black/80 text-white text-center py-1 text-xs font-semibold px-1 break-words">
                                                                          {card.title}
                                                                        </div>
                                                                      )}
                                                                    </>
                                                                ) : card?.type === 'text' && card.value ? (
                                                                    <span className="text-3xl font-bold text-neutral-800 text-center px-4 break-words">{card.value}</span>
                                                                ) : (
                                                                    <span className="text-3xl font-bold text-neutral-800">{i + 1}</span>
                                                                )}
                                                            </div>
                                                            </div>
                                                        </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <>

                                                {/* Timer */}
                                                <div className="mb-16">
                                                    <div className="text-7xl font-light text-white/90 font-mono tabular-nums tracking-tighter">
                                                        00:{timeLeft.toString().padStart(2, '0')}
                                                    </div>
                                                </div>

                                                {/* The Big Button */}
                                                <button
                                                    onClick={handleMinigameClick}
                                                    className={`relative group mb-20 focus:outline-none transition-transform duration-300 ease-out ${clickEffect ? 'scale-[0.98]' : 'scale-100 hover:scale-[1.02]'} ${clickerConfig?.config?.imageUrl ? '' : 'rounded-full'}`}
                                                >
                                                    {clickerConfig?.config?.imageUrl ? (
                                                        <div className="w-64 h-64 relative flex items-center justify-center drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)] group-hover:drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)] transition-all duration-500">
                                                            <img 
                                                                src={clickerConfig.config.imageUrl} 
                                                                alt="Minigame target" 
                                                                className="w-full h-full object-contain pointer-events-none"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="relative w-48 h-48 bg-neutral-900/50 border border-white/5 rounded-full flex items-center justify-center shadow-[0_20px_40px_rgba(0,0,0,0.4)] group-hover:shadow-[0_25px_50px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all duration-500">
                                                            <div className="w-32 h-32 bg-[#111] rounded-full shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] flex items-center justify-center border border-white/5">
                                                                <span className="text-neutral-500 font-light text-xl tracking-[0.2em] select-none group-hover:text-neutral-300 transition-colors">CLICAR</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </button>

                                                {/* Progress Bar */}
                                                {!clickerConfig?.config?.hideTarget && (
                                                    <div className="w-full max-w-sm bg-neutral-900/50 border border-white/5 rounded-full h-2 relative overflow-hidden backdrop-blur-sm">
                                                        <div 
                                                            className="h-full rounded-full bg-[#D4C4A8] opacity-80 transition-all duration-500 ease-out relative"
                                                            style={{ width: `${Math.min(100, (localClicks / (clickerConfig?.config?.targetClicks || 100)) * 100)}%` }}
                                                        />
                                                    </div>
                                                )}
                                                <div className="mt-4 text-xs font-light text-neutral-500 tracking-wider">
                                                    {clickerConfig?.config?.hideTarget ? (
                                                        <span>Cliques: {localClicks}</span>
                                                    ) : (
                                                        <span>{localClicks} / {clickerConfig?.config?.targetClicks || 100}</span>
                                                    )}
                                                </div>
                                            </>
                                        )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
