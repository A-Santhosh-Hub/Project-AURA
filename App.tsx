import React, { useState, useCallback, useRef } from 'react';
import { Visualizer } from './components/Visualizer';
import { Controls } from './components/Controls';
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer';
import { VisualizerMode, Theme, CustomizationOptions } from './types';
import { THEMES } from './constants';

const App: React.FC = () => {
  const [mode, setMode] = useState<VisualizerMode>(VisualizerMode.BARS);
  const [theme, setTheme] = useState<Theme>(THEMES[0]);
  const [options, setOptions] = useState<CustomizationOptions>({ sensitivity: 100, complexity: 128 });
  const [audioSource, setAudioSource] = useState<'file' | 'microphone' | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { analyser, isPlaying, error, setupAudio, stopAudio, audioRef } = useAudioAnalyzer();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioSource('file');
      setupAudio('file', file);
    }
  };

  const handleMicRequest = () => {
    setAudioSource('microphone');
    setupAudio('microphone');
  };

  const handleStop = () => {
    stopAudio();
    setAudioSource(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };
  
  const handleOptionsChange = (newOptions: Partial<CustomizationOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }));
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black transition-colors duration-500" style={{ backgroundColor: theme.background }}>
      <h1 className="absolute top-6 md:top-8 left-1/2 -translate-x-1/2 font-orbitron text-2xl md:text-3xl font-bold text-white/50 tracking-[0.2em] pointer-events-none z-20 animate-pulse">
        PROJECT AURA
      </h1>
      
      {isPlaying && analyser && (
        <Visualizer 
          analyser={analyser}
          mode={mode}
          theme={theme}
          options={options}
          isPlaying={isPlaying}
        />
      )}

      {!isPlaying && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-white/80 p-4">
            <div className="text-center bg-black/30 backdrop-blur-md p-8 rounded-xl border border-white/10">
                <h2 className="font-orbitron text-4xl mb-2 text-white">Welcome</h2>
                <p className="max-w-md mb-6">Select an audio source to begin the visualization. For the best experience, use high-quality audio.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-fuchsia-500/80 hover:bg-fuchsia-500/100 text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 border border-fuchsia-400">
                        Upload Audio File
                    </button>
                    <button onClick={handleMicRequest} className="px-6 py-3 bg-cyan-500/80 hover:bg-cyan-500/100 text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 border border-cyan-400">
                        Use Microphone
                    </button>
                </div>
                 {error && <p className="text-red-400 mt-4">{error}</p>}
            </div>
             <p className="absolute bottom-4 text-xs text-white/30 font-orbitron">Developed by SANTHOSH_A</p>
        </div>
      )}
      
      <Controls 
        mode={mode}
        setMode={setMode}
        theme={theme}
        setTheme={setTheme}
        options={options}
        setOptions={handleOptionsChange}
        isPlaying={isPlaying}
        audioSource={audioSource}
        onFileClick={() => fileInputRef.current?.click()}
        onMicClick={handleMicRequest}
        onStopClick={handleStop}
        audioRef={audioRef}
      />
      
      <input 
        type="file" 
        accept="audio/*"
        ref={fileInputRef} 
        onChange={handleFileChange}
        className="hidden" 
      />
    </main>
  );
};

export default App;