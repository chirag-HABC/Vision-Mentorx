import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef, useEffect, useState } from "react";
import { TextureLoader } from "three";

function RobotHead({ isSpeaking, faceTextureUrl }) {
  const headRef = useRef();
  const [faceTexture, setFaceTexture] = useState(null);
  const [textureError, setTextureError] = useState(false);

  useEffect(() => {
    if (!faceTextureUrl) {
      setFaceTexture(null);
      setTextureError(true);
      return;
    }

    setTextureError(false);
    const loader = new TextureLoader();
    loader.load(
      faceTextureUrl,
      (texture) => {
        setFaceTexture(texture);
        setTextureError(false);
      },
      undefined,
      () => {
        console.warn("Face texture not found, using fallback color");
        setFaceTexture(null);
        setTextureError(true);
      }
    );
  }, [faceTextureUrl]);

  useFrame((state) => {
    if (isSpeaking) {
      // Subtle head bobbing when speaking
      headRef.current.position.y = 2.5 + Math.sin(state.clock.elapsedTime * 8) * 0.02;
    } else {
      headRef.current.position.y = 2.5;
    }
  });

  return (
    <group ref={headRef}>
      {/* Head */}
      <mesh position={[0, 0, 0]}> 
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color="#4a90e2" />
      </mesh>

      {/* Realistic Face Overlay (front-quarter) */}
      <mesh position={[0, 0, 0.45]}>
        <planeGeometry args={[0.7, 0.7]} />
        <meshStandardMaterial
          map={faceTexture}
          color={textureError || !faceTexture ? "#d9d9d9" : "white"}
          toneMapped={false}
        />
      </mesh>

      {/* Mouth/Speaker - animated when speaking */}
      <mesh position={[0, -0.3, 0.35]}>
        <boxGeometry args={[isSpeaking ? 0.4 : 0.3, isSpeaking ? 0.15 : 0.1, 0.05]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
    </group>
  );
}

function Avatar3D({ isSpeaking = false, faceTextureUrl = "/face.jpg" }) {
  return (
    <Canvas style={{ height: "400px" }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 2, 2]} intensity={1} />

      {/* Humanoid Robot Structure */}
      <group position={[0, 0, 0]}>
        {/* Head with animation */}
        <RobotHead isSpeaking={isSpeaking} />

        {/* Neck */}
        <mesh position={[0, 2.0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.3]} />
          <meshStandardMaterial color="#666666" />
        </mesh>

        {/* Torso/Body */}
        <mesh position={[0, 1.0, 0]}>
          <boxGeometry args={[1.2, 1.8, 0.6]} />
          <meshStandardMaterial color="#4a90e2" />
        </mesh>

        {/* Chest Panel */}
        <mesh position={[0, 1.2, 0.31]}>
          <boxGeometry args={[0.8, 0.8, 0.05]} />
          <meshStandardMaterial color="#333333" />
        </mesh>

        {/* Left Arm */}
        <mesh position={[-0.8, 1.2, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 1.0]} />
          <meshStandardMaterial color="#666666" />
        </mesh>
        <mesh position={[-0.8, 0.4, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.8]} />
          <meshStandardMaterial color="#4a90e2" />
        </mesh>

        {/* Right Arm */}
        <mesh position={[0.8, 1.2, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 1.0]} />
          <meshStandardMaterial color="#666666" />
        </mesh>
        <mesh position={[0.8, 0.4, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.8]} />
          <meshStandardMaterial color="#4a90e2" />
        </mesh>

        {/* Left Leg */}
        <mesh position={[-0.3, -0.5, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 1.0]} />
          <meshStandardMaterial color="#666666" />
        </mesh>
        <mesh position={[-0.3, -1.2, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.8]} />
          <meshStandardMaterial color="#4a90e2" />
        </mesh>

        {/* Right Leg */}
        <mesh position={[0.3, -0.5, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 1.0]} />
          <meshStandardMaterial color="#666666" />
        </mesh>
        <mesh position={[0.3, -1.2, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.8]} />
          <meshStandardMaterial color="#4a90e2" />
        </mesh>

        {/* Base/Feet */}
        <mesh position={[0, -1.8, 0]}>
          <boxGeometry args={[1.0, 0.2, 0.8]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
      </group>

      <OrbitControls enablePan={false} enableZoom={true} enableRotate={true} />
    </Canvas>
  );
}

export default Avatar3D;