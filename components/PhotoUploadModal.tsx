import { useState, ChangeEvent, ReactElement } from 'react';
import api from '../src/services/api';

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (photoUrl: string) => void;
}

export default function PhotoUploadModal({ isOpen, onClose, onSuccess }: PhotoUploadModalProps): ReactElement | null {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | ArrayBuffer | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size (5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      setFile(selectedFile);
      setError('');

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('photo', file);

    try {
      const response = await api.post('/teachers/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setFile(null);
      setPreview(null);
      onSuccess(response.data.photoUrl);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload photo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-[#001A72] mb-4">Upload Profile Photo</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="mb-6">
          {preview ? (
            <div className="flex justify-center mb-4">
              <img
                src={preview as string}
                alt="Preview"
                className="w-32 h-32 rounded-full border-4 border-[#001A72] object-cover"
              />
            </div>
          ) : (
            <div className="w-32 h-32 mx-auto rounded-full border-4 border-dashed border-[#FFB81C] flex items-center justify-center bg-gray-50">
              <span className="text-4xl">📷</span>
            </div>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Image (JPG, PNG, GIF)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001A72] focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Max file size: 5MB</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="flex-1 bg-[#001A72] text-white py-2 rounded-lg font-semibold hover:bg-[#001A72]/90 disabled:opacity-50 transition"
          >
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}
