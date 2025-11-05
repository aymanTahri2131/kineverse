import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useFBX, useGLTF, PerspectiveCamera, Sphere } from '@react-three/drei';
import { Suspense, useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Rotate3d } from 'lucide-react';
import * as THREE from 'three';
import { getAnimationUrl } from '../config/models';

// Component to update camera position dynamically
function CameraController({ position, lookAt = [0, 0, 0] }) {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.position.set(position[0], position[1], position[2]);
    camera.lookAt(lookAt[0], lookAt[1], lookAt[2]);
    camera.updateProjectionMatrix();
  }, [camera, position, lookAt]);
  
  return null;
}

// Inflammation spot component
function InflammationSpot({ position, radius, opacity = 0.5 }) {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      const pulse = (Math.sin(state.clock.elapsedTime * 3) + 1) / 2; // 0 to 1
      meshRef.current.material.opacity = opacity + pulse * opacity;
      meshRef.current.scale.setScalar(1 + pulse * 0.2);
    }
  });

  return (
    <group>
      {/* Main inflammation sphere */}
      <Sphere ref={meshRef} args={[radius, 32, 32]} position={position}>
        <meshStandardMaterial
          color="#ff0000"
          transparent
          opacity={opacity}
          emissive="#ff0000"
          emissiveIntensity={2}
        />
      </Sphere>
      
      {/* Blur effect layers - multiple transparent spheres for soft glow */}
      <Sphere args={[radius * 1.2, 32, 32]} position={position}>
        <meshStandardMaterial
          color="#ff0000"
          transparent
          opacity={opacity * 0.3}
          emissive="#ff0000"
          emissiveIntensity={1.5}
        />
      </Sphere>
      
      <Sphere args={[radius * 1.4, 32, 32]} position={position}>
        <meshStandardMaterial
          color="#ff0000"
          transparent
          opacity={opacity * 0.15}
          emissive="#ff0000"
          emissiveIntensity={1}
        />
      </Sphere>
    </group>
  );
}

