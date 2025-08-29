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
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" /></svg>
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
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
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
