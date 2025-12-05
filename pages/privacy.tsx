import React from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BreadcrumbNavigation from '../components/BreadcrumbNavigation';

const PrivacyPolicy: React.FC = () => {
  const breadcrumbs = [
    { label: 'Privacy Policy', active: true }
  ];

  return (
    <>
      <Head>
        <title>Privacy Policy - Voice of UPSA</title>
        <meta name="description" content="Privacy Policy for Voice of UPSA - Learn how we collect, use, and protect your information." />
        <meta name="keywords" content="privacy policy, data protection, user information, Voice of UPSA" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BreadcrumbNavigation items={breadcrumbs} className="mb-6" />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg shadow-md p-8"
          >
            <h1 className="text-3xl font-bold text-navy mb-6">Privacy Policy</h1>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 mb-6">
                Last updated: {new Date().toLocaleDateString()}
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy mb-4">Introduction</h2>
                <p className="text-gray-700 mb-4">
                  Voice of UPSA (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. 
                  This Privacy Policy explains how we collect, use, disclose, and safeguard your 
                  information when you visit our website and use our services.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy mb-4">Information We Collect</h2>
                
                <h3 className="text-xl font-medium text-navy mb-3">Personal Information</h3>
                <p className="text-gray-700 mb-4">
                  We may collect personal information that you voluntarily provide to us, including:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-6">
                  <li>Name and email address</li>
                  <li>Profile information and bio</li>
                  <li>Profile picture</li>
                  <li>Articles and content you create</li>
                  <li>Comments and reactions</li>
                </ul>

                <h3 className="text-xl font-medium text-navy mb-3">Usage Information</h3>
                <p className="text-gray-700 mb-4">
                  We automatically collect information about how you use our website:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-6">
                  <li>Pages visited and time spent</li>
                  <li>Articles viewed and read</li>
                  <li>IP address and browser information</li>
                  <li>Device information</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy mb-4">How We Use Your Information</h2>
                <p className="text-gray-700 mb-4">We use your information to:</p>
                <ul className="list-disc pl-6 text-gray-700 mb-6">
                  <li>Provide and maintain our services</li>
                  <li>Personalize your experience</li>
                  <li>Process and publish your content</li>
                  <li>Communicate with you about your account</li>
                  <li>Analyze usage patterns to improve our services</li>
                  <li>Ensure the security of our platform</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy mb-4">Information Sharing</h2>
                <p className="text-gray-700 mb-4">
                  We do not sell, trade, or otherwise transfer your personal information to third parties 
                  without your consent, except as described in this Privacy Policy:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-6">
                  <li>Public content you create (articles, comments) is visible to all users</li>
                  <li>Service providers who assist us in operating our website</li>
                  <li>When required by law or to protect our rights</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy mb-4">Data Security</h2>
                <p className="text-gray-700 mb-4">
                  We implement appropriate security measures to protect your personal information against 
                  unauthorized access, alteration, disclosure, or destruction. However, no method of 
                  transmission over the Internet is 100% secure.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy mb-4">Your Rights</h2>
                <p className="text-gray-700 mb-4">You have the right to:</p>
                <ul className="list-disc pl-6 text-gray-700 mb-6">
                  <li>Access and update your personal information</li>
                  <li>Delete your account and associated data</li>
                  <li>Opt-out of certain communications</li>
                  <li>Request a copy of your data</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy mb-4">Cookies</h2>
                <p className="text-gray-700 mb-4">
                  We use cookies and similar tracking technologies to enhance your experience, 
                  analyze usage, and provide personalized content. You can control cookie settings 
                  through your browser preferences.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy mb-4">Children&apos;s Privacy</h2>
                <p className="text-gray-700 mb-4">
                  Our services are not intended for children under 13. We do not knowingly collect 
                  personal information from children under 13.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy mb-4">Changes to This Policy</h2>
                <p className="text-gray-700 mb-4">
                  We may update this Privacy Policy from time to time. We will notify you of any 
                  changes by posting the new Privacy Policy on this page and updating the 
                  &quot;Last updated&quot; date.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy mb-4">Contact Us</h2>
                <p className="text-gray-700 mb-4">
                  If you have any questions about this Privacy Policy, please contact us at:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">
                    Email: privacy@voiceofupsa.com<br />
                    Address: UPSA Headquarters, Ghana
                  </p>
                </div>
              </section>
            </div>
          </motion.div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default PrivacyPolicy;
