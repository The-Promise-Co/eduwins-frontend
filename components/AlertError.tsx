import React from 'react';
import { AlertCircle } from 'lucide-react';

interface AlertErrorProps {
  message: string;
  className?: string;
}

export default function AlertError({ message, className = '' }: AlertErrorProps) {
  if (!message) return null;
  
  return (
    <div className={`bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2 ${className}`}>
      <AlertCircle size={16} className="shrink-0" />
      <span>{message}</span>
    </div>
  );
}
