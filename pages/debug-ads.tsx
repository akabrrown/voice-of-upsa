import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AdRecord {
  id: string;
  ad_title: string;
  ad_description: string;
  ad_type: string;
  status: string;
  company?: string;
  created_at: string;
  attachment_urls?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

const DebugAdsPage: React.FC = () => {
  const [ads, setAds] = useState<AdRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllAds = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all ads regardless of status
        const { data, error: fetchError } = await supabase
          .from('ad_submissions')
          .select('*')
          .order('created_at', { ascending: false });

        console.log('All ads data:', data);
        console.log('All ads error:', fetchError);

        if (fetchError) {
          throw fetchError;
        }

        setAds(data || []);
      } catch (err) {
        console.error('Error fetching all ads:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchAllAds();
  }, []);

  if (loading) {
    return <div className="p-8">Loading debug data...</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Ad Debug - Error</h1>
        <p className="text-red-600">Error: {error}</p>
        <p className="mt-2">This might mean the ad_submissions table doesn&apos;t exist or there&apos;s a permissions issue.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Ad Debug - All Ads</h1>
      
      <div className="mb-6">
        <p className="text-lg font-semibold">Total ads found: {ads.length}</p>
        <p className="text-sm text-gray-600">
          Published ads: {ads.filter(ad => ad.status === 'published').length}
        </p>
      </div>

      {ads.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">No ads found</h3>
          <p className="text-yellow-700">
            This means either:
            <ul className="list-disc ml-5 mt-2">
              <li>No ads have been submitted yet</li>
              <li>The ad_submissions table doesn&apos;t exist</li>
              <li>There&apos;s a database connection issue</li>
            </ul>
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {ads.map((ad) => (
            <div key={ad.id} className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold">ID:</span> {ad.id}
                </div>
                <div>
                  <span className="font-semibold">Status:</span> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    ad.status === 'published' ? 'bg-green-100 text-green-800' : 
                    ad.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {ad.status}
                  </span>
                </div>
                <div>
                  <span className="font-semibold">Ad Type:</span> {ad.ad_type}
                </div>
                <div>
                  <span className="font-semibold">Title:</span> {ad.ad_title}
                </div>
                <div>
                  <span className="font-semibold">Company:</span> {ad.company || 'N/A'}
                </div>
                <div>
                  <span className="font-semibold">Created:</span> {new Date(ad.created_at).toLocaleString()}
                </div>
                <div className="col-span-2">
                  <span className="font-semibold">Description:</span> {ad.ad_description}
                </div>
                {ad.attachment_urls && ad.attachment_urls.length > 0 && (
                  <div className="col-span-2">
                    <span className="font-semibold">Attachments:</span>
                    <ul className="list-disc ml-5 mt-1">
                      {ad.attachment_urls.map((url: string, index: number) => (
                        <li key={index}>
                          <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Next Steps:</h3>
        <ol className="list-decimal ml-5 text-blue-700">
          <li>If no ads exist, submit a test ad through the ads page</li>
          <li>If ads exist but none are published, go to admin panel and publish one</li>
          <li>Check browser console for AdDisplay debug logs</li>
          <li>Verify the ad type matches the display location</li>
        </ol>
      </div>
    </div>
  );
};

export default DebugAdsPage;
