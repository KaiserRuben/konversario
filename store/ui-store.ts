import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIPreferences {
    // Visual preferences
    accentColor: string;
    particlesEnabled: boolean;
    messageParticles: boolean;
    cursorInteraction: boolean;
    particleIntensity: number;
    reducedMotion: boolean;
    showInternalThoughts: 'always' | 'hover' | 'never';
    messageLayout: 'floating' | 'aligned' | 'timeline';

    // Atmosphere
    atmosphereMode: 'auto' | 'morning' | 'day' | 'evening' | 'night';

    // Performance
    maxParticles: number;
    enableBlur: boolean;
    enable3D: boolean;
}

interface UIState {
    // Preferences
    preferences: UIPreferences;

    // Runtime state
    isTyping: boolean;
    activeSpeaker: string | null;
    hoveredMessage: string | null;
    emotionIntensity: number;
    conversationDepth: 'surface' | 'accessible' | 'deep';

    // Actions
    setPreference: <K extends keyof UIPreferences>(key: K, value: UIPreferences[K]) => void;
    setActiveSpeaker: (speaker: string | null) => void;
    setHoveredMessage: (messageId: string | null) => void;
    setEmotionIntensity: (intensity: number) => void;
    setConversationDepth: (depth: 'surface' | 'accessible' | 'deep') => void;
    setTyping: (isTyping: boolean) => void;
    resetPreferences: () => void;
}

const defaultPreferences: UIPreferences = {
    accentColor: '#3b82f6',
    particlesEnabled: true,
    messageParticles: false,
    cursorInteraction: true,
    particleIntensity: 0.3,
    reducedMotion: false,
    showInternalThoughts: 'hover',
    messageLayout: 'floating',
    atmosphereMode: 'auto',
    maxParticles: 400,
    enableBlur: true,
    enable3D: true,
};

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            // Initial preferences
            preferences: defaultPreferences,

            // Initial runtime state
            isTyping: false,
            activeSpeaker: null,
            hoveredMessage: null,
            emotionIntensity: 0.5,
            conversationDepth: 'accessible',

            // Actions
            setPreference: (key, value) =>
                set((state) => ({
                    preferences: {
                        ...state.preferences,
                        [key]: value,
                    },
                })),

            setActiveSpeaker: (speaker) =>
                set({ activeSpeaker: speaker }),

            setHoveredMessage: (messageId) =>
                set({ hoveredMessage: messageId }),

            setEmotionIntensity: (intensity) =>
                set({ emotionIntensity: Math.max(0, Math.min(1, intensity)) }),

            setConversationDepth: (depth) =>
                set({ conversationDepth: depth }),

            setTyping: (isTyping) =>
                set({ isTyping }),

            resetPreferences: () =>
                set({ preferences: defaultPreferences }),
        }),
        {
            name: 'konversario-ui-preferences',
            partialize: (state) => ({ preferences: state.preferences }),
        }
    )
);

// Selector hooks for common combinations
export const useParticleSettings = () => {
    const {
        particlesEnabled,
        messageParticles,
        cursorInteraction,
        particleIntensity,
        maxParticles,
        enable3D
    } = useUIStore((state) => state.preferences);
    const emotionIntensity = useUIStore((state) => state.emotionIntensity);

    return {
        enabled: particlesEnabled && enable3D,
        messageParticles,
        cursorInteraction: cursorInteraction ?? true,
        intensity: particleIntensity ?? 0.3,
        maxCount: maxParticles,
    };
};

export const useMessageAppearance = () => {
    const { showInternalThoughts, messageLayout, enableBlur } = useUIStore(
        (state) => state.preferences
    );
    const hoveredMessage = useUIStore((state) => state.hoveredMessage);

    return {
        showInternalThoughts,
        messageLayout,
        enableBlur,
        hoveredMessage,
    };
};

export const useAtmosphere = () => {
    const atmosphereMode = useUIStore((state) => state.preferences.atmosphereMode);
    const conversationDepth = useUIStore((state) => state.conversationDepth);

    const getAtmosphere = () => {
        if (atmosphereMode === 'auto') {
            const hour = new Date().getHours();
            if (hour >= 5 && hour < 9) return 'morning';
            if (hour >= 9 && hour < 17) return 'day';
            if (hour >= 17 && hour < 21) return 'evening';
            return 'night';
        }
        return atmosphereMode;
    };

    return {
        atmosphere: getAtmosphere(),
        depth: conversationDepth,
    };
};