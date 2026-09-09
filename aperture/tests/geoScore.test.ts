import { describe, expect, it } from "vitest";
import { scoreGeo } from "../src/scoring/geoScore.js";
import type { ContentDraft, ResearchResult } from "../src/types.js";

function makeResearch(): ResearchResult {
  return {
    topic: "laminate flooring cost",
    longTailQuestions: [
      { question: "What is laminate flooring cost?", demandSignal: "high" },
      { question: "How much does laminate flooring cost?", demandSignal: "high" },
      { question: "Is laminate flooring cost worth it?", demandSignal: "medium" },
    ],
    competitorThemes: ["Pricing breakdowns"],
    suggestedSubtopics: ["Cost factors"],
  };
}

function makeGoodDraft(): ContentDraft {
  const markdown = [
    "# Laminate Flooring Cost: The Complete Guide",
    "",
    "Laminate flooring typically costs €15-€40 per square meter installed, depending on grade and subfloor prep.",
    "",
    "## What affects the price?",
    "- Material grade",
    "- Subfloor condition",
    "- Room shape",
    "",
    "## FAQ",
    "### What is laminate flooring cost?",
    "It's the total price per square meter including materials and installation.",
    "### How much does laminate flooring cost?",
    "Between €15 and €40 per square meter in most cases.",
    "### Is laminate flooring cost worth it?",
    "Yes, for most budgets it beats solid wood on value.",
  ].join("\n");

  return {
    title: "Laminate Flooring Cost: The Complete Guide",
    markdown,
    metaDescription: "A practical guide to laminate flooring cost.",
    wordCount: 80,
  };
}

describe("scoreGeo", () => {
  it("scores a direct-answer, FAQ-rich draft highly", () => {
    const result = scoreGeo(makeGoodDraft(), makeResearch());
    expect(result.total).toBeGreaterThanOrEqual(75);
  });

  it("penalizes a throat-clearing opening", () => {
    const markdown = [
      "# Laminate Flooring Cost",
      "",
      "In today's world, flooring decisions matter more than ever for homeowners everywhere.",
    ].join("\n");
    const draft: ContentDraft = { ...makeGoodDraft(), markdown };
    const result = scoreGeo(draft, makeResearch());
    expect(result.breakdown.directAnswerOpening).toBeLessThan(100);
    expect(
      result.issues.some((i) => i.message.toLowerCase().includes("filler"))
    ).toBe(true);
  });

  it("penalizes a missing FAQ section", () => {
    const markdown = "# Laminate Flooring Cost\n\nIt costs €15-€40 per square meter.";
    const draft: ContentDraft = { ...makeGoodDraft(), markdown };
    const result = scoreGeo(draft, makeResearch());
    expect(result.breakdown.faqCoverage).toBeLessThan(100);
  });

  it("flags high-demand long-tail questions that go unanswered", () => {
    const markdown = "# Something Else\n\nUnrelated content that does not mention the topic at all.";
    const draft: ContentDraft = { ...makeGoodDraft(), markdown };
    const result = scoreGeo(draft, makeResearch());
    const critical = result.issues.filter((i) => i.severity === "critical");
    expect(critical.length).toBeGreaterThan(0);
    expect(result.breakdown.longTailCoverage).toBeLessThan(50);
  });

  it("returns 100 long-tail coverage when there are no questions to cover", () => {
    const research: ResearchResult = { ...makeResearch(), longTailQuestions: [] };
    const result = scoreGeo(makeGoodDraft(), research);
    expect(result.breakdown.longTailCoverage).toBe(100);
  });
});
