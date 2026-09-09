import type { ContentDraft, PublishResult } from "../../types.js";

/**
 * Abstraction over "somewhere a finished draft can be sent": a CMS webhook,
 * a static-site generator's content folder, a headless CMS API, etc.
 *
 * This is the seam that would let Aperture plug into a real CMS without
 * the pipeline itself knowing anything about HTTP, auth, or file formats.
 */
export interface PublisherAdapter {
  publish(draft: ContentDraft): Promise<PublishResult>;
}
