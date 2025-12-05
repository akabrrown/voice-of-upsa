import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { FiUpload, FiX, FiImage, FiVideo, FiFile, FiPaperclip } from 'react-icons/fi';

interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'document';
  url: string;
  name: string;
  size: number;
  alt?: string;
}

interface MediaManagerProps {
  onMediaInsert: (media: MediaItem) => void;
  isOpen: boolean;
  onClose: () => void;
}

const MediaManager: React.FC<MediaManagerProps> = ({ 
  onMediaInsert, 
  isOpen, 
  onClose 
}) => {
  const [mediaFiles, setMediaFiles] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'Upload failed');
      }

      const result = await response.json();
      
      const mediaType = file.type.startsWith('image/') ? 'image' : 
                       file.type.startsWith('video/') ? 'video' : 'document';

      const mediaItem: MediaItem = {
        id: result.id,
        type: mediaType,
        url: result.url, // Keep the relative URL from upload API
        name: file.name,
        size: file.size,
        alt: mediaType === 'image' ? file.name : undefined,
      };

      setMediaFiles(prev => [...prev, mediaItem]);
    } catch (error) {
      console.error('Upload error:', error);
      alert(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeMedia = (id: string) => {
    setMediaFiles(prev => prev.filter(media => media.id !== id));
  };

  const insertIntoEditor = (media: MediaItem) => {
    onMediaInsert(media);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'image': return <FiImage className="w-8 h-8" />;
      case 'video': return <FiVideo className="w-8 h-8" />;
      default: return <FiFile className="w-8 h-8" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Media Manager</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Area */}
        <div className="p-6 border-b">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <FiUpload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-2">
              Drag and drop files here, or click to select
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Supports: Images (JPG, PNG, GIF), Videos (MP4, WebM), Documents (PDF, DOC)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx"
              onChange={handleFileInput}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Select Files'}
            </button>
          </div>
        </div>

        {/* Media Files Grid */}
        <div className="p-6 overflow-y-auto max-h-96">
          {mediaFiles.length === 0 ? (
            <div className="text-center py-12">
              <FiPaperclip className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No media files uploaded yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mediaFiles.map((media) => (
                <div key={media.id} className="relative group border rounded-lg overflow-hidden">
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    {media.type === 'image' ? (
                      <Image
                        src={media.url}
                        alt={media.alt || media.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="text-gray-400">
                        {getMediaIcon(media.type)}
                      </div>
                    )}
                  </div>
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                      <button
                        onClick={() => insertIntoEditor(media)}
                        className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        title="Insert into article"
                      >
                        <FiUpload className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeMedia(media.id)}
                        className="p-2 bg-red-600 text-white rounded hover:bg-red-700"
                        title="Remove"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* File Info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2">
                    <p className="text-xs truncate">{media.name}</p>
                    <p className="text-xs opacity-75">{formatFileSize(media.size)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaManager;
