import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

export interface Song {
  id: string;
  title: string;
  artist: string;
  description?: string;
  cover_url?: string;
  preview_url: string;
  price: number;
}

interface AudioPlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  isPreview: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  loading: boolean;
  error: string | null;
  play: (song: Song, isPreview: boolean) => Promise<void>;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPreview, setIsPreview] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPreviewRef = useRef(true);

  useEffect(() => {
    // Instantiate HTML5 Audio
    const audio = new Audio();
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      // Enforce 30-second preview limit for non-purchased tracks
      if (isPreviewRef.current && audio.currentTime >= 30) {
        audio.pause();
        audio.currentTime = 0;
        setCurrentTime(0);
        setIsPlaying(false);
      }
    };
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onEnded = () => setIsPlaying(false);
    const onWaiting = () => setLoading(true);
    const onPlaying = () => {
      setLoading(false);
      setIsPlaying(true);
    };
    const onError = () => {
      setLoading(false);
      if (audio.src) {
        setError('Failed to load audio track.');
        setIsPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('error', onError);

    // Load volume from local storage
    const savedVol = localStorage.getItem('player_volume');
    if (savedVol !== null) {
      const vol = parseFloat(savedVol);
      audio.volume = vol;
      setVolumeState(vol);
    } else {
      audio.volume = 0.8;
    }

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('error', onError);
      audioRef.current = null;
    };
  }, []);

  const play = async (song: Song, preview: boolean) => {
    if (!audioRef.current) return;
    
    setError(null);
    setLoading(true);
    setCurrentSong(song);
    setIsPreview(preview);
    isPreviewRef.current = preview;
    
    let audioUrl = '';
    
    if (preview) {
      audioUrl = song.preview_url;
    } else {
      try {
        // Query backend for full stream URL
        const streamData = await api.songs.getStreamUrl(song.id);
        audioUrl = streamData.stream_url;
      } catch (err: any) {
        setError(err.message || 'Access denied: You must buy this song first.');
        setLoading(false);
        setIsPlaying(false);
        return;
      }
    }

    try {
      audioRef.current.src = audioUrl;
      audioRef.current.load();
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (err) {
      console.error('Audio play error:', err);
      setError('Playback failed. Please try again.');
      setIsPlaying(false);
    } finally {
      setLoading(false);
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (!currentSong) return;
    
    if (isPlaying) {
      pause();
    } else {
      audioRef.current?.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error('Toggle play failed:', err);
      });
    }
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const setVolume = (vol: number) => {
    const safeVol = Math.max(0, Math.min(1, vol));
    setVolumeState(safeVol);
    localStorage.setItem('player_volume', safeVol.toString());
    if (audioRef.current) {
      audioRef.current.volume = safeVol;
    }
  };

  return (
    <AudioPlayerContext.Provider value={{
      currentSong,
      isPlaying,
      isPreview,
      currentTime,
      duration,
      volume,
      loading,
      error,
      play,
      pause,
      togglePlay,
      seek,
      setVolume
    }}>
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};
