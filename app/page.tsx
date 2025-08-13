// app/page.tsx
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { animated, useSpring, useSprings, useTrail, config } from '@react-spring/web';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { cn } from '@/lib/utils';
import {
  getTimeBasedAtmosphere,
  generateCSSVariables
} from '@/lib/design-system';
import { Send, ChevronDown } from 'lucide-react';

interface Room {
  id: string;
  title: string | null;
  focus: string | null;
  participants: string;
  status: string;
  createdAt: string;
  _count: { messages: number };
}

// Floating orb component for past conversations
function ConversationOrb({
                           room,
                           index,
                           totalRooms,
                           onClick
                         }: {
  room: Room;
  index: number;
  totalRooms: number;
  onClick: () => void;
}) {
  const angle = (index / totalRooms) * Math.PI * 2 - Math.PI / 2; // Start from top
  const baseRadius = typeof window !== 'undefined'
      ? Math.min(window.innerWidth * 0.35, 400) // Responsive radius
      : 350;
  const radius = baseRadius + (index % 3) * 30; // Vary depth slightly
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius * 0.6; // Elliptical orbit

  const [hovered, setHovered] = useState(false);

  const springProps = useSpring({
    transform: hovered
        ? `translate(${x}px, ${y}px) scale(1.15)`
        : `translate(${x}px, ${y}px) scale(1)`,
    opacity: hovered ? 0.8 : 0.4,
    config: config.gentle
  });

  const glowSpring = useSpring({
    boxShadow: hovered
        ? `0 0 20px rgba(59, 130, 246, 0.3)`
        : `0 0 8px rgba(59, 130, 246, 0.1)`,
    config: config.slow
  });

  // Extract first letters of participants for display
  const parsedParticipants = typeof room.participants === 'string' 
    ? JSON.parse(room.participants) 
    : room.participants;
  const initials = (Array.isArray(parsedParticipants) ? parsedParticipants : [])
      .slice(0, 2)
      .map((p: { name?: string }) => p.name?.[0] || '?')
      .join('');

  return (
      <animated.div
          style={{
            ...springProps,
            ...glowSpring,
            position: 'absolute',
            left: '50%',
            top: '50%',
            marginLeft: '-30px',
            marginTop: '-30px',
            width: '60px',
            height: '60px',
            cursor: 'pointer',
            zIndex: hovered ? 2 : 1
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={onClick}
          className="rounded-full bg-white/5 dark:bg-slate-900/20 backdrop-blur-sm border border-white/10 dark:border-slate-700/20 flex items-center justify-center"
      >
        <div className="text-center">
          <div className="text-sm font-light opacity-70">{initials}</div>
          <div className="text-[9px] opacity-40">{room._count.messages}</div>
        </div>

        {hovered && room.focus && (
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs opacity-80 pointer-events-none bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-2 py-1 rounded">
              {room.focus.slice(0, 30)}...
            </div>
        )}
      </animated.div>
  );
}

// Breathing grid effect with thousands of particles
function BreathingGrid() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particleCount = 2500; // Denser grid to cover full screen
  const mouse = useRef({ x: 0, y: 0 });
  
  // Generate elegant organic distribution
  const particleData = useMemo(() => {
    const positions = [];
    const phases = [];
    const baseScales = [];
    
    for (let i = 0; i < particleCount; i++) {
      // Organic distribution covering full viewport
      // Use aspect ratio to ensure even coverage
      const aspectRatio = typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 16/9;
      const viewportWidth = 35 * aspectRatio; // Much larger coverage area
      const viewportHeight = 35; // Much larger coverage area
      
      // Random distribution with some clustering for organic feel
      let x, y;
      if (Math.random() < 0.7) {
        // 70% distributed randomly across full area
        x = (Math.random() - 0.5) * viewportWidth;
        y = (Math.random() - 0.5) * viewportHeight;
      } else {
        // 30% loosely clustered for organic variation
        const clusterX = (Math.random() - 0.5) * viewportWidth * 0.6;
        const clusterY = (Math.random() - 0.5) * viewportHeight * 0.6;
        x = clusterX + (Math.random() - 0.5) * 3;
        y = clusterY + (Math.random() - 0.5) * 3;
      }
      
      // Depth variation for layered effect
      const z = (Math.random() - 0.5) * 8;
      
      positions.push(new THREE.Vector3(x, y, z));
      
      // Varied breathing phases for organic wave patterns
      phases.push(Math.random() * Math.PI * 2);
      
      // More varied size distribution
      const sizeType = Math.random();
      let baseScale;
      if (sizeType < 0.6) {
        baseScale = 0.2 + Math.random() * 0.4; // Most particles small
      } else if (sizeType < 0.9) {
        baseScale = 0.4 + Math.random() * 0.4; // Some medium
      } else {
        baseScale = 0.6 + Math.random() * 0.4; // Few larger focal points
      }
      
      baseScales.push(baseScale);
    }
    
    return { positions, phases, baseScales };
  }, [particleCount]);
  
  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Convert mouse position to world coordinates
      mouse.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1
      };
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Initialize positions
  useEffect(() => {
    if (!meshRef.current) return;
    
    const dummy = new THREE.Object3D();
    
    for (let i = 0; i < particleCount; i++) {
      const position = particleData.positions[i];
      dummy.position.copy(position);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [particleData, particleCount]);
  
  // Animate the breathing effect with mouse gravity
  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.getElapsedTime();
    const dummy = new THREE.Object3D();
    const { viewport } = state;
    
    // Convert mouse to world coordinates
    const mouseWorld = new THREE.Vector3(
      mouse.current.x * viewport.width / 2,
      mouse.current.y * viewport.height / 2,
      0
    );
    
    // Pre-calculate common wave values for performance
    const globalBreath1 = Math.sin(time * 0.8) * 0.3;
    const globalBreath2 = Math.sin(time * 0.5) * 0.2;
    const globalBreath3 = Math.sin(time * 1.2) * 0.1;
    const globalBreath4 = Math.sin(time * 0.3) * 0.15; // Additional slow wave
    
    // Update each particle with breathing + gravity
    for (let i = 0; i < particleCount; i++) {
      const basePosition = particleData.positions[i];
      const phase = particleData.phases[i];
      const baseScale = particleData.baseScales[i];
      
      // Calculate distance-based wave propagation
      const distanceFromCenter = Math.sqrt(basePosition.x * basePosition.x + basePosition.y * basePosition.y) * 0.1;
      
      // Multiple wave patterns for organic breathing with individual phases
      const breathe1 = globalBreath1 * Math.sin(phase);
      const breathe2 = globalBreath2 * Math.sin(phase * 2);
      const breathe3 = globalBreath3 * Math.sin(phase * 0.5);
      const breathe4 = globalBreath4 * Math.sin(phase + distanceFromCenter); // Ripple effect
      
      const finalScale = Math.max(0.1, baseScale + breathe1 + breathe2 + breathe3 + breathe4);
      
      // Calculate mouse gravity effect
      const distanceToMouse = basePosition.distanceTo(mouseWorld);
      const gravityRadius = 3; // Smaller, more subtle influence
      const gravityStrength = 0.4; // Gentler attraction
      
      const finalPosition = basePosition.clone();
      
      if (distanceToMouse < gravityRadius) {
        // Calculate attraction force (stronger when closer)
        const force = (1 - distanceToMouse / gravityRadius) * gravityStrength;
        const direction = mouseWorld.clone().sub(basePosition).normalize();
        
        // Apply gravity displacement
        finalPosition.add(direction.multiplyScalar(force));
        
        // Subtle scale increase when near mouse
        const proximityScale = 1 + force * 0.2;
        dummy.scale.set(
          finalScale * proximityScale, 
          finalScale * proximityScale, 
          finalScale * proximityScale
        );
      } else {
        // Normal scale when away from mouse
        dummy.scale.set(finalScale, finalScale, finalScale);
      }
      
      // Update dummy object
      dummy.position.copy(finalPosition);
      dummy.updateMatrix();
      
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    
    // Update the instance matrix
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  
  return (
    <instancedMesh 
      ref={meshRef} 
      args={[undefined, undefined, particleCount]}
      frustumCulled={false}
    >
      <sphereGeometry args={[0.04, 8, 6]} />
      <meshBasicMaterial 
        color="#3b82f6" 
        transparent 
        opacity={0.25}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
}

// Main ambient particles component
function AmbientParticles() {
  return (
    <div className="fixed inset-0 pointer-events-none opacity-80">
      <Canvas 
        camera={{ position: [0, 0, 25], fov: 75 }}
        gl={{ 
          antialias: false, 
          alpha: true, 
          powerPreference: 'high-performance' 
        }}
      >
        <BreathingGrid />
      </Canvas>
    </div>
  );
}

// Template suggestions (subtle, not cards)
const templateIds = ['philosophy', 'art', 'science', 'literature', 'history'];

// Mobile conversation list component
function MobileConversationList({
                                  rooms,
                                  onRoomClick
                                }: {
  rooms: Room[];
  onRoomClick: (roomId: string) => void;
}) {
  const listTrail = useTrail(rooms.length, {
    from: { opacity: 0, x: -20 },
    to: { opacity: 1, x: 0 },
    config: config.gentle
  });

  return (
      <div className="fixed bottom-20 left-0 right-0 px-4 max-h-[30vh] overflow-y-auto z-10">
        <div className="space-y-2">
          {listTrail.map((style, i) => {
            const room = rooms[i];
            const parsedParticipants = typeof room.participants === 'string' 
              ? JSON.parse(room.participants) 
              : room.participants;
            const initials = (Array.isArray(parsedParticipants) ? parsedParticipants : [])
                .slice(0, 2)
                .map((p: { name?: string }) => p.name?.[0] || '?')
                .join('');

            return (
                <animated.button
                    key={room.id}
                    style={style}
                    onClick={() => onRoomClick(room.id)}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 dark:bg-slate-900/20 backdrop-blur-sm border border-slate-200/10 dark:border-slate-700/20 hover:bg-white/10 dark:hover:bg-slate-900/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200/20 dark:bg-slate-800/30 flex items-center justify-center text-xs text-slate-700 dark:text-slate-300">
                      {initials}
                    </div>
                    <div className="text-left">
                      <div className="text-xs text-slate-700 dark:text-slate-300">
                        {room.focus?.slice(0, 30) || 'Conversation'}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-500">
                        {room._count.messages} messages
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-500">
                    {new Date(room.createdAt).toLocaleDateString()}
                  </div>
                </animated.button>
            );
          })}
        </div>
      </div>
  );
}

export default function HomePage() {
  const t = useTranslations('HomePage');
  const tErrors = useTranslations('Errors');

  const [input, setInput] = useState('');
  const [focus, setFocus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pastChats, setPastChats] = useState<Room[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showFocus, setShowFocus] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fix hydration by only showing client-side content after mount
  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Update time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 60000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Apply time-based atmosphere
  const atmosphere = useMemo(() => {
    if (!mounted) {
      // Default atmosphere for SSR
      return {
        name: 'day' as const,
        hue: 0,
        saturation: 0,
        lightness: 0.98,
        particleSpeed: 1
      };
    }
    return getTimeBasedAtmosphere();
  }, [mounted]);

  useEffect(() => {
    const cssVars = generateCSSVariables(atmosphere);
    Object.entries(cssVars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, String(value));
    });
  }, [atmosphere]);

  // Fetch past chats
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

  // Main text animation
  const titleSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
    delay: 200,
    config: config.gentle
  });

  const subtitleSpring = useSpring({
    from: { opacity: 0 },
    to: { opacity: 0.7 },
    delay: 500,
    config: config.slow
  });

  const inputSpring = useSpring({
    from: { opacity: 0, transform: 'scale(0.95)' },
    to: { opacity: 1, transform: 'scale(1)' },
    delay: 800,
    config: config.gentle
  });

  // Template trail animation
  const templateTrail = useTrail(templateIds.length, {
    from: { opacity: 0, x: -20 },
    to: { opacity: showTemplates ? 0.6 : 0, x: showTemplates ? 0 : -20 },
    config: config.gentle
  });

  // Orb animations for past chats - with staggered wave effect
  const orbSprings = useSprings(
      Math.min(pastChats.length, 12),
      pastChats.slice(0, 12).map((_, i) => ({
        from: { opacity: 0, scale: 0 },
        to: { opacity: 1, scale: 1 },
        delay: 1200 + i * 80, // Slightly faster stagger
        config: { ...config.gentle, tension: 100, friction: 20 }
      }))
  );

  // Scroll indicator animation - always create hook, conditionally render
  const scrollIndicatorSpring = useSpring({
    from: { opacity: 0 },
    to: { opacity: pastChats.length > 12 ? 0.3 : 0 },
    delay: 2000,
    config: config.slow
  });

  // Focus field animation
  const focusFieldSpring = useSpring({
    from: { opacity: 0, height: 0 },
    to: {
      opacity: showFocus ? 1 : 0,
      height: showFocus ? 'auto' : 0
    },
    config: config.gentle
  });

  const handleCreateRoom = async () => {
    const personalities = input.trim();
    if (!personalities) {
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        handleCreateRoom();
      }
    }

    // Show templates on "/"
    if (e.key === '/' && input === '') {
      e.preventDefault();
      setShowTemplates(!showTemplates);
    }

    // Show focus field on Tab
    if (e.key === 'Tab' && !showFocus) {
      e.preventDefault();
      setShowFocus(true);
    }
  };

  const handleTemplateClick = (templateId: string) => {
    setInput(t(`templates.${templateId}.prompt`));
    setShowTemplates(false);
    inputRef.current?.focus();
  };

  // Background gradient based on atmosphere
  const backgroundStyle = {
    background: mounted ? `radial-gradient(
      ellipse at center,
      hsl(${atmosphere.hue}, ${atmosphere.saturation * 100}%, ${
        atmosphere.name === 'night' ? '5%' : atmosphere.lightness * 100 + '%'
    }),
      hsl(${atmosphere.hue}, ${atmosphere.saturation * 50}%, ${
        atmosphere.name === 'night' ? '2%' : atmosphere.lightness * 95 + '%'
    })
    )` : ''
  };

  return (
      <div
          className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-950"
          style={backgroundStyle}
      >
        {/* Subtle ambient particles */}
        {mounted && <AmbientParticles />}

        {/* Main content - centered and breathing */}
        <div className="h-screen flex flex-col items-center justify-center relative z-20">

          {/* Title */}
          <animated.h1
              style={titleSpring}
              className="text-5xl sm:text-6xl md:text-8xl font-thin mb-4 tracking-wide px-4 text-slate-900 dark:text-slate-100"
          >
            <span className="opacity-90">Konver</span>
            <span className="opacity-60">sario</span>
          </animated.h1>

          {/* Subtitle */}
          <animated.p
              style={subtitleSpring}
              className="text-xs sm:text-sm md:text-base mb-8 sm:mb-12 text-slate-600 dark:text-slate-400 opacity-90 px-4"
          >
            {mounted ? (
                <>
                  {atmosphere.name === 'morning' && t('atmosphereSubtitles.morning')}
                  {atmosphere.name === 'day' && t('atmosphereSubtitles.day')}
                  {atmosphere.name === 'evening' && t('atmosphereSubtitles.evening')}
                  {atmosphere.name === 'night' && t('atmosphereSubtitles.night')}
                </>
            ) : (
                t('atmosphereSubtitles.day')
            )}
          </animated.p>

          {/* Main input area */}
          <animated.div
              style={inputSpring}
              className="relative w-full max-w-2xl px-4 sm:px-8"
          >
            {/* Main input */}
            <div className="relative">
            <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setIsTyping(e.target.value.length > 0);
                }}
                onKeyDown={handleKeyDown}
                placeholder={isTyping ? "" : t('placeholder')}
                disabled={loading}
                className={cn(
                    "w-full bg-transparent",
                    "border-b border-slate-300/30 dark:border-slate-600/30",
                    "focus:border-slate-600 dark:focus:border-slate-400",
                    "outline-none resize-none",
                    "text-center font-light",
                    "text-slate-900 dark:text-slate-100",
                    isMobile ? "text-base" : "text-lg md:text-xl",
                    "placeholder:text-slate-400/50 dark:placeholder:text-slate-500/50",
                    "transition-all duration-300",
                    "py-3 px-4",
                    "min-h-[50px] max-h-[100px]",
                    loading && "opacity-50"
                )}
                rows={1}
                autoFocus
            />

              {/* Floating send indicator */}
              {input.trim() && !loading && (
                  <button
                      onClick={handleCreateRoom}
                      className="absolute right-2 bottom-3 text-slate-600 dark:text-slate-400 opacity-0 hover:opacity-100 transition-opacity duration-200"
                  >
                    <Send className="h-4 w-4" />
                  </button>
              )}

              {/* Loading state */}
              {loading && (
                  <div className="absolute right-2 bottom-3">
                    <div className="w-4 h-4 border-2 border-slate-300/30 dark:border-slate-600/30 border-t-slate-600 dark:border-t-slate-400 rounded-full animate-spin" />
                  </div>
              )}
            </div>

            {/* Focus field (appears on demand) */}
            {showFocus && (
                <animated.div
                    className="mt-4"
                    style={focusFieldSpring}
                >
                  <input
                      type="text"
                      value={focus}
                      onChange={(e) => setFocus(e.target.value)}
                      placeholder={t('focusPlaceholder')}
                      className={cn(
                          "w-full bg-transparent",
                          "border-b border-slate-300/20 dark:border-slate-600/20",
                          "focus:border-slate-600/50 dark:focus:border-slate-400/50",
                          "outline-none",
                          "text-center text-sm font-light",
                          "text-slate-900 dark:text-slate-100",
                          "placeholder:text-slate-400/40 dark:placeholder:text-slate-500/40",
                          "transition-all duration-300",
                          "py-2 px-4"
                      )}
                  />
                </animated.div>
            )}

            {/* Error message */}
            {error && (
                <div className="absolute -bottom-8 left-0 right-0 text-center text-xs text-red-500 dark:text-red-400">
                  {error}
                </div>
            )}

            {/* Hints - hide on mobile */}
            {!input && !showTemplates && !isMobile && (
                <div className="absolute -bottom-12 left-0 right-0 text-center text-xs text-slate-500 dark:text-slate-400 opacity-60">
                  <span>{t('hints.suggestions')} </span>
                  <kbd className="px-1 py-0.5 rounded bg-slate-200/20 dark:bg-slate-800/20 border border-slate-300/20 dark:border-slate-700/20">/</kbd>
                  <span className="mx-2">·</span>
                  <span>{t('hints.topic')} </span>
                  <kbd className="px-1 py-0.5 rounded bg-slate-200/20 dark:bg-slate-800/20 border border-slate-300/20 dark:border-slate-700/20">Tab</kbd>
                </div>
            )}

            {/* Mobile hint */}
            {!input && !showTemplates && isMobile && mounted && (
                <div className="absolute -bottom-8 left-0 right-0 text-center text-[10px] text-slate-500 dark:text-slate-400 opacity-60">
                  {pastChats.length > 0 ? t('hints.recentConversations') : t('hints.mobile')}
                </div>
            )}
          </animated.div>

          {/* Template suggestions (floating) */}
          {showTemplates && (
              <div className={cn(
                  "absolute left-1/2 -translate-x-1/2 w-full px-4 z-30",
                  isMobile ? "top-[55%] max-w-sm" : "top-[60%] max-w-xl px-8"
              )}>
                <div className="space-y-2">
                  {templateTrail.map((style, i) => (
                      <animated.button
                          key={templateIds[i]}
                          style={style}
                          onClick={() => handleTemplateClick(templateIds[i])}
                          className={cn(
                              "w-full text-left px-4 py-2",
                              "bg-slate-100/10 dark:bg-slate-900/20 backdrop-blur-sm",
                              "hover:bg-slate-100/20 dark:hover:bg-slate-900/30",
                              "border border-slate-200/10 dark:border-slate-700/20",
                              "transition-colors duration-200",
                              "rounded-lg",
                              "group"
                          )}
                      >
                        <div className={cn(
                            "flex justify-between items-center",
                            isMobile && "flex-col items-start gap-1"
                        )}>
                          <span className="font-light text-sm text-slate-800 dark:text-slate-200">{t(`templates.${templateIds[i]}.prompt`)}</span>
                          <span className={cn(
                              "text-xs text-slate-600 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity",
                              isMobile && "opacity-60"
                          )}>
                      {t(`templates.${templateIds[i]}.hint`)}
                        </span>
                      </div>
                    </animated.button>
                    ))}
                </div>
              </div>
            )}

          {/* Past conversations - Desktop Orbs */}
          {!loadingChats && pastChats.length > 0 && !showTemplates && mounted && !isMobile && (
              <div className="absolute inset-0 pointer-events-none z-0">
                <div className="relative w-full h-full flex items-center justify-center">
                  {orbSprings.map((style, i) => {
                    if (i >= 12) return null; // Allow more orbs now that radius is bigger

                    return (
                        <animated.div
                            key={pastChats[i].id}
                            style={{
                              ...style,
                              position: 'absolute',
                            }}
                            className="pointer-events-auto"
                        >
                          <ConversationOrb
                              room={pastChats[i]}
                              index={i}
                              totalRooms={Math.min(pastChats.length, 12)}
                              onClick={() => router.push(`/room/${pastChats[i].id}`)}
                          />
                        </animated.div>
                    );
                  })}
                </div>
              </div>
          )}

          {/* Past conversations - Mobile List */}
          {!loadingChats && pastChats.length > 0 && !showTemplates && mounted && isMobile && (
              <MobileConversationList
                  rooms={pastChats.slice(0, 5)} // Show only 5 most recent on mobile
                  onRoomClick={(roomId) => router.push(`/room/${roomId}`)}
              />
          )}

          {/* Scroll indicator (desktop only, if there's more content) */}
          {!isMobile && pastChats.length > 12 && (
              <animated.div
                  className="absolute bottom-8 left-1/2 -translate-x-1/2"
                  style={scrollIndicatorSpring}
              >
                <ChevronDown className="h-4 w-4 text-slate-600 dark:text-slate-400 animate-bounce" />
              </animated.div>
          )}

          {/* Mobile: Show count if more conversations exist */}
          {isMobile && mounted && pastChats.length > 5 && (
              <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-[10px] opacity-40">
                +{pastChats.length - 5} more conversations
              </div>
          )}
        </div>

        {/* Very subtle footer - hide on mobile when conversations are shown */}
        {(!isMobile || pastChats.length === 0) && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 dark:text-slate-500 opacity-40 px-4 text-center">
          {t('privacyNote')}
        </div>
        )}

        {/* Time indicator */}
        {mounted && currentTime && !isMobile && (
        <div className="absolute top-4 right-4 text-xs text-slate-600 dark:text-slate-400 opacity-40">
          {currentTime}
        </div>
        )}

        {/* Mobile: Show count if more conversations exist */}
        {isMobile && mounted && pastChats.length > 5 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 dark:text-slate-400 opacity-60">
          +{pastChats.length - 5} more conversations
        </div>
        )}

        {/* Invisible keyboard shortcut handler */}
        <div
            className="fixed inset-0 pointer-events-none"
            onKeyDown={(e) => {
              // Global shortcuts
              if (e.key === 'Escape') {
                setShowTemplates(false);
                setShowFocus(false);
              }
            }}
            tabIndex={-1}
        />
      </div>
  );
}