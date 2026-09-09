import type { ResearchResult } from "../../types.js";
import type { SearchAdapter } from "./types.js";

/**
 * Deterministic stand-in for a real search/SERP research call.
 *
 * Real research providers return noisy, rate-limited, sometimes-empty
 * results -- so the rest of the pipeline is written to tolerate a thin
 * ResearchResult (see `pipeline/steps/brief.ts`). This mock always returns
 * a reasonably rich result so the demo run looks representative.
 */
export class MockSearchAdapter implements SearchAdapter {
  async research(topic: string): Promise<ResearchResult> {
    return {
      topic,
      longTailQuestions: [
        { question: `What is ${topic}?`, demandSignal: "high" },
        { question: `How much does ${topic} cost?`, demandSignal: "high" },
        { question: `Is ${topic} worth it?`, demandSignal: "medium" },
        { question: `Best ${topic} for beginners`, demandSignal: "medium" },
        { question: `${topic} vs alternatives`, demandSignal: "low" },
      ],
      competitorThemes: [
        "Pricing and cost breakdowns",
        "Step-by-step how-to guides",
        "Comparison / vs. pages",
      ],
      suggestedSubtopics: [
        "Definition and context",
        "Cost factors",
        "Common mistakes",
        "Frequently asked questions",
      ],
    };
  }
}
