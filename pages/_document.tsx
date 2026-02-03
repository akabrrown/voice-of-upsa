import Document, { Html, Head, Main, NextScript, DocumentContext, DocumentInitialProps } from 'next/document';

interface MyDocumentProps extends DocumentInitialProps {
  nonce?: string;
}

export default class MyDocument extends Document<MyDocumentProps> {
  static override async getInitialProps(ctx: DocumentContext): Promise<MyDocumentProps> {
    const initialProps = await Document.getInitialProps(ctx);
    const nonce = ctx.req?.headers['x-nonce'] as string | undefined;
    return { ...initialProps, nonce };
  }

  override render() {
    const { nonce } = this.props;

    return (
      <Html lang="en" data-scroll-behavior="smooth">
        <Head nonce={nonce}>
          <meta name="ssr-debug" content="rendered-at-root" />
          <meta charSet="utf-8" />
          <link rel="icon" href="/favicon.ico" />
          
          {/* Fallback OG Tag for Debugging */}
          <meta property="og:site_name" content="Voice of UPSA SSR" />
          
          {/* Security Headers */}
          <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
          <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
          
          {/* PWA Meta Tags */}
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#FFD700" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-title" content="VOU" />
          
        </Head>
        <body>
          <Main />
          <NextScript nonce={nonce} />
        </body>
      </Html>
    );
  }
}
