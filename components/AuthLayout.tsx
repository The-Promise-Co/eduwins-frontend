import Link from 'next/link';
import AuthSlider from '@/components/AuthSlider';

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Shared split-screen shell used by all auth pages:
 * Login, Register, Verify OTP, Forgot Password, Reset Password.
 *
 * Left side:  logo + centred content (children) + empty footer area
 * Right side: AuthSlider (hidden on mobile)
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Left Column */}
      <div className="w-full md:w-1/2 flex flex-col justify-between py-8 px-6 md:px-16 lg:px-24 h-screen overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center justify-center pt-2 pb-8">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="EduWins Logo" className="h-8" />
          </Link>
        </div>

        {/* Page content */}
        <div className="flex flex-col flex-grow items-center justify-center w-full max-w-[400px] mx-auto pb-12">
          {children}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-6" />
      </div>

      {/* Right Column */}
      <div className="hidden md:block md:w-1/2 relative bg-primary items-center justify-center overflow-hidden">
        <AuthSlider />
      </div>
    </div>
  );
}
