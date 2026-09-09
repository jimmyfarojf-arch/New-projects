import type { SearchAdapter } from "../../adapters/search/types.js";
import type { PipelineContext } from "../../types.js";

export function researchStep(search: SearchAdapter) {
  return async (ctx: PipelineContext): Promise<PipelineContext> => {
    const research = await search.research(ctx.topic);
    return { ...ctx, research };
  };
}
