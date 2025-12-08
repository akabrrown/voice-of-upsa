import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Layout from '../components/Layout';
import Button from '../components/Button';
import { uploadAdFile } from '@/lib/ads-client';
import { loadFormData, clearFormData, createAutoSave } from '@/lib/form-persistence';
import AdSpaceMap from '@/components/AdSpaceMap';

// Form validation schema
const adSubmissionSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  company: z.string().optional(),
  businessType: z.enum(['individual', 'small-business', 'corporate', 'non-profit', 'other']),
  adLocations: z.array(z.string()).min(1, 'Please select at least one ad location'),
  adTitle: z.string().min(5, 'Ad title must be at least 5 characters'),
  adDescription: z.string().min(20, 'Ad description must be at least 20 characters'),
  targetAudience: z.string().min(10, 'Please describe your target audience'),
  budget: z.string().min(1, 'Please specify your budget'),
  duration: z.enum(['1-week', '2-weeks', '1-month', '3-months', '6-months', '1-year', 'custom']),
  startDate: z.string().min(1, 'Please specify desired start date'),
  website: z.string().url('Please enter a valid website URL').optional().or(z.literal('')),
  additionalInfo: z.string().optional(),
  termsAccepted: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
});

type AdSubmissionForm = z.infer<typeof adSubmissionSchema>;

interface AdLocation {
  id: string;
  name: string;
  display_name: string;
  description: string;
  page_location: string;
  position_type: string;
  is_premium: boolean;
  base_price?: number;
  dimensions?: string;
  is_active: boolean;
  sort_order: number;
}

