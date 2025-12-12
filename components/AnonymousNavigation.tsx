import React from 'react';
import Link from 'next/link';
import { FiMessageCircle, FiHome, FiShield, FiHelpCircle } from 'react-icons/fi';

const AnonymousNavigation: React.FC = () => {
  return (
    <nav className="bg-purple-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and main link */}
          <div className="flex items-center">
            <Link href="/anonymous" className="flex items-center space-x-2 text-white hover:text-purple-200 transition-colors">
              <FiMessageCircle className="w-6 h-6" />
              <span className="font-bold text-lg">Anonymous Zone</span>
            </Link>
          </div>

          {/* Navigation links */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/anonymous" className="flex items-center space-x-1 text-white hover:text-purple-200 px-3 py-2 rounded-md hover:bg-purple-700 transition-colors">
              <FiHome className="w-4 h-4" />
              <span>Home</span>
            </Link>
            <Link href="/categories/anonymous" className="flex items-center space-x-1 text-white hover:text-purple-200 px-3 py-2 rounded-md hover:bg-purple-700 transition-colors">
              <FiMessageCircle className="w-4 h-4" />
              <span>Messages</span>
            </Link>
            <Link href="/anonymous/about" className="flex items-center space-x-1 text-white hover:text-purple-200 px-3 py-2 rounded-md hover:bg-purple-700 transition-colors">
              <FiHelpCircle className="w-4 h-4" />
              <span>About</span>
            </Link>
            <Link href="/anonymous/safety" className="flex items-center space-x-1 text-white hover:text-purple-200 px-3 py-2 rounded-md hover:bg-purple-700 transition-colors">
              <FiShield className="w-4 h-4" />
              <span>Safety</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="p-2 rounded-md hover:bg-purple-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden border-t border-purple-700">
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link href="/anonymous" className="block px-3 py-2 hover:bg-purple-700 rounded-md text-white">
            <div className="flex items-center space-x-2">
              <FiHome className="w-4 h-4" />
              <span>Home</span>
            </div>
          </Link>
          <Link href="/categories/anonymous" className="block px-3 py-2 hover:bg-purple-700 rounded-md text-white">
            <div className="flex items-center space-x-2">
              <FiMessageCircle className="w-4 h-4" />
              <span>Messages</span>
            </div>
          </Link>
          <Link href="/anonymous/about" className="block px-3 py-2 hover:bg-purple-700 rounded-md text-white">
            <div className="flex items-center space-x-2">
              <FiHelpCircle className="w-4 h-4" />
              <span>About</span>
            </div>
          </Link>
          <Link href="/anonymous/safety" className="block px-3 py-2 hover:bg-purple-700 rounded-md text-white">
            <div className="flex items-center space-x-2">
              <FiShield className="w-4 h-4" />
              <span>Safety</span>
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default AnonymousNavigation;
