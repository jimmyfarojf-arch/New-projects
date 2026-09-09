import { describe, expect, it } from "vitest";
import { countSentences, countSyllables, countWords, fleschReadingEase } from "../src/scoring/readability.js";

describe("countWords", () => {
  it("counts words and ignores markdown noise", () => {
    expect(countWords("# Title\n\nThis is **bold** text.")).toBe(5);
  });

  it("returns 0 for empty input", () => {
    expect(countWords("")).toBe(0);
  });
});

describe("countSentences", () => {
  it("counts sentence-terminating punctuation", () => {
    expect(countSentences("One. Two! Three?")).toBe(3);
  });

  it("treats non-empty text with no punctuation as one sentence", () => {
    expect(countSentences("no punctuation here")).toBe(1);
  });

  it("returns 0 for empty text", () => {
    expect(countSentences("")).toBe(0);
  });
});

describe("countSyllables", () => {
  it("counts roughly correct syllables for simple words", () => {
    // cat=1, apple=2, banana=3
    expect(countSyllables("cat apple banana")).toBeGreaterThanOrEqual(5);
  });
});

describe("fleschReadingEase", () => {
  it("scores simple short sentences as easy", () => {
    const score = fleschReadingEase("The cat sat on the mat. It was a sunny day.");
    expect(score).toBeGreaterThan(70);
  });

  it("returns a lower score for long, complex sentences", () => {
    const complex =
      "The consequential ramifications of institutionalized organizational restructuring necessitate comprehensive multidisciplinary evaluation.";
    const score = fleschReadingEase(complex);
    expect(score).toBeLessThan(40);
  });

  it("returns 0 for empty text", () => {
    expect(fleschReadingEase("")).toBe(0);
  });

  it("clamps to the 0-100 range", () => {
    const score = fleschReadingEase("Go. Go. Go. Go. Go.");
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
