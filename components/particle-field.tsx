'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useSpring, animated } from '@react-spring/three';
import { getParticleConfig } from '@/lib/design-system';
import { useParticleSettings } from '@/store/ui-store';

interface ParticleFieldProps {
    metadata?: any;
    conversationStage?: any;
    intensity?: number;
}

function BreathingParticles({
    count = 200, // Many more tiny particles
    color = '#3b82f6',
    behavior = 'breathe',
    speed = 0.3, // Much slower default
    opacity = 0.15, // More visible individual particles
}: {
    count: number;
    color: string;
    behavior: string;
    speed: number;
    opacity: number;
}) {
    const ref = useRef<THREE.Points>(null);
    const mouse = useRef({ x: 0, y: 0 });
    const { viewport } = useThree();
    
    // Track mouse position
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouse.current = {
                x: (e.clientX / window.innerWidth) * 2 - 1,
                y: -(e.clientY / window.innerHeight) * 2 + 1
            };
        };
        
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Initialize particle positions and data
    const particleData = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const basePositions = new Float32Array(count * 3); // Store original positions
        const breathPhases = new Float32Array(count); // Individual breath phases
        const sizes = new Float32Array(count); // Individual particle sizes
        
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            
            // Distribute particles in a larger, more spread out cloud
            const radius = Math.random() * 6 + 2; // Larger distribution area
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            
            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta) * 0.7; // Less flattened
            const z = radius * Math.cos(phi) * 0.5; // More depth variation
            
            positions[i3] = basePositions[i3] = x;
            positions[i3 + 1] = basePositions[i3 + 1] = y;
            positions[i3 + 2] = basePositions[i3 + 2] = z;
            
            // Random breath phase so they don't all pulse together
            breathPhases[i] = Math.random() * Math.PI * 2;
            
            // Small but visible sizes for depth
            sizes[i] = 0.02 + Math.random() * 0.03; // 0.02-0.05 size range
        }
        
        return { positions, basePositions, breathPhases, sizes };
    }, [count]);

    useFrame((state) => {
        if (!ref.current) return;
        
        const time = state.clock.getElapsedTime();
        const positions = ref.current.geometry.attributes.position;
        
        // Convert mouse to world coordinates
        const mouseWorld = new THREE.Vector3(
            mouse.current.x * viewport.width / 2,
            mouse.current.y * viewport.height / 2,
            0
        );
        
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            
            // Get base position
            const baseX = particleData.basePositions[i3];
            const baseY = particleData.basePositions[i3 + 1];
            const baseZ = particleData.basePositions[i3 + 2];
            
            // Current position
            let x = baseX;
            let y = baseY;
            let z = baseZ;
            
            // Breathing effect - gentle expansion and contraction
            const breathPhase = particleData.breathPhases[i];
            const breathAmount = Math.sin(time * speed + breathPhase) * 0.1 + 1;
            
            x *= breathAmount;
            y *= breathAmount;
            z *= breathAmount;
            
            // Mouse interaction - subtle attraction/repulsion
            const particlePos = new THREE.Vector3(x, y, z);
            const distanceToMouse = particlePos.distanceTo(mouseWorld);
            
            if (distanceToMouse < 2) { // Within influence radius
                const force = 1 - (distanceToMouse / 2); // Stronger when closer
                const direction = particlePos.sub(mouseWorld).normalize();
                
                // Gentle push away from cursor
                x += direction.x * force * 0.3;
                y += direction.y * force * 0.3;
                z += direction.z * force * 0.1; // Less Z movement
            }
            
            // Apply behavior-specific modifications
            switch (behavior) {
                case 'breathe':
                    // Pure breathing, already applied above
                    break;
                    
                case 'pulse':
                    // Occasional gentle pulses
                    const pulseTime = time * 0.2;
                    if (Math.sin(pulseTime) > 0.9) {
                        const pulse = Math.sin(pulseTime * 10) * 0.05;
                        x += pulse;
                        y += pulse;
                    }
                    break;
                    
                case 'sway':
                    // Very gentle swaying motion
                    x += Math.sin(time * speed * 0.5 + breathPhase) * 0.02;
                    y += Math.cos(time * speed * 0.3 + breathPhase * 2) * 0.01;
                    break;
                    
                case 'hover':
                    // Minimal floating motion
                    y += Math.sin(time * speed + i) * 0.01;
                    break;
                    
                case 'still':
                    // Only mouse interaction, no other movement
                    x = baseX;
                    y = baseY;
                    z = baseZ;
                    break;
            }
            
            // Gentle drift back to base position (keeps particles from escaping)
            const returnForce = 0.02;
            x += (baseX - positions.array[i3]) * returnForce;
            y += (baseY - positions.array[i3 + 1]) * returnForce;
            z += (baseZ - positions.array[i3 + 2]) * returnForce;
            
            // Update positions
            positions.array[i3] = x;
            positions.array[i3 + 1] = y;
            positions.array[i3 + 2] = z;
        }
        
        positions.needsUpdate = true;
    });

    // Smooth opacity changes based on conversation state
    const springProps = useSpring({
        opacity: opacity,
        size: 0.04, // Small but visible base size
        config: { tension: 50, friction: 30 } // Slower transitions
    });

    return (
        <Points ref={ref} positions={particleData.positions} stride={3} frustumCulled={false}>
            <animated.pointsMaterial
                transparent
                color={color}
                size={springProps.size}
                sizeAttenuation={true}
                depthWrite={false}
                opacity={springProps.opacity}
                blending={THREE.AdditiveBlending}
                vertexColors={false}
            />
        </Points>
    );
}

