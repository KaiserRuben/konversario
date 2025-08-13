import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LLMService } from '@/services/llm-service';
import { OllamaError } from '@/lib/ollama';
import { Room, Participant } from '@/types';
import { getLocaleFromHeaders } from '@/lib/locale-context';

const llmService = new LLMService();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { content } = await req.json();
    const { roomId } = await params;
    
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'content is required and must be a string' },
        { status: 400 }
      );
    }
    
    // Get locale from request headers
    const locale = await getLocaleFromHeaders();
    
    // Save user message
    await prisma.message.create({
      data: {
        roomId,
        authorName: 'User',
        authorType: 'user',
        content
      }
    });
    
    // Get room state
    const room = await prisma.conversationRoom.findUnique({
      where: { id: roomId },
      include: { messages: { orderBy: { timestamp: 'asc' } } }
    });
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    
    // Parse participants and build room state
    const participants: Participant[] = JSON.parse(room.participants);
    const systemMessage = room.messages.find(m => m.authorType === 'system');
    const atmosphere = systemMessage?.metadata 
      ? JSON.parse(systemMessage.metadata).atmosphere 
      : 'Neutral and expectant';
    
    const roomState: Room = {
      id: room.id,
      participants,
      topic: room.focus || undefined,
      messages: room.messages.map(msg => ({
        id: msg.id,
        authorName: msg.authorName,
        authorType: msg.authorType as 'user' | 'participant' | 'system',
        content: msg.content,
        timestamp: msg.timestamp.getTime(),
        metadata: msg.metadata ? JSON.parse(msg.metadata) : undefined
      })),
      state: { 
        status: room.status as 'setup' | 'active' | 'waiting_user' | 'processing',
        contextSummary: '',
        turnCount: room.messages.length,
        lastActivity: Date.now(),
        currentDynamic: 'User just spoke'
      },
      atmosphere
    };
    
    // Orchestrate responses
    let orchestration = await llmService.orchestrateResponse(content, roomState, locale);
    console.log('Orchestration result:', JSON.stringify(orchestration, null, 2));
    
    const responses = [];
    
    // Validate orchestration response and handle different formats
    if (!orchestration.plan || !Array.isArray(orchestration.plan)) {
      console.warn('Invalid orchestration response, using fallback:', { orchestration });
      
      // Complete fallback
      orchestration = {
        interpretation: 'User wants to continue the conversation',
        plan: [
          {
            who: participants.length > 0 ? participants[0].name : 'Assistant',
            why: 'Continuing the conversation',
            when: 'immediate' as const,
            likelihood: 'Will respond'
          }
        ],
        expectedDynamic: 'Continuing conversation',
        continueWithoutUser: false,
        tensionLevel: 'Relaxed'
      };
    }
    
    // Generate each character's response
    for (const action of orchestration.plan) {
      if (action.when === 'immediate' || action.when === 'after_previous') {
        const character = participants.find(p => p.name === action.who);
        if (!character) continue;
        
        const response = await llmService.generateCharacterResponse(character, {
          userMessage: content,
          room: roomState,
          reason: action.why,
          locale
        });
        
        // Validate response and ensure required fields
        if (!response.speaker || !response.speech) {
          console.warn('Invalid character response, using defaults:', response);
          response.speaker = character.name;
          response.speech = response.speech || 
            `That's an interesting point. As ${character.name}, I find myself reflecting on what you've shared.`;
          response.delivery = response.delivery || 'Speaking thoughtfully';
          response.internalState = response.internalState || 'Engaged with the conversation';
        }
        
        // Save character message
        const message = await prisma.message.create({
          data: {
            roomId,
            authorName: response.speaker,
            authorType: 'participant',
            content: response.speech,
            metadata: JSON.stringify({
              emotion: response.delivery,
              internalThought: response.internalState,
              subtext: response.subtext
            })
          }
        });
        
        responses.push({
          id: message.id,
          authorName: message.authorName,
          authorType: message.authorType,
          content: message.content,
          timestamp: message.timestamp.getTime(),
          metadata: JSON.parse(message.metadata || '{}')
        });
        
        // Update room atmosphere if changed
        if (response.changesAtmosphere) {
          roomState.atmosphere = response.changesAtmosphere;
        }
      }
    }
    
    // Handle multi-party exchange if needed
    if (orchestration.continueWithoutUser && responses.length > 0) {
      try {
        const exchange = await llmService.generateExchange(
          roomState,
          orchestration.expectedDynamic,
          locale
        );
        
        for (const ex of exchange.exchanges.slice(0, 3)) { // Limit to 3 exchanges
          const message = await prisma.message.create({
            data: {
              roomId,
              authorName: ex.speaker,
              authorType: 'participant',
              content: ex.text,
              metadata: JSON.stringify({ 
                manner: ex.manner,
                effect: ex.effect 
              })
            }
          });
          
          responses.push({
            id: message.id,
            authorName: message.authorName,
            authorType: message.authorType,
            content: message.content,
            timestamp: message.timestamp.getTime(),
            metadata: JSON.parse(message.metadata || '{}')
          });
        }
      } catch (exchangeError) {
        console.warn('Exchange generation failed:', exchangeError);
        // Continue without exchange - we already have character responses
      }
    }
    
    // Check if context compression is needed
    const messageCount = await prisma.message.count({
      where: { roomId }
    });
    
    if (messageCount > 30) {
      // TODO: Implement context compression
      console.log('Context compression needed for room:', roomId);
    }
    
    // Trigger background assessment for next orchestration (non-blocking)
    if (responses.length > 0) {
      llmService.triggerBackgroundAssessment(roomId, content, roomState, locale);
    }
    
    return NextResponse.json({ responses });
  } catch (error) {
    console.error('Message handling error:', error);
    
    if (error instanceof OllamaError) {
      return NextResponse.json(
        { 
          error: 'LLM service error',
          details: error.message,
          code: error.code 
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const messages = await prisma.message.findMany({
      where: { roomId },
      orderBy: { timestamp: 'asc' }
    });
    
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      authorName: msg.authorName,
      authorType: msg.authorType,
      content: msg.content,
      timestamp: msg.timestamp.getTime(),
      metadata: msg.metadata ? JSON.parse(msg.metadata) : undefined
    }));
    
    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}