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
  response: any,
  requiredFields: string[]
): T {
  for (const field of requiredFields) {
    if (!(field in response)) {
      throw new LLMError(
        `Missing required field: ${field}`,
        'INVALID_RESPONSE'
      );
    }
  }
  return response as T;
}

export function createFallbackResponse(type: 'setup' | 'orchestration' | 'character' | 'exchange'): any {
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

export function getErrorMessage(error: any): string {
  if (error?.code === 'MODEL_NOT_FOUND') {
    return 'The AI model is not available. Please ensure Ollama is running and the qwen3:30b model is installed.';
  }
  if (error?.code === 'CONNECTION_ERROR') {
    return 'Cannot connect to the AI service. Please ensure Ollama is running on localhost:11434.';
  }
  if (error?.code === 'TIMEOUT') {
    return 'The AI is taking too long to respond. Please try again.';
  }
  if (error?.code === 'PARSE_ERROR') {
    return 'The AI response was malformed. This might be a temporary issue.';
  }
  
  return error?.message || 'An unexpected error occurred.';
}