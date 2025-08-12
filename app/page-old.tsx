'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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

export default function Home() {
  const t = useTranslations('HomePage');
  const tCommon = useTranslations('Common');
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
        headers: {
          'Content-Type': 'application/json',
        },
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
  };

  const examplePersonalities = [
    t('examples.einstein'),
    t('examples.curie'),
    t('examples.writers'),
    t('examples.detective'),
    t('examples.timeTravel'),
    t('examples.leaders')
  ];

  const handleExampleClick = (example: string) => {
    setPersonalities(example);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8 space-y-4">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {t('title')}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            {t('description')}
          </p>
        </div>

        {/* Dashboard Layout */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Recent Conversations */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Recent Conversations</CardTitle>
                  {!loadingChats && pastChats.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {pastChats.length}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loadingChats ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                ) : pastChats.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p className="text-sm">No conversations yet</p>
                    <p className="text-xs mt-1">Start your first conversation →</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {pastChats.map((chat) => (
                      <div
                        key={chat.id}
                        className="p-4 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors group"
                        onClick={() => router.push(`/room/${chat.id}`)}
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                              {chat.participants.slice(0, 3).map((participant, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {participant.name}
                                </Badge>
                              ))}
                              {chat.participants.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{chat.participants.length - 3}
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
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                              Open →
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            {!loadingChats && pastChats.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-slate-600">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total conversations</span>
                      <span className="font-medium">{pastChats.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active chats</span>
                      <span className="font-medium">
                        {pastChats.filter(c => c.status === 'active').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total messages</span>
                      <span className="font-medium">
                        {pastChats.reduce((sum, chat) => sum + chat._count.messages, 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Create New Conversation */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Start</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors" onClick={() => setPersonalities(t('examples.einstein'))}>
                    <div className="text-center space-y-1">
                      <div className="text-xl">🧠</div>
                      <div className="text-sm font-medium">Historical Figures</div>
                      <div className="text-xs text-slate-500">Einstein, Newton, etc.</div>
                    </div>
                  </div>
                  <div className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors" onClick={() => setPersonalities(t('examples.writers'))}>
                    <div className="text-center space-y-1">
                      <div className="text-xl">✍️</div>
                      <div className="text-sm font-medium">Famous Writers</div>
                      <div className="text-xs text-slate-500">Shakespeare, Austen, etc.</div>
                    </div>
                  </div>
                  <div className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors" onClick={() => setPersonalities(t('examples.leaders'))}>
                    <div className="text-center space-y-1">
                      <div className="text-xl">👑</div>
                      <div className="text-sm font-medium">World Leaders</div>
                      <div className="text-xs text-slate-500">Historical & Modern</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Form */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t('createRoom')}</CardTitle>
                  {personalities && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {setPersonalities(''); setFocus(''); setError('');}}
                      className="text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="personalities" className="text-sm font-medium">
                  {t('whoToTalkTo')}
                </label>
                <Textarea
                  id="personalities"
                  placeholder={t('placeholder')}
                  value={personalities}
                  onChange={(e) => setPersonalities(e.target.value)}
                  className="min-h-[100px]"
                />
                <p className="text-xs text-slate-500">
                  {t('placeholderHelp')}
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="focus" className="text-sm font-medium">
                  {t('conversationFocus')}
                </label>
                <Input
                  id="focus"
                  placeholder={t('focusPlaceholder')}
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                />
              </div>

              {error && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              <Button 
                onClick={handleCreateRoom} 
                disabled={loading || !personalities.trim()}
                className="w-full"
              >
                {loading ? t('creating') : t('startConversation')}
              </Button>
            </CardContent>
          </Card>

            {/* Examples & Help */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{t('quickExamples')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {examplePersonalities.slice(0, 4).map((example, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors px-2 py-1 text-xs"
                        onClick={() => handleExampleClick(example)}
                      >
                        {example.split(' ')[0]}...
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span>⚙️</span>
                    Setup Required
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">ollama serve</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">qwen3:30b model</code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="max-w-6xl mx-auto mt-8">
          <p className="text-sm text-center text-slate-500 dark:text-slate-500">
            {t('privacyNote')}
          </p>
        </div>
      </div>
    </div>
  );
}