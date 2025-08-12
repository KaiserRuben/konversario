import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LLMService } from '@/services/llm-service';
import { OllamaError } from '@/lib/ollama';
import { getLocaleFromHeaders } from '@/lib/locale-context';

const llmService = new LLMService();

export async function POST(req: NextRequest) {
  try {
    const { userInput, focus } = await req.json();
    
    if (!userInput || typeof userInput !== 'string') {
      return NextResponse.json(
        { error: 'userInput is required and must be a string' },
        { status: 400 }
      );
    }
    
    // Get locale from request headers
    const locale = await getLocaleFromHeaders();
    
    // Setup room with LLM
    const setup = await llmService.setupRoom(userInput, locale);
    
    if (!setup || !setup.success) {
      return NextResponse.json(
        { error: 'Failed to setup conversation room' },
        { status: 400 }
      );
    }
    
    // Create room in database
    const room = await prisma.conversationRoom.create({
      data: {
        participants: JSON.stringify(setup.participants),
        focus: focus || setup.suggestedOpening,
        status: 'active'
      }
    });
    
    // Add system message with setting
    await prisma.message.create({
      data: {
        roomId: room.id,
        authorName: 'System',
        authorType: 'system',
        content: setup.setting,
        metadata: JSON.stringify({ atmosphere: setup.atmosphere })
      }
    });
    
    // Add character greetings
    for (const participant of setup.participants) {
      await prisma.message.create({
        data: {
          roomId: room.id,
          authorName: participant.name,
          authorType: 'participant',
          content: participant.greeting,
          metadata: JSON.stringify({ 
            emotion: participant.currentState,
            internalThought: `Entering the conversation as ${participant.identity}` 
          })
        }
      });
    }
    
    return NextResponse.json({ roomId: room.id, setup });
  } catch (error) {
    console.error('Room creation error:', error);
    
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
      { error: 'Failed to create room' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const rooms = await prisma.conversationRoom.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        focus: true,
        participants: true,
        status: true,
        createdAt: true,
        _count: {
          select: { messages: true }
        }
      }
    });
    
    // Parse participants for each room
    const roomsWithParticipants = rooms.map(room => ({
      ...room,
      participants: JSON.parse(room.participants)
    }));
    
    return NextResponse.json({ rooms: roomsWithParticipants });
  } catch (error) {
    console.error('Failed to fetch rooms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}