import { useAudioPlayer } from 'expo-audio';
import { usePathname } from 'expo-router';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import placeholder2Volume from './audio/Placeholder2Volume';

// Local asset path relative to src/AudioContext.tsx
const BACKGROUND_MUSIC = require('../assets/ost/Placeholder.mp3');
const GAME_BACKGROUND_MUSIC = require('../assets/ost/Placeholder2.mp3');
const GAME_MUSIC_ROUTES = ['/level-select', '/playerselection', '/customize', '/game'];

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
  backgroundSpeed: number;
  setBackgroundSpeed: (val: number) => void;
};

const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [masterVol, setMasterVol] = useState(80);
  const [masterMute, setMasterMute] = useState(false);
  const [musicVol, setMusicVol] = useState(70);
  const [musicMute, setMusicMute] = useState(false);
  const [sfxVol, setSfxVol] = useState(90);
  const [sfxMute, setSfxMute] = useState(false);
  const [backgroundSpeed, setBackgroundSpeed] = useState(45);

  const menuPlayer = useAudioPlayer(BACKGROUND_MUSIC);
  const gamePlayer = useAudioPlayer(GAME_BACKGROUND_MUSIC);
  const activeTrack = GAME_MUSIC_ROUTES.includes(pathname.replace(/\/$/, '')) ? 'game' : 'menu';
  const activeTrackRef = useRef(activeTrack);
  const audioStartedRef = useRef(false);

  // Keep both tracks looped; only the route's selected track plays.
  useEffect(() => {
    menuPlayer.loop = true;
    gamePlayer.loop = true;
  }, [menuPlayer, gamePlayer]);

  useEffect(() => {
    if (activeTrackRef.current === activeTrack) return;

    const previousPlayer = activeTrackRef.current === 'game' ? gamePlayer : menuPlayer;
    const nextPlayer = activeTrack === 'game' ? gamePlayer : menuPlayer;
    activeTrackRef.current = activeTrack;
    previousPlayer.pause();

    if (audioStartedRef.current) {
      const targetVolume = masterMute || musicMute ? 0 : (masterVol / 100) * (musicVol / 100);
      nextPlayer.volume = targetVolume * (activeTrack === 'game' ? placeholder2Volume : 1);
      void nextPlayer.seekTo(0).then(() => nextPlayer.play()).catch((error: unknown) => {
        console.error('Error switching background audio:', error);
      });
    }
  }, [activeTrack, gamePlayer, masterMute, masterVol, menuPlayer, musicMute, musicVol]);

  const startAudio = () => {
    try {
      audioStartedRef.current = true;
      const player = activeTrackRef.current === 'game' ? gamePlayer : menuPlayer;
      if (!player.playing) player.play();
    } catch (error) {
      console.error('Error starting audio:', error);
    }
  };

  // Update volume  whenever any slider/mute state changes
  useEffect(() => {
    const isMuted = masterMute || musicMute;
    // Convert 0-100 values to a normalized 0.0 - 1.0 volume scale.
    const targetVolume = isMuted ? 0 : (masterVol / 100) * (musicVol / 100);
    menuPlayer.volume = targetVolume;
    gamePlayer.volume = targetVolume * placeholder2Volume;
  }, [masterVol, masterMute, musicVol, musicMute, menuPlayer, gamePlayer]);

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
        backgroundSpeed, setBackgroundSpeed,
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
