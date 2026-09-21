'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Video, XCircle, CheckCircle, Clock } from 'lucide-react';
import LiveKitSession from '@/misc/components/LiveKitSession';
import SessionCountdownBanner from '@/misc/components/SessionCountdownBanner';
import { validateJoinCode } from '@/misc/hooks/api/session';
import { JoinSessionByCodeResponse } from '@/misc/types/session';
import { Booking } from '@/misc/types';

type JoinState = 'loading' | 'invalid' | 'too_early' | 'ready' | 'joining' | 'connected' | 'disconnected' | 'error';

export default function JoinCodePage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [state, setState] = useState<JoinState>('loading');
  const [joinData, setJoinData] = useState<JoinSessionByCodeResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!code) {
      setState('invalid');
      return;
    }

    validateJoinCode(code)
      .then((data) => {
        if (!data.valid) {
          setState('invalid');
          return;
        }
        setJoinData(data);
        setState('ready');
      })
      .catch(() => {
        setState('invalid');
      });
  }, [code]);

  const handleJoin = () => {
    if (!joinData) return;
    setState('joining');
    // The LiveKitSession will handle the actual connection
    // We transition to connected once onConnected fires
    setTimeout(() => setState('connected'), 100);
  };

  const handleDisconnected = () => {
    setState('disconnected');
  };

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={22} className="animate-spin text-gray-400 mr-2" /> Validating code...
      </div>
    );
  }

  if (state === 'invalid') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4 p-6">
        <XCircle size={48} className="text-red-400" />
        <h1 className="text-lg font-black text-gray-900">Invalid join code</h1>
        <p className="text-sm text-gray-500 text-center max-w-xs">
          This code is invalid or has expired. Please ask your teacher or parent for a new code.
        </p>
        <button onClick={() => router.push('/')} className="text-xs font-bold text-[#001A72] underline mt-2">
          Go to Eduwins
        </button>
      </div>
    );
  }

  if (state === 'disconnected') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4 p-6">
        <CheckCircle size={48} className="text-emerald-500" />
        <h1 className="text-lg font-black text-gray-900">Session ended</h1>
        <p className="text-sm text-gray-500 text-center max-w-xs">You have left the session.</p>
        <button onClick={() => router.push('/')} className="text-xs font-bold text-[#001A72] underline mt-2">
          Go to Eduwins
        </button>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4 p-6">
        <XCircle size={48} className="text-red-400" />
        <h1 className="text-lg font-black text-gray-900">Connection error</h1>
        <p className="text-sm text-gray-500 text-center max-w-xs">{error || 'Could not connect to the session.'}</p>
        <button onClick={() => router.push('/')} className="text-xs font-bold text-[#001A72] underline mt-2">
          Go to Eduwins
        </button>
      </div>
    );
  }

  if (joinData && (state === 'ready' || state === 'joining')) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-6 p-6">
        <div className="w-16 h-16 rounded-2xl bg-[#001A72]/5 flex items-center justify-center">
          <Video size={28} className="text-[#001A72]" />
        </div>
        <div className="text-center">
          <h1 className="text-lg font-black text-gray-900">Joining as {joinData.childName}</h1>
          <p className="text-sm text-gray-500 mt-1">{joinData.subject || 'Tutoring session'}</p>
          {joinData.teacherName && (
            <p className="text-xs text-gray-400 mt-0.5">Tutor: {joinData.teacherName}</p>
          )}
        </div>
        <button
          onClick={handleJoin}
          disabled={state === 'joining'}
          className="px-8 py-3 rounded-xl bg-[#001A72] text-white text-sm font-black hover:bg-[#001A72]/90 transition disabled:opacity-60 flex items-center gap-2"
        >
          {state === 'joining' ? (
            <><Loader2 size={16} className="animate-spin" /> Joining...</>
          ) : (
            <><Video size={16} /> Join Session</>
          )}
        </button>
        <button onClick={() => router.push('/')} className="text-xs font-bold text-gray-400 hover:text-gray-600 transition">
          Cancel
        </button>
      </div>
    );
  }

  if (state === 'connected' && joinData) {
    return (
      <div className="h-screen flex flex-col bg-gray-950">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shrink-0">
          <div>
            <h1 className="text-sm font-black text-gray-900">{joinData.subject || 'Tutoring session'}</h1>
            <p className="text-[10px] text-gray-500">Joining as {joinData.childName}</p>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <LiveKitSession
            serverUrl={joinData.serverUrl}
            token={joinData.participantToken}
            bookingId={joinData.bookingId}
            participantName={joinData.childName}
            participantRole="child"
            childId={joinData.childId}
            onDisconnected={handleDisconnected}
          />
        </div>
      </div>
    );
  }

  return null;
}