function AnimatedModel({ animationName, serviceId, modelConfig = {} }) {
  const fbx = useFBX(getAnimationUrl(`${animationName}.fbx`));
  const mixer = useRef();
  const group = useRef();

  // Get config values or use defaults
  const scale = modelConfig.scale || 0.015;
  const position = modelConfig.position || [0, -1, 0];

  useEffect(() => {
    if (fbx) {
      const clonedFbx = fbx.clone();
      
      clonedFbx.traverse((child) => {
        if (child.isMesh) {
          child.material = child.material.clone();
          const colors = [
            '#00a783', '#242f55', '#6366f1', '#ec4899', '#14b8a6',
            '#f59e0b', '#8b5cf6', '#10b981', '#ef4444',
          ];
          child.material.color.set(colors[serviceId % colors.length]);
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      if (group.current) {
        group.current.clear();
        group.current.add(clonedFbx);
      }

      // Only setup animation if available
      if (fbx.animations && fbx.animations.length > 0) {
        mixer.current = new THREE.AnimationMixer(clonedFbx);
        const action = mixer.current.clipAction(clonedFbx.animations[0]);
        action.play();
      }
    }
  }, [fbx, serviceId, animationName]);

  useEffect(() => {
    const animate = () => {
      if (mixer.current) {
        mixer.current.update(0.01);
      }
    };
    const interval = setInterval(animate, 16);
    return () => clearInterval(interval);
  }, []);

  return <group ref={group} scale={scale} position={position} />;
}

// Component for GLB model with FBX animation
function GLBWithFBXAnimation({ modelPath, animationPath, serviceId, modelConfig = {} }) {
  const { scene } = useGLTF(modelPath);
  const fbx = useFBX(animationPath);
  const mixer = useRef();
  const group = useRef();

  const scale = modelConfig.scale || 0.015;
  const position = modelConfig.position || [0, -1, 0];
  const cameraPosition = modelConfig.cameraPosition || [0, 0, 5];

  useEffect(() => {
    if (scene && fbx && group.current) {
      // Clone the scene
      const clonedScene = scene.clone();
      
      // Clear and add the cloned scene
      group.current.clear();
      group.current.add(clonedScene);

      // Create mixer and apply FBX animation to the GLB model
      if (fbx.animations && fbx.animations.length > 0) {
        mixer.current = new THREE.AnimationMixer(clonedScene);
        
        // Play the first animation (walking animation)
        const action = mixer.current.clipAction(fbx.animations[0]);
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.clampWhenFinished = false;
        action.play();
      }
    }
  }, [scene, fbx, serviceId]);

  // Use useFrame for animation updates
  useFrame((state, delta) => {
    if (mixer.current) {
      mixer.current.update(delta);
    }
  });

  return <group ref={group} scale={scale} position={position} />;
}

function GLBModel({ modelPath, serviceId, modelConfig = {} }) {
  const { scene, animations } = useGLTF(modelPath);
  const mixer = useRef();
  const group = useRef();
  const modelRef = useRef();
  const [isDragging, setIsDragging] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const inflammationMaterials = useRef([]);
  const { gl, camera } = useThree();

  // Extract config values with proper reactivity
  const { 
    scale: configScale, 
    position: configPosition, 
    rotation: configRotation,
    cameraPosition: configCameraPosition,
    inflammation = {},
    inflammationSpots = [],
    disableRotation: configDisableRotation,
    disableAutoRotation: configDisableAutoRotation,
    heartbeat = false,
    breathing = false
  } = modelConfig;

  // Apply defaults
  const scale = configScale ?? 0.2;
  const position = configPosition ?? [0, 0, -10];
  const rotation = configRotation ?? [0, 0, 0];
  const cameraPosition = configCameraPosition ?? [0, 0, 5];
  const disableRotation = configDisableRotation === true;
  const disableAutoRotation = configDisableAutoRotation === true;
  
  // Force update group position and rotation when it changes
  useEffect(() => {
    if (group.current) {
      group.current.position.set(position[0], position[1], position[2]);
      group.current.rotation.set(rotation[0], rotation[1], rotation[2]);
      group.current.scale.set(scale, scale, scale);
    }
  }, [position, rotation, scale, serviceId]);

  useEffect(() => {
    if (scene) {
      const clonedScene = scene.clone();
      
      clonedScene.traverse((child) => {
        if (child.isMesh) {
          // Clone the material to preserve original properties including textures
          child.material = child.material.clone();
          child.castShadow = true;
          child.receiveShadow = true;
          
          // Apply inflammation effect if enabled
          if (inflammation.enabled) {
            child.material.emissive = new THREE.Color(inflammation.color || '#ff0000');
            child.material.emissiveIntensity = 1;
            inflammationMaterials.current.push(child.material);
          }
        }
      });

      if (modelRef.current) {
        modelRef.current.clear();
        modelRef.current.add(clonedScene);
      }

      // Play animations if available (but skip if we want manual rotation)
      if (animations && animations.length > 0 && !heartbeat && !breathing) {
        // Only play animations if they're not conflicting with manual rotation
        // Skip animations for models that need rotation control
        const shouldPlayAnimations = disableRotation || disableAutoRotation;
        if (shouldPlayAnimations) {
          mixer.current = new THREE.AnimationMixer(clonedScene);
          animations.forEach((clip) => {
            const action = mixer.current.clipAction(clip);
            action.play();
          });
        }
      }
    }
  }, [scene, animations, serviceId, inflammation]);

  // Manual rotation in place (skip if disabled)
  useEffect(() => {
    if (disableRotation) return;
    
    const canvas = gl.domElement;
    let interactionTimeout;

    const handleMouseDown = (e) => {
      if (disableRotation) return;
      setIsDragging(true);
      setIsInteracting(true);
      previousMousePosition.current = {
        x: e.clientX || e.touches?.[0]?.clientX,
        y: e.clientY || e.touches?.[0]?.clientY
      };
      clearTimeout(interactionTimeout);
    };

    const handleMouseMove = (e) => {
      if (disableRotation || !isDragging || !modelRef.current) return;

      const currentX = e.clientX || e.touches?.[0]?.clientX;
      const currentY = e.clientY || e.touches?.[0]?.clientY;

      const deltaX = currentX - previousMousePosition.current.x;
      const deltaY = currentY - previousMousePosition.current.y;

      // Rotate the model around Y axis (horizontal drag)
      modelRef.current.rotation.y += deltaX * 0.01;
      
      // Optionally rotate around X axis (vertical drag)
      modelRef.current.rotation.x += deltaY * 0.01;
      
      // Clamp X rotation to prevent flipping
      modelRef.current.rotation.x = Math.max(
        -Math.PI / 4,
        Math.min(Math.PI / 4, modelRef.current.rotation.x)
      );

      previousMousePosition.current = { x: currentX, y: currentY };
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      clearTimeout(interactionTimeout);
      interactionTimeout = setTimeout(() => {
        setIsInteracting(false);
      }, 2000); // Resume auto-rotation 2 seconds after user stops interacting
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);
    canvas.addEventListener('touchstart', handleMouseDown);
    canvas.addEventListener('touchmove', handleMouseMove);
    canvas.addEventListener('touchend', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
      canvas.removeEventListener('touchstart', handleMouseDown);
      canvas.removeEventListener('touchmove', handleMouseMove);
      canvas.removeEventListener('touchend', handleMouseUp);
      clearTimeout(interactionTimeout);
    };
  }, [gl, isDragging, disableRotation]);

  // Animation loop using useFrame for better performance
  useFrame((state, delta) => {
    if (mixer.current) {
      mixer.current.update(delta);
    }
    
    // Ensure group position is always correct
    if (group.current) {
      const currentPos = group.current.position;
      if (currentPos.x !== position[0] || currentPos.y !== position[1] || currentPos.z !== position[2]) {
        group.current.position.set(position[0], position[1], position[2]);
      }
    }
    
    // Heartbeat animation (pulsing scale)
    if (heartbeat && modelRef.current) {
      const heartRate = 1.2; // Beats per second
      const beat = Math.sin(state.clock.elapsedTime * heartRate * Math.PI * 2);
      const scaleFactor = 0.975 + beat * 0.025; // Pulse between 0.95x and 1.0x
      modelRef.current.scale.setScalar(scaleFactor);
    }
    
    // Breathing animation (slow expansion and contraction)
    if (breathing && modelRef.current) {
      // Use custom breathing parameters or defaults
      const breathingSpeed = modelConfig.breathingSpeed || 0.5; // Breaths per second
      const breathingIntensity = modelConfig.breathingIntensity || 0.08; // Scale factor
      
      const breath = Math.sin(state.clock.elapsedTime * breathingSpeed * Math.PI * 2);
      const breathFactor = 1 + breath * breathingIntensity; // Expand/contract
      
      // Apply breathing to chest area (Y and Z axis primarily)
      modelRef.current.scale.set(
        breathFactor * 0.95, // Slight X-axis expansion
        breathFactor, // Primary Y-axis expansion (chest rises)
        breathFactor * 0.7 // Moderate Z-axis for realistic chest movement
      );
      
      // Add gentle bobbing motion for baby (like gentle movement)
      const bobbing = Math.sin(state.clock.elapsedTime * 0.8) * 0.02;
      const currentY = position[1] || 0;
      modelRef.current.position.y = currentY + bobbing;
    }
    
    // Auto-rotate only when not interacting and auto-rotation is not disabled
    if (modelRef.current && !isInteracting && !disableRotation && !disableAutoRotation) {
      modelRef.current.rotation.y += 0.02;
    }
    
    // Pulse inflammation effect
    if (inflammation.enabled && inflammationMaterials.current.length > 0) {
      const pulseSpeed = inflammation.pulseSpeed || 2;
      const intensity = inflammation.intensity || 1.5;
      const pulse = (Math.sin(state.clock.elapsedTime * pulseSpeed) + 1) / 2; // 0 to 1
      
      inflammationMaterials.current.forEach(material => {
        material.emissiveIntensity = pulse * intensity;
      });
    }
  });

  return (
    <group ref={group} scale={scale} position={position}>
      {/* The actual 3D model */}
      <group ref={modelRef} />
      
      {/* Render inflammation spots if configured */}
      {inflammationSpots.map((spot, index) => (
        <InflammationSpot 
          key={index} 
          position={spot.position} 
          radius={spot.radius}
          opacity={spot.opacity}
        />
      ))}
    </group>
  );
}

export default function ServiceCard3D({ service, currentLang, onBook, index, isLarge = false }) {
  const [isHovered, setIsHovered] = useState(false);

  const animationMap = {
    1: 'walking', 2: 'idle', 3: 'talking', 4: 'talking2', 5: 'Idle2',
    6: 'Idle3', 7: 'hello', 8: 'talking', 9: 'idle',
  };

  const animation = service.customAnimation || animationMap[service.id] || 'idle';
  
  // Adjust canvas height based on card size
  const canvasHeight = isLarge ? 'h-64 md:h-80' : 'h-64';

  // Check if service has a custom 3D model path
  const hasCustomModel = service.modelPath;

  return (
    <motion.div 
      className="group relative w-full h-full"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      {/* Simple card */}
      <motion.div 
        className="relative bg-white/30 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-white/60 hover:shadow-white/50 transition-shadow duration-300 w-full h-full flex flex-col overflow-hidden"
        whileHover={{ y: -5 }}
        transition={{ duration: 0.3 }}
      >
        
        {/* 3D Model Container - Takes most space for large cards */}
        <div className={`relative ${canvasHeight} overflow-hidden ${isLarge ? 'flex-1' : 'flex-shrink-0'}`}>
          {/* 3D Canvas */}
          <Canvas>
            <Suspense fallback={null}>
              <PerspectiveCamera 
                makeDefault 
                position={service.modelConfig?.cameraPosition} 
              />
              <CameraController 
                position={service.modelConfig?.cameraPosition} 
                lookAt={service.modelConfig?.position}
              />
              <ambientLight intensity={2} />
              <directionalLight position={[10, 10, 5]} intensity={2} />
              <spotLight position={[-10, 10, 5]} angle={0.3} intensity={2} />
              
              {hasCustomModel ? (
                <GLBModel 
                  key={`${service.id}-${JSON.stringify(service.modelConfig)}`}
                  modelPath={service.modelPath} 
                  serviceId={service.id} 
                  modelConfig={service.modelConfig}
                />
              ) : (
                <AnimatedModel 
                  key={`${service.id}-${JSON.stringify(service.modelConfig)}`}
                  animationName={animation} 
                  serviceId={service.id} 
                  modelConfig={service.modelConfig}
                />
              )}
              
              {/* OrbitControls for models without rotation disabled */}
              {(!service.modelConfig?.disableRotation && !service.modelConfig?.disableAutoRotation) && (
                <OrbitControls
                  enableZoom={false}
                  enablePan={false}
                  enableRotate={true}
                  autoRotate={true}
                  autoRotateSpeed={1.5}
                  minPolarAngle={Math.PI / 3}
                  maxPolarAngle={Math.PI / 2}
                />
              )}
            </Suspense>
          </Canvas>

          {/* Service icon badge */}
          <div className="absolute top-3 right-3 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
            <Rotate3d className="w-8 h-8 text-kine-600" />
          </div>
        </div>

        {/* Content at bottom */}
        <div className="p-4 flex flex-col">
          {/* Title */}
          <h3 className="text-xl font-bold text-white mb-3">
            {service.name[currentLang] || service.name.fr}
          </h3>

          {/* Description - show on large cards */}
          {isLarge && (
            <p className="text-md text-white mb-3 line-clamp-2">
              {service.description[currentLang] || service.description.fr}
            </p>
          )}

          {/* Divider */}
          <div className="w-full h-px bg-white mb-4 mt-2" />

          {/* Button */}
          <button
            onClick={onBook}
            className="w-full py-2 px-4 bg-white text-kine-500 hover:bg-primary-700 hover:text-white font-medium rounded-lg transition-colors duration-200 text-lg"
          >
            {currentLang === 'ar' ? 'احجز الآن' : 'Réserver'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
