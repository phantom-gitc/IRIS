import { describe, it, expect, beforeEach } from 'vitest';
import { PersonalityPolicy } from '../../src/features/agent/personality/personality.policy';
import { AcknowledgementSystem } from '../../src/features/agent/personality/acknowledgement.system';
import { TaskProgressCommunicator } from '../../src/features/agent/personality/progress.communicator';
import { speechStateManager } from '../../src/features/agent/realtime/speech-state.manager';
import { TaskContextManager } from '../../src/features/agent/task-context.manager';

describe('IRIS Conversational Personality & Behavior Engine', () => {
  beforeEach(() => {
    PersonalityPolicy.resetCooldowns();
    AcknowledgementSystem.resetHistory();
    TaskProgressCommunicator.reset();
  });

  describe('1. Contextual Acknowledgements & Non-Repetition', () => {
    it('provides varied acknowledgements and does not repeat consecutively', () => {
      const ack1 = AcknowledgementSystem.getAcknowledgement();
      const ack2 = AcknowledgementSystem.getAcknowledgement();
      const ack3 = AcknowledgementSystem.getAcknowledgement();

      expect(typeof ack1).toBe('string');
      expect(ack1.length).toBeGreaterThan(0);
      expect(ack2).not.toBe(ack1);
      expect(ack3).not.toBe(ack2);
    });

    it('provides natural thinking phrases without exposing internal chain-of-thought', () => {
      const phrase = AcknowledgementSystem.getThinkingPhrase();
      expect(phrase).toMatch(/check|look|second|see|got it/i);
      expect(phrase).not.toMatch(/internal reasoning|chain of thought|hidden/i);
    });

    it('manages sweet gestures with cooldowns', () => {
      const gesture1 = AcknowledgementSystem.getSweetGesture();
      expect(gesture1).toBeDefined();

      // Immediate second attempt should return null due to cooldown
      const gesture2 = AcknowledgementSystem.getSweetGesture();
      expect(gesture2).toBeNull();
    });
  });

  describe('2. Personality Mode Switching', () => {
    it('evaluates to FOCUSED mode during serious technical work', () => {
      const evalResult = PersonalityPolicy.evaluate({
        userPrompt: 'Debug the authentication flow exception and check stack trace',
      });
      expect(evalResult.mode).toBe('FOCUSED');
    });

    it('evaluates to PLAYFUL mode during celebration or casual success', () => {
      const evalResult = PersonalityPolicy.evaluate({
        userPrompt: 'Finally! It works! We survived!',
      });
      expect(evalResult.mode).toBe('PLAYFUL');
    });

    it('evaluates to PROFESSIONAL mode when user explicitly requests it', () => {
      const evalResult = PersonalityPolicy.evaluate({
        userPrompt: 'Be professional and stick strictly to business.',
      });
      expect(evalResult.mode).toBe('PROFESSIONAL');
      expect(evalResult.canFlirt).toBe(false);
      expect(evalResult.canUseNickname).toBe(false);
    });

    it('evaluates to LIGHTLY_FLIRTY mode only when flirty cue is present and cooldown allows', () => {
      const evalResult = PersonalityPolicy.evaluate({
        userPrompt: 'You look cute today, Iris.',
      });
      expect(evalResult.mode).toBe('LIGHTLY_FLIRTY');
      expect(evalResult.canFlirt).toBe(true);
    });
  });

  describe('3. Personality Cooldowns & Boundaries', () => {
    it('strictly forbids flirtation during errors and confirmations', () => {
      const evalError = PersonalityPolicy.evaluate({
        userPrompt: 'You look cute today.',
        isError: true,
      });
      expect(evalError.canFlirt).toBe(false);
      expect(evalError.canUseNickname).toBe(false);

      const evalConfirm = PersonalityPolicy.evaluate({
        userPrompt: 'You look cute today.',
        isConfirmation: true,
      });
      expect(evalConfirm.mode).toBe('PROFESSIONAL');
      expect(evalConfirm.canFlirt).toBe(false);
    });

    it('enforces nickname cooldown and does not repeat the same nickname consecutively', () => {
      PersonalityPolicy.recordPersonalityUsage('boss');

      const evalAfterUsage = PersonalityPolicy.evaluate({
        userPrompt: 'What should we do next?',
      });
      expect(evalAfterUsage.canUseNickname).toBe(false);
    });

    it('limits consecutive personality expressions to prevent overdoing personality', () => {
      PersonalityPolicy.recordPersonalityUsage('boss', true);
      PersonalityPolicy.recordPersonalityUsage('dear', false);

      const evalOverused = PersonalityPolicy.evaluate({
        userPrompt: 'Check the status',
      });
      expect(evalOverused.cooldownActive).toBe(true);
      expect(evalOverused.canFlirt).toBe(false);
      expect(evalOverused.canUseNickname).toBe(false);
    });
  });

  describe('4. Human-Friendly Error Translation', () => {
    it('translates ENOENT to human explanation without exposing raw stack traces', () => {
      const translated = PersonalityPolicy.translateError('ENOENT: spawn code ENOENT');
      expect(translated).toBe("I couldn't open VS Code because I couldn't find the executable on your system.");
    });

    it('translates permission errors to respectful voice explanation', () => {
      const translated = PersonalityPolicy.translateError('EACCES: permission denied, write');
      expect(translated).toBe("I don't have permission to modify that file or execute that command.");
    });

    it('translates database connection errors gracefully', () => {
      const translated = PersonalityPolicy.translateError('MongoServerError: connection timed out');
      expect(translated).toBe("I couldn't complete that because the database connection had an issue.");
    });
  });

  describe('5. Strict No-Fake-Actions Enforcement', () => {
    it('replaces false claim of success with honest error explanation when tool fails', () => {
      const agentDraft = "Done! I've opened VS Code and the project is ready.";
      const toolOutcome = {
        success: false,
        toolName: 'openVSCode',
        error: 'ENOENT: spawn code ENOENT',
      };

      const verified = PersonalityPolicy.verifyNoFakeAction(agentDraft, toolOutcome);
      expect(verified).not.toContain("Done!");
      expect(verified).not.toContain("opened VS Code");
      expect(verified).toContain("couldn't open VS Code");
    });

    it('allows genuine success claim when tool actually succeeded', () => {
      const agentDraft = "Yep, VS Code is open.";
      const toolOutcome = {
        success: true,
        toolName: 'openVSCode',
        summary: 'VS Code launched successfully',
      };

      const verified = PersonalityPolicy.verifyNoFakeAction(agentDraft, toolOutcome);
      expect(verified).toBe("Yep, VS Code is open.");
    });
  });

  describe('6. Task Progress Communication', () => {
    it('formats progress updates in human speech without internal tool names', () => {
      const update = TaskProgressCommunicator.formatProgress('npmInstall', { packages: ['express'] }, 1, 3);
      expect(update.speechText).toBe('Dependencies are installing now.');
      expect(update.speechText).not.toContain('npmInstall');
      expect(update.percentage).toBe(67);
      expect(update.uiDetail).toContain('npmInstall');
    });

    it('enforces silence for short tasks', () => {
      const shouldSpeakShort = TaskProgressCommunicator.shouldSpeakProgress(false);
      expect(shouldSpeakShort).toBe(false);

      const shouldSpeakLong = TaskProgressCommunicator.shouldSpeakProgress(true);
      expect(shouldSpeakLong).toBe(true);
    });
  });

  describe('7. Speech State & Interruption Management', () => {
    it('manages speech lifecycle and handles barge-in interruption immediately', () => {
      const convId = 'conv_speech_test';
      const controller = speechStateManager.startSpeaking(convId, 'utt_1');

      expect(speechStateManager.isSpeaking(convId)).toBe(true);
      expect(controller.signal.aborted).toBe(false);

      // User interrupts
      const interrupted = speechStateManager.interrupt(convId, 'user_barge_in');
      expect(interrupted).toBe(true);
      expect(speechStateManager.isSpeaking(convId)).toBe(false);
      expect(controller.signal.aborted).toBe(true);
    });
  });

  describe('8. Context Awareness & Pronoun Resolution', () => {
    it('resolves pronouns and project references without forcing repetition', () => {
      const convId = 'conv_context_test';

      // User opens Avenya
      TaskContextManager.resolveContextReferences(convId, 'Open Avenya');
      const ctx = TaskContextManager.getContext(convId);
      expect(ctx.activeProject).toBe('Avenya');

      // Subsequent query referencing "the dashboard"
      const resolved = TaskContextManager.resolveContextReferences(convId, 'Now check the dashboard');
      expect(resolved).toBe("Now check Avenya's dashboard");

      // Subsequent query referencing "the frontend"
      const resolvedFrontend = TaskContextManager.resolveContextReferences(convId, 'Review the frontend');
      expect(resolvedFrontend).toBe("Review Avenya's frontend");
    });

    it('resolves active file references', () => {
      const convId = 'conv_file_test';
      TaskContextManager.resolveContextReferences(convId, 'Inspect App.tsx');

      const resolved = TaskContextManager.resolveContextReferences(convId, 'Make changes to that file');
      expect(resolved).toBe("Make changes to the file 'App.tsx'");
    });
  });
});
