"use client";

import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { FiChevronLeft, FiChevronRight, FiDownload, FiZoomIn, FiZoomOut, FiShare2 } from 'react-icons/fi';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set worker source
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface PdfViewerProps {
  url: string;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ url }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [containerWidth, setContainerWidth] = useState<number>(window.innerWidth > 768 ? 600 : window.innerWidth - 40);

  useEffect(() => {
    const handleResize = () => {
      setContainerWidth(window.innerWidth > 768 ? 800 : window.innerWidth - 40);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  function changePage(offset: number) {
    setPageNumber(prevPageNumber =>  Math.min(Math.max(1, prevPageNumber + offset), numPages));
  }

  function previousPage() {
    changePage(-1);
  }

  function nextPage() {
    changePage(1);
  }
  
  function handleZoomIn() {
      setScale(prev => Math.min(prev + 0.2, 2.0));
  }
  
  function handleZoomOut() {
      setScale(prev => Math.max(prev - 0.2, 0.6));
  }

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4 bg-white rounded-xl shadow-lg border border-gray-100">
      
      {/* Controls Header */}
      <div className="flex flex-wrap items-center justify-between w-full mb-4 gap-4 p-2 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-navy hidden sm:block">2025 Annual Report</h3>
            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">PDF</span>
          </div>

          <div className="flex items-center space-x-2">
              <button 
                  onClick={previousPage} 
                  disabled={pageNumber <= 1}
                  className="p-2 rounded-full hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  aria-label="Previous Page"
              >
                  <FiChevronLeft />
              </button>
              
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  {pageNumber} / {numPages || '--'}
              </span>
              
              <button 
                  onClick={nextPage} 
                  disabled={pageNumber >= numPages}
                  className="p-2 rounded-full hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  aria-label="Next Page"
              >
                  <FiChevronRight />
              </button>
          </div>
          
          <div className="flex items-center space-x-2">
             <button 
                 onClick={handleZoomOut}
                 className="p-2 rounded-full hover:bg-gray-200 text-gray-600"
                 title="Zoom Out"
             >
                 <FiZoomOut />
             </button>
             <button 
                 onClick={handleZoomIn}
                 className="p-2 rounded-full hover:bg-gray-200 text-gray-600"
                 title="Zoom In"
             >
                 <FiZoomIn />
             </button>
             <button 
                 onClick={async () => {
                    const shareData = {
                        title: 'Voice of UPSA 2025 Annual Report',
                        text: 'Check out the 2025 Annual Report from Voice of UPSA.',
                        url: window.location.origin + url
                    };
                    
                    try {
                        if (navigator.share) {
                            await navigator.share(shareData);
                        } else {
                            await navigator.clipboard.writeText(shareData.url);
                            alert('Link copied to clipboard!');
                        }
                    } catch (err) {
                        console.error('Error sharing:', err);
                    }
                 }}
                 className="p-2 rounded-full hover:bg-gray-200 text-gray-600"
                 title="Share"
             >
                 <FiShare2 />
             </button>
             <a 
                 href={url}
                 download
                 className="flex items-center space-x-1 px-3 py-1.5 bg-navy text-white text-xs font-bold rounded-md hover:bg-opacity-90 transition-colors"
             >
                 <FiDownload />
                 <span className="hidden sm:inline">Download</span>
             </a>
          </div>
      </div>

      {/* PDF Document */}
      <div className="w-full flex justify-center bg-gray-100 rounded-lg min-h-[500px] overflow-auto py-4 border border-gray-200">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex flex-col items-center justify-center py-20">
               <div className="animate-spin rounded-full h-10 w-10 border-4 border-golden/30 border-t-golden mb-4"></div>
               <p className="text-gray-500 font-medium">Loading Document...</p>
               <p className="text-xs text-gray-400 mt-2">This may take a moment.</p>
            </div>
          }
          error={
             <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                 <p className="text-red-500 font-bold mb-2">Failed to load PDF.</p>
                 <p className="text-gray-600 text-sm mb-4">Please try downloading the file securely instead.</p>
                 <a href={url} download className="text-navy hover:text-golden underline font-medium">Download PDF</a>
             </div>
          }
          className="shadow-xl"
        >
          <Page 
             pageNumber={pageNumber} 
             width={Math.min(containerWidth * scale, 800)} 
             renderTextLayer={true}
             renderAnnotationLayer={true}
             className="bg-white"
          />
        </Document>
      </div>
      
      <p className="text-xs text-gray-400 mt-4 text-center w-full">
         Use the controls above to navigate pages or zoom in/out.
      </p>
    </div>
  );
};

export default PdfViewer;
