import type { ContentDraft, GeoScore, ResearchResult, ScoreIssue } from "../types.js";

/**
 * Scores a draft for "GEO" -- Generative Engine Optimization: how likely an
 * AI assistant (an LLM-backed search or chat answer) is to lift a direct,
 * accurate answer out of this page and cite it.
 *
 * This is deliberately a distinct scoring dimension from classic SEO
 * (see seoScore.ts). A page can rank well in traditional search while
 * still being hard for an LLM to extract a clean answer from, and vice
 * versa -- which is the whole premise behind products like InSpace's Nova.
 */
export function scoreGeo(draft: ContentDraft, research: ResearchResult): GeoScore {
  const issues: ScoreIssue[] = [];

  const directAnswerOpening = scoreDirectAnswerOpening(draft.markdown, issues);
  const faqCoverage = scoreFaqBlock(draft.markdown, issues);
  const longTailCoverage = scoreLongTailCoverage(draft.markdown, research, issues);
  const structuredDataReadiness = scoreStructuredDataReadiness(draft.markdown, issues);

  const total = Math.round(
    directAnswerOpening * 0.3 +
      faqCoverage * 0.3 +
      longTailCoverage * 0.25 +
      structuredDataReadiness * 0.15
  );

  return {
    total,
    issues,
    breakdown: { directAnswerOpening, faqCoverage, longTailCoverage, structuredDataReadiness },
  };
}

/**
 * LLM answer engines tend to quote from the first 1-2 sentences after the
 * H1. Content that opens with throat-clearing ("In today's world...")
 * before it gets to the point is much less likely to be extracted cleanly.
 */
function scoreDirectAnswerOpening(markdown: string, issues: ScoreIssue[]): number {
  const afterH1 = markdown.split(/^# .+$/m)[1] ?? markdown;
  const firstParagraph = afterH1.trim().split(/\n\s*\n/)[0] ?? "";

  if (firstParagraph.length === 0) {
    issues.push({
      severity: "critical",
      message: "No content immediately follows the H1 -- nothing for an AI answer to extract.",
    });
    return 0;
  }

  const wordCount = firstParagraph.split(/\s+/).length;
  const throatClearingPhrases = [
    "in today's world",
    "in this article",
    "in this guide",
    "let's dive in",
    "have you ever wondered",
  ];
  const hasThroatClearing = throatClearingPhrases.some((phrase) =>
    firstParagraph.toLowerCase().includes(phrase)
  );

  let score = 100;
  if (hasThroatClearing) {
    issues.push({
      severity: "warning",
      message: "Opening paragraph leads with filler instead of a direct answer.",
    });
    score -= 40;
  }
  if (wordCount > 60) {
    issues.push({
      severity: "info",
      message: "Opening paragraph is long -- a tighter 1-3 sentence answer extracts more cleanly.",
    });
    score -= 15;
  }

  return Math.max(0, score);
}

function scoreFaqBlock(markdown: string, issues: ScoreIssue[]): number {
  const hasFaqHeading = /^#{1,3}\s*(FAQ|Frequently Asked Questions)/im.test(markdown);
  const qaHeadings = markdown.match(/^###\s*.+\?/gm) ?? [];

  if (!hasFaqHeading) {
    issues.push({
      severity: "warning",
      message: "No FAQ section -- explicit Q&A blocks are among the most reliably-cited formats.",
    });
    return qaHeadings.length > 0 ? 40 : 0;
  }

  if (qaHeadings.length < 2) {
    issues.push({
      severity: "info",
      message: "FAQ section present but has fewer than 2 question-style subheadings.",
    });
    return 60;
  }

  return 100;
}

function scoreLongTailCoverage(
  markdown: string,
  research: ResearchResult,
  issues: ScoreIssue[]
): number {
  if (research.longTailQuestions.length === 0) return 100;

  const bodyLower = markdown.toLowerCase();
  const covered = research.longTailQuestions.filter((q) =>
    questionIsAddressed(bodyLower, q.question)
  );

  const coverageRatio = covered.length / research.longTailQuestions.length;
  const uncovered = research.longTailQuestions.filter((q) => !covered.includes(q));

  const highValueMissed = uncovered.filter((q) => q.demandSignal === "high");
  if (highValueMissed.length > 0) {
    issues.push({
      severity: "critical",
      message: `${highValueMissed.length} high-demand question(s) not addressed: ${highValueMissed
        .map((q) => `"${q.question}"`)
        .join(", ")}`,
    });
  } else if (uncovered.length > 0) {
    issues.push({
      severity: "info",
      message: `${uncovered.length} lower-priority question(s) not explicitly addressed.`,
    });
  }

  return Math.round(coverageRatio * 100);
}

function questionIsAddressed(bodyLower: string, question: string): boolean {
  const keywords = question
    .toLowerCase()
    .replace(/[?]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !["what", "does", "your", "with", "typically"].includes(w));

  if (keywords.length === 0) return bodyLower.includes(question.toLowerCase());

  const hits = keywords.filter((k) => bodyLower.includes(k));
  return hits.length / keywords.length >= 0.6;
}

function scoreStructuredDataReadiness(markdown: string, issues: ScoreIssue[]): number {
  const h2Count = (markdown.match(/^## .+/gm) ?? []).length;
  const hasList = /^[-*]\s+/m.test(markdown);

  let score = 0;
  if (h2Count >= 2) score += 60;
  else {
    issues.push({
      severity: "info",
      message: "Fewer than 2 H2 sections -- limited structure for schema/FAQ markup to hang off.",
    });
  }
  if (hasList) score += 40;
  else {
    issues.push({
      severity: "info",
      message: "No bullet or numbered lists -- lists are easy structured-data candidates.",
    });
  }

  return score;
}
