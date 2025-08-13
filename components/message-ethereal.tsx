// components/message-ethereal.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { animated, useSpring, config } from '@react-spring/web';
import { Message } from '@/types';
import { LaTeXRenderer } from './latex-renderer';
import {
    extractEmotion,
    getPersonalityStyles,
    getMessageOpacity,
    parseMetadata,
    getMessageImportance,
    emotionVisualMap
} from '@/lib/design-system';
import { useUIStore, useMessageAppearance } from '@/store/ui-store';
import { cn } from '@/lib/utils';

interface MessageEtherealProps {
    message: Message;
    index: number;
    totalMessages: number;
}

export function MessageEthereal({ message, index, totalMessages }: MessageEtherealProps) {
    const { authorName, authorType, content, timestamp } = message;
    const metadata = parseMetadata(message.metadata);
    const [isVisible, setIsVisible] = useState(false);
    const messageRef = useRef<HTMLDivElement>(null);

    const { showInternalThoughts, messageLayout, hoveredMessage } = useMessageAppearance();
    const setHoveredMessage = useUIStore((state) => state.setHoveredMessage);
    const setActiveSpeaker = useUIStore((state) => state.setActiveSpeaker);

    const isHovered = hoveredMessage === message.id;
    const importance = getMessageImportance(message);
    const emotion = extractEmotion(metadata?.emotion || '');
    const emotionVisual = emotionVisualMap[emotion];

    // Personality-based styles
    const personalityStyles = authorType === 'participant'
        ? getPersonalityStyles(authorName)
        : {};

    // Message age opacity
    const ageOpacity = getMessageOpacity(timestamp);

    // Animation based on layout mode
    const getInitialPosition = () => {
        switch (messageLayout) {
            case 'floating':
                return {
                    x: authorType === 'user' ? 100 : -100,
                    y: Math.random() * 20 - 10,
                };
            case 'timeline':
                return { x: 0, y: 50 };
            default:
                return { x: 0, y: 20 };
        }
    };

    const springProps = useSpring({
        from: {
            opacity: 0,
            transform: `translate3d(${getInitialPosition().x}px, ${getInitialPosition().y}px, 0) scale(0.95)`,
            filter: 'blur(4px)',
        },
        to: {
            opacity: isVisible ? ageOpacity : 0,
            transform: isVisible
                ? `translate3d(0px, 0px, 0) scale(${isHovered ? 1.02 : 1})`
                : `translate3d(${getInitialPosition().x}px, ${getInitialPosition().y}px, 0) scale(0.95)`,
            filter: isVisible ? 'blur(0px)' : 'blur(4px)',
        },
        config: {
            ...config.gentle,
            tension: 120,
            friction: 20,
        },
        delay: index * 100,
    });

    // Glow effect for emotional intensity
    const glowSpring = useSpring({
        boxShadow: isHovered
            ? `0 0 ${emotionVisual.glowIntensity * 60}px ${emotionVisual.particleColor}40`
            : `0 0 ${emotionVisual.glowIntensity * 30}px ${emotionVisual.particleColor}20`,
        config: config.molasses,
    });

    // Trigger visibility on mount
    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 50);
        return () => clearTimeout(timer);
    }, []);

    // Update active speaker
    useEffect(() => {
        if (index === totalMessages - 1 && authorType === 'participant') {
            setActiveSpeaker(authorName);
            const timer = setTimeout(() => setActiveSpeaker(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [index, totalMessages, authorName, authorType, setActiveSpeaker]);

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Calculate position based on layout
    const getPositionClasses = () => {
        switch (messageLayout) {
            case 'floating':
                if (authorType === 'user') {
                    return 'ml-auto mr-8 text-right';
                }
                // Use personality hash for consistent positioning
                const offset = (authorName.charCodeAt(0) % 3) * 4;
                return `ml-${offset}`;
            case 'timeline':
                return 'mx-auto max-w-2xl';
            default:
                return authorType === 'user' ? 'ml-auto mr-0' : 'mr-auto ml-0';
        }
    };

    return (
        <animated.div
            ref={messageRef}
            style={{
                ...springProps,
                ...glowSpring,
            }}
            className={cn(
                'relative mb-8 w-fit max-w-[70%] p-2 rounded-lg',
                getPositionClasses(),
                messageLayout === 'floating' && 'transition-all duration-500'
            )}
            onMouseEnter={() => setHoveredMessage(message.id)}
            onMouseLeave={() => setHoveredMessage(null)}
        >
            {/* Internal thought (appears above message) */}
            {metadata?.internalThought && showInternalThoughts !== 'never' && (
                <div
                    className={cn(
                        'absolute -top-6 left-0 right-0 text-xs italic',
                        'text-slate-500 dark:text-slate-400',
                        'transition-all duration-300',
                        showInternalThoughts === 'hover' && !isHovered && 'opacity-0',
                        showInternalThoughts === 'hover' && isHovered && 'opacity-80',
                        showInternalThoughts === 'always' && 'opacity-80'
                    )}
                    style={{
                        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                    }}
                >
                    {metadata.internalThought}
                </div>
            )}

            {/* Main message */}
            <div
                className={cn(
                    'relative',
                    authorType === 'user' && 'text-blue-900 dark:text-blue-100',
                    authorType === 'system' && 'text-gray-600 dark:text-gray-400 text-sm',
                    authorType === 'participant' && 'text-slate-800 dark:text-slate-200'
                )}
                style={{
                    ...personalityStyles,
                    fontSize: `${0.875 + importance * 0.25}rem`,
                    fontWeight: emotionVisual.textWeight,
                    lineHeight: 1.6,
                }}
            >
                {/* Author name and time */}
                <div
                    className={cn(
                        'mb-1 text-xs opacity-50',
                        authorType === 'user' && 'text-right'
                    )}
                >
                    <span className="font-medium">{authorName}</span>
                    <span className="mx-2">·</span>
                    <span>{formatTime(timestamp)}</span>
                </div>

                {/* Message content */}
                <div className="leading-relaxed">
                    <LaTeXRenderer content={content} />
                </div>

                {/* Subtext (appears below, very subtle) */}
                {metadata?.subtext && (
                    <div
                        className="mt-2 text-xs opacity-30 italic"
                    >
                        {metadata.subtext}
                    </div>
                )}
            </div>

            {/* Emotion/gesture indicator (minimal, appears on hover) */}
            {(metadata?.emotion || metadata?.gesture) && isHovered && (
                <div className="absolute -bottom-5 left-0 flex gap-2">
                    {metadata.emotion && (
                        <span
                            className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{
                                backgroundColor: `${emotionVisual.particleColor}20`,
                                color: emotionVisual.particleColor,
                            }}
                        >
              {emotion}
            </span>
                    )}
                </div>
            )}
        </animated.div>
    );
}

// Typing indicator with personality
export function EtherealTypingIndicator({ characterName }: { characterName?: string }) {
    const personalityStyles = characterName ? getPersonalityStyles(characterName) : {};

    const dotSpring = useSpring({
        from: { opacity: 0.3 },
        to: { opacity: 1 },
        loop: { reverse: true },
        config: { duration: 600 },
    });

    return (
        <div className="relative mb-8 w-fit">
            <div
                className="text-slate-600 dark:text-slate-400"
                style={personalityStyles}
            >
        <span className="text-xs opacity-50 font-medium">
          {characterName || 'AI'} is thinking
        </span>
                <div className="flex gap-1 mt-2">
                    {[0, 1, 2].map((i) => (
                        <animated.div
                            key={i}
                            style={{
                                ...dotSpring,
                                animationDelay: `${i * 200}ms`,
                            }}
                            className="w-2 h-2 rounded-full bg-current"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}