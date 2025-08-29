import { Theme, CustomizationOptions, InteractionData, VisualizerMode } from '../types';

// --- HELPERS ---
const getAverage = (dataArray: Uint8Array, start: number, end: number) => {
  const slice = dataArray.slice(start, end);
  return slice.length > 0 ? slice.reduce((a, b) => a + b, 0) / slice.length : 0;
};

function hexToRgba(hex: string, alpha: number): string {
    let r = 0, g = 0, b = 0;
    if (hex.length == 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length == 7) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function alterColor(hex: string, amount: number) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }
    const num = parseInt(hex, 16);
    let r = (num >> 16) + amount;
    let g = ((num >> 8) & 0x00FF) + amount;
    let b = (num & 0x0000FF) + amount;
    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));
    return `#${(b | (g << 8) | (r << 16)).toString(16).padStart(6, '0')}`;
}

const lightenColor = (hex: string, amount: number) => alterColor(hex, amount);
const darkenColor = (hex: string, amount: number) => alterColor(hex, -amount);


// --- STATE MANAGEMENT ---
let particles: {x: number, y: number, vx: number, vy: number, size: number, life: number, color: string}[] = [];
let tunnelRings: { z: number }[] = [];
let nebulaParticles: { x: number, y: number, size: number, opacity: number, color: string, band: 'bass' | 'mid' | 'treble' }[] = [];
let clothFrame = 0;
let vuLeftNeedleAngle: number = -Math.PI / 1.5;
let vuRightNeedleAngle: number = -Math.PI / 1.5;
// New state for text/image visualizers
let logoBeatState = { scale: 1, blur: 0 };
let prevBass = 0;
let shards: {
    x: number; y: number;
    vx: number; vy: number;
    angle: number; rotation: number;
    points: {x: number, y: number}[];
    color: string;
}[] = [];

export const resetAllState = () => {
    particles = [];
    tunnelRings = [];
    nebulaParticles = [];
    clothFrame = 0;
    vuLeftNeedleAngle = -Math.PI / 1.5;
    vuRightNeedleAngle = -Math.PI / 1.5;
    logoBeatState = { scale: 1, blur: 0 };
    prevBass = 0;
    shards = [];
}

// --- VISUALIZERS ---

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
  const bufferLength = dataArray.length;
  
  ctx.lineWidth = 2;
  ctx.strokeStyle = theme.colors[0];
  ctx.shadowColor = theme.colors[0];
  ctx.shadowBlur = 5;

  ctx.beginPath();
  
  const sliceWidth = width / bufferLength;
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    const v = (dataArray[i] / 128.0) - 1.0; 
    const y = (height / 2) + v * (height / 2) * (options.sensitivity / 100);

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
    x += sliceWidth;
  }
  
  ctx.lineTo(width, height / 2);
  ctx.stroke();

  ctx.shadowBlur = 0;
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
    
    // Fading background effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, width, height);

    particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        p.size *= 0.98;

        if (p.life <= 0 || p.size < 0.5) {
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

export const drawCityscape = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, theme: Theme, options: CustomizationOptions, interaction: InteractionData) => {
  const { width, height } = ctx.canvas;
  const bufferLength = Math.min(options.complexity, dataArray.length);
  const barWidth = width / bufferLength;
  const perspectiveDepth = barWidth * 0.7;

  for (let i = 0; i < bufferLength; i++) {
    const barHeight = (dataArray[i] / 255) * height * 0.8 * (options.sensitivity / 100);
    const x = i * barWidth;
    
    const color = theme.colors[i % theme.colors.length];
    
    ctx.fillStyle = color;
    ctx.fillRect(x, height - barHeight, barWidth, barHeight);

    ctx.fillStyle = lightenColor(color, 20);
    ctx.beginPath();
    ctx.moveTo(x, height - barHeight);
    ctx.lineTo(x + perspectiveDepth, height - barHeight - perspectiveDepth);
    ctx.lineTo(x + barWidth + perspectiveDepth, height - barHeight - perspectiveDepth);
    ctx.lineTo(x + barWidth, height - barHeight);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = darkenColor(color, 20);
    ctx.beginPath();
    ctx.moveTo(x + barWidth, height - barHeight);
    ctx.lineTo(x + barWidth + perspectiveDepth, height - barHeight - perspectiveDepth);
    ctx.lineTo(x + barWidth + perspectiveDepth, height - perspectiveDepth);
    ctx.lineTo(x + barWidth, height);
    ctx.closePath();
    ctx.fill();
  }
};

