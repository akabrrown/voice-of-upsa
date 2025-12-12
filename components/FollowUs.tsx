import React, { useState, useEffect } from 'react';
import { FiFacebook, FiTwitter, FiInstagram, FiLinkedin, FiYoutube } from 'react-icons/fi';
import { SiTiktok } from 'react-icons/si';

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
    <div className="follow-us-wrapper">
      <style jsx>{`
        .follow-us-wrapper {
          margin: 2rem 0;
        }
        
        .social-buttons {
          display: flex;
          justify-content: center;
          align-items: center;
          background: #f8f9fa;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          padding: 1.5rem;
          border-radius: 2rem;
          flex-wrap: wrap;
          gap: 0.75rem;
          max-width: 32rem;
          margin: 0 auto;
        }
        
        .social-button {
          background: #1e3a8a;
          color: white;
          width: 3rem;
          height: 3rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
        }
        
        .social-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 31, 63, 0.3);
        }
        
        .social-button:active {
          transform: translateY(0);
        }
        
        .social-button.facebook {
          background: #1877f2;
        }
        
        .social-button.facebook:hover {
          background: #166fe5;
        }
        
        .social-button.twitter {
          background: #1da1f2;
        }
        
        .social-button.twitter:hover {
          background: #1a91da;
        }
        
        .social-button.instagram {
          background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
        }
        
        .social-button.instagram:hover {
          opacity: 0.9;
        }
        
        .social-button.linkedin {
          background: #0077b5;
        }
        
        .social-button.linkedin:hover {
          background: #00669d;
        }
        
        .social-button.youtube {
          background: #ff0000;
        }
        
        .social-button.youtube:hover {
          background: #e60000;
        }
        
        .social-button.tiktok {
          background: #000000;
        }
        
        .social-button.tiktok:hover {
          background: #1a1a1a;
        }
        
        @media (max-width: 640px) {
          .social-buttons {
            padding: 1rem;
            gap: 0.5rem;
          }
          
          .social-button {
            width: 2.5rem;
            height: 2.5rem;
          }
        }
      `}</style>
      <div className="social-buttons">
        {socialLinks.facebook && (
          <a href={socialLinks.facebook} className="social-button facebook" target="_blank" rel="noopener noreferrer">
            <FiFacebook className="w-5 h-5" />
          </a>
        )}
        
        {socialLinks.twitter && (
          <a href={socialLinks.twitter} className="social-button twitter" target="_blank" rel="noopener noreferrer">
            <FiTwitter className="w-5 h-5" />
          </a>
        )}

        {socialLinks.instagram && (
          <a href={socialLinks.instagram} className="social-button instagram" target="_blank" rel="noopener noreferrer">
            <FiInstagram className="w-5 h-5" />
          </a>
        )}

        {socialLinks.linkedin && (
          <a href={socialLinks.linkedin} className="social-button linkedin" target="_blank" rel="noopener noreferrer">
            <FiLinkedin className="w-5 h-5" />
          </a>
        )}

        {socialLinks.youtube && (
          <a href={socialLinks.youtube} className="social-button youtube" target="_blank" rel="noopener noreferrer">
            <FiYoutube className="w-5 h-5" />
          </a>
        )}

        {socialLinks.tiktok && (
          <a href={socialLinks.tiktok} className="social-button tiktok" target="_blank" rel="noopener noreferrer">
            <SiTiktok className="w-5 h-5" />
          </a>
        )}
      </div>
    </div>
  );
}

export default FollowUs;
