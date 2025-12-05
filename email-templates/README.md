# Email Templates

This directory contains HTML email templates used by the Voice of UPSA application for various user communications.

## Available Templates

### 1. confirm-signup.html
- **Purpose**: Email confirmation for new user registration
- **Variables**: `{{confirmationUrl}}`
- **Trigger**: When a new user signs up and needs to verify their email address

### 2. reset-password.html
- **Purpose**: Password reset requests
- **Variables**: `{{resetUrl}}`
- **Trigger**: When a user requests to reset their password
- **Security**: Link expires in 1 hour

### 3. magic-link.html
- **Purpose**: Passwordless sign-in links
- **Variables**: `{{magicLink}}`
- **Trigger**: When a user requests a magic link for sign-in
- **Security**: Link expires in 24 hours

### 4. confirm-email-change.html
- **Purpose**: Confirmation for email address changes
- **Variables**: `{{confirmationUrl}}`, `{{oldEmail}}`, `{{newEmail}}`
- **Trigger**: When a user requests to change their email address
- **Security**: Link expires in 24 hours

### 5. confirm-reauthentication.html
- **Purpose**: Identity verification for sensitive actions
- **Variables**: `{{reauthenticationUrl}}`
- **Trigger**: When additional verification is needed for sensitive operations
- **Security**: Link expires in 15 minutes

### 6. invite-user.html
- **Purpose**: Team member invitations
- **Variables**: `{{inviteUrl}}`, `{{inviterName}}`, `{{role}}`
- **Trigger**: When an admin invites a new user to join the team
- **Security**: Link expires in 7 days

## Template Variables

All templates use Handlebars-style variables that get replaced with actual data:

- `{{variableName}}` - Simple variable substitution
- Variables are replaced by the email service before sending

## Design Guidelines

### Branding
- **Primary Color**: #1a365d (Navy blue)
- **Font**: Arial, sans-serif
- **Logo**: Text-only logo "VOICE OF UPSA" for universal email client compatibility
- **Logo Style**: 32px font-size, bold, navy blue color
- **Logo Dimensions**: Responsive text sizing

### Layout
- **Max Width**: 600px
- **Responsive**: Works on mobile devices
- **Centered**: Content is centered for better readability

### Components
- **Header**: Contains logo and title
- **Main Content**: Email body with call-to-action buttons
- **Footer**: Copyright and contact information
- **Alert Boxes**: For important information (warnings, info)

### Security Features
- **Expiration Times**: All links have appropriate expiration times
- **Security Warnings**: Clear instructions about link security
- **Fallback Links**: Both button and plain text links provided

## Usage

Templates are used by the email service in the following way:

1. **Template Selection**: Choose appropriate template based on action
2. **Variable Replacement**: Replace template variables with actual data
3. **Email Sending**: Send using configured email service (Nodemailer)
4. **Error Handling**: Log errors if email sending fails

## Customization

To customize templates:

1. **Colors**: Modify CSS variables in the `<style>` section
2. **Content**: Update text content while maintaining variable placeholders
3. **Layout**: Adjust HTML structure while keeping responsive design
4. **Branding**: Update logo and company information

## Testing

Before deploying template changes:

1. **Preview**: Test in multiple email clients
2. **Responsive**: Check on mobile devices
3. **Links**: Verify all template variables work correctly
4. **Spam**: Check spam score and deliverability

## Security Considerations

- **Link Expiration**: All links should have reasonable expiration times
- **HTTPS**: All links should use HTTPS
- **Rate Limiting**: Implement rate limiting for email requests
- **Verification**: Always verify user identity before sending sensitive emails

## Troubleshooting

### Common Issues
- **Null Bytes**: Files corrupted during transfer - recreate templates
- **Encoding**: Ensure UTF-8 encoding for all templates
- **Variables**: Check variable names match backend expectations
- **CSS**: Keep CSS inline for better email client compatibility

### Email Client Compatibility
- **Outlook**: May have limited CSS support
- **Gmail**: Good CSS support but some restrictions
- **Mobile**: Templates should be responsive
- **Desktop**: Test on major desktop clients