export const drawTerrain = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, theme: Theme, options: CustomizationOptions, interaction: InteractionData) => {
    const { width, height } = ctx.canvas;
    const bufferLength = Math.min(options.complexity, dataArray.length);

    try {
        const existingImage = ctx.getImageData(0, 0, width, height - 1);
        ctx.putImageData(existingImage, 0, 1);
    } catch (e) {
        console.error("Could not process terrain image data. Canvas may be tainted.", e);
        ctx.fillStyle = theme.background;
        ctx.fillRect(0, 0, width, height);
    }

    const sliceWidth = width / bufferLength;
    for (let i = 0; i < bufferLength; i++) {
        const value = dataArray[i];
        const colorIndex = Math.floor((value / 255) * (theme.colors.length -1));
        const alpha = (value / 255) * (options.sensitivity / 100);
        ctx.fillStyle = hexToRgba(theme.colors[colorIndex], alpha);
        ctx.fillRect(i * sliceWidth, 0, sliceWidth, 2);
    }
};

export const drawTunnel = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, theme: Theme, options: CustomizationOptions, interaction: InteractionData) => {
  const { width, height } = ctx.canvas;
  const centerX = width / 2;
  const centerY = height / 2;
  const bufferLength = Math.min(options.complexity, dataArray.length);
  const bass = getAverage(dataArray, 0, bufferLength * 0.1);
  const beat = (bass / 255) * (options.sensitivity / 100);

  const MAX_DEPTH = 40;
  const SPEED = 0.4;

  if (tunnelRings.length === 0 || tunnelRings[tunnelRings.length - 1].z < MAX_DEPTH - 2) {
      if (beat > 0.5) {
        tunnelRings.push({ z: MAX_DEPTH });
      }
  }
  
  ctx.save();
  ctx.translate(centerX, centerY);

  tunnelRings.forEach((ring, index) => {
    ring.z -= SPEED * (1 + beat);
    
    if (ring.z <= 0) {
      tunnelRings.splice(index, 1);
      return;
    }

    const scale = MAX_DEPTH / ring.z;
    const radius = 10 * scale * (1 + beat * 0.5);
    
    const colorIndex = Math.floor(index) % theme.colors.length;
    ctx.strokeStyle = hexToRgba(theme.colors[colorIndex], 1 - (ring.z / MAX_DEPTH));
    ctx.lineWidth = 2 * scale;
    
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.restore();
};


export const drawNebula = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, theme: Theme, options: CustomizationOptions, interaction: InteractionData) => {
    const { width, height } = ctx.canvas;
    const bufferLength = Math.min(options.complexity, dataArray.length);

    if (nebulaParticles.length === 0) {
        for (let i = 0; i < 250; i++) {
            let band: 'bass' | 'mid' | 'treble';
            if (i % 3 === 0) band = 'bass';
            else if (i % 3 === 1) band = 'mid';
            else band = 'treble';
            nebulaParticles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5,
                color: theme.colors[i % theme.colors.length],
                band: band,
            });
        }
    }

    const bass = getAverage(dataArray, 0, bufferLength * 0.1) / 255;
    const mid = getAverage(dataArray, bufferLength * 0.3, bufferLength * 0.6) / 255;
    const treble = getAverage(dataArray, bufferLength * 0.7, bufferLength) / 255;
    
    nebulaParticles.forEach(p => {
        let bandValue;
        if (p.band === 'bass') bandValue = bass;
        else if (p.band === 'mid') bandValue = mid;
        else bandValue = treble;
        
        p.opacity = bandValue * (options.sensitivity / 100);
        
        p.x += (Math.random() - 0.5) * 0.5;
        p.y += (Math.random() - 0.5) * 0.5;
        
        if (p.x > width) p.x = 0; if (p.x < 0) p.x = width;
        if (p.y > height) p.y = 0; if (p.y < 0) p.y = height;
        
        ctx.fillStyle = hexToRgba(p.color, p.opacity);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + bandValue), 0, Math.PI * 2);
        ctx.fill();
    });
};