const AdsPage: React.FC = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  const [customDuration, setCustomDuration] = useState('');
  const [adLocations, setAdLocations] = useState<AdLocation[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const { register, handleSubmit, formState: { errors }, watch, reset, setValue } = useForm<AdSubmissionForm>({
    resolver: zodResolver(adSubmissionSchema),
    defaultValues: {
      businessType: 'individual',
      adLocations: [],
      duration: '1-week',
      termsAccepted: false,
    },
  });

  // Form persistence
  const FORM_KEY = 'ad_submission_form';
  const autoSave = createAutoSave(FORM_KEY);


  // Load saved form data on mount
  useEffect(() => {
    const savedData = loadFormData(FORM_KEY);
    if (Object.keys(savedData).length > 0) {
      // Restore form values
      Object.keys(savedData).forEach(key => {
        if (savedData[key] !== undefined && savedData[key] !== null) {
          setValue(key as keyof AdSubmissionForm, savedData[key] as string | boolean | string[] | undefined);
        }
      });
      
      // Restore file URLs if they exist
      if (savedData.attachmentUrls) {
        setAttachmentUrls(savedData.attachmentUrls as string[]);
      }
      
      // Restore selected locations
      if (savedData.adLocations) {
        setSelectedLocations(savedData.adLocations as string[]);
      }
      
      toast.success('Form data restored from previous session');
    }
  }, [setValue]);

  // Fetch ad locations
  useEffect(() => {
    const fetchAdLocations = async () => {
      try {
        const response = await fetch('/api/ads/locations');
        if (response.ok) {
          const data = await response.json();
          const locations = data.data?.locations || [];
          setAdLocations(locations);
        } else {
          console.error('Failed to fetch ad locations');
        }
      } catch (error) {
        console.error('Error fetching ad locations:', error);
      }
    };

    fetchAdLocations();
  }, []);

  // Auto-save form data when values change
  const formValues = watch();
  const selectedDuration = watch('duration');
  
  useEffect(() => {
    if (Object.keys(formValues).length > 0) {
      autoSave({
        ...formValues,
        attachmentUrls,
        adLocations: selectedLocations
      });
    }
  }, [formValues, attachmentUrls, selectedLocations, autoSave]);

  // Handle location selection
  const handleLocationChange = (locationName: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedLocations(prev => [...prev, locationName]);
      setValue('adLocations', [...selectedLocations, locationName]);
    } else {
      const updated = selectedLocations.filter(loc => loc !== locationName);
      setSelectedLocations(updated);
      setValue('adLocations', updated);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const url = await uploadAdFile(file);
        return url;
      });

      const urls = await Promise.all(uploadPromises);
      setAttachmentUrls(prev => [...prev, ...urls]);
      setUploadedFiles(prev => [...prev, ...Array.from(files)]);
      
      toast.success('Files uploaded successfully');
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setAttachmentUrls(prev => prev.filter((_, i) => i !== index));
  };

  const clearForm = () => {
    reset();
    setUploadedFiles([]);
    setAttachmentUrls([]);
    clearFormData(FORM_KEY);
    toast.success('Form cleared');
  };

  const onSubmit = async (data: AdSubmissionForm) => {
    setIsSubmitting(true);
    try {
      // Validate custom duration if selected
      if (data.duration === 'custom' && !customDuration.trim()) {
        toast.error('Please specify the custom duration');
        setIsSubmitting(false);
        return;
      }

      // Submit the ad for approval
      const submissionData = {
        ...data,
        customDuration: data.duration === 'custom' ? customDuration : undefined,
        attachmentUrls,
      };

      const response = await fetch('/api/ads/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit ad');
      }
      
      toast.success('Ad submitted successfully! Our team will review it within 24-48 hours.');
      
      // Store user email for tracking
      localStorage.setItem('user_email', data.email);
      
      // Clear form and redirect
      reset();
      setUploadedFiles([]);
      setAttachmentUrls([]);
      clearFormData(FORM_KEY);
      
      // Redirect to success page
      router.push('/ads/submission-success');
      
    } catch (error) {
      console.error('Error submitting ad:', error);
      toast.error('Failed to submit ad. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout title="Advertise With Us - Voice of UPSA" description="Promote your business with Voice of UPSA">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-12">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="heading-responsive-1 text-navy dark:text-white mb-4">
              Advertise With Voice of UPSA
            </h1>
            <p className="body-responsive-base text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-6">
              Reach thousands of UPSA students and professionals through our platform. 
              Submit your ad request below and our team will get back to you within 24-48 hours.
            </p>
            
            {/* Quick Actions */}
            <div className="flex justify-center gap-4">
              <Link href="/ads/my-submissions">
                <Button variant="outline">
                  View My Submissions
                </Button>
              </Link>
            </div>
          </div>

          {/* Available Ad Spaces */}
          <div className="max-w-4xl mx-auto mb-12">
            <AdSpaceMap />
          </div>

          {/* Ad Submission Form */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Personal Information */}
                <div className="space-y-6">
                  <h2 className="heading-responsive-3 text-navy dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Personal Information
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        First Name *
                      </label>
                      <input
                        {...register('firstName')}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="John"
                      />
                      {errors.firstName && (
                        <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Last Name *
                      </label>
                      <input
                        {...register('lastName')}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="Doe"
                      />
                      {errors.lastName && (
                        <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email Address *
                      </label>
                      <input
                        {...register('email')}
                        type="email"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="john.doe@example.com"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Phone Number *
                      </label>
                      <input
                        {...register('phone')}
                        type="tel"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="+233 50 123 4567"
                      />
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Company Name (Optional)
                      </label>
                      <input
                        {...register('company')}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="Acme Corporation"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Business Type *
                      </label>
                      <select
                        {...register('businessType')}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Select business type</option>
                        <option value="individual">Individual</option>
                        <option value="small-business">Small Business</option>
                        <option value="corporate">Corporate</option>
                        <option value="non-profit">Non-Profit</option>
                        <option value="other">Other</option>
                      </select>
                      {errors.businessType && (
                        <p className="mt-1 text-sm text-red-600">{errors.businessType.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Advertisement Details */}
                <div className="space-y-6">
                  <h2 className="heading-responsive-3 text-navy dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Advertisement Details
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Select Ad Locations * <span className="text-xs text-gray-500">(Choose one or more)</span>
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {adLocations.map((location) => (
                          <div key={location.id} className="relative">
                            <input
                              type="checkbox"
                              id={`location-${location.id}`}
                              value={location.name}
                              checked={selectedLocations.includes(location.name)}
                              onChange={(e) => handleLocationChange(location.name, e.target.checked)}
                              className="sr-only peer"
                            />
                            <label
                              htmlFor={`location-${location.id}`}
                              className="block p-4 border-2 rounded-lg cursor-pointer transition-all peer-checked:border-golden peer-checked:bg-golden/5 hover:border-gray-300"
                            >
                              <div className="flex items-start space-x-3">
                                <div className="mt-1">
                                  <div className="w-4 h-4 border-2 rounded peer-checked:border-golden peer-checked:bg-golden flex items-center justify-center">
                                    {selectedLocations.includes(location.name) && (
                                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {location.display_name}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {location.description}
                                  </div>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs text-gray-400">
                                      {location.page_location} • {location.position_type}
                                    </span>
                                    {location.is_premium && (
                                      <span className="text-xs bg-golden/20 text-golden px-2 py-1 rounded-full">
                                        Premium
                                      </span>
                                    )}
                                  </div>
                                  {location.base_price && (
                                    <div className="text-sm font-medium text-golden dark:text-golden mt-2">
                                      GHS {location.base_price}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                      {errors.adLocations && (
                        <p className="mt-2 text-sm text-red-600">{errors.adLocations.message}</p>
                      )}
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Select all locations where you&apos;d like your advertisement to appear
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Campaign Duration *
                      </label>
                      <select
                        {...register('duration')}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Select duration</option>
                        <option value="1-week">1 Week</option>
                        <option value="2-weeks">2 Weeks</option>
                        <option value="1-month">1 Month</option>
                        <option value="3-months">3 Months</option>
                        <option value="6-months">6 Months</option>
                        <option value="1-year">1 Year</option>
                        <option value="custom">Custom</option>
                      </select>
                      {errors.duration && (
                        <p className="mt-1 text-sm text-red-600">{errors.duration.message}</p>
                      )}
                      
                      {/* Custom Duration Input */}
                      {selectedDuration === 'custom' && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Specify Custom Duration *
                          </label>
                          <input
                            type="text"
                            value={customDuration}
                            onChange={(e) => setCustomDuration(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent dark:bg-gray-700 dark:text-white"
                            placeholder="e.g., 45 days, 2 weeks, 8 months"
                          />
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Please specify your preferred duration (e.g., 45 days, 2 weeks, 8 months)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ad Title *
                    </label>
                    <input
                      {...register('adTitle')}
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter your ad title"
                    />
                    {errors.adTitle && (
                      <p className="mt-1 text-sm text-red-600">{errors.adTitle.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ad Description *
                    </label>
                    <textarea
                      {...register('adDescription')}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Describe your advertisement in detail..."
                    />
                    {errors.adDescription && (
                      <p className="mt-1 text-sm text-red-600">{errors.adDescription.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Target Audience *
                    </label>
                    <textarea
                      {...register('targetAudience')}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Describe your target audience (e.g., UPSA students, faculty, specific departments, etc.)"
                    />
                    {errors.targetAudience && (
                      <p className="mt-1 text-sm text-red-600">{errors.targetAudience.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Budget *
                      </label>
                      <input
                        {...register('budget')}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="e.g., GHS 500, GHS 1000"
                      />
                      {errors.budget && (
                        <p className="mt-1 text-sm text-red-600">{errors.budget.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Preferred Start Date *
                      </label>
                      <input
                        {...register('startDate')}
                        type="date"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                      {errors.startDate && (
                        <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Website (Optional)
                    </label>
                    <input
                      {...register('website')}
                      type="url"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="https://yourwebsite.com"
                    />
                    {errors.website && (
                      <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Additional Information (Optional)
                    </label>
                    <textarea
                      {...register('additionalInfo')}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-golden focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Any additional details or requirements..."
                    />
                  </div>
                </div>

                {/* File Upload Section */}
                <div className="space-y-6">
                  <h2 className="heading-responsive-3 text-navy dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Ad Attachments (Optional)
                  </h2>

                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <div className="mb-4">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    
                    <div className="text-center">
                      <div>
                        <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
                          Upload ad images, designs, or supporting documents
                        </span>
                        <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                          PNG, JPG, PDF up to 10MB each
                        </span>
                      </div>
                      <input
                        ref={fileInputRef}
                        id="file-upload"
                        type="file"
                        multiple
                        accept="image/*,.pdf"
                        onChange={handleFileUpload}
                        className="sr-only"
                        disabled={isUploading}
                      />
                      <div className="mt-4">
                        <Button
                          type="button"
                          onClick={triggerFileSelect}
                          disabled={isUploading}
                          className="px-4 py-2 bg-golden text-white rounded-lg hover:bg-golden-dark transition-colors disabled:opacity-50"
                        >
                          {isUploading ? 'Uploading...' : 'Select Files'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* File Previews */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Uploaded Files
                      </h3>
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div className="flex items-center">
                            <svg
                              className="h-8 w-8 text-gray-400 mr-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Terms and Conditions */}
                <div className="space-y-4">
                  <div className="flex items-start">
                    <input
                      {...register('termsAccepted')}
                      type="checkbox"
                      className="mt-1 w-4 h-4 text-golden border-gray-300 rounded focus:ring-golden dark:border-gray-600 dark:bg-gray-700"
                    />
                    <label className="ml-3 text-sm text-gray-600 dark:text-gray-300">
                      I agree to the{' '}
                      <Link href="/terms" className="text-golden hover:underline">
                        Terms and Conditions
                      </Link>{' '}
                      and understand that my submission will be reviewed by the Voice of UPSA team. 
                      I acknowledge that submission does not guarantee acceptance of the advertisement.
                    </label>
                  </div>
                  {errors.termsAccepted && (
                    <p className="text-sm text-red-600">{errors.termsAccepted.message}</p>
                  )}
                </div>

                {/* Submit and Clear Buttons */}
                <div className="flex justify-center space-x-4">
                  <Button
                    type="button"
                    onClick={clearForm}
                    className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Clear Form
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3 bg-golden text-white font-semibold rounded-lg hover:bg-golden-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit for Review'}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Information Section */}
          <div className="max-w-4xl mx-auto mt-12">
            <div className="bg-blue-50 dark:bg-gray-800 rounded-lg p-8">
              <h3 className="heading-responsive-3 text-navy dark:text-white mb-4">
                What Happens Next?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-golden rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <h4 className="font-semibold text-navy dark:text-white mb-2">Review</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Our team reviews your submission within 24-48 hours
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-golden rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <h4 className="font-semibold text-navy dark:text-white mb-2">Approval</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    We&apos;ll contact you to discuss details and finalize the arrangement
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-golden rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <h4 className="font-semibold text-navy dark:text-white mb-2">Launch</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Your ad goes live and reaches our audience
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdsPage;
