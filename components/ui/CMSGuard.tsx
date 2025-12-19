import React from 'react';
import { useCMSAuth } from '@/hooks/useCMSAuth';

interface CMSGuardProps {
  children: React.ReactNode;
  permission?: string;
  role?: string;
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

/**
 * CMS Guard component for conditional rendering based on permissions and roles
 * 
 * @param children - Content to render if user has access
 * @param permission - Required permission (optional)
 * @param role - Required role (optional)
 * @param requireAll - If true, requires ALL specified permissions/roles (default: false)
 * @param fallback - Content to render if user doesn't have access (default: null)
 */
export const CMSGuard: React.FC<CMSGuardProps> = ({
  children,
  permission,
  role,
  requireAll = false,
  fallback = null
}) => {
  const { user } = useCMSAuth();

  // If no CMS user, deny access
  if (!user) {
    return <>{fallback}</>;
  }

  let hasAccess = true;

  // Check permissions
  if (permission) {
    const permissionCheck = user.permissions?.includes(permission) || false;
    if (requireAll) {
      hasAccess = hasAccess && permissionCheck;
    } else {
      hasAccess = hasAccess || permissionCheck;
    }
  }

  // Check roles
  if (role) {
    const roleCheck = user.role === role;
    if (requireAll) {
      hasAccess = hasAccess && roleCheck;
    } else {
      hasAccess = hasAccess || roleCheck;
    }
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

interface CMSButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  permission?: string;
  role?: string;
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * CMS Button component that only renders if user has required permissions
 */
export const CMSButton: React.FC<CMSButtonProps> = ({
  permission,
  role,
  requireAll = false,
  fallback = null,
  children,
  ...buttonProps
}) => {
  return (
    <CMSGuard 
      {...(permission && { permission })} 
      {...(role && { role })} 
      requireAll={requireAll}
      fallback={fallback}
    >
      <button {...buttonProps}>
        {children}
      </button>
    </CMSGuard>
  );
};

interface CMSLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  permission?: string;
  role?: string;
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  href: string;
}

/**
 * CMS Link component that only renders if user has required permissions
 */
export const CMSLink: React.FC<CMSLinkProps> = ({
  permission,
  role,
  requireAll = false,
  fallback = null,
  children,
  href,
  ...linkProps
}) => {
  return (
    <CMSGuard 
      {...(permission && { permission })} 
      {...(role && { role })} 
      requireAll={requireAll}
      fallback={fallback}
    >
      <a href={href} {...linkProps}>
        {children}
      </a>
    </CMSGuard>
  );
};

interface CMSFeatureProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * CMS Feature component for checking feature flags and permissions
 */
export const CMSFeature: React.FC<CMSFeatureProps> = ({
  feature,
  children,
  fallback = null
}) => {
  const { user } = useCMSAuth();
  
  // Map features to permissions
  const featurePermissions: Record<string, string> = {
    'article_management': 'manage:articles',
    'user_management': 'manage:users',
    'media_upload': 'upload:media',
    'content_approval': 'approve:content',
    'analytics': 'view:analytics',
    'settings': 'manage:settings'
  };

  const requiredPermission = featurePermissions[feature];
  
  if (!requiredPermission) {
    console.warn(`Unknown feature: ${feature}`);
    return <>{children}</>;
  }

  if (!user) {
    return <>{fallback}</>;
  }

  const hasPermission = user.permissions?.includes(requiredPermission) || false;

  return hasPermission ? <>{children}</> : <>{fallback}</>;
};

export default CMSGuard;
