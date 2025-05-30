"use client";
import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState } from "react";
import { createNoise3D } from "simplex-noise";

export const WavyBackground = ({
  children,
  className,
  containerClassName,
  colors,
  waveWidth,
  backgroundFill,
  blur = 10,
  speed = "fast",
  waveOpacity = 0.5,
  style,
  ...props
}: {
  children?: any;
  className?: string;
  containerClassName?: string;
  colors?: string[];
  waveWidth?: number;
  backgroundFill?: string;
  blur?: number;
  speed?: "slow" | "fast";
  waveOpacity?: number;
  style?: React.CSSProperties;
  [key: string]: any;
}) => {
  const noise = createNoise3D();
  let w: number,
    h: number,
    nt: number,
    i: number,
    x: number,
    ctx: any,
    canvas: any;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const getSpeed = () => {
    switch (speed) {
      case "slow":
        return 0.001;
      case "fast":
        return 0.002;
      default:
        return 0.001;
    }
  };

  const init = () => {
    canvas = canvasRef.current;
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    const container = canvas.parentElement;
    if (!container) return;
    
    // Make canvas larger than container to allow overflow
    w = ctx.canvas.width = container.offsetWidth + 100;
    h = ctx.canvas.height = container.offsetHeight + 100;
    ctx.filter = `blur(${blur}px)`;
    nt = 0;
    window.onresize = function () {
      if (container) {
        w = ctx.canvas.width = container.offsetWidth + 100;
        h = ctx.canvas.height = container.offsetHeight + 100;
        ctx.filter = `blur(${blur}px)`;
      }
    };
    render();
  };

  const waveColors = colors ?? [
    "#38bdf8",
    "#818cf8",
    "#c084fc",
    "#e879f9",
    "#22d3ee",
  ];
  const drawWave = (n: number) => {
    nt += getSpeed();
    for (i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.strokeStyle = waveColors[i % waveColors.length];
      
      // Draw multiple segments with varying thickness to create taper effect
      const segments = 20;
      const segmentWidth = w / segments;
      
      for (let seg = 0; seg < segments; seg++) {
        const startX = seg * segmentWidth;
        const endX = (seg + 1) * segmentWidth;
        
        // Calculate taper factor for this segment
        const progress = seg / (segments - 1);
        const taperFactor = Math.sin(progress * Math.PI);
        ctx.lineWidth = (waveWidth || 50) * taperFactor;
        
        if (ctx.lineWidth > 1) { // Only draw if thick enough to be visible
          ctx.beginPath();
          for (x = startX; x <= endX; x += 5) {
            var y = noise(x / 800, 0.3 * i, nt) * 100;
            if (x === startX) {
              ctx.moveTo(x, y + h * 0.5);
            } else {
              ctx.lineTo(x, y + h * 0.5);
            }
          }
          ctx.stroke();
        }
      }
    }
  };

  let animationId: number;
  const render = () => {
    ctx.clearRect(0, 0, w, h);
    if (backgroundFill && backgroundFill !== "transparent") {
      ctx.fillStyle = backgroundFill;
      ctx.globalAlpha = waveOpacity || 0.5;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.globalAlpha = waveOpacity || 0.5;
    drawWave(5);
    animationId = requestAnimationFrame(render);
  };

  useEffect(() => {
    init();
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  const [isSafari, setIsSafari] = useState(false);
  useEffect(() => {
    // I'm sorry but i have got to support it on safari.
    setIsSafari(
      typeof window !== "undefined" &&
        navigator.userAgent.includes("Safari") &&
        !navigator.userAgent.includes("Chrome"),
    );
  }, []);

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center",
        containerClassName,
      )}
      style={style}
    >
      <canvas
        className="absolute z-0"
        ref={canvasRef}
        id="canvas"
        style={{
          top: '-50px',
          left: '-50px',
          ...(isSafari ? { filter: `blur(${blur}px)` } : {}),
        }}
      ></canvas>
      <div className={cn("relative z-10", className)} {...props}>
        {children}
      </div>
    </div>
  );
};