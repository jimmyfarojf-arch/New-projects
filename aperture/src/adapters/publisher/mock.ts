import type { ContentDraft, PublishResult } from "../../types.js";
import type { PublisherAdapter } from "./types.js";

/** Simulates publishing without making a network call. Always succeeds. */
export class MockPublisherAdapter implements PublisherAdapter {
  async publish(_draft: ContentDraft): Promise<PublishResult> {
    return {
      published: true,
      target: "mock://local-preview",
      publishedAt: new Date().toISOString(),
    };
  }
}
