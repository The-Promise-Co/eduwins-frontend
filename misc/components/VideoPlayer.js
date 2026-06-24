'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';

const formatTime = (value) => {
  if (!Number.isFinite(value)) return '0:00';
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

export default function VideoPlayer({ src, title, initialTime = 0, onProgress, onComplete }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    setPlaying(false);
    setCurrentTime(0);
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !initialTime) return;
    video.currentTime = initialTime;
    setCurrentTime(initialTime);
  }, [initialTime, src]);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      await video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  const preventVideoMenu = (event) => {
    event.preventDefault();
  };

  const handleSeek = (event) => {
    const video = videoRef.current;
    if (!video) return;

    const nextTime = Number(event.target.value);
    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  return (
    <div className="relative w-full bg-black rounded-3xl overflow-hidden group" onContextMenu={preventVideoMenu}>
      <video
        ref={videoRef}
        src={src}
        className="w-full max-h-[560px] bg-black"
        playsInline
        controls={false}
        controlsList="nodownload noplaybackrate noremoteplayback"
        disablePictureInPicture
        onClick={togglePlay}
        onContextMenu={preventVideoMenu}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onTimeUpdate={(event) => {
          const video = event.currentTarget;
          const nextTime = video.currentTime || 0;
          const nextDuration = video.duration || 0;
          setCurrentTime(nextTime);
          onProgress?.(Math.floor(nextTime));
          if (nextDuration > 0 && nextTime / nextDuration >= 0.9) {
            onComplete?.(Math.floor(nextTime));
          }
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={(event) => {
          setPlaying(false);
          onComplete?.(Math.floor(event.currentTarget.currentTime || 0));
        }}
      />

      {!playing && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/10 text-white"
          aria-label={`Play ${title || 'video'}`}
        >
          <span className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-xl">
            <Play size={32} className="ml-1 fill-white" />
          </span>
        </button>
      )}

      <div className="absolute left-0 right-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-4 pb-4 pt-10 text-white opacity-100 md:opacity-0 md:group-hover:opacity-100 transition">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="w-full accent-[#FFB81C]"
          aria-label="Video progress"
        />

        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button type="button" onClick={togglePlay} className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition" aria-label={playing ? 'Pause' : 'Play'}>
              {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5 fill-white" />}
            </button>
            <span className="text-xs font-bold text-white/80 tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
