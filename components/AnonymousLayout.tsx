import React, { ReactNode } from 'react';
import Head from 'next/head';
import Header from './Header';
import Footer from './Footer';

interface AnonymousLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const AnonymousLayout: React.FC<AnonymousLayoutProps> = ({ 
  children, 
  title = "Anonymous", 
  description = "Share your thoughts and stories anonymously" 
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Head>
        <title>{title} - Voice of UPSA</title>
        <meta name="description" content={description} />
      </Head>
      
      {/* Main Site Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-grow pt-16">
        {children}
      </main>

      {/* Main Site Footer */}
      <Footer />
    </div>
  );
};

export default AnonymousLayout;
