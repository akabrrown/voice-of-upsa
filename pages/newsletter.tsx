import React, { useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BreadcrumbNavigation from '../components/BreadcrumbNavigation';
import toast from 'react-hot-toast';
import { FiMail, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

const Newsletter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const breadcrumbs = [
    { label: 'Newsletter', active: true }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate newsletter subscription
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsSubscribed(true);
      setEmail('');
      toast.success('Successfully subscribed to newsletter!');
    } catch {
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Newsletter - Voice of UPSA</title>
        <meta name="description" content="Subscribe to the Voice of UPSA newsletter to stay updated with the latest news and articles." />
        <meta name="keywords" content="newsletter, subscribe, updates, Voice of UPSA, email" />
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
              <h1 className="text-4xl font-bold text-navy mb-4">Newsletter</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Stay updated with the latest news, articles, and announcements from Voice of UPSA
              </p>
            </div>

            {/* Subscription Form */}
            <div className="bg-white rounded-lg shadow-md p-8">
              {!isSubscribed ? (
                <div className="max-w-md mx-auto">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-golden rounded-full mb-4">
                      <FiMail className="w-8 h-8 text-navy" />
                    </div>
                    <h2 className="text-2xl font-semibold text-navy mb-2">
                      Subscribe to Our Newsletter
                    </h2>
                    <p className="text-gray-600">
                      Get the latest articles and updates delivered directly to your inbox
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-navy text-white py-3 px-6 rounded-lg font-medium hover:bg-navy-dark transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Subscribing...' : 'Subscribe'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <FiCheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-semibold text-navy mb-2">
                    Successfully Subscribed!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Thank you for subscribing to our newsletter. Check your email for confirmation.
                  </p>
                  <button
                    onClick={() => setIsSubscribed(false)}
                    className="text-golden hover:text-golden-dark font-medium"
                  >
                    Subscribe another email
                  </button>
                </div>
              )}
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
                  <FiMail className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-navy mb-2">Weekly Updates</h3>
                <p className="text-gray-600">
                  Receive a weekly digest of the most popular articles and important announcements
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="w-12 h-12 bg-golden rounded-lg flex items-center justify-center mb-4">
                  <FiCheckCircle className="w-6 h-6 text-navy" />
                </div>
                <h3 className="text-lg font-semibold text-navy mb-2">Exclusive Content</h3>
                <p className="text-gray-600">
                  Get access to exclusive articles and behind-the-scenes content not available on the site
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="w-12 h-12 bg-navy rounded-lg flex items-center justify-center mb-4">
                  <FiAlertCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-navy mb-2">No Spam</h3>
                <p className="text-gray-600">
                  We respect your inbox. No spam, unsubscribe at any time with one click
                </p>
              </motion.div>
            </div>

            {/* FAQ Section */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-semibold text-navy mb-6">Frequently Asked Questions</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-navy mb-2">How often will I receive emails?</h3>
                  <p className="text-gray-600">
                    We send out a weekly newsletter with the latest articles and important updates. 
                    You won&apos;t receive more than one email per week unless there are urgent announcements.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-navy mb-2">Can I unsubscribe anytime?</h3>
                  <p className="text-gray-600">
                    Yes! Every email includes an unsubscribe link. You can also manage your subscription 
                    preferences in your account settings.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-navy mb-2">Is my information secure?</h3>
                  <p className="text-gray-600">
                    Absolutely. We take data privacy seriously and never share your email address 
                    with third parties. Check our Privacy Policy for more details.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-navy mb-2">What if I don&apos;t receive the confirmation email?</h3>
                  <p className="text-gray-600">
                    Check your spam folder and add us to your safe sender list. If you still don&apos;t 
                    receive it, contact us at support@voiceofupsa.com
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

export default Newsletter;
