import React from 'react';
import { FiTool, FiClock, FiMail } from 'react-icons/fi';

interface MaintenanceModeProps {
  settings?: {
    site_name: string;
    contact_email: string;
  };
}

const MaintenanceMode: React.FC<MaintenanceModeProps> = ({ settings }) => {
  if (!settings) {
    settings = {
      site_name: 'Voice of UPSA',
      contact_email: 'voice.of.upsa.mail@gmail.com'
    };
  }

  return (
    <div className="min-h-screen bg-navy text-white flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-golden rounded-full flex items-center justify-center">
            <FiTool className="w-10 h-10 text-navy" />
          </div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Under Maintenance
        </h1>
        
        <p className="text-xl text-gray-300 mb-8">
          We&apos;re currently performing some scheduled maintenance to improve {settings.site_name}. 
          We&apos;ll be back online shortly!
        </p>
        
        <div className="bg-navy-light rounded-xl p-6 mb-8 border border-golden/30">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <FiClock className="w-5 h-5 text-golden" />
            <span className="text-golden font-semibold">Expected Duration</span>
          </div>
          <p className="text-gray-300">
            Our team is working hard to complete the maintenance as quickly as possible. 
            Most maintenance periods last less than 2 hours.
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <FiMail className="w-5 h-5 text-golden" />
            <span>Need to contact us?</span>
          </div>
          <a 
            href={`mailto:${settings.contact_email}`}
            className="inline-block bg-golden text-navy px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
          >
            Contact Support
          </a>
        </div>
        
        <div className="mt-12 pt-8 border-t border-navy-light">
          <p className="text-gray-400 text-sm">
            Thank you for your patience. We apologize for any inconvenience.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceMode;
