import React from 'react';
import NavBar from '../../components/NavBar';
import Footer from '../../components/Footer';
import BackToTop from '../../components/BackToTop';

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
