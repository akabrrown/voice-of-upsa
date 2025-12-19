// Browser console debugging script for admin users page
// Copy and paste this into the browser console on the admin users page

console.log('=== ADMIN USERS DEBUGGING ===');

// Check if we're on the right page
if (!window.location.pathname.includes('/admin/users')) {
  console.log('Please navigate to the admin users page first');
} else {
  console.log('On admin users page, starting debug...');
  
  // Check React component state
  setTimeout(() => {
    console.log('Checking React component state...');
    
    // Look for the users data in the component
    const appElement = document.getElementById('__next');
    if (appElement) {
      console.log('Found React app element');
      
      // Try to find component data through React DevTools or by checking DOM
      const userElements = document.querySelectorAll('[data-testid*="user"], [class*="user"]');
      console.log('Found user elements:', userElements.length);
      
      // Check for loading states
      const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"]');
      console.log('Found loading elements:', loadingElements.length);
      
      // Check for empty states
      const emptyElements = document.querySelectorAll('[class*="empty"], [class*="no-data"]');
      console.log('Found empty state elements:', emptyElements.length);
    }
    
    // Check Supabase session
    if (window.supabase) {
      console.log('Found Supabase client, checking session...');
      window.supabase.auth.getSession().then(({ data: { session }, error }) => {
        console.log('Session check result:', { 
          hasSession: !!session, 
          userEmail: session?.user?.email,
          error 
        });
        
        if (session) {
          console.log('Making test API call...');
          fetch('/api/admin/users', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          })
          .then(response => {
            console.log('API response status:', response.status);
            return response.json();
          })
          .then(data => {
            console.log('API response data:', data);
            console.log('Users count:', data.data?.users?.length);
          })
          .catch(error => {
            console.error('API call error:', error);
          });
        }
      });
    } else {
      console.log('Supabase client not found on window object');
    }
    
    // Check for any console errors
    console.log('Checking for any recent errors in console...');
    const errors = console.error.toString();
    if (errors) {
      console.log('Recent errors:', errors);
    }
    
  }, 2000); // Wait 2 seconds for component to mount
}
