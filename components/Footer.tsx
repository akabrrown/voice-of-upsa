import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer className="bg-navy text-white py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between">
          {/* Logo */}
          <Link href="/" className="mb-4 md:mb-0">
            <Image
              src="/logo.jpg"
              alt="UPSA Logo"
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
              loading="eager"
            />
          </Link>
          
          {/* Copyright */}
          <p className="text-gray-300 text-sm">
            &copy; {new Date().getFullYear()} Voice of UPSA, Accra. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;