import React from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { FiFacebook, FiTwitter, FiInstagram, FiLinkedin, FiYoutube, FiShare2, FiExternalLink } from 'react-icons/fi';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BreadcrumbNavigation from '../components/BreadcrumbNavigation';

const Social: React.FC = () => {
  const breadcrumbs = [
    { label: 'Connect', active: true }
  ];

  const socialPlatforms = [
    {
      name: 'Facebook',
      icon: FiFacebook,
      url: 'https://facebook.com/voiceofupsa',
      description: 'Follow us on Facebook for daily updates and community discussions',
      color: 'bg-blue-600',
      followers: '5.2K'
    },
    {
      name: 'Twitter',
      icon: FiTwitter,
      url: 'https://twitter.com/voiceofupsa',
      description: 'Join the conversation on Twitter for real-time news and updates',
      color: 'bg-sky-500',
      followers: '3.8K'
    },
    {
      name: 'Instagram',
      icon: FiInstagram,
      url: 'https://instagram.com/voiceofupsa',
      description: 'Visual stories and behind-the-scenes content on Instagram',
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      followers: '2.1K'
    },
    {
      name: 'LinkedIn',
      icon: FiLinkedin,
      url: 'https://linkedin.com/company/voiceofupsa',
      description: 'Professional updates and networking on LinkedIn',
      color: 'bg-blue-700',
      followers: '1.5K'
    },
    {
      name: 'YouTube',
      icon: FiYoutube,
      url: 'https://youtube.com/voiceofupsa',
      description: 'Video content, interviews, and event coverage on YouTube',
      color: 'bg-red-600',
      followers: '890'
    }
  ];

  return (
    <>
      <Head>
        <title>Connect With Us - Voice of UPSA</title>
        <meta name="description" content="Connect with Voice of UPSA on social media platforms for the latest updates and community engagement." />
        <meta name="keywords" content="social media, connect, Facebook, Twitter, Instagram, LinkedIn, YouTube, Voice of UPSA" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BreadcrumbNavigation items={breadcrumbs} className="mb-6" />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {/* Header Section */}
            <div className="text-center">
              <h1 className="text-4xl font-bold text-navy mb-4">Connect With Us</h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Stay connected with Voice of UPSA across all our social media platforms. 
                Join our community and never miss an update.
              </p>
            </div>

            {/* Social Media Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {socialPlatforms.map((platform, index) => (
                <motion.div
                  key={platform.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
                >
                  <div className={`${platform.color} p-6 text-white`}>
                    <div className="flex items-center justify-between mb-4">
                      <platform.icon className="w-8 h-8" />
                      <span className="text-sm font-medium">{platform.followers} followers</span>
                    </div>
                    <h3 className="text-xl font-bold">{platform.name}</h3>
                  </div>
                  
                  <div className="p-6">
                    <p className="text-gray-600 mb-4">{platform.description}</p>
                    
                    <div className="flex space-x-3">
                      <a
                        href={platform.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex-1 ${platform.color} text-white py-2 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity duration-200 flex items-center justify-center`}
                      >
                        <FiExternalLink className="w-4 h-4 mr-2" />
                        Visit
                      </a>
                      <button
                        className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center"
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: `Voice of UPSA on ${platform.name}`,
                              url: platform.url,
                            });
                          }
                        }}
                      >
                        <FiShare2 className="w-4 h-4 mr-2" />
                        Share
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Social Media Guidelines */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-semibold text-navy mb-6">Community Guidelines</h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium text-navy mb-4">What We Encourage</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Respectful discussions and constructive feedback
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Sharing relevant content and resources
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Community engagement and participation
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      Supporting fellow community members
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-navy mb-4">What We Don&apos;t Allow</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2">✗</span>
                      Hate speech and discriminatory content
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2">✗</span>
                      Spam and irrelevant promotions
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2">✗</span>
                      Personal attacks and harassment
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2">✗</span>
                      False information and rumors
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Hashtag Section */}
            <div className="bg-gradient-to-r from-navy to-navy-dark rounded-lg p-8 text-white">
              <h2 className="text-2xl font-bold mb-4">Join the Conversation</h2>
              <p className="text-gray-200 mb-6">
                Use our official hashtags to join the community conversation and get featured:
              </p>
              
              <div className="flex flex-wrap gap-3">
                <span className="bg-white/20 backdrop-blur px-4 py-2 rounded-full font-medium">
                  #VoiceOfUPSA
                </span>
                <span className="bg-white/20 backdrop-blur px-4 py-2 rounded-full font-medium">
                  #UPSANews
                </span>
                <span className="bg-white/20 backdrop-blur px-4 py-2 rounded-full font-medium">
                  #UPSACommunity
                </span>
                <span className="bg-white/20 backdrop-blur px-4 py-2 rounded-full font-medium">
                  #StudentVoice
                </span>
              </div>
            </div>

            {/* Contact Section */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-semibold text-navy mb-6">Social Media Team</h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium text-navy mb-4">For Media Inquiries</h3>
                  <p className="text-gray-600 mb-2">
                    Contact our media team for press releases, interviews, and media partnerships.
                  </p>
                  <p className="text-navy font-medium">media@voiceofupsa.com</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-navy mb-4">For Social Media Collaborations</h3>
                  <p className="text-gray-600 mb-2">
                    Interested in collaborating with us on social media campaigns?
                  </p>
                  <p className="text-navy font-medium">social@voiceofupsa.com</p>
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

export default Social;
