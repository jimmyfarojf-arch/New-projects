/**
 * Shared domain types for the Aperture content-visibility pipeline.
 *
 * The pipeline turns a single topic into a scored, publish-ready piece of
 * content by running it through a fixed sequence of steps. Every step reads
 * from and writes to a shared `PipelineContext`, so each step only needs to
 * know about the slice of the context it cares about.
 */

export interface ResearchQuestion {
  question: string;
  /** Rough estimate of how often this long-tail question shows up in search / AI chat logs. */
  demandSignal: "low" | "medium" | "high";
}

export interface ResearchResult {
  topic: string;
  longTailQuestions: ResearchQuestion[];
  competitorThemes: string[];
  /** Sub-topics worth covering so the piece reads as authoritative, not thin. */
  suggestedSubtopics: string[];
}

export interface ContentBrief {
  workingTitle: string;
  targetAudience: string;
  searchIntent: "informational" | "commercial" | "transactional" | "navigational";
  outline: string[];
  mustAnswerQuestions: string[];
  metaDescription: string;
}

export interface ContentDraft {
  title: string;
  markdown: string;
  metaDescription: string;
  wordCount: number;
}

export interface ScoreIssue {
  severity: "info" | "warning" | "critical";
  message: string;
}

export interface SeoScore {
  total: number; // 0-100
  issues: ScoreIssue[];
  breakdown: {
    headingStructure: number;
    metaDescription: number;
    keywordUsage: number;
    readability: number;
  };
}

export interface GeoScore {
  total: number; // 0-100
  issues: ScoreIssue[];
  breakdown: {
    directAnswerOpening: number;
    faqCoverage: number;
    longTailCoverage: number;
    structuredDataReadiness: number;
  };
}

export interface ScoreReport {
  seo: SeoScore;
  geo: GeoScore;
  combined: number; // 0-100, weighted average
}

export interface PublishResult {
  published: boolean;
  target: string;
  publishedAt?: string;
  reason?: string;
}

export interface PipelineContext {
  runId: string;
  topic: string;
  research?: ResearchResult;
  brief?: ContentBrief;
  draft?: ContentDraft;
  score?: ScoreReport;
  publish?: PublishResult;
}

export interface StepLogEntry {
  step: string;
  status: "ok" | "error";
  durationMs: number;
  attempt: number;
  error?: string;
}

export interface RunRecord {
  runId: string;
  topic: string;
  startedAt: string;
  finishedAt: string;
  status: "completed" | "failed";
  steps: StepLogEntry[];
  context: PipelineContext;
}
