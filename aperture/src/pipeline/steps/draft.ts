import type { LlmAdapter } from "../../adapters/llm/types.js";
import type { ContentDraft, PipelineContext } from "../../types.js";
import { countWords } from "../../scoring/readability.js";

const SYSTEM_PROMPT = `You are a content writer producing an article draft.
Write in Markdown. Start with a single H1. Open with a direct, concrete
answer in the first 1-2 sentences -- no throat-clearing, no "In today's
world...". Use H2/H3 sections following the given outline. End with a
"## FAQ" section using "### <question>?" subheadings that directly answer
each must-answer question. Respond with ONLY the article markdown, nothing else.`;

export function draftStep(llm: LlmAdapter) {
  return async (ctx: PipelineContext): Promise<PipelineContext> => {
    if (!ctx.brief) {
      throw new Error("draftStep requires ctx.brief -- run briefStep first.");
    }

    const prompt = [
      `Topic: ${ctx.topic}`,
      `Working title: ${ctx.brief.workingTitle}`,
      `Target audience: ${ctx.brief.targetAudience}`,
      `Search intent: ${ctx.brief.searchIntent}`,
      "",
      "Outline:",
      ...ctx.brief.outline.map((section, i) => `${i + 1}. ${section}`),
      "",
      "Must-answer questions (cover each explicitly, ideally in the FAQ):",
      ...ctx.brief.mustAnswerQuestions.map((q) => `- ${q}`),
    ].join("\n");

    const markdown = await llm.complete(SYSTEM_PROMPT, prompt, 2000);
    const titleMatch = markdown.match(/^#\s+(.+)$/m);

    const draft: ContentDraft = {
      title: titleMatch?.[1]?.trim() ?? ctx.brief.workingTitle,
      markdown,
      metaDescription: ctx.brief.metaDescription,
      wordCount: countWords(markdown),
    };

    return { ...ctx, draft };
  };
}
