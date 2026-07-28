import React, { useEffect, useRef, useState } from 'react';
import { useIDB } from '@/utils/indexedDB';
import { getSharedAudioContext, getMasterAudioNodes, resumeAudioContext } from '@/utils/audio/audioContext';
import { ActiveGlobalTrack } from '@/interfaces/utils/indexedDB';
import { useCanvasGlobalStore } from '@/store/canvasStore';
import { useThemeStore } from '@/store/themeStore';

interface GlobalAudioPlayerProps {
    activeGlobalTracks: ActiveGlobalTrack[];
    isPreviewInstance?: boolean;
    isHiddenReal?: boolean;
}

export default function GlobalAudioPlayer({ activeGlobalTracks, isPreviewInstance, isHiddenReal }: GlobalAudioPlayerProps) {
    const { savedAudios, updateGlobalTrackPersisted } = useIDB();
    const masterVolume = useCanvasGlobalStore(state => state.masterVolume);
    const audioRefs = useRef<{ [id: string]: HTMLAudioElement }>({});
    const gainNodesRefs = useRef<{ [id: string]: GainNode }>({});
    const analyserNodesRefs = useRef<{ [id: string]: AnalyserNode }>({});
    const [pulseIntensity, setPulseIntensity] = useState(0);
    const animFrameRef = useRef<number | null>(null);
    const audioVizEnabled = useThemeStore(state => state.audioVizEnabled);
    const audioVizColor = useThemeStore(state => state.audioVizColor);
    const audioVizIntensity = useThemeStore(state => state.audioVizIntensity);
    const hasAnyPlaying = activeGlobalTracks.some(t => t.isPlaying);

    // Fast panic event handler: fade out and pause all tracks
    useEffect(() => {
        const handlePanic = () => {
            const ctx = getSharedAudioContext();
            activeGlobalTracks.forEach(track => {
                const gainNode = gainNodesRefs.current[track.id];
                const audioElement = audioRefs.current[track.id];
                if (gainNode && ctx) {
                    try {
                        gainNode.gain.cancelScheduledValues(ctx.currentTime);
                        gainNode.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.03);
                    } catch (e) {
                        gainNode.gain.value = 0.0001;
                    }
                }
                if (audioElement) {
                    setTimeout(() => {
                        audioElement.pause();
                    }, 180);
                }
                if (track.isPlaying) {
                    updateGlobalTrackPersisted({ ...track, isPlaying: false });
                }
            });
        };

        window.addEventListener('rpgsa-audio-panic', handlePanic);
        return () => window.removeEventListener('rpgsa-audio-panic', handlePanic);
    }, [activeGlobalTracks, updateGlobalTrackPersisted]);

    // Animation loop: read waveform from AnalyserNode
    useEffect(() => {
        if (!hasAnyPlaying) {
            setPulseIntensity(0);
            return;
        }

        const tick = () => {
            animFrameRef.current = requestAnimationFrame(tick);

            let maxAmplitude = 0;
            const dataArray = new Uint8Array(1024); // fftSize is 2048, frequencyBinCount is 1024

            activeGlobalTracks.forEach(track => {
                if (!track.isPlaying) return;
                const analyser = analyserNodesRefs.current[track.id];
                if (!analyser) return;

                analyser.getByteFrequencyData(dataArray);

                let sum = 0;
                // Only read lower frequencies (bass/beats) for better pulsing
                const bassBins = Math.min(dataArray.length, 150); 
                for (let i = 0; i < bassBins; i++) {
                    sum += dataArray[i];
                }
                const average = sum / bassBins; // 0 to 255

                // scale up so that an average of ~60 reaches amplitude 1
                const amplitude = Math.min(1, average / 60);
                if (amplitude > maxAmplitude) maxAmplitude = amplitude;
            });

            setPulseIntensity(maxAmplitude);
        };

        animFrameRef.current = requestAnimationFrame(tick);
        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [hasAnyPlaying, activeGlobalTracks]);

    // Volume and playback sync loop
    useEffect(() => {
        const interval = setInterval(() => {
            activeGlobalTracks.forEach((track) => {
                const audioElement = audioRefs.current[track.id];
                const gainNode = gainNodesRefs.current[track.id];
                if (!audioElement) return;

                if (track.isPlaying && audioElement.paused) {
                    resumeAudioContext();
                    audioElement.play().catch(e => {
                        if (e.name !== 'AbortError') console.error(e);
                    });
                } else if (!track.isPlaying && !audioElement.paused) {
                    audioElement.pause();
                }

                audioElement.loop = true;

                let targetVolume = 0.0001; // Avoid exact 0 so browser doesn't sleep the Web Audio branch
                const uiAudioEl = document.getElementById(`gm-audio-${track.id}`) as HTMLAudioElement | null;
                if (uiAudioEl) {
                    if (Math.abs(audioElement.currentTime - uiAudioEl.currentTime) > 0.3) {
                        audioElement.currentTime = uiAudioEl.currentTime;
                    }
                    targetVolume = 0.0001;
                } else {
                    if (isHiddenReal) {
                        targetVolume = 0.0001;
                    } else {
                        targetVolume = Math.max(0.0001, Math.min(1, track.volume * masterVolume));
                    }
                }
                
                if (gainNode) {
                    gainNode.gain.value = targetVolume;
                    // Do not mutate audioElement.volume as it may silence the MediaElementAudioSourceNode in some browsers
                    // rely entirely on gainNode for volume control
                    // However, we ensure it's at 1 so the source node gets the full signal
                    if (audioElement.volume !== 1) audioElement.volume = 1;
                } else {
                    audioElement.volume = targetVolume;
                }
            });
        }, 100);
        return () => clearInterval(interval);
    }, [activeGlobalTracks, masterVolume, isHiddenReal]);

    // Compute glow from state and settings
    const blurPx = Math.round(pulseIntensity * 400 * audioVizIntensity);
    const alpha = (pulseIntensity * 0.8 * audioVizIntensity).toFixed(2);
    const showOverlay = audioVizEnabled && pulseIntensity > 0.001;

    return (
        <>
            {/* Hidden audio elements */}
            <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', opacity: 0.01, pointerEvents: 'none' }}>
                {activeGlobalTracks.map(track => {
                    const audioData = savedAudios.find(a => a.id === track.linkedAudioId || a.id === Number(track.linkedAudioId));
                    if (!audioData) return null;
                    return (
                        <audio
                            id={`gm-audio-global-${isPreviewInstance ? 'preview-' : ''}${track.id}`}
                            key={track.id}
                            ref={(el) => {
                                if (el) {
                                    audioRefs.current[track.id] = el;
                                    const anyEl = el as any;
                                    if (!anyEl.__webAudioConnected) {
                                        const ctx = getSharedAudioContext();
                                        if (ctx) {
                                            try {
                                                const sourceNode = ctx.createMediaElementSource(el);
                                                const analyser = ctx.createAnalyser();
                                                analyser.fftSize = 2048;
                                                const gainNode = ctx.createGain();
                                                gainNode.gain.value = 0;

                                                const { masterAnalyser } = getMasterAudioNodes();

                                                sourceNode.connect(analyser);
                                                analyser.connect(gainNode);
                                                if (masterAnalyser) {
                                                    gainNode.connect(masterAnalyser);
                                                } else {
                                                    gainNode.connect(ctx.destination);
                                                }

                                                anyEl.__webAudioConnected = true;
                                                anyEl.__analyser = analyser;
                                                anyEl.__gainNode = gainNode;
                                                
                                                analyserNodesRefs.current[track.id] = analyser;
                                                gainNodesRefs.current[track.id] = gainNode;
                                            } catch (e) {
                                                console.error('[AudioViz] Failed to connect analyser:', e);
                                            }
                                        }
                                    } else {
                                        if (anyEl.__analyser) analyserNodesRefs.current[track.id] = anyEl.__analyser;
                                        if (anyEl.__gainNode) gainNodesRefs.current[track.id] = anyEl.__gainNode;
                                    }
                                } else {
                                    delete audioRefs.current[track.id];
                                    delete analyserNodesRefs.current[track.id];
                                    delete gainNodesRefs.current[track.id];
                                }
                            }}
                            src={audioData.url}
                            preload="auto"
                            crossOrigin="anonymous"
                        />
                    );
                })}
            </div>

            {/* Audio pulse overlay */}
            {showOverlay && !isHiddenReal && (
                <div
                    style={{
                        boxShadow: `inset 0 0 ${blurPx}px ${audioVizColor}${Math.round(parseFloat(alpha) * 255).toString(16).padStart(2, '0')}`,
                        pointerEvents: 'none',
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        zIndex: 9998,
                        transition: 'box-shadow 80ms ease-out',
                    }}
                />
            )}
        </>
    );
}
