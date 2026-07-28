let sharedAudioCtx: AudioContext | null = null;
let sharedMasterAnalyser: AnalyserNode | null = null;
let sharedMasterGain: GainNode | null = null;

export function getSharedAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!sharedAudioCtx) {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
            sharedAudioCtx = new AudioCtxClass();
        }
    }
    return sharedAudioCtx;
}

export function getMasterAudioNodes(): { masterAnalyser: AnalyserNode | null; masterGain: GainNode | null } {
    const ctx = getSharedAudioContext();
    if (!ctx) return { masterAnalyser: null, masterGain: null };
    
    if (!sharedMasterGain) {
        sharedMasterGain = ctx.createGain();
        sharedMasterGain.gain.value = 1.0;
        sharedMasterGain.connect(ctx.destination);
    }
    if (!sharedMasterAnalyser) {
        sharedMasterAnalyser = ctx.createAnalyser();
        sharedMasterAnalyser.fftSize = 128; // 64 frequency bins
        sharedMasterAnalyser.smoothingTimeConstant = 0.75;
        sharedMasterAnalyser.connect(sharedMasterGain);
    }
    return { masterAnalyser: sharedMasterAnalyser, masterGain: sharedMasterGain };
}

export const resumeAudioContext = async () => {
    const ctx = getSharedAudioContext();
    if (ctx && ctx.state === 'suspended') {
        await ctx.resume();
    }
};

if (typeof window !== 'undefined') {
    const resumeOnGesture = () => {
        resumeAudioContext();
        window.removeEventListener('click', resumeOnGesture);
        window.removeEventListener('keydown', resumeOnGesture);
    };
    window.addEventListener('click', resumeOnGesture);
    window.addEventListener('keydown', resumeOnGesture);
}

