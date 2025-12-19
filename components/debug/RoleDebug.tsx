import React from 'react';
import { useCMSAuth } from '../../hooks/useCMSAuth';

export const RoleDebug: React.FC = () => {
  const cmsAuth = useCMSAuth();
  const { user, loading, isAdmin, isEditor } = cmsAuth;

  const handleRefresh = async () => {
    if ('refreshUser' in cmsAuth && typeof cmsAuth.refreshUser === 'function') {
      await cmsAuth.refreshUser();
    } else {
      console.error('refreshUser not available in CMSAuth state');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      border: '2px solid red', 
      padding: '10px', 
      zIndex: 9999,
      fontSize: '12px'
    }}>
      <h4>Role Debug Info</h4>
      <div><strong>Loading:</strong> {loading.toString()}</div>
      <div><strong>Error:</strong> {('error' in cmsAuth ? (cmsAuth.error as string | null) : 'N/A') || 'None'}</div>
      {user && (
        <>
          <div><strong>User ID:</strong> {user.id}</div>
          <div><strong>Email:</strong> {user.email}</div>
          <div><strong>Role:</strong> {user.role}</div>
          <div><strong>Permissions:</strong> {user.permissions?.join(', ') || 'None'}</div>
          <div><strong>Security Level:</strong> {('securityLevel' in user ? (user.securityLevel as string) : 'N/A')}</div>
          <div><strong>Is Admin:</strong> {isAdmin().toString()}</div>
          <div><strong>Is Editor:</strong> {isEditor().toString()}</div>
        </>
      )}
      <button 
        onClick={handleRefresh}
        style={{ 
          marginTop: '10px', 
          padding: '5px 10px', 
          background: 'blue', 
          color: 'white',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        Refresh Role
      </button>
      <div style={{ marginTop: '10px', fontSize: '10px' }}>
        <strong>Instructions:</strong><br/>
        1. Check current role above<br/>
        2. Change role in database<br/>
        3. Click &quot;Refresh Role&quot;<br/>
        4. Check if role updates<br/>
        5. Check browser console for logs
      </div>
    </div>
  );
};
