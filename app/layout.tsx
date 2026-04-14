import './globals.css';
import '@fontsource/dm-sans/300.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'EduWins - Connect with Quality Tutors',
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
        <main className="flex-1 w-full h-full">
          {children}
        </main>
      </body>
    </html>
  );
}
