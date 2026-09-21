import {
  PersonalityMode,
  PersonalityCooldownState,
  PersonalityEvaluationInput,
  PersonalityEvaluationResult,
} from "./personality.types";

export class PersonalityPolicy {
  private static cooldownState: PersonalityCooldownState = {
    lastFlirtTimestamp: 0,
    lastNicknameTimestamp: 0,
    lastUsedNickname: undefined,
    recentAcknowledgements: [],
    recentFillers: [],
    consecutivePersonalityCount: 0,
  };

  private static readonly FLIRT_COOLDOWN_MS = 180000; // 3 minutes
  private static readonly NICKNAME_COOLDOWN_MS = 45000; // 45 seconds
  private static readonly MAX_CONSECUTIVE_PERSONALITY_TURNS = 2;

  private static readonly NICKNAMES = ["boss", "buddy", "dear", "handsome"];

  /**
   * Evaluates the contextual personality mode and allowable behaviors.
   */
  static evaluate(
    input: PersonalityEvaluationInput,
  ): PersonalityEvaluationResult {
    const now = Date.now();
    const prompt = input.userPrompt.toLowerCase().trim();

    // 1. Strict Override: Security, Confirmation, Error, or Sensitive Context
    if (input.isError || input.isConfirmation || input.isSensitive) {
      this.cooldownState.consecutivePersonalityCount = 0;
      return {
        mode: input.isError ? "WARM" : "PROFESSIONAL",
        canFlirt: false,
        canUseNickname: false,
        allowedNicknames: [],
        cooldownActive: true,
        toneGuidance:
          "Remain calm, clear, precise, and helpful. Do not use flirtation, jokes, or nicknames.",
      };
    }

    // 2. Technical / Focused keywords
    const isTechnical =
      /\b(debug|exception|stack\s*trace|refactor|compile|build|security|auth|encryption|token|secret|database|migration|schema)\b/i.test(
        prompt,
      );

    // 3. Casual / Celebrating keywords
    const isCelebrating =
      /\b(awesome|nice|great\s*job|it\s*works|fixed|finally|survived|congrats|thank\s*you|thanks|love\s*you|cute)\b/i.test(
        prompt,
      );

    // 4. Playful / Flirtatious user cue
    const isFlirtyCue =
      /\b(cute|handsome|pretty|blush|date|girlfriend|distracted|flirt|marry)\b/i.test(
        prompt,
      );

    // 5. Explicit professional request
    const wantsProfessional =
      /\b(be\s+professional|stop\s+joking|serious|no\s+nicknames|strictly\s+business)\b/i.test(
        prompt,
      );

    if (wantsProfessional) {
      this.cooldownState.consecutivePersonalityCount = 0;
      return {
        mode: "PROFESSIONAL",
        canFlirt: false,
        canUseNickname: false,
        allowedNicknames: [],
        cooldownActive: true,
        toneGuidance:
          "Professional, direct, concise, and technical. Zero nicknames or playful remarks.",
      };
    }

    // Cooldown checks
    const flirtElapsed = now - this.cooldownState.lastFlirtTimestamp;
    const nicknameElapsed = now - this.cooldownState.lastNicknameTimestamp;
    const isOverused =
      this.cooldownState.consecutivePersonalityCount >=
      this.MAX_CONSECUTIVE_PERSONALITY_TURNS;

    const canFlirt =
      !isOverused &&
      flirtElapsed > this.FLIRT_COOLDOWN_MS &&
      (isFlirtyCue || (isCelebrating && Math.random() < 0.2));
    const canUseNickname =
      !isOverused && nicknameElapsed > this.NICKNAME_COOLDOWN_MS;

    // Filter available nicknames (don't repeat the last used nickname)
    const allowedNicknames = this.NICKNAMES.filter(
      (n) => n !== this.cooldownState.lastUsedNickname,
    );

    let mode: PersonalityMode = "WARM";

    if (canFlirt && isFlirtyCue) {
      mode = "LIGHTLY_FLIRTY";
    } else if (isCelebrating) {
      mode = "PLAYFUL";
    } else if (isTechnical) {
      mode = "FOCUSED";
    } else if (
      prompt.length < 25 &&
      /\b(hey|hi|hello|what's\s*up|how\s*are\s*you)\b/i.test(prompt)
    ) {
      mode = "FRIENDLY";
    }

    const toneGuidance = this.generateToneGuidance(
      mode,
      canFlirt,
      canUseNickname,
    );

    return {
      mode,
      canFlirt,
      canUseNickname,
      allowedNicknames,
      cooldownActive: isOverused,
      toneGuidance,
    };
  }

  /**
   * Records usage of personality elements to update cooldown timers.
   */
  static recordPersonalityUsage(
    usedNickname?: string,
    usedFlirt = false,
  ): void {
    const now = Date.now();
    let hasPersonality = false;

    if (usedNickname) {
      this.cooldownState.lastNicknameTimestamp = now;
      this.cooldownState.lastUsedNickname = usedNickname;
      hasPersonality = true;
    }

    if (usedFlirt) {
      this.cooldownState.lastFlirtTimestamp = now;
      hasPersonality = true;
    }

    if (hasPersonality) {
      this.cooldownState.consecutivePersonalityCount += 1;
    } else {
      this.cooldownState.consecutivePersonalityCount = 0;
    }
  }

  /**
   * Translates technical or system error messages into warm, understandable human speech.
   */
  static translateError(error: string | Error | unknown): string {
    const errString =
      error instanceof Error ? error.message : String(error || "");

    if (/ENOENT/i.test(errString) || /not\s*found/i.test(errString)) {
      if (/code/i.test(errString) || /vs\s*code/i.test(errString)) {
        return "I couldn't open VS Code because I couldn't find the executable on your system.";
      }
      return "I couldn't find the requested file or program on your system.";
    }

    if (/EACCES/i.test(errString) || /permission\s*denied/i.test(errString)) {
      return "I don't have permission to modify that file or execute that command.";
    }

    if (
      /Mongo/i.test(errString) ||
      /database/i.test(errString) ||
      /connection/i.test(errString)
    ) {
      return "I couldn't complete that because the database connection had an issue.";
    }

    if (
      /exit\s*code\s*1/i.test(errString) ||
      /build\s*failed/i.test(errString)
    ) {
      return "The command failed to build. I'm checking the error now.";
    }

    return "I ran into a problem completing that. Let me check what went wrong.";
  }

  /**
   * Enforces the No-Fake-Actions rule.
   * If a tool execution failed or was not run, verifies that the agent's spoken response
   * does not falsely claim completion.
   */
  static verifyNoFakeAction(
    response: string,
    toolExecuted?: {
      success: boolean;
      toolName: string;
      summary?: string;
      error?: string;
    },
  ): string {
    if (!toolExecuted) {
      return response;
    }

    // If tool execution failed, ensure no false claims of success
    if (!toolExecuted.success) {
      const falsePositivePatterns = [
        /\b(?:i(?:'ve| have)?\s+(?:opened|created|fixed|installed|searched|deleted|updated)\b)/i,
        /\b(?:done|all\s+set|successfully\s+completed|it's\s+open|is\s+open)\b/i,
      ];

      const claimsSuccess = falsePositivePatterns.some((p) => p.test(response));
      if (claimsSuccess) {
        // Replace with honest failure explanation
        const humanError = this.translateError(
          toolExecuted.error || "Execution failed",
        );
        return humanError;
      }
    }

    return response;
  }

  private static generateToneGuidance(
    mode: PersonalityMode,
    _canFlirt: boolean,
    canUseNickname: boolean,
  ): string {
    switch (mode) {
      case "LIGHTLY_FLIRTY":
        return "Warm, playful, and tasteful. A gentle teasing comment or nickname is permitted, but keep it mild, respectful, and brief.";
      case "PLAYFUL":
        return "Upbeat, friendly, and warm. Celebrate achievements with light conversational humor.";
      case "FOCUSED":
        return "Focused, calm, and concise. Technical clarity is priority. Minimize chatter.";
      case "PROFESSIONAL":
        return "Professional, courteous, and accurate. No nicknames or flirty remarks.";
      case "SWEET":
        return "Sweet, reassuring, and helpful. Use friendly supportive phrasing.";
      case "FRIENDLY":
      case "WARM":
      default:
        return `Warm, intelligent, and conversational. ${
          canUseNickname
            ? "Occasional nickname allowed if natural."
            : "Avoid nicknames this turn."
        } Speak concisely and naturally.`;
    }
  }

  static resetCooldowns(): void {
    this.cooldownState = {
      lastFlirtTimestamp: 0,
      lastNicknameTimestamp: 0,
      lastUsedNickname: undefined,
      recentAcknowledgements: [],
      recentFillers: [],
      consecutivePersonalityCount: 0,
    };
  }
}
