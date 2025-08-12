'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { User, Bot, Settings } from 'lucide-react';
import { Message } from '@/types';
import { LaTeXRenderer } from './latex-renderer';

interface MessageComponentProps {
  message: Message;
}

export function MessageComponent({ message }: MessageComponentProps) {
  const { authorName, authorType, content, timestamp, metadata } = message;
  
  const getMessageStyle = () => {
    switch (authorType) {
      case 'user':
        return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800';
      case 'system':
        return 'bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800';
      default:
        return 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700';
    }
  };

  const getIcon = () => {
    switch (authorType) {
      case 'user':
        return <User className="h-4 w-4" />;
      case 'system':
        return <Settings className="h-4 w-4" />;
      default:
        return <Bot className="h-4 w-4" />;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`p-4 rounded-lg border ${getMessageStyle()}`}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">
            {authorType === 'user' || authorType === 'system' 
              ? getIcon()
              : getInitials(authorName)
            }
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{authorName}</span>
            {authorType !== 'user' && (
              <Badge variant="outline" className="text-xs">
                {authorType === 'system' ? 'System' : 'AI'}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground ml-auto">
              {formatTime(timestamp)}
            </span>
          </div>
          
          {metadata?.internalThought && (
            <div className="text-xs text-muted-foreground italic mb-1">
              {metadata.internalThought}
            </div>
          )}
          
          <div className="text-sm leading-relaxed">
            <LaTeXRenderer content={content} />
          </div>
          
          {metadata && (
            <div className="flex flex-wrap gap-2 mt-2">
              {metadata.emotion && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="secondary" className="text-xs">
                        Emotion
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{metadata.emotion}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {metadata.gesture && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="secondary" className="text-xs">
                        Gesture
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{metadata.gesture}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function TypingIndicator({ characterName }: { characterName?: string }) {
  return (
    <div className="p-4 rounded-lg border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">
              {characterName || 'AI'} is thinking...
            </span>
          </div>
          
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}