import { useAudioPlayer } from 'expo-audio';
import React, { createContext, useContext, useEffect, useState } from 'react';

// Local asset path relative to src/AudioContext.tsx
const BACKGROUND_MUSIC = require('../assets/ost/Placeholder.mp3');

type AudioContextType = {
  startAudio: () => void;
  masterVol: number;
  setMasterVol: (val: number) => void;
  masterMute: boolean;
  setMasterMute: (val: boolean) => void;
  musicVol: number;
  setMusicVol: (val: number) => void;
  musicMute: boolean;
  setMusicMute: (val: boolean) => void;
  sfxVol: number;
  setSfxVol: (val: number) => void;
  sfxMute: boolean;
  setSfxMute: (val: boolean) => void;
};

const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [masterVol, setMasterVol] = useState(80);
  const [masterMute, setMasterMute] = useState(false);
  const [musicVol, setMusicVol] = useState(70);
  const [musicMute, setMusicMute] = useState(false);
  const [sfxVol, setSfxVol] = useState(90);
  const [sfxMute, setSfxMute] = useState(false);

  const player = useAudioPlayer(BACKGROUND_MUSIC);

  // Auto-play and loop background music
  useEffect(() => {
    if (player) {
      player.loop = true;
    }
  }, [player]);

  const startAudio = () => {
    try {
      if (player && !player.playing) {
        player.play();
      }
    } catch (error) {
      console.error('Error starting audio:', error);
    }
  };

  // Update volume  whenever any slider/mute state changes
  useEffect(() => {
    if (player) {
      const isMuted = masterMute || musicMute;
      // Convert 0-100 values to a normalized 0.0 - 1.0 volume scale
      const targetVolume = isMuted ? 0 : (masterVol / 100) * (musicVol / 100);
      
      player.volume = targetVolume;
    }
  }, [masterVol, masterMute, musicVol, musicMute, player]);

  return (
    <AudioContext.Provider
      value={{
        startAudio,
        masterVol, setMasterVol,
        masterMute, setMasterMute,
        musicVol, setMusicVol,
        musicMute, setMusicMute,
        sfxVol, setSfxVol,
        sfxMute, setSfxMute,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useAudio must be used within an AudioProvider');
  return context;
};