export const drawCloth = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, theme: Theme, options: CustomizationOptions, interaction: InteractionData) => {
    clothFrame++;
    const { width, height } = ctx.canvas;
    const bufferLength = Math.min(options.complexity, dataArray.length);
    const GRID_SIZE = Math.max(20, 50 - options.complexity / 10);

    const getPointY = (yPos: number, xPos: number) => {
        const dataIndex = Math.floor((xPos / width) * bufferLength);
        const audioDisplacement = (dataArray[dataIndex] / 255 - 0.5) * 100 * (options.sensitivity / 100);
        const waveDisplacement = Math.sin(xPos * 0.05 + clothFrame * 0.05) * 15;
        return yPos + audioDisplacement + waveDisplacement;
    };

    for (let i = 0; i < height + GRID_SIZE; i += GRID_SIZE) {
        const colorIndex = Math.floor((i / height) * theme.colors.length);
        ctx.strokeStyle = theme.colors[colorIndex % theme.colors.length];
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, getPointY(i, 0));
        for (let j = 0; j < width + GRID_SIZE; j += GRID_SIZE) {
            ctx.lineTo(j, getPointY(i, j));
        }
        ctx.stroke();
    }
};

// --- HARDWARE VISUALIZERS ---

export const drawLedMatrix = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, theme: Theme, options: CustomizationOptions, interaction: InteractionData) => {
    const { width, height } = ctx.canvas;
    const cols = 32;
    const rows = 8;
    const bufferLength = Math.min(options.complexity, dataArray.length);
    
    const cellWidth = width / cols;
    const cellHeight = height / rows;
    const dotRadius = Math.min(cellWidth, cellHeight) * 0.4;
    
    const colWidthInArray = Math.floor(bufferLength / cols);

    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < cols; i++) {
        const arrayStart = i * colWidthInArray;
        const arrayEnd = arrayStart + colWidthInArray;
        const avg = getAverage(dataArray, arrayStart, arrayEnd);
        const litDots = Math.round((avg / 255) * rows * (options.sensitivity / 100));

        for (let j = 0; j < rows; j++) {
            const x = i * cellWidth + cellWidth / 2;
            const y = height - (j * cellHeight + cellHeight / 2);

            const colorIndex = Math.floor((j / rows) * theme.colors.length);
            const color = theme.colors[colorIndex % theme.colors.length];
            
            if (j < litDots) {
                ctx.fillStyle = color;
                ctx.shadowColor = color;
                ctx.shadowBlur = dotRadius * 2;
            } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.shadowBlur = 0;
            }

            ctx.beginPath();
            ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.shadowBlur = 0;
};

const nixieDigitSegments: { [key: string]: number[][] } = { '0':[[0,1,2,3,4,5]], '1':[[1,2]], '2':[[0,1,6,4,3]], '3':[[0,1,6,2,3]], '4':[[5,6,1,2]], '5':[[0,5,6,2,3]], '6':[[0,5,4,3,2,6]], '7':[[0,1,2]], '8':[[0,1,2,3,4,5,6]], '9':[[6,5,0,1,2,3]] };
const segmentCoords = (w:number, h:number):number[][]=>[[0,0,w,0],[w,0,w,h/2],[w,h/2,w,h],[0,h,w,h],[0,h/2,0,h],[0,0,0,h/2],[0,h/2,w,h/2]];
const drawNixieDigit=(ctx:CanvasRenderingContext2D,digit:string,x:number,y:number,w:number,h:number,onColor:string,offColor:string)=>{const s=segmentCoords(w,h),l=nixieDigitSegments[digit]?nixieDigitSegments[digit][0]:[];ctx.save();ctx.translate(x,y);ctx.strokeStyle=offColor;ctx.lineWidth=1.5;s.forEach(c=>{ctx.beginPath();ctx.moveTo(c[0],c[1]);ctx.lineTo(c[2],c[3]);ctx.stroke()});ctx.strokeStyle=onColor;ctx.shadowColor=onColor;ctx.shadowBlur=8;ctx.lineWidth=3;l.forEach(i=>{const c=s[i];ctx.beginPath();ctx.moveTo(c[0],c[1]);ctx.lineTo(c[2],c[3]);ctx.stroke()});ctx.restore()};
export const drawNixieTubes = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, theme: Theme, options: CustomizationOptions, interaction: InteractionData) => {
    const { width, height } = ctx.canvas;
    const bufferLength = Math.min(options.complexity, dataArray.length);
    const bass = getAverage(dataArray, 0, bufferLength * 0.1);
    const mid = getAverage(dataArray, bufferLength * 0.3, bufferLength * 0.6);
    const treble = getAverage(dataArray, bufferLength * 0.7, bufferLength);
    const mapValue = (v:number)=>Math.min(99,Math.floor((v/255)*99*(options.sensitivity/100))).toString().padStart(2,'0');
    const values=[mapValue(bass), mapValue(mid), mapValue(treble)];
    const numTubes=3; const tubeWidth=width/(numTubes+1); const tubeHeight=tubeWidth*1.5; const digitWidth=tubeWidth*0.3; const digitHeight=tubeHeight*0.6; const startY=(height-tubeHeight)/2;
    values.forEach((val,i)=>{const tubeX=tubeWidth*(i+0.5);ctx.strokeStyle='rgba(255,255,255,0.1)';ctx.lineWidth=1;ctx.strokeRect(tubeX,startY,tubeWidth,tubeHeight);drawNixieDigit(ctx,val[0],tubeX+tubeWidth*0.15,startY+tubeHeight*0.2,digitWidth,digitHeight,theme.colors[0],hexToRgba(theme.colors[0],0.1));drawNixieDigit(ctx,val[1],tubeX+tubeWidth*0.55,startY+tubeHeight*0.2,digitWidth,digitHeight,theme.colors[0],hexToRgba(theme.colors[0],0.1))});ctx.shadowBlur=0
};

