'use client';

interface OnlineStatusProps {
  isOnline: boolean;
  size?: 'sm' | 'md';
}

export default function OnlineStatus({ isOnline, size = 'sm' }: OnlineStatusProps) {
  const sizeClasses = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';

  return (
    <span
      className={`${sizeClasses} rounded-full inline-block ${
        isOnline ? 'bg-emerald-500' : 'bg-gray-300'
      }`}
    />
  );
}
