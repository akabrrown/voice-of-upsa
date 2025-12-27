import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from './Header';
import Footer from './Footer';
import MaintenanceMode from './MaintenanceMode';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  ogImage?: string;
  ogDescription?: string;
  ogUrl?: string;
}

interface SiteSettings {
  site_name: string;
  site_description: string;
  site_url: string;
  site_logo: string;
  contact_email: string;
  maintenance_mode: boolean;
  allow_comments: boolean;
  max_upload_size: number;
  allowed_image_types: string[];
}

const Layout: React.FC<LayoutProps> = ({ 
  children,
  title = 'Voice of UPSA', 
  description = 'News and updates from UPSA',
  ogImage,
  ogDescription = description,
  ogUrl
}) => {
  const router = useRouter();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Debug logging for social sharing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('Layout props:', { title, description, ogImage, ogDescription });
      const finalOgImage = ogImage || '/images/og-default.jpg';
      const imageUrl = finalOgImage.startsWith('http') ? finalOgImage : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}${finalOgImage}`;
      console.log('Final OG image URL:', imageUrl, 'Original ogImage:', ogImage);
    }
  }, [title, description, ogImage, ogDescription]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/public/settings');
        if (response.ok) {
          const siteSettings = await response.json();
          setSettings(siteSettings);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Check if current page is admin page
  const isAdminPage = router.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph Meta Tags */}
        <meta key="og:title" property="og:title" content={title} />
        <meta key="og:description" property="og:description" content={ogDescription} />
        <meta key="og:type" property="og:type" content={router.pathname.startsWith('/articles/') ? 'article' : 'website'} />
        {(() => {
          // Determine the final OG image
          let finalImageUrl = '';
          const siteUrl = 'https://voiceofupsa.com'; // Hardcode for stability in production
          
          if (ogImage) {
            // If ogImage is already absolute (starts with http/https), use it as is
            if (ogImage.startsWith('http://') || ogImage.startsWith('https://')) {
              finalImageUrl = ogImage;
            } else {
              // If relative, prepend the site URL
              finalImageUrl = `${siteUrl}${ogImage.startsWith('/') ? ogImage : '/' + ogImage}`;
            }
          } else {
            // Use default OG image
            finalImageUrl = `${siteUrl}/images/og-default.jpg`;
          }
          
          return [
            <meta key="og:image" property="og:image" content={finalImageUrl} />,
            <meta key="og:image:secure_url" property="og:image:secure_url" content={finalImageUrl} />,
            <meta key="og:image:width" property="og:image:width" content="1200" />,
            <meta key="og:image:height" property="og:image:height" content="630" />,
            <meta key="og:image:alt" property="og:image:alt" content={title} />,
            <meta key="og:image:type" property="og:image:type" content="image/jpeg" />
          ];
        })()}
        <meta key="og:url" property="og:url" content={ogUrl || (typeof window !== 'undefined' ? window.location.href : 'https://voiceofupsa.com')} />
        <meta key="og:site_name" property="og:site_name" content={settings?.site_name || 'Voice of UPSA'} />
        
        {/* Twitter Card Meta Tags */}
        <meta key="twitter:card" name="twitter:card" content="summary_large_image" />
        <meta key="twitter:title" name="twitter:title" content={title} />
        <meta key="twitter:description" name="twitter:description" content={ogDescription} />
        {(() => {
          // Use the same logic as OG image for Twitter
          let finalImageUrl = '';
          const siteUrl = 'https://voiceofupsa.com';
          
          if (ogImage) {
            if (ogImage.startsWith('http://') || ogImage.startsWith('https://')) {
              finalImageUrl = ogImage;
            } else {
              finalImageUrl = `${siteUrl}${ogImage.startsWith('/') ? ogImage : '/' + ogImage}`;
            }
          } else {
            finalImageUrl = `${siteUrl}/images/og-default.jpg`;
          }
          
          return [
            <meta key="twitter:image" name="twitter:image" content={finalImageUrl} />,
            <meta key="twitter:image:alt" name="twitter:image:alt" content={title} />
          ];
        })()}
      </Head>

      {loading ? (
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      ) : settings?.maintenance_mode && !isAdminPage ? (
        <MaintenanceMode settings={settings} />
      ) : (
        <>
          <Header />
          {/* Main Content */}
          <main className="flex-grow pt-16">
            {children}
          </main>
          <Footer />
        </>
      )}
    </div>
  );
};

export default Layout;
