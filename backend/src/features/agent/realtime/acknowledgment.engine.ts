import { getTTSProvider } from '../providers/tts';
import { logger } from '../../../config/logger';

export type ActionCategory = 'search' | 'vscode' | 'folder' | 'music' | 'github' | 'review';

export interface AcknowledgmentResult {
  phrase: string;
  audioBase64?: string;
  actionType: ActionCategory;
}

export class AcknowledgmentEngine {
  private static cachedAudio = new Map<string, string>();
  private static initialized = false;

  public static readonly PHRASES: Record<ActionCategory, string> = {
    search: "Looking into that for you now...",
    vscode: "On it, opening VS Code for you now...",
    folder: "Sure, setting that up for you right away...",
    music: "Got it, pulling up your music on YouTube...",
    github: "Opening GitHub for you in the browser...",
    review: "Let me take a quick look at your code...",
  };

  /**
   * Pre-synthesize the action verbal acknowledgments on startup
   * so they can be dispatched to the browser in 0ms!
   */
  static async warmCache(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const tts = getTTSProvider();
      for (const [key, phrase] of Object.entries(this.PHRASES)) {
        try {
          const res = await tts.synthesize(phrase);
          this.cachedAudio.set(key, res.audioBuffer.toString('base64'));
        } catch (err) {
          logger.warn({ error: (err as Error).message, phrase }, 'Pre-warming phrase failed');
        }
      }
      logger.info({ cachedCount: this.cachedAudio.size }, 'Acoustic acknowledgments pre-warmed for 0ms latency');
    } catch (err) {
      logger.warn({ error: (err as Error).message }, 'Failed to pre-warm acknowledgments');
    }
  }

  /**
   * Action intent detector (<2ms).
   * Returns null if the user is having a normal conversation, greeting,
   * asking questions, or chatting, so IRIS responds directly with the LLM.
   */
  static detectAction(prompt: string): AcknowledgmentResult | null {
    if (!prompt) return null;
    const p = prompt.toLowerCase().trim();

    // Pure conversational greetings or chit-chat must NEVER trigger canned acknowledgments
    if (/^(hi|hello|hey|good\s+(morning|afternoon|evening)|how are you|who are you|what'?s up|sup|yo)[.!?]?$/i.test(p)) {
      return null;
    }

    let actionType: ActionCategory | null = null;

    if (/\b(search (the )?(web|internet)|google (for )?|look up|find info(rmation)? on)\b/i.test(p)) {
      actionType = 'search';
    } else if (/\b(open (vs\s*code|visual studio code|code editor)|launch vs\s*code|start vs\s*code)\b/i.test(p)) {
      actionType = 'vscode';
    } else if (/\b(create (a )?folder|make (a )?directory|mkdir|create (a )?directory)\b/i.test(p)) {
      actionType = 'folder';
    } else if (/\b(play (some )?music|play (a )?song|play .+ on youtube|play spotify)\b/i.test(p)) {
      actionType = 'music';
    } else if (/\b(open github|launch github|check (the )?repo|browse github)\b/i.test(p)) {
      actionType = 'github';
    } else if (/\b(review (my|the) code|inspect (my|the) code|run code review|review git)\b/i.test(p)) {
      actionType = 'review';
    }

    if (!actionType) {
      return null;
    }

    const phrase = this.PHRASES[actionType];
    const audioBase64 = this.cachedAudio.get(actionType);

    return {
      actionType,
      phrase,
      audioBase64,
    };
  }

  /**
   * Resolves audio immediately (cached or on-demand)
   */
  static async resolveAudio(ack: AcknowledgmentResult): Promise<string | undefined> {
    if (ack.audioBase64) return ack.audioBase64;
    try {
      const tts = getTTSProvider();
      const res = await tts.synthesize(ack.phrase);
      const b64 = res.audioBuffer.toString('base64');
      this.cachedAudio.set(ack.actionType, b64);
      return b64;
    } catch {
      return undefined;
    }
  }
}
