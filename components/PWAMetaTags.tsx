import Head from 'next/head';

const PWAMetaTags = () => {
  return (
    <Head>
      {/* PWA Meta Tags */}
      <meta name="application-name" content="Voice of UPSA" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="VOU" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="msapplication-config" content="/icons/browserconfig.xml" />
      <meta name="msapplication-TileColor" content="#001F3F" />
      <meta name="msapplication-tap-highlight" content="no" />
      <meta name="theme-color" content="#FFD700" />

      {/* Apple Touch Icon */}
      <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
      <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512x512.png" />

      {/* Standard Favicon */}
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon.ico" />
      <link rel="manifest" href="/manifest.json" />
    </Head>
  );
};

export default PWAMetaTags;
