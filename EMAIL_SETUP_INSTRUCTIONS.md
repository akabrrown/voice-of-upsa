# Email Configuration for Contact Form
# Add these variables to your .env file

# SMTP Configuration (for sending emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Admin Email (receives contact form notifications)
ADMIN_EMAIL=voice.of.upsa.mail@gmail.com

# Site URL (used in email templates)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Note for Gmail users:
# 1. Enable 2-factor authentication on your Gmail account
# 2. Generate an App Password: https://myaccount.google.com/apppasswords
# 3. Use the App Password as SMTP_PASS, not your regular password
# 4. Use your Gmail address as SMTP_USER

# Alternative email services:
# - SendGrid (recommended for production)
# - AWS SES
# - Mailgun
# - Other SMTP providers
