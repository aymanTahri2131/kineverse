import { Suspense, useRef, useEffect, useState, useMemo, memo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, useFBX, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { User, Volume2, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { getModelUrl, getAnimationUrl } from '../config/models';
import { useLipSync, getMouthMorphTargets } from '../hooks/useLipSync';

// Kine Character Component
function KineCharacter({ onSequenceUpdate, currentLang, bienvenueAudioRef, servicesAudioRef, bookAudioRef, audioUnlocked }) {
  const group = useRef();
  const { scene } = useGLTF(getModelUrl('kine-character.glb'));
  
  // Load FBX animations from Cloudinary
  const { animations: idleAnimations } = useFBX(getAnimationUrl('idle.fbx'));
  const { animations: idle2Animations } = useFBX(getAnimationUrl('Idle2.fbx'));
  const { animations: idle3Animations } = useFBX(getAnimationUrl('Idle3.fbx'));
  const { animations: talkingAnimations } = useFBX(getAnimationUrl('talking.fbx'));
  const { animations: talking2Animations } = useFBX(getAnimationUrl('talking2.fbx'));
  const { animations: walkingAnimations } = useFBX(getAnimationUrl('walking.fbx'));
  const { animations: helloAnimations } = useFBX(getAnimationUrl('hello.fbx'));
  
  const mixer = useRef();
  const [currentAction, setCurrentAction] = useState(null);
  const [sequenceStep, setSequenceStep] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [pauseTime, setPauseTime] = useState(null); // Time when paused
  const [walkProgress, setWalkProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [pausedAtWalk, setPausedAtWalk] = useState(false);
  
  // Lip-sync integration for each audio with specific JSON files
  const bienvenueCurrentMouth = useLipSync(bienvenueAudioRef, currentLang, 'bienvenue');
  const servicesCurrentMouth = useLipSync(servicesAudioRef, currentLang, 'services');
  const bookCurrentMouth = useLipSync(bookAudioRef, currentLang, 'book');
  const headMeshRef = useRef(null);
  
  // Track which audio is currently playing
  const [currentAudioPhase, setCurrentAudioPhase] = useState(null); // 'bienvenue', 'services', 'book'

  // Play specific audio
  const playAudio = (audioRef, audioName) => {
    if (!audioRef.current) return;

    setCurrentAudioPhase(audioName);
    audioRef.current.play().catch(error => {
      console.error(`Audio play failed:`, error);
    });
  };

  // Stop specific audio
  const stopAudio = (audioRef) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setCurrentAudioPhase(null); // Reset phase when stopping
    }
  };

  // Helper function to play animation
  const playAnimation = (animations, loop = true, timeScale = 1.0) => {
    if (!animations || animations.length === 0) return null;
    
    if (!mixer.current) {
      mixer.current = new THREE.AnimationMixer(scene);
    } else {
      mixer.current.stopAllAction();
    }

    const clip = animations[0];
    
    // Clone the animation clip and filter out morph target tracks
    // This prevents animations from overwriting lip-sync morph targets
    const filteredTracks = clip.tracks.filter(track => {
      // Keep all tracks except morph target influences
      return !track.name.includes('.morphTargetInfluences[');
    });
    
    const filteredClip = new THREE.AnimationClip(clip.name, clip.duration, filteredTracks);
    
    const action = mixer.current.clipAction(filteredClip);
    action.reset();
    action.fadeIn(0.3);
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce);
    action.clampWhenFinished = true;
    action.timeScale = timeScale; // Control animation speed
    action.play();
    
    return action;
  };

  // Initialize sequence on mount - wait for all assets to load
  useEffect(() => {
    // Check if all animations are loaded
    const allLoaded = scene && 
                      idleAnimations?.length > 0 &&
                      idle2Animations?.length > 0 &&
                      idle3Animations?.length > 0 &&
                      talkingAnimations?.length > 0 && 
                      talking2Animations?.length > 0 &&
                      walkingAnimations?.length > 0 &&
                      helloAnimations?.length > 0;

    if (!allLoaded || isLoaded) return;

    // Set initial position (RIGHT side - where idle and walking start)
    if (group.current) {
      group.current.position.x = 3;      // Right side of screen
      group.current.position.z = 0;      // Same depth
      group.current.scale.set(1.5, 1.5, 1.5); // Full size
      group.current.rotation.y = -Math.PI / 2;   // Facing left (walking direction)
    }
    
    // Start the sequence after everything is loaded
    setIsLoaded(true);
    setStartTime(Date.now());
    setSequenceStep(0);
  }, [scene, idleAnimations, idle2Animations, idle3Animations, talkingAnimations, talking2Animations, walkingAnimations, helloAnimations, isLoaded]);

  // Animation sequence timeline
  useFrame((state, delta) => {
    if (mixer.current) {
      mixer.current.update(delta);
    }

    // Don't start animation until everything is loaded
    if (!isLoaded || !startTime || !group.current) return;

    const elapsed = (Date.now() - startTime) / 1000; // seconds

    // Sequence timeline
    // 0-1s: Walking to center (1 second)
    // 1-2s: Hello animation
    // 2-4s: Talking (show login button)
    // 4-6s: Talking2 (show appointment button)
    // 6-8s: Idle3 (before Idle2)
    // 8-17s: Idle2 (main idle)
    // 17+: Idle3 (after Idle2)

    if (sequenceStep === 0) {
      // Step 0: Start walking in place immediately
      if (!currentAction || currentAction !== 'walking') {
        playAnimation(walkingAnimations, true, 1.0);
        setCurrentAction('walking');
        onSequenceUpdate?.({ step: 'walking', showLoginBtn: false, showAppointmentBtn: false });
      }
    }
    
    if (sequenceStep === 0 && elapsed < 1) {
      // Walking animation - move from RIGHT to CENTER (left in image)
      const walkDuration = 1; // 1 second walk duration
      const progress = Math.min(elapsed / walkDuration, 1);
      
      // Move from RIGHT (x=3) to CENTER-LEFT (x=-1)
      group.current.position.x = 3 - (4 * progress); // From 3 to -1
      group.current.position.z = 0; // Stay at same depth
      
      // Keep scale constant at full size
      group.current.scale.set(1.5, 1.5, 1.5);
      
      // Keep facing left (walking direction)
      group.current.rotation.y = -Math.PI / 2;
      
      setWalkProgress(progress);
    }
    else if ((sequenceStep === 0 || sequenceStep === 0.5) && elapsed >= 1) {
      // Walk finished - check if audio is unlocked
      if (!audioUnlocked) {
        // Pause at walk end, play idle until user clicks
        if (!pausedAtWalk) {
          playAnimation(idleAnimations, true);
          setCurrentAction('idle-waiting');
          setPausedAtWalk(true);
          setPauseTime(Date.now()); // Save pause time
          // Move to step 0.5 to prevent re-entering this block
          setSequenceStep(0.5);
        }
        // Stay paused, don't progress further
        return;
      }
      
      // Audio unlocked - play bienvenue audio and continue to hello
      if (sequenceStep === 0.5) {
        // Reset timer to account for pause duration
        if (pauseTime) {
          const pauseDuration = (Date.now() - pauseTime) / 1000;
          setStartTime(Date.now() - (elapsed * 1000) + (pauseDuration * 1000));
          setPauseTime(null);
        }
        
        // Play bienvenue audio in idle
        playAudio(bienvenueAudioRef, 'bienvenue');
        
        // Step 1: Hello animation (idle3 with bienvenue audio)
        playAnimation(idle3Animations, true);
        setCurrentAction('hello-bienvenue');
        setSequenceStep(1);
        setPausedAtWalk(false);
        onSequenceUpdate?.({ step: 'hello', showLoginBtn: false, showAppointmentBtn: false });
      }
    }
    else if (sequenceStep === 1 && elapsed >= 6) {
      // Step 2: First talking (about services) + services audio
      playAnimation(talkingAnimations, true);
      setCurrentAction('talking-services');
      setSequenceStep(2);
      
      // Stop bienvenue, play services audio
      stopAudio(bienvenueAudioRef);
      playAudio(servicesAudioRef, 'services');
      
      onSequenceUpdate?.({ step: 'talking-login', showLoginBtn: true, showAppointmentBtn: false });
    }
    else if (sequenceStep === 2 && elapsed >= 10) {
      // Step 3: Second talking (about appointment) + book audio
      playAnimation(talking2Animations, true);
      setCurrentAction('talking2-book');
      setSequenceStep(3);
      
      // Stop services, play book audio
      stopAudio(servicesAudioRef);
      playAudio(bookAudioRef, 'book');
      
      onSequenceUpdate?.({ step: 'talking-appointment', showLoginBtn: true, showAppointmentBtn: true });
    }
    else if (sequenceStep === 3 && elapsed >= 14) {
      // Step 4: Idle3 before Idle2
      playAnimation(idle3Animations, true);
      setCurrentAction('idle3');
      setSequenceStep(4);
      onSequenceUpdate?.({ step: 'idle3-before', showLoginBtn: true, showAppointmentBtn: true });
    }
    else if (sequenceStep === 4 && elapsed >= 18) {
      // Step 5: Main Idle2
      playAnimation(idle2Animations, false);
      setCurrentAction('idle2');
      setSequenceStep(5);
      onSequenceUpdate?.({ step: 'main-idle2', showLoginBtn: true, showAppointmentBtn: true });
    }
    else if (sequenceStep === 5 && elapsed >= 22) {
      // Step 6: Idle3 after Idle2 + Stop all audios
      playAnimation(idle3Animations, true);
      setCurrentAction('idle3');
      setSequenceStep(6);
      
      // Stop all audios to ensure smile is applied
      stopAudio(bienvenueAudioRef);
      stopAudio(servicesAudioRef);
      stopAudio(bookAudioRef);
      
      onSequenceUpdate?.({ step: 'idle3-after', showLoginBtn: true, showAppointmentBtn: true });
    }

    // Gentle floating animation (except during walking and hello)
    if (sequenceStep > 1 && group.current) {
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }

    // Apply lip-sync morph targets every frame
    if (headMeshRef.current) {
      const mesh = headMeshRef.current;
      
      // During audio playback, apply lip-sync
      if (currentMouthRef.current && currentAudioPhase) {
        const morphTargets = getMouthMorphTargets(currentMouthRef.current);

        // Reset all viseme morph targets to 0 first
        Object.keys(mesh.morphTargetDictionary).forEach(key => {
          if (key.startsWith('viseme_')) {
            const index = mesh.morphTargetDictionary[key];
            mesh.morphTargetInfluences[index] = 0;
          }
        });

        // Apply morph target values directly with stronger values
        Object.entries(morphTargets).forEach(([targetName, value]) => {
          const index = mesh.morphTargetDictionary?.[targetName];
          if (index !== undefined && mesh.morphTargetInfluences && value > 0) {
            // Amplify the value for more visible movement
            mesh.morphTargetInfluences[index] = Math.min(value * 1.5, 1.0);
          }
        });
      }
      // Apply smile during Idle3 animations (step 4 before Idle2, and step 6+ after Idle2)
      // BUT NOT during Idle2 (step 5) and NOT when audio is playing
      else if ((sequenceStep === 4 || sequenceStep >= 6) && !currentAudioPhase) {
        // Reset all visemes to 0
        Object.keys(mesh.morphTargetDictionary).forEach(key => {
          if (key.startsWith('viseme_')) {
            const index = mesh.morphTargetDictionary[key];
            mesh.morphTargetInfluences[index] = 0;
          }
        });
        
        // Apply smile using viseme_E (narrow/smile shape)
        const smileIndex = mesh.morphTargetDictionary.viseme_E;
        if (smileIndex !== undefined) {
          mesh.morphTargetInfluences[smileIndex] = 0.5; // Subtle smile
        }
      }
    }
  });

  // Setup audio event listeners to reset phase when audio ends
  useEffect(() => {
    const handleAudioEnd = (audioName) => () => {
      if (currentAudioPhase === audioName) {
        setCurrentAudioPhase(null);
      }
    };

    const bienvenueAudio = bienvenueAudioRef.current;
    const servicesAudio = servicesAudioRef.current;
    const bookAudio = bookAudioRef.current;

    if (bienvenueAudio) {
      bienvenueAudio.addEventListener('ended', handleAudioEnd('bienvenue'));
    }
    if (servicesAudio) {
      servicesAudio.addEventListener('ended', handleAudioEnd('services'));
    }
    if (bookAudio) {
      bookAudio.addEventListener('ended', handleAudioEnd('book'));
    }

    return () => {
      if (bienvenueAudio) {
        bienvenueAudio.removeEventListener('ended', handleAudioEnd('bienvenue'));
      }
      if (servicesAudio) {
        servicesAudio.removeEventListener('ended', handleAudioEnd('services'));
      }
      if (bookAudio) {
        bookAudio.removeEventListener('ended', handleAudioEnd('book'));
      }
    };
  }, [currentAudioPhase]);

  // Cleanup all audios on unmount
  useEffect(() => {
    return () => {
      stopAudio(bienvenueAudioRef);
      stopAudio(servicesAudioRef);
      stopAudio(bookAudioRef);
    };
  }, []);

  // Find head mesh and apply morph targets for lip-sync
  // Search in the GROUP (rendered scene) not the original scene
  useFrame(() => {
    if (!group.current || headMeshRef.current) return;

    // Find the head/face mesh in the rendered group
    group.current.traverse((child) => {
      if (child.isMesh && child.morphTargetInfluences) {
        // Check if this mesh has viseme morph targets
        const hasMouthMorphs = child.morphTargetDictionary && 
          (child.morphTargetDictionary.viseme_aa !== undefined ||
           child.morphTargetDictionary.mouthOpen !== undefined);
        
        // IMPORTANT: We want the HEAD mesh, not eyes!
        // Wolf3D_Head, Wolf3D_Teeth, or similar
        const isHeadMesh = child.name.includes('Head') || child.name.includes('head') || 
                          child.name.includes('Face') || child.name.includes('face');
        
        if (hasMouthMorphs && isHeadMesh && !headMeshRef.current) {
          headMeshRef.current = child;
        }
      }
    });
  });

  // Store current mouth shape in a ref for useFrame access
  const currentMouthRef = useRef('X');
  
  useEffect(() => {
    // Select the appropriate mouth shape based on which audio is playing
    let currentMouth = null;
    if (currentAudioPhase === 'bienvenue') {
      currentMouth = bienvenueCurrentMouth;
    } else if (currentAudioPhase === 'services') {
      currentMouth = servicesCurrentMouth;
    } else if (currentAudioPhase === 'book') {
      currentMouth = bookCurrentMouth;
    }

    if (currentMouth) {
      currentMouthRef.current = currentMouth;
    }
  }, [bienvenueCurrentMouth, servicesCurrentMouth, bookCurrentMouth, currentAudioPhase]);

  return (
    <group ref={group}>
      <primitive object={scene} scale={1.8} position={[0, -2, 0]} />
    </group>
  );
}

