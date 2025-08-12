'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MessageComponent, TypingIndicator } from '@/components/message';
import { ArrowLeft, Send, Users } from 'lucide-react';
import { Message, Participant } from '@/types';

interface RoomData {
  id: string;
  title?: string;
  focus?: string;
  status: string;
  participants: Participant[];
  atmosphere: string;
  createdAt: string;
  updatedAt: string;
}

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const resolvedParams = use(params);
  const { roomId } = resolvedParams;
  
  const t = useTranslations('RoomPage');
  const tCommon = useTranslations('Common');
  const tErrors = useTranslations('Errors');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    loadRoom();
    loadMessages();
  }, [roomId]);

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Scroll when loading state changes (typing indicator appears/disappears)
    if (loading) {
      scrollToBottom();
    }
  }, [loading]);

  const loadRoom = async () => {
    try {
      const res = await fetch(`/api/rooms/${roomId}`);
      if (!res.ok) {
        throw new Error(t('roomNotFound'));
      }
      const data = await res.json();
      setRoom(data.room);
    } catch (error) {
      console.error('Failed to load room:', error);
      setError(t('roomNotFound'));
    }
  };

  const loadMessages = async () => {
    try {
      const res = await fetch(`/api/rooms/${roomId}/messages`);
      if (!res.ok) {
        throw new Error(t('failedToLoadMessages'));
      }
      const data = await res.json();
      setMessages(data.messages);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setError(t('failedToLoadMessages'));
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    setLoading(true);
    setError('');
    const userMessage = input;
    setInput('');
    
    // Optimistically add user message
    const tempMessage: Message = {
      id: Date.now().toString(),
      authorName: 'User',
      authorType: 'user',
      content: userMessage,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, tempMessage]);
    
    try {
      const res = await fetch(`/api/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: userMessage })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.details || errorData.error || tErrors('failedToSend'));
      }
      
      const data = await res.json();
      
      // Replace temp message with real data and add responses
      setMessages(prev => {
        const withoutTemp = prev.filter(m => m.id !== tempMessage.id);
        return [...withoutTemp, tempMessage, ...data.responses];
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      setError(error instanceof Error ? error.message : tErrors('failedToSend'));
      
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      setInput(userMessage); // Restore the input
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (error && !room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={() => router.push('/')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('backToHome')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-slate-100 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">{t('loadingRoom')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 overflow-hidden">
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              className="mb-4 -ml-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('backToHome')}
            </Button>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                <h1 className="font-semibold text-lg">{t('conversationRoom')}</h1>
              </div>
              {room.focus && (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <strong>{t('focus')}:</strong> {room.focus}
                </p>
              )}
              <p className="text-xs text-slate-500">
                <strong>{t('atmosphere')}:</strong> {room.atmosphere}
              </p>
            </div>
          </div>

          <div className="p-4 flex-1">
            <h2 className="font-medium mb-3 text-slate-900 dark:text-slate-100">{t('participants')}</h2>
            <div className="space-y-3">
              {room.participants.map((participant, index) => (
                <Card key={participant.id || index} className="p-3">
                  <div className="space-y-2">
                    <div className="font-medium text-sm">{participant.name}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {participant.identity}
                    </div>
                    <div className="text-xs">
                      <div className="text-xs">
                        {participant.currentState}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4">
                <div className="max-w-4xl mx-auto space-y-4">
                  {messages.map(msg => (
                    <MessageComponent key={msg.id} message={msg} />
                  ))}
                  {loading && <TypingIndicator />}
                  <div ref={messagesEndRef} className="h-1" />
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Input Area */}
          <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <div className="max-w-4xl mx-auto p-4">
              {error && (
                <div className="mb-3 p-3 rounded-md bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}
              
              <div className="flex gap-3">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('placeholder')}
                  className="flex-1 min-h-[80px] max-h-[200px] resize-none"
                  disabled={loading}
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={loading || !input.trim()}
                  className="self-end"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="mt-2 text-xs text-slate-500">
                {t('keyboardHint')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}