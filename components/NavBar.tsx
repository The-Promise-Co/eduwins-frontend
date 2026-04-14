'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const updateLoginState = () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
    }
  };

  useEffect(() => {
    updateLoginState();
  }, []);

  useEffect(() => {
    updateLoginState();
  }, [pathname]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsLoggedIn(false);
      router.push('/login');
      closeMenu();
    }
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" onClick={closeMenu}>
            <img src="/logo.png" alt="EduWins logo" className="h-10 w-auto" />
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {/* Our Services Mega Menu */}
            <div className="relative group">
              <button className="font-medium text-[#001A72] hover:text-[#FFB81C] transition flex items-center gap-2">
                Our Services
                <span>▼</span>
              </button>
              <div className="absolute left-0 hidden group-hover:block bg-white shadow-lg rounded-lg p-6 w-screen max-w-4xl z-[9999] mt-0 pointer-events-auto">
                <div className="grid grid-cols-4 gap-6">
                  <div>
                    <h4 className="font-bold text-[#001A72] mb-3">African Languages</h4>
                    <ul className="space-y-2 text-sm">
                      <li><Link href="/search?subject=Yoruba" className="text-gray-700 hover:text-[#001A72]">Yoruba</Link></li>
                      <li><Link href="/search?subject=Hausa" className="text-gray-700 hover:text-[#001A72]">Hausa</Link></li>
                      <li><Link href="/search?subject=Igbo" className="text-gray-700 hover:text-[#001A72]">Igbo</Link></li>
                      <li><Link href="/search?subject=Swahili" className="text-gray-700 hover:text-[#001A72]">Swahili</Link></li>
                      <li><Link href="/search?subject=Zulu" className="text-gray-700 hover:text-[#001A72]">Zulu</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#001A72] mb-3">International Languages</h4>
                    <ul className="space-y-2 text-sm">
                      <li><Link href="/search?subject=French" className="text-gray-700 hover:text-[#001A72]">French</Link></li>
                      <li><Link href="/search?subject=Spanish" className="text-gray-700 hover:text-[#001A72]">Spanish</Link></li>
                      <li><Link href="/search?subject=Deutsch" className="text-gray-700 hover:text-[#001A72]">Deutsch</Link></li>
                      <li><Link href="/search?subject=Italian" className="text-gray-700 hover:text-[#001A72]">Italian</Link></li>
                      <li><Link href="/search?subject=Chinese" className="text-gray-700 hover:text-[#001A72]">Chinese</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#001A72] mb-3">Music & Arts</h4>
                    <ul className="space-y-2 text-sm">
                      <li><Link href="/search?subject=Music" className="text-gray-700 hover:text-[#001A72]">Music</Link></li>
                      <li><Link href="/search?subject=Guitar" className="text-gray-700 hover:text-[#001A72]">Guitar</Link></li>
                      <li><Link href="/search?subject=Piano" className="text-gray-700 hover:text-[#001A72]">Piano</Link></li>
                      <li><Link href="/search?subject=Saxophone" className="text-gray-700 hover:text-[#001A72]">Saxophone</Link></li>
                      <li><Link href="/search?subject=Violin" className="text-gray-700 hover:text-[#001A72]">Violin</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#001A72] mb-3">Test Prep</h4>
                    <ul className="space-y-2 text-sm">
                      <li><Link href="/search?subject=IELTS%20Prep" className="text-gray-700 hover:text-[#001A72]">IELTS Prep</Link></li>
                      <li><Link href="/search?subject=GMAT%20Prep" className="text-gray-700 hover:text-[#001A72]">GMAT Prep</Link></li>
                      <li><Link href="/search?subject=SAT%20Prep" className="text-gray-700 hover:text-[#001A72]">SAT Prep</Link></li>
                      <li><Link href="/search?subject=GRE%20Prep" className="text-gray-700 hover:text-[#001A72]">GRE Prep</Link></li>
                      <li><Link href="/search?subject=ACT%20Prep" className="text-gray-700 hover:text-[#001A72]">ACT Prep</Link></li>
                      <li><Link href="/search?subject=Study%20Abroad" className="text-gray-700 hover:text-[#001A72]">Study Abroad</Link></li>
                      <li><Link href="/search?subject=TEF" className="text-gray-700 hover:text-[#001A72]">TEF</Link></li>
                      <li><Link href="/search?subject=DELF" className="text-gray-700 hover:text-[#001A72]">DELF</Link></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search subjects, tutors..."
                className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001A72] focus:border-transparent"
                onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    const query = (e.target as HTMLInputElement).value.trim();
                    if (query) {
                      router.push(`/search?subject=${encodeURIComponent(query)}`);
                    }
                  }
                }}
              />
              <button
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#001A72] transition"
                onClick={() => {
                  const input = document.querySelector('input[placeholder="Search subjects, tutors..."]') as HTMLInputElement;
                  const query = input?.value.trim();
                  if (query) {
                    router.push(`/search?subject=${encodeURIComponent(query)}`);
                  }
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className="bg-[#001A72] text-white px-6 py-2 rounded-lg hover:bg-[#FFB81C] hover:text-[#001A72] font-semibold transition">
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 font-semibold transition">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/register" className="bg-white text-[#001A72] px-6 py-2 rounded-lg border-2 border-[#001A72] hover:bg-[#FFB81C] hover:border-[#FFB81C] font-semibold transition inline-block">
                  Sign Up
                </Link>
                <Link href="/login" className="bg-[#001A72] text-white px-6 py-2 rounded-lg hover:bg-[#FFB81C] hover:text-[#001A72] font-semibold transition">
                  Sign In
                </Link>
              </>
            )}

            {/* Contact Us Dropdown */}
            <div className="relative group">
              <button className="bg-[#FFB81C] text-[#001A72] px-6 py-2 rounded-lg hover:bg-[#ffd06f] hover:text-[#001A72] font-semibold transition flex items-center gap-2">
                Contact Us
                <span>▼</span>
              </button>
              <div className="absolute right-0 hidden group-hover:block bg-white shadow-lg rounded-lg p-4 w-64 z-[9999] mt-0 pointer-events-auto">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-[#001A72]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-[#001A72]">Call</p>
                      <a href="tel:+2348028443141" className="text-sm text-gray-700 hover:text-[#001A72]">+234 802 844 3141</a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-[#001A72]">WhatsApp</p>
                      <a href="https://wa.me/2347061760933" className="text-sm text-gray-700 hover:text-[#001A72]">+234 706 176 0933</a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-[#001A72]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-[#001A72]">Email</p>
                      <a href="mailto:info@eduwins.com" className="text-sm text-gray-700 hover:text-[#001A72]">info@eduwins.com</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden bg-[#001A72] text-white p-2 rounded-lg hover:bg-[#001A72]/90 transition"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-3 border-t border-gray-200 pt-4">
            <Link href="/" onClick={closeMenu} className="block font-medium text-[#001A72] hover:text-[#FFB81C] transition p-2 rounded">
              Home
            </Link>
            <Link href="/search" onClick={closeMenu} className="block font-medium text-[#001A72] hover:text-[#FFB81C] transition p-2 rounded">
              Find Tutor
            </Link>
            <Link href="/chat" onClick={closeMenu} className="block font-medium text-[#001A72] hover:text-[#FFB81C] transition p-2 rounded">
              Messages
            </Link>
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" onClick={closeMenu} className="block w-full bg-[#001A72] text-white px-6 py-2 rounded-lg hover:bg-[#FFB81C] hover:text-[#001A72] font-semibold transition text-center">
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="block w-full bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 font-semibold transition text-center">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/register" onClick={closeMenu} className="block w-full bg-white text-[#001A72] px-6 py-2 rounded-lg border-2 border-[#001A72] hover:bg-[#FFB81C] hover:border-[#FFB81C] font-semibold transition text-center">
                  Sign Up
                </Link>
                <Link href="/login" onClick={closeMenu} className="block w-full bg-[#001A72] text-white px-6 py-2 rounded-lg hover:bg-[#FFB81C] hover:text-[#001A72] font-semibold transition text-center">
                  Sign In
                </Link>
              </>
            )}
            {/* Contact Us Mobile Dropdown */}
            <div className="space-y-2">
              <button className="block w-full bg-[#FFB81C] text-[#001A72] px-6 py-2 rounded-lg hover:bg-[#ffd06f] hover:text-[#001A72] font-semibold transition text-center">
                Contact Us ▼
              </button>
              <div className="space-y-2 pl-4">
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                  <svg className="w-4 h-4 text-[#001A72]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div>
                    <p className="text-xs font-medium text-[#001A72]">Call</p>
                    <a href="tel:+2348028443141" className="text-xs text-gray-700 hover:text-[#001A72]">+234 802 844 3141</a>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                </svg>
                <div>
                  <p className="text-xs font-medium text-[#001A72]">WhatsApp</p>
                  <a href="https://wa.me/2347061760933" className="text-xs text-gray-700 hover:text-[#001A72]">+234 706 176 0933</a>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                <svg className="w-4 h-4 text-[#001A72]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-xs font-medium text-[#001A72]">Email</p>
                  <a href="mailto:info@eduwins.com" className="text-xs text-gray-700 hover:text-[#001A72]">info@eduwins.com</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  </nav>
  );
}
