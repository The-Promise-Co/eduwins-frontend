'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, BookOpen, Calendar, CheckCircle, ChevronDown, Clock, Copy, Loader2, Mic, MicOff, Users, Video, VideoOff } from 'lucide-react';
import LiveKitSession from '@/misc/components/LiveKitSession';
import SessionCountdownBanner from '@/misc/components/SessionCountdownBanner';
import { useBooking } from '@/misc/hooks/api/bookings';
import { useLiveKitToken, useSessionChildCodes, useSessionEvents } from '@/misc/hooks/api/session';
import { useUser } from '@/misc/context/UserContext';
import { computeSessionTiming } from '@/misc/utils/sessionTiming';
import { toast } from 'sonner';

function fullName(person?: { firstName?: string; lastName?: string } | null) {
  return `${person?.firstName || ''} ${person?.lastName || ''}`.trim() || 'Unknown';
}

const formatDate = (value?: string) => {
  if (!value) return 'Date pending';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

const formatMoney = (value?: string | number) => {
  const amount = Number(value || 0);
  return `\u20A6${amount.toLocaleString()}`;
};

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;
  const { user } = useUser();

  const bookingQuery = useBooking(bookingId);
  const tokenQuery = useLiveKitToken(bookingId);
  const childCodesQuery = useSessionChildCodes(bookingId);
  const eventsQuery = useSessionEvents(bookingId);

  const [joinState, setJoinState] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const [disconnected, setDisconnected] = useState(false);
  const [codesPanelOpen, setCodesPanelOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Preview state
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [selectedMicId, setSelectedMicId] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [cameraDropdownOpen, setCameraDropdownOpen] = useState(false);
  const [micDropdownOpen, setMicDropdownOpen] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number>();

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

  // Preview functions
  const startPreview = useCallback(async () => {
    setPreviewError(null);
    try {
      // Stop existing stream if any
      if (previewStream) {
        previewStream.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: cameraEnabled ? { deviceId: selectedCameraId ? { exact: selectedCameraId } : undefined, facingMode: 'user' } : false,
        audio: micEnabled ? { deviceId: selectedMicId ? { exact: selectedMicId } : undefined } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setPreviewStream(stream);

      // Enumerate devices
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = deviceList.filter(d => d.kind === 'videoinput');
      const audioInputs = deviceList.filter(d => d.kind === 'audioinput');
      setDevices([...videoInputs, ...audioInputs]);

      // Set default selected devices if not set
      if (!selectedCameraId && videoInputs.length > 0) {
        setSelectedCameraId(videoInputs[0].deviceId);
      }
      if (!selectedMicId && audioInputs.length > 0) {
        setSelectedMicId(audioInputs[0].deviceId);
      }

      // Audio level visualization
      if (micEnabled && stream.getAudioTracks().length > 0) {
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
        }
        const audioContext = audioContextRef.current;
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateAudioLevel = () => {
          if (!analyser) return;
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
          setAudioLevel(Math.min(100, Math.round((average / 128) * 100)));
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        };
        updateAudioLevel();
      }

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
  }, [cameraEnabled, micEnabled, selectedCameraId, selectedMicId, previewStream]);

  const stopPreview = useCallback(() => {
    if (previewStream) {
      previewStream.getTracks().forEach(track => track.stop());
      setPreviewStream(null);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setPreviewing(false);
    setAudioLevel(0);
  }, [previewStream]);

  const toggleCamera = useCallback(() => {
    setCameraEnabled(prev => {
      const newValue = !prev;
      if (previewStream) {
        previewStream.getVideoTracks().forEach(track => {
          track.enabled = newValue;
        });
      }
      if (newValue && !prev && previewing) {
        // Restart with new camera
        startPreview();
      }
      return newValue;
    });
  }, [previewStream, previewing, startPreview]);

  const toggleMic = useCallback(() => {
    setMicEnabled(prev => {
      const newValue = !prev;
      if (previewStream) {
        previewStream.getAudioTracks().forEach(track => {
          track.enabled = newValue;
        });
      }
      if (newValue && !prev && previewing) {
        startPreview();
      }
      return newValue;
    });
  }, [previewStream, previewing, startPreview]);

  const switchCamera = useCallback((deviceId: string) => {
    setSelectedCameraId(deviceId);
    if (previewing) startPreview();
  }, [previewing, startPreview]);

  const switchMic = useCallback((deviceId: string) => {
    setSelectedMicId(deviceId);
    if (previewing) startPreview();
  }, [previewing, startPreview]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPreview();
    };
  }, [stopPreview]);

  // Auto-redirect on validation failure
  useEffect(() => {
    if (tokenQuery.isError) {
      router.push('/app/booking-requests');
    }
  }, [tokenQuery.isError, router]);

  // Auto-redirect if booking date is in the past
  useEffect(() => {
    if (booking) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const scheduled = new Date(`${booking.scheduledDate}T00:00:00`);
      if (!Number.isNaN(scheduled.getTime()) && scheduled.getTime() < today.getTime()) {
        router.push('/app/booking-requests');
      }
    }
  }, [booking, router]);

  const handleJoin = () => {
    if (!tokenQuery.data) return;
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
        <button onClick={() => router.push('/app/booking-requests')} className="text-xs font-bold text-[#001A72] underline">
          Return to Bookings
        </button>
      </div>
    );
  }

  // --- DISCONNECTED ---
  if (disconnected) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <CheckCircle size={40} className="text-emerald-500" />
        <p className="text-sm font-bold text-gray-700">Session ended</p>
        <p className="text-xs text-gray-500">You have left the session.</p>
        <button onClick={() => router.push('/app/booking-requests')} className="text-xs font-bold text-[#001A72] underline mt-2">
          Return to Bookings
        </button>
      </div>
    );
  }

  // --- ENDED ---
  if (timing?.isEnded) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <CheckCircle size={40} className="text-gray-400" />
        <p className="text-sm font-bold text-gray-700">Session has ended</p>
        <p className="text-xs text-gray-500">This session has concluded.</p>
        <button onClick={() => router.push('/app/booking-requests')} className="text-xs font-bold text-[#001A72] underline mt-2">
          Return to Bookings
        </button>
      </div>
    );
  }

  // --- CONNECTED → SESSION VIEW ---
  if (joinState === 'connected' && tokenQuery.data) {
    return (
      <div className="h-screen w-screen bg-gray-950">
        <LiveKitSession
          serverUrl={tokenQuery.data.server_url}
          token={tokenQuery.data.participant_token}
          bookingId={bookingId}
          participantName={participantName}
          participantRole={participantRole}
          onDisconnected={() => setDisconnected(true)}
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/app/booking-requests')} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-sm font-black text-gray-900">{booking.subject || 'Tutoring session'}</h1>
            <p className="text-[10px] text-gray-500">
              {isTeacher ? `With ${fullName(booking.parent)}` : `With ${fullName(booking.teacher)}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasChildren && childCodesQuery.data?.codes && childCodesQuery.data.codes.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setCodesPanelOpen(!codesPanelOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#001A72]/5 text-[#001A72] text-xs font-bold hover:bg-[#001A72]/10 transition"
              >
                <Users size={14} /> Child Codes
              </button>
              {codesPanelOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setCodesPanelOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-lg border border-gray-100 z-50 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-black text-gray-900 uppercase tracking-wider">Child Join Codes</p>
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
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Countdown banner */}
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
              <Clock size={14} className="text-[#001A72]" /> {booking.startTime || '--:--'} - {booking.endTime || '--:--'}
            </div>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
              <Clock size={14} className="text-[#001A72]" /> {Number(booking.durationHours || 0).toLocaleString()} hour{Number(booking.durationHours || 0) === 1 ? '' : 's'}
            </div>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 font-bold text-[#001A72]">
              {formatMoney(booking.totalAmount ?? booking.totalCost)}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border-blue-100">
              PAID
            </span>
            <span className="text-[10px] text-gray-400">Payment held in escrow</span>
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

        {/* Camera & Microphone Preview */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
              Test Camera & Microphone
            </p>
            {!previewing && (
              <button
                onClick={startPreview}
                disabled={!tokenQuery.data}
                className="text-xs font-bold text-[#001A72] hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                Start Preview
              </button>
            )}
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
                  ref={(el) => { if (el && previewStream) el.srcObject = previewStream; }}
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
                    <p className="text-xs font-mono text-gray-400">{audioLevel}%</p>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#001A72] rounded-full transition-all duration-100"
                      style={{ width: `${Math.min(100, audioLevel)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {!previewing && !previewError && (
            <p className="text-center text-xs text-gray-500 py-4">
              Click "Start Preview" to test your camera and microphone before joining.
            </p>
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

      {/* Loading Overlay */}
      {joinState === 'connecting' && (
        <div className="fixed inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <Loader2 size={32} className="animate-spin text-[#001A72]" />
          <p className="text-sm font-bold text-[#001A72]">Connecting to session...</p>
          <p className="text-xs text-gray-400">Please wait</p>
        </div>
      )}
    </div>
  );
}
