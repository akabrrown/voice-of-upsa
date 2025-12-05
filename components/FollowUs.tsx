import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaTiktok } from 'react-icons/fa';

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
    <StyledWrapper>
      <div className="social-buttons">
        {socialLinks.facebook && (
          <a href={socialLinks.facebook} className="social-button facebook" target="_blank" rel="noopener noreferrer">
            <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 310 310">
              <path d="M81.703,165.106h33.981V305c0,2.762,2.238,5,5,5h57.616c2.762,0,5-2.238,5-5V165.765h39.064
          c2.54,0,4.677-1.906,4.967-4.429l5.933-51.502c0.163-1.417-0.286-2.836-1.234-3.899c-0.949-1.064-2.307-1.673-3.732-1.673h-44.996
          V71.978c0-9.732,5.24-14.667,15.576-14.667c1.473,0,29.42,0,29.42,0c2.762,0,5-2.239,5-5V5.037c0-2.762-2.238-5-5-5h-40.545
          C187.467,0.023,186.832,0,185.896,0c-7.035,0-31.488,1.381-50.804,19.151c-21.402,19.692-18.427,43.27-17.716,47.358v37.752H81.703
          c-2.762,0-5,2.238-5,5v50.844C76.703,162.867,78.941,165.106,81.703,165.106z" />
            </svg>
          </a>
        )}
        
        {socialLinks.twitter && (
          <a href={socialLinks.twitter} className="social-button twitter" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.317l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
        )}

        {socialLinks.instagram && (
          <a href={socialLinks.instagram} className="social-button instagram" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.405a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z"/>
            </svg>
          </a>
        )}

        {socialLinks.linkedin && (
          <a href={socialLinks.linkedin} className="social-button linkedin" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 -2 44 44" xmlns="http://www.w3.org/2000/svg">
              <path d="M746,305 L736.2754,305 L736.2754,290.9384 C736.2754,287.257796 734.754233,284.74515 731.409219,284.74515 C728.850659,284.74515 727.427799,286.440738 726.765522,288.074854 C726.517168,288.661395 726.555974,289.478453 726.555974,290.295511 L726.555974,305 L716.921919,305 C716.921919,305 717.046096,280.091247 716.921919,277.827047 L726.555974,277.827047 L726.555974,282.091631 C727.125118,280.226996 730.203669,277.565794 735.116416,277.565794 C741.21143,277.565794 746,281.474355 746,289.890824 L746,305 L746,305 Z M707.17921,274.428187 L707.117121,274.428187 C704.0127,274.428187 702,272.350964 702,269.717936 C702,267.033681 704.072201,265 707.238711,265 C710.402634,265 712.348071,267.028559 712.41016,269.710252 C712.41016,272.34328 710.402634,274.428187 707.17921,274.428187 L707.17921,274.428187 L707.17921,274.428187 Z M703.109831,277.827047 L711.685795,277.827047 L711.685795,305 L703.109831,305 L703.109831,277.827047 L703.109831,277.827047 Z" transform="translate(-702.000000, -265.000000)"/>
            </svg>
          </a>
        )}

        {socialLinks.youtube && (
          <a href={socialLinks.youtube} className="social-button youtube" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </a>
        )}

        {socialLinks.tiktok && (
          <a href={socialLinks.tiktok} className="social-button tiktok" target="_blank" rel="noopener noreferrer">
            <FaTiktok />
          </a>
        )}
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .social-buttons {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f2f2f2;
    box-shadow: 0px 0px 15px #00000027;
    padding: 20px 15px;
    border-radius: 5em;
    flex-wrap: wrap;
    gap: 12px;
    max-width: 600px;
    margin: 0 auto;
  }

  .social-button {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background-color: #fff;
    box-shadow: 0px 0px 4px #00000027;
    transition: 0.3s;
    position: relative;
    overflow: hidden;
  }

  .social-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
    transform: translateX(-100%);
    transition: transform 0.6s;
  }

  .social-button:hover::before {
    transform: translateX(100%);
  }

  /* Mobile responsive - 3 icons per row with better spacing */
  @media (max-width: 768px) {
    .social-buttons {
      justify-content: center;
      gap: 15px;
      padding: 25px 20px;
      border-radius: 2em;
    }

    .social-button {
      width: 48px;
      height: 48px;
      margin: 0;
      flex: 0 0 calc(33.333% - 10px);
      max-width: calc(33.333% - 10px);
      box-shadow: 0px 2px 8px rgba(0,0,0,0.15);
      border: 2px solid rgba(255,255,255,0.8);
    }

    .social-buttons svg {
      height: 20px;
      width: 20px;
      z-index: 1;
      position: relative;
    }
  }

  /* Small mobile screens - optimized layout */
  @media (max-width: 480px) {
    .social-buttons {
      gap: 12px;
      padding: 20px 15px;
      border-radius: 1.5em;
    }

    .social-button {
      width: 44px;
      height: 44px;
      flex: 0 0 calc(33.333% - 8px);
      max-width: calc(33.333% - 8px);
      box-shadow: 0px 2px 6px rgba(0,0,0,0.12);
      border: 1.5px solid rgba(255,255,255,0.9);
    }

    .social-buttons svg {
      height: 18px;
      width: 18px;
    }
  }

  /* Extra small mobile */
  @media (max-width: 360px) {
    .social-buttons {
      gap: 10px;
      padding: 18px 12px;
    }

    .social-button {
      width: 42px;
      height: 42px;
      flex: 0 0 calc(33.333% - 7px);
      max-width: calc(33.333% - 7px);
    }

    .social-buttons svg {
      height: 16px;
      width: 16px;
    }
  }

  .social-button:hover {
    background-color: #f2f2f2;
    box-shadow: 0px 4px 12px rgba(0,0,0,0.2);
    transform: translateY(-2px);
  }

  .social-buttons svg {
    transition: 0.3s;
    height: 20px;
    width: 20px;
    filter: drop-shadow(0px 1px 2px rgba(0,0,0,0.1));
  }

  .facebook {
    background: linear-gradient(135deg, #3b5998, #2d4373);
    border-color: #3b5998;
  }

  .facebook svg {
    fill: #f2f2f2;
  }

  .facebook:hover svg {
    fill: #ffffff;
  }

  .twitter {
    background: linear-gradient(135deg, #1da1f2, #1a91da);
    border-color: #1da1f2;
  }

  .twitter svg {
    fill: #f2f2f2;
  }

  .twitter:hover svg {
    fill: #ffffff;
  }

  .instagram {
    background: linear-gradient(135deg, #c13584, #8e3a59, #fd1d1d, #f77737);
    border-color: #c13584;
  }

  .instagram svg {
    fill: #f2f2f2;
  }

  .instagram:hover svg {
    fill: #ffffff;
  }

  .linkedin {
    background: linear-gradient(135deg, #0077b5, #005885);
    border-color: #0077b5;
  }

  .linkedin svg {
    fill: #f2f2f2;
  }

  .linkedin:hover svg {
    fill: #ffffff;
  }

  .youtube {
    background: linear-gradient(135deg, #ff0000, #cc0000);
    border-color: #ff0000;
  }

  .youtube svg {
    fill: #f2f2f2;
  }

  .youtube:hover svg {
    fill: #ffffff;
  }

  .tiktok {
    background: linear-gradient(135deg, #000000, #1a1a1a);
    border-color: #000000;
  }

  .tiktok svg {
    fill: #f2f2f2;
  }

  .tiktok:hover svg {
    fill: #ffffff;
  }
`;

export default FollowUs;
