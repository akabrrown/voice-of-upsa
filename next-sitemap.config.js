const config = {
  siteUrl: 'https://voiceofupsa.com',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  sitemapSize: 5000,
  changefreq: 'daily',
  priority: 0.7,
  exclude: ['/admin/*', '/private/*', '/api/*'],
  robotsTxtOptions: {
    additionalSitemaps: [
      // Add additional sitemaps here if needed
      // `${process.env.NEXT_PUBLIC_SITE_URL}/server-sitemap.xml`,
    ],
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/private', '/api'],
      },
    ],
  },
};

export default config;
