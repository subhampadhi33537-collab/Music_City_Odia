import React, { useRef } from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { Play, Pause, Volume2, VolumeX, Square } from 'lucide-react';

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

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-studio-border px-4 py-3 sm:py-4 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 md:gap-6">
        
        {/* Left Side: Song info */}
        <div className="flex items-center space-x-3 w-full md:w-1/4 min-w-0">
          <img
            src={currentSong.cover_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100'}
            alt={currentSong.title}
            className="w-12 h-12 rounded object-cover border border-studio-border shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-white truncate">{currentSong.title}</h4>
            <p className="text-xs text-studio-muted truncate">{currentSong.artist}</p>
          </div>
          
          {/* Track Type Badge */}
          <div className="shrink-0 flex flex-col items-end space-y-1">
            {isPreview ? (
              <span className="text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/25 px-1.5 py-0.5 rounded">
                PREVIEW (30s)
              </span>
            ) : (
              <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/25 px-1.5 py-0.5 rounded">
                FULL TRACK
              </span>
            )}
            {loading && (
              <span className="text-[8px] text-studio-accent animate-pulse uppercase tracking-wider font-semibold">
                Buffering...
              </span>
            )}
          </div>
        </div>

        {/* Center: Controls and Seekbar */}
        <div className="flex flex-col items-center w-full md:w-2/4">
          {/* Controls */}
          <div className="flex items-center space-x-4 mb-1.5">
            <button
              onClick={togglePlay}
              disabled={loading}
              className="w-10 h-10 rounded-full bg-studio-accent text-white flex items-center justify-center hover:bg-studio-accent/90 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
            </button>
            <button
              onClick={pause}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-studio-border rounded-full transition-colors"
              title="Stop"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          </div>

          {/* Slider */}
          <div className="flex items-center space-x-3 w-full text-xs">
            <span className="text-studio-muted w-10 text-right">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeekChange}
              className="w-full h-1 bg-studio-border rounded-lg appearance-none cursor-pointer accent-studio-accent hover:h-1.5 transition-all"
            />
            <span className="text-studio-muted w-10">{formatTime(duration)}</span>
          </div>
          
          {error && (
            <p className="text-[10px] text-red-500 font-semibold mt-1 animate-pulse">
              {error}
            </p>
          )}
        </div>

        {/* Right Side: Volume & Visualizer */}
        <div className="flex items-center justify-end space-x-4 w-full md:w-1/4 shrink-0">
          
          {/* Visualizer bars */}
          <div className="hidden lg:flex items-end space-x-0.5 h-6 w-16 px-2 border border-studio-border/30 rounded-lg bg-black/20">
            <div className={`w-1 bg-studio-accent/70 rounded-t equalizer-bar h-1/6 ${isPlaying ? 'animate-equalizer-1' : ''}`}></div>
            <div className={`w-1 bg-studio-accent/70 rounded-t equalizer-bar h-2/6 ${isPlaying ? 'animate-equalizer-2' : ''}`}></div>
            <div className={`w-1 bg-studio-accent/70 rounded-t equalizer-bar h-3/6 ${isPlaying ? 'animate-equalizer-3' : ''}`}></div>
            <div className={`w-1 bg-studio-accent/70 rounded-t equalizer-bar h-4/6 ${isPlaying ? 'animate-equalizer-4' : ''}`}></div>
            <div className={`w-1 bg-studio-accent/70 rounded-t equalizer-bar h-2/6 ${isPlaying ? 'animate-equalizer-2' : ''}`}></div>
            <div className={`w-1 bg-studio-accent/70 rounded-t equalizer-bar h-1/6 ${isPlaying ? 'animate-equalizer-1' : ''}`}></div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleVolumeToggle}
              className="p-1.5 text-gray-400 hover:text-white rounded-full transition-colors"
            >
              {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-16 sm:w-20 h-1 bg-studio-border rounded-lg appearance-none cursor-pointer accent-studio-accent"
            />
          </div>
        </div>

      </div>
    </div>
  );
};
