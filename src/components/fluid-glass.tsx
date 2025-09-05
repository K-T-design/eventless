"use client"

import * as THREE from 'three';
import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial } from '@react-three/drei';

export default function FluidGlass({ mode = 'lens' }) {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <GlassObject mode={mode} />
    </Canvas>
  );
}

function GlassObject({ mode }: { mode: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.2;
    }
  });

  let geometry;
  switch(mode) {
    case 'bar':
      geometry = <boxGeometry args={[2, 0.5, 0.5]} />;
      break;
    case 'cube':
      geometry = <boxGeometry args={[1.5, 1.5, 1.5]} />;
      break;
    default: // lens
      geometry = <sphereGeometry args={[1, 64, 64]} />;
  }

  return (
    <mesh ref={meshRef}>
      {geometry}
      <MeshTransmissionMaterial
        resolution={1024}
        distortion={0.25}
        color="#ffffff"
        thickness={1.5}
        roughness={0.1}
        anisotropy={1}
        transmission={1}
        iridescence={1}
        iridescenceIOR={1}
        iridescenceThicknessRange={[0, 1400]}
      />
    </mesh>
  );
}
