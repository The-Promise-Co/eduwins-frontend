import { useState } from 'react';
import api from '../services/api';

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  [key: string]: any;
}

interface SignResponse {
  signature: string;
  timestamp: number;
  folder: string;
  apiKey: string;
  cloudName: string;
}

/**
 * Signed Cloudinary upload hook.
 *
 * Flow:
 *  1. Request a short-lived signature from the backend (POST /uploads/sign).
 *     The API secret never leaves the server.
 *  2. Upload the file directly to Cloudinary using the API key + signature.
 *
 * Backend env vars required:
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 *   CLOUDINARY_CLOUD_NAME
 */
export const useCloudinary = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (
    file: File,
    folder = 'eduwins',
  ): Promise<string | null> => {
    setIsUploading(true);
    setError(null);

    try {
      // Step 1 — get signature from backend
      const { data: signData } = await api.post<SignResponse>('/uploads/sign', { folder });
      const { signature, timestamp, apiKey, cloudName } = signData;

      if (!cloudName || !apiKey || !signature) {
        throw new Error('Incomplete signing data received from server.');
      }

      // Step 2 — upload directly to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);
      formData.append('timestamp', String(timestamp));
      formData.append('signature', signature);
      formData.append('folder', folder);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData },
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message || 'Upload to Cloudinary failed.');
      }

      const data: CloudinaryUploadResult = await response.json();
      return data.secure_url;
    } catch (err: any) {
      console.error('Cloudinary upload error:', err);
      setError(err.message || 'Image upload failed');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFile, isUploading, error };
};
