export class AudioQueuePlayer {
  private audio: HTMLAudioElement | null = null;
  private queue: string[] = [];
  private isBusy = false;
  private onQueueFinishedCallback: (() => void) | null = null;
  private onPlaybackStartedCallback: (() => void) | null = null;

  constructor(existingAudioElement?: HTMLAudioElement | null) {
    if (existingAudioElement) {
      this.audio = existingAudioElement;
    } else if (typeof window !== 'undefined') {
      this.audio = new Audio();
    }
  }

  setAudioElement(el: HTMLAudioElement | null) {
    if (el) {
      this.audio = el;
    }
  }

  onPlaybackStarted(cb: () => void) {
    this.onPlaybackStartedCallback = cb;
  }

  onQueueFinished(cb: () => void) {
    this.onQueueFinishedCallback = cb;
  }

  enqueue(base64Audio: string) {
    if (!base64Audio) return;
    this.queue.push(base64Audio);
    if (!this.isBusy) {
      this.playNext();
    }
  }

  private async playNext() {
    if (this.queue.length === 0) {
      this.isBusy = false;
      if (this.onQueueFinishedCallback) {
        this.onQueueFinishedCallback();
      }
      return;
    }

    const nextBase64 = this.queue.shift();
    if (!nextBase64 || !this.audio) return;

    this.isBusy = true;
    if (this.onPlaybackStartedCallback) {
      this.onPlaybackStartedCallback();
    }

    const src = nextBase64.startsWith('data:')
      ? nextBase64
      : `data:audio/wav;base64,${nextBase64}`;

    this.audio.src = src;

    this.audio.onended = () => {
      this.playNext();
    };

    this.audio.onerror = (err) => {
      console.warn('Audio queue play error, advancing:', err);
      this.playNext();
    };

    try {
      await this.audio.play();
    } catch (err) {
      console.warn('Audio queue play blocked or aborted:', err);
      this.playNext();
    }
  }

  stop() {
    this.queue = [];
    this.isBusy = false;
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio.onended = null;
      this.audio.onerror = null;
    }
  }

  isPlaying(): boolean {
    return this.isBusy;
  }
}

export const audioQueuePlayer = new AudioQueuePlayer();
