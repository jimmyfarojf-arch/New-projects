import type { LlmAdapter } from "./types.js";

/**
 * Deterministic, offline stand-in for a real model.
 *
 * Used by `npm test` and by `npm run cli -- --offline` so the whole pipeline
 * can be exercised (and demoed) without an ANTHROPIC_API_KEY or a network
 * call. It does just enough templating on the topic to produce plausible,
 * differently-shaped output per call -- it is not trying to be smart.
 */
export class MockLlmAdapter implements LlmAdapter {
  async complete(system: string, prompt: string): Promise<string> {
    const topic = extractTopic(prompt) ?? "the given topic";

    if (system.includes("content brief")) {
      return JSON.stringify(
        {
          workingTitle: `${capitalize(topic)}: The Complete Guide`,
          targetAudience: `People actively researching ${topic}`,
          searchIntent: "informational",
          outline: [
            "Introduction and direct answer",
            `What "${topic}" actually means`,
            "Key factors to consider",
            "Common mistakes",
            "FAQ",
          ],
          mustAnswerQuestions: [
            `What is ${topic}?`,
            `How much does ${topic} typically cost?`,
            `Is ${topic} worth it?`,
          ],
          metaDescription: `A practical, up-to-date guide to ${topic} -- what it is, what it costs, and how to get it right.`,
        },
        null,
        2
      );
    }

    if (system.includes("article draft")) {
      return [
        `# ${capitalize(topic)}: The Complete Guide`,
        "",
        `${capitalize(topic)} is a common question for anyone weighing their options, and the short answer depends on a few concrete factors covered below.`,
        "",
        `## What is ${topic}?`,
        `${capitalize(topic)} refers to the process and decisions involved in getting this right for your situation.`,
        "",
        `## Key factors to consider`,
        "- Budget and timeline",
        "- Your specific requirements",
        "- Long-term maintenance",
        "",
        "## Common mistakes",
        "Skipping research on this step is the single most common mistake people make.",
        "",
        "## FAQ",
        `### What is ${topic}?`,
        `In short, it's the set of choices covered in this guide.`,
        `### How much does ${topic} typically cost?`,
        "Costs vary, but budgeting with a clear range in mind avoids surprises.",
        `### Is ${topic} worth it?`,
        "For most people weighing the trade-offs above, yes.",
      ].join("\n");
    }

    return `Mock completion for: ${topic}`;
  }
}

function extractTopic(prompt: string): string | undefined {
  const match = prompt.match(/Topic:\s*(.+)/i);
  return match?.[1]?.trim();
}

function capitalize(text: string): string {
  return text.length === 0 ? text : text[0]!.toUpperCase() + text.slice(1);
}
