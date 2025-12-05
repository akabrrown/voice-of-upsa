import React from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BreadcrumbNavigation from '../components/BreadcrumbNavigation';

const TermsOfService: React.FC = () => {
  const breadcrumbs = [
    { label: 'Terms of Service', active: true }
  ];

  return (
    <>
      <Head>
        <title>Terms of Service - Voice of UPSA</title>
        <meta name="description" content="Terms of Service for Voice of UPSA - Rules and guidelines for using our platform." />
        <meta name="keywords" content="terms of service, rules, guidelines, Voice of UPSA, user agreement" />
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
            <h1 className="text-3xl font-bold text-navy mb-6">Terms of Service</h1>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 mb-6">
                Last updated: {new Date().toLocaleDateString()}
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy mb-4">Agreement to Terms</h2>
                <p className="text-gray-700 mb-4">
                  By accessing and using Voice of UPSA (&quot;the Service&quot;), you accept and agree 
                  to be bound by the terms and provision of this agreement.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy mb-4">Use License</h2>
                <p className="text-gray-700 mb-4">
                  Permission is granted to temporarily download one copy of the materials on 
                  Voice of UPSA for personal, non-commercial transitory viewing only. This is 
                  the grant of a license, not a transfer of title.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy mb-4">User Accounts</h2>
                <h3 className="text-xl font-medium text-navy mb-3">Registration</h3>
                <p className="text-gray-700 mb-4">
                  To access certain features of the Service, you must register for an account. 
                  You agree to provide accurate, current, and complete information during registration.
                </p>
                
                <h3 className="text-xl font-medium text-navy mb-3">Account Security</h3>
                <p className="text-gray-700 mb-4">
                  You are responsible for maintaining the confidentiality of your account credentials 
                  and for all activities that occur under your account.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy mb-4">Content Guidelines</h2>
                <h3 className="text-xl font-medium text-navy mb-3">User Content</h3>
                <p className="text-gray-700 mb-4">
                  Users may submit articles, comments, and other content (&quot;User Content&quot;). By submitting 
                  User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, 
                  reproduce, and display such content.
                </p>
                
                <h3 className="text-xl font-medium text-navy mb-3">Prohibited Content</h3>
                <p className="text-gray-700 mb-4">You agree not to post content that:</p>
                <ul className="list-disc pl-6 text-gray-700 mb-6">
                  <li>Is unlawful, defamatory, or harassing</li>
                  <li>Contains hate speech or discriminatory content</li>
                  <li>Infringes on intellectual property rights</li>
                  <li>Contains false or misleading information</li>
                  <li>Violates any applicable laws</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy mb-4">Intellectual Property</h2>
                <p className="text-gray-700 mb-4">
                  The Service and its original content, features, and functionality are owned by 
                  Voice of UPSA and are protected by international copyright, trademark, and 
                  other intellectual property laws.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy mb-4">User Conduct</h2>
                <p className="text-gray-700 mb-4">You agree not to:</p>
                <ul className="list-disc pl-6 text-gray-700 mb-6">
                  <li>Use the Service for any illegal purpose</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Interfere with or disrupt the Service</li>
                  <li>Spam or harass other users</li>
                  <li>Violate the rights of others</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy mb-4">Privacy</h2>
                <p className="text-gray-700 mb-4">
                  Your privacy is important to us. Please review our Privacy Policy, which also 
                  governs the Service, to understand our practices.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy mb-4">Termination</h2>
                <p className="text-gray-700 mb-4">
                  We may terminate or suspend your account and bar access to the Service immediately, 
                  without prior notice or liability, under our sole discretion, for any reason 
                  whatsoever, including without limitation if you breach the Terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy mb-4">Disclaimer</h2>
                <p className="text-gray-700 mb-4">
                  The information on this website is provided on an &quot;as is&quot; basis. We make no 
                  warranties, expressed or implied, and hereby disclaim all other warranties including 
                  without limitation, implied warranties or conditions of merchantability, fitness 
                  for a particular purpose, or non-infringement of intellectual property or other 
                  violation of rights.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy mb-4">Limitation of Liability</h2>
                <p className="text-gray-700 mb-4">
                  In no event shall Voice of UPSA, its directors, employees, partners, agents, 
                  suppliers, or affiliates be liable for any indirect, incidental, special, 
                  consequential, or punitive damages, including without limitation, loss of profits, 
                  data, use, goodwill, or other intangible losses.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy mb-4">Governing Law</h2>
                <p className="text-gray-700 mb-4">
                  These Terms shall be interpreted and governed by the laws of Ghana, without 
                  regard to its conflict of law provisions.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy mb-4">Changes to Terms</h2>
                <p className="text-gray-700 mb-4">
                  We reserve the right to modify these Terms at any time. If we make material 
                  changes, we will notify you by email or by posting a notice on our site prior 
                  to the change becoming effective.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-navy mb-4">Contact Information</h2>
                <p className="text-gray-700 mb-4">
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">
                    Email: legal@voiceofupsa.com<br />
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

export default TermsOfService;
