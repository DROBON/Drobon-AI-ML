import React, { useEffect, useRef } from "react";

interface BrainVisualizerProps {
  isThinking: boolean;
  synapseIntensity?: number;
  lastActivatedCount?: number;
}

export default function BrainVisualizer({
  isThinking,
  synapseIntensity = 30,
  lastActivatedCount = 0,
}: BrainVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight || 240;
      }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initial base nodes for our Brain Neural Network map
    const nodes = [
      // Left hemisphere
      { x: 0.35, y: 0.3, size: 4, vx: 0.001, vy: -0.001, glow: 0 },
      { x: 0.25, y: 0.45, size: 5, vx: -0.001, vy: 0.001, glow: 0 },
      { x: 0.3, y: 0.6, size: 4.5, vx: 0.0005, vy: -0.0005, glow: 0 },
      { x: 0.4, y: 0.7, size: 4, vx: -0.001, vy: -0.001, glow: 0 },
      // Central lobes & Stem
      { x: 0.5, y: 0.25, size: 6, vx: 0.0002, vy: -0.0005, glow: 1 },
      { x: 0.5, y: 0.45, size: 7, vx: -0.0002, vy: 0.0002, glow: 1 },
      { x: 0.5, y: 0.65, size: 5.5, vx: 0.0005, vy: -0.0002, glow: 1 },
      { x: 0.5, y: 0.85, size: 5, vx: -0.0005, vy: 0.0005, glow: 0 },
      // Right hemisphere
      { x: 0.65, y: 0.3, size: 4, vx: -0.001, vy: 0.001, glow: 0 },
      { x: 0.75, y: 0.45, size: 5, vx: 0.001, vy: -0.001, glow: 0 },
      { x: 0.7, y: 0.6, size: 4.5, vx: -0.0005, vy: 0.001, glow: 0 },
      { x: 0.6, y: 0.7, size: 4, vx: 0.001, vy: -0.0005, glow: 0 },
    ];

    // Connect nodes into pairs for synapses
    const connections: [number, number][] = [
      [0, 1], [1, 2], [2, 3], [3, 6], [0, 4], [1, 5], [2, 6], [3, 7],
      [4, 5], [5, 6], [6, 7],
      [8, 4], [9, 5], [10, 6], [11, 7],
      [8, 9], [9, 10], [10, 11]
    ];

    // Dynamic electrical signals traveling along synapse paths
    let signals: Array<{
      from: number;
      to: number;
      progress: number;
      speed: number;
      color: string;
    }> = [];

    let pulseTime = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pulseTime += 0.03;

      // Update node positions subtly and draw background glow
      const cx = canvas.width;
      const cy = canvas.height;

      // Calculate state-dependent visual dynamics
      const activationMultiplier = isThinking ? 3.5 : lastActivatedCount > 0 ? 2 : 1;
      const glowPulses = Math.sin(pulseTime * (isThinking ? 4 : 1)) * 10 + 15;
      const brainGlowRadius = isThinking ? 90 : 50 + synapseIntensity / 2;

      // Main large background energy field for thinking states
      const gradBg = ctx.createRadialGradient(cx / 2, cy * 0.5, 10, cx / 2, cy * 0.5, brainGlowRadius * 1.5);
      gradBg.addColorStop(0, isThinking ? "rgba(139, 92, 246, 0.25)" :"rgba(6, 182, 212, 0.12)");
      gradBg.addColorStop(0.5, isThinking ? "rgba(236, 72, 153, 0.08)" : "rgba(139, 92, 246, 0.04)");
      gradBg.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gradBg;
      ctx.fillRect(0, 0, cx, cy);

      // Randomly spawn learning/combustion signals on thinking
      if (isThinking && Math.random() < 0.15) {
        const connIndex = Math.floor(Math.random() * connections.length);
        const conn = connections[connIndex];
        const dir = Math.random() > 0.5;
        signals.push({
          from: dir ? conn[0] : conn[1],
          to: dir ? conn[1] : conn[0],
          progress: 0,
          speed: 0.015 + Math.random() * 0.015,
          color: Math.random() > 0.5 ? "#a78bfa" : "#ec4899",
        });
      }

      // If user provided matched memories, feed extra neural signals
      if (lastActivatedCount > 0 && signals.length < (lastActivatedCount * 3) && Math.random() < 0.1) {
        const connIndex = Math.floor(Math.random() * connections.length);
        const conn = connections[connIndex];
        signals.push({
          from: conn[0],
          to: conn[1],
          progress: 0,
          speed: 0.025,
          color: "#06b6d4"
        });
      }

      // Draw synapse linkages (mesh lines)
      connections.forEach(([fromIdx, toIdx]) => {
        const fromNode = nodes[fromIdx];
        const toNode = nodes[toIdx];

        const x1 = fromNode.x * cx;
        const y1 = fromNode.y * cy;
        const x2 = toNode.x * cx;
        const y2 = toNode.y * cy;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);

        // Highlight paths when thinking
        if (isThinking) {
          ctx.strokeStyle = "rgba(139, 92, 246, 0.4)";
          ctx.lineWidth = 1.5;
        } else if (lastActivatedCount > 0) {
          ctx.strokeStyle = "rgba(6, 182, 212, 0.35)";
          ctx.lineWidth = 1.2;
        } else {
          ctx.strokeStyle = "rgba(75, 85, 99, 0.25)";
          ctx.lineWidth = 0.8;
        }
        ctx.stroke();
      });

      // Update and draw traveling signals
      signals = signals.filter((sig) => {
        sig.progress += sig.speed;
        if (sig.progress >= 1) {
          return false; // Done
        }

        const fromNode = nodes[sig.from];
        const toNode = nodes[sig.to];

        const x1 = fromNode.x * cx;
        const y1 = fromNode.y * cy;
        const x2 = toNode.x * cx;
        const y2 = toNode.y * cy;

        const currentX = x1 + (x2 - x1) * sig.progress;
        const currentY = y1 + (y2 - y1) * sig.progress;

        ctx.beginPath();
        ctx.arc(currentX, currentY, isThinking ? 4 : 2.5, 0, Math.PI * 2);
        ctx.fillStyle = sig.color;
        ctx.shadowColor = sig.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0; // reset
        return true;
      });

      // Draw interactive nodes (neurons)
      nodes.forEach((node) => {
        // Slow natural drift inside limits
        node.x += node.vx * (isThinking ? 1.5 : 0.8);
        node.y += node.vy * (isThinking ? 1.5 : 0.8);

        // bounce-back from base margins
        if (node.x < 0.15 || node.x > 0.85) node.vx *= -1;
        if (node.y < 0.18 || node.y > 0.82) node.vy *= -1;

        const nx = node.x * cx;
        const ny = node.y * cy;

        // Draw outer glow pulse around active hubs
        const activeGlow = (isThinking ? 12 : 5) + (node.glow ? glowPulses * 0.5 : 0);
        ctx.beginPath();
        ctx.arc(nx, ny, node.size + activeGlow * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = isThinking
          ? "rgba(167, 139, 250, 0.15)"
          : lastActivatedCount > 0
          ? "rgba(6, 182, 212, 0.1)"
          : "rgba(59, 130, 246, 0.05)";
        ctx.fill();

        // Core neuron
        ctx.beginPath();
        ctx.arc(nx, ny, node.size, 0, Math.PI * 2);
        ctx.fillStyle = isThinking ? "#d8b4fe" : lastActivatedCount > 0 ? "#22d3ee" : "#3b82f6";
        ctx.shadowColor = isThinking ? "#c084fc" : "#06b6d4";
        ctx.shadowBlur = isThinking ? 12 : 4;
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      });

      // Overlay text markers inside visualizer to instruct user about ML processes
      ctx.font = "10px JetBrains Mono, monospace";
      ctx.fillStyle = "rgba(156, 163, 175, 0.35)";
      ctx.fillText(`SYNAPSE STRENGTH: ${synapseIntensity}%`, 15, cy - 15);
      
      let statusText = "CORE_IDLE";
      if (isThinking) statusText = "THINKING_&_RETRIEVING...";
      else if (lastActivatedCount > 0) statusText = "KNOWLEDGE_RETRIEVED";
      ctx.fillText(`STATUS: ${statusText}`, cx - 180, cy - 15);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isThinking, synapseIntensity, lastActivatedCount]);

  return (
    <div className="relative w-full h-full min-h-[220px] bg-slate-950/80 rounded-xl overflow-hidden border border-slate-800">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isThinking ? 'bg-purple-400' : 'bg-cyan-400'}`}></span>
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isThinking ? 'bg-purple-500' : 'bg-cyan-500'}`}></span>
        </span>
        <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
          {isThinking ? "সিন্যাপ্স ফায়ারিং..." : "লাইভ ব্রেন সিমুলেটর (Core)"}
        </span>
      </div>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
