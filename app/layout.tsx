import './globals.css';
import { Inter } from 'next/font/google';
import { Metadata } from 'next';
import React from 'react';

const inter = Inter({ subsets: ['latin'] });

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
      <body className={`${inter.className} min-h-screen flex flex-col bg-gray-50`}>
        <main className="flex-1 w-full h-full">
          {children}
        </main>
      </body>
    </html>
  );
}
