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
  };
}

export interface RoomState {
  status: 'setup' | 'active' | 'waiting_user' | 'processing';
  contextSummary: string;
  turnCount: number;
  lastActivity: number;
  currentDynamic: string;
}

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