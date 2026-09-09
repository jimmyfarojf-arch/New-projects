import { randomUUID } from "node:crypto";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { z } from "zod";
import { buildPipeline } from "./pipeline/buildPipeline.js";
import { MockLlmAdapter } from "./adapters/llm/mock.js";
import { AnthropicLlmAdapter } from "./adapters/llm/anthropic.js";
import { MockSearchAdapter } from "./adapters/search/mock.js";
import { MockPublisherAdapter } from "./adapters/publisher/mock.js";
import { WebhookPublisherAdapter } from "./adapters/publisher/webhook.js";
import { RunStore } from "./storage/runStore.js";
import type { LlmAdapter } from "./adapters/llm/types.js";
import type { PublisherAdapter } from "./adapters/publisher/types.js";

const app = new Hono();
const store = new RunStore();

const createRunSchema = z.object({
  topic: z.string().min(1, "topic is required"),
  offline: z.boolean().optional(),
});

app.get("/health", (c) => c.json({ status: "ok" }));

app.post("/runs", async (c) => {
  const body = await c.req.json().catch(() => undefined);
  const parsed = createRunSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const { topic, offline } = parsed.data;
  const useOffline = offline ?? !process.env.ANTHROPIC_API_KEY;

  const llm: LlmAdapter = useOffline ? new MockLlmAdapter() : new AnthropicLlmAdapter();
  const publisher: PublisherAdapter = process.env.PUBLISH_WEBHOOK_URL
    ? new WebhookPublisherAdapter(process.env.PUBLISH_WEBHOOK_URL)
    : new MockPublisherAdapter();

  const pipeline = buildPipeline({ llm, search: new MockSearchAdapter(), publisher });
  const record = await pipeline.run({ runId: randomUUID(), topic });
  await store.save(record);

  return c.json(record, record.status === "completed" ? 201 : 500);
});

app.get("/runs", async (c) => {
  const runs = await store.list();
  return c.json(
    runs.map((r) => ({
      runId: r.runId,
      topic: r.topic,
      status: r.status,
      startedAt: r.startedAt,
      finishedAt: r.finishedAt,
      combinedScore: r.context.score?.combined,
    }))
  );
});

app.get("/runs/:id", async (c) => {
  const run = await store.get(c.req.param("id"));
  if (!run) return c.json({ error: "not found" }, 404);
  return c.json(run);
});

const port = Number(process.env.PORT ?? 3000);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Aperture API listening on http://localhost:${info.port}`);
});

export default app;
