
export enum VisualizerMode {
  BARS = 'Bars',
  WAVEFORM = 'Waveform',
  CIRCLES = 'Circles',
  PARTICLES = 'Particles',
  PETALS = 'Petals',
}

export interface Theme {
  name: string;
  background: string;
  colors: string[];
}

export interface CustomizationOptions {
  sensitivity: number;
  complexity: number;
}

export interface InteractionData {
  x: number;
  y: number;
  isActive: boolean;
}
