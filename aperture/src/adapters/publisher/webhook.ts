import type { ContentDraft, PublishResult } from "../../types.js";
import type { PublisherAdapter } from "./types.js";

/**
 * Publishes a draft by POSTing it as JSON to a configured webhook URL --
 * e.g. a headless CMS ingestion endpoint, a static-site rebuild hook, or
 * (as used in local testing) https://webhook.site for inspection.
 */
export class WebhookPublisherAdapter implements PublisherAdapter {
  constructor(private readonly webhookUrl: string) {}

  async publish(draft: ContentDraft): Promise<PublishResult> {
    try {
      const response = await fetch(this.webhookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      });

      if (!response.ok) {
        return {
          published: false,
          target: this.webhookUrl,
          reason: `Webhook responded with HTTP ${response.status}`,
        };
      }

      return {
        published: true,
        target: this.webhookUrl,
        publishedAt: new Date().toISOString(),
      };
    } catch (err) {
      return {
        published: false,
        target: this.webhookUrl,
        reason: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }
}
