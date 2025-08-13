// app/room/[roomId]/page.tsx
'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { animated, useSpring } from '@react-spring/web';
import { MessageEthereal, EtherealTypingIndicator } from '@/components/message-ethereal';
import { ParticleField, MessageParticles } from '@/components/particle-field';
import {
  EmotionRiver,
  EmotionalAtmosphere,
  PersonalityAvatars
} from '@/components/emotion-visualizer';
import { Message, Participant } from '@/types';
import { useUIStore, useAtmosphere } from '@/store/ui-store';
import { generateCSSVariables, getTimeBasedAtmosphere } from '@/lib/design-system';
import { cn } from '@/lib/utils';
import { ArrowLeft, Send, Settings, X } from 'lucide-react';

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

export default function EtherealRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const resolvedParams = use(params);
  const { roomId } = resolvedParams;

  const t = useTranslations('RoomPage');
  const tErrors = useTranslations('Errors');

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  // UI Store
  const { atmosphere } = useAtmosphere();
  const preferences = useUIStore((state) => state.preferences);
  const setPreference = useUIStore((state) => state.setPreference);
  const setConversationDepth = useUIStore((state) => state.setConversationDepth);

  // Apply atmosphere CSS variables
  useEffect(() => {
    const theme = getTimeBasedAtmosphere();
    const cssVars = generateCSSVariables(theme);
    Object.entries(cssVars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, String(value));
    });
  }, [atmosphere]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load room and messages
  useEffect(() => {
    loadRoom();
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const loadRoom = async () => {
    try {
      const res = await fetch(`/api/rooms/${roomId}`);
      if (!res.ok) throw new Error(t('roomNotFound'));
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
      if (!res.ok) throw new Error(t('failedToLoadMessages'));
      const data = await res.json();
      setMessages(data.messages);

      // Analyze conversation depth from messages
      if (data.messages.length > 10) {
        setConversationDepth('deep');
      } else if (data.messages.length > 5) {
        setConversationDepth('accessible');
      }
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
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      setInput(userMessage);
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

  // Input field animation
  const inputSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
    delay: 500,
  });

  if (error && !room) {
    return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
                onClick={() => router.push('/')}
                className="text-sm opacity-60 hover:opacity-100 transition-opacity"
            >
              <ArrowLeft className="inline mr-2 h-3 w-3" />
              {t('backToHome')}
            </button>
          </div>
        </div>
    );
  }

  if (!room) {
    return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-slate-500">{t('loadingRoom')}</div>
        </div>
    );
  }

  // Get last message metadata for particle field
  const lastMessage = messages[messages.length - 1];
  const lastMetadata = lastMessage?.metadata;

  return (
      <div className="h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        {/* Dynamic CSS variables for atmosphere */}
        <style jsx global>{`
          :root {
            --atmosphere-hue: ${getTimeBasedAtmosphere().hue};
            --atmosphere-saturation: ${getTimeBasedAtmosphere().saturation * 100}%;
            --atmosphere-lightness: ${getTimeBasedAtmosphere().lightness * 100}%;
          }
        `}</style>

        {/* Emotional atmosphere background */}
        <EmotionalAtmosphere messages={messages} />

        {/* Particle field */}
        {preferences.particlesEnabled && (
            <ParticleField
                metadata={lastMetadata}
                intensity={useUIStore.getState().emotionIntensity}
            />
        )}

        {/* Emotion river timeline */}
        {preferences.messageLayout === 'timeline' && (
            <EmotionRiver messages={messages} />
        )}

        {/* Personality avatars */}
        {room.participants && preferences.messageLayout === 'floating' && (
            <PersonalityAvatars participants={room.participants} />
        )}

        {/* Navigation */}
        <div className="absolute top-4 left-4 right-4 z-30 flex justify-between items-center">
          <button
              onClick={() => router.push('/')}
              className="text-sm opacity-40 hover:opacity-100 transition-opacity"
          >
            <ArrowLeft className="inline mr-2 h-3 w-3" />
            Back
          </button>

          {room.focus && (
              <div className="text-center text-xs opacity-40">
                {room.focus}
              </div>
          )}

          <button
              onClick={() => setShowSettings(!showSettings)}
              className="opacity-40 hover:opacity-100 transition-opacity"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
            <div className="absolute top-12 right-4 z-40 bg-white dark:bg-slate-900 rounded-lg shadow-xl p-4 w-64">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium">Settings</h3>
                <button onClick={() => setShowSettings(false)}>
                  <X className="h-3 w-3" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between">
                  <span>Particles</span>
                  <input
                      type="checkbox"
                      checked={preferences.particlesEnabled}
                      onChange={(e) => setPreference('particlesEnabled', e.target.checked)}
                      className="ml-2"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <span>Message Particles</span>
                  <input
                      type="checkbox"
                      checked={preferences.messageParticles}
                      onChange={(e) => setPreference('messageParticles', e.target.checked)}
                      className="ml-2"
                      disabled={!preferences.particlesEnabled}
                  />
                </label>

                <label className="flex items-center justify-between">
                  <span>Internal Thoughts</span>
                  <select
                      value={preferences.showInternalThoughts}
                      onChange={(e) => setPreference('showInternalThoughts', e.target.value as 'always' | 'hover' | 'never')}
                      className="ml-2 bg-transparent border rounded px-1"
                  >
                    <option value="always">Always</option>
                    <option value="hover">On Hover</option>
                    <option value="never">Never</option>
                  </select>
                </label>

                <label className="flex items-center justify-between">
                  <span>Layout</span>
                  <select
                      value={preferences.messageLayout}
                      onChange={(e) => setPreference('messageLayout', e.target.value as 'floating' | 'aligned' | 'timeline')}
                      className="ml-2 bg-transparent border rounded px-1"
                  >
                    <option value="floating">Floating</option>
                    <option value="aligned">Aligned</option>
                    <option value="timeline">Timeline</option>
                  </select>
                </label>

                <label className="flex items-center justify-between">
                  <span>Reduced Motion</span>
                  <input
                      type="checkbox"
                      checked={preferences.reducedMotion}
                      onChange={(e) => setPreference('reducedMotion', e.target.checked)}
                      className="ml-2"
                  />
                </label>
              </div>
            </div>
        )}

        {/* Messages */}
        <div
            ref={scrollRef}
            className="h-full overflow-y-auto px-8 py-20"
            style={{ scrollBehavior: preferences.reducedMotion ? 'auto' : 'smooth' }}
        >
          <div className={cn(
              "min-h-full flex flex-col justify-end",
              preferences.messageLayout === 'timeline' && "ml-16"
          )}>
            <div className="space-y-4 max-w-6xl mx-auto w-full mb-4">
              {messages.map((message, index) => (
                  <div key={message.id} className="relative">
                    <MessageEthereal
                        message={message}
                        index={index}
                        totalMessages={messages.length}
                    />
                    {/* Per-message particles (optional) */}
                    {preferences.messageParticles && (
                        <MessageParticles message={message} />
                    )}
                  </div>
              ))}
              {loading && <EtherealTypingIndicator />}
            </div>
          </div>
        </div>

        {/* Input Area */}
        <animated.div
            style={inputSpring}
            className="absolute bottom-0 left-0 right-0 z-20"
        >
          <div className="max-w-4xl mx-auto p-6">
            {error && (
                <div className="mb-3 text-xs text-red-500 text-center">
                  {error}
                </div>
            )}

            <div className="relative">
            <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('placeholder')}
                disabled={loading}
                className={cn(
                    "w-full bg-transparent border-b border-slate-300 dark:border-slate-700",
                    "focus:border-slate-500 dark:focus:border-slate-500",
                    "outline-none resize-none px-2 py-2 pr-10",
                    "placeholder:text-slate-400 dark:placeholder:text-slate-600",
                    "transition-all duration-200",
                    "min-h-[40px] max-h-[120px]"
                )}
                rows={1}
                style={{
                  height: 'auto',
                  lineHeight: '1.5',
                }}
            />

              {input.trim() && (
                  <button
                      onClick={sendMessage}
                      disabled={loading}
                      className={cn(
                          "absolute right-2 bottom-2",
                          "opacity-50 hover:opacity-100 transition-opacity",
                          loading && "opacity-20 cursor-not-allowed"
                      )}
                  >
                    <Send className="h-4 w-4" />
                  </button>
              )}
            </div>

            <div className="mt-2 text-[10px] opacity-30 text-center">
              {t('keyboardHint')}
            </div>
          </div>
        </animated.div>
      </div>
  );
}