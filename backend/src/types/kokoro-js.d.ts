declare module 'kokoro-js' {
  export interface GenerateOptions {
    voice?: string;
    speed?: number;
  }

  export class KokoroTTS {
    static from_pretrained(
      modelId: string,
      options?: { dtype?: string; device?: any; progress_callback?: (progress: any) => void }
    ): Promise<KokoroTTS>;

    generate(
      text: string,
      options?: GenerateOptions
    ): Promise<{
      audio: Float32Array;
      sampling_rate: number;
      toWav(): ArrayBuffer;
      toBlob(): Blob;
      save(filename: string): Promise<void>;
    }>;

    list_voices(): Record<string, any>;
  }

  export const env: any;
}
