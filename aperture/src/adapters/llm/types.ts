/**
 * Abstraction over "something that can turn a prompt into text".
 *
 * Keeping this as a narrow interface (rather than importing the Anthropic
 * SDK directly into the pipeline steps) means:
 *  - steps are trivial to unit test with a fake/deterministic adapter
 *  - swapping providers (or adding a fallback provider) touches one file
 *  - no network calls happen in `npm test`
 */
export interface LlmAdapter {
  /**
   * @param system  System / instruction prompt.
   * @param prompt  User-turn content for this call.
   * @param maxTokens  Soft cap on response length.
   */
  complete(system: string, prompt: string, maxTokens?: number): Promise<string>;
}
