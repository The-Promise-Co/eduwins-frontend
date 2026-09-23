'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, BookOpen, Calendar, Check, CheckCircle, ChevronDown, ChevronRight, Clock, Copy, Download, FileText, Lock, Loader2, Mic, MicOff, Save, Users, Video, VideoOff } from 'lucide-react';
import Button from '@/misc/components/Button';
import LiveKitSession from '@/misc/components/LiveKitSession';
import SessionCountdownBanner from '@/misc/components/SessionCountdownBanner';
import { useBooking } from '@/misc/hooks/api/bookings';
import { useLiveKitToken, useSessionChildCodes, useSessionEvents } from '@/misc/hooks/api/session';
import { useSavePersonalNotes, useSaveSharedNotes, useSessionNotes } from '@/misc/hooks/api/notes';
import { useUser } from '@/misc/context/UserContext';
import { useSessionUi } from '@/misc/context/SessionUiContext';
import { Booking } from '@/misc/types';
import { computeSessionTiming } from '@/misc/utils/sessionTiming';
import { formatTimeRange } from '@/misc/utils/time';
import { toast } from 'sonner';

function fullName(person?: { firstName?: string; lastName?: string } | null) {
  return `${person?.firstName || ''} ${person?.lastName || ''}`.trim() || 'Unknown';
}

