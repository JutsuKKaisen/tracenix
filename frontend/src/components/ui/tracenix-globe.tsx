"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function TracenixGlobe({ 
  radius = 2, 
  particlesCount = 100, 
  color = "#3b82f6", 
  speed = 0.5 
}) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Generate random points on a sphere
  const [positions, lines] = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle
    
    // Fibonacci sphere distribution for even spread
    for (let i = 0; i < particlesCount; i++) {
        const y = 1 - (i / (particlesCount - 1)) * 2; // y goes from 1 to -1
        const radiusAtY = Math.sqrt(1 - y * y); // radius at y
        const theta = phi * i; // golden angle increment
        
        const x = Math.cos(theta) * radiusAtY;
        const z = Math.sin(theta) * radiusAtY;
        
        points.push(new THREE.Vector3(x * radius, y * radius, z * radius));
    }
    
    // Create lines between close points
    const lineIndices: number[] = [];
    const connectionRadius = radius * 0.6; // max distance for connection
    
    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            if (points[i].distanceTo(points[j]) < connectionRadius) {
                lineIndices.push(i, j);
            }
        }
    }
    
    const posArray = new Float32Array(points.length * 3);
    points.forEach((p, i) => {
        posArray[i * 3] = p.x;
        posArray[i * 3 + 1] = p.y;
        posArray[i * 3 + 2] = p.z;
    });
    
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    if (lineIndices.length > 0) {
      geom.setIndex(lineIndices);
    }
    
    return [posArray, geom];
  }, [radius, particlesCount]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1 * speed;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Node Points */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial 
          size={0.06} 
          color={color} 
          transparent 
          opacity={0.8} 
          sizeAttenuation 
        />
      </points>
      
      {/* Connection Lines */}
      {lines.getIndex() && (
        <lineSegments geometry={lines}>
          <lineBasicMaterial 
            color={color} 
            transparent 
            opacity={0.2} 
          />
        </lineSegments>
      )}
      
      {/* Core faint glow */}
      <mesh>
        <sphereGeometry args={[radius * 0.95, 32, 32]} />
        <meshBasicMaterial color="#0f172a" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}
