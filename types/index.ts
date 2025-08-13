
export interface Room {
  id: string;
  participants: Participant[];
  topic?: string;
  messages: Message[];
  state: RoomState;
  atmosphere: string;
}

export interface Participant {
  id: string;
  name: string;
  identity: string;
  personality: string;
  currentState: string;
  lastSpoke?: number;
  knowledge: string;
  era?: string;
}

export interface Message {
  id: string;
  authorName: string;
  authorType: 'user' | 'participant' | 'system';
  content: string;
  timestamp: number;
  metadata?: {
    emotion?: string;
    gesture?: string;
    internalThought?: string;
    addressedTo?: string[];
    subtext?: string;
    manner?: string;
    delivery?: string;
    effect?: string;
    internalState?: string;
    thinking?: boolean;
  };
}

export interface RoomState {
  status: 'setup' | 'active' | 'waiting_user' | 'processing';
  contextSummary: string;
  turnCount: number;
  lastActivity: number;
  currentDynamic: string;
}

// Your existing orchestration types
export interface SetupResponse {
  success: boolean;
  participants: Array<{
    name: string;
    identity: string;
    personality: string;
    greeting: string;
    currentState: string;
  }>;
  setting: string;
  atmosphere: string;
  suggestedOpening?: string;
}

export interface OrchestrationResponse {
  interpretation: string;
  plan: Array<{
    who: string;
    why: string;
    when: 'immediate' | 'after_previous' | 'interrupting';
    likelihood: string;
  }>;
  expectedDynamic: string;
  continueWithoutUser: boolean;
  tensionLevel: string;
}

export interface CharacterResponse {
  speaker: string;
  speech: string;
  delivery: string;
  internalState: string;
  subtext?: string;
  triggersReaction?: string;
  changesAtmosphere?: string;
}

export interface ExchangeResponse {
  exchanges: Array<{
    speaker: string;
    text: string;
    manner: string;
    effect: string;
  }>;
  roomShift: string;
  naturalPause: boolean;
  suggestedUserPrompt?: string;
}

export interface CompressionResponse {
  essence: string;
  characterEvolution: {
    [name: string]: string;
  };
  unresolved: string[];
  keyMoments: string[];
}

export interface ConversationStageAssessment {
  userState: 'casual' | 'exploring' | 'engaged' | 'philosophical' | 'confused';
  momentum: 'building' | 'sustained' | 'shifting' | 'waning';
  suggestedDepth: 'surface' | 'moderate' | 'full';
}

export interface ResponseModulation {
  targetLength: 'brief' | 'moderate' | 'full';
  depth: 'surface' | 'accessible' | 'philosophical';
  maxCharacters: number;
  priority: 'clarity' | 'authenticity' | 'engagement';
}

// New visual system types for the ethereal design
export type ParticleBehavior = 'orbit' | 'float' | 'burst' | 'spiral' | 'drift' | 'static';

export interface EmotionVisual {
  particleColor: string;
  glowIntensity: number;
  textWeight: number;
  animationSpeed: number;
  particleBehavior: ParticleBehavior;
}

export interface ParticleConfig {
  count: number;
  color: string;
  behavior: ParticleBehavior;
  speed: number;
  opacity: number;
  lifetime: number;
}

export interface AtmosphereTheme {
  name: 'morning' | 'day' | 'evening' | 'night';
  hue: number;
  saturation: number;
  lightness: number;
  particleSpeed: number;
}

export interface VisualState {
  // Emotion-based
  particleColor: string;
  particleBehavior: ParticleBehavior;
  glowIntensity: number;

  // Text presentation
  textWeight: number;
  textSpeed: number;
  textEmphasis: number;
  textRhythm: 'steady' | 'varied' | 'staccato' | 'flowing';
  fontSize: number;

  // Atmosphere
  atmosphereIntensity: number;
  atmosphereBlur: number;
  particleDensity: number;

  // Effects
  tensionLevel: number;
  energyLevel: number;
  atmosphereShift?: string;

  // Metadata flags
  hasInternalThought: boolean;
  hasSubtext: boolean;
  hasGesture: boolean;

  // Overall importance
  importance: number;
}