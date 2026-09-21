export interface TTSOptions {
  voice?: string;
  language?: string;
  speed?: number;
}

export interface TTSResult {
  audioBuffer: Buffer;
  mimeType: string;
}

export interface TTSProvider {
  readonly name: string;
  synthesize(text: string, options?: TTSOptions): Promise<TTSResult>;
}
