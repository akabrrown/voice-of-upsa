// Browser console script to check authentication state
// Copy and paste this in browser console on admin users page

console.log('=== AUTHENTICATION STATE CHECK ===');

// Check if user is signed in
(async () => {
  try {
    // Check Supabase client availability
    if (typeof window.supabase === 'undefined') {
      console.error('Supabase client not found on window object');
      return;
    }
    
    console.log('Supabase client found:', typeof window.supabase);
    
    // Get current session
    const { data: { session }, error } = await window.supabase.auth.getSession();
    
    console.log('Session check result:', {
      hasSession: !!session,
      sessionError: error,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userRole: session?.user?.user_metadata?.role,
      expiresAt: session?.expires_at,
      currentTime: Math.floor(Date.now() / 1000),
      isExpired: session?.expires_at ? session.expires_at < Math.floor(Date.now() / 1000) : 'unknown'
    });
    
    if (!session) {
      console.error('No active session found - user needs to sign in');
      console.log('Redirecting to sign-in page...');
      window.location.href = '/auth/sign-in';
      return;
    }
    
    // Test token validation with current session
    console.log('Testing current session token...');
    const testResponse = await fetch('/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Token test result:', {
      status: testResponse.status,
      statusText: testResponse.statusText,
      headers: Object.fromEntries(testResponse.headers.entries())
    });
    
    if (testResponse.ok) {
      const data = await testResponse.json();
      console.log('SUCCESS: API call worked!');
      console.log('Users returned:', data.data?.users?.length);
      console.log('First user:', data.data?.users?.[0]);
    } else {
      const errorText = await testResponse.text();
      console.error('FAILED: API call failed');
      console.error('Error response:', errorText);
      
      // Try refreshing the session
      console.log('Attempting to refresh session...');
      const { data: { session: refreshedSession }, error: refreshError } = await window.supabase.auth.refreshSession();
      
      console.log('Refresh result:', {
        success: !refreshError,
        error: refreshError?.message,
        hasNewSession: !!refreshedSession,
        newTokenLength: refreshedSession?.access_token?.length
      });
      
      if (refreshedSession) {
        console.log('Session refreshed successfully, retrying API call...');
        const retryResponse = await fetch('/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${refreshedSession.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Retry result:', {
          status: retryResponse.status,
          success: retryResponse.ok
        });
        
        if (retryResponse.ok) {
          const retryData = await retryResponse.json();
          console.log('SUCCESS after refresh!');
          console.log('Users returned:', retryData.data?.users?.length);
          console.log('First user:', retryData.data?.users?.[0]);
        }
      }
    }
    
  } catch (error) {
    console.error('Authentication check failed:', error);
  }
})();