// Lightweight cursor trail (optional, very subtle)
function CursorGlow() {
    const mouse = useRef({ x: 0, y: 0 });
    const trailRef = useRef<THREE.Mesh>(null);
    const { viewport } = useThree();
    
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouse.current = {
                x: (e.clientX / window.innerWidth) * 2 - 1,
                y: -(e.clientY / window.innerHeight) * 2 + 1
            };
        };
        
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);
    
    useFrame(() => {
        if (!trailRef.current) return;
        
        // Smooth follow cursor
        trailRef.current.position.x += (mouse.current.x * viewport.width / 2 - trailRef.current.position.x) * 0.1;
        trailRef.current.position.y += (mouse.current.y * viewport.height / 2 - trailRef.current.position.y) * 0.1;
    });
    
    return (
        <mesh ref={trailRef} position={[0, 0, -1]}>
            <circleGeometry args={[0.5, 32]} />
            <meshBasicMaterial
                color="#3b82f6"
                transparent
                opacity={0.005}
                blending={THREE.AdditiveBlending}
            />
        </mesh>
    );
}

export function ParticleField({ metadata, conversationStage, intensity = 0.5 }: ParticleFieldProps) {
    const particleSettings = useParticleSettings();
    const [localIntensity, setLocalIntensity] = useState(intensity);

    if (!particleSettings.enabled) return null;

    // Adjust behavior based on conversation stage
    const getBehavior = () => {
        if (!conversationStage) return 'breathe';
        
        const momentum = conversationStage.momentum;
        const depth = conversationStage.suggestedDepth;
        
        if (momentum === 'building') return 'pulse';
        if (momentum === 'waning') return 'still';
        if (depth === 'deep') return 'sway';
        if (depth === 'surface') return 'hover';
        
        return 'breathe';
    };

    const config = getParticleConfig(metadata, conversationStage);
    
    // Higher particle counts for immersive effect
    const baseCount = 200; // Always start with 200 particles
    const intensityBonus = Math.floor(localIntensity * 100); // Up to 100 more
    const particleCount = Math.min(
        baseCount + intensityBonus, // 200-300 particles
        particleSettings.maxCount
    );

    // Fade in/out based on conversation activity
    useEffect(() => {
        if (metadata?.emotion) {
            setLocalIntensity(0.8);
            const timer = setTimeout(() => setLocalIntensity(0.3), 3000);
            return () => clearTimeout(timer);
        }
    }, [metadata]);

    if (particleCount === 0) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-0">
            <Canvas
                camera={{ position: [0, 0, 5], fov: 60 }}
                gl={{
                    antialias: false,
                    alpha: true,
                    powerPreference: 'low-power'
                }}
            >
                <BreathingParticles
                    count={particleCount}
                    color={config.color}
                    behavior={getBehavior()}
                    speed={config.speed * 0.3} // Much slower
                    opacity={config.opacity * localIntensity * 0.4} // More visible individual particles
                />
                {/* Optional: Add subtle cursor glow */}
                {/* {particleSettings.cursorInteraction && <CursorGlow />} */}
            </Canvas>
        </div>
    );
}

// Per-message particles - even more minimal
export function MessageParticles({ message }: { message: any }) {
    const metadata = useMemo(() => {
        try {
            return typeof message.metadata === 'string'
                ? JSON.parse(message.metadata)
                : message.metadata || {};
        } catch {
            return {};
        }
    }, [message.metadata]);

    const particleSettings = useParticleSettings();

    // Only show for very strong emotions
    const emotionStrength = metadata.emotion?.length > 30 ? 1 : 0;
    if (!particleSettings.enabled || !emotionStrength) return null;

    const config = getParticleConfig(metadata);

    return (
        <div className="absolute inset-0 pointer-events-none">
            <Canvas
                camera={{ position: [0, 0, 3], fov: 50 }}
                gl={{
                    antialias: false,
                    alpha: true,
                    powerPreference: 'low-power'
                }}
                style={{
                    width: '100%',
                    height: '100%',
                }}
            >
                <BreathingParticles
                    count={30} // More particles for messages too
                    color={config.color}
                    behavior="breathe"
                    speed={0.2} // Very slow
                    opacity={0.08} // More visible individual particles
                />
            </Canvas>
        </div>
    );
}