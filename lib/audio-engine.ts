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
  { name: 'Alpha Waves', leftHz: 210, rightHz: 220 },
  { name: 'Beta Waves', leftHz: 210, rightHz: 240 },
  { name: 'Gamma Waves', leftHz: 210, rightHz: 260 }
]);

interface OscillatorPair {
  left: OscillatorNode | null;
  right: OscillatorNode | null;
}

interface GainPair {
  left: GainNode | null;
  right: GainNode | null;
}

type AudioContextConstructor = typeof AudioContext;

declare global {
  interface Window {
    webkitAudioContext?: AudioContextConstructor;
  }
}

export class BinauralBeatEngine {
  private context: AudioContext | null = null;
  private oscillators: OscillatorPair = { left: null, right: null };
  private gains: GainPair = { left: null, right: null };
  private merger: ChannelMergerNode | null = null;
  private masterGain: GainNode | null = null;
  private startToken: symbol | null = null;
  private userGestureBound: boolean = false;
  private muted: boolean = false;
  private masterGainBase: number = 0.8;

  /**
   * Start playing the provided track.
   * Validates Web Audio support and track integrity.
   */
  public async start(track: BinauralTrack): Promise<boolean> {
    if (!BinauralBeatEngine.isValidTrack(track)) {
      throw new Error('Invalid track definition');
    }

    const AudioContextCtor = BinauralBeatEngine.resolveAudioContextConstructor();
    if (AudioContextCtor === null) {
      throw new Error('Web Audio API not supported in this browser');
    }

    let ctx = this.context;
    if (ctx === null) {
      try {
        ctx = new AudioContextCtor();
      } catch (error) {
        const message = error instanceof Error && error.message ? error.message : 'Unable to create audio context';
        throw new Error(`Unable to create audio context: ${message}`);
      }
      this.context = ctx;
    }

    if (ctx === null) {
      throw new Error('Unable to initialise audio context');
    }

    const token = Symbol('binaural-start');
    this.startToken = token;

    // Ensure the context will resume on the next user gesture if the browser blocks auto-play
    if (!this.userGestureBound && typeof window !== 'undefined') {
      const resumeOnGesture = async (): Promise<void> => {
        if (this.context && this.context.state === 'suspended') {
          try {
            await this.context.resume();
          } catch {
            // Swallow here; a subsequent explicit resume below will report errors
          }
        }
        if (this.context && this.context.state !== 'suspended') {
          window.removeEventListener('pointerdown', resumeOnGesture);
          window.removeEventListener('keydown', resumeOnGesture);
        }
      };
      window.addEventListener('pointerdown', resumeOnGesture, { once: true });
      window.addEventListener('keydown', resumeOnGesture, { once: true });
      this.userGestureBound = true;
    }

    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (error) {
        const message = error instanceof Error && error.message ? error.message : 'Unable to resume audio context';
        throw new Error(message);
      }
    }

    if (this.startToken !== token) {
      return false;
    }

    if (this.isPlaying()) {
      this.stopInternal(true);
    }

    if (this.startToken !== token) {
      return false;
    }

    const leftFrequency = track.leftHz;
    const rightFrequency = track.rightHz;

    if (!BinauralBeatEngine.isFrequency(leftFrequency) || !BinauralBeatEngine.isFrequency(rightFrequency)) {
      throw new Error('Track frequencies must be finite positive numbers');
    }

    let leftOscillator: OscillatorNode | null = null;
    let rightOscillator: OscillatorNode | null = null;
    let leftGain: GainNode | null = null;
    let rightGain: GainNode | null = null;
    let merger: ChannelMergerNode | null = null;
    let masterGain: GainNode | null = null;

