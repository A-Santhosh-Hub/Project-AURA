
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

export const Visualizer: React.FC<VisualizerProps> = ({ analyser, mode, theme, options, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [interactionData, setInteractionData] = useState<InteractionData>({ x: 0, y: 0, isActive: false });

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
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    let animationFrameId: number;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const render = () => {
      analyser.getByteFrequencyData(dataArray);
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = theme.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      switch (mode) {
        case VisualizerMode.BARS:
          canvasUtils.drawBars(ctx, dataArray, theme, options, interactionData);
          break;
        case VisualizerMode.CIRCLES:
          canvasUtils.drawCircles(ctx, dataArray, theme, options, interactionData);
          break;
        case VisualizerMode.WAVEFORM:
          canvasUtils.drawWaveform(ctx, dataArray, theme, options, interactionData);
          break;
        case VisualizerMode.PARTICLES:
          canvasUtils.drawParticles(ctx, dataArray, theme, options, interactionData);
          break;
        case VisualizerMode.PETALS:
          canvasUtils.drawPetals(ctx, dataArray, theme, options, interactionData);
          break;
        default:
          canvasUtils.drawBars(ctx, dataArray, theme, options, interactionData);
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
  }, [analyser, isPlaying, mode, theme, options, interactionData]);

  const handleResize = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
    }
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  return <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />;
};
