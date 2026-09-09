import { describe, expect, it, vi } from "vitest";
import { PipelineOrchestrator, type NamedStep, type RunEvent } from "../src/pipeline/orchestrator.js";
import { buildPipeline } from "../src/pipeline/buildPipeline.js";
import { MockLlmAdapter } from "../src/adapters/llm/mock.js";
import { MockSearchAdapter } from "../src/adapters/search/mock.js";
import { MockPublisherAdapter } from "../src/adapters/publisher/mock.js";
import type { PipelineContext } from "../src/types.js";

function baseContext(): PipelineContext {
  return { runId: "test-run", topic: "laminate flooring cost" };
}

describe("PipelineOrchestrator", () => {
  it("runs steps in order and accumulates context", async () => {
    const steps: NamedStep[] = [
      { name: "a", run: async (ctx) => ({ ...ctx, research: undefined }) },
      { name: "b", run: async (ctx) => ctx },
    ];
    const orchestrator = new PipelineOrchestrator(steps);
    const record = await orchestrator.run(baseContext());

    expect(record.status).toBe("completed");
    expect(record.steps.map((s) => s.step)).toEqual(["a", "b"]);
    expect(record.steps.every((s) => s.status === "ok")).toBe(true);
  });

  it("retries a failing step up to maxAttempts before succeeding", async () => {
    let calls = 0;
    const steps: NamedStep[] = [
      {
        name: "flaky",
        maxAttempts: 3,
        run: async (ctx) => {
          calls += 1;
          if (calls < 3) throw new Error("transient failure");
          return ctx;
        },
      },
    ];

    const orchestrator = new PipelineOrchestrator(steps);
    const record = await orchestrator.run(baseContext());

    expect(calls).toBe(3);
    expect(record.status).toBe("completed");
    expect(record.steps[0]?.attempt).toBe(3);
  });

  it("marks the run as failed once maxAttempts is exhausted", async () => {
    const steps: NamedStep[] = [
      {
        name: "always-fails",
        maxAttempts: 2,
        run: async () => {
          throw new Error("permanent failure");
        },
      },
    ];

    const orchestrator = new PipelineOrchestrator(steps);
    const record = await orchestrator.run(baseContext());

    expect(record.status).toBe("failed");
    expect(record.steps[0]?.status).toBe("error");
    expect(record.steps[0]?.error).toBe("permanent failure");
  });

  it("does not run later steps after a step fails permanently", async () => {
    const laterStep = vi.fn(async (ctx: PipelineContext) => ctx);
    const steps: NamedStep[] = [
      {
        name: "fails",
        run: async () => {
          throw new Error("boom");
        },
      },
      { name: "later", run: laterStep },
    ];

    const orchestrator = new PipelineOrchestrator(steps);
    await orchestrator.run(baseContext());

    expect(laterStep).not.toHaveBeenCalled();
  });

  it("emits step lifecycle events", async () => {
    const events: RunEvent[] = [];
    const steps: NamedStep[] = [{ name: "only", run: async (ctx) => ctx }];
    const orchestrator = new PipelineOrchestrator(steps, { onEvent: (e) => events.push(e) });

    await orchestrator.run(baseContext());

    expect(events).toEqual([
      { type: "step:start", step: "only", attempt: 1 },
      { type: "step:ok", step: "only", durationMs: expect.any(Number) },
    ]);
  });
});

describe("buildPipeline (end-to-end with mock adapters)", () => {
  it("runs the full research -> brief -> draft -> score -> publish sequence", async () => {
    const pipeline = buildPipeline({
      llm: new MockLlmAdapter(),
      search: new MockSearchAdapter(),
      publisher: new MockPublisherAdapter(),
    });

    const record = await pipeline.run({ runId: "e2e-run", topic: "laminate flooring cost" });

    expect(record.status).toBe("completed");
    expect(record.steps.map((s) => s.step)).toEqual([
      "research",
      "brief",
      "draft",
      "score",
      "publish",
    ]);

    expect(record.context.research).toBeDefined();
    expect(record.context.brief).toBeDefined();
    expect(record.context.draft?.markdown).toContain("laminate flooring cost");
    expect(record.context.score?.combined).toBeGreaterThan(0);
    expect(record.context.publish).toBeDefined();
  });

  it("holds a draft back from publishing when the score is below threshold", async () => {
    const pipeline = buildPipeline({
      llm: new MockLlmAdapter(),
      search: new MockSearchAdapter(),
      publisher: new MockPublisherAdapter(),
      minPublishScore: 101, // impossible to reach -- forces the "held for review" path
    });

    const record = await pipeline.run({ runId: "held-run", topic: "laminate flooring cost" });

    expect(record.context.publish?.published).toBe(false);
    expect(record.context.publish?.reason).toContain("below the 101 publish threshold");
  });
});
