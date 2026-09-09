import type { PublisherAdapter } from "../../adapters/publisher/types.js";
import type { PipelineContext } from "../../types.js";

/** Draft must clear this combined score before it's allowed to publish automatically. */
const MIN_COMBINED_SCORE = 70;

export function publishStep(publisher: PublisherAdapter, minScore = MIN_COMBINED_SCORE) {
  return async (ctx: PipelineContext): Promise<PipelineContext> => {
    if (!ctx.draft || !ctx.score) {
      throw new Error("publishStep requires ctx.draft and ctx.score -- run earlier steps first.");
    }

    if (ctx.score.combined < minScore) {
      return {
        ...ctx,
        publish: {
          published: false,
          target: "n/a",
          reason: `Combined score ${ctx.score.combined} is below the ${minScore} publish threshold -- held for human review.`,
        },
      };
    }

    const publish = await publisher.publish(ctx.draft);
    return { ...ctx, publish };
  };
}
