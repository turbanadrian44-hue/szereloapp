
import { TextureType, PhotoEvidence } from './types';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from './config';

export const getTextureStyle = (type: TextureType, isDark: boolean) => {
  if (type === 'carbon') {
    return {
      backgroundImage: `radial-gradient(circle, ${isDark ? '#333' : '#e5e7eb'} 20%, transparent 20%), radial-gradient(circle, ${isDark ? '#333' : '#e5e7eb'} 20%, transparent 20%)`,
      backgroundSize: '10px 10px',
      backgroundPosition: '0 0, 5px 5px',
      backgroundColor: isDark ? '#1a1a1a' : '#f8fafc'
    };
  }
  if (type === 'metal') {
    return {
      backgroundImage: `repeating-linear-gradient(45deg, ${isDark ? '#262626' : '#f1f5f9'} 0, ${isDark ? '#262626' : '#f1f5f9'} 1px, transparent 0, transparent 50%)`,
      backgroundSize: '10px 10px',
      backgroundColor: isDark ? '#171717' : '#ffffff'
    };
  }
  return { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }; 
};

export const uploadImageToCloudinary = async (photo: PhotoEvidence): Promise<string | null> => {
  if (photo.cloudUrl) return photo.cloudUrl;
  if (photo.url.startsWith('http') && !photo.url.startsWith('blob:')) return photo.url;

  try {
    const blobResponse = await fetch(photo.url);
    const blob = await blobResponse.blob();
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('Upload failed');
    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return null;
  }
};

export const formatLicensePlate = (value: string) => {
  let clean = value.toUpperCase();
  if (/^[A-Z0-9]{6}$/.test(clean)) {
     return `${clean.slice(0,3)}-${clean.slice(3)}`;
  }
  return clean;
};

export const formatPhoneNumber = (value: string) => value.replace(/[^\d+ ]/g, '');

export const formatCost = (value: string) => {
  const number = parseInt(value.replace(/\D/g, '')) || 0;
  return number === 0 ? '' : number.toLocaleString('hu-HU');
};

export const parseCost = (value: string) => parseInt(value.replace(/\D/g, '')) || 0;
