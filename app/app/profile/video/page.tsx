'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, CheckCircle2, MonitorUp, PauseCircle, PlayCircle, Square, Upload, Video } from 'lucide-react';
import PageHeader from '@/misc/components/PageHeader';
import { useProfileCompletion } from '@/misc/hooks/api/uploads';
import { useUpdateProfile } from '@/misc/hooks/api/auth';
import { useUser } from '@/misc/context/UserContext';
import { useR2 } from '@/misc/hooks/useR2';
import { TeacherProfile } from '@/misc/types';
import { toast } from 'sonner';

const MAX_VIDEO_MB = 10;
const MAX_RECORD_SECONDS = 90;

export default function ProfileVideoPage() {
  const router = useRouter();
  const { user: ctxUser, refreshUser } = useUser();
  const { uploadFile, isUploading } = useR2();
  const updateProfile = useUpdateProfile();
  const completionQuery = useProfileCompletion();
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [user, setUser] = useState<TeacherProfile | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [recordedPreview, setRecordedPreview] = useState('');
  const [recordedFile, setRecordedFile] = useState<File | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeTab, setActiveTab] = useState<'upload' | 'record'>('upload');

  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (!userJson) return router.push('/login');
    const userData = JSON.parse(userJson) as TeacherProfile & { videoVerified?: string };
    if (userData.role !== 'teacher') return router.replace('/app/profile');
    setUser(userData);
    setVideoUrl(userData.intro_video || userData.videoVerified || '');
  }, [router]);

  useEffect(() => {
    if (ctxUser?.role !== 'teacher') return;
    setUser(ctxUser);
    setVideoUrl(ctxUser.intro_video || (ctxUser as any).videoVerified || '');
  }, [ctxUser]);

  useEffect(() => {
    return () => {
      stopCamera();
      if (recordedPreview) URL.revokeObjectURL(recordedPreview);
    };
  }, [recordedPreview]);

  useEffect(() => {
    if (!isRecording || isPaused) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((seconds) => {
        if (seconds + 1 >= MAX_RECORD_SECONDS) {
          window.setTimeout(() => stopRecording(), 0);
          return MAX_RECORD_SECONDS;
        }
        return seconds + 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isRecording, isPaused]);

  const persistVideo = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file.');
      return;
    }

    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > MAX_VIDEO_MB) {
      toast.error(`Video is too large (${sizeInMB.toFixed(1)}MB). Max allowed is ${MAX_VIDEO_MB}MB.`);
      return;
    }

    try {
      const nextVideoUrl = await uploadFile(file, 'profile-videos');
      if (!nextVideoUrl) {
        toast.error('Failed to upload video intro.');
        return;
      }
      await updateProfile.mutateAsync({ videoVerified: nextVideoUrl });
      const updated = { ...(user || {}), intro_video: nextVideoUrl, videoVerified: nextVideoUrl } as TeacherProfile & { videoVerified?: string };
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      setVideoUrl(nextVideoUrl);
      setRecordedFile(null);
      setRecordedPreview('');
      await refreshUser();
      await completionQuery.refetch();
      toast.success('Video intro uploaded successfully.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to upload video intro.');
    }
  };

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    await persistVideo(file);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (liveVideoRef.current) liveVideoRef.current.srcObject = stream;
      setIsCameraReady(true);
    } catch (err) {
      toast.error('Camera or microphone permission was denied.');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (liveVideoRef.current) liveVideoRef.current.srcObject = null;
    setIsCameraReady(false);
    setIsRecording(false);
    setIsPaused(false);
  };

  const startRecording = async () => {
    if (!streamRef.current) await startCamera();
    if (!streamRef.current) return;

    chunksRef.current = [];
    setElapsedSeconds(0);
    setIsPaused(false);
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm';
    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const file = new File([blob], `teacher-video-intro-${Date.now()}.webm`, { type: 'video/webm' });
      if (recordedPreview) URL.revokeObjectURL(recordedPreview);
      setRecordedFile(file);
      setRecordedPreview(URL.createObjectURL(blob));
    };
    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop();
    setIsRecording(false);
    setIsPaused(false);
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state !== 'recording') return;
    mediaRecorderRef.current.pause();
    setIsPaused(true);
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state !== 'paused') return;
    mediaRecorderRef.current.resume();
    setIsPaused(false);
  };

  const uploadRecordedVideo = async () => {
    if (!recordedFile) return toast.error('Record a video first.');
    await persistVideo(recordedFile);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <PageHeader title="Teacher Video" subtitle="Upload an intro video from your computer or record one with your webcam" />

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between gap-3 border-b border-gray-50 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600"><Video size={16} /></div>
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-700">Video Intro</h2>
          </div>
          {videoUrl && <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-600"><CheckCircle2 size={11} /> Active</span>}
        </div>

        {videoUrl ? (
          <div className="rounded-2xl overflow-hidden bg-black border border-gray-100 aspect-video">
            <video src={videoUrl} controls className="h-full w-full object-contain" />
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
            No intro video uploaded yet. Add a short video that introduces your teaching style and subjects.
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-gray-50 p-1.5 border border-gray-100">
          <button type="button" onClick={() => setActiveTab('upload')} className={`rounded-xl px-4 py-3 text-xs font-black uppercase tracking-wider transition ${activeTab === 'upload' ? 'bg-[#001A72] text-white shadow-sm' : 'text-gray-500 hover:bg-white'}`}>Upload from Computer</button>
          <button type="button" onClick={() => setActiveTab('record')} className={`rounded-xl px-4 py-3 text-xs font-black uppercase tracking-wider transition ${activeTab === 'record' ? 'bg-[#001A72] text-white shadow-sm' : 'text-gray-500 hover:bg-white'}`}>Record Webcam</button>
        </div>

        {activeTab === 'upload' ? (
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <MonitorUp size={16} className="text-[#001A72]" />
              <h3 className="text-sm font-black text-gray-800">Upload from Computer</h3>
            </div>
            <p className="text-xs text-gray-500">Choose an MP4, WebM, or MOV file. Maximum size is {MAX_VIDEO_MB}MB. Uploads use the same direct R2 flow as course videos.</p>
            <label className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-wider transition ${isUploading || updateProfile.isPending ? 'bg-gray-100 text-gray-400' : 'bg-[#001A72] text-white hover:bg-[#0028a8] cursor-pointer'}`}>
              <Upload size={14} /> {isUploading || updateProfile.isPending ? 'Uploading...' : 'Choose Video'}
              <input type="file" accept="video/*" onChange={handleFileSelect} disabled={isUploading || updateProfile.isPending} className="hidden" />
            </label>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Camera size={16} className="text-purple-600" />
                <h3 className="text-sm font-black text-gray-800">Record with Webcam</h3>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${elapsedSeconds >= MAX_RECORD_SECONDS ? 'bg-red-50 text-red-600' : 'bg-white text-gray-600'}`}>{formatTime(elapsedSeconds)} / 01:30</span>
            </div>
            <div className="overflow-hidden rounded-xl bg-black aspect-video">
              {recordedPreview ? (
                <video src={recordedPreview} controls className="h-full w-full object-contain" />
              ) : (
                <video ref={liveVideoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {!isCameraReady && !recordedPreview && <button type="button" onClick={startCamera} className="col-span-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-wider text-[#001A72]">Enable Camera</button>}
              {isCameraReady && !isRecording && !recordedPreview && <button type="button" onClick={startRecording} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-xs font-black uppercase tracking-wider text-white"><PlayCircle size={14} /> Record</button>}
              {isRecording && !isPaused && <button type="button" onClick={pauseRecording} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-xs font-black uppercase tracking-wider text-white"><PauseCircle size={14} /> Pause</button>}
              {isRecording && isPaused && <button type="button" onClick={resumeRecording} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-xs font-black uppercase tracking-wider text-white"><PlayCircle size={14} /> Resume</button>}
              {isRecording && <button type="button" onClick={stopRecording} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-xs font-black uppercase tracking-wider text-white"><Square size={14} /> Stop</button>}
              {isCameraReady && <button type="button" onClick={stopCamera} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-wider text-gray-500">Close Camera</button>}
              {recordedPreview && <button type="button" onClick={() => { URL.revokeObjectURL(recordedPreview); setRecordedPreview(''); setRecordedFile(null); setElapsedSeconds(0); }} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-wider text-gray-500">Discard</button>}
              {recordedPreview && <button type="button" onClick={uploadRecordedVideo} disabled={isUploading || updateProfile.isPending} className="rounded-xl bg-[#001A72] px-4 py-3 text-xs font-black uppercase tracking-wider text-white disabled:opacity-60">{isUploading || updateProfile.isPending ? 'Uploading...' : 'Use Recording'}</button>}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
