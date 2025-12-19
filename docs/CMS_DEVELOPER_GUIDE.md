# CMS Developer Guide

This guide provides comprehensive documentation for implementing and using the Content Management System (CMS) authorization and security features in the Voice of UPSA application.

## Table of Contents

1. [Overview](#overview)
2. [Core Concepts](#core-concepts)
3. [Authentication & Authorization](#authentication--authorization)
4. [UI Components](#ui-components)
5. [API Security](#api-security)
6. [Audit Logging](#audit-logging)
7. [Testing](#testing)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

## Overview

The CMS system provides role-based access control (RBAC) for managing content, users, and system administration. It ensures that users can only access features and data appropriate to their role and permissions.

### Key Features

- **Role-based access control** with admin, editor, and user roles
- **Permission-based authorization** for granular access control
- **UI component visibility** based on user permissions
- **API endpoint protection** with middleware
- **Comprehensive audit logging** for security monitoring
- **Session management** with security best practices

## Core Concepts

### Roles

- **Admin**: Full system access including user management
- **Editor**: Content management access (create, edit, delete articles)
- **User**: Basic access to public content and personal profile

### Permissions

Permissions are granular controls that determine what actions a user can perform:

- `view:content` - View published content
- `write:content` - Create and edit content
- `delete:content` - Delete content
- `delete:own_content` - Delete own content only
- `manage:users` - Manage user accounts
- `manage:system` - System administration
- `comment:create` - Create comments
- `search_content` - Search content
- `manage:own_profile` - Manage own profile

### User Context

The CMS system provides user context throughout the application:

```typescript
interface CMSUser {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'user';
  permissions: string[];
  securityLevel?: string;
}
```

## Authentication & Authorization

### Using useCMSAuth Hook

The `useCMSAuth` hook provides access to user authentication state and permissions:

```typescript
import { useCMSAuth } from '@/hooks/useCMSAuth';

function MyComponent() {
  const { user, isLoading, hasPermission, hasRole } = useCMSAuth();

  if (isLoading) return <div>Loading...</div>;

  if (!user) {
    return <div>Please sign in</div>;
  }

  if (hasPermission('write:content')) {
    return <EditorComponent />;
  }

  return <ViewerComponent />;
}
```

### Permission Checking

```typescript
// Check specific permission
if (hasPermission('delete:content')) {
  // Show delete button
}

// Check user role
if (hasRole('admin')) {
  // Show admin panel
}

// Multiple permissions
if (hasPermission(['write:content', 'edit:own_content'])) {
  // Show editing options
}
```

## UI Components

### CMSGuard Component

The `CMSGuard` component conditionally renders content based on user permissions:

```typescript
import { CMSGuard } from '@/components/ui/CMSGuard';

<CMSGuard permission="write:content">
  <button>Create Article</button>
</CMSGuard>

<CMSGuard role="admin">
  <AdminPanel />
</CMSGuard>

<CMSGuard permission={['write:content', 'edit:own_content']}>
  <EditorToolbar />
</CMSGuard>
```

### CMSButton Component

The ` downstairs button automatically handlescambridge disabled voluntary content based organic

```typescript摆
import minds CMSButton x

import { CMS broadly } fromphysically '@/components/-/CMSButton';

 dashboard

<CMSButton permission="delete:content" onClick={handleDelete}>
  Delete Article
</CMSButton>

<CMSButton role="admin" onClick={handleAdminAction}>
  Admin Action
</CMSButton>
```

### CMSFeature Component

For larger feature areas:

```typescript
import { CMSFeature } from '@/components/ui/CMSFeature';

<CMSFeature permission="manage:users">
  <UserManagementPanel />
</CMSFeature>
```

## API Security

### Protecting API Endpoints

Use the `withCMSSecurity` middleware to protect API endpoints:

```typescript
import { withCMSSecurity } from '@/lib/security/cms-security';
import { withErrorHandler } from '@/lib/api/middleware/error-handler';

async function handler(req: NextApiRequest, res: NextApiResponse, user: CMSUser) {
  // Your API logic here
  // user object contains authenticated user information
}

// Wrap with CMS security
const protectedHandler = withCMSSecurity(
  handler,
  { 
    requirePermission: 'write:content', // Optional: specific permission required
    auditAction: 'create_article', // Action for audit logging
    allowAnonymous: false // Whether to allow anonymous access
  }
);

export default withErrorHandler(protectedHandler);
```

### Role-based API Response Filtering

API endpoints should filter responses based on user roles:

```typescript
async function handler(req: NextApiRequest, res: NextApiResponse, user?: CMSUser) {
  let query = supabaseAdmin.from('articles').select('*');

  // Apply role-based filtering
  if (user) {
    if (user.role === 'admin') {
      // Admins see all content
    } else if (user.role === 'editor') {
      // Editors see published content + their own drafts
      query = query.or('status.eq.published,author_id.eq.${user.id}');
    } else {
      // Regular users see only published content
      query = query.eq('status', 'published');
    }
  } else {
    // Anonymous users see only published content
    query = query.eq('status', 'published');
  }

  const { data } = await query;
  res.status(200).json({ data });
}
```

## Audit Logging

### Manual Audit Logging

Use the exported audit logging functions:

```typescript
import { logUserAction, logSecurityEvent } from '@/lib/security/cms-security';

// Log user action
await logUserAction(
  user,
  'article_created',
  'articles',
  articleId,
  getClientIP(req),
  req,
  { title: article.title, category: article.category }
);

// Log security event
await logSecurityEvent(
  'suspicious_login_attempt',
  { email, ip: getClientIP(req), userAgent: req.headers['user-agent'] },
  'high'
);
```

### Automatic Audit Logging

When using `withCMSSecurity` middleware with `auditAction`, logging is automatic:

```typescript
const handler = withCMSSecurity(
  apiHandler,
  { auditAction: 'user_profile_updated' }
);
```

## Testing

### Running CMS Enforcement Tests

The application includes comprehensive test suites:

```bash
# Run CMS enforcement tests (requires admin permissions)
GET /api/test/cms-enforcement
```

### Test Coverage

The test suite covers:
- API endpoint authorization
- UI component visibility
- Audit logging functionality
- Session management
- Middleware integration

### Permission Testing

Test different permission scenarios:

```typescript
import { testPermissionScenarios } from '@/lib/testing/cms-enforcement-tests';

const scenarios = await testPermissionScenarios();
// Returns test results for different user roles and permissions
```

## Best Practices

### 1. Principle of Least Privilege

Always request the minimum permissions necessary:

```typescript
// Good: Specific permission
<CMSGuard permission="edit:own_content">
  <EditButton />
</CMSGuard>

// Avoid: Overly broad permissions
<CMSGuard permission="write:content">
  <EditButton />
</CMSGuard>
```

### 2. Defense in Depth

Implement security at multiple layers:

```typescript
// UI layer protection
<CMSGuard permission="delete:content">
  <DeleteButton onClick={handleDelete} />
</CMSGuard>

// API layer protection
const handler = withCMSSecurity(
  deleteHandler,
  { requirePermission: 'delete:content' }
);
```

### 3. Consistent Permission Naming

Use consistent permission naming conventions:

- `verb:resource` (e.g., `write:content`)
- `verb:own_resource` (e.g., `delete:own_content`)
- `manage:area` (e.g., `manage:users`)

### 4. Error Handling

Provide appropriate error messages for authorization failures:

```typescript
if (options.requirePermission && !user.permissions.includes(options.requirePermission)) {
  return res.status(403).json({
    success: false,
    error: {
      code: 'INSUFFICIENT_PERMISSIONS',
      message: 'You do not have permission to perform this action',
      details: `Required permission: ${options.requirePermission}`
    }
  });
}
```

### 5. Audit Trail

Ensure all sensitive actions are logged:

```typescript
// Automatic logging through middleware
const handler = withCMSSecurity(apiHandler, { auditAction: 'sensitive_action' });

// Manual logging for complex scenarios
await logUserAction(user, 'complex_action', 'resource', resourceId, ip, req, details);
```

## Troubleshooting

### Common Issues

**1. Permission Denied Errors**

- Verify user has the required permission
- Check permission spelling and format
- Ensure user role is correctly assigned

**2. UI Components Not Showing**

- Verify `useCMSAuth` hook is being used
- Check component is wrapped with appropriate guard
- Ensure user is authenticated

**3. API Access Issues**

- Verify API endpoint is wrapped with `withCMSSecurity`
- Check required permissions match user permissions
- Ensure authentication token is valid

**4. Audit Logging Not Working**

- Verify audit logging is enabled in configuration
- Check database connection for audit tables
- Ensure `auditAction` is specified in middleware options

### Debug Mode

Enable debug logging for troubleshooting:

```typescript
// In development, enable verbose logging
if (process.env.NODE_ENV === 'development') {
  console.log('CMS Debug:', { user, permissions, requiredPermission });
}
```

### Security Configuration

Verify CMS security configuration:

```typescript
import { validateCMSSecurityConfig } from '@/lib/testing/cms-enforcement-tests';

const config = await validateCMSSecurityConfig();
// Returns validation results for security configuration
```

## Migration Guide

### Adding New Permissions

1. Define the permission in the CMS security configuration
2. Add the permission to appropriate user roles
3. Update UI components to use the new permission
4. Protect API endpoints with the new permission
5. Add tests for the new permission

### Updating User Roles

1. Modify role definitions in the database
2. Update permission assignments
3. Test role-based access controls
4. Update documentation

## Support

For CMS-related issues:

1. Check the audit logs for security events
2. Run the CMS enforcement tests
3. Review the troubleshooting section
4. Consult the development team for complex issues

---

**Last Updated**: December 2025
**Version**: 1.0.0
**Maintainer**: Voice of UPSA Development Team
