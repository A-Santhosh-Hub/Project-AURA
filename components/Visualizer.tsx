import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Theme, VisualizerMode, CustomizationOptions, InteractionData } from '../types';
import * as canvasUtils from '../utils/canvasUtils';

interface VisualizerProps {
  analyser: AnalyserNode;
  mode: VisualizerMode;
  theme: Theme;
  options: CustomizationOptions;
  isPlaying: boolean;
}

function usePrevious<T>(value: T): T | undefined {
  // Fix: Provide an explicit initial value to `useRef` to resolve the error.
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

export const Visualizer: React.FC<VisualizerProps> = ({ analyser, mode, theme, options, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [interactionData, setInteractionData] = useState<InteractionData>({ x: 0, y: 0, isActive: false });
  const prevMode = usePrevious(mode);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setInteractionData({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      isActive: true,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setInteractionData(prev => ({ ...prev, isActive: false }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    window.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  useEffect(() => {
    if (prevMode !== undefined && prevMode !== mode) {
      canvasUtils.resetAllState();
      // Clear canvas on mode change
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        ctx.fillStyle = theme.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    let animationFrameId: number;

    const frequencyDataArray = new Uint8Array(analyser.frequencyBinCount);
    const timeDomainDataArray = new Uint8Array(analyser.fftSize);

    const render = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Only clear background for non-persistent visualizers
      if (mode !== VisualizerMode.TERRAIN && mode !== VisualizerMode.PARTICLES && mode !== VisualizerMode.NEBULA && mode !== VisualizerMode.IMAGE_SHATTER) {
        ctx.fillStyle = theme.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (mode === VisualizerMode.NEBULA || mode === VisualizerMode.IMAGE_SHATTER) {
        // Nebula and Shatter have fading background effects
         ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
         ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      if (mode === VisualizerMode.WAVEFORM) {
        analyser.getByteTimeDomainData(timeDomainDataArray);
        canvasUtils.drawWaveform(ctx, timeDomainDataArray, theme, options, interactionData);
      } else {
        analyser.getByteFrequencyData(frequencyDataArray);
        switch (mode) {
          case VisualizerMode.BARS:
            canvasUtils.drawBars(ctx, frequencyDataArray, theme, options, interactionData);
            break;
          case VisualizerMode.CIRCLES:
            canvasUtils.drawCircles(ctx, frequencyDataArray, theme, options, interactionData);
            break;
          case VisualizerMode.PARTICLES:
            canvasUtils.drawParticles(ctx, frequencyDataArray, theme, options, interactionData);
            break;
          case VisualizerMode.PETALS:
            canvasUtils.drawPetals(ctx, frequencyDataArray, theme, options, interactionData);
            break;
          case VisualizerMode.CITYSCAPE:
            canvasUtils.drawCityscape(ctx, frequencyDataArray, theme, options, interactionData);
            break;
          case VisualizerMode.TERRAIN:
            canvasUtils.drawTerrain(ctx, frequencyDataArray, theme, options, interactionData);
            break;
          case VisualizerMode.TUNNEL:
            canvasUtils.drawTunnel(ctx, frequencyDataArray, theme, options, interactionData);
            break;
          case VisualizerMode.NEBULA:
            canvasUtils.drawNebula(ctx, frequencyDataArray, theme, options, interactionData);
            break;
          case VisualizerMode.CLOTH:
            canvasUtils.drawCloth(ctx, frequencyDataArray, theme, options, interactionData);
            break;
          case VisualizerMode.LED_MATRIX:
            canvasUtils.drawLedMatrix(ctx, frequencyDataArray, theme, options, interactionData);
            break;
          case VisualizerMode.NIXIE_TUBES:
            canvasUtils.drawNixieTubes(ctx, frequencyDataArray, theme, options, interactionData);
            break;
          case VisualizerMode.VU_METERS:
            canvasUtils.drawVuMeters(ctx, frequencyDataArray, theme, options, interactionData);
            break;
          case VisualizerMode.LIGHT_STRIPS:
            canvasUtils.drawLightStrips(ctx, frequencyDataArray, theme, options, interactionData);
            break;
          case VisualizerMode.LYRIC_PULSE:
            canvasUtils.drawLyricPulse(ctx, frequencyDataArray, theme, options, interactionData);
            break;
          case VisualizerMode.LOGO_BEAT_POP:
            canvasUtils.drawLogoBeatPop(ctx, frequencyDataArray, theme, options, interactionData);
            break;
          case VisualizerMode.IMAGE_SHATTER:
            canvasUtils.drawImageShatter(ctx, frequencyDataArray, theme, options, interactionData);
            break;
          case VisualizerMode.TYPE_JITTER_WARP:
            canvasUtils.drawTypeJitterWarp(ctx, frequencyDataArray, theme, options, interactionData);
            break;
          default:
            canvasUtils.drawBars(ctx, frequencyDataArray, theme, options, interactionData);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    if (isPlaying) {
        render();
    } else {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = theme.background;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [analyser, isPlaying, mode, theme, options, interactionData, prevMode]);

  const handleResize = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
      canvasUtils.resetAllState(); // Reset state on resize to re-initialize with new dimensions
    }
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  return <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />;
};
