import * as ollamaProvider from './ollama.provider';
import { improveProblemReport } from './problem-assistant.service';

describe('problem assistant service', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('accepts a valid structured suggestion', async () => {
    jest.spyOn(ollamaProvider, 'generateWithOllama').mockResolvedValue(
      JSON.stringify({
        title: 'Broken streetlights near community park',
        description:
          'Several streetlights near the community park are not working after dark.',
        category: 'INFRASTRUCTURE',
      })
    );

    await expect(improveProblemReport({
      title: 'Broken lights',
      description:
        'Several streetlights near the community park are not working after dark.',
    })).resolves.toEqual(expect.objectContaining({
      category: 'INFRASTRUCTURE',
    }));
  });

  it('rejects invalid JSON', async () => {
    jest.spyOn(ollamaProvider, 'generateWithOllama').mockResolvedValue(
      'not-json'
    );

    await expect(improveProblemReport({
      title: '',
      description: 'A sufficiently detailed description for AI improvement.',
    })).rejects.toThrow('AI returned invalid JSON.');
  });

  it.each([
    {
      title: 'Valid title',
      description: 'A sufficiently detailed description for the report.',
    },
    {
      title: 'Valid title',
      description: 'A sufficiently detailed description for the report.',
      category: 'NOT_A_CATEGORY',
    },
  ])('rejects invalid suggestion structures', async (suggestion) => {
    jest.spyOn(ollamaProvider, 'generateWithOllama').mockResolvedValue(
      JSON.stringify(suggestion)
    );

    await expect(improveProblemReport({
      title: '',
      description: 'A sufficiently detailed description for AI improvement.',
    })).rejects.toThrow('AI returned an invalid problem suggestion.');
  });
});
