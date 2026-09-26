import React from 'react';
import { Play, Pause, HardDrive, Volume2 } from 'lucide-react';

interface VinylArtwork3DProps {
  coverUrl?: string;
  title: string;
  isPlaying?: boolean;
  isDriveBacked?: boolean;
  onPlayToggle?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export const VinylArtwork3D: React.FC<VinylArtwork3DProps> = ({
  coverUrl = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500',
  title,
  isPlaying = false,
  isDriveBacked = false,
  onPlayToggle,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-40 h-40 sm:w-48 sm:h-48',
    md: 'w-56 h-56 sm:w-64 sm:h-64',
    lg: 'w-64 h-64 sm:w-80 sm:h-80'
  };

  const discOffset = isPlaying ? 'translate-x-12 sm:translate-x-16' : 'group-hover:translate-x-8 sm:group-hover:translate-x-12';

  return (
    <div className={`relative group select-none perspective-1000 ${sizeClasses[size]}`}>
      {/* 3D Ambient Floor Shadow */}
      <div 
        className={`absolute -bottom-6 left-1/2 -translate-x-1/2 w-4/5 h-6 rounded-full blur-xl transition-all duration-500 pointer-events-none ${
          isPlaying ? 'bg-studio-accent/30 scale-110' : 'bg-black/80 group-hover:bg-studio-accent/20'
        }`}
      />

      {/* Main 3D Container with Depth */}
      <div className="relative w-full h-full preserve-3d transition-transform duration-500 ease-out group-hover:rotate-y-[-6deg] group-hover:rotate-x-[4deg]">
        
        {/* 1. Realistic Black Vinyl Disc (Slides out and spins) */}
        <div
          className={`absolute top-2 right-2 bottom-2 aspect-square rounded-full vinyl-disc transition-all duration-700 ease-out z-0 flex items-center justify-center ${discOffset} ${
            isPlaying ? 'animate-spin-slow shadow-2xl shadow-studio-accent/30' : 'shadow-xl'
          }`}
          style={{ transformOrigin: 'center center' }}
        >
          {/* Conic Light Sheen */}
          <div className="absolute inset-0 rounded-full vinyl-sheen pointer-events-none" />

          {/* Micro Grooves Overlay */}
          <div className="absolute inset-3 rounded-full border border-white/5 pointer-events-none" />
          <div className="absolute inset-6 rounded-full border border-white/5 pointer-events-none" />
          <div className="absolute inset-10 rounded-full border border-white/5 pointer-events-none" />
          <div className="absolute inset-14 rounded-full border border-white/5 pointer-events-none" />

          {/* Center Label */}
          <div className="w-1/3 h-1/3 rounded-full bg-studio-accent border-2 border-white/30 overflow-hidden relative shadow-inner flex items-center justify-center">
            <img
              src={coverUrl}
              alt={title}
              className="w-full h-full object-cover opacity-80"
            />
            {/* Center Spindle Hole */}
            <div className="w-3 h-3 rounded-full bg-[#070709] border border-white/20 absolute z-10" />
          </div>
        </div>

        {/* 2. Extruded 3D Album Jacket Sleeve */}
        <div className="relative w-full h-full rounded-2xl overflow-hidden bg-studio-card border border-studio-border/80 shadow-2xl z-10 preserve-3d group-hover:shadow-studio-accent/15 transition-shadow duration-500">
          
          {/* Cover Art with 3D Gloss Sheen */}
          <img
            src={coverUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />

          {/* Holographic Spine Effect */}
          <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-black/60 via-white/10 to-transparent pointer-events-none" />
          
          {/* Subtle Outer Edge Lighting */}
          <div className="absolute inset-0 rounded-2xl border border-white/10 pointer-events-none" />

          {/* Interactive Play/Pause Trigger Overlay */}
          {onPlayToggle && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPlayToggle();
                }}
                className="w-16 h-16 rounded-full bg-studio-accent text-white flex items-center justify-center shadow-2xl shadow-studio-accent/50 transform hover:scale-110 active:scale-95 transition-all depth-3"
                title={isPlaying ? "Pause Track" : "Play Track"}
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 fill-white" />
                ) : (
                  <Play className="w-7 h-7 fill-white ml-1" />
                )}
              </button>
            </div>
          )}

          {/* Floating Google Drive Cloud Badge */}
          {isDriveBacked && (
            <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md border border-emerald-500/40 text-emerald-400 p-2 rounded-xl shadow-lg flex items-center gap-1.5 depth-2">
              <HardDrive className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold tracking-wider uppercase hidden sm:inline">Drive HD</span>
            </div>
          )}

          {/* Now Playing Animated Indicator */}
          {isPlaying && (
            <div className="absolute bottom-3 left-3 bg-black/85 backdrop-blur-md border border-studio-accent/50 text-studio-accent px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 depth-2 shadow-lg">
              <Volume2 className="w-4 h-4 animate-pulse" />
              <span>3D Master Stream</span>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
