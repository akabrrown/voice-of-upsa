import React, { useState, useEffect } from 'react';
import { FiFacebook, FiInstagram, FiLinkedin, FiYoutube } from 'react-icons/fi';
import { SiTiktok, SiX } from 'react-icons/si';

interface SocialLinks {
  facebook: string;
  twitter: string;
  instagram: string;
  youtube: string;
  tiktok: string;
  linkedin: string;
}

const FollowUs: React.FC = () => {
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    facebook: 'https://facebook.com/voiceofupsa',
    twitter: 'https://twitter.com/voiceofupsa',
    instagram: 'https://instagram.com/voiceofupsa',
    youtube: 'https://youtube.com/@voiceofupsa',
    tiktok: 'https://tiktok.com/@voice_of_upsa',
    linkedin: 'https://linkedin.com/company/voiceofupsa',
  });

  useEffect(() => {
    // Fetch social links from public API
    const fetchSocialLinks = async () => {
      try {
        const response = await fetch('/api/public/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.data?.settings?.social_links) {
            setSocialLinks(data.data.settings.social_links);
          }
        }
      } catch (error) {
        console.error('Failed to fetch social links:', error);
      }
    };

    fetchSocialLinks();
  }, []);

  return (
    <div className="my-8">
      <div className="social-buttons-container flex justify-center items-center bg-gradient-to-br from-white via-slate-50 to-white backdrop-blur-xl shadow-[0_12px_24px_rgba(0,0,0,0.06),0_6px_12px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.8)] p-6 rounded-3xl flex-wrap gap-4 max-w-md mx-auto border border-white/60 relative overflow-hidden group">
        {/* Animated shine effect */}
        <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-[left] duration-700 group-hover:left-full" />
        
        {socialLinks.facebook && (
          <a 
            href={socialLinks.facebook} 
            className="social-button w-12 h-12 rounded-xl flex items-center justify-center text-white transition-all duration-500 cubic-bezier-[0.23,1,0.32,1] cursor-pointer relative overflow-hidden shadow-[0_6px_16px_rgba(0,0,0,0.1),0_3px_6px_rgba(0,0,0,0.06)] z-[1] bg-gradient-to-br from-[#1877f2] via-[#0e5fcc] to-[#0a4c9c] hover:translate-y-[-6px] hover:scale-[1.08] hover:rotate-[3deg] hover:shadow-[0_20px_60px_rgba(24,119,242,0.5),0_10px_20px_rgba(24,119,242,0.3)] hover:from-[#166fe5] hover:via-[#0d4fb8] hover:to-[#093d7d] active:translate-y-[-3px] active:scale-[1.04] active:rotate-[1deg] after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:w-0 after:h-0 after:rounded-full after:bg-white/30 after:-translate-x-1/2 after:-translate-y-1/2 after:transition-all after:duration-500 hover:after:w-full hover:after:h-full" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <FiFacebook className="w-5 h-5" />
          </a>
        )}
        
        {socialLinks.twitter && (
          <a 
            href={socialLinks.twitter} 
            className="social-button w-12 h-12 rounded-xl flex items-center justify-center text-white transition-all duration-500 cubic-bezier-[0.23,1,0.32,1] cursor-pointer relative overflow-hidden shadow-[0_6px_16px_rgba(0,0,0,0.1),0_3px_6px_rgba(0,0,0,0.06)] z-[1] bg-gradient-to-br from-black via-zinc-900 to-zinc-800 hover:translate-y-[-6px] hover:scale-[1.08] hover:rotate-[3deg] hover:shadow-[0_12px_32px_rgba(0,0,0,0.5),0_6px_12px_rgba(0,0,0,0.3)] hover:from-zinc-900 hover:via-zinc-800 hover:to-zinc-700 active:translate-y-[-3px] active:scale-[1.04] active:rotate-[1deg] after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:w-0 after:h-0 after:rounded-full after:bg-white/30 after:-translate-x-1/2 after:-translate-y-1/2 after:transition-all after:duration-500 hover:after:w-full hover:after:h-full" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <SiX className="w-5 h-5" />
          </a>
        )}

        {socialLinks.instagram && (
          <a 
            href={socialLinks.instagram} 
            className="social-button w-12 h-12 rounded-xl flex items-center justify-center text-white transition-all duration-500 cubic-bezier-[0.23,1,0.32,1] cursor-pointer relative overflow-hidden shadow-[0_6px_16px_rgba(0,0,0,0.1),0_3px_6px_rgba(0,0,0,0.06)] z-[1] bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888] hover:translate-y-[-6px] hover:scale-[1.08] hover:rotate-[3deg] hover:shadow-[0_20px_60px_rgba(225,48,108,0.5),0_10px_20px_rgba(225,48,108,0.3)] hover:from-[#f58529] hover:via-[#dd2a7b] hover:to-[#5a189a] active:translate-y-[-3px] active:scale-[1.04] active:rotate-[1deg] after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:w-0 after:h-0 after:rounded-full after:bg-white/30 after:-translate-x-1/2 after:-translate-y-1/2 after:transition-all after:duration-500 hover:after:w-full hover:after:h-full" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <FiInstagram className="w-5 h-5" />
          </a>
        )}

        {socialLinks.linkedin && (
          <a 
            href={socialLinks.linkedin} 
            className="social-button w-12 h-12 rounded-xl flex items-center justify-center text-white transition-all duration-500 cubic-bezier-[0.23,1,0.32,1] cursor-pointer relative overflow-hidden shadow-[0_6px_16px_rgba(0,0,0,0.1),0_3px_6px_rgba(0,0,0,0.06)] z-[1] bg-gradient-to-br from-[#0077b5] via-[#005885] to-[#004466] hover:translate-y-[-6px] hover:scale-[1.08] hover:rotate-[3deg] hover:shadow-[0_20px_60px_rgba(0,119,181,0.5),0_10px_20px_rgba(0,119,181,0.3)] hover:from-[#00669d] hover:via-[#004466] hover:to-[#00334d] active:translate-y-[-3px] active:scale-[1.04] active:rotate-[1deg] after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:w-0 after:h-0 after:rounded-full after:bg-white/30 after:-translate-x-1/2 after:-translate-y-1/2 after:transition-all after:duration-500 hover:after:w-full hover:after:h-full" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <FiLinkedin className="w-5 h-5" />
          </a>
        )}

        {socialLinks.youtube && (
          <a 
            href={socialLinks.youtube} 
            className="social-button w-12 h-12 rounded-xl flex items-center justify-center text-white transition-all duration-500 cubic-bezier-[0.23,1,0.32,1] cursor-pointer relative overflow-hidden shadow-[0_6px_16px_rgba(0,0,0,0.1),0_3px_6px_rgba(0,0,0,0.06)] z-[1] bg-gradient-to-br from-[#ff0000] via-[#cc0000] to-[#990000] hover:translate-y-[-6px] hover:scale-[1.08] hover:rotate-[3deg] hover:shadow-[0_20px_60px_rgba(255,0,0,0.5),0_10px_20px_rgba(255,0,0,0.3)] hover:from-[#e60000] hover:via-[#990000] hover:to-[#660000] active:translate-y-[-3px] active:scale-[1.04] active:rotate-[1deg] after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:w-0 after:h-0 after:rounded-full after:bg-white/30 after:-translate-x-1/2 after:-translate-y-1/2 after:transition-all after:duration-500 hover:after:w-full hover:after:h-full" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <FiYoutube className="w-5 h-5" />
          </a>
        )}

        {socialLinks.tiktok && (
          <a 
            href={socialLinks.tiktok} 
            className="social-button w-12 h-12 rounded-xl flex items-center justify-center text-white transition-all duration-500 cubic-bezier-[0.23,1,0.32,1] cursor-pointer relative overflow-hidden shadow-[0_6px_16px_rgba(0,0,0,0.1),0_3px_6px_rgba(0,0,0,0.06)] z-[1] bg-gradient-to-br from-black via-zinc-900 to-zinc-800 hover:translate-y-[-6px] hover:scale-[1.08] hover:rotate-[3deg] hover:shadow-[0_20px_60px_rgba(0,0,0,0.5),0_10px_20px_rgba(0,0,0,0.3)] hover:from-zinc-900 hover:via-zinc-800 hover:to-zinc-700 active:translate-y-[-3px] active:scale-[1.04] active:rotate-[1deg] after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:w-0 after:h-0 after:rounded-full after:bg-white/30 after:-translate-x-1/2 after:-translate-y-1/2 after:transition-all after:duration-500 hover:after:w-full hover:after:h-full" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <SiTiktok className="w-5 h-5" />
          </a>
        )}
      </div>
    </div>
  );
}

export default FollowUs;
