import React from 'react';
import { motion } from 'framer-motion';
import { FiLock, FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';
import Layout from '@/components/Layout';

const UnauthorizedPage: React.FC = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex justify-center mb-6">
              <div className="bg-red-100 text-red-600 p-4 rounded-full">
                <FiLock className="text-4xl" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-navy mb-4">
              Access Denied
            </h1>
            
            <p className="text-gray-600 mb-6">
              You don&apos;t have permission to access this page. Please contact an administrator if you believe this is an error.
            </p>
            
            <div className="space-y-3">
              <Link 
                href="/"
                className="w-full bg-golden text-navy font-semibold py-3 px-6 rounded-lg hover:bg-yellow-400 transition-colors duration-200 flex items-center justify-center"
              >
                <FiArrowLeft className="mr-2" />
                Back to Home
              </Link>
              
              <Link 
                href="/account-settings"
                className="w-full bg-navy text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-800 transition-colors duration-200 flex items-center justify-center"
              >
                View Profile
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default UnauthorizedPage;
