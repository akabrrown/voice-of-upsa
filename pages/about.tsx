import React from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { FiTarget, FiUsers, FiBook, FiAward, FiHeart } from 'react-icons/fi';

const AboutPage: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Mission Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
            >
              <motion.div variants={itemVariants}>
                <h2 className="text-3xl font-bold text-navy mb-6">Our Mission</h2>
                <p className="text-gray-600 mb-4">
                  Voice of UPSA is dedicated to providing accurate, timely, and relevant news to the University of Professional Studies community. We strive to be the trusted source of information that connects students, faculty, and staff.
                </p>
                <p className="text-gray-600 mb-6">
                  Through comprehensive coverage of campus events, academic achievements, and community stories, we aim to foster a sense of unity and pride within the UPSA ecosystem.
                </p>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-golden">
                    <FiTarget className="mr-2" />
                    <span className="font-semibold">Excellence in Journalism</span>
                  </div>
                </div>
              </motion.div>
              <motion.div variants={itemVariants} className="relative">
                <div className="bg-gradient-to-r from-navy to-golden rounded-lg p-8 text-white">
                  <h3 className="text-2xl font-bold mb-4">Our Values</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <FiHeart className="mt-1 mr-3 text-golden flex-shrink-0" />
                      <span>Passion for truth and integrity in reporting</span>
                    </li>
                    <li className="flex items-start">
                      <FiUsers className="mt-1 mr-3 text-golden flex-shrink-0" />
                      <span>Community-focused storytelling</span>
                    </li>
                    <li className="flex items-start">
                      <FiBook className="mt-1 mr-3 text-golden flex-shrink-0" />
                      <span>Commitment to educational excellence</span>
                    </li>
                    <li className="flex items-start">
                      <FiAward className="mt-1 mr-3 text-golden flex-shrink-0" />
                      <span>Professional development and growth</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default AboutPage;
