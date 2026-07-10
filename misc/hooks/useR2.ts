import { useState } from 'react';
import axios from 'axios';
import api from '../services/api';
import { useMutation } from '@tanstack/react-query';

interface R2SignResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

export const useR2 = () => {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const uploadMutation = useMutation<string | null, unknown, { file: File; folder?: string }>({
    mutationFn: async ({ file, folder = 'eduwins' }) => {
      // Step 1 — Get presigned upload URL from backend
      const { data } = await api.post<R2SignResponse>('/uploads/sign', {
        filename: file.name,
        contentType: file.type,
        folder,
      });
      console.log(data, "SIGN DATA")
      const { uploadUrl, publicUrl } = data;

      if (!uploadUrl || !publicUrl) {
        throw new Error('Incomplete upload configuration received from server.');
      }

      console.log(data, "SIGN DATA")

      // Step 2 — Upload directly to Cloudflare R2
      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setProgress(percentCompleted);
        },
      });

      return publicUrl;
    },
    onMutate: () => {
      setProgress(0);
      setError(null);
    },
    onError: (err: any) => {
      // console.log(err, "ERROR")
      console.error('R2 upload error:', err);
      const msg = err.response?.data?.error || err.message || 'Upload failed';
      setError(msg);
    },
  });

  const uploadFile = async (
    file: File,
    folder = 'eduwins',
  ): Promise<string | null> => {
    try {
      return await uploadMutation.mutateAsync({ file, folder });
    } catch {
      return null;
    }
  };

  return { uploadFile, isUploading: uploadMutation.isPending, progress, error, setError };
};
