'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import Image from 'next/image';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  backButtonText?: string;
  backButtonHref?: string;
}

export default function Header({ 
  title, 
  subtitle, 
  showBackButton = false, 
  backButtonText = "← Back",
  backButtonHref = "/dashboard"
}: HeaderProps) {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Left Side - Logo and Title */}
          <div className="flex items-center min-w-0 flex-1">
            <Link href="/dashboard" className="flex items-center flex-shrink-0">
              <Image
                src="/logo1.png"
                alt="Linkup Communications"
                width={300}
                height={138}
                className="h-8 w-auto mr-3"
                unoptimized
              />
            </Link>
            
            <div className="min-w-0 flex-1">
              {showBackButton && (
                <Link
                  href={backButtonHref}
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium mb-1 inline-block"
                >
                  {backButtonText}
                </Link>
              )}
              {title && (
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-sm text-gray-600 hidden sm:block truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right Side - User Info and Menu */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="sm:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Desktop menu */}
            <div className="hidden sm:flex items-center space-x-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                {session?.user?.role === 'admin' ? 'Administrator' : 'Staff Member'}
              </span>
              <span className="text-sm text-gray-700 font-medium truncate max-w-32">
                {session?.user?.name}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/auth/login' })}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium whitespace-nowrap"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {isMobileMenuOpen && (
          <div className="sm:hidden border-t border-gray-200 py-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 font-medium">
                  {session?.user?.name}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                  {session?.user?.role === 'admin' ? 'Admin' : 'Staff'}
                </span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/auth/login' })}
                className="w-full text-left text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
