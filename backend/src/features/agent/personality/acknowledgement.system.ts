export class AcknowledgementSystem {
  private static readonly ACKNOWLEDGEMENTS = [
    "Got it.",
    "Yep.",
    "Alright.",
    "Okay.",
    "Mm-hmm.",
    "I got you.",
    "On it.",
    "Right.",
    "Yep, makes sense.",
    "Okay, I see what you mean.",
  ];

  private static readonly THINKING_PHRASES = [
    "Okay... let me check.",
    "Give me a second.",
    "Let me take a look.",
    "Hmm... let me see.",
    "Okay, I've got it.",
    "Let me check that for you.",
  ];

  private static readonly SWEET_GESTURES = [
    "Alright, I've got you.",
    "Easy. I'll take a look.",
    "You're good. I'm on it.",
    "Okay, we're getting somewhere.",
    "All done. What's next?",
    "Take a breather, boss. I've got this.",
  ];

  private static recentAcknowledgements: string[] = [];
  private static recentThinkingPhrases: string[] = [];
  private static lastSweetGestureTime = 0;
  private static readonly SWEET_GESTURE_COOLDOWN_MS = 60000; // 1 minute

  /**
   * Returns a contextual acknowledgement ensuring no consecutive duplicates.
   */
  static getAcknowledgement(context?: {
    isBossAllowed?: boolean;
    casual?: boolean;
  }): string {
    const candidates = [...this.ACKNOWLEDGEMENTS];
    if (context?.isBossAllowed) {
      candidates.push("Got you, boss.");
    }

    // Filter out the most recently used acknowledgement
    const lastUsed =
      this.recentAcknowledgements[this.recentAcknowledgements.length - 1];
    const available = candidates.filter((ack) => ack !== lastUsed);

    const chosen =
      available[Math.floor(Math.random() * available.length)] || "Got it.";
    this.recordAcknowledgement(chosen);
    return chosen;
  }

  /**
   * Returns a natural thinking phrase without revealing internal chain-of-thought.
   */
  static getThinkingPhrase(): string {
    const lastUsed =
      this.recentThinkingPhrases[this.recentThinkingPhrases.length - 1];
    const available = this.THINKING_PHRASES.filter(
      (phrase) => phrase !== lastUsed,
    );
    const chosen =
      available[Math.floor(Math.random() * available.length)] ||
      "Give me a second.";

    this.recentThinkingPhrases.push(chosen);
    if (this.recentThinkingPhrases.length > 5) {
      this.recentThinkingPhrases.shift();
    }
    return chosen;
  }

  /**
   * Returns a sweet gesture phrase if cooldown permits.
   */
  static getSweetGesture(): string | null {
    const now = Date.now();
    if (now - this.lastSweetGestureTime < this.SWEET_GESTURE_COOLDOWN_MS) {
      return null;
    }

    this.lastSweetGestureTime = now;
    const chosen =
      this.SWEET_GESTURES[
        Math.floor(Math.random() * this.SWEET_GESTURES.length)
      ];
    return chosen || null;
  }

  private static recordAcknowledgement(ack: string): void {
    this.recentAcknowledgements.push(ack);
    if (this.recentAcknowledgements.length > 5) {
      this.recentAcknowledgements.shift();
    }
  }

  static resetHistory(): void {
    this.recentAcknowledgements = [];
    this.recentThinkingPhrases = [];
    this.lastSweetGestureTime = 0;
  }
}
