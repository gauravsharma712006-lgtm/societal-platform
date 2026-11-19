
import { z } from 'zod';

import { env } from '../../config/env';

const ollamaResponseSchema = z.object({
  message: z.object({
    content: z.string(),
  }),
});

interface OllamaMessage {
  role: 'system' | 'user';
  content: string;
}

export const generateWithOllama = async (
  messages: OllamaMessage[],
): Promise<string> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    const response = await fetch(
      `${env.OLLAMA_BASE_URL}/api/chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: env.OLLAMA_MODEL,
          messages,
          stream: false,
          format: 'json',
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      throw new Error(
        `Ollama request failed with status ${response.status}.`,
      );
    }

    const result: unknown = await response.json();
    const parsedResponse = ollamaResponseSchema.safeParse(result);

    if (!parsedResponse.success) {
      throw new Error('Ollama returned an invalid response format.');
    }

    return parsedResponse.data.message.content;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Ollama request timed out after 60 seconds.');
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
};
