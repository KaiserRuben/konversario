// JSON Schemas for structured outputs from Ollama

export const OrchestrationSchema = {
  type: 'object',
  properties: {
    interpretation: {
      type: 'string',
      description: 'Your interpretation of what the user wants'
    },
    plan: {
      type: 'array',
      description: 'List of participants who should respond',
      items: {
        type: 'object',
        properties: {
          who: {
            type: 'string',
            description: 'Name of the participant who should respond'
          },
          why: {
            type: 'string',
            description: 'Reason they should respond'
          },
          when: {
            type: 'string',
            enum: ['immediate', 'after_previous', 'interrupting'],
            description: 'When they should respond'
          },
          likelihood: {
            type: 'string',
            description: 'How likely they are to respond'
          }
        },
        required: ['who', 'why', 'when', 'likelihood']
      }
    },
    expectedDynamic: {
      type: 'string',
      description: 'What will happen in the conversation'
    },
    continueWithoutUser: {
      type: 'boolean',
      description: 'Whether participants should continue talking without user input'
    },
    tensionLevel: {
      type: 'string',
      description: 'Current tension level in the room'
    }
  },
  required: ['interpretation', 'plan', 'expectedDynamic', 'continueWithoutUser', 'tensionLevel']
};

export const CharacterResponseSchema = {
  type: 'object',
  properties: {
    speaker: {
      type: 'string',
      description: 'Name of the character speaking'
    },
    speech: {
      type: 'string',
      description: 'What the character actually says'
    },
    delivery: {
      type: 'string',
      description: 'How they say it (tone, gesture, emotion)'
    },
    internalState: {
      type: 'string',
      description: 'What the character is thinking or feeling'
    },
    subtext: {
      type: 'string',
      description: 'What they really mean but are not saying directly'
    },
    triggersReaction: {
      type: 'string',
      description: 'Who might respond to this'
    },
    changesAtmosphere: {
      type: 'string',
      description: 'How this changes the room atmosphere'
    }
  },
  required: ['speaker', 'speech', 'delivery', 'internalState']
};

export const SetupResponseSchema = {
  type: 'object',
  properties: {
    success: {
      type: 'boolean'
    },
    participants: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          identity: { type: 'string' },
          personality: { type: 'string' },
          greeting: { type: 'string' },
          currentState: { type: 'string' }
        },
        required: ['name', 'identity', 'personality', 'greeting', 'currentState']
      }
    },
    setting: {
      type: 'string',
      description: 'Description of where the conversation takes place'
    },
    atmosphere: {
      type: 'string',
      description: 'Current atmosphere of the room'
    },
    suggestedOpening: {
      type: 'string',
      description: 'Optional conversation starter'
    }
  },
  required: ['success', 'participants', 'setting', 'atmosphere']
};

export const ExchangeResponseSchema = {
  type: 'object',
  properties: {
    exchanges: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          speaker: { type: 'string' },
          text: { type: 'string' },
          manner: { type: 'string' },
          effect: { type: 'string' }
        },
        required: ['speaker', 'text', 'manner', 'effect']
      }
    },
    roomShift: {
      type: 'string',
      description: 'How the room energy changed'
    },
    naturalPause: {
      type: 'boolean',
      description: 'Whether this is a natural pause point'
    },
    suggestedUserPrompt: {
      type: 'string',
      description: 'What the user might want to say next'
    }
  },
  required: ['exchanges', 'roomShift', 'naturalPause']
};

export const CompressionResponseSchema = {
  type: 'object',
  properties: {
    essence: {
      type: 'string',
      description: 'The emotional and intellectual core of the conversation'
    },
    characterEvolution: {
      type: 'object',
      description: 'How each character has changed',
      additionalProperties: {
        type: 'string'
      }
    },
    unresolved: {
      type: 'array',
      description: 'Unresolved tensions or questions',
      items: {
        type: 'string'
      }
    },
    keyMoments: {
      type: 'array',
      description: 'Key moments that must be remembered',
      items: {
        type: 'string'
      }
    }
  },
  required: ['essence', 'characterEvolution', 'unresolved', 'keyMoments']
};

export const ConversationStageSchema = {
  type: 'object',
  properties: {
    userState: {
      type: 'string',
      enum: ['casual', 'exploring', 'engaged', 'philosophical', 'confused'],
      description: 'Current state of user engagement'
    },
    momentum: {
      type: 'string',
      enum: ['building', 'sustained', 'shifting', 'waning'],
      description: 'Direction of conversation energy'
    },
    suggestedDepth: {
      type: 'string',
      enum: ['surface', 'moderate', 'full'],
      description: 'Recommended depth of next responses'
    }
  },
  required: ['userState', 'momentum', 'suggestedDepth']
};

export const ResponseModulationSchema = {
  type: 'object',
  properties: {
    targetLength: {
      type: 'string',
      enum: ['brief', 'moderate', 'full'],
      description: 'Target response length'
    },
    depth: {
      type: 'string',
      enum: ['surface', 'accessible', 'philosophical'],
      description: 'Target response depth'
    },
    maxCharacters: {
      type: 'number',
      minimum: 1,
      maximum: 5,
      description: 'Maximum number of characters that should respond'
    },
    priority: {
      type: 'string',
      enum: ['clarity', 'authenticity', 'engagement'],
      description: 'Primary focus for the response'
    }
  },
  required: ['targetLength', 'depth', 'maxCharacters', 'priority']
};