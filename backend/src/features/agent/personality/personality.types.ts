export type PersonalityMode =
  | 'PROFESSIONAL'
  | 'FRIENDLY'
  | 'WARM'
  | 'PLAYFUL'
  | 'SWEET'
  | 'LIGHTLY_FLIRTY'
  | 'FOCUSED';

export interface PersonalityCooldownState {
  lastFlirtTimestamp: number;
  lastNicknameTimestamp: number;
  lastUsedNickname?: string;
  recentAcknowledgements: string[];
  recentFillers: string[];
  consecutivePersonalityCount: number;
}

export interface PersonalityEvaluationInput {
  userPrompt: string;
  activeTask?: string;
  isError?: boolean;
  isConfirmation?: boolean;
  isSensitive?: boolean;
  recentHistory?: Array<{ role: string; content: string }>;
}

export interface PersonalityEvaluationResult {
  mode: PersonalityMode;
  canFlirt: boolean;
  canUseNickname: boolean;
  allowedNicknames: string[];
  cooldownActive: boolean;
  toneGuidance: string;
}
