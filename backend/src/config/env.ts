import 'dotenv/config';

interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

interface Config {
  port: number;
  jwtSecret: string;
  jwtExpiry: string;
  databaseUrl: string;
  nodeEnv: string;
  aiPocUrl: string;
  cloudinary: CloudinaryConfig;
}

const getConfig = (): Config => {
  return {
    port: parseInt(process.env.PORT || '5000', 10),
    jwtSecret: process.env.JWT_SECRET || 'nyayasankalan-super-secret-key-change-in-production',
    jwtExpiry: process.env.JWT_EXPIRY || '24h',
    databaseUrl: process.env.DATABASE_URL || '',
    nodeEnv: process.env.NODE_ENV || 'development',
    aiPocUrl: process.env.AI_POC_URL || 'http://localhost:8001',
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
      apiKey: process.env.CLOUDINARY_API_KEY || '',
      apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    },
  };
};

export const config = getConfig();
