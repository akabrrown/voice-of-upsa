import React from 'react';

interface ArticleContentProps {
  content: string;
  className?: string;
}

const ArticleContent: React.FC<ArticleContentProps> = ({ content, className = '' }) => {
  // Convert plain text to HTML for proper display
  const htmlContent = content
    .replace(/\n/g, '<br />')  // Convert line breaks to <br>
    .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');  // Convert tabs to spaces

  return (
    <div 
      className={`prose prose-lg max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

export default ArticleContent;