    try {
      merger = ctx.createChannelMerger(2);
      merger.channelInterpretation = 'discrete';

      leftGain = ctx.createGain();
      rightGain = ctx.createGain();
      masterGain = ctx.createGain();

      leftGain.channelCount = 1;
      leftGain.channelCountMode = 'explicit';
      leftGain.channelInterpretation = 'discrete';

      rightGain.channelCount = 1;
      rightGain.channelCountMode = 'explicit';
      rightGain.channelInterpretation = 'discrete';

      // Slightly higher default to make audible, while staying safe
      const safeGainValue = 0.4;
      leftGain.gain.value = safeGainValue;
      rightGain.gain.value = safeGainValue;
      masterGain.gain.value = this.muted ? 0 : this.masterGainBase;
      masterGain.channelCountMode = 'explicit';
      masterGain.channelInterpretation = 'speakers';

      leftOscillator = ctx.createOscillator();
      rightOscillator = ctx.createOscillator();

      leftOscillator.type = 'sine';
      rightOscillator.type = 'sine';

      leftOscillator.frequency.value = leftFrequency;
      rightOscillator.frequency.value = rightFrequency;

      leftOscillator.connect(leftGain);
      rightOscillator.connect(rightGain);

      leftGain.connect(merger, 0, 0);
      rightGain.connect(merger, 0, 1);
      merger.connect(masterGain);
      masterGain.connect(ctx.destination);

      leftOscillator.start();
      rightOscillator.start();

      this.oscillators = { left: leftOscillator, right: rightOscillator };
      this.gains = { left: leftGain, right: rightGain };
      this.merger = merger;
      this.masterGain = masterGain;
      return true;
    } catch (error) {
      BinauralBeatEngine.safelyStopOscillator(leftOscillator);
      BinauralBeatEngine.safelyStopOscillator(rightOscillator);
      BinauralBeatEngine.disconnectAudioNode(leftGain);
      BinauralBeatEngine.disconnectAudioNode(rightGain);
      BinauralBeatEngine.disconnectAudioNode(merger);
      BinauralBeatEngine.disconnectAudioNode(masterGain);
      this.oscillators = { left: null, right: null };
      this.gains = { left: null, right: null };
      this.merger = null;
      this.masterGain = null;
      if (this.startToken === token) {
        this.startToken = null;
      }

      const message = error instanceof Error && error.message ? error.message : 'Unknown error';
      throw new Error(`Unable to start binaural beats: ${message}`);
    }
  }

  /** Stop playback and release oscillators. */
  public stop(): void {
    this.stopInternal(false);
  }

  /** Indicates whether the engine is currently playing a track. */
  public isPlaying(): boolean {
    return this.oscillators.left !== null && this.oscillators.right !== null;
  }

  /**
   * Stop playback and close the audio context.
   * Useful when unmounting components to release browser resources.
   */
  public async destroy(): Promise<void> {
    this.stopInternal(false);

    const ctx = this.context;
    if (ctx !== null) {
      try {
        await ctx.close();
      } catch (error) {
        const message = error instanceof Error && error.message ? error.message : 'Unknown error';
        console.error(`Failed to close audio context: ${message}`);
      } finally {
        this.context = null;
        this.startToken = null;
      }
    }
  }

  /** Mute or unmute output without stopping playback. */
  public setMuted(isMuted: boolean): void {
    this.muted = isMuted;
    const gain = this.masterGain;
    if (gain !== null) {
      try {
        gain.gain.value = this.muted ? 0 : this.masterGainBase;
      } catch {
        // ignore
      }
    }
  }

  /** Returns current mute state. */
  public isMuted(): boolean {
    return this.muted;
  }

  // Runtime validation to ensure the object conforms to BinauralTrack.
  private static isValidTrack(track: BinauralTrack | null | undefined): track is BinauralTrack {
    return (
      typeof track?.name === 'string' &&
      typeof track.leftHz === 'number' &&
      typeof track.rightHz === 'number'
    );
  }

  private static resolveAudioContextConstructor(): AudioContextConstructor | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const ctor = window.AudioContext ?? window.webkitAudioContext ?? null;
    return typeof ctor === 'function' ? ctor : null;
  }

  private static isFrequency(value: number): boolean {
    return Number.isFinite(value) && value > 0;
  }

  private static safelyStopOscillator(oscillator: OscillatorNode | null): void {
    if (oscillator === null) {
      return;
    }

    try {
      oscillator.stop();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'InvalidStateError') {
        return;
      }
      throw error;
    }
  }

  private static disconnectAudioNode(node: AudioNode | null): void {
    if (node === null) {
      return;
    }

    try {
      node.disconnect();
    } catch (error) {
      const shouldIgnore = error instanceof DOMException && error.name === 'InvalidAccessError';
      if (!shouldIgnore) {
        throw error;
      }
    }
  }

  private stopInternal(preserveToken: boolean): void {
    BinauralBeatEngine.safelyStopOscillator(this.oscillators.left);
    BinauralBeatEngine.safelyStopOscillator(this.oscillators.right);

    BinauralBeatEngine.disconnectAudioNode(this.oscillators.left);
    BinauralBeatEngine.disconnectAudioNode(this.oscillators.right);
    BinauralBeatEngine.disconnectAudioNode(this.gains.left);
    BinauralBeatEngine.disconnectAudioNode(this.gains.right);
    BinauralBeatEngine.disconnectAudioNode(this.merger);
    BinauralBeatEngine.disconnectAudioNode(this.masterGain);

    this.oscillators = { left: null, right: null };
    this.gains = { left: null, right: null };
    this.merger = null;
    this.masterGain = null;

    if (!preserveToken) {
      this.startToken = null;
    }
  }
}

