'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  dismissable?: boolean;
  showCloseButton?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  size = 'md',
  dismissable = true,
  showCloseButton = true,
  children,
  footer,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting for Portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scrolling when open
  useEffect(() => {
    if (!isOpen) return;
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);

  // Handle Escape key to dismiss
  useEffect(() => {
    if (!isOpen || !dismissable) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, dismissable, onClose]);

  if (!isOpen || !mounted) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (dismissable && e.target === e.currentTarget) {
      onClose();
    }
  };

  // Determine size classes
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw] w-full',
  }[size];

  // Return portal to document.body to prevent backdrop offset/shifting caused by parent transforms or relative wrappers
  return createPortal(
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 w-screen h-screen bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className={`bg-white rounded-3xl w-full ${sizeClasses} max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200`}
      >
        {/* Header */}
        {(title || (dismissable && showCloseButton)) && (
          <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between shrink-0 bg-white">
            <div className="flex-1 min-w-0 pr-4">
              {title && (
                typeof title === 'string' ? (
                  <h3 className="text-lg font-black text-gray-900 leading-tight">{title}</h3>
                ) : (
                  title
                )
              )}
              {subtitle && (
                typeof subtitle === 'string' ? (
                  <p className="text-xs text-gray-400 font-semibold mt-1">{subtitle}</p>
                ) : (
                  subtitle
                )
              )}
            </div>
            {dismissable && showCloseButton && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition shrink-0 mt-0.5"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Content (Scrollable Area for long content) */}
        <div className="p-6 overflow-y-auto flex-1 text-sm text-gray-600">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0 bg-white">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
