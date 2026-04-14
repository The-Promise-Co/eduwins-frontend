import Link from 'next/link';
import React from 'react';

export default function Footer(): React.ReactElement {
  return (
    <footer className="bg-[#001A72] text-[#FFB81C] py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8 pb-8 border-b border-gray-800">
          <img src="/footer-logo.png" alt="EduWins footer logo" className="h-12 w-auto" />
        </div>
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-white font-bold mb-4">About EduWins</h3>
            <p className="text-sm">Connecting students with quality tutors for better learning outcomes.</p>
          </div>
          <div>
            <h3 className="text-white font-bold mb-4">For Parents</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/search" className="hover:text-white">Find Tutors</Link></li>
              <li><Link href="#" className="hover:text-white">Book Lessons</Link></li>
              <li><Link href="#" className="hover:text-white">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold mb-4">For Tutors</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/register-teacher" className="hover:text-white">Become a Tutor</Link></li>
              <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
              <li><Link href="/earnings" className="hover:text-white">Earnings</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold mb-4">Help</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-white">Support</Link></li>
              <li><Link href="#" className="hover:text-white">FAQ</Link></li>
              <li><Link href="#" className="hover:text-white">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 text-center">
          <p className="text-sm">© 2026 EduWins. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
