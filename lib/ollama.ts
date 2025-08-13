export const OLLAMA_CONFIG = {
  baseUrl: 'http://localhost:11434',
  model: 'qwen3:30b',
  options: {
    temperature: 0.8,
    top_p: 0.9,
    top_k: 40
    // No num_predict limit - let the model generate complete responses
  }
};

export class OllamaError extends Error {
  constructor(
    message: string,
    public code: 'CONNECTION_ERROR' | 'PARSE_ERROR' | 'TIMEOUT' | 'API_ERROR' | 'MODEL_NOT_FOUND'
  ) {
    super(message);
    this.name = 'OllamaError';
  }
}

export async function callOllama(
  prompt: string, 
  format: 'json' | 'text' | object = 'json'
): Promise<unknown> {
  try {
    const response = await fetch(`${OLLAMA_CONFIG.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_CONFIG.model,
        prompt,
        format: typeof format === 'object' ? format : format === 'json' ? 'json' : undefined,
        stream: false,
        options: OLLAMA_CONFIG.options
      }),
      signal: AbortSignal.timeout(480000) // 480 second timeout
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new OllamaError(
          `Model ${OLLAMA_CONFIG.model} not found. Please run: ollama pull ${OLLAMA_CONFIG.model}`,
          'MODEL_NOT_FOUND'
        );
      }
      throw new OllamaError(
        `Ollama API error: ${response.status} ${response.statusText}`,
        'API_ERROR'
      );
    }

    const data = await response.json();
    
    if (format === 'json' || typeof format === 'object') {
      try {
        return JSON.parse(data.response);
      } catch {
        console.error('Failed to parse JSON response:', data.response);
        throw new OllamaError('Invalid JSON response from LLM', 'PARSE_ERROR');
      }
    }
    
    return data.response;
  } catch (error) {
    if (error instanceof OllamaError) {
      throw error;
    }
    const err = error as { name?: string; code?: string; message?: string };
    if (err.name === 'AbortError') {
      throw new OllamaError('Request timed out', 'TIMEOUT');
    }
    if (err.code === 'ECONNREFUSED') {
      throw new OllamaError(
        'Cannot connect to Ollama. Please ensure Ollama is running on http://localhost:11434',
        'CONNECTION_ERROR'
      );
    }
    throw new OllamaError(`Unexpected error: ${err.message || 'Unknown error'}`, 'API_ERROR');
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    if (error instanceof OllamaError && error.code === 'MODEL_NOT_FOUND') {
      throw error; // Don't retry model not found errors
    }
    await new Promise(r => setTimeout(r, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
}