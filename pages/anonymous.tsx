import React from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiMessageCircle, FiSend, FiShield, FiEye, FiArrowRight, FiUsers } from 'react-icons/fi';

const AnonymousPage: React.FC = () => {
  return (
    <Layout 
      title="Anonymous - Voice of UPSA"
      description="Share your thoughts, stories, and opinions completely anonymously"
    >
      {/* Hero Section - Matching main site navy theme */}
      <div className="bg-navy text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center mb-6"
            >
              <div className="w-20 h-20 bg-golden rounded-full flex items-center justify-center">
                <FiMessageCircle className="w-10 h-10 text-navy" />
              </div>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold mb-4"
            >
              Anonymous Zone
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-300 max-w-2xl mx-auto mb-8"
            >
              Share your thoughts, stories, and opinions completely anonymously
            </motion.p>
            
            {/* Feature badges */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap justify-center gap-4"
            >
              <div className="flex items-center space-x-2 bg-navy-light px-4 py-2 rounded-full border border-golden/30">
                <FiShield className="w-5 h-5 text-golden" />
                <span>100% Anonymous</span>
              </div>
              <div className="flex items-center space-x-2 bg-navy-light px-4 py-2 rounded-full border border-golden/30">
                <FiEye className="w-5 h-5 text-golden" />
                <span>Moderated Content</span>
              </div>
              <div className="flex items-center space-x-2 bg-navy-light px-4 py-2 rounded-full border border-golden/30">
                <FiUsers className="w-5 h-5 text-golden" />
                <span>Community Driven</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-t-4 border-golden"
          >
            <div className="flex items-center justify-center w-12 h-12 bg-navy/10 rounded-lg mb-4">
              <FiMessageCircle className="w-6 h-6 text-navy" />
            </div>
            <h3 className="text-xl font-semibold text-navy mb-3">Share Anonymously</h3>
            <p className="text-gray-600 mb-4">
              Post questions, share stories, or express opinions without revealing your identity.
            </p>
            <Link 
              href="/anonymous/submit"
              className="inline-flex items-center text-golden hover:text-yellow-600 font-medium"
            >
              Start Sharing <FiArrowRight className="ml-2" />
            </Link>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-t-4 border-golden"
          >
            <div className="flex items-center justify-center w-12 h-12 bg-navy/10 rounded-lg mb-4">
              <FiShield className="w-6 h-6 text-navy" />
            </div>
            <h3 className="text-xl font-semibold text-navy mb-3">100% Private</h3>
            <p className="text-gray-600 mb-4">
              Your identity is completely protected. No personal information is ever collected or shared.
            </p>
            <Link 
              href="/categories/anonymous"
              className="inline-flex items-center text-golden hover:text-yellow-600 font-medium"
            >
              View Stories <FiArrowRight className="ml-2" />
            </Link>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-t-4 border-golden"
          >
            <div className="flex items-center justify-center w-12 h-12 bg-navy/10 rounded-lg mb-4">
              <FiEye className="w-6 h-6 text-navy" />
            </div>
            <h3 className="text-xl font-semibold text-navy mb-3">Moderated Content</h3>
            <p className="text-gray-600 mb-4">
              All content is reviewed by admins to ensure a safe and respectful community environment.
            </p>
            <Link 
              href="/categories/anonymous"
              className="inline-flex items-center text-golden hover:text-yellow-600 font-medium"
            >
              View Stories <FiArrowRight className="ml-2" />
            </Link>
          </motion.div>
        </div>

        {/* CTA Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-navy rounded-xl p-8 text-center text-white"
        >
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-golden rounded-full flex items-center justify-center">
              <FiSend className="w-8 h-8 text-navy" />
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-4">Ready to Share Your Story?</h2>
          <p className="text-xl mb-8 text-gray-300">
            Join the anonymous community and express yourself freely without judgment.
          </p>
          <Link
            href="/anonymous/submit"
            className="inline-flex items-center bg-golden text-navy px-8 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
          >
            Get Started <FiArrowRight className="ml-2" />
          </Link>
        </motion.div>
      </div>
    </Layout>
  );
};

export default AnonymousPage;
