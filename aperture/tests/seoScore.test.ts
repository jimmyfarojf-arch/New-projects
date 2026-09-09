import { describe, expect, it } from "vitest";
import { scoreSeo } from "../src/scoring/seoScore.js";
import type { ContentDraft } from "../src/types.js";

function makeDraft(overrides: Partial<ContentDraft> = {}): ContentDraft {
  const markdown = [
    "# Laminate Flooring Cost: The Complete Guide",
    "",
    "Laminate flooring typically costs between €15 and €40 per square meter installed.",
    "",
    "## What affects laminate flooring cost?",
    "Material grade, subfloor prep, and room shape all move the price.",
    "",
    "## Common mistakes",
    "Skipping underlayment is the most common budget mistake.",
    "",
    "### Is laminate flooring cost worth it?",
    "For most budgets, yes -- it is far cheaper than solid wood.",
  ].join("\n");

  return {
    title: "Laminate Flooring Cost: The Complete Guide",
    markdown,
    metaDescription:
      "Laminate flooring cost explained: typical price per square meter, what drives it up, and how to budget your installation with confidence.",
    wordCount: 60,
    ...overrides,
  };
}

describe("scoreSeo", () => {
  it("scores a well-structured draft highly", () => {
    const result = scoreSeo(makeDraft(), "laminate flooring cost");
    expect(result.total).toBeGreaterThanOrEqual(70);
    expect(result.breakdown.headingStructure).toBeGreaterThan(0);
  });

  it("penalizes a missing H1", () => {
    const draft = makeDraft({ markdown: "## No H1 here\n\nSome content." });
    const result = scoreSeo(draft, "laminate flooring cost");
    expect(result.issues.some((i) => i.severity === "critical")).toBe(true);
    expect(result.breakdown.headingStructure).toBeLessThan(60);
  });

  it("penalizes a missing meta description", () => {
    const draft = makeDraft({ metaDescription: "" });
    const result = scoreSeo(draft, "laminate flooring cost");
    expect(result.breakdown.metaDescription).toBe(0);
    expect(result.issues.some((i) => i.message.includes("Meta description is missing"))).toBe(true);
  });

  it("flags a topic that never appears in the body", () => {
    const draft = makeDraft();
    const result = scoreSeo(draft, "underwater basket weaving");
    expect(result.breakdown.keywordUsage).toBe(0);
  });

  it("flags an overly long meta description", () => {
    const draft = makeDraft({ metaDescription: "x".repeat(200) });
    const result = scoreSeo(draft, "laminate flooring cost");
    expect(result.breakdown.metaDescription).toBeLessThan(100);
  });
});
