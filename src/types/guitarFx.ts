export type PedalType =
  | 'tuner'
  | 'gate'
  | 'compressor'
  | 'overdrive'
  | 'distortion'
  | 'fuzz'
  | 'eq'
  | 'chorus'
  | 'flanger'
  | 'phaser'
  | 'tremolo'
  | 'delay'
  | 'reverb'
  | 'pitch';

export type PedalCategory = 'dynamics' | 'distortion' | 'eq' | 'modulation' | 'time' | 'utility';

export interface PedalParamSpec {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number | boolean | string;
  unit?: string;
  type?: 'knob' | 'switch' | 'select';
  options?: { label: string; value: string }[];
}

export interface PedalSpec {
  type: PedalType;
  name: string;
  subtitle: string;
  category: PedalCategory;
  color: string;
  textColor: string;
  accentColor: string;
  params: PedalParamSpec[];
}

export interface PedalInstance {
  id: string;
  type: PedalType;
  name: string;
  enabled: boolean;
  params: Record<string, number | boolean | string>;
  color: string;
}

export type AmpModelId = 'clean_deluxe' | 'british_crunch' | 'modern_high_gain' | 'acoustic_sim' | 'boutique_ac30';

export interface AmpModelSpec {
  id: AmpModelId;
  name: string;
  description: string;
  defaultGain: number;
  defaultBass: number;
  defaultMid: number;
  defaultTreble: number;
  defaultPresence: number;
  driveSupport: boolean;
}

export type CabinetModelId = '1x12_open' | '2x12_british' | '4x12_modern' | 'direct';

export interface CabinetModelSpec {
  id: CabinetModelId;
  name: string;
  description: string;
}

export interface AmpState {
  model: AmpModelId;
  gain: number;
  bass: number;
  mid: number;
  treble: number;
  presence: number;
  master: number;
  driveMode: boolean;
  brightMode: boolean;
  cabinet: CabinetModelId;
  micPosition: number; // 0 (center) to 1 (edge)
  enabled: boolean;
}

export interface TunerState {
  note: string;
  octave: number;
  frequency: number;
  cents: number;
  inTune: boolean;
  active: boolean;
}

export interface GuitarPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  pedals: PedalInstance[];
  amp: AmpState;
}

export interface AudioInputOption {
  deviceId: string;
  label: string;
}