// Loading component
function Loader() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#8b5cf6" wireframe />
    </mesh>
  );
}

// Main Scene Component
export default function KineScene() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  
  // Three separate audio refs for each phase
  const bienvenueAudioRef = useRef(null);
  const servicesAudioRef = useRef(null);
  const bookAudioRef = useRef(null);
  
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [showAudioPrompt, setShowAudioPrompt] = useState(false);
  const [sequenceState, setSequenceState] = useState({
    step: 'initial-idle',
    showLoginBtn: false,
    showAppointmentBtn: false
  });

  const handleSequenceUpdate = (state) => {
    setSequenceState(state);
  };

  const isRTL = currentLang === 'ar';

  // Audio sources based on language
  const bienvenueAudioSrc = currentLang === 'ar' ? '/audio/bienvenue-ar.ogg' : '/audio/bienvenue-fr.ogg';
  const servicesAudioSrc = currentLang === 'ar' ? '/audio/services-ar.ogg' : '/audio/services-fr.ogg';
  const bookAudioSrc = currentLang === 'ar' ? '/audio/book-ar.ogg' : '/audio/book-fr.ogg';



  // Show prompt after walk animation (1.5 seconds after load)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!audioUnlocked) {
        setShowAudioPrompt(true);
      }
    }, 1500); // After walk finishes (1s walk + 0.5s buffer)
    
    return () => clearTimeout(timer);
  }, [audioUnlocked]);

  // Unlock audio on user interaction
  const unlockAudio = () => {
    if (!audioUnlocked) {
      setAudioUnlocked(true);
      setShowAudioPrompt(false);
    }
  };

  return (
    <div 
      className="w-[800px] h-[600px] rounded-2xl overflow-hidden relative"
    >
      {/* Three hidden audio elements for each phase */}
      <audio 
        ref={bienvenueAudioRef} 
        src={bienvenueAudioSrc} 
        preload="auto"
        style={{ display: 'none' }} 
      />
      <audio 
        ref={servicesAudioRef} 
        src={servicesAudioSrc} 
        preload="auto"
        style={{ display: 'none' }} 
      />
      <audio 
        ref={bookAudioRef} 
        src={bookAudioSrc} 
        preload="auto"
        style={{ display: 'none' }} 
      />
      
      {/* Audio Unlock Prompt */}
      {showAudioPrompt && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm px-4"
          onClick={unlockAudio}
        >
          <div className="bg-white/60 rounded-2xl p-8 shadow-2xl text-center max-w-md w-full">
            <div className="flex justify-center mb-4">
              <Volume2 size={64} className="text-kine-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {currentLang === 'ar' ? 'تفعيل الصوت' : 'Activer le son'}
            </h3>
            <p className="text-gray-600 mb-6">
              {currentLang === 'ar' 
                ? 'انقر في أي مكان لتشغيل الصوت' 
                : 'Cliquez n\'importe où pour activer le son'}
            </p>
            <button
              onClick={unlockAudio}
              className="btn btn-primary bg-kine-600 text-white px-8 py-3 rounded-full hover:bg-kine-700 transition-all hover:scale-105 flex items-center justify-center gap-2 mx-auto"
            >
              <Play size={20} fill="currentColor" />
              {currentLang === 'ar' ? 'تشغيل' : 'Activer'}
            </button>
          </div>
        </motion.div>
      )}
      
      {/* Controls Info */}

      {/* Animated Buttons - Optimized with will-change */}
      {sequenceState.showLoginBtn && (
        <div 
          className={`absolute top-20 z-10 animate-fade-in ${isRTL ? 'right-0' : 'left-0'}`}
          style={{ willChange: 'opacity, transform' }}
        >
          <div className="bg-white/15 w-56 backdrop-blur-md rounded-2xl p-6 py-10 shadow-xl border-2 border-kine-400 flex flex-col gap-4">
            <p className="text-white text-xl font-semibold mb-4 text-center">{t('home.discoverServices')}</p>
            <a 
              href="#services" 
              className="btn btn-primary text-center bg-white text-kine-700 hover:text-white px-6 py-2 rounded-full hover:bg-primary-800 transition-all hover:scale-105 inline-block"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {t('home.discover')}
            </a>
          </div>
        </div>
      )}

      {sequenceState.showAppointmentBtn && (
        <div 
          className={`absolute bottom-12 md:bottom-32 z-10 animate-fade-in animation-delay-200 ${isRTL ? 'right-0 md:left-8 md:right-auto' : 'left-0 md:right-8 md:left-auto'}`}
          style={{ willChange: 'opacity, transform' }}
        >
          <div className="bg-white/15 w-56 backdrop-blur-md rounded-xl p-4 py-8 shadow-xl border-2 border-kine-400 flex flex-col gap-2">
            <p className="text-white text-xl font-semibold mb-4 text-center">{t('home.takeAppointment')}</p>
            <Link to="/book" className="btn btn-primary text-center bg-white text-kine-700 hover:text-white px-4 py-2 rounded-full hover:bg-primary-800 transition-all hover:scale-105 inline-block">
              {t('home.book')}
            </Link>
          </div>
        </div>
      )}

      {/* 3D Canvas */}
      <Canvas 
        shadows
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
          depth: true
        }}
        dpr={[1, 2]} // Limit pixel ratio for performance
        performance={{ min: 0.5 }} // Allow dropping to 50% performance if needed
        frameloop="always"
      >
        <Suspense fallback={<Loader />}>
          {/* Lighting - Reduced shadow quality for performance */}
          <ambientLight intensity={2} />
          <directionalLight
            position={[5, 5, 5]}
            intensity={2}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-far={20}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
          />
          <spotLight position={[-5, 5, 2]} intensity={1} />

          {/* Camera - Side/Profile view like the reference image */}
          <PerspectiveCamera makeDefault position={isRTL ? [-10, 1, -3] : [-10, 1, 3]} fov={30} />

          {/* Character */}
          <KineCharacter 
            onSequenceUpdate={handleSequenceUpdate} 
            currentLang={currentLang}
            bienvenueAudioRef={bienvenueAudioRef}
            servicesAudioRef={servicesAudioRef}
            bookAudioRef={bookAudioRef}
            audioUnlocked={audioUnlocked}
          />

          {/* Ground */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
            <planeGeometry args={[10, 10]} />
            <shadowMaterial opacity={0.2} />
          </mesh>

          {/* Controls */}
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minDistance={3}
            maxDistance={8}
            maxPolarAngle={Math.PI / 2}
            autoRotate={false}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

// Preload the model and animations from Cloudinary
useGLTF.preload(getModelUrl('kine-character.glb'));
useFBX.preload(getAnimationUrl('idle.fbx'));
useFBX.preload(getAnimationUrl('Idle2.fbx'));
useFBX.preload(getAnimationUrl('Idle3.fbx'));
useFBX.preload(getAnimationUrl('talking.fbx'));
useFBX.preload(getAnimationUrl('talking2.fbx'));
useFBX.preload(getAnimationUrl('walking.fbx'));
useFBX.preload(getAnimationUrl('hello.fbx'));
