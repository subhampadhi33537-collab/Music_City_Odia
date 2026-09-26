import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { Play, Pause, Volume2, VolumeX, Square, Disc3, Sparkles } from 'lucide-react';

export const AudioPlayer: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    isPreview,
    currentTime,
    duration,
    volume,
    loading,
    error,
    togglePlay,
    seek,
    setVolume,
    pause
  } = useAudioPlayer();

  const prevVolume = useRef(0.8);

  if (!currentSong) return null;

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(parseFloat(e.target.value));
  };

  const handleVolumeToggle = () => {
    if (volume > 0) {
      prevVolume.current = volume;
      setVolume(0);
    } else {
      setVolume(prevVolume.current);
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-3 sm:bottom-5 left-3 right-3 sm:left-6 sm:right-6 max-w-6xl mx-auto z-50 perspective-1000">
      <div className="floating-dock-3d rounded-2xl px-4 py-3 sm:py-3.5 border border-white/10 glow-border-accent shadow-2xl transition-all duration-300">
        
        {/* Subtle glowing audio progress track across the top edge */}
        <div className="absolute top-0 left-4 right-4 h-[2px] bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-studio-accent via-studio-gold to-emerald-400 transition-all duration-150 shadow-[0_0_10px_#F97316]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-6">
          
          {/* Left Side: 3D Mini Vinyl & Song Info */}
          <div className="flex items-center space-x-3.5 w-full md:w-1/3 min-w-0">
            
            {/* 3D Floating Mini Vinyl Stage */}
            <div className="relative w-13 h-13 shrink-0 perspective-1000 group">
              {/* Spinning Vinyl Disc behind jacket */}
              <div
                className={`absolute inset-0 w-13 h-13 rounded-full vinyl-disc flex items-center justify-center transition-transform duration-500 shadow-xl ${
                  isPlaying ? 'translate-x-3.5 rotate-180 animate-spin-slow' : 'translate-x-1'
                }`}
                style={{ animationDuration: '4s' }}
              >
                <div className="w-4 h-4 rounded-full bg-studio-accent/90 border border-white/20 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
                </div>
              </div>

              {/* Album Jacket Front with 3D Bevel */}
              <div className="relative w-13 h-13 rounded-lg overflow-hidden border border-white/15 shadow-lg bg-studio-card z-10">
                <img
                  src={currentSong.cover_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=120'}
                  alt={currentSong.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10 pointer-events-none" />
              </div>
            </div>

            {/* Song Meta with Link */}
            <div className="min-w-0 flex-1 pl-2">
              <Link
                to={`/songs/${currentSong.id}`}
                className="text-sm font-bold text-white hover:text-studio-accent truncate block transition-colors"
                title={currentSong.title}
              >
                {currentSong.title}
              </Link>
              <p className="text-xs text-studio-muted truncate">{currentSong.artist}</p>
            </div>
            
            {/* Track Type 3D Badge */}
            <div className="shrink-0 flex flex-col items-end space-y-1">
              {isPreview ? (
                <span className="badge-3d text-[9px] font-extrabold bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> 30s Clip
                </span>
              ) : (
                <span className="badge-3d text-[9px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Disc3 className="w-2.5 h-2.5" /> Master Track
                </span>
              )}
              {loading && (
                <span className="text-[9px] text-studio-accent animate-pulse uppercase tracking-wider font-semibold">
                  Buffering...
                </span>
              )}
            </div>
          </div>

          {/* Center: Controls & Dimensional Scrub Bar */}
          <div className="flex flex-col items-center w-full md:w-2/5">
            {/* Controls with 3D tactile buttons */}
            <div className="flex items-center space-x-4 mb-1">
              <button
                onClick={pause}
                className="btn-3d-secondary p-2 text-gray-400 hover:text-white rounded-full transition-colors"
                title="Stop playback"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>

              <button
                onClick={togglePlay}
                disabled={loading}
                className="btn-3d w-11 h-11 rounded-full bg-studio-accent text-white flex items-center justify-center transition-all disabled:opacity-50"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-white" />
                ) : (
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                )}
              </button>

              {/* 3D Equalizer Mini Bars */}
              <div className="flex items-end space-x-1 h-5 w-10 px-1 border border-white/10 rounded-md bg-black/40 shadow-inner">
                <div className={`w-1 bg-studio-accent rounded-t equalizer-bar h-2/6 ${isPlaying ? 'animate-equalizer-1' : 'h-1/6'}`}></div>
                <div className={`w-1 bg-studio-gold rounded-t equalizer-bar h-4/6 ${isPlaying ? 'animate-equalizer-2' : 'h-2/6'}`}></div>
                <div className={`w-1 bg-emerald-400 rounded-t equalizer-bar h-5/6 ${isPlaying ? 'animate-equalizer-3' : 'h-3/6'}`}></div>
                <div className={`w-1 bg-studio-accent rounded-t equalizer-bar h-3/6 ${isPlaying ? 'animate-equalizer-4' : 'h-1/6'}`}></div>
              </div>
            </div>

            {/* Slider with Timers */}
            <div className="flex items-center space-x-3 w-full text-xs font-mono">
              <span className="text-studio-muted w-10 text-right text-[11px]">{formatTime(currentTime)}</span>
              <div className="relative flex-1 flex items-center group">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeekChange}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-studio-accent hover:h-2 transition-all"
                />
              </div>
              <span className="text-studio-muted w-10 text-[11px]">{formatTime(duration)}</span>
            </div>
            
            {error && (
              <p className="text-[10px] text-red-400 font-semibold mt-0.5 animate-pulse">
                {error}
              </p>
            )}
          </div>

          {/* Right Side: Volume & Studio Sound Indicator */}
          <div className="flex items-center justify-end space-x-4 w-full md:w-1/4 shrink-0">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Super Bass Audio</span>
              <span className="text-[10px] text-studio-gold font-semibold">24-Bit / 48kHz</span>
            </div>

            <div className="flex items-center space-x-2 bg-black/30 border border-white/5 px-2.5 py-1.5 rounded-xl">
              <button
                onClick={handleVolumeToggle}
                className="text-gray-400 hover:text-white transition-colors"
                title={volume === 0 ? 'Unmute' : 'Mute'}
              >
                {volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-studio-accent" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-16 sm:w-20 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-studio-accent"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