const drawVUMeterBackground=(ctx:CanvasRenderingContext2D,cx:number,cy:number,r:number)=>{ctx.strokeStyle='rgba(255,255,255,0.5)';ctx.fillStyle='rgba(255,255,255,0.7)';ctx.lineWidth=2;ctx.font=`${r*0.15}px Orbitron,sans-serif`;ctx.textAlign='center';ctx.beginPath();ctx.arc(cx,cy,r,Math.PI*0.6,Math.PI*0.4);ctx.stroke();const t=[-20,-10,-7,-5,-3,0,3];t.forEach((k,i)=>{const a=Math.PI*0.6+(i/(t.length-1))*(Math.PI*0.8),sr=r*0.9,er=r,tr=r*0.8,sx=cx+Math.cos(a)*sr,sy=cy+Math.sin(a)*sr,ex=cx+Math.cos(a)*er,ey=cy+Math.sin(a)*er;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.stroke();const tx=cx+Math.cos(a)*tr,ty=cy+Math.sin(a)*tr+r*0.05;ctx.fillText(k.toString(),tx,ty)})};
export const drawVuMeters = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, theme: Theme, options: CustomizationOptions, interaction: InteractionData) => {
    const { width, height } = ctx.canvas;
    const bufferLength = Math.min(options.complexity, dataArray.length);
    const meterRadius = Math.min(width/4,height/2)*0.8; const lcx=width*0.25; const rcx=width*0.75; const cy=height*0.55;
    drawVUMeterBackground(ctx,lcx,cy,meterRadius);drawVUMeterBackground(ctx,rcx,cy,meterRadius);
    const bass=getAverage(dataArray,0,bufferLength*0.2);const treble=getAverage(dataArray,bufferLength*0.6,bufferLength);
    const mapValToAngle=(v:number)=>{const range=Math.PI*0.8,start=Math.PI*0.6;const norm=Math.min(1,(v/200)*(options.sensitivity/100));return start+norm*range};
    const targetLeft=mapValToAngle(bass);const targetRight=mapValToAngle(treble);
    vuLeftNeedleAngle+=(targetLeft-vuLeftNeedleAngle)*0.1;vuRightNeedleAngle+=(targetRight-vuRightNeedleAngle)*0.1;
    const drawNeedle=(cx:number,angle:number,color:string)=>{const pr=meterRadius*0.1,nl=meterRadius*0.95;const ex=cx+Math.cos(angle)*nl,ey=cy+Math.sin(angle)*nl;ctx.strokeStyle=color;ctx.lineWidth=3;ctx.shadowColor=color;ctx.shadowBlur=5;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(ex,ey);ctx.stroke();ctx.fillStyle=darkenColor(color,50);ctx.beginPath();ctx.arc(cx,cy,pr,0,Math.PI*2);ctx.fill()};
    drawNeedle(lcx,vuLeftNeedleAngle,theme.colors[0]);drawNeedle(rcx,vuRightNeedleAngle,theme.colors[1]);ctx.shadowBlur=0;
};

