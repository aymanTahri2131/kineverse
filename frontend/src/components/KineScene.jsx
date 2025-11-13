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



// Version desktop complète (votre code actuel)
function DesktopKineCharacter({ onSequenceUpdate, currentLang, bienvenueAudioRef, servicesAudioRef, bookAudioRef, audioUnlocked }) {
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
  const [pauseTime, setPauseTime] = useState(null);
  const [walkProgress, setWalkProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [pausedAtWalk, setPausedAtWalk] = useState(false);
  
  // Lip-sync integration for each audio with specific JSON files
  const bienvenueCurrentMouth = useLipSync(bienvenueAudioRef, currentLang, 'bienvenue');
  const servicesCurrentMouth = useLipSync(servicesAudioRef, currentLang, 'services');
  const bookCurrentMouth = useLipSync(bookAudioRef, currentLang, 'book');
  const headMeshRef = useRef(null);
  
  // Track which audio is currently playing
  const [currentAudioPhase, setCurrentAudioPhase] = useState(null);

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
      setCurrentAudioPhase(null);
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
    const filteredTracks = clip.tracks.filter(track => {
      return !track.name.includes('.morphTargetInfluences[');
    });
    
    const filteredClip = new THREE.AnimationClip(clip.name, clip.duration, filteredTracks);
    const action = mixer.current.clipAction(filteredClip);
    action.reset();
    action.fadeIn(0.3);
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce);
    action.clampWhenFinished = true;
    action.timeScale = timeScale;
    action.play();
    
    return action;
  };

  // Initialize character when all assets are loaded
  useEffect(() => {
    const allLoaded = scene && 
                      idleAnimations?.length > 0 &&
                      idle2Animations?.length > 0 &&
                      idle3Animations?.length > 0 &&
                      talkingAnimations?.length > 0 && 
                      talking2Animations?.length > 0 &&
                      walkingAnimations?.length > 0 &&
                      helloAnimations?.length > 0;

    if (!allLoaded || isLoaded) return;

    if (group.current) {
      group.current.position.x = 3;
      group.current.position.z = 0;
      group.current.scale.set(1.5, 1.5, 1.5);
      group.current.rotation.y = -Math.PI / 2;
    }
    
    setIsLoaded(true);
    setStartTime(Date.now());
    setSequenceStep(0);
  }, [scene, idleAnimations, idle2Animations, idle3Animations, talkingAnimations, talking2Animations, walkingAnimations, helloAnimations, isLoaded]);

  // Animation sequence timeline
  useFrame((state, delta) => {
    if (mixer.current) {
      mixer.current.update(delta);
    }

    if (!isLoaded || !startTime || !group.current) return;

    const elapsed = (Date.now() - startTime) / 1000;

    if (sequenceStep === 0) {
      if (!currentAction || currentAction !== 'walking') {
        playAnimation(walkingAnimations, true, 1.0);
        setCurrentAction('walking');
        onSequenceUpdate?.({ step: 'walking', showLoginBtn: false, showAppointmentBtn: false });
      }
    }
    
    if (sequenceStep === 0 && elapsed < 1) {
      const walkDuration = 1;
      const progress = Math.min(elapsed / walkDuration, 1);
      group.current.position.x = 3 - (4 * progress);
      group.current.position.z = 0;
      group.current.scale.set(1.5, 1.5, 1.5);
      group.current.rotation.y = -Math.PI / 2;
      setWalkProgress(progress);
    }
    else if ((sequenceStep === 0 || sequenceStep === 0.5) && elapsed >= 1) {
      if (!audioUnlocked) {
        if (!pausedAtWalk) {
          playAnimation(idleAnimations, true);
          setCurrentAction('idle-waiting');
          setPausedAtWalk(true);
          setPauseTime(Date.now());
          setSequenceStep(0.5);
        }
        return;
      }
      
      if (sequenceStep === 0.5) {
        if (pauseTime) {
          const pauseDuration = (Date.now() - pauseTime) / 1000;
          setStartTime(Date.now() - (elapsed * 1000) + (pauseDuration * 1000));
          setPauseTime(null);
        }
        
        playAudio(bienvenueAudioRef, 'bienvenue');
        playAnimation(idle3Animations, true);
        setCurrentAction('hello-bienvenue');
        setSequenceStep(1);
        setPausedAtWalk(false);
        onSequenceUpdate?.({ step: 'hello', showLoginBtn: false, showAppointmentBtn: false });
      }
    }
    else if (sequenceStep === 1 && elapsed >= 6) {
      playAnimation(talkingAnimations, true);
      setCurrentAction('talking-services');
      setSequenceStep(2);
      stopAudio(bienvenueAudioRef);
      playAudio(servicesAudioRef, 'services');
      onSequenceUpdate?.({ step: 'talking-login', showLoginBtn: true, showAppointmentBtn: false });
    }
    else if (sequenceStep === 2 && elapsed >= 10) {
      playAnimation(talking2Animations, true);
      setCurrentAction('talking2-book');
      setSequenceStep(3);
      stopAudio(servicesAudioRef);
      playAudio(bookAudioRef, 'book');
      onSequenceUpdate?.({ step: 'talking-appointment', showLoginBtn: true, showAppointmentBtn: true });
    }
    else if (sequenceStep === 3 && elapsed >= 14) {
      playAnimation(idle3Animations, true);
      setCurrentAction('idle3');
      setSequenceStep(4);
      onSequenceUpdate?.({ step: 'idle3-before', showLoginBtn: true, showAppointmentBtn: true });
    }
    else if (sequenceStep === 4 && elapsed >= 18) {
      playAnimation(idle2Animations, false);
      setCurrentAction('idle2');
      setSequenceStep(5);
      onSequenceUpdate?.({ step: 'main-idle2', showLoginBtn: true, showAppointmentBtn: true });
    }
    else if (sequenceStep === 5 && elapsed >= 22) {
      playAnimation(idle3Animations, true);
      setCurrentAction('idle3');
      setSequenceStep(6);
      stopAudio(bienvenueAudioRef);
      stopAudio(servicesAudioRef);
      stopAudio(bookAudioRef);
      onSequenceUpdate?.({ step: 'idle3-after', showLoginBtn: true, showAppointmentBtn: true });
    }

    if (sequenceStep > 1 && group.current) {
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }

    // Apply lip-sync morph targets every frame
    if (headMeshRef.current) {
      const mesh = headMeshRef.current;
      
      if (currentMouthRef.current && currentAudioPhase) {
        const morphTargets = getMouthMorphTargets(currentMouthRef.current);

        Object.keys(mesh.morphTargetDictionary).forEach(key => {
          if (key.startsWith('viseme_')) {
            const index = mesh.morphTargetDictionary[key];
            mesh.morphTargetInfluences[index] = 0;
          }
        });

        Object.entries(morphTargets).forEach(([targetName, value]) => {
          const index = mesh.morphTargetDictionary?.[targetName];
          if (index !== undefined && mesh.morphTargetInfluences && value > 0) {
            mesh.morphTargetInfluences[index] = Math.min(value * 1.5, 1.0);
          }
        });
      }
      else if ((sequenceStep === 4 || sequenceStep >= 6) && !currentAudioPhase) {
        Object.keys(mesh.morphTargetDictionary).forEach(key => {
          if (key.startsWith('viseme_')) {
            const index = mesh.morphTargetDictionary[key];
            mesh.morphTargetInfluences[index] = 0;
          }
        });
        
        const smileIndex = mesh.morphTargetDictionary.viseme_E;
        if (smileIndex !== undefined) {
          mesh.morphTargetInfluences[smileIndex] = 0.5;
        }
      }
    }
  });

  // Setup audio event listeners
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

  useEffect(() => {
    return () => {
      stopAudio(bienvenueAudioRef);
      stopAudio(servicesAudioRef);
      stopAudio(bookAudioRef);
    };
  }, []);

  useFrame(() => {
    if (!group.current || headMeshRef.current) return;

    group.current.traverse((child) => {
      if (child.isMesh && child.morphTargetInfluences) {
        const hasMouthMorphs = child.morphTargetDictionary && 
          (child.morphTargetDictionary.viseme_aa !== undefined ||
           child.morphTargetDictionary.mouthOpen !== undefined);
        
        const isHeadMesh = child.name.includes('Head') || child.name.includes('head') || 
                          child.name.includes('Face') || child.name.includes('face');
        
        if (hasMouthMorphs && isHeadMesh && !headMeshRef.current) {
          headMeshRef.current = child;
        }
      }
    });
  });

  const currentMouthRef = useRef('X');
  
  useEffect(() => {
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

// Loading component léger
function Loader() {
  return (
    <mesh>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="#00bcd4" />
    </mesh>
  );
}

// Composant principal avec détection mobile
export default function KineScene() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const isRTL = currentLang === 'ar';
  
  // Détection mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth <= 768 || 
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Refs audio uniquement pour desktop
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

  // Sources audio
  const bienvenueAudioSrc = currentLang === 'ar' ? '/audio/bienvenue-ar.ogg' : '/audio/bienvenue-fr.ogg';
  const servicesAudioSrc = currentLang === 'ar' ? '/audio/services-ar.ogg' : '/audio/services-fr.ogg';
  const bookAudioSrc = currentLang === 'ar' ? '/audio/book-ar.ogg' : '/audio/book-fr.ogg';

  // Desktop : prompt audio après 1.5s
  useEffect(() => {
    if (isMobile) return; // Pas de prompt audio sur mobile
    
    const timer = setTimeout(() => {
      if (!audioUnlocked) {
        setShowAudioPrompt(true);
      }
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [audioUnlocked, isMobile]);

  const unlockAudio = () => {
    if (!audioUnlocked) {
      setAudioUnlocked(true);
      setShowAudioPrompt(false);
    }
  };

  return (
    <div className={`${isMobile ? 'w-full h-[300px]' : 'w-[800px] h-[600px]'} rounded-2xl overflow-hidden relative`}>
      
      {/* Audio elements - Desktop seulement */}
      {!isMobile && (
        <>
          <audio ref={bienvenueAudioRef} src={bienvenueAudioSrc} preload="auto" style={{ display: 'none' }} />
          <audio ref={servicesAudioRef} src={servicesAudioSrc} preload="auto" style={{ display: 'none' }} />
          <audio ref={bookAudioRef} src={bookAudioSrc} preload="auto" style={{ display: 'none' }} />
        </>
      )}
      
      {/* Audio Unlock Prompt - Desktop seulement */}
      {!isMobile && showAudioPrompt && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 max-w-md sm:max-w-md lg:max-w-xl z-50 rounded-xl flex items-center bg-black/10 backdrop-blur-sm px-4 justify-center m-20 sm:m-20 md:m-8"
          onClick={unlockAudio}
        >
          <div className="bg-white/60 rounded-2xl p-8 shadow-2xl text-center max-w-xs sm:max-w-xs lg:max-w-sm w-full">
            <div className="flex justify-center mb-4">
              <Volume2 size={64} className="text-kine-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {currentLang === 'ar' ? 'تفعيل الصوت' : 'Activer le son'}
            </h3>
            <p className="text-gray-600 mb-6">
              {currentLang === 'ar' ? 'انقر في أي مكان لتشغيل الصوت' : 'Cliquez n\'importe où pour activer le son'}
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
      
      {/* Boutons animés - Desktop seulement */}
      {!isMobile && sequenceState.showLoginBtn && (
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

      {!isMobile && sequenceState.showAppointmentBtn && (
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

      {/* Boutons centrés pour mobile */}
      {isMobile && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6">
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <Link 
              to="/book" 
              className="btn bg-kine-600 text-white px-8 py-4 rounded-full hover:bg-kine-700 transition-all text-center font-bold shadow-xl text-lg"
            >
              {t('home.book')}
            </Link>
            <button 
              onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn bg-white text-kine-700 px-8 py-4 rounded-full hover:bg-gray-100 transition-all font-bold shadow-xl text-lg border-2 border-kine-600"
            >
              {t('home.discover')}
            </button>
          </div>
        </div>
      )}

      {/* 3D Canvas */}
      <Canvas 
        shadows={!isMobile} // Pas d'ombres sur mobile
        gl={{ 
          antialias: !isMobile, // Pas d'antialiasing sur mobile
          alpha: true,
          powerPreference: isMobile ? "low-power" : "high-performance",
          stencil: false,
          depth: true
        }}
        dpr={isMobile ? [0.5, 1] : [1, 2]} // Résolution réduite sur mobile
        performance={{ min: isMobile ? 0.2 : 0.5 }}
        frameloop="always"
      >
        <Suspense fallback={<Loader />}>
          {/* Éclairage simplifié sur mobile */}
          <ambientLight intensity={isMobile ? 1.5 : 2} />
          {!isMobile && (
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
          )}
          {!isMobile && <spotLight position={[-5, 5, 2]} intensity={1} />}

          {/* Caméra adaptée au mobile */}
          <PerspectiveCamera 
            makeDefault 
            position={isMobile ? [-6, 0, 2] : (isRTL ? [-10, 1, -3] : [-10, 1, 3])} 
            fov={isMobile ? 60 : 30}
          />

          {/* Personnage - Seulement sur desktop */}
          {!isMobile && (
            <DesktopKineCharacter 
              onSequenceUpdate={handleSequenceUpdate} 
              currentLang={currentLang}
              bienvenueAudioRef={bienvenueAudioRef}
              servicesAudioRef={servicesAudioRef}
              bookAudioRef={bookAudioRef}
              audioUnlocked={audioUnlocked}
            />
          )}

          {/* Ground seulement sur desktop */}
          {!isMobile && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
              <planeGeometry args={[10, 10]} />
              <shadowMaterial opacity={0.2} />
            </mesh>
          )}

          {/* Contrôles désactivés sur mobile */}
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            enabled={!isMobile}
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

// Preload uniquement sur desktop (toutes les ressources)
if (typeof window !== 'undefined' && window.innerWidth > 768) {
  useGLTF.preload(getModelUrl('kine-character.glb'));
  useFBX.preload(getAnimationUrl('idle.fbx'));
  useFBX.preload(getAnimationUrl('Idle2.fbx'));
  useFBX.preload(getAnimationUrl('Idle3.fbx'));
  useFBX.preload(getAnimationUrl('talking.fbx'));
  useFBX.preload(getAnimationUrl('talking2.fbx'));
  useFBX.preload(getAnimationUrl('walking.fbx'));
  useFBX.preload(getAnimationUrl('hello.fbx'));
}