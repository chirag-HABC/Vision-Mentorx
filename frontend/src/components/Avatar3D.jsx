import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { useRef, useEffect, useState, Suspense } from "react";
import { TextureLoader } from "three";

function HumanoidAvatar({ isSpeaking, modelPath = null, faceTextureUrl = null, pose = null, lipSync = 0 }) {
  const groupRef = useRef();
  const mouthMeshRef = useRef();
  const [faceTexture, setFaceTexture] = useState(null);
  const [textureError, setTextureError] = useState(false);
  const [modelError, setModelError] = useState(false);

  // Load GLTF unconditionally — React Hooks must be called in the same order every render.
  // If modelPath is null/invalid, drei's useGLTF will simply not load anything.
  const gltf = modelPath ? useGLTF(modelPath, true) : null;

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
        console.warn("📷 Face texture not found, using default avatar");
        setFaceTexture(null);
        setTextureError(true);
      }
    );
  }, [faceTextureUrl]);

  useEffect(() => {
    if (gltf?.scene) {
      console.log("✅ 3D Model loaded successfully");
      setModelError(false);
    }
  }, [gltf]);

  useFrame((state) => {
    if (!groupRef.current) return;

    // small breathing motion
    groupRef.current.position.y = 0.05 * Math.sin(state.clock.elapsedTime * 1.2);

    // Pose-based upper body orientation
    if (pose && pose.keypoints) {
      const left = pose.keypoints.find((k) => k.part === "leftShoulder");
      const right = pose.keypoints.find((k) => k.part === "rightShoulder");
      if (left?.score > 0.4 && right?.score > 0.4) {
        const dx = right.position.x - left.position.x;
        const dy = right.position.y - left.position.y;
        groupRef.current.rotation.z = (Math.atan2(dy, dx) - Math.PI / 2) * 0.6;
      }
    }

    if (isSpeaking) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.04;
    } else {
      groupRef.current.rotation.y = 0;
    }

    if (mouthMeshRef.current) {
      const scale = 1 + Math.min(1, Math.max(0, lipSync)) * 0.8;
      mouthMeshRef.current.scale.y = scale;
    }
  });

  useEffect(() => {
    if (gltf && gltf.scene && faceTexture) {
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          if (
            child.name.toLowerCase().includes("face") ||
            child.name.toLowerCase().includes("head")
          ) {
            child.material.map = faceTexture;
            child.material.needsUpdate = true;
          }
          if (child.name.toLowerCase().includes("mouth")) {
            mouthMeshRef.current = child;
          }
          child.material.metalness = 0.1;
          child.material.roughness = 0.6;
        }
      });
    }
  }, [gltf, faceTexture]);

  return (
    <group ref={groupRef}>
      {gltf && gltf.scene && !modelError ? (
        <primitive object={gltf.scene} position={[0, -1.2, 0]} scale={1.2} />
      ) : (
        <>
          {/* Head */}
          <mesh position={[0, 0.4, 0]}>
            <sphereGeometry args={[0.5, 64, 64]} />
            <meshStandardMaterial
              color={faceTexture ? "#fff" : textureError ? "#f2c2b7" : "#f5dfc7"}
              map={faceTexture}
              metalness={0.1}
              roughness={0.6}
            />
          </mesh>

          {/* Eyes */}
          <mesh position={[-0.15, 0.55, 0.45]}>
            <sphereGeometry args={[0.08, 32, 32]} />
            <meshStandardMaterial color="#444" metalness={0.3} roughness={0.2} />
          </mesh>
          <mesh position={[0.15, 0.55, 0.45]}>
            <sphereGeometry args={[0.08, 32, 32]} />
            <meshStandardMaterial color="#444" metalness={0.3} roughness={0.2} />
          </mesh>

          {/* Eye pupils */}
          <mesh position={[-0.15, 0.55, 0.52]}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshStandardMaterial
              color="#66ccff"
              emissive="#0088ff"
              emissiveIntensity={0.6}
            />
          </mesh>
          <mesh position={[0.15, 0.55, 0.52]}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshStandardMaterial
              color="#66ccff"
              emissive="#0088ff"
              emissiveIntensity={0.6}
            />
          </mesh>

          {/* Nose */}
          <mesh position={[0, 0.45, 0.48]}>
            <coneGeometry args={[0.05, 0.15, 16]} />
            <meshStandardMaterial color={textureError ? "#e8a59a" : "#f5dfc7"} />
          </mesh>

          {/* Mouth (animates with lip sync) */}
          <mesh ref={mouthMeshRef} position={[0, 0.3, 0.48]}>
            <boxGeometry args={[0.15, 0.05, 0.05]} />
            <meshStandardMaterial color="#c97586" />
          </mesh>

          {/* Neck */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.15, 0.2, 0.3, 32]} />
            <meshStandardMaterial color={textureError ? "#d9a6a0" : "#eacfc9"} />
          </mesh>

          {/* Body */}
          <mesh position={[0, -0.5, 0]}>
            <boxGeometry args={[0.35, 0.7, 0.25]} />
            <meshStandardMaterial color="#4a5568" />
          </mesh>

          {/* Left arm */}
          <mesh position={[-0.25, -0.2, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.5, 16]} />
            <meshStandardMaterial color={textureError ? "#d9a6a0" : "#eacfc9"} />
          </mesh>

          {/* Right arm */}
          <mesh position={[0.25, -0.2, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.5, 16]} />
            <meshStandardMaterial color={textureError ? "#d9a6a0" : "#eacfc9"} />
          </mesh>
        </>
      )}
    </group>
  );
}

function Avatar3D({
  isSpeaking = false,
  modelPath = null,
  faceTextureUrl = null,
  pose = null,
  lipSync = 0,
}) {
  return (
    <Canvas
      style={{
        height: "400px",
        width: "500px",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <pointLight position={[-5, 5, 5]} intensity={0.6} />

      <Suspense fallback={null}>
        <HumanoidAvatar
          isSpeaking={isSpeaking}
          modelPath={modelPath}
          faceTextureUrl={faceTextureUrl}
          pose={pose}
          lipSync={lipSync}
        />
      </Suspense>

      <OrbitControls enablePan={false} enableZoom={true} enableRotate={true} />
    </Canvas>
  );
}

export default Avatar3D;
