/**
 * Flesch Reading Ease, computed from scratch (no dependency) so the whole
 * scoring engine stays deterministic, dependency-free, and easy to unit
 * test in isolation.
 *
 * Score interpretation (standard scale):
 *   90-100  very easy       60-70  standard
 *   70-90   easy            30-60  fairly difficult / difficult
 *   0-30    very confusing
 */
export function fleschReadingEase(text: string): number {
  const sentences = countSentences(text);
  const words = countWords(text);
  const syllables = countSyllables(text);

  if (words === 0 || sentences === 0) return 0;

  const score =
    206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);

  return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
}

export function countWords(text: string): number {
  const words = text
    .replace(/[#*_`>]/g, " ") // strip common markdown noise
    .split(/\s+/)
    .filter((w) => /[a-zA-Z]/.test(w));
  return words.length;
}

export function countSentences(text: string): number {
  const stripped = text.replace(/[#*_`>]/g, " ");
  const matches = stripped.match(/[^.!?]+[.!?]+/g);
  if (matches && matches.length > 0) return matches.length;
  // Fall back to 1 sentence if there's text but no terminal punctuation.
  return stripped.trim().length > 0 ? 1 : 0;
}

export function countSyllables(text: string): number {
  const words = text
    .replace(/[#*_`>]/g, " ")
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => /[a-z]/.test(w));

  return words.reduce((sum, word) => sum + syllablesInWord(word), 0);
}

function syllablesInWord(word: string): number {
  const cleaned = word.replace(/[^a-z]/g, "");
  if (cleaned.length === 0) return 0;
  if (cleaned.length <= 3) return 1;

  const withoutTrailingE = cleaned.replace(/e$/, "");
  const groups = withoutTrailingE.match(/[aeiouy]+/g);
  return Math.max(1, groups ? groups.length : 1);
}
