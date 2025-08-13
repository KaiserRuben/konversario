import { callOllama, withRetry, OllamaError } from '@/lib/ollama';
import { createFallbackResponse } from '@/lib/error-handling';
import { 
  SETUP_PROMPT, 
  ORCHESTRATOR_PROMPT, 
  CHARACTER_BASE_PROMPT, 
  DYNAMICS_PROMPT, 
  COMPRESSION_PROMPT,
  CONVERSATION_STAGE_PROMPT,
  RESPONSE_MODULATION_PROMPT
} from '@/lib/prompts';
import {
  OrchestrationSchema,
  CharacterResponseSchema,
  SetupResponseSchema,
  ExchangeResponseSchema,
  CompressionResponseSchema,
  ConversationStageSchema,
  ResponseModulationSchema
} from '@/lib/schemas';
import {
  Room,
  Participant,
  Message,
  SetupResponse,
  OrchestrationResponse,
  CharacterResponse,
  ExchangeResponse,
  CompressionResponse,
  ConversationStageAssessment,
  ResponseModulation
} from '@/types';

export class LLMService {
  async setupRoom(userInput: string, locale: string = 'en'): Promise<SetupResponse> {
    try {
      const prompt = `
${SETUP_PROMPT(locale)}

User input: "${userInput}"

Analyze this input and create character profiles for each personality mentioned.
If the input is ambiguous (e.g., just "Einstein"), make reasonable assumptions.

Return a JSON object with the structure defined in SetupResponse.
`;

      return await withRetry(() => callOllama(prompt, SetupResponseSchema)) as SetupResponse;
    } catch (error) {
      console.warn('Setup room failed, using fallback:', error);
      const fallback = createFallbackResponse('setup') as unknown as SetupResponse;
      
      // Try to parse character names from user input as fallback
      const names = userInput.split(/[,&\+]|\s+and\s+/).map(n => n.trim()).filter(n => n);
      if (names.length > 0) {
        fallback.participants = names.map(name => ({
          name,
          identity: `${name} - a notable figure ready for conversation`,
          personality: 'Engaging and thoughtful in discussion',
          greeting: `Hello! I'm ${name}. I'm pleased to meet you.`,
          currentState: 'Ready and attentive'
        }));
      }
      
      return fallback;
    }
  }

  async orchestrateResponse(
    userMessage: string,
    room: Room,
    locale: string = 'en'
  ): Promise<OrchestrationResponse> {
    try {
      // Try to get cached assessments from previous message
      const assessments = await this.getCachedAssessments(room.id);
      
      let assessmentContext = '';
      if (assessments) {
        assessmentContext = `

Previous conversation assessment:
- User engagement: ${assessments.stage?.userState} (${assessments.stage?.momentum} momentum)
- Suggested depth: ${assessments.stage?.suggestedDepth}
- Optimal parameters: ${assessments.modulation?.targetLength} response, max ${assessments.modulation?.maxCharacters} characters
- Priority: ${assessments.modulation?.priority}`;
      }

      const prompt = `
${ORCHESTRATOR_PROMPT(locale)}

Current participants: ${room.participants.map(p => p.name).join(', ')}
Room atmosphere: ${room.atmosphere}
Recent messages: ${this.formatRecentMessages(room.messages)}${assessmentContext}

User just said: "${userMessage}"

Determine who should respond and why. Consider the personalities, current dynamics, and natural conversation flow.
${assessments ? 'Use the conversation assessment to calibrate your response appropriately.' : ''}

You MUST return a JSON object with EXACTLY this structure:
{
  "interpretation": "your interpretation of what the user wants",
  "plan": [
    {
      "who": "participant name",
      "why": "reason they should respond",
      "when": "immediate",
      "likelihood": "description of likelihood"
    }
  ],
  "expectedDynamic": "what will happen",
  "continueWithoutUser": false,
  "tensionLevel": "current tension level"
}

IMPORTANT: The "plan" field MUST be an array of objects with the exact keys: who, why, when, likelihood.
`;

      return await withRetry(() => callOllama(prompt, OrchestrationSchema)) as OrchestrationResponse;
    } catch (error) {
      console.warn('Orchestration failed, using fallback:', error);
      const fallback = createFallbackResponse('orchestration') as unknown as OrchestrationResponse;
      
      // Ensure fallback has a valid plan array
      if (!fallback.plan || !Array.isArray(fallback.plan)) {
        fallback.plan = [];
      }
      
      // Pick a participant to respond
      if (room.participants.length > 0) {
        const participant = room.participants[0]; // Use first participant for consistency
        fallback.plan = [
          {
            who: participant.name,
            why: 'Continuing the conversation naturally',
            when: 'immediate' as const,
            likelihood: 'Will respond'
          }
        ];
      }
      
      return fallback;
    }
  }

