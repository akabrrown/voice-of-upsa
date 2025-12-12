import { Html, Head, Main, NextScript, DocumentContext, DocumentInitialProps } from 'next/document';
import NextDocument from 'next/document';

interface MyDocumentProps extends DocumentInitialProps {
  nonce?: string;
}

export default function Document(props: MyDocumentProps) {
  const { nonce } = props;

  return (
    <Html lang="en" data-scroll-behavior="smooth" nonce={nonce}>
      <Head>
        <meta name="description" content="Voice of UPSA - Latest news and updates from UPSA" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Security Headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        <meta httpEquiv="Permissions-Policy" content="microphone=(), geolocation=()" />
        
        {/* PWA Meta Tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FFD700" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="VOU" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        
        {/* Make nonce available to CSS-in-JS libraries */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.__CSP_NONCE__ = "${nonce || ''}";
              // Make nonce available to Emotion and other CSS-in-JS libraries
              if (typeof window !== 'undefined') {
                window.__webpack_nonce__ = window.__CSP_NONCE__;
              }
            `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

Document.getInitialProps = async (ctx: DocumentContext): Promise<MyDocumentProps> => {
  // Extract nonce from response headers
  const nonce = ctx.res?.getHeader('X-CSP-Nonce') as string || '';
  
  const initialProps = await NextDocument.getInitialProps(ctx);
  
  return {
    ...initialProps,
    nonce,
  };
};
