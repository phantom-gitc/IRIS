export interface STTOptions {
  language?: string;
  prompt?: string;
  temperature?: number;
}

export interface STTResult {
  text: string;
  language?: string;
  duration?: number;
}

export interface STTProvider {
  readonly name: string;
  transcribe(audioBuffer: Buffer, filename?: string, options?: STTOptions): Promise<STTResult>;
}
