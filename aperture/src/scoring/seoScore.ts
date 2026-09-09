import type { ContentDraft, ScoreIssue, SeoScore } from "../types.js";
import { countWords, fleschReadingEase } from "./readability.js";

const IDEAL_META_MIN = 120;
const IDEAL_META_MAX = 158;

/**
 * Scores a draft against classic, well-established on-page SEO signals.
 * Every rule here is intentionally simple and explainable -- the goal is a
 * transparent checklist, not a black-box "SEO score".
 */
export function scoreSeo(draft: ContentDraft, topic: string): SeoScore {
  const issues: ScoreIssue[] = [];

  const headingStructure = scoreHeadingStructure(draft.markdown, issues);
  const metaDescription = scoreMetaDescription(draft.metaDescription, issues);
  const keywordUsage = scoreKeywordUsage(draft.markdown, topic, issues);
  const readability = scoreReadability(draft.markdown, issues);

  const total = Math.round(
    headingStructure * 0.3 +
      metaDescription * 0.2 +
      keywordUsage * 0.25 +
      readability * 0.25
  );

  return {
    total,
    issues,
    breakdown: { headingStructure, metaDescription, keywordUsage, readability },
  };
}

function scoreHeadingStructure(markdown: string, issues: ScoreIssue[]): number {
  const h1s = markdown.match(/^# .+/gm) ?? [];
  const h2s = markdown.match(/^## .+/gm) ?? [];
  const h3s = markdown.match(/^### .+/gm) ?? [];

  let score = 100;

  if (h1s.length === 0) {
    issues.push({ severity: "critical", message: "No H1 heading found." });
    score -= 50;
  } else if (h1s.length > 1) {
    issues.push({
      severity: "warning",
      message: `${h1s.length} H1 headings found; a page should have exactly one.`,
    });
    score -= 15;
  }

  if (h2s.length < 2) {
    issues.push({
      severity: "warning",
      message: "Fewer than 2 H2 sections -- content may read as thin.",
    });
    score -= 20;
  }

  if (h3s.length === 0 && h2s.length > 0) {
    issues.push({
      severity: "info",
      message: "No H3 subsections -- fine for short pieces, worth adding for longer ones.",
    });
    score -= 5;
  }

  return Math.max(0, score);
}

function scoreMetaDescription(metaDescription: string, issues: ScoreIssue[]): number {
  const length = metaDescription.trim().length;

  if (length === 0) {
    issues.push({ severity: "critical", message: "Meta description is missing." });
    return 0;
  }

  if (length < IDEAL_META_MIN) {
    issues.push({
      severity: "warning",
      message: `Meta description is ${length} chars -- under the ${IDEAL_META_MIN}-${IDEAL_META_MAX} sweet spot.`,
    });
    return 60;
  }

  if (length > IDEAL_META_MAX) {
    issues.push({
      severity: "warning",
      message: `Meta description is ${length} chars -- likely to be truncated in search results.`,
    });
    return 70;
  }

  return 100;
}

function scoreKeywordUsage(markdown: string, topic: string, issues: ScoreIssue[]): number {
  const words = countWords(markdown);
  if (words === 0) {
    issues.push({ severity: "critical", message: "Draft has no content to score." });
    return 0;
  }

  const topicTerms = topic.toLowerCase().split(/\s+/).filter(Boolean);
  const bodyLower = markdown.toLowerCase();
  const occurrences = topicTerms.length === 0
    ? 0
    : countOccurrences(bodyLower, topicTerms.join(" "));

  const density = (occurrences / words) * 100;

  if (occurrences === 0) {
    issues.push({
      severity: "critical",
      message: `Target topic "${topic}" does not appear in the body at all.`,
    });
    return 0;
  }

  if (density > 3) {
    issues.push({
      severity: "warning",
      message: `Keyword density is ${density.toFixed(1)}% -- likely reads as keyword-stuffed.`,
    });
    return 50;
  }

  if (density < 0.4) {
    issues.push({
      severity: "info",
      message: `Keyword density is ${density.toFixed(1)}% -- consider reinforcing the target topic a little more.`,
    });
    return 70;
  }

  return 100;
}

function scoreReadability(markdown: string, issues: ScoreIssue[]): number {
  const ease = fleschReadingEase(markdown);

  if (ease < 30) {
    issues.push({
      severity: "warning",
      message: `Flesch Reading Ease is ${ease} -- very difficult; consider shorter sentences.`,
    });
    return 40;
  }

  if (ease < 50) {
    issues.push({
      severity: "info",
      message: `Flesch Reading Ease is ${ease} -- fairly difficult for a general audience.`,
    });
    return 70;
  }

  return 100;
}

function countOccurrences(haystack: string, needle: string): number {
  if (needle.length === 0) return 0;
  let count = 0;
  let index = haystack.indexOf(needle);
  while (index !== -1) {
    count += 1;
    index = haystack.indexOf(needle, index + needle.length);
  }
  return count;
}
