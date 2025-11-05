// Configuration for 3D model storage
// Change this when moving to production CDN

const isDevelopment = import.meta.env.DEV;

// Option 1: Local development
const LOCAL_BASE_URL = '/models/';
const ANIMATIONS_LOCAL_URL = '/animations/';

// Option 2: Cloudinary (Production)
// Get cloud name from environment variable or use default
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'doq0mdnkz';
// Using image/upload since that's where the files were uploaded
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/`;
const CLOUDINARY_ANIMATIONS_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/raw/upload/v1/animations/`;

// Option 3: AWS S3 (Production)
const S3_BASE_URL = 'https://your-bucket.s3.amazonaws.com/models/';
const S3_ANIMATIONS_URL = 'https://your-bucket.s3.amazonaws.com/animations/';

// Option 4: Other CDN
const CDN_BASE_URL = 'https://cdn.yourdomain.com/models/';
const CDN_ANIMATIONS_URL = 'https://cdn.yourdomain.com/animations/';

// Choose your storage provider
const USE_CDN = true; // Set to true to use Cloudinary, false for local files

export const MODELS_BASE_URL = USE_CDN ? CLOUDINARY_BASE_URL : LOCAL_BASE_URL;
export const ANIMATIONS_BASE_URL = USE_CDN ? CLOUDINARY_ANIMATIONS_URL : ANIMATIONS_LOCAL_URL;

// Map of model filenames to their Cloudinary public IDs with version
const CLOUDINARY_MODEL_IDS = {
  'skeleton.glb': 'v1761856428/skeleton_luclyp.glb',
  'leg.glb': 'v1761856423/leg_dvxsam.glb',
  'brain.glb': 'v1762065961/brain_dej0hb.glb',
  'heart.glb': 'v1762024371/heart_hvix05.glb',
  'baby.glb': 'v1762025341/baby_xhnkfq.glb',
  'old.glb': 'v1762025960/old_zeubzt.glb',
  'hijama.glb': 'v1762065923/hijama_tuclaj.glb',
  // kine-character.glb uses local file with Oculus Visemes (not Cloudinary)
};

// Map of animation filenames to their Cloudinary public IDs with version
const CLOUDINARY_ANIMATION_IDS = {
  'idle.fbx': 'v1761866929/idle_aj2n6e.fbx',
  'Idle2.fbx': 'v1761866929/Idle2_mjhmtn.fbx',
  'Idle3.fbx': 'v1761866930/Idle3_dd9erq.fbx',
  'talking.fbx': 'v1761866934/talking_iqfof9.fbx',
  'talking2.fbx': 'v1761866935/talking2_luu3jt.fbx',
  'walking.fbx': 'v1761866936/walking_urqmec.fbx',
  'hello.fbx': 'v1761866928/hello_hecqh5.fbx',
  'pointing.fbx': 'v1761866931/pointing_utm4fe.fbx',
  'old.fbx': 'v1761866931/old_rpk9tf.fbx',
};

// Helper function to get model URL
export const getModelUrl = (filename) => {
  // Force kine-character.glb to always use local file (has Oculus Visemes)
  if (filename === 'kine-character.glb') {
    return `${LOCAL_BASE_URL}${filename}`;
  }
  
  if (USE_CDN && CLOUDINARY_MODEL_IDS[filename]) {
    return `${CLOUDINARY_BASE_URL}${CLOUDINARY_MODEL_IDS[filename]}`;
  }
  return `${MODELS_BASE_URL}${filename}`;
};

// Helper function to get animation URL
export const getAnimationUrl = (filename) => {
  if (USE_CDN && CLOUDINARY_ANIMATION_IDS[filename]) {
    // Animations should use raw/upload type
    const rawUrl = CLOUDINARY_BASE_URL.replace('/image/upload/', '/raw/upload/');
    return `${rawUrl}${CLOUDINARY_ANIMATION_IDS[filename]}`;
  }
  return `${ANIMATIONS_BASE_URL}${filename}`;
};

// Preload important models (optional)
export const PRELOAD_MODELS = [
  'skeleton.glb',
  'heart.glb',
  'brain.glb'
];
