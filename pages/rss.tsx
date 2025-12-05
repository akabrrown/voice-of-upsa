import React from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BreadcrumbNavigation from '../components/BreadcrumbNavigation';
import toast from 'react-hot-toast';
import { FiRss, FiCopy, FiDownload, FiCheckCircle } from 'react-icons/fi';

const RSS: React.FC = () => {
  const [copied, setCopied] = React.useState(false);

  const breadcrumbs = [
    { label: 'RSS Feed', active: true }
  ];

  const rssUrl = 'https://voiceofupsa.com/rss.xml';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(rssUrl);
      setCopied(true);
      toast.success('RSS link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleSubscribe = (reader: string) => {
    const urls: Record<string, string> = {
      feedly: `https://feedly.com/i/subscription/feed/${encodeURIComponent(rssUrl)}`,
      inoreader: `https://www.inoreader.com/add_subscription/${encodeURIComponent(rssUrl)}`,
      feedbin: `https://feedbin.com/?subscribe=${encodeURIComponent(rssUrl)}`,
      theoldreader: `https://theoldreader.com/feeds/subscribe?url=${encodeURIComponent(rssUrl)}`,
    };

    if (urls[reader]) {
      window.open(urls[reader], '_blank');
    }
  };

  const rssReaders = [
    { name: 'Feedly', key: 'feedly', description: 'Modern RSS reader with clean interface' },
    { name: 'Inoreader', key: 'inoreader', description: 'Powerful RSS reader with advanced features' },
    { name: 'Feedbin', key: 'feedbin', description: 'Simple, fast RSS reader' },
    { name: 'The Old Reader', key: 'theoldreader', description: 'Classic RSS reader experience' },
  ];

  return (
    <>
      <Head>
        <title>RSS Feed - Voice of UPSA</title>
        <meta name="description" content="Subscribe to the Voice of UPSA RSS feed to get the latest articles delivered directly to your RSS reader." />
        <meta name="keywords" content="RSS, feed, subscribe, articles, updates, Voice of UPSA" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BreadcrumbNavigation items={breadcrumbs} className="mb-6" />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {/* Header Section */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-golden rounded-full mb-4">
                <FiRss className="w-8 h-8 text-navy" />
              </div>
              <h1 className="text-4xl font-bold text-navy mb-4">RSS Feed</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Subscribe to our RSS feed to stay updated with the latest articles from Voice of UPSA
              </p>
            </div>

            {/* RSS URL Section */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-semibold text-navy mb-6">RSS Feed URL</h2>
              
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex-1">
                  <div className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 font-mono text-sm">
                    {rssUrl}
                  </div>
                </div>
                <button
                  onClick={handleCopyLink}
                  className="bg-navy text-white px-6 py-3 rounded-lg font-medium hover:bg-navy-dark transition-colors duration-200 flex items-center"
                >
                  {copied ? (
                    <>
                      <FiCheckCircle className="w-5 h-5 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <FiCopy className="w-5 h-5 mr-2" />
                      Copy
                    </>
                  )}
                </button>
                <a
                  href={rssUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-golden text-navy px-6 py-3 rounded-lg font-medium hover:bg-golden-dark transition-colors duration-200 flex items-center"
                >
                  <FiDownload className="w-5 h-5 mr-2" />
                  View
                </a>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  <strong>What is RSS?</strong> RSS (Really Simple Syndication) allows you to receive updates 
                  from your favorite websites in one place using an RSS reader application.
                </p>
              </div>
            </div>

            {/* RSS Readers Section */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-semibold text-navy mb-6">Popular RSS Readers</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {rssReaders.map((reader, index) => (
                  <motion.div
                    key={reader.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="border border-gray-200 rounded-lg p-6 hover:border-golden transition-colors duration-200"
                  >
                    <h3 className="text-lg font-semibold text-navy mb-2">{reader.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{reader.description}</p>
                    <button
                      onClick={() => handleSubscribe(reader.key)}
                      className="text-golden hover:text-golden-dark font-medium text-sm flex items-center"
                    >
                      Subscribe with {reader.name}
                      <FiRss className="w-4 h-4 ml-1" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Features Section */}
            <div className="grid md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="w-12 h-12 bg-navy rounded-lg flex items-center justify-center mb-4">
                  <FiRss className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-navy mb-2">Real-time Updates</h3>
                <p className="text-gray-600">
                  Get instant updates when new articles are published on Voice of UPSA
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="w-12 h-12 bg-golden rounded-lg flex items-center justify-center mb-4">
                  <FiDownload className="w-6 h-6 text-navy" />
                </div>
                <h3 className="text-lg font-semibold text-navy mb-2">Offline Reading</h3>
                <p className="text-gray-600">
                  Download articles for offline reading in your favorite RSS reader
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="w-12 h-12 bg-navy rounded-lg flex items-center justify-center mb-4">
                  <FiCheckCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-navy mb-2">No Spam</h3>
                <p className="text-gray-600">
                  Only receive article updates - no marketing emails or notifications
                </p>
              </motion.div>
            </div>

            {/* FAQ Section */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-semibold text-navy mb-6">Frequently Asked Questions</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-navy mb-2">How do I subscribe to the RSS feed?</h3>
                  <p className="text-gray-600">
                    Copy the RSS feed URL above and paste it into your favorite RSS reader, 
                    or click on one of the &quot;Subscribe with&quot; buttons for quick setup.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-navy mb-2">What RSS readers do you recommend?</h3>
                  <p className="text-gray-600">
                    We recommend Feedly for beginners, Inoreader for power users, and Feedbin 
                    for those who prefer a simple, clean interface.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-navy mb-2">How often is the RSS feed updated?</h3>
                  <p className="text-gray-600">
                    The RSS feed is updated immediately when new articles are published. 
                    Most RSS readers check for updates every hour.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-navy mb-2">Can I use the RSS feed in my own application?</h3>
                  <p className="text-gray-600">
                    Yes! Our RSS feed is available for personal and non-commercial use. 
                    For commercial use, please contact us at media@voiceofupsa.com.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-navy mb-2">What content is included in the RSS feed?</h3>
                  <p className="text-gray-600">
                    The RSS feed includes all published articles with titles, summaries, 
                    publication dates, and links to the full articles.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default RSS;
