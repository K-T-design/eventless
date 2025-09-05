"use client"

import { Canvas } from '@react-three/fiber';
import { Box, OrbitControls } from '@react-three/drei';

function SimpleCube() {
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Box position={[-1.2, 0, 0]}>
        <meshStandardMaterial color="orange" />
      </Box>
      <Box position={[1.2, 0, 0]}>
        <meshStandardMaterial color="hotpink" />
      </Box>
      <OrbitControls />
    </Canvas>
  );
}

export default SimpleCube;