  async generateCharacterResponse(
    character: Participant,
    context: {
      userMessage: string;
      room: Room;
      reason: string;
      locale?: string;
    }
  ): Promise<CharacterResponse> {
    try {
      const characterPrompt = this.buildCharacterPrompt(character, context.locale || 'en');
      
      const prompt = `
${characterPrompt}

The user just said: "${context.userMessage}"
You are responding because: ${context.reason}
Current room atmosphere: ${context.room.atmosphere}

Respond authentically as ${character.name}. Include what you say, how you say it, and what you're thinking.

Return a JSON object with your response.
`;

      return await withRetry(() => callOllama(prompt, CharacterResponseSchema)) as CharacterResponse;
    } catch (error) {
      console.warn(`Character response failed for ${character.name}, using fallback:`, error);
      const fallback = createFallbackResponse('character') as unknown as CharacterResponse;
      
      fallback.speaker = character.name;
      fallback.speech = `That's an interesting point. As ${character.name}, I find myself reflecting on what you've shared.`;
      fallback.delivery = 'Speaking thoughtfully, maintaining their characteristic demeanor';
      fallback.internalState = `Engaged with the conversation and considering how to respond authentically`;
      
      return fallback;
    }
  }

  async generateExchange(
    room: Room,
    triggerReason: string,
    locale: string = 'en'
  ): Promise<ExchangeResponse> {
    const prompt = `
${DYNAMICS_PROMPT(locale)}

Participants: ${room.participants.map(p => `${p.name}: ${p.currentState}`).join('\n')}
Atmosphere: ${room.atmosphere}
Trigger: ${triggerReason}

Generate a natural exchange between the participants. They should respond to each other until a natural pause point.

Return a JSON object with the exchanges.
`;

    return await withRetry(() => callOllama(prompt, ExchangeResponseSchema)) as ExchangeResponse;
  }

  async compressContext(room: Room, locale: string = 'en'): Promise<CompressionResponse> {
    const prompt = `
${COMPRESSION_PROMPT(locale)}

Conversation to compress:
${this.formatFullConversation(room)}

Distill this conversation to its essence while preserving character evolution and unresolved tensions.

Return a JSON object with the compressed context.
`;

    return await withRetry(() => callOllama(prompt, CompressionResponseSchema)) as CompressionResponse;
  }

  // Background assessment methods - called asynchronously after responses
  async assessConversationStage(
    room: Room,
    recentUserMessage: string,
    locale: string = 'en'
  ): Promise<ConversationStageAssessment> {
    try {
      const prompt = `
${CONVERSATION_STAGE_PROMPT}

Current conversation context:
User's latest message: "${recentUserMessage}"
Recent messages: ${this.formatRecentMessages(room.messages, 5)}
Room atmosphere: ${room.atmosphere}
Message count: ${room.messages.length}

Assess the current conversation stage based on user engagement signals and momentum.

Return a JSON object with the assessment.
`;

      return await withRetry(() => callOllama(prompt, ConversationStageSchema)) as ConversationStageAssessment;
    } catch (error) {
      console.warn('Conversation stage assessment failed, using fallback:', error);
      // Fallback based on message characteristics
      const wordCount = recentUserMessage.split(' ').length;
      return {
        userState: wordCount > 30 ? 'engaged' : wordCount > 10 ? 'exploring' : 'casual',
        momentum: 'sustained',
        suggestedDepth: 'moderate'
      };
    }
  }

