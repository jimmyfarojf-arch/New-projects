import type { LlmAdapter } from "../../adapters/llm/types.js";
import type { ContentBrief, PipelineContext } from "../../types.js";

const SYSTEM_PROMPT = `You are an SEO/GEO content strategist writing a content brief.
Respond with ONLY a JSON object matching this shape, no prose, no markdown fences:
{
  "workingTitle": string,
  "targetAudience": string,
  "searchIntent": "informational" | "commercial" | "transactional" | "navigational",
  "outline": string[],
  "mustAnswerQuestions": string[],
  "metaDescription": string (120-158 characters)
}`;

export function briefStep(llm: LlmAdapter) {
  return async (ctx: PipelineContext): Promise<PipelineContext> => {
    if (!ctx.research) {
      throw new Error("briefStep requires ctx.research -- run researchStep first.");
    }

    const prompt = [
      `Topic: ${ctx.topic}`,
      "",
      `Long-tail questions people ask:`,
      ...ctx.research.longTailQuestions.map((q) => `- ${q.question} (${q.demandSignal} demand)`),
      "",
      `Themes competitors already cover:`,
      ...ctx.research.competitorThemes.map((t) => `- ${t}`),
      "",
      `Suggested subtopics: ${ctx.research.suggestedSubtopics.join(", ")}`,
    ].join("\n");

    const raw = await llm.complete(SYSTEM_PROMPT, prompt);
    const brief = parseBrief(raw);

    return { ...ctx, brief };
  };
}

function parseBrief(raw: string): ContentBrief {
  const jsonText = extractJson(raw);
  const parsed = JSON.parse(jsonText) as ContentBrief;

  if (!parsed.workingTitle || !Array.isArray(parsed.outline)) {
    throw new Error("Model response did not match the expected content brief shape.");
  }

  return parsed;
}

/** Models sometimes wrap JSON in ```json fences despite instructions -- strip those defensively. */
function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  return (fenced?.[1] ?? raw).trim();
}
