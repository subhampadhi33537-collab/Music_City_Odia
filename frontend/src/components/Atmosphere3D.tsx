import React, { useEffect, useRef } from 'react';

export const Atmosphere3D: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // ─── PARTICLE STAR FIELD (3D perspective flight) ───────────────
    interface Star {
      x: number; y: number; z: number;
      px: number; py: number; // previous position for streaks
      speedZ: number;
      color: string;
      size: number;
    }

    const STAR_COUNT = 70;
    const stars: Star[] = [];
    const starColors = [
      'rgba(249, 115, 22, ',
      'rgba(234, 179, 8, ',
      'rgba(255, 255, 255, ',
      'rgba(16, 185, 129, ',
      'rgba(236, 72, 153, ',
      'rgba(255, 255, 255, ',
      'rgba(255, 255, 255, ',
    ];

    const resetStar = (s: Star) => {
      s.x = (Math.random() - 0.5) * width;
      s.y = (Math.random() - 0.5) * height;
      s.z = Math.random() * 900 + 100;
      s.px = s.x;
      s.py = s.y;
      s.speedZ = Math.random() * 0.6 + 0.2;
      s.color = starColors[Math.floor(Math.random() * starColors.length)];
      s.size = Math.random() * 1.5 + 0.5;
    };

    for (let i = 0; i < STAR_COUNT; i++) {
      const s: Star = { x: 0, y: 0, z: 0, px: 0, py: 0, speedZ: 0, color: '', size: 0 };
      resetStar(s);
      s.z = Math.random() * 1000; // scatter initial z
      stars.push(s);
    }

    // ─── AUDIO WAVE RINGS ───────────────────────────────────────────
    interface Ring {
      radius: number;
      maxRadius: number;
      alpha: number;
      color: string;
      lineWidth: number;
    }
    const rings: Ring[] = [];
    const addRing = () => {
      const colors = ['249,115,22', '234,179,8', '16,185,129'];
      rings.push({
        radius: 0,
        maxRadius: 200 + Math.random() * 200,
        alpha: 0.4,
        color: colors[Math.floor(Math.random() * colors.length)],
        lineWidth: 0.8 + Math.random() * 1.2,
      });
    };
    // Add rings occasionally
    let ringTimer = 0;
    const RING_INTERVAL = 120; // frames

    // ─── FLOATING NEBULA BLOBS ──────────────────────────────────────
    interface Blob {
      x: number; y: number;
      radius: number;
      color: string;
      vx: number; vy: number;
      alpha: number;
    }
    const blobs: Blob[] = [
      { x: width * 0.15, y: height * 0.25, radius: 350, color: 'rgba(249,115,22,', vx: 0.08, vy: 0.04, alpha: 0.055 },
      { x: width * 0.8, y: height * 0.15, radius: 280, color: 'rgba(234,179,8,', vx: -0.06, vy: 0.05, alpha: 0.04 },
      { x: width * 0.5, y: height * 0.7, radius: 320, color: 'rgba(16,185,129,', vx: 0.05, vy: -0.07, alpha: 0.03 },
      { x: width * 0.85, y: height * 0.75, radius: 250, color: 'rgba(236,72,153,', vx: -0.04, vy: -0.04, alpha: 0.025 },
    ];

    // ─── LASER BEAMS ────────────────────────────────────────────────
    interface LaserBeam {
      x1: number; y1: number;
      x2: number; y2: number;
      alpha: number;
      color: string;
      life: number;
      maxLife: number;
    }
    const lasers: LaserBeam[] = [];
    let laserTimer = 0;
    const LASER_INTERVAL = 300;

    const addLaser = () => {
      const side = Math.floor(Math.random() * 4);
      let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
      if (side === 0) { x1 = Math.random() * width; y1 = 0; }
      else if (side === 1) { x1 = width; y1 = Math.random() * height; }
      else if (side === 2) { x1 = Math.random() * width; y1 = height; }
      else { x1 = 0; y1 = Math.random() * height; }
      x2 = width / 2 + (Math.random() - 0.5) * 300;
      y2 = height / 2 + (Math.random() - 0.5) * 200;
      const colors = ['rgba(249,115,22,', 'rgba(234,179,8,', 'rgba(16,185,129,'];
      lasers.push({ x1, y1, x2, y2, alpha: 0.25, color: colors[Math.floor(Math.random() * colors.length)], life: 0, maxLife: 80 });
    };

    const fov = 400;
    const cx = () => width / 2;
    const cy = () => height / 2;

    const render = () => {
      time++;
      ctx.clearRect(0, 0, width, height);

      // ── Draw blobs (nebula clouds) ──
      for (const b of blobs) {
        b.x += b.vx;
        b.y += b.vy;
        if (b.x < -b.radius) b.x = width + b.radius;
        if (b.x > width + b.radius) b.x = -b.radius;
        if (b.y < -b.radius) b.y = height + b.radius;
        if (b.y > height + b.radius) b.y = -b.radius;

        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius);
        grad.addColorStop(0, `${b.color}${b.alpha})`);
        grad.addColorStop(1, `${b.color}0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Draw laser beams ──
      laserTimer++;
      if (laserTimer >= LASER_INTERVAL) {
        addLaser();
        laserTimer = 0;
      }
      for (let i = lasers.length - 1; i >= 0; i--) {
        const l = lasers[i];
        l.life++;
        const progress = l.life / l.maxLife;
        const a = progress < 0.3
          ? (progress / 0.3) * l.alpha
          : l.alpha * (1 - (progress - 0.3) / 0.7);
        ctx.beginPath();
        ctx.moveTo(l.x1, l.y1);
        ctx.lineTo(l.x2, l.y2);
        ctx.strokeStyle = `${l.color}${a})`;
        ctx.lineWidth = 0.6;
        ctx.shadowBlur = 12;
        ctx.shadowColor = `${l.color}0.6)`;
        ctx.stroke();
        ctx.shadowBlur = 0;
        if (l.life >= l.maxLife) lasers.splice(i, 1);
      }

      // ── Draw 3D star field ──
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.px = (fov / (fov + s.z)) * s.x + cx();
        s.py = (fov / (fov + s.z)) * s.y + cy();
        s.z -= s.speedZ;

        if (s.z <= 0 || s.px < 0 || s.px > width || s.py < 0 || s.py > height) {
          resetStar(s);
          continue;
        }

        const scale = fov / (fov + s.z);
        const sx = s.x * scale + cx();
        const sy = s.y * scale + cy();
        const radius = Math.max(0.2, s.size * scale * 2);
        const alpha = Math.min(0.9, scale * 1.5);

        // Draw streak for fast stars
        if (s.speedZ > 0.5 && s.z < 400) {
          ctx.beginPath();
          ctx.moveTo(s.px, s.py);
          ctx.lineTo(sx, sy);
          ctx.strokeStyle = `${s.color}${alpha * 0.6})`;
          ctx.lineWidth = radius * 0.8;
          ctx.stroke();
        }

        // Draw star dot
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fillStyle = `${s.color}${alpha})`;
        ctx.shadowBlur = 6 * scale;
        ctx.shadowColor = `${s.color}0.9)`;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // ── Draw audio rings from center ──
      ringTimer++;
      if (ringTimer >= RING_INTERVAL) {
        addRing();
        ringTimer = 0;
      }
      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i];
        r.radius += 1.2;
        r.alpha = (1 - r.radius / r.maxRadius) * 0.25;
        if (r.radius >= r.maxRadius || r.alpha <= 0) {
          rings.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(cx(), cy() + 100, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r.color},${r.alpha})`;
        ctx.lineWidth = r.lineWidth;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `rgba(${r.color},0.4)`;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Canvas: 3D star tunnel + laser beams + audio rings */}
      <canvas ref={canvasRef} className="absolute inset-0 opacity-70" />

      {/* ── Volumetric nebula glow orbs ── */}
      <div className="absolute top-0 left-0 w-[700px] h-[700px] bg-studio-accent/6 rounded-full blur-[180px] animate-pulse-glow -translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[600px] h-[600px] bg-studio-gold/5 rounded-full blur-[160px] animate-float-slow translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[550px] h-[550px] bg-emerald-500/4 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-pink-500/3 rounded-full blur-[140px] animate-float-reverse pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-studio-accent/3 rounded-full blur-[200px] animate-pulse-glow pointer-events-none" style={{ animationDelay: '1.5s' }} />

      {/* ── Cinematic scan line ── */}
      <div className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-studio-accent/20 to-transparent top-0 animate-float-slow pointer-events-none" />

      {/* ── 3D Perspective horizon grid ── */}
      <div className="absolute bottom-0 left-0 right-0 h-80 audio-grid-perspective opacity-25 pointer-events-none" />

      {/* ── Top vignette ── */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-studio-dark to-transparent pointer-events-none" />
      {/* ── Bottom vignette ── */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-studio-dark to-transparent pointer-events-none" />
    </div>
  );
};