  async assessResponseModulation(
    userMessage: string,
    room: Room,
    locale: string = 'en'
  ): Promise<ResponseModulation> {
    try {
      const prompt = `
${RESPONSE_MODULATION_PROMPT}

User message to analyze: "${userMessage}"
Message length: ${userMessage.length} characters, ${userMessage.split(' ').length} words
Room participants: ${room.participants.map(p => p.name).join(', ')}
Recent conversation tone: ${room.atmosphere}

Determine optimal response parameters for this input.

Return a JSON object with the modulation parameters.
`;

      return await withRetry(() => callOllama(prompt, ResponseModulationSchema)) as ResponseModulation;
    } catch (error) {
      console.warn('Response modulation assessment failed, using fallback:', error);
      // Fallback based on simple heuristics
      const wordCount = userMessage.split(' ').length;
      return {
        targetLength: wordCount > 30 ? 'full' : wordCount > 10 ? 'moderate' : 'brief',
        depth: wordCount > 20 ? 'accessible' : 'surface',
        maxCharacters: wordCount > 30 ? Math.min(3, room.participants.length) : 1,
        priority: 'clarity'
      };
    }
  }

  // Method to trigger background assessments after a response
  async triggerBackgroundAssessment(
    roomId: string,
    userMessage: string,
    room: Room,
    locale: string = 'en'
  ): Promise<void> {
    // Run assessments in parallel without blocking
    Promise.all([
      this.assessConversationStage(room, userMessage, locale),
      this.assessResponseModulation(userMessage, room, locale)
    ]).then(([stageAssessment, modulationAssessment]) => {
      // Store assessments in the database attached to the latest message
      this.storeAssessments(roomId, stageAssessment, modulationAssessment);
    }).catch(error => {
      console.warn('Background assessment failed:', error);
      // Don't throw - background assessments are optional optimizations
    });
  }

  private async storeAssessments(
    roomId: string,
    stageAssessment: ConversationStageAssessment,
    modulationAssessment: ResponseModulation
  ): Promise<void> {
    try {
      // Import Prisma dynamically to avoid circular dependencies
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      // Get the most recent message to attach assessments to
      const latestMessage = await prisma.message.findFirst({
        where: { roomId },
        orderBy: { timestamp: 'desc' }
      });

      if (latestMessage) {
        await prisma.message.update({
          where: { id: latestMessage.id },
          data: {
            conversationStage: JSON.stringify(stageAssessment),
            responseModulation: JSON.stringify(modulationAssessment)
          }
        });
      }

      await prisma.$disconnect();
    } catch (error) {
      console.warn('Failed to store assessments in database:', error);
    }
  }

  private async getCachedAssessments(roomId: string): Promise<{
    stage?: ConversationStageAssessment,
    modulation?: ResponseModulation
  } | null> {
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      // Get the most recent message with assessments
      const messageWithAssessments = await prisma.message.findFirst({
        where: { 
          roomId,
          OR: [
            { conversationStage: { not: null } },
            { responseModulation: { not: null } }
          ]
        },
        orderBy: { timestamp: 'desc' }
      });

      await prisma.$disconnect();

      if (!messageWithAssessments) return null;

      return {
        stage: messageWithAssessments.conversationStage 
          ? JSON.parse(messageWithAssessments.conversationStage) 
          : undefined,
        modulation: messageWithAssessments.responseModulation 
          ? JSON.parse(messageWithAssessments.responseModulation) 
          : undefined
      };
    } catch (error) {
      console.warn('Failed to get cached assessments:', error);
      return null;
    }
  }

  private buildCharacterPrompt(character: Participant, locale: string = 'en'): string {
    return `
${CHARACTER_BASE_PROMPT(locale).replace('[CHARACTER_NAME]', character.name)}

Your Truth:
${character.identity}

Your Personality:
${character.personality}

Your Current State:
${character.currentState}
`;
  }

  private formatRecentMessages(messages: Message[], limit = 10): string {
    return messages
      .slice(-limit)
      .map(m => `${m.authorName}: ${m.content}`)
      .join('\n');
  }

  private formatFullConversation(room: Room): string {
    return room.messages
      .map(m => {
        const meta = m.metadata ? ` [${m.metadata.emotion || ''}]` : '';
        return `${m.authorName}: ${m.content}${meta}`;
      })
      .join('\n');
  }
}