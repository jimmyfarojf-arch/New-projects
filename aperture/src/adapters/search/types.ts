import type { ResearchResult } from "../../types.js";

/**
 * Abstraction over "something that can research a topic's search/answer
 * landscape": long-tail questions people ask, themes competitors cover,
 * and subtopics worth including.
 *
 * A real implementation could wrap a search API (e.g. Firecrawl, SerpAPI)
 * or an "ask the model" strategy. Aperture ships a mock implementation so
 * the pipeline is runnable and testable without external credentials.
 */
export interface SearchAdapter {
  research(topic: string): Promise<ResearchResult>;
}
