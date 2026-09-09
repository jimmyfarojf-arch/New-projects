import Anthropic from "@anthropic-ai/sdk";
import type { LlmAdapter } from "./types.js";

/**
 * Real LLM adapter, backed by the Anthropic API.
 *
 * Requires ANTHROPIC_API_KEY in the environment. Instantiating this class
 * does not make a network call -- that only happens on `.complete()`.
 */
export class AnthropicLlmAdapter implements LlmAdapter {
  private client: Anthropic;
  private model: string;

  constructor(opts?: { apiKey?: string; model?: string }) {
    const apiKey = opts?.apiKey ?? process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY is not set. Add it to your environment or .env file, " +
          "or use MockLlmAdapter for offline / test runs."
      );
    }
    this.client = new Anthropic({ apiKey });
    this.model = opts?.model ?? process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";
  }

  async complete(system: string, prompt: string, maxTokens = 1500): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("Anthropic response contained no text block.");
    }
    return textBlock.text;
  }
}
