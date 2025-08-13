'use client';

import { useMemo, useEffect } from 'react';
import { animated, useSpring, useSprings } from '@react-spring/web';
import { Message } from '@/types';
import {
    extractEmotion,
    emotionVisualMap,
    parseMetadata,
    getMessageOpacity
} from '@/lib/design-system';
import { useUIStore } from '@/store/ui-store';

interface EmotionVisualizerProps {
    messages: Message[];
    className?: string;
}

export function EmotionRiver({ messages, className }: EmotionVisualizerProps) {
    const setEmotionIntensity = useUIStore((state) => state.setEmotionIntensity);
    const hoveredMessage = useUIStore((state) => state.hoveredMessage);

    // Calculate overall emotional intensity
    const overallIntensity = useMemo(() => {
        if (messages.length === 0) return 0.5;

        const recentMessages = messages.slice(-10); // Last 10 messages
        const intensities = recentMessages.map(msg => {
            const metadata = parseMetadata(msg.metadata);
            const emotion = extractEmotion(metadata?.emotion || '');
            return emotionVisualMap[emotion].glowIntensity;
        });

        if (intensities.length === 0) return 0.5;
        const sum = intensities.reduce((sum: number, intensity) => sum + Number(intensity), 0);
        return sum / intensities.length;
    }, [messages]);

    // Update global emotion intensity
    useEffect(() => {
        setEmotionIntensity(overallIntensity);
    }, [overallIntensity, setEmotionIntensity]);

    // Spring animations for each emotion point
    const springs = useSprings(
        messages.length,
        messages.map((msg, i) => {
            const isHovered = hoveredMessage === msg.id;
            const opacity = getMessageOpacity(msg.timestamp);

            return {
                from: { opacity: 0, scale: 0 },
                to: {
                    opacity: opacity * (isHovered ? 1 : 0.6),
                    scale: isHovered ? 1.5 : 1,
                },
                config: { tension: 200, friction: 20 },
                delay: i * 20,
            };
        })
    );

    if (messages.length === 0) return null;

    return (
        <div className={`fixed left-0 top-0 h-full w-12 z-10 ${className}`}>
            <svg
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="none"
                viewBox="0 0 48 100"
            >
                <defs>
                    {messages.map((msg) => {
                        const metadata = parseMetadata(msg.metadata);
                        const emotion = extractEmotion(metadata?.emotion || '');
                        const visual = emotionVisualMap[emotion];

                        return (
                            <linearGradient
                                key={msg.id}
                                id={`gradient-${msg.id}`}
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="0%"
                            >
                                <stop offset="0%" stopColor={visual.particleColor} stopOpacity="0" />
                                <stop offset="50%" stopColor={visual.particleColor} stopOpacity="0.5" />
                                <stop offset="100%" stopColor={visual.particleColor} stopOpacity="0" />
                            </linearGradient>
                        );
                    })}
                </defs>

                {springs.map((spring, i) => {
                    const msg = messages[i];
                    const y = (i / messages.length) * 100;
                    const height = 100 / messages.length;

                    return (
                        <animated.rect
                            key={msg.id}
                            x="0"
                            y={`${y}%`}
                            width="48"
                            height={`${height}%`}
                            fill={`url(#gradient-${msg.id})`}
                            style={{
                                opacity: spring.opacity,
                                transform: spring.scale.to(s => `scaleX(${s})`),
                                transformOrigin: 'left center',
                            }}
                            className="cursor-pointer"
                            onMouseEnter={() => useUIStore.getState().setHoveredMessage(msg.id)}
                            onMouseLeave={() => useUIStore.getState().setHoveredMessage(null)}
                        />
                    );
                })}
            </svg>

            {/* Vertical timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-slate-300 dark:via-slate-700 to-transparent opacity-20" />
        </div>
    );
}

// Atmosphere background that responds to emotions
export function EmotionalAtmosphere({ messages }: { messages: Message[] }) {
    const emotionIntensity = useUIStore((state) => state.emotionIntensity);
    const conversationDepth = useUIStore((state) => state.conversationDepth);

    // Calculate dominant emotion
    const dominantEmotion = useMemo(() => {
        if (messages.length === 0) return 'neutral';

        const recentMessages = messages.slice(-5);
        const emotionCounts: Record<string, number> = {};

        recentMessages.forEach(msg => {
            const metadata = parseMetadata(msg.metadata);
            const emotion = extractEmotion(metadata?.emotion || '');
            emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
        });

        return Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
    }, [messages]);

    const visual = emotionVisualMap[dominantEmotion as keyof typeof emotionVisualMap];

    const atmosphereSpring = useSpring({
        from: { opacity: 0 },
        to: {
            opacity: emotionIntensity * 0.15,
            background: `radial-gradient(
        ellipse at center,
        ${visual.particleColor}10 0%,
        ${visual.particleColor}05 40%,
        transparent 70%
      )`,
        },
        config: { tension: 20, friction: 40 },
    });

    // Depth-based blur layers
    const depthLayers = useMemo(() => {
        const layers = conversationDepth === 'deep' ? 3 : conversationDepth === 'accessible' ? 2 : 1;
        return Array.from({ length: layers }, (_, i) => ({
            opacity: 0.05 * (i + 1),
            blur: 20 * (i + 1),
            scale: 1 + (i * 0.1),
        }));
    }, [conversationDepth]);

    return (
        <>
            {/* Main atmosphere gradient */}
            <animated.div
                className="fixed inset-0 pointer-events-none z-0"
                style={atmosphereSpring}
            />

            {/* Depth layers */}
            {depthLayers.map((layer, i) => (
                <div
                    key={i}
                    className="fixed inset-0 pointer-events-none z-0"
                    style={{
                        background: `radial-gradient(
              circle at 50% 50%,
              ${visual.particleColor}${Math.floor(layer.opacity * 255).toString(16).padStart(2, '0')} 0%,
              transparent 60%
            )`,
                        filter: `blur(${layer.blur}px)`,
                        transform: `scale(${layer.scale})`,
                        opacity: emotionIntensity,
                    }}
                />
            ))}
        </>
    );
}

