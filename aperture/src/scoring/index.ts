import type { ContentDraft, ResearchResult, ScoreReport } from "../types.js";
import { scoreSeo } from "./seoScore.js";
import { scoreGeo } from "./geoScore.js";

export { scoreSeo } from "./seoScore.js";
export { scoreGeo } from "./geoScore.js";
export { fleschReadingEase } from "./readability.js";

/**
 * Combined weighting deliberately favors GEO slightly (55/45). Classic SEO
 * still gets you found; GEO is what gets you *cited* once AI answers are
 * the thing standing between a searcher and your site -- which is the bet
 * this whole project (and InSpace's actual product) is making.
 */
export function scoreContent(draft: ContentDraft, topic: string, research: ResearchResult): ScoreReport {
  const seo = scoreSeo(draft, topic);
  const geo = scoreGeo(draft, research);
  const combined = Math.round(seo.total * 0.45 + geo.total * 0.55);

  return { seo, geo, combined };
}
