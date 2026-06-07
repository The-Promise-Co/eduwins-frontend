import React from 'react';
import NavBar from '@/misc/components/NavBar';
import Footer from '@/misc/components/Footer';
import BackToTop from '@/misc/components/BackToTop';

export default function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavBar />
      {children}
      <Footer />
      <BackToTop />
    </>
  );
}
