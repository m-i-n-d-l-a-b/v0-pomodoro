import { useCallback, useEffect, useRef, useState } from 'react';
import { BinauralBeatEngine, TRACKS, BinauralTrack } from '../lib/audio-engine';

// State returned by the useBinauralBeats hook
export interface UseBinauralBeatsResult {
  currentTrack: string | null;
  isPlaying: boolean;
  play: (trackName: string) => Promise<void>;
  pause: () => void;
  toggle: (trackName: string) => Promise<void>;
}

// Helper to look up a track definition by name with runtime validation
function findTrack(name: string): BinauralTrack | null {
  return TRACKS.find((track: BinauralTrack) => track.name === name) ?? null;
}

export function useBinauralBeats(): UseBinauralBeatsResult {
  const engineRef = useRef<BinauralBeatEngine | null>(null);
  const pendingTrackRef = useRef<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Lazily create the engine only when needed and guard against SSR
  const ensureEngine = useCallback((): BinauralBeatEngine | null => {
    if (typeof window === 'undefined') {
      return null;
    }
    if (engineRef.current === null) {
      engineRef.current = new BinauralBeatEngine();
    }
    return engineRef.current;
  }, []);

  const play = useCallback(
    async (trackName: string): Promise<void> => {
      const track = findTrack(trackName);
      if (track === null) {
        console.error(`Track "${trackName}" does not exist`);
        return;
      }

      const engine = ensureEngine();
      if (engine === null) {
        console.error('BinauralBeatEngine is not available');
        pendingTrackRef.current = null;
        return;
      }

      pendingTrackRef.current = track.name;

      try {
        const started = await engine.start(track);
        if (!started) {
          if (pendingTrackRef.current === track.name) {
            pendingTrackRef.current = null;
          }
          return;
        }

        if (pendingTrackRef.current !== track.name) {
          if (pendingTrackRef.current === null) {
            engine.stop();
          }
          return;
        }

        pendingTrackRef.current = null;
        setCurrentTrack(track.name);
        setIsPlaying(true);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Unable to start binaural beats: ${message}`);
        setCurrentTrack(null);
        setIsPlaying(false);
        if (pendingTrackRef.current === track.name) {
          pendingTrackRef.current = null;
        }
      }
    },
    [ensureEngine]
  );

  const pause = useCallback((): void => {
    const engine = engineRef.current;
    if (engine?.isPlaying()) {
      engine.stop();
    }
    pendingTrackRef.current = null;
    setIsPlaying(false);
    setCurrentTrack(null);
  }, []);

  const toggle = useCallback(
    async (trackName: string): Promise<void> => {
      if (isPlaying && currentTrack === trackName) {
        pause();
        return;
      }
      await play(trackName);
    },
    [currentTrack, isPlaying, pause, play]
  );

  // Cleanup on unmount to release audio resources
  useEffect(() => {
    return (): void => {
      const engine = engineRef.current;
      if (engine !== null) {
        void engine.destroy();
      }
      pendingTrackRef.current = null;
      engineRef.current = null;
    };
  }, []);

  return { currentTrack, isPlaying, play, pause, toggle };
}