// Personality avatars on the right edge with enhanced character info
export function PersonalityAvatars({ participants }: { participants: { id: string; name: string; identity: string; personality: string; currentState: string; lastSpoke?: number; knowledge: string; era?: string }[] }) {
    const activeSpeaker = useUIStore((state) => state.activeSpeaker);

    const springs = useSprings(
        participants.length,
        participants.map((p) => ({
            from: { opacity: 0, x: 20 },
            to: {
                opacity: activeSpeaker === p.name ? 1 : 0.4,
                x: activeSpeaker === p.name ? -4 : 0,
                scale: activeSpeaker === p.name ? 1.2 : 1,
            },
            config: { tension: 200, friction: 20 },
        }))
    );

    return (
        <div className="fixed right-4 top-1/2 -translate-y-1/2 z-20">
            <div className="flex flex-col gap-4">
                {springs.map((spring, i) => {
                    const participant = participants[i];
                    const initials = participant.name
                        .split(' ')
                        .map((w: string) => w[0])
                        .join('')
                        .slice(0, 2);

                    return (
                        <animated.div
                            key={participant.id || i}
                            style={spring}
                            className="relative group cursor-pointer"
                            onClick={() => {
                                useUIStore.getState().setActiveSpeaker(
                                    activeSpeaker === participant.name ? null : participant.name
                                );
                            }}
                        >
                            {/* Avatar dot with initials */}
                            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-[6px] font-bold text-white shadow-lg">
                                {initials}
                            </div>

                            {/* Enhanced character card on hover */}
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto">
                                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 w-72 transform translate-x-2 group-hover:translate-x-0 transition-transform">
                                    {/* Header */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                                            {initials}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                                                {participant.name}
                                            </h3>
                                            {participant.era && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {participant.era}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Identity */}
                                    {participant.identity && (
                                        <div className="mb-3">
                                            <h4 className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Identity
                                            </h4>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                                {participant.identity}
                                            </p>
                                        </div>
                                    )}

                                    {/* Personality */}
                                    {participant.personality && (
                                        <div className="mb-3">
                                            <h4 className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Personality
                                            </h4>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                                {participant.personality}
                                            </p>
                                        </div>
                                    )}

                                    {/* Current State */}
                                    {participant.currentState && (
                                        <div className="mb-3">
                                            <h4 className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Current State
                                            </h4>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
                                                {participant.currentState}
                                            </p>
                                        </div>
                                    )}

                                    {/* Knowledge/Expertise */}
                                    {participant.knowledge && (
                                        <div className="mb-3">
                                            <h4 className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Knowledge
                                            </h4>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                                {participant.knowledge}
                                            </p>
                                        </div>
                                    )}

                                    {/* Last Activity */}
                                    {participant.lastSpoke && (
                                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                            <p className="text-xs text-slate-500 dark:text-slate-500">
                                                Last spoke: {new Date(participant.lastSpoke).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    )}

                                    {/* Active indicator */}
                                    {activeSpeaker === participant.name && (
                                        <div className="absolute -top-1 -right-1">
                                            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </animated.div>
                    );
                })}
            </div>
        </div>
    );
}