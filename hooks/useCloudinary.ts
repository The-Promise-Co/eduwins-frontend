import { useState } from 'react';

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  [key: string]: any;
}

export const useCloudinary = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    setError(null);

    // Retrieve from environment variables
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      const errMsg = 'Cloudinary credentials are not configured.';
      setError(errMsg);
      setIsUploading(false);
      console.error(errMsg);
      return null;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to upload image to Cloudinary.');
      }

      const data: CloudinaryUploadResult = await response.json();
      setIsUploading(false);
      return data.secure_url;
    } catch (err: any) {
      console.error('Cloudinary Upload Error:', err);
      setError(err.message || 'Image upload failed');
      setIsUploading(false);
      return null;
    }
  };

  return { uploadFile, isUploading, error };
};
