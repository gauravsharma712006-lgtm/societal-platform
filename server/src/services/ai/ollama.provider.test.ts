import { generateWithOllama } from './ollama.provider';

describe('Ollama provider', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns content from a valid Ollama response', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: '{"ok":true}' } }),
    } as Response);

    await expect(generateWithOllama([
      { role: 'user', content: 'Improve this report' },
    ])).resolves.toBe('{"ok":true}');
  });

  it('rejects Ollama HTTP errors', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 503,
    } as Response);

    await expect(generateWithOllama([
      { role: 'user', content: 'Improve this report' },
    ])).rejects.toThrow('Ollama request failed with status 503.');
  });

  it('rejects unexpected Ollama response structures', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ response: 'wrong shape' }),
    } as Response);

    await expect(generateWithOllama([
      { role: 'user', content: 'Improve this report' },
    ])).rejects.toThrow('Ollama returned an invalid response format.');
  });

  it('surfaces network failures', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(
      new Error('Network unavailable')
    );

    await expect(generateWithOllama([
      { role: 'user', content: 'Improve this report' },
    ])).rejects.toThrow('Network unavailable');
  });

  it('maps abort failures to a timeout error', async () => {
    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';

    jest.spyOn(global, 'fetch').mockRejectedValue(abortError);

    await expect(generateWithOllama([
      { role: 'user', content: 'Improve this report' },
    ])).rejects.toThrow('Ollama request timed out after 60 seconds.');
  });
  it('actually aborts a hung request at the 60-second deadline', async () => {
    jest.useFakeTimers();
    try {
      jest.spyOn(global, 'fetch').mockImplementation((_url, options) => new Promise((_resolve, reject) => {
        options?.signal?.addEventListener('abort', () => reject(Object.assign(new Error('Aborted'), { name: 'AbortError' })));
      }));
      const pending = expect(generateWithOllama([{ role: 'user', content: 'Draft to preserve' }])).rejects.toThrow('timed out after 60 seconds');
      await jest.advanceTimersByTimeAsync(60_000);
      await pending;
      expect(jest.getTimerCount()).toBe(0);
    } finally { jest.useRealTimers(); }
  });
  it('handles malformed JSON responses', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => { throw new SyntaxError('invalid JSON'); } } as never);
    await expect(generateWithOllama([{ role: 'user', content: 'Draft' }])).rejects.toThrow('invalid JSON');
  });
});
