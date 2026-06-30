import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useIDB } from '@/utils/indexedDB';
import { getSharedAudioContext } from '@/utils/audio/audioContext';
import { ActiveGlobalTrack } from '@/interfaces/utils/indexedDB';
import { useCanvasGlobalStore } from '@/store/canvasStore';
import { useThemeStore } from '@/store/themeStore';

interface GlobalAudioPlayerProps {
    activeGlobalTracks: ActiveGlobalTrack[];
}

export default function GlobalAudioPlayer({ activeGlobalTracks }: GlobalAudioPlayerProps) {
    const { savedAudios } = useIDB();
    const masterVolume = useCanvasGlobalStore(state => state.masterVolume);
    const audioRefs = useRef<{ [id: string]: HTMLAudioElement }>({});
    const [pulseIntensity, setPulseIntensity] = useState(0);
    const decodedBuffers = useRef<{ [id: string]: AudioBuffer }>({});
    const animFrameRef = useRef<number | null>(null);
    const audioVizEnabled = useThemeStore(state => state.audioVizEnabled);
    const audioVizColor = useThemeStore(state => state.audioVizColor);
    const audioVizIntensity = useThemeStore(state => state.audioVizIntensity);
    const hasAnyPlaying = activeGlobalTracks.some(t => t.isPlaying);

    // Decode audio File into AudioBuffer for direct waveform analysis
    const decodeTrackAudio = useCallback(async (trackId: string, file: File) => {
        if (decodedBuffers.current[trackId]) return;
        try {
            const ctx = getSharedAudioContext();
            if (!ctx) return;
            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
            decodedBuffers.current[trackId] = audioBuffer;
            console.log(`[AudioViz] Decoded buffer for track ${trackId}, duration=${audioBuffer.duration.toFixed(1)}s`);
        } catch (e) {
            console.error('[AudioViz] Failed to decode audio buffer:', e);
        }
    }, []);

    // Decode all active tracks
    useEffect(() => {
        activeGlobalTracks.forEach(track => {
            const audioData = savedAudios.find(a => a.id === track.linkedAudioId || a.id === Number(track.linkedAudioId));
            if (audioData?.file && !decodedBuffers.current[track.id]) {
                decodeTrackAudio(String(track.id), audioData.file);
            }
        });
    }, [activeGlobalTracks, savedAudios, decodeTrackAudio]);

    // Animation loop: read waveform from decoded buffer at current playback position
    useEffect(() => {
        if (!hasAnyPlaying) {
            setPulseIntensity(0);
            return;
        }

        const tick = () => {
            animFrameRef.current = requestAnimationFrame(tick);

            let maxAmplitude = 0;

            activeGlobalTracks.forEach(track => {
                if (!track.isPlaying) return;
                const audioEl = audioRefs.current[track.id];
                const buffer = decodedBuffers.current[track.id];
                if (!audioEl || !buffer) return;

                const currentTime = audioEl.currentTime;
                const sampleRate = buffer.sampleRate;
                const channelData = buffer.getChannelData(0); // mono or left channel
                const sampleIndex = Math.floor(currentTime * sampleRate);

                // Read a window of ~2048 samples around current position
                const windowSize = 2048;
                const start = Math.max(0, sampleIndex - windowSize / 2);
                const end = Math.min(channelData.length, sampleIndex + windowSize / 2);

                let rms = 0;
                for (let i = start; i < end; i++) {
                    rms += channelData[i] * channelData[i];
                }
                rms = Math.sqrt(rms / (end - start));

                // RMS of music is typically 0.05-0.3, scale up
                const amplitude = Math.min(1, rms * 4);
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
                if (!audioElement) return;

                if (track.isPlaying && audioElement.paused) {
                    audioElement.play().catch(e => {
                        if (e.name !== 'AbortError') console.error(e);
                    });
                } else if (!track.isPlaying && !audioElement.paused) {
                    audioElement.pause();
                }

                audioElement.loop = true;

                const uiAudioEl = document.getElementById(`gm-audio-${track.id}`) as HTMLAudioElement | null;
                if (uiAudioEl) {
                    if (Math.abs(audioElement.currentTime - uiAudioEl.currentTime) > 0.3) {
                        audioElement.currentTime = uiAudioEl.currentTime;
                    }
                    audioElement.volume = 0;
                } else {
                    audioElement.volume = Math.max(0, Math.min(1, track.volume * masterVolume));
                }
            });
        }, 100);
        return () => clearInterval(interval);
    }, [activeGlobalTracks, masterVolume]);

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
                            id={`gm-audio-global-${track.id}`}
                            key={track.id}
                            ref={(el) => {
                                if (el) {
                                    audioRefs.current[track.id] = el;
                                } else {
                                    delete audioRefs.current[track.id];
                                }
                            }}
                            src={audioData.url}
                            preload="auto"
                        />
                    );
                })}
            </div>

            {/* Audio pulse overlay — borders glow with music */}
            {showOverlay && (
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
