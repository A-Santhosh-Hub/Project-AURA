
import { Theme, CustomizationOptions, InteractionData } from '../types';

const getAverage = (dataArray: Uint8Array, start: number, end: number) => {
  const slice = dataArray.slice(start, end);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
};

export const drawBars = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, theme: Theme, options: CustomizationOptions, interaction: InteractionData) => {
  const { width, height } = ctx.canvas;
  const bufferLength = Math.min(options.complexity, dataArray.length);
  const barWidth = (width / bufferLength) * 2;
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    const barHeight = (dataArray[i] / 255) * height * (options.sensitivity / 100);
    const colorIndex = Math.floor((i / bufferLength) * theme.colors.length);
    ctx.fillStyle = theme.colors[colorIndex % theme.colors.length];
    
    const distanceToMouse = Math.abs(x - interaction.x);
    const effectRadius = 200;
    let extraHeight = 0;
    if (interaction.isActive && distanceToMouse < effectRadius) {
      extraHeight = (1 - distanceToMouse / effectRadius) * 50;
    }

    ctx.fillRect(x, height - barHeight - extraHeight, barWidth, barHeight + extraHeight);
    x += barWidth + 1;
  }
};

export const drawWaveform = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, theme: Theme, options: CustomizationOptions, interaction: InteractionData) => {
  const { width, height } = ctx.canvas;
  const bufferLength = Math.min(options.complexity * 2, dataArray.length);
  const sliceWidth = width / bufferLength;
  
  ctx.lineWidth = 3;
  ctx.strokeStyle = theme.colors[0];
  ctx.beginPath();
  
  let x = 0;
  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 128.0;
    const y = v * (height / 2) * (options.sensitivity / 120);

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
    x += sliceWidth;
  }
  
  ctx.lineTo(width, height / 2);
  ctx.stroke();
};

export const drawCircles = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, theme: Theme, options: CustomizationOptions, interaction: InteractionData) => {
  const { width, height } = ctx.canvas;
  const centerX = width / 2;
  const centerY = height / 2;
  const bufferLength = Math.min(options.complexity, dataArray.length);
  
  const bass = getAverage(dataArray, 0, bufferLength * 0.1);
  const mid = getAverage(dataArray, bufferLength * 0.3, bufferLength * 0.6);
  const treble = getAverage(dataArray, bufferLength * 0.7, bufferLength);
  
  const maxRadius = Math.min(width, height) * 0.4;
  
  for (let i = 0; i < 3; i++) {
    let value, color;
    if (i === 0) { value = bass; color = theme.colors[0]; }
    else if (i === 1) { value = mid; color = theme.colors[1]; }
    else { value = treble; color = theme.colors[2]; }
    
    const radius = (value / 255) * maxRadius * (options.sensitivity / 100);
    
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.arc(centerX, centerY, radius + i * 20, 0, 2 * Math.PI);
    ctx.stroke();
  }
};

let particles: {x: number, y: number, vx: number, vy: number, size: number, life: number, color: string}[] = [];

export const drawParticles = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, theme: Theme, options: CustomizationOptions, interaction: InteractionData) => {
    const { width, height } = ctx.canvas;
    const bufferLength = Math.min(options.complexity, dataArray.length);
    const bass = getAverage(dataArray, 0, bufferLength * 0.2);

    if (bass > 100 * (options.sensitivity / 100)) {
        for (let i = 0; i < 5; i++) {
            particles.push({
                x: interaction.isActive ? interaction.x : width / 2,
                y: interaction.isActive ? interaction.y : height / 2,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                size: Math.random() * 5 + 2,
                life: 100,
                color: theme.colors[Math.floor(Math.random() * theme.colors.length)]
            });
        }
    }

    particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        p.size *= 0.98;

        if (p.life <= 0) {
            particles.splice(index, 1);
        }

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
};

export const drawPetals = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, theme: Theme, options: CustomizationOptions, interaction: InteractionData) => {
    const { width, height } = ctx.canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    const bufferLength = Math.min(options.complexity, dataArray.length);

    ctx.save();
    ctx.translate(centerX, centerY);

    const numPetals = 12;
    for (let i = 0; i < numPetals; i++) {
        const angle = (i / numPetals) * Math.PI * 2;
        ctx.rotate(angle);

        const dataIndex = Math.floor((i / numPetals) * bufferLength);
        const value = dataArray[dataIndex] / 255;
        
        const petalLength = 100 + value * 200 * (options.sensitivity / 100);
        const petalWidth = 20 + value * 50;

        const colorIndex = Math.floor((i / numPetals) * theme.colors.length);
        ctx.fillStyle = theme.colors[colorIndex % theme.colors.length];

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(petalWidth, petalLength / 2, 0, petalLength);
        ctx.quadraticCurveTo(-petalWidth, petalLength / 2, 0, 0);
        ctx.fill();

        ctx.rotate(-angle);
    }
    ctx.restore();
};
