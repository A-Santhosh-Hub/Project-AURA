import React, { useState, useEffect, useRef } from 'react';
import { VisualizerMode, Theme, CustomizationOptions } from '../types';
import { THEMES } from '../constants';

interface ControlsProps {
  mode: VisualizerMode;
  setMode: (mode: VisualizerMode) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  options: CustomizationOptions;
  setOptions: (options: Partial<CustomizationOptions>) => void;
  isPlaying: boolean;
  audioSource: 'file' | 'microphone' | null;
  onFileClick: () => void;
  onMicClick: () => void;
  onStopClick: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

const modes: { name: VisualizerMode; icon: JSX.Element }[] = [
    { name: VisualizerMode.BARS, icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M3 12h3v9H3v-9zm4 2h3v7H7v-7zm4-5h3v12h-3V9zm4-3h3v15h-3V6z"/></svg> },
    { name: VisualizerMode.WAVEFORM, icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M3 12h2.5c1.5 0 1.5-3 3-3s1.5 3 3 3 1.5-3 3-3 1.5 3 3 3H21"/></svg> },
    { name: VisualizerMode.CIRCLES, icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="8"/></svg> },
    { name: VisualizerMode.PARTICLES, icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 2.5a.5.5 0 01.5.5v2a.5.5 0 01-1 0v-2a.5.5 0 01.5-.5zM19.07 4.93a.5.5 0 010 .707l-1.414 1.414a.5.5 0 11-.707-.707l1.414-1.414a.5.5 0 01.707 0zM21.5 12a.5.5 0 01-.5.5h-2a.5.5 0 010-1h2a.5.5 0 01.5.5zM19.07 19.07a.5.5 0 01-.707 0l-1.414-1.414a.5.5 0 11.707-.707l1.414 1.414a.5.5 0 010 .707zM12 21.5a.5.5 0 01-.5-.5v-2a.5.5 0 011 0v2a.5.5 0 01-.5.5zM4.93 19.07a.5.5 0 010-.707l1.414-1.414a.5.5 0 11.707.707L5.637 19.07a.5.5 0 01-.707 0zM2.5 12a.5.5 0 01.5-.5h2a.5.5 0 010 1h-2a.5.5 0 01-.5-.5zM4.93 4.93a.5.5 0 01.707 0l1.414 1.414a.5.5 0 11-.707-.707L4.93 5.636a.5.5 0 010-.707z"/></svg> },
    { name: VisualizerMode.PETALS, icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm0 3.5c-1.334 2.43-3.5 6.5-3.5 8.5 0 1.933 1.567 3.5 3.5 3.5s3.5-1.567 3.5-3.5c0-2-2.166-6.07-3.5-8.5z" /></svg> },
    { name: VisualizerMode.CITYSCAPE, icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M4 20h3v-6H4v6zm5 0h3v-9H9v9zm5 0h3v-4h-3v4zm5 0h3V9h-3v11zM4 6l8-4 8 4v2H4V6z" /></svg> },
    { name: VisualizerMode.TERRAIN, icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M3 12l6-8 4 4 8-6v10H3z"/></svg> },
    { name: VisualizerMode.TUNNEL, icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg> },
    { name: VisualizerMode.NEBULA, icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><circle cx="12" cy="12" r="1.5"/><circle cx="6" cy="7" r="1"/><circle cx="18" cy="17" r="1"/><circle cx="7" cy="18" r="1.25"/><circle cx="17" cy="6" r="1.25"/></svg> },
    { name: VisualizerMode.CLOTH, icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path d="M4 4c4 0 4 4 8 4s4-4 8-4M4 12c4 0 4 4 8 4s4-4 8-4M4 20c4 0 4-4 8-4s4-4 8-4"/></svg> },
    { name: VisualizerMode.LED_MATRIX, icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M7 7h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2zM7 11h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2zM7 15h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg> },
    { name: VisualizerMode.NIXIE_TUBES, icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><rect x="8" y="5" width="8" height="14" rx="2"/><path d="M12 9a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm0 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"/></svg> },
    { name: VisualizerMode.VU_METERS, icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M12 12l-4-5M20 12a8 8 0 00-16 0"/></svg> },
    { name: VisualizerMode.LIGHT_STRIPS, icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M4 7h16v3H4zm0 7h16v3H4z"/></svg> },
    { name: VisualizerMode.LYRIC_PULSE, icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12.23 8.293l-2.52 6.86h1.96l.52-1.65h2.61l.52 1.65h1.94l-2.5-6.86h-2.53zm-1.07 4.1l1.09-3.04 1.09 3.04h-2.18zM4 18h3v-3.33c1 .53 2.2.83 3.5.83 2.13 0 3.8-1.23 3.8-3.3s-1.67-3.3-3.8-3.3c-1.3 0-2.5.3-3.5.83V6H4v12z"/></svg> },
    { name: VisualizerMode.LOGO_BEAT_POP, icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 2l2.36 7.26h7.64l-6.18 4.48 2.36 7.26-6.18-4.48-6.18 4.48 2.36-7.26-6.18-4.48h7.64L12 2z"/></svg> },
    { name: VisualizerMode.IMAGE_SHATTER, icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M21 8.5V3h-5.5L12 6.5 8.5 3H3v5.5L6.5 12 3 15.5V21h5.5L12 17.5 15.5 21H21v-5.5L17.5 12 21 8.5zM12 13l-4 4H5v-3l4-4h3zm5 5h-3l-4-4v-3l4-4h3v3l-4 4 4 4v3z"/></svg> },
    { name: VisualizerMode.TYPE_JITTER_WARP, icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M11 6c-1.25.75-2.5 1.5-3.5 2.5-1 1-1.5 2-1.5 3.5s.5 2.5 1.5 3.5c1 1 2.25 1.75 3.5 2.5.75.5 1.75.5 2.5 0 1.25-.75 2.5-1.5 3.5-2.5 1-1 1.5-2 1.5-3.5s-.5-2.5-1.5-3.5c-1-1-2.25-1.75-3.5-2.5-.75-.5-1.75-.5-2.5 0zM6.02 5.25L5.27 4.5l-1.06 1.06.75.75C5.46 5.8 5.74 5.5 6.02 5.25zm11.96 0c.28.25.56.55.8.9l.75-.75-1.06-1.06-.75.75zM4.21 7.07l-.75-.75-1.06 1.06.75.75c.25-.28.55-.56.9-.8zM19.79 7.07c.35.24.65.52.9.8l.75-.75-1.06-1.06-.75.75z"/></svg> },
];

const ProgressBar: React.FC<{audioRef: React.RefObject<HTMLAudioElement | null>}> = ({ audioRef }) => {
    const [progress, setProgress] = useState(0);
    const progressRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateProgress = () => {
            setProgress((audio.currentTime / audio.duration) * 100);
        };

        audio.addEventListener('timeupdate', updateProgress);
        return () => audio.removeEventListener('timeupdate', updateProgress);
    }, [audioRef]);

    const handleSeek = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const audio = audioRef.current;
        const progressContainer = progressRef.current;
        if (!audio || !progressContainer) return;

        const rect = progressContainer.getBoundingClientRect();
        const seekPosition = (e.clientX - rect.left) / rect.width;
        audio.currentTime = seekPosition * audio.duration;
    };

    return (
        <div ref={progressRef} onClick={handleSeek} className="w-full h-2 bg-white/10 rounded-full cursor-pointer mt-2">
            <div className="h-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
    );
};

export const Controls: React.FC<ControlsProps> = ({ mode, setMode, theme, setTheme, options, setOptions, isPlaying, audioSource, onFileClick, onMicClick, onStopClick, audioRef }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="fixed bottom-4 right-4 z-50 w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300"
        aria-label="Toggle controls panel"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-7 h-7 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`}><path fillRule="evenodd" d="M11.47 7.72a.75.75 0 011.06 0l7.5 7.5a.75.75 0 11-1.06 1.06L12 9.31l-6.97 6.97a.75.75 0 01-1.06-1.06l7.5-7.5z" clipRule="evenodd" /></svg>
      </button>

      {isPlaying && (
        <div className={`fixed bottom-20 right-4 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <button onClick={onStopClick} className="w-14 h-14 bg-red-500/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center backdrop-blur-md border border-red-400/50 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3-3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" /></svg>
          </button>
        </div>
      )}

      <div 
        className={`fixed bottom-0 left-0 right-0 z-40 text-white p-4 transition-transform duration-500 ease-in-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="max-w-4xl mx-auto bg-black/40 backdrop-blur-xl p-4 sm:p-6 rounded-t-2xl border-t border-x border-white/10">
          
          {isPlaying && (
            <div className="mb-4">
              <div className="flex justify-between items-center text-sm font-orbitron">
                <p>NOW PLAYING: <span className="uppercase text-cyan-400">{audioSource}</span></p>
                <button onClick={onStopClick} className="px-3 py-1 bg-red-500/80 hover:bg-red-500 rounded-md text-xs font-bold transition-colors">STOP</button>
              </div>
              {audioSource === 'file' && <ProgressBar audioRef={audioRef} />}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="space-y-3">
              <h3 className="font-orbitron tracking-wider text-white/80">MODE</h3>
              <div className="grid grid-cols-5 gap-2">
                {modes.map((m) => (
                  <button key={m.name} onClick={() => setMode(m.name)} className={`p-3 rounded-lg transition-all duration-300 aspect-square flex items-center justify-center ${mode === m.name ? 'bg-fuchsia-500/80 border border-fuchsia-400' : 'bg-white/10 hover:bg-white/20'}`} title={m.name}>
                    {m.icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-orbitron tracking-wider text-white/80">THEME</h3>
              <div className="flex items-center gap-3">
                {THEMES.map((t) => (
                  <button key={t.name} onClick={() => setTheme(t)} className={`w-8 h-8 rounded-full transition-all duration-300 border-2 ${theme.name === t.name ? 'border-white scale-110' : 'border-transparent'}`} style={{ background: `linear-gradient(45deg, ${t.colors[0]}, ${t.colors[2]})`}} title={t.name}/>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-orbitron tracking-wider text-white/80">CUSTOMIZE</h3>
              <div className="space-y-2 text-sm">
                <label htmlFor="sensitivity" className="flex justify-between">Sensitivity <span className="text-white/60">{options.sensitivity}</span></label>
                <input id="sensitivity" type="range" min="10" max="200" value={options.sensitivity} onChange={(e) => setOptions({ sensitivity: parseInt(e.target.value) })} className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"/>
                
                <label htmlFor="complexity" className="flex justify-between pt-2">Complexity <span className="text-white/60">{options.complexity}</span></label>
                <input id="complexity" type="range" min="32" max="512" step="32" value={options.complexity} onChange={(e) => setOptions({ complexity: parseInt(e.target.value) })} className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"/>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};
