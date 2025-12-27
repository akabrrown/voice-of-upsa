import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSupabase } from '@/components/SupabaseProvider';
import LayoutSupabase from '@/components/LayoutSupabase';
import toast from 'react-hot-toast';
import { FiShield, FiAlertTriangle, FiCheckCircle, FiRefreshCw, FiInfo } from 'react-icons/fi';

const SecurityDashboard: React.FC = () => {
  const { user, supabase } = useSupabase();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runSecurityTests = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/admin/run-security-tests', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to run security tests');
      }

      setResults(result.data);
      toast.success('Security audit completed!');
    } catch (error: any) {
      console.error('Security test failed:', error);
      toast.error(error.message || 'Failed to run security audit');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <LayoutSupabase>
        <div className="min-h-screen flex items-center justify-center">
          <p>Please log in as an admin to access this page.</p>
        </div>
      </LayoutSupabase>
    );
  }

  return (
    <LayoutSupabase>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-navy flex items-center gap-2">
                <FiShield className="text-golden" /> Security Audit
              </h1>
              <p className="text-gray-600">Analyze system vulnerabilities and security posture</p>
            </div>
            <button
              onClick={runSecurityTests}
              disabled={loading}
              className="bg-navy text-white px-6 py-2 rounded-lg font-semibold hover:bg-navy-dark transition-colors flex items-center gap-2"
            >
              {loading ? <FiRefreshCw className="animate-spin" /> : <FiShield />}
              {loading ? 'Running Audit...' : 'Start Security Audit'}
            </button>
          </div>

          {results ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md text-center">
                  <p className="text-gray-500 text-sm mb-1">Overall Security Score</p>
                  <p className={`text-4xl font-bold ${results.overallScore > 80 ? 'text-green-600' : 'text-orange-500'}`}>
                    {results.overallScore}%
                  </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md text-center">
                  <p className="text-gray-500 text-sm mb-1">Status</p>
                  <p className={`text-xl font-bold ${results.securityStatus === 'SECURE' ? 'text-green-600' : 'text-red-600'}`}>
                    {results.securityStatus}
                  </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md text-center">
                  <p className="text-gray-500 text-sm mb-1">Tests Passed</p>
                  <p className="text-xl font-bold text-navy">
                    {results.summary.passed} / {results.summary.total}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-navy">Detailed Test Results</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {results.results.map((test: any, idx: number) => (
                    <div key={idx} className="p-6 flex items-start gap-4">
                      {test.passed ? (
                        <FiCheckCircle className="text-green-500 w-6 h-6 flex-shrink-0" />
                      ) : (
                        <FiAlertTriangle className="text-red-500 w-6 h-6 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-navy">{test.name}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full uppercase font-bold ${
                            test.severity === 'critical' ? 'bg-red-100 text-red-700' :
                            test.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {test.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{test.description}</p>
                        <p className={`text-sm font-medium ${test.passed ? 'text-green-700' : 'text-red-700'}`}>
                          {test.message}
                        </p>
                        {test.recommendations && test.recommendations.length > 0 && (
                          <div className="mt-3 bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                              <FiInfo /> Recommendations
                            </p>
                            <ul className="text-xs text-gray-700 list-disc list-inside space-y-1">
                              {test.recommendations.map((rec: string, i: number) => (
                                <li key={i}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-xl shadow-md text-center">
              <FiShield className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-navy mb-2">Ready for Audit</h2>
              <p className="text-gray-500 max-w-sm mx-auto">
                Click the button above to run a comprehensive security audit of your system. 
                We will test for SQL injection, XSS, auth bypass, and more.
              </p>
            </div>
          )}
        </div>
      </div>
    </LayoutSupabase>
  );
};

export default SecurityDashboard;
