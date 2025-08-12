import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const room = await prisma.conversationRoom.findUnique({
      where: { id: roomId },
      include: { 
        messages: { 
          orderBy: { timestamp: 'asc' },
          take: 5 // Get first few messages for participants and atmosphere
        }
      }
    });
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    
    const participants = JSON.parse(room.participants);
    const systemMessage = room.messages.find(m => m.authorType === 'system');
    const atmosphere = systemMessage?.metadata 
      ? JSON.parse(systemMessage.metadata).atmosphere 
      : 'Neutral and expectant';
    
    return NextResponse.json({
      room: {
        id: room.id,
        title: room.title,
        focus: room.focus,
        status: room.status,
        participants,
        atmosphere,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt
      }
    });
  } catch (error) {
    console.error('Failed to fetch room:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room' },
      { status: 500 }
    );
  }
}