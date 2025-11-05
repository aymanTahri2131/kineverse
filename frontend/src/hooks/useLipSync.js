import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for Rhubarb lip-sync integration
 * Loads and processes Rhubarb JSON data for mouth shape animation
 * @param {Object} audioRef - Reference to audio element
 * @param {string} language - Language code ('ar' or 'fr')
 * @param {string} audioName - Name of the audio file (e.g., 'bienvenue', 'services', 'book')
 */
export function useLipSync(audioRef, language, audioName = 'script') {
  const [mouthCues, setMouthCues] = useState([]);
  const [currentMouth, setCurrentMouth] = useState('X'); // X = closed/neutral
  const animationFrameRef = useRef();

  // Rhubarb mouth shapes mapping
  // A, B, C, D, E, F, G, H, X
  // A = open mouth (ah)
  // B = lips together (b, p, m)
  // C = closed teeth (s, z)
  // D = tongue up (t, d, n, l)
  // E = mouth narrow (e, i)
  // F = lips narrow (f, v)
  // G = back of tongue (k, g, ng)
  // H = mouth wide (sh, ch)
  // X = closed/neutral

  // Load lip-sync JSON file
  useEffect(() => {
    const loadLipSync = async () => {
      try {
        // Build JSON path based on audioName and language
        const jsonPath = `/audio/${audioName}-${language}.json`;
        const response = await fetch(jsonPath);
        const data = await response.json();
        
        if (data.mouthCues) {
          setMouthCues(data.mouthCues);
        }
      } catch (error) {
        console.error(`Failed to load lip-sync data:`, error);
      }
    };

    loadLipSync();
  }, [language, audioName]);

  // Update mouth shape based on audio time
  useEffect(() => {
    if (!audioRef.current || mouthCues.length === 0) return;

    const audio = audioRef.current;
    let lastMouth = 'X'; // Cache to avoid unnecessary state updates

    const updateMouth = () => {
      const currentTime = audio.currentTime;
      
      // Find the current mouth shape based on time
      const currentCue = mouthCues.find((cue, index) => {
        const nextCue = mouthCues[index + 1];
        const endTime = nextCue ? nextCue.start : Infinity;
        return currentTime >= cue.start && currentTime < endTime;
      });

      const newMouth = currentCue ? currentCue.value : 'X';
      
      // Only update state if mouth shape actually changed
      if (newMouth !== lastMouth) {
        lastMouth = newMouth;
        setCurrentMouth(newMouth);
      }

      animationFrameRef.current = requestAnimationFrame(updateMouth);
    };

    const handlePlay = () => {
      updateMouth();
    };

    const handlePause = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setCurrentMouth('X');
    };

    const handleEnded = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setCurrentMouth('X');
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioRef, mouthCues]);

  return currentMouth;
}

/**
 * Get morph target influences for a given mouth shape
 * Compatible with ReadyPlayerMe Oculus Visemes
 */
export function getMouthMorphTargets(mouthShape) {
  // Initialize all Oculus viseme morph targets to 0
  const morphTargets = {
    viseme_sil: 0,  // Silence
    viseme_PP: 0,   // P, B, M
    viseme_FF: 0,   // F, V
    viseme_TH: 0,   // TH
    viseme_DD: 0,   // T, D
    viseme_kk: 0,   // K, G
    viseme_CH: 0,   // CH, SH
    viseme_SS: 0,   // S, Z
    viseme_nn: 0,   // N, NG
    viseme_RR: 0,   // R
    viseme_aa: 0,   // AA (open)
    viseme_E: 0,    // E
    viseme_I: 0,    // I
    viseme_O: 0,    // O
    viseme_U: 0     // U
  };

  // Map Rhubarb shapes (A-H, X) to Oculus visemes
  switch (mouthShape) {
    case 'A': // Wide open mouth (ah) - AA sound
      morphTargets.viseme_aa = 0.5;
      break;
    case 'B': // Lips together (b, p, m) - PP sound
      morphTargets.viseme_PP = 0.5;
      break;
    case 'C': // Closed teeth (s, z) - SS sound
      morphTargets.viseme_SS = 0.5;
      break;
    case 'D': // Tongue up (t, d, n, l) - DD sound
      morphTargets.viseme_DD = 0.5;
      break;
    case 'E': // Narrow mouth (e, i) - E/I sound
      morphTargets.viseme_E = 0.7;
      morphTargets.viseme_I = 0.3;
      break;
    case 'F': // Narrow lips (f, v) - FF sound
      morphTargets.viseme_FF = 0.5;
      break;
    case 'G': // Back of tongue (k, g, ng) - kk sound
      morphTargets.viseme_kk = 0.5;
      break;
    case 'H': // Wide mouth (sh, ch) - CH sound
      morphTargets.viseme_CH = 0.5;
      break;
    case 'X': // Closed/neutral - silence
    default:
      morphTargets.viseme_sil = 0.5;
      break;
  }

  return morphTargets;
}
