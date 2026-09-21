export interface ProgressUpdate {
  speechText: string;
  uiDetail: string;
  stepIndex: number;
  totalSteps: number;
  percentage: number;
}

export class TaskProgressCommunicator {
  private static lastSpokenProgressTimestamp = 0;
  private static readonly MIN_PROGRESS_SPEECH_INTERVAL_MS = 3000; // Do not speak updates faster than 3s

  /**
   * Converts a tool action and execution context into a natural, spoken progress message
   * that avoids technical jargon (e.g. "Executing tool") while providing rich UI details.
   */
  static formatProgress(
    toolName: string,
    args: Record<string, unknown>,
    stepIndex: number,
    totalSteps: number,
  ): ProgressUpdate {
    const percentage = Math.round(
      ((stepIndex + 1) / Math.max(totalSteps, 1)) * 100,
    );
    const speech = this.getNaturalSpeechForTool(
      toolName,
      args,
      stepIndex,
      totalSteps,
    );
    const uiDetail = `Step ${stepIndex + 1}/${totalSteps}: ${toolName}(${Object.keys(args).join(", ")})`;

    return {
      speechText: speech,
      uiDetail,
      stepIndex,
      totalSteps,
      percentage,
    };
  }

  /**
   * Translates internal tool calls to warm, human descriptions for voice.
   */
  private static getNaturalSpeechForTool(
    toolName: string,
    args: Record<string, unknown>,
    stepIndex: number,
    totalSteps: number,
  ): string {
    switch (toolName) {
      case "createFolder":
        return `Setting up the folder ${args.path ? `'${args.path}'` : ""}.`;
      case "createFile":
      case "updateFile":
        return `Writing file updates.`;
      case "searchFiles":
      case "readFile":
        return `Checking the files now.`;
      case "npmInstall":
        return `Dependencies are installing now.`;
      case "npmScript":
        return `Running the ${args.script || "build"} checks.`;
      case "gitStatus":
      case "gitDiff":
        return `Checking workspace changes.`;
      case "searchWeb":
        return `Searching for the latest information.`;
      case "systemInfo":
        return `Checking system status.`;
      default:
        if (stepIndex === totalSteps - 1) {
          return "Almost there.";
        }
        return `Working on step ${stepIndex + 1}.`;
    }
  }

  /**
   * Determines if enough time has passed to speak a progress update.
   * For short tasks, silence is preferred.
   */
  static shouldSpeakProgress(isLongTask: boolean): boolean {
    if (!isLongTask) {
      return false;
    }
    const now = Date.now();
    if (
      now - this.lastSpokenProgressTimestamp >=
      this.MIN_PROGRESS_SPEECH_INTERVAL_MS
    ) {
      this.lastSpokenProgressTimestamp = now;
      return true;
    }
    return false;
  }

  static reset(): void {
    this.lastSpokenProgressTimestamp = 0;
  }
}
