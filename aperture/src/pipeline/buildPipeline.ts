import type { LlmAdapter } from "../adapters/llm/types.js";
import type { SearchAdapter } from "../adapters/search/types.js";
import type { PublisherAdapter } from "../adapters/publisher/types.js";
import { PipelineOrchestrator, type NamedStep, type OrchestratorOptions } from "./orchestrator.js";
import { researchStep } from "./steps/research.js";
import { briefStep } from "./steps/brief.js";
import { draftStep } from "./steps/draft.js";
import { scoreStep } from "./steps/score.js";
import { publishStep } from "./steps/publish.js";

export interface PipelineDeps {
  llm: LlmAdapter;
  search: SearchAdapter;
  publisher: PublisherAdapter;
  /** Combined score (0-100) a draft must clear before auto-publishing. Defaults to 70. */
  minPublishScore?: number;
}

export function buildPipeline(deps: PipelineDeps, options?: OrchestratorOptions): PipelineOrchestrator {
  const steps: NamedStep[] = [
    { name: "research", run: researchStep(deps.search), maxAttempts: 2 },
    { name: "brief", run: briefStep(deps.llm), maxAttempts: 3 },
    { name: "draft", run: draftStep(deps.llm), maxAttempts: 3 },
    { name: "score", run: scoreStep, maxAttempts: 1 },
    { name: "publish", run: publishStep(deps.publisher, deps.minPublishScore), maxAttempts: 2 },
  ];

  return new PipelineOrchestrator(steps, options);
}
