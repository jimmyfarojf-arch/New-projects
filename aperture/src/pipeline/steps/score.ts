import type { PipelineContext } from "../../types.js";
import { scoreContent } from "../../scoring/index.js";

export async function scoreStep(ctx: PipelineContext): Promise<PipelineContext> {
  if (!ctx.draft || !ctx.research) {
    throw new Error("scoreStep requires ctx.draft and ctx.research -- run earlier steps first.");
  }

  const score = scoreContent(ctx.draft, ctx.topic, ctx.research);
  return { ...ctx, score };
}