const formatDate = (value?: string) => {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;
  const { user } = useUser();
  const { setInCall } = useSessionUi();

  const bookingQuery = useBooking(bookingId);
  const tokenQuery = useLiveKitToken(bookingId);
  const childCodesQuery = useSessionChildCodes(bookingId);
  const eventsQuery = useSessionEvents(bookingId);

  const [joinState, setJoinState] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const [disconnected, setDisconnected] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Preview state
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [selectedMicId, setSelectedMicId] = useState<string>('');
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [cameraDropdownOpen, setCameraDropdownOpen] = useState(false);
  const [micDropdownOpen, setMicDropdownOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number>();
  const levelBarRef = useRef<HTMLDivElement | null>(null);
  const levelTextRef = useRef<HTMLParagraphElement | null>(null);
  const isActiveRef = useRef(true);
  const cameraEnabledRef = useRef(cameraEnabled);
  const micEnabledRef = useRef(micEnabled);
  const selectedCameraIdRef = useRef(selectedCameraId);
  const selectedMicIdRef = useRef(selectedMicId);

  const booking = bookingQuery.data;
  const isTeacher = user?.role === 'teacher';
  const participantRole = isTeacher ? 'teacher' as const : 'parent' as const;
  const participantName = user ? fullName(user) : 'Participant';
  const hasChildren = booking?.bookingFor === 'children';
  const timing = booking ? computeSessionTiming(booking) : null;

  const handleCopyCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Code copied!');
    setTimeout(() => setCopiedCode(null), 2000);
  }, []);

  const handleCopyAllCodes = useCallback(() => {
    if (!childCodesQuery.data?.codes) return;
    const text = childCodesQuery.data.codes
      .map((c) => `${c.childName}: ${c.code}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    toast.success('All codes copied!');
  }, [childCodesQuery.data]);

  // Keep refs in sync so async preview flows never read stale values
  useEffect(() => { cameraEnabledRef.current = cameraEnabled; }, [cameraEnabled]);
  useEffect(() => { micEnabledRef.current = micEnabled; }, [micEnabled]);
  useEffect(() => { selectedCameraIdRef.current = selectedCameraId; }, [selectedCameraId]);
  useEffect(() => { selectedMicIdRef.current = selectedMicId; }, [selectedMicId]);

  // Lock the app nav collapsed while the live session is connected
  useEffect(() => {
    setInCall(joinState === 'connected' && !disconnected && !timing?.isEnded);
    return () => setInCall(false);
  }, [joinState, disconnected, timing?.isEnded, setInCall]);

  // Audio meter updates the DOM directly so it never re-renders (and never reloads) the video
  const startAudioMeter = useCallback((stream: MediaStream) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (!micEnabledRef.current || stream.getAudioTracks().length === 0) return;

    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const updateAudioLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
      const level = Math.min(100, Math.round((average / 128) * 100));
      if (levelBarRef.current) levelBarRef.current.style.width = `${level}%`;
      if (levelTextRef.current) levelTextRef.current.textContent = `${level}%`;
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    };
    updateAudioLevel();
  }, []);

  const startPreview = useCallback(async () => {
    setPreviewError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      const constraints: MediaStreamConstraints = {
        video: cameraEnabledRef.current ? { deviceId: selectedCameraIdRef.current ? { exact: selectedCameraIdRef.current } : undefined, facingMode: 'user' } : false,
        audio: micEnabledRef.current ? { deviceId: selectedMicIdRef.current ? { exact: selectedMicIdRef.current } : undefined } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (!isActiveRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      streamRef.current = stream;
      setPreviewStream(stream);

      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = deviceList.filter(d => d.kind === 'videoinput');
      const audioInputs = deviceList.filter(d => d.kind === 'audioinput');
      setDevices([...videoInputs, ...audioInputs]);

      setSelectedCameraId(prev => prev || videoInputs[0]?.deviceId || '');
      setSelectedMicId(prev => prev || audioInputs[0]?.deviceId || '');

      startAudioMeter(stream);
      setPreviewing(true);
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPreviewError('Camera/microphone access denied. Please enable permissions in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setPreviewError('No camera or microphone found. Please connect a device and try again.');
      } else {
        setPreviewError(`Unable to start preview: ${err.message}`);
      }
      setPreviewing(false);
    }
  }, [startAudioMeter]);

  const stopPreview = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setPreviewStream(null);
    setPreviewing(false);
    if (levelBarRef.current) levelBarRef.current.style.width = '0%';
    if (levelTextRef.current) levelTextRef.current.textContent = '0%';
  }, []);

  const toggleCamera = useCallback(() => {
    const next = !cameraEnabledRef.current;
    cameraEnabledRef.current = next;
    setCameraEnabled(next);
    if (next && previewing) {
      startPreview();
    } else {
      streamRef.current?.getVideoTracks().forEach(track => { track.enabled = next; });
    }
  }, [previewing, startPreview]);

  const toggleMic = useCallback(() => {
    const next = !micEnabledRef.current;
    micEnabledRef.current = next;
    setMicEnabled(next);
    if (next && previewing) {
      startPreview();
    } else {
      streamRef.current?.getAudioTracks().forEach(track => { track.enabled = next; });
    }
  }, [previewing, startPreview]);

  const switchCamera = useCallback((deviceId: string) => {
    selectedCameraIdRef.current = deviceId;
    setSelectedCameraId(deviceId);
    if (previewing) startPreview();
  }, [previewing, startPreview]);

  const switchMic = useCallback((deviceId: string) => {
    selectedMicIdRef.current = deviceId;
    setSelectedMicId(deviceId);
    if (previewing) startPreview();
  }, [previewing, startPreview]);

  // Attach the stream to the <video> only when the stream/preview state changes
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = previewStream;
  }, [previewStream, previewing]);

  // Cleanup on unmount only
  useEffect(() => {
    isActiveRef.current = true;
    return () => {
      isActiveRef.current = false;
      stopPreview();
    };
  }, [stopPreview]);

  // Auto-start camera & microphone preview on load
  const didAutoStartRef = useRef(false);
  useEffect(() => {
    if (didAutoStartRef.current) return;
    didAutoStartRef.current = true;
    startPreview();
  }, [startPreview]);

  // Auto-redirect on validation failure
  useEffect(() => {
    if (tokenQuery.isError) {
      router.push('/app/schedule');
    }
  }, [tokenQuery.isError, router]);

  // Auto-redirect if booking date is in the past
  useEffect(() => {
    if (booking) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const scheduled = new Date(`${booking.scheduledDate}T00:00:00`);
      if (!Number.isNaN(scheduled.getTime()) && scheduled.getTime() < today.getTime()) {
        router.push('/app/schedule');
      }
    }
  }, [booking, router]);

  const handleJoin = () => {
    if (!tokenQuery.data) return;
    stopPreview();
    setJoinState('connecting');
    setTimeout(() => setJoinState('connected'), 500);
  };

  // --- LOADING ---
  if (bookingQuery.isLoading || tokenQuery.isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={22} className="animate-spin text-gray-400 mr-2" /> Loading session...
      </div>
    );
  }

  // --- REDIRECTING (token validation failed) ---
  if (tokenQuery.isError) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={22} className="animate-spin text-gray-400 mr-2" /> Redirecting...
      </div>
    );
  }

  // --- BOOKING ERROR ---
  if (bookingQuery.isError || !booking) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <p className="text-sm font-bold text-gray-700">Could not load session.</p>
        <button onClick={() => router.push('/app/schedule')} className="text-xs font-bold text-[#001A72] underline">
          Return to Bookings
        </button>
      </div>
    );
  }

  // --- POST SESSION (Disconnected or Timing Ended) ---
  if (disconnected || timing?.isEnded) {
    return (
      <PostSessionView
        booking={booking}
        bookingId={bookingId}
        participantRole={participantRole}
        isTeacher={isTeacher}
        isSessionEnded={!!timing?.isEnded}
        onRejoin={() => {
          setDisconnected(false);
          setJoinState('idle');
          void tokenQuery.refetch();
        }}
        onReturn={() => router.push('/app/schedule')}
      />
    );
  }

  // --- CONNECTED → SESSION VIEW ---
  if (joinState === 'connected' && tokenQuery.data) {
    return (
      <div className="flex-1 min-h-0 w-full h-full">
        <LiveKitSession
          serverUrl={tokenQuery.data.server_url}
          token={tokenQuery.data.participant_token}
          bookingId={bookingId}
          participantName={participantName}
          participantRole={participantRole}
          teacherName={fullName(booking.teacher)}
          parentName={fullName(booking.parent)}
          initialCameraEnabled={cameraEnabled}
          initialMicEnabled={micEnabled}
          onDisconnected={() => {
            // Leaving only disconnects this participant. The booking remains active
            // until its scheduled end and is completed by the overdue-session cron.
            setDisconnected(true);
          }}
        />
      </div>
    );
  }

  // --- PRE-JOIN PAGE (idle) ---
  const expectedParticipants = [
    { name: fullName(booking.teacher), role: 'Teacher' as const, joined: eventsQuery.data?.some(e => e.event === 'joined' && e.participantRole === 'teacher') },
    { name: fullName(booking.parent), role: 'Parent' as const, joined: eventsQuery.data?.some(e => e.event === 'joined' && e.participantRole === 'parent') },
    ...(booking.children || []).map(child => ({
      name: fullName(child),
      role: 'Child' as const,
      joined: eventsQuery.data?.some(e => e.event === 'joined' && e.participantRole === 'child' && e.childId === child.id),
    })),
  ];

  const joinedCount = expectedParticipants.filter(p => p.joined).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Content */}
      <button
        onClick={() => router.push('/app/schedule')}
        className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition shadow-sm"
      >
        <ArrowLeft size={18} className="text-gray-600" />
      </button>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-2">
            <SessionCountdownBanner booking={booking} />

        {/* Booking Info Card */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#001A72]/5 flex items-center justify-center">
              <BookOpen size={20} className="text-[#001A72]" />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900">{booking.subject || 'Tutoring session'}</h2>
              <p className="text-xs text-gray-500">{isTeacher ? `With ${fullName(booking.parent)}` : `With ${fullName(booking.teacher)}`}</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
              <Calendar size={14} className="text-[#001A72]" /> {formatDate(booking.scheduledDate)}
            </div>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
              <Clock size={14} className="text-[#001A72]" /> {formatTimeRange(booking.startTime, booking.endTime)}
            </div>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
              <Clock size={14} className="text-[#001A72]" /> {Number(booking.durationHours).toLocaleString()} hour{Number(booking.durationHours) === 1 ? '' : 's'}
            </div>
          </div>
        </div>

        {/* Expected Participants */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-3">
            Expected Participants ({expectedParticipants.length})
          </p>
          <div className="space-y-3">
            {expectedParticipants.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${p.joined ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{p.name}</p>
                  <p className="text-[10px] text-gray-500">{p.role}</p>
                </div>
                {p.joined && <span className="text-[10px] font-bold text-emerald-600">Joined</span>}
              </div>
            ))}
          </div>
          {joinedCount > 0 && (
            <p className="text-[10px] text-gray-400 mt-3">{joinedCount} of {expectedParticipants.length} joined</p>
          )}
        </div>

        {/* Child Codes */}
        {hasChildren && childCodesQuery.data?.codes && childCodesQuery.data.codes.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-[#001A72]" />
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Child Join Codes</p>
              </div>
              <button onClick={handleCopyAllCodes} className="text-[10px] font-bold text-[#001A72] hover:underline">
                Copy All
              </button>
            </div>
            <div className="space-y-2">
              {childCodesQuery.data.codes.map((c) => (
                <div key={c.childId} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                  <div>
                    <p className="text-xs font-bold text-gray-900">{c.childName}</p>
                    <p className="text-[10px] font-mono text-gray-500">{c.code}</p>
                  </div>
                  <button onClick={() => handleCopyCode(c.code)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition">
                    {copiedCode === c.code ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-3">Share these codes with each child so they can join from their own device.</p>
          </div>
        )}
          </div>

          <div className="space-y-5 lg:col-span-3">
        {/* Camera & Microphone Preview */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
              Test Camera & Microphone
            </p>
          </div>

          {previewError && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-100 p-3 flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-700">{previewError}</p>
            </div>
          )}

          {previewing && (
            <div className="space-y-4">
              {/* Video Preview */}
              <div className="relative rounded-xl bg-black overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full aspect-video"
                  style={{ transform: 'scaleX(-1)' }}
                />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                  {/* Camera Toggle */}
                  <button
                    onClick={toggleCamera}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition ${
                      cameraEnabled
                        ? 'bg-white text-black hover:bg-gray-100'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {cameraEnabled ? <Video size={14} /> : <VideoOff size={14} />}
                    <span>{cameraEnabled ? 'Camera On' : 'Camera Off'}</span>
                  </button>

                  {/* Camera Dropdown */}
                  {devices.filter(d => d.kind === 'videoinput').length > 1 && (
                    <div className="relative">
                      <button
                        onClick={() => setCameraDropdownOpen(!cameraDropdownOpen)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/20 text-white text-xs font-bold hover:bg-white/30 transition"
                      >
                        <Video size={14} />
                        <ChevronDown size={12} />
                      </button>
                      {cameraDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setCameraDropdownOpen(false)} />
                          <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-1 overflow-hidden">
                            {devices.filter(d => d.kind === 'videoinput').map((device) => (
                              <button
                                key={device.deviceId}
                                onClick={() => { switchCamera(device.deviceId); setCameraDropdownOpen(false); }}
                                className={`w-full px-4 py-2.5 text-xs font-medium text-left transition ${
                                  selectedCameraId === device.deviceId
                                    ? 'bg-[#001A72] text-white'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Mic Dropdown */}
                  {devices.filter(d => d.kind === 'audioinput').length > 1 && (
                    <div className="relative">
                      <button
                        onClick={() => setMicDropdownOpen(!micDropdownOpen)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/20 text-white text-xs font-bold hover:bg-white/30 transition"
                      >
                        <Mic size={14} />
                        <ChevronDown size={12} />
                      </button>
                      {micDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setMicDropdownOpen(false)} />
                          <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-1 overflow-hidden">
                            {devices.filter(d => d.kind === 'audioinput').map((device) => (
                              <button
                                key={device.deviceId}
                                onClick={() => { switchMic(device.deviceId); setMicDropdownOpen(false); }}
                                className={`w-full px-4 py-2.5 text-xs font-medium text-left transition ${
                                  selectedMicId === device.deviceId
                                    ? 'bg-[#001A72] text-white'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Mic Toggle */}
                  <button
                    onClick={toggleMic}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition ${
                      micEnabled
                        ? 'bg-white text-black hover:bg-gray-100'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {micEnabled ? <Mic size={14} /> : <MicOff size={14} />}
                    <span>{micEnabled ? 'Mic On' : 'Mic Off'}</span>
                  </button>
                </div>
              </div>

              {/* Audio Level Meter */}
              {micEnabled && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-gray-500">Microphone Level</p>
                    <p ref={levelTextRef} className="text-xs font-mono text-gray-400">0%</p>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      ref={levelBarRef}
                      className="h-full bg-[#001A72] rounded-full transition-all duration-100"
                      style={{ width: '0%' }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {!previewing && !previewError && (
            <div className="flex flex-col items-center gap-2 py-6">
              <Loader2 size={18} className="animate-spin text-gray-400" />
              <p className="text-center text-xs text-gray-500">Starting camera & microphone preview...</p>
            </div>
          )}
        </div>

        {/* Join Button */}
        <button
          onClick={handleJoin}
          disabled={!tokenQuery.data || joinState === 'connecting'}
          className="w-full rounded-2xl bg-[#001A72] px-6 py-4 text-sm font-black uppercase tracking-wider text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#001A72]/90 transition"
        >
          {joinState === 'connecting' ? 'Connecting...' : 'Join Session'}
        </button>
          </div>
        </div>

      {/* Loading Overlay */}
      {joinState === 'connecting' && (
        <div className="fixed inset-0 m-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <Loader2 size={32} className="animate-spin text-[#001A72]" />
          <p className="text-sm font-bold text-[#001A72]">Connecting to session...</p>
          <p className="text-xs text-gray-400">Please wait</p>
        </div>
      )}
    </div>
  );
}

interface PostSessionViewProps {
  booking: Booking;
  bookingId: string;
  participantRole: 'parent' | 'teacher';
  isTeacher: boolean;
  isSessionEnded: boolean;
  onRejoin: () => void;
  onReturn: () => void;
}

function PostSessionView({
  booking,
  bookingId,
  participantRole,
  isTeacher,
  isSessionEnded,
  onRejoin,
  onReturn,
}: PostSessionViewProps) {
  const router = useRouter();

  return (
    <div className="space-y-6 pb-12">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onReturn}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm"
        >
          <ArrowLeft size={16} />
          <span>Return to Bookings</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
            <CheckCircle size={14} />
            <span>{isSessionEnded ? 'Session Concluded' : 'You left the session'}</span>
          </span>
        </div>
      </div>

      {/* Main 2-column Grid */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left column: Session Summary (2/5) */}
        <div className="space-y-5 lg:col-span-2">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#001A72]/5 flex items-center justify-center text-[#001A72]">
                <BookOpen size={22} />
              </div>
              <div>
                <h2 className="text-base font-black text-gray-900">{booking.subject || 'Tutoring session'}</h2>
                <p className="text-xs text-gray-500">
                  {isTeacher ? `With ${fullName(booking.parent)}` : `With ${fullName(booking.teacher)}`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 text-xs text-gray-600 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                <Calendar size={14} className="text-[#001A72]" />
                <span className="font-medium">{formatDate(booking.scheduledDate)}</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                <Clock size={14} className="text-[#001A72]" />
                <span className="font-medium">{formatTimeRange(booking.startTime, booking.endTime)} ({Number(booking.durationHours || 1)} hr)</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                <Users size={14} className="text-[#001A72]" />
                <span className="font-medium">
                  {booking.bookingFor === 'children'
                    ? booking.children?.map((c) => fullName(c)).join(', ') || 'Children'
                    : 'Parent learner'}
                </span>
              </div>
            </div>
          </div>

          {/* Action to Details */}
          <button
            onClick={() => router.push(`/app/schedule/${bookingId}`)}
            className="w-full p-4 rounded-2xl bg-[#001A72] text-white flex items-center justify-between hover:bg-[#001A72]/90 transition shadow-sm group"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                <BookOpen size={18} />
              </div>
              <div>
                <p className="text-xs font-black">View Session Details & Notes</p>
                <p className="text-[10px] text-white/70">Sticky notes, summaries & whiteboard snapshots</p>
              </div>
            </div>
            <ChevronRight size={18} className="group-hover:translate-x-1 transition" />
          </button>
        </div>

        {/* Right column: Highlights and Next Steps */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle size={22} />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900">{isSessionEnded ? 'Session Successfully Concluded' : 'You can still rejoin this session'}</h3>
                <p className="text-xs text-gray-500">{isSessionEnded ? 'Thank you for participating!' : 'The booking remains active until its scheduled end time.'}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs text-gray-600 space-y-2">
              <p className="font-bold text-gray-800">What happens next?</p>
              <ul className="list-disc pl-4 space-y-1 text-gray-600">
                <li>All notes taken during this session are saved and accessible anytime.</li>
                <li>Any whiteboard snapshots taken have been saved to the session details gallery.</li>
                <li>You can review the complete session breakdown from your Schedule.</li>
              </ul>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              {!isSessionEnded && (
                <Button
                  fullWidth={false}
                  onClick={onRejoin}
                  className="px-5 py-2.5 text-xs font-black"
                >
                  <Video size={14} /> Rejoin Session
                </Button>
              )}
              <Button
                fullWidth={false}
                onClick={() => router.push(`/app/schedule/${bookingId}`)}
                className="px-5 py-2.5 text-xs font-black"
              >
                <BookOpen size={14} /> Open Full Session Details
              </Button>
              <Button
                fullWidth={false}
                variant="outline"
                onClick={onReturn}
                className="px-4 py-2.5 text-xs font-black border-gray-200 text-gray-600 hover:bg-gray-50"
              >
          Return to Schedule
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
