import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuration du stockage en mémoire (multer)
const storage = multer.memoryStorage();

// Middleware multer avec validation
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite de 5MB
  },
  fileFilter: (req, file, cb) => {
    // Vérifier le type MIME
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé. Seuls les images (JPG, PNG) et PDF sont acceptés.'));
    }
  }
});

// Fonction helper pour uploader sur Cloudinary
const uploadToCloudinary = (fileBuffer, filename, mimetype) => {
  return new Promise((resolve, reject) => {
    const resourceType = mimetype === 'application/pdf' ? 'raw' : 'image';
    
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'kineverse/medical-certificates',
        resource_type: resourceType,
        public_id: `certificate_${Date.now()}`,
        transformation: resourceType === 'image' ? [
          { width: 1500, height: 1500, crop: 'limit' }
        ] : undefined
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

export { cloudinary, upload, uploadToCloudinary };
