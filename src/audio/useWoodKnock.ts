import { useAudioPlayer } from 'expo-audio';
import { useCallback, useEffect } from 'react';
import { useAudio } from '../AudioContext';

const KNOCK_SOUNDS = [
  require('../../assets/audio/wood-knock-low.mp3'),
  require('../../assets/audio/wood-knock-medium.mp3'),
  require('../../assets/audio/wood-knock-high.mp3'),
];

export function useWoodKnock() {
  const { masterVol, masterMute, sfxVol, sfxMute } = useAudio();
  const low = useAudioPlayer(KNOCK_SOUNDS[0]);
  const medium = useAudioPlayer(KNOCK_SOUNDS[1]);
  const high = useAudioPlayer(KNOCK_SOUNDS[2]);
  const volume = masterMute || sfxMute ? 0 : (masterVol / 100) * (sfxVol / 100);

  useEffect(() => {
    low.volume = volume;
    medium.volume = volume;
    high.volume = volume;
  }, [volume, low, medium, high]);

  return useCallback(() => {
    const player = [low, medium, high][Math.floor(Math.random() * 3)];
    player.volume = volume;
    player.seekTo(0);
    player.play();
  }, [low, medium, high, volume]);
}
