import './globals.css';
import '@fontsource/dm-sans/300.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
import { Metadata } from 'next';
import React, { Suspense } from 'react';

import { UserProvider } from '@/misc/context/UserContext';
import QueryProvider from '@/misc/context/QueryProvider';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Eduwins - Connect with Quality Tutors',
  description: 'Connecting students with quality tutors for better learning outcomes.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-gray-50">
        <QueryProvider>
          <UserProvider>
            <main className="flex-1 w-full h-full">
              <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-[#001A72] font-semibold">Loading Eduwins...</div>}>
                {children}
              </Suspense>
            </main>
            <Toaster richColors position="top-right" closeButton />
          </UserProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
