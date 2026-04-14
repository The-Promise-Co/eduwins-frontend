import './globals.css';
import '@fontsource/inter';
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
      <body className="min-h-screen flex flex-col bg-gray-50" style={{ fontFamily: '"Inter", sans-serif' }}>
        <main className="flex-1 w-full h-full">
          {children}
        </main>
      </body>
    </html>
  );
}
