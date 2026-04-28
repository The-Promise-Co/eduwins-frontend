'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  X,
  Menu,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Phone,
  Mail,
  MessageCircle,
} from 'lucide-react';

const SERVICES = [
  {
    category: 'African Languages',
    items: ['Yoruba', 'Hausa', 'Igbo', 'Swahili', 'Zulu'],
  },
  {
    category: 'International Languages',
    items: ['French', 'Spanish', 'Deutsch', 'Italian', 'Chinese'],
  },
  {
    category: 'Music & Arts',
    items: ['Music', 'Guitar', 'Piano', 'Saxophone', 'Violin'],
  },
  {
    category: 'Test Prep',
    items: ['IELTS Prep', 'GMAT Prep', 'SAT Prep', 'GRE Prep', 'ACT Prep', 'Study Abroad', 'TEF', 'DELF'],
  },
];

const CONTACT = [
  { label: 'Call Us', value: '+234 802 844 3141', href: 'tel:+2348028443141', icon: Phone },
  { label: 'WhatsApp', value: '+234 706 176 0933', href: 'https://wa.me/2347061760933', icon: MessageCircle },
  { label: 'Email', value: 'info@eduwins.com', href: 'mailto:info@eduwins.com', icon: Mail },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const updateLoginState = () => {
    if (typeof window !== 'undefined') {
      setIsLoggedIn(!!localStorage.getItem('token'));
    }
  };

  useEffect(() => {
    updateLoginState();
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { updateLoginState(); }, [pathname]);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [searchOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setMobileOpen(false);
    router.push('/login');
  };

  const handleSearch = () => {
    const q = searchQuery.trim();
    if (q) {
      router.push(`/search?subject=${encodeURIComponent(q)}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  return (
    <>
      <nav
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-md'
            : 'bg-white shadow-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0" onClick={() => setMobileOpen(false)}>
              <img src="/logo.png" alt="EduWins logo" className="h-9 w-auto" />
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {/* Services mega menu */}
              <div className="relative group">
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:text-[#001A72] hover:bg-[#001A72]/5 transition">
                  Our Services
                  <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-200" />
                </button>

                {/* Mega dropdown */}
                <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[9999]">
                  <div className="bg-white border border-gray-100 rounded-2xl shadow-xl p-6 w-[620px]">
                    <div className="grid grid-cols-4 gap-6">
                      {SERVICES.map(({ category, items }) => (
                        <div key={category}>
                          <p className="text-[10px] font-black text-[#001A72] uppercase tracking-widest mb-3">{category}</p>
                          <ul className="space-y-1.5">
                            {items.map((item) => (
                              <li key={item}>
                                <Link
                                  href={`/search?subject=${encodeURIComponent(item)}`}
                                  className="text-xs text-gray-600 hover:text-[#001A72] hover:font-semibold transition block"
                                >
                                  {item}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-gray-400">Can't find your subject?</span>
                      <Link href="/search" className="text-xs font-bold text-[#001A72] hover:text-[#FFB81C] transition">
                        Search all tutors →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <Link href="/search" className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:text-[#001A72] hover:bg-[#001A72]/5 transition">
                Find a Tutor
              </Link>

              {/* Contact dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:text-[#001A72] hover:bg-[#001A72]/5 transition">
                  Contact
                  <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-200" />
                </button>
                <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[9999]">
                  <div className="bg-white border border-gray-100 rounded-2xl shadow-xl p-4 w-64">
                    <div className="space-y-3">
                      {CONTACT.map(({ label, value, href, icon: Icon }) => (
                        <a key={label} href={href} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition group/item">
                          <div className="w-8 h-8 bg-[#001A72]/5 rounded-lg flex items-center justify-center shrink-0 group-hover/item:bg-[#001A72] transition">
                            <Icon size={14} className="text-[#001A72] group-hover/item:text-white transition" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">{label}</p>
                            <p className="text-xs font-semibold text-gray-700">{value}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right actions */}
            <div className="hidden md:flex items-center gap-2">
              {/* Search icon */}
              <button
                onClick={() => setSearchOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:border-[#001A72] hover:text-[#001A72] transition"
                aria-label="Search"
              >
                <Search size={16} />
              </button>

              {isLoggedIn ? (
                <>
                  <Link
                    href="/app/dashboard"
                    className="flex items-center gap-2 px-4 py-2 bg-[#001A72] text-white text-sm font-bold rounded-xl hover:bg-[#001A72]/90 transition"
                  >
                    <LayoutDashboard size={14} /> Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-500 text-sm font-bold rounded-xl hover:bg-red-50 transition"
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-bold border border-gray-200 text-[#001A72] rounded-xl hover:border-[#001A72] transition"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 text-sm font-bold bg-[#FFB81C] text-[#001A72] rounded-xl hover:bg-[#ffd06f] transition shadow-sm"
                  >
                    Sign Up Free
                  </Link>
                </>
              )}
            </div>

            {/* Mobile: search + hamburger */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => setSearchOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500"
                aria-label="Search"
              >
                <Search size={16} />
              </button>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#001A72] text-white"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
              <Link href="/" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-[#001A72]/5 hover:text-[#001A72]">Home</Link>
              <Link href="/search" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-[#001A72]/5 hover:text-[#001A72]">Find a Tutor</Link>

              {/* Mobile subjects */}
              <div className="px-3 pt-3 pb-2">
                <p className="text-[10px] font-black text-[#001A72] uppercase tracking-widest mb-3">Popular Subjects</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {['Mathematics', 'English', 'Physics', 'Chemistry', 'French', 'IELTS'].map(s => (
                    <Link
                      key={s}
                      href={`/search?subject=${encodeURIComponent(s)}`}
                      onClick={() => setMobileOpen(false)}
                      className="text-xs font-semibold text-gray-600 bg-gray-50 px-3 py-2 rounded-lg hover:bg-[#001A72]/5 hover:text-[#001A72] transition text-center"
                    >
                      {s}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Mobile contact */}
              <div className="px-3 pt-2 pb-1">
                <p className="text-[10px] font-black text-[#001A72] uppercase tracking-widest mb-2">Contact</p>
                <div className="space-y-1.5">
                  {CONTACT.map(({ label, value, href, icon: Icon }) => (
                    <a key={label} href={href} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition">
                      <Icon size={14} className="text-[#001A72]" />
                      <span className="text-xs text-gray-600">{value}</span>
                    </a>
                  ))}
                </div>
              </div>

              <div className="pt-3 space-y-2 border-t border-gray-100">
                {isLoggedIn ? (
                  <>
                    <Link
                      href="/app/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-2 w-full bg-[#001A72] text-white py-3 rounded-xl text-sm font-bold"
                    >
                      <LayoutDashboard size={14} /> Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-center gap-2 w-full border border-red-200 text-red-500 py-3 rounded-xl text-sm font-bold"
                    >
                      <LogOut size={14} /> Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/register"
                      onClick={() => setMobileOpen(false)}
                      className="block w-full bg-[#FFB81C] text-[#001A72] py-3 rounded-xl text-sm font-black text-center"
                    >
                      Sign Up Free
                    </Link>
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="block w-full border border-gray-200 text-[#001A72] py-3 rounded-xl text-sm font-bold text-center"
                    >
                      Sign In
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ── Full-screen search overlay ── */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <Search size={18} className="text-[#001A72] shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Search subjects, tutors…"
                className="flex-1 text-sm text-gray-800 placeholder-gray-400 bg-transparent outline-none"
              />
              <button onClick={() => setSearchOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Popular Searches</p>
              <div className="flex flex-wrap gap-2">
                {['Mathematics', 'English', 'Physics', 'IELTS', 'French', 'Chemistry', 'Yoruba'].map(s => (
                  <button
                    key={s}
                    onClick={() => { router.push(`/search?subject=${encodeURIComponent(s)}`); setSearchOpen(false); }}
                    className="text-xs font-semibold bg-[#001A72]/5 text-[#001A72] px-3 py-1.5 rounded-full hover:bg-[#001A72] hover:text-white transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-4 pb-4">
              <button
                onClick={handleSearch}
                disabled={!searchQuery.trim()}
                className="w-full bg-[#001A72] text-white py-3 rounded-xl text-sm font-bold hover:bg-[#001A72]/90 transition disabled:opacity-40"
              >
                Search Tutors
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
