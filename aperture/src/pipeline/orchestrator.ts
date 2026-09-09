import type { PipelineContext, RunRecord, StepLogEntry } from "../types.js";

export type PipelineStep = (ctx: PipelineContext) => Promise<PipelineContext>;

export interface NamedStep {
  name: string;
  run: PipelineStep;
  /** How many attempts (including the first) before the step is considered failed. */
  maxAttempts?: number;
}

export interface OrchestratorOptions {
  onEvent?: (event: RunEvent) => void;
}

export type RunEvent =
  | { type: "step:start"; step: string; attempt: number }
  | { type: "step:ok"; step: string; durationMs: number }
  | { type: "step:retry"; step: string; attempt: number; error: string }
  | { type: "step:failed"; step: string; error: string };

/**
 * Runs a fixed sequence of named steps against a shared context, with:
 *  - per-step timing
 *  - per-step retry (exponential backoff) for steps that opt in
 *  - a structured log suitable for the run history / observability layer
 *
 * This intentionally stays a small, hand-rolled orchestrator rather than
 * pulling in a heavier workflow framework -- the point of this project is
 * to demonstrate the mechanics, not to hide them behind a dependency.
 */
export class PipelineOrchestrator {
  constructor(
    private readonly steps: NamedStep[],
    private readonly options: OrchestratorOptions = {}
  ) {}

  async run(initialContext: PipelineContext): Promise<RunRecord> {
    const startedAt = new Date().toISOString();
    const log: StepLogEntry[] = [];
    let ctx = initialContext;

    for (const step of this.steps) {
      const maxAttempts = step.maxAttempts ?? 1;
      let attempt = 1;
      let lastError: unknown;

      while (attempt <= maxAttempts) {
        const stepStarted = Date.now();
        this.emit({ type: "step:start", step: step.name, attempt });

        try {
          ctx = await step.run(ctx);
          const durationMs = Date.now() - stepStarted;
          log.push({ step: step.name, status: "ok", durationMs, attempt });
          this.emit({ type: "step:ok", step: step.name, durationMs });
          lastError = undefined;
          break;
        } catch (err) {
          lastError = err;
          const message = err instanceof Error ? err.message : String(err);
          const durationMs = Date.now() - stepStarted;

          if (attempt < maxAttempts) {
            this.emit({ type: "step:retry", step: step.name, attempt, error: message });
            await sleep(backoffMs(attempt));
            attempt += 1;
            continue;
          }

          log.push({ step: step.name, status: "error", durationMs, attempt, error: message });
          this.emit({ type: "step:failed", step: step.name, error: message });
          break;
        }
      }

      if (lastError !== undefined) {
        return {
          runId: ctx.runId,
          topic: ctx.topic,
          startedAt,
          finishedAt: new Date().toISOString(),
          status: "failed",
          steps: log,
          context: ctx,
        };
      }
    }

    return {
      runId: ctx.runId,
      topic: ctx.topic,
      startedAt,
      finishedAt: new Date().toISOString(),
      status: "completed",
      steps: log,
      context: ctx,
    };
  }

  private emit(event: RunEvent): void {
    this.options.onEvent?.(event);
  }
}

function backoffMs(attempt: number): number {
  return Math.min(2000, 100 * 2 ** attempt);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
