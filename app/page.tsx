'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Room {
  id: string;
  title: string | null;
  focus: string | null;
  participants: any[];
  status: string;
  createdAt: string;
  _count: { messages: number };
}

const templates = [
  {
    id: 'historical',
    icon: '🏛️',
    title: 'Historical Figures',
    description: 'Chat with Einstein, Napoleon, Cleopatra',
    gradient: 'from-amber-500 to-orange-600',
    prompt: 'Albert Einstein, Marie Curie, Leonardo da Vinci'
  },
  {
    id: 'writers',
    icon: '✍️',
    title: 'Great Writers',
    description: 'Discuss with Shakespeare, Austen, Tolkien',
    gradient: 'from-purple-500 to-pink-600',
    prompt: 'William Shakespeare, Jane Austen, Virginia Woolf'
  },
  {
    id: 'leaders',
    icon: '👑',
    title: 'World Leaders',
    description: 'Debate with Churchill, Gandhi, Lincoln',
    gradient: 'from-blue-500 to-indigo-600',
    prompt: 'Winston Churchill, Mahatma Gandhi, Abraham Lincoln'
  },
  {
    id: 'philosophers',
    icon: '🤔',
    title: 'Great Thinkers',
    description: 'Explore ideas with Socrates, Kant, Nietzsche',
    gradient: 'from-green-500 to-teal-600',
    prompt: 'Socrates, Immanuel Kant, Friedrich Nietzsche'
  },
  {
    id: 'scientists',
    icon: '🔬',
    title: 'Brilliant Scientists',
    description: 'Learn from Darwin, Tesla, Hawking',
    gradient: 'from-cyan-500 to-blue-600',
    prompt: 'Charles Darwin, Nikola Tesla, Stephen Hawking'
  },
  {
    id: 'artists',
    icon: '🎨',
    title: 'Master Artists',
    description: 'Create with Picasso, Van Gogh, Michelangelo',
    gradient: 'from-rose-500 to-pink-600',
    prompt: 'Pablo Picasso, Vincent van Gogh, Michelangelo'
  }
];

export default function Home() {
  const t = useTranslations('HomePage');
  const tErrors = useTranslations('Errors');
  const [personalities, setPersonalities] = useState('');
  const [focus, setFocus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pastChats, setPastChats] = useState<Room[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchPastChats = async () => {
      try {
        const response = await fetch('/api/rooms');
        if (response.ok) {
          const data = await response.json();
          setPastChats(data.rooms || []);
        }
      } catch (err) {
        console.error('Failed to fetch past chats:', err);
      } finally {
        setLoadingChats(false);
      }
    };
    fetchPastChats();
  }, []);

  const handleCreateRoom = async () => {
    if (!personalities.trim()) {
      setError(tErrors('failedToCreate'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: personalities,
          focus: focus || undefined
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || tErrors('failedToCreate'));
      }

      router.push(`/room/${data.roomId}`);
    } catch (err) {
      console.error('Room creation failed:', err);
      setError(err instanceof Error ? err.message : tErrors('failedToCreate'));
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateClick = (template: typeof templates[0]) => {
    setPersonalities(template.prompt);
    setError('');
    document.getElementById('personalities')?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-blue-500/5 dark:to-purple-500/5"></div>
        <div className="relative container mx-auto px-4 py-16 lg:py-24">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Hero Text */}
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-7xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-800 dark:from-slate-100 dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
                {t('title')}
              </h1>
              <p className="text-xl lg:text-2xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                {t('description')}
              </p>
            </div>

            {/* Main Creation Form */}
            <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl">
              <CardContent className="p-8 space-y-6">
                <div className="space-y-3">
                  <label htmlFor="personalities" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {t('whoToTalkTo')}
                  </label>
                  <Textarea
                    id="personalities"
                    placeholder={t('placeholder')}
                    value={personalities}
                    onChange={(e) => setPersonalities(e.target.value)}
                    className="min-h-[120px] text-base border-2 focus:border-blue-500 dark:focus:border-blue-400 resize-none"
                  />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t('placeholderHelp')}
                  </p>
                </div>

                <div className="space-y-3">
                  <label htmlFor="focus" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {t('conversationFocus')}
                  </label>
                  <Input
                    id="focus"
                    placeholder={t('focusPlaceholder')}
                    value={focus}
                    onChange={(e) => setFocus(e.target.value)}
                    className="text-base border-2 focus:border-blue-500 dark:focus:border-blue-400"
                  />
                </div>

                {error && (
                  <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button 
                    onClick={handleCreateRoom} 
                    disabled={loading || !personalities.trim()}
                    className="flex-1 h-12 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                        {t('creating')}
                      </>
                    ) : (
                      t('startConversation')
                    )}
                  </Button>
                  {personalities && (
                    <Button 
                      variant="outline" 
                      onClick={() => {setPersonalities(''); setFocus(''); setError('');}}
                      className="h-12 px-6"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Templates Gallery */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Conversation Templates
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Get inspired with these curated conversation starters
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card
                key={template.id}
                className="group cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
                onClick={() => handleTemplateClick(template)}
              >
                <div className={`h-2 bg-gradient-to-r ${template.gradient}`}></div>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="text-3xl">{template.icon}</div>
                    <div className="flex-1 space-y-2">
                      <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {template.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {template.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Conversations */}
      {!loadingChats && pastChats.length > 0 && (
        <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100">
                  Recent Conversations
                </h2>
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {pastChats.length} total
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastChats.slice(0, 6).map((chat) => (
                  <Card
                    key={chat.id}
                    className="group cursor-pointer hover:shadow-md transition-all duration-200 border-slate-200 dark:border-slate-700"
                    onClick={() => router.push(`/room/${chat.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1 flex-wrap">
                            {chat.participants.slice(0, 2).map((participant, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {participant.name}
                              </Badge>
                            ))}
                            {chat.participants.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{chat.participants.length - 2}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <span className={`w-2 h-2 rounded-full ${
                              chat.status === 'active' ? 'bg-green-400' : 'bg-slate-300'
                            }`}></span>
                            <span>{chat._count.messages}</span>
                          </div>
                        </div>
                        
                        {chat.focus && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                            {chat.focus}
                          </p>
                        )}
                        
                        <div className="flex justify-between items-center text-xs text-slate-500">
                          <span>{formatDate(chat.createdAt)}</span>
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 dark:text-blue-400">
                            Open →
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {pastChats.length > 6 && (
                <div className="text-center mt-6">
                  <p className="text-sm text-slate-500">
                    And {pastChats.length - 6} more conversations...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer with Requirements */}
      <div className="border-t border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Setup Requirements
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Make sure you have these prerequisites running
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                <div className="text-2xl mb-2">🚀</div>
                <code className="text-sm font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                  ollama serve
                </code>
                <p className="text-xs text-slate-500 mt-1">Run Ollama server</p>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                <div className="text-2xl mb-2">📦</div>
                <code className="text-sm font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                  qwen3:30b
                </code>
                <p className="text-xs text-slate-500 mt-1">Download model</p>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                <div className="text-2xl mb-2">💾</div>
                <span className="text-sm font-mono">32GB+ RAM</span>
                <p className="text-xs text-slate-500 mt-1">Memory requirement</p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t('privacyNote')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}