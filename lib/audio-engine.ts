/**
 * Binaural beat audio engine using the Web Audio API.
 * Creates two oscillators (left/right) to generate a beat.
 */

export interface BinauralTrack {
  name: string;
  leftHz: number;
  rightHz: number;
}

export const TRACKS: ReadonlyArray<BinauralTrack> = Object.freeze([
  { name: 'Alpha', leftHz: 210, rightHz: 220 },
  { name: 'Beta', leftHz: 210, rightHz: 240 },
  { name: 'Gamma', leftHz: 210, rightHz: 260 }
]);

interface OscillatorPair {
  left: OscillatorNode | null;
  right: OscillatorNode | null;
}

export class BinauralBeatEngine {
  private context: AudioContext | null = null;
  private oscillators: OscillatorPair = { left: null, right: null };

  /**
   * Start playing the provided track.
   * Validates Web Audio support and track integrity.
   */
  public start(track: BinauralTrack): void {
    if (!BinauralBeatEngine.isValidTrack(track)) {
      throw new Error('Invalid track definition');
    }

    if (typeof window === 'undefined') {
      throw new Error('Web Audio API not supported in this environment');
    }

    const AudioContextCtor = window.AudioContext;
    if (typeof AudioContextCtor !== 'function') {
      throw new Error('Web Audio API not supported in this browser');
    }

    this.context = this.context ?? new AudioContextCtor();
    const ctx = this.context;
    if (ctx == null) {
      throw new Error('Unable to create audio context');
    }

    // Resume context if it was previously suspended
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    if (this.isPlaying()) {
      this.stop();
    }

    const leftFrequency = track.leftHz ?? null;
    const rightFrequency = track.rightHz ?? null;
    if (leftFrequency === null || rightFrequency === null) {
      throw new Error('Track frequencies are missing');
    }

    try {
      const leftOsc = ctx.createOscillator();
      const rightOsc = ctx.createOscillator();

      leftOsc.type = 'sine';
      rightOsc.type = 'sine';

      leftOsc.frequency.value = leftFrequency;
      rightOsc.frequency.value = rightFrequency;

      leftOsc.connect(ctx.destination);
      rightOsc.connect(ctx.destination);

      leftOsc.start();
      rightOsc.start();

      this.oscillators = { left: leftOsc, right: rightOsc };
    } catch (error) {
      this.oscillators = { left: null, right: null };
      const message = (error instanceof Error && error.message) ? error.message : 'Unknown error';
      throw new Error(`Unable to start binaural beats: ${message}`);
    }
  }

  /** Stop playback and release oscillators. */
  public stop(): void {
    const leftOsc = this.oscillators.left;
    const rightOsc = this.oscillators.right;

    if (leftOsc) {
      leftOsc.stop();
      leftOsc.disconnect();
    }

    if (rightOsc) {
      rightOsc.stop();
      rightOsc.disconnect();
    }

    this.oscillators = { left: null, right: null };
  }

  /** Indicates whether the engine is currently playing a track. */
  public isPlaying(): boolean {
    return this.oscillators.left !== null && this.oscillators.right !== null;
  }

  // Runtime validation to ensure the object conforms to BinauralTrack.
  private static isValidTrack(track: BinauralTrack | null | undefined): track is BinauralTrack {
    return (
      typeof track?.name === 'string' &&
      typeof track.leftHz === 'number' &&
      typeof track.rightHz === 'number'
    );
  }
}

