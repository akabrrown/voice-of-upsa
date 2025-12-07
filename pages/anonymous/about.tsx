import React from 'react';
import Layout from '@/components/Layout';
import { motion } from 'framer-motion';
import { FiShield, FiEye, FiUsers, FiCheckCircle, FiMessageCircle } from 'react-icons/fi';

const AnonymousAboutPage: React.FC = () => {
  return (
    <Layout 
      title="About Anonymous - Voice of UPSA"
      description="Learn how our anonymous messaging system works and keeps you safe"
    >
      {/* Hero Section */}
      <div className="bg-navy text-white">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-golden rounded-full flex items-center justify-center">
              <FiMessageCircle className="w-8 h-8 text-navy" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">About Anonymous Zone</h1>
          <p className="text-xl text-gray-300">
            Learn how our anonymous messaging system works and keeps you safe
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Introduction */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-8 mb-8 border-t-4 border-golden"
        >
          <h2 className="text-3xl font-bold mb-6 text-center text-navy">What is Anonymous Zone?</h2>
          <p className="text-lg text-gray-700 mb-6">
            Anonymous Zone is a safe space where UPSA students and community members can share their thoughts, 
            stories, and opinions without revealing their identity. Whether you want to ask sensitive questions, 
            share personal experiences, or express opinions freely, our platform ensures your privacy while 
            maintaining a respectful community environment.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 bg-navy/10 rounded-lg flex items-center justify-center">
                  <FiShield className="w-6 h-6 text-navy" />
                </div>
              </div>
              <h3 className="font-semibold text-navy mb-2">100% Anonymous</h3>
              <p className="text-gray-600 text-sm">No personal information is ever collected or stored</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 bg-navy/10 rounded-lg flex items-center justify-center">
                  <FiEye className="w-6 h-6 text-navy" />
                </div>
              </div>
              <h3 className="font-semibold text-navy mb-2">Moderated Content</h3>
              <p className="text-gray-600 text-sm">All posts are reviewed to ensure community safety</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 bg-navy/10 rounded-lg flex items-center justify-center">
                  <FiUsers className="w-6 h-6 text-navy" />
                </div>
              </div>
              <h3 className="font-semibold text-navy mb-2">Community Driven</h3>
              <p className="text-gray-600 text-sm">Built for and by the UPSA community</p>
            </div>
          </div>
        </motion.div>

        {/* How It Works */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-3xl font-bold mb-6 text-center text-navy">How It Works</h2>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-golden rounded-full flex items-center justify-center">
                <span className="text-navy font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-navy mb-2">Submit Your Message</h3>
                <p className="text-gray-600">
                  Write your question, story, or opinion. No registration or personal information required.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-golden rounded-full flex items-center justify-center">
                <span className="text-navy font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-navy mb-2">Admin Review</h3>
                <p className="text-gray-600">
                  Our admin team reviews all submissions to ensure they meet community guidelines and are appropriate.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-golden rounded-full flex items-center justify-center">
                <span className="text-navy font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-navy mb-2">Go Live</h3>
                <p className="text-gray-600">
                  Once approved, your message appears in the Anonymous Zone for others to see and respond to.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-3xl font-bold mb-6 text-center text-navy">Key Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <FiCheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-navy mb-1">No Registration Required</h3>
                <p className="text-gray-600">Start sharing immediately without creating an account</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <FiCheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-navy mb-1">Admin Questions</h3>
                <p className="text-gray-600">Respond to questions posted by community administrators</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <FiCheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-navy mb-1">Like & Report</h3>
                <p className="text-gray-600">Engage with content through likes and report inappropriate posts</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <FiCheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-navy mb-1">24/7 Moderation</h3>
                <p className="text-gray-600">Continuous monitoring to maintain a safe environment</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Guidelines */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <h2 className="text-3xl font-bold mb-6 text-center text-navy">Community Guidelines</h2>
          <div className="prose max-w-none">
            <ul className="space-y-3">
              <li className="flex items-start space-x-2">
                <span className="text-golden mt-1 font-bold">•</span>
                <span className="text-gray-700">Be respectful and considerate of others&apos; feelings and opinions</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-golden mt-1 font-bold">•</span>
                <span className="text-gray-700">No hate speech, bullying, or harassment of any kind</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-golden mt-1 font-bold">•</span>
                <span className="text-gray-700">Keep discussions constructive and helpful</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-golden mt-1 font-bold">•</span>
                <span className="text-gray-700">Do not share personal information about yourself or others</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-golden mt-1 font-bold">•</span>
                <span className="text-gray-700">Report inappropriate content to help maintain community standards</span>
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default AnonymousAboutPage;
