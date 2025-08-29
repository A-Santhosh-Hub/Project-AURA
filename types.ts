export enum VisualizerMode {
  BARS = 'Bars',
  WAVEFORM = 'Waveform',
  CIRCLES = 'Circles',
  PARTICLES = 'Particles',
  PETALS = 'Petals',
  CITYSCAPE = 'Cityscape',
  TERRAIN = 'Terrain',
  TUNNEL = 'Tunnel',
  NEBULA = 'Nebula',
  CLOTH = 'Cloth',
  LED_MATRIX = 'LED Matrix',
  NIXIE_TUBES = 'Nixie Tubes',
  VU_METERS = 'VU Meters',
  LIGHT_STRIPS = 'Light Strips',
  LYRIC_PULSE = 'Lyric Pulse',
  LOGO_BEAT_POP = 'Logo Beat Pop',
  IMAGE_SHATTER = 'Image Shatter',
  TYPE_JITTER_WARP = 'Type Jitter/Warp',
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