export const drawLightStrips = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, theme: Theme, options: CustomizationOptions, interaction: InteractionData) => {
    const { width, height } = ctx.canvas;
    const bufferLength = Math.min(options.complexity, dataArray.length);
    const numStrips = 5;
    const stripHeight = height / (numStrips * 2);

    for (let s = 0; s < numStrips; s++) {
        const y = s * (stripHeight * 2) + stripHeight / 2;
        const offset = Math.floor(s * (bufferLength / numStrips));
        for (let i = 0; i < bufferLength; i++) {
            const dataIndex = (i + offset) % bufferLength;
            const value = dataArray[dataIndex] / 255;
            const brightness = value * (options.sensitivity / 100);
            const hue = (i / bufferLength) * 360;
            ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${brightness})`;
            const x = (i / bufferLength) * width;
            const segWidth = (width / bufferLength) + 1;
            ctx.fillRect(x, y, segWidth, stripHeight);
        }
    }
};

// --- NEW TEXT/IMAGE VISUALIZERS ---

export const drawLyricPulse = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, theme: Theme, options: CustomizationOptions, interaction: InteractionData) => {
    const { width, height } = ctx.canvas;
    const bufferLength = Math.min(options.complexity, dataArray.length);
    const bass = getAverage(dataArray, 0, bufferLength * 0.1) / 255;
    const mid = getAverage(dataArray, bufferLength * 0.3, bufferLength * 0.6) / 255;
    const treble = getAverage(dataArray, bufferLength * 0.7, bufferLength) / 255;

    const text = "PROJECT AURA AUDIO REACTIVE";
    const words = text.split(' ');
    const fontSize = Math.min(width / 15, 60);
    ctx.font = `bold ${fontSize}px Orbitron, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const totalWidth = words.reduce((w, word) => w + ctx.measureText(word).width, 0) + (words.length - 1) * (fontSize * 0.5);
    let x = (width - totalWidth) / 2;

    words.forEach((word, index) => {
        const wordWidth = ctx.measureText(word).width;
        const scale = 1 + mid * 0.3 * (options.sensitivity / 100);
        const glow = bass * 20 * (options.sensitivity / 100);
        const colorIndex = Math.floor(treble * (theme.colors.length -1));

        ctx.save();
        ctx.translate(x + wordWidth / 2, height / 2);
        ctx.scale(scale, scale);
        
        ctx.fillStyle = theme.colors[colorIndex % theme.colors.length];
        ctx.shadowColor = theme.colors[0];
        ctx.shadowBlur = glow;
        
        ctx.fillText(word, 0, 0);
        
        ctx.restore();
        
        x += wordWidth + fontSize * 0.5;
    });
    ctx.shadowBlur = 0;
};

export const drawLogoBeatPop = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, theme: Theme, options: CustomizationOptions, interaction: InteractionData) => {
    const { width, height } = ctx.canvas;
    const bufferLength = Math.min(options.complexity, dataArray.length);
    const bass = getAverage(dataArray, 0, bufferLength * 0.1);

    const BEAT_THRESHOLD = 30 * (options.sensitivity / 100);
    if (bass > prevBass + 5 && bass > BEAT_THRESHOLD) {
        logoBeatState.scale = 1.2;
        logoBeatState.blur = 10;
    }

    logoBeatState.scale -= (logoBeatState.scale - 1) * 0.1;
    logoBeatState.blur -= logoBeatState.blur * 0.1;
    prevBass = bass;

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(logoBeatState.scale, logoBeatState.scale);
    ctx.filter = `blur(${logoBeatState.blur}px)`;
    
    // Draw placeholder star logo
    ctx.fillStyle = theme.colors[1];
    ctx.strokeStyle = theme.colors[0];
    ctx.lineWidth = 4;
    ctx.shadowColor = theme.colors[0];
    ctx.shadowBlur = 15;

    const size = Math.min(width, height) * 0.1;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    for (let i = 0; i < 5; i++) {
        ctx.rotate(Math.PI / 5);
        ctx.lineTo(0, -(size * 0.5));
        ctx.rotate(Math.PI / 5);
        ctx.lineTo(0, -size);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();
};

export const drawImageShatter = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, theme: Theme, options: CustomizationOptions, interaction: InteractionData) => {
    const { width, height } = ctx.canvas;
    const bufferLength = Math.min(options.complexity, dataArray.length);
    const overallLevel = getAverage(dataArray, 0, bufferLength) / 255;
    
    // Initialize shards on first run, creating a grid of rectangles (as two triangles each)
    if (shards.length === 0) {
        const imageSize = Math.min(width, height) * 0.5;
        const startX = (width - imageSize) / 2;
        const startY = (height - imageSize) / 2;
        const complexity = Math.max(4, Math.floor(options.complexity / 32));
        const cols = complexity;
        const rows = complexity;
        const cellW = imageSize / cols;
        const cellH = imageSize / rows;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = startX + c * cellW;
                const y = startY + r * cellH;
                const colorIndex = (r * cols + c) % theme.colors.length;
                const color = theme.colors[colorIndex];
                
                const commonProps = {
                    x: x + cellW / 2,
                    y: y + cellH / 2,
                    vx: 0, vy: 0, angle: 0, rotation: 0,
                };
                
                // Triangle 1 (top-left, top-right, bottom-right)
                shards.push({
                    ...commonProps,
                    color: color,
                    points: [
                        { x: -cellW / 2, y: -cellH / 2 },
                        { x:  cellW / 2, y: -cellH / 2 },
                        { x:  cellW / 2, y:  cellH / 2 },
                    ]
                });
                // Triangle 2 (top-left, bottom-right, bottom-left)
                 shards.push({
                    ...commonProps,
                    color: darkenColor(color, 20), // Slightly darker for depth
                    points: [
                        { x: -cellW / 2, y: -cellH / 2 },
                        { x:  cellW / 2, y:  cellH / 2 },
                        { x: -cellW / 2, y:  cellH / 2 },
                    ]
                });
            }
        }
    }
    
    // On a strong transient, apply an explosive force to the shards
    const transientThreshold = 0.7 * (options.sensitivity / 100);
    if (overallLevel > transientThreshold && Math.random() > 0.8) {
        shards.forEach(s => {
            const explosionX = interaction.isActive ? interaction.x : width / 2;
            const explosionY = interaction.isActive ? interaction.y : height / 2;
            const dx = s.x - explosionX;
            const dy = s.y - explosionY;
            const angle = Math.atan2(dy, dx);
            const force = (Math.random() * 10 + 5) * overallLevel;
            s.vx += Math.cos(angle) * force;
            s.vy += Math.sin(angle) * force;
            s.rotation += (Math.random() - 0.5) * 0.5;
        });
    }

    // Update and draw each shard
    shards.forEach(s => {
        // Update physics
        s.x += s.vx;
        s.y += s.vy;
        s.angle += s.rotation;
        s.vx *= 0.98; // Apply friction
        s.vy *= 0.98;
        s.rotation *= 0.98;

        // Wrap shards around the screen edges
        const cellW = Math.abs(s.points[0].x * 2);
        const cellH = Math.abs(s.points[0].y * 2);
        if (s.vx !== 0 || s.vy !== 0) {
            if (s.x > width + cellW) s.x = -cellW;
            if (s.x < -cellW) s.x = width + cellW;
            if (s.y > height + cellH) s.y = -cellH;
            if (s.y < -cellH) s.y = height + cellH;
        }

        // Draw the shard with rotation
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.angle);
        
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.moveTo(s.points[0].x, s.points[0].y);
        for(let i = 1; i < s.points.length; i++) {
             ctx.lineTo(s.points[i].x, s.points[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    });
};

export const drawTypeJitterWarp = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, theme: Theme, options: CustomizationOptions, interaction: InteractionData) => {
    const { width, height } = ctx.canvas;
    const bufferLength = Math.min(options.complexity, dataArray.length);
    const mid = getAverage(dataArray, bufferLength * 0.3, bufferLength * 0.6) / 255;
    const treble = getAverage(dataArray, bufferLength * 0.7, bufferLength) / 255;

    const text = "JITTER // WARP";
    const fontSize = Math.min(width / 10, 80);
    ctx.font = `${fontSize}px Orbitron, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const jitterAmount = treble * 10 * (options.sensitivity / 100);
    const warpAmount = mid * 0.2 * (options.sensitivity / 100);

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const x = width / 2 + (i - text.length / 2) * (fontSize * 0.6);
        const y = height / 2;

        const jitterX = (Math.random() - 0.5) * jitterAmount;
        const jitterY = (Math.random() - 0.5) * jitterAmount;
        
        ctx.save();
        ctx.translate(x + jitterX, y + jitterY);
        
        const warpX = Math.sin(i * 0.5 + performance.now() * 0.005) * warpAmount;
        ctx.transform(1, warpX, warpX, 1, 0, 0); // Shear transform
        
        ctx.fillStyle = theme.colors[i % theme.colors.length];
        ctx.fillText(char, 0, 0);
        
        ctx.restore();
    }
};