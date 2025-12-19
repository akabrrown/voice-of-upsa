import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FiExternalLink, FiArrowLeft, FiClock, FiTarget, FiInfo, FiTag } from 'react-icons/fi';
import Link from 'next/link';

interface AdDetailViewProps {
  ad: {
    id: string;
    adTitle: string;
    adDescription: string;
    company?: string;
    businessType?: string;
    adType?: string;
    website?: string;
    attachmentUrls?: string[];
    startDate?: string;
    duration?: string;
    targetAudience?: string;
    additionalInfo?: string;
  };
}

const AdDetailView: React.FC<AdDetailViewProps> = ({ ad }) => {
  const isSponsored = ad.adType === 'sponsored-content';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-16">
      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-8"
      >
        <Link 
          href="/"
          className="inline-flex items-center text-gray-600 hover:text-golden transition-colors"
        >
          <FiArrowLeft className="mr-2" />
          Back to Home
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-10">
          {/* Hero Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <span className="px-3 py-1 bg-golden/10 text-golden text-xs font-bold uppercase tracking-wider rounded-full">
                {isSponsored ? 'Sponsored Content' : 'Featured Advertisement'}
              </span>
              {ad.businessType && (
                <span className="flex items-center text-gray-500 text-xs font-medium">
                  <FiTag className="mr-1" />
                  {ad.businessType.replace('-', ' ')}
                </span>
              )}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-navy dark:text-white leading-tight mb-6">
              {ad.adTitle}
            </h1>

            {ad.company && (
              <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="w-12 h-12 bg-golden rounded-lg flex items-center justify-center text-navy font-bold text-xl shadow-lg">
                  {ad.company.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-gray-400 text-xs uppercase font-bold tracking-widest">Presented By</div>
                  <div className="text-navy dark:text-white font-bold text-lg">{ad.company}</div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Primary Visual */}
          {ad.attachmentUrls && ad.attachmentUrls.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-gray-800"
            >
              <Image
                src={ad.attachmentUrls[0]!}
                alt={ad.adTitle}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </motion.div>
          )}

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="prose prose-lg dark:prose-invert max-w-none"
          >
            <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-navy dark:text-white mb-6 flex items-center">
                <FiInfo className="mr-3 text-golden" />
                About This Offer
              </h2>
              <div className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {ad.adDescription}
              </div>
            </div>
          </motion.div>

          {/* Additional Visuals Grid */}
          {ad.attachmentUrls && ad.attachmentUrls.length > 1 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {ad.attachmentUrls.slice(1).map((url, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="relative aspect-square rounded-xl overflow-hidden shadow-md cursor-pointer"
                >
                  <Image
                    src={url}
                    alt={`${ad.adTitle} - detail ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </motion.div>
              ))}
            </div>
          )}

          {/* Additional Info */}
          {ad.additionalInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-8 bg-navy dark:bg-black rounded-2xl text-white overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-golden/10 rounded-full blur-3xl -mr-16 -mt-16" />
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <FiClock className="mr-3 text-golden" />
                Special Notes
              </h3>
              <p className="opacity-80 italic italic leading-relaxed">
                "{ad.additionalInfo}"
              </p>
            </motion.div>
          )}
        </div>

        {/* Sidebar / CTA Area */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 h-fit space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700"
          >
            <div className="mb-8">
              <h3 className="text-gray-400 text-xs uppercase font-black tracking-widest mb-6">Targeted For</h3>
              <div className="flex items-start p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <FiTarget className="text-golden mt-1 mr-4 text-xl flex-shrink-0" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {ad.targetAudience || 'The UPSA Community'}
                </p>
              </div>
            </div>

            {ad.website && (
              <a
                href={ad.website}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative w-full inline-flex items-center justify-center p-4 bg-golden hover:bg-yellow-400 text-navy font-black rounded-2xl shadow-lg transition-all duration-300 overflow-hidden"
              >
                <div className="relative z-10 flex items-center">
                  Visit Official Website
                  <FiExternalLink className="ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </a>
            )}

            <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-700 text-center">
              <p className="text-xs text-gray-400 mb-4">Interested in advertising?</p>
              <Link 
                href="/ads"
                className="text-golden font-bold hover:underline transition-all"
              >
                Promote Your Business Here
              </Link>
            </div>
          </motion.div>

          {/* Social Proof Placeholder / Small Badge */}
          <div className="flex items-center justify-center space-x-3 p-4 bg-green-500/5 rounded-2xl border border-green-500/10">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-green-600 dark:text-green-500">Verified Advertisement on UPSA Media</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdDetailView;
