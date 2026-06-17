'use client';

import { useEffect, useRef, useState } from 'react';

type GoogleAuthButtonProps = {
  onCredential: (idToken: string) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              theme: 'outline' | 'filled_blue' | 'filled_black';
              size: 'large' | 'medium' | 'small';
              shape: 'pill' | 'rectangular' | 'circle' | 'square';
              width?: number;
              text?: GoogleAuthButtonProps['text'];
            }
          ) => void;
        };
      };
    };
  }
}

const GOOGLE_SCRIPT_ID = 'google-identity-services';

export default function GoogleAuthButton({ onCredential, text = 'continue_with' }: GoogleAuthButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) {
      setError('Google sign-in is not configured.');
      return;
    }

    const renderGoogleButton = () => {
      if (!window.google || !containerRef.current) return;

      containerRef.current.innerHTML = '';
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) {
            onCredential(response.credential);
          }
        },
      });
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        width: 260,
        text,
      });
    };

    if (window.google) {
      renderGoogleButton();
      return;
    }

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', renderGoogleButton, { once: true });
      return () => existingScript.removeEventListener('load', renderGoogleButton);
    }

    const script = document.createElement('script');
    script.id = GOOGLE_SCRIPT_ID;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    script.onerror = () => setError('Unable to load Google sign-in.');
    document.head.appendChild(script);
  }, [onCredential, text]);

  if (error) {
    return <p className="text-xs text-red-500 text-center">{error}</p>;
  }

  return <div ref={containerRef} className="flex justify-center" />;
}
