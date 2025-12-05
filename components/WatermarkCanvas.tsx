import React, { useEffect, useRef } from 'react';

interface WatermarkCanvasProps {
  children: React.ReactNode;
  watermarkText?: string;
  opacity?: number;
  fontSize?: number;
  color?: string;
  className?: string;
}

const WatermarkCanvas: React.FC<WatermarkCanvasProps> = ({
  children,
  watermarkText = 'VOU - Voice of UPSA',
  opacity = 0.1,
  fontSize = 24,
  color = '#1e3a8a',
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2; // For retina displays
      canvas.height = rect.height * 2;
      ctx.scale(2, 2);

      // Clear canvas
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Load and draw logo watermark
      const logo = new Image();
      logo.src = '/logo.jpg';
      
      logo.onload = () => {
        ctx.globalAlpha = opacity;
        
        // Calculate logo size (make it reasonably sized)
        const logoWidth = 120;
        const logoHeight = (logo.height / logo.width) * logoWidth;
        
        // Calculate spacing for diagonal pattern
        const spacing = 200;
        const diagonalSpacing = 250;

        // Draw diagonal watermark pattern with logo
        for (let y = -rect.height; y < rect.height * 2; y += diagonalSpacing) {
          for (let x = -rect.width; x < rect.width * 2; x += spacing) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(-Math.PI / 6); // Diagonal angle
            ctx.drawImage(logo, -logoWidth/2, -logoHeight/2, logoWidth, logoHeight);
            ctx.restore();
          }
        }
      };

      logo.onerror = () => {
        // Fallback to text if logo fails to load
        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity;

        // Calculate spacing for diagonal pattern
        const textWidth = ctx.measureText(watermarkText).width;
        const spacing = textWidth + 100;
        const diagonalSpacing = 200;

        // Draw diagonal watermark pattern
        for (let y = -rect.height; y < rect.height * 2; y += diagonalSpacing) {
          for (let x = -rect.width; x < rect.width * 2; x += spacing) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(-Math.PI / 6); // Diagonal angle
            ctx.fillText(watermarkText, 0, 0);
            ctx.restore();
          }
        }
      };
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [watermarkText, opacity, fontSize, color]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1 }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default WatermarkCanvas;
