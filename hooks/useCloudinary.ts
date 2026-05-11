import { useState } from 'react';
import axios from 'axios';
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

export const useCloudinary = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (
    file: File,
    folder = 'eduwins',
    resourceType: 'image' | 'video' | 'raw' = 'image',
  ): Promise<string | null> => {
    setIsUploading(true);
    setProgress(0);
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

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            setProgress(percentCompleted);
          },
        }
      );

      return response.data.secure_url;
    } catch (err: any) {
      console.error('Cloudinary upload error:', err);
      const msg = err.response?.data?.error?.message || err.message || 'Upload failed';
      setError(msg);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFile, isUploading, progress, error, setError };
};
