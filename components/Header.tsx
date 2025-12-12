import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useSupabase } from './SupabaseProvider';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { FiMenu, FiX, FiHome, FiFileText, FiInfo, FiMail, FiUser, FiSettings, FiEdit, FiUsers, FiBookmark, FiDollarSign, FiMessageCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface NavLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const Header: React.FC = () => {
  // Base navigation links
  const baseLinks: NavLink[] = [
    { href: '/', label: 'Home', icon: FiHome },
    { href: '/articles', label: 'Categories', icon: FiFileText },
    { href: '/ads', label: 'Advertise', icon: FiDollarSign },
    { href: '/anonymous', label: 'Anonymous', icon: FiMessageCircle },
    { href: '/about', label: 'About', icon: FiInfo },
    { href: '/contact', label: 'Contact', icon: FiMail },
  ];

  const { user, userRole, supabase } = useSupabase();
  const { settings: siteSettings } = useSiteSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
      router.push('/');
      setMobileMenuOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Navigation links based on user role
  const getNavigationLinks = () => {
    if (!user) return baseLinks;

    const userLinks = [
      ...baseLinks,
      { href: '/bookmarks', label: 'Bookmarks', icon: FiBookmark },
      { href: '/account-settings', label: 'Settings', icon: FiSettings },
    ];

    if (userRole === 'editor' || userRole === 'admin') {
      userLinks.push(
        { href: '/editor/create', label: 'Create Article', icon: FiEdit },
        { href: '/editor/articles', label: 'Manage Articles', icon: FiFileText }
      );
    }

    if (userRole === 'admin') {
      userLinks.push(
        { href: '/admin', label: 'Admin Panel', icon: FiUsers },
        { href: '/admin/ads', label: 'Manage Ads', icon: FiDollarSign },
        { href: '/admin/users', label: 'Manage Users', icon: FiUsers },
        { href: '/admin/settings', label: 'Site Settings', icon: FiSettings }
      );
    }

    return userLinks;
  };

  const navigationLinks = getNavigationLinks();

  return (
    <header className="fixed top-0 left-0 right-0 bg-navy text-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <Image
              src={siteSettings.site_logo}
              alt={siteSettings.site_name}
              width={48}
              height={48}
              className="h-12 w-12 rounded-full object-cover"
              loading="eager"
              priority
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/logo.jpg'; // Fallback to default logo
              }}
            />
          </Link>
          
          {/* Desktop Navigation - Centered */}
          <nav className="hidden md:flex items-center space-x-6 flex-1 justify-center">
            {navigationLinks.slice(0, 4).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`hover:text-golden transition-colors ${
                  router.pathname === link.href ? 'text-golden' : ''
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          
          {/* Right side - Auth buttons */}
          <div className="hidden md:flex items-center space-x-4">
            
            {/* Dropdown for authenticated users */}
            {user && (
              <div className="relative group">
                <button className="flex items-center space-x-1 hover:text-golden transition-colors">
                  <FiUser className="w-5 h-5" />
                  <span>Account</span>
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-56 bg-white text-navy rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="py-2">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-semibold truncate">{user.email}</p>
                      {userRole && (
                        <p className="text-xs text-gray-600 capitalize">{userRole}</p>
                      )}
                    </div>
                    
                    {navigationLinks.slice(4).map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 transition-colors"
                      >
                        <link.icon className="w-4 h-4" />
                        <span className="text-sm">{link.label}</span>
                      </Link>
                    ))}
                    
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors border-t border-gray-200 mt-2"
                    >
                      <FiX className="w-4 h-4" />
                      <span className="text-sm">Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {!user && (
              <Link
                href="/auth/sign-in"
                className="bg-golden text-navy px-4 py-2 rounded font-semibold hover:bg-yellow-400 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-navy-light transition-colors"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? (
              <FiX className="w-6 h-6" />
            ) : (
              <FiMenu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-navy-dark border-t border-navy-light">
          <div className="max-h-[70vh] overflow-y-auto">
            <nav className="px-4 py-4 space-y-2">
              {/* Main Navigation */}
              <div className="space-y-1">
                <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider sticky top-0 bg-navy-dark z-10">
                  Main
                </div>
                {baseLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMobileMenu}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-navy-light transition-colors ${
                      router.pathname === link.href ? 'bg-navy-light text-golden' : ''
                    }`}
                  >
                    <link.icon className="w-5 h-5" />
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>

              {/* User Links */}
              {user && (
                <div className="space-y-1 border-t border-navy-light pt-4 mt-4">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider sticky top-0 bg-navy-dark z-10">
                    User
                  </div>
                  {[
                    { href: '/bookmarks', label: 'Bookmarks', icon: FiBookmark },
                    { href: '/account-settings', label: 'Settings', icon: FiSettings },
                  ].map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeMobileMenu}
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-navy-light transition-colors"
                    >
                      <link.icon className="w-5 h-5" />
                      <span>{link.label}</span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Editor Tools */}
              {userRole === 'editor' || userRole === 'admin' ? (
                <div className="space-y-1 border-t border-navy-light pt-4 mt-4">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider sticky top-0 bg-navy-dark z-10">
                    Editor Tools
                  </div>
                  {[
                    { href: '/editor/create', label: 'Create Article', icon: FiEdit },
                    { href: '/editor/articles', label: 'Manage Articles', icon: FiFileText }
                  ].map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeMobileMenu}
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-navy-light transition-colors"
                    >
                      <link.icon className="w-5 h-5" />
                      <span>{link.label}</span>
                    </Link>
                  ))}
                </div>
              ) : null}

              {/* Admin Tools */}
              {userRole === 'admin' ? (
                <div className="space-y-1 border-t border-navy-light pt-4 mt-4">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider sticky top-0 bg-navy-dark z-10">
                    Admin Tools
                  </div>
                  {[
                    { href: '/admin', label: 'Admin Panel', icon: FiUsers },
                    { href: '/admin/ads', label: 'Manage Ads', icon: FiDollarSign },
                    { href: '/admin/users', label: 'Manage Users', icon: FiUsers },
                    { href: '/admin/settings', label: 'Site Settings', icon: FiSettings }
                  ].map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeMobileMenu}
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-navy-light transition-colors"
                    >
                      <link.icon className="w-5 h-5" />
                      <span>{link.label}</span>
                    </Link>
                  ))}
                </div>
              ) : null}

              {/* User Section */}
              {user ? (
                <div className="space-y-1 border-t border-navy-light pt-4 mt-4">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider sticky top-0 bg-navy-dark z-10">
                    Account
                  </div>
                  <div className="px-4 py-2 mb-2">
                    <p className="text-sm font-semibold truncate">{user.email}</p>
                    {userRole && (
                      <p className="text-xs text-gray-400 capitalize">{userRole}</p>
                    )}
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-left text-red-400 hover:bg-red-900/20 transition-colors"
                  >
                    <FiX className="w-5 h-5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="border-t border-navy-light pt-4 mt-4">
                  <Link
                    href="/auth/sign-in"
                    onClick={closeMobileMenu}
                    className="block w-full bg-golden text-navy px-4 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors text-center"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
