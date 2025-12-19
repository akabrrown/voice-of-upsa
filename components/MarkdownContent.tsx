/* eslint-disable @next/next/no-img-element */
/* 
  This file intentionally uses regular <img> tags instead of Next.js Image component
  to avoid routing conflicts with uploaded files in /uploads/ directory.
  Next.js Image treats these URLs as routes causing "hard navigate to same URL" errors.
*/
import React from 'react';
import DOMPurify from 'dompurify';
import styles from '../styles/MarkdownContent.module.css';

interface MarkdownContentProps {
  content: string;
  className?: string;
  editable?: boolean;
  onImageSizeChange?: (url: string, size: number) => void;
}

interface ImageSize {
  [key: string]: number;
}

const MarkdownContent: React.FC<MarkdownContentProps> = ({ 
  content, 
  className = '', 
  editable = false, 
  onImageSizeChange 
}) => {
  const [imageSizes, setImageSizes] = React.useState<ImageSize>({});

  const updateImageSize = (url: string, size: number) => {
    setImageSizes(prev => ({ ...prev, [url]: size }));
    onImageSizeChange?.(url, size);
  };

  const setPresetSize = (url: string, preset: 'small' | 'medium' | 'large' | 'full') => {
    const sizes = { small: 25, medium: 50, large: 75, full: 100 };
    updateImageSize(url, sizes[preset]);
  };

  const getImageStyle = (url: string) => {
    const size = imageSizes[url] || 50;
    return {
      maxWidth: `${size}%`,
      height: 'auto',
      display: 'block',
      margin: '1rem 0',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      transition: 'all 0.3s ease',
    };
  };
  // Process content to extract images and convert them to separate components
  const processContent = (rawContent: string) => {
    console.log('MarkdownContent processing:', rawContent);
    const parts: Array<{ type: 'text' | 'image'; content: string; alt?: string; url?: string }> = [];
    let currentIndex = 0;

    // Find all image markdown patterns
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;

    while ((match = imageRegex.exec(rawContent)) !== null) {
      console.log('Image match found:', match);
      // Add text before the image
      if (currentIndex < match.index) {
        parts.push({
          type: 'text',
          content: rawContent.substring(currentIndex, match.index)
        });
      }

      // Add image part
      parts.push({
        type: 'image',
        ...(match[1] && { alt: match[1] }),
        ...(match[2] && { url: match[2] }),
        content: match[0]
      });

      currentIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (currentIndex < rawContent.length) {
      parts.push({
        type: 'text',
        content: rawContent.substring(currentIndex)
      });
    }

    return parts;
  };

  const processMarkdown = (text: string) => {
    let processedText = text;
    
    // Convert markdown links to HTML
    processedText = processedText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Convert markdown bold to HTML
    processedText = processedText.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Convert markdown italic to HTML
    processedText = processedText.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Convert markdown headers to HTML
    processedText = processedText.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    processedText = processedText.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    processedText = processedText.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Convert markdown lists to HTML
    processedText = processedText.replace(/^- (.*$)/gim, '<li>$1</li>');
    processedText = processedText.replace(/(<li[^>]*>.*?<\/li>)(\s*<li[^>]*>.*?<\/li>)*/g, '<ul>$&</ul>');
    
    // Convert markdown quotes to HTML
    processedText = processedText.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
    
    // Convert markdown code blocks to HTML
    processedText = processedText.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');
    processedText = processedText.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Handle line breaks
    processedText = processedText.replace(/\n/g, '<br>');
    
    return processedText;
  };

  const parts = processContent(content);

  return (
    <div className={`${styles.markdownContent} ${className}`}>
      {parts.map((part, index) => {
        if (part.type === 'image' && part.url) {
          const currentSize = imageSizes[part.url] || 50;
          
          return (
            <div key={index} className={styles.imageContainer}>
              <img
                src={part.url}
                alt={part.alt || ''}
                style={getImageStyle(part.url)}
                onError={(e) => {
                  console.error('Image failed to load:', part.url);
                  // Simply hide the failed image without polluting content with error messages
                  const img = e.target as HTMLImageElement;
                  img.style.display = 'none';
                }}
              />
              {editable && (
                <div className={styles.imageSizeControls}>
                  <div className={styles.presetButtons}>
                    <span className={styles.sizeLabel}>Quick Size:</span>
                    {(['small', 'medium', 'large', 'full'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => setPresetSize(part.url!, size)}
                        className={`${styles.sizeButton} ${
                          currentSize === (size === 'small' ? 25 : size === 'medium' ? 50 : size === 'large' ? 75 : 100) 
                            ? styles.sizeButtonActive 
                            : ''
                        }`}
                      >
                        {size.charAt(0).toUpperCase() + size.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div className={styles.manualControl}>
                    <span className={styles.sizeLabel}>Manual:</span>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={currentSize}
                      onChange={(e) => updateImageSize(part.url!, parseInt(e.target.value))}
                      className={styles.sizeSlider}
                    />
                    <span className={styles.sizeValue}>{currentSize}%</span>
                  </div>
                </div>
              )}
            </div>
          );
        }

        if (part.type === 'text') {
          return (
            <div
              key={index}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(processMarkdown(part.content))
              }}
            />
          );
        }

        return null;
      })}
    </div>
  );
};

export default MarkdownContent;
