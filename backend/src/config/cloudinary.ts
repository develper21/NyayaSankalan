import { v2 as cloudinary } from 'cloudinary';
import { config } from './env';

// Configure Cloudinary with credentials
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
  secure: true, // Always use HTTPS
});

// Validate Cloudinary configuration
export const validateCloudinaryConfig = (): boolean => {
  const { cloudName, apiKey, apiSecret } = config.cloudinary;
  
  if (!cloudName || !apiKey || !apiSecret) {
    console.warn('⚠️  Cloudinary credentials not configured. File uploads will fail.');
    return false;
  }
  
  console.log('✅ Cloudinary configured successfully');
  return true;
};

export { cloudinary };
