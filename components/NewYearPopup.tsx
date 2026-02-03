import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';

const NewYearPopup: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    // 1. Check if "Don't show again" was previously set
    const hasSeen = localStorage.getItem('hasSeenNewYearPopup_2026');
    if (hasSeen === 'true') {
      return;
    }

    // 2. Check Expiration Date (Jan 4th, 2026)
    // Using 2026 to align with the "Happy New Year 2026" message in the plan
    // If the simulated "today" is Dec 31 2025, then Jan 4th 2026 is the target.
    const expiryDate = new Date('2026-01-04T00:00:00');
    const now = new Date();

    if (now > expiryDate) {
      return;
    }

    // If checks pass, show the popup after a short delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000); // 2 seconds delay for better UX

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    if (dontShowAgain) {
      localStorage.setItem('hasSeenNewYearPopup_2026', 'true');
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Popup Card */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white dark:bg-navy rounded-2xl shadow-2xl max-w-md w-full p-8 text-center overflow-hidden border-2 border-golden/30"
          >
            {/* Decorative Background Elements */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-golden via-yellow-400 to-golden" />
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-golden/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-navy/10 dark:bg-golden/10 rounded-full blur-2xl" />

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              aria-label="Close"
            >
              <FiX size={24} />
            </button>

            {/* Content */}
            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-golden/20 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <span className="text-4xl">🎉</span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl md:text-3xl font-bold text-navy dark:text-white mb-4"
              >
                Happy New Year 2026!
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed"
              >
                As we step into a new year, the Voice of UPSA team wishes you a year filled with success, growth, and memorable moments. Thank you for being part of our community! May this year bring you closer to your dreams.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-4"
              >
                <button
                  onClick={handleClose}
                  className="w-full bg-golden hover:bg-yellow-500 text-navy font-bold py-3 px-6 rounded-xl transition-colors duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Thank You! 🎊
                </button>

                <div className="flex items-center justify-center space-x-2">
                  <input
                    type="checkbox"
                    id="dontShowAgain"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                    className="w-4 h-4 text-golden border-gray-300 rounded focus:ring-golden cursor-pointer"
                  />
                  <label
                    htmlFor="dontShowAgain"
                    className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer select-none"
                  >
                    Don&apos;t show this again
                  </label>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default NewYearPopup;
