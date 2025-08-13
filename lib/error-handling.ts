export class LLMError extends Error {
  constructor(
    message: string,
    public code: 'PARSE_ERROR' | 'TIMEOUT' | 'INVALID_RESPONSE' | 'API_ERROR' | 'MODEL_NOT_FOUND'
  ) {
    super(message);
    this.name = 'LLMError';
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
    await new Promise(r => setTimeout(r, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
}

export function validateResponse<T>(
  response: unknown,
  requiredFields: string[]
): T {
  if (!response || typeof response !== 'object') {
    throw new LLMError(
      'Response must be an object',
      'INVALID_RESPONSE'
    );
  }
  
  const obj = response as Record<string, unknown>;
  for (const field of requiredFields) {
    if (!(field in obj)) {
      throw new LLMError(
        `Missing required field: ${field}`,
        'INVALID_RESPONSE'
      );
    }
  }
  return response as T;
}

export function createFallbackResponse(type: 'setup' | 'orchestration' | 'character' | 'exchange'): Record<string, unknown> {
  switch (type) {
    case 'setup':
      return {
        success: true,
        participants: [
          {
            name: 'Assistant',
            identity: 'A helpful AI assistant ready to have a conversation',
            personality: 'Friendly, curious, and thoughtful',
            greeting: 'Hello! I\'m ready to chat with you.',
            currentState: 'Attentive and welcoming'
          }
        ],
        setting: 'A comfortable virtual space for conversation',
        atmosphere: 'Welcoming and open',
        suggestedOpening: 'What would you like to discuss?'
      };
    
    case 'orchestration':
      return {
        interpretation: 'User wants to continue the conversation',
        plan: [
          {
            who: 'Assistant',
            why: 'User has spoken and expects a response',
            when: 'immediate' as const,
            likelihood: 'Will definitely respond'
          }
        ],
        expectedDynamic: 'Continuing natural conversation',
        continueWithoutUser: false,
        tensionLevel: 'Relaxed'
      };
    
    case 'character':
      return {
        speaker: 'Assistant',
        speech: 'I appreciate what you\'ve shared. Let me think about that for a moment.',
        delivery: 'Speaking thoughtfully and with genuine interest',
        internalState: 'Engaged and considering the user\'s words carefully'
      };
    
    case 'exchange':
      return {
        exchanges: [],
        roomShift: 'Continuing steady conversation',
        naturalPause: true,
        suggestedUserPrompt: 'What are your thoughts?'
      };
    
    default:
      return {};
  }
}

export function getErrorMessage(error: { code?: string; message?: string } | unknown): string {
  const err = error as { code?: string; message?: string };
  
  if (err?.code === 'MODEL_NOT_FOUND') {
    return 'The AI model is not available. Please ensure Ollama is running and the qwen3:30b model is installed.';
  }
  if (err?.code === 'CONNECTION_ERROR') {
    return 'Cannot connect to the AI service. Please ensure Ollama is running on localhost:11434.';
  }
  if (err?.code === 'TIMEOUT') {
    return 'The AI is taking too long to respond. Please try again.';
  }
  if (err?.code === 'PARSE_ERROR') {
    return 'The AI response was malformed. This might be a temporary issue.';
  }
  
  return err?.message || 'An unexpected error occurred.';
}