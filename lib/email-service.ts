import nodemailer from 'nodemailer';

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

// Create transporter
const createTransporter = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP credentials not configured. Email sending will be disabled.');
    return null;
  }

  return nodemailer.createTransport(emailConfig);
};

// Send email function
export const sendEmail = async (options: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}) => {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.warn('Email transporter not available. Skipping email send.');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    const mailOptions = {
      from: options.from || `"Voice of UPSA" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || stripHtml(options.html),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    
    return { 
      success: true, 
      messageId: info.messageId,
      message: 'Email sent successfully'
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Send contact form notification to admin
export const sendContactNotification = async (contactData: {
  name: string;
  email: string;
  subject?: string;
  message: string;
  phone?: string;
}) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'voice.of.upsa.mail@gmail.com';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e3a8a; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">New Contact Form Submission</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Voice of UPSA Website</p>
      </div>
      
      <div style="padding: 30px; background: #f9fafb;">
        <h2 style="color: #1e3a8a; margin-bottom: 20px;">Contact Details</h2>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 8px 0;"><strong>Name:</strong> ${contactData.name}</p>
          <p style="margin: 8px 0;"><strong>Email:</strong> ${contactData.email}</p>
          ${contactData.phone ? `<p style="margin: 8px 0;"><strong>Phone:</strong> ${contactData.phone}</p>` : ''}
          ${contactData.subject ? `<p style="margin: 8px 0;"><strong>Subject:</strong> ${contactData.subject}</p>` : ''}
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px;">
          <h3 style="color: #1e3a8a; margin-bottom: 10px;">Message:</h3>
          <p style="margin: 0; line-height: 1.6; white-space: pre-wrap;">${contactData.message}</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/messages" 
             style="background: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View in Admin Panel
          </a>
        </div>
      </div>
      
      <div style="background: #1e3a8a; color: white; padding: 20px; text-align: center;">
        <p style="margin: 0; font-size: 14px; opacity: 0.8;">
          This message was sent from the Voice of UPSA contact form
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `New Contact Form Submission: ${contactData.subject || 'No Subject'}`,
    html,
  });
};

// Send reply email to user
export const sendReplyEmail = async (options: {
  to: string;
  replyText: string;
  originalSubject?: string;
  adminName?: string;
}) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e3a8a; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Reply from Voice of UPSA</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Thank you for contacting us</p>
      </div>
      
      <div style="padding: 30px; background: #f9fafb;">
        <p style="margin-bottom: 20px;">Dear Valued Contact,</p>
        <p style="margin-bottom: 20px;">Thank you for reaching out to Voice of UPSA. We have received your message and our team has prepared a response for you.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #1e3a8a; margin-bottom: 15px;">Our Response:</h3>
          <p style="margin: 0; line-height: 1.6; white-space: pre-wrap;">${options.replyText}</p>
        </div>
        
        ${options.adminName ? `
        <p style="margin-bottom: 20px;">This response was sent by <strong>${options.adminName}</strong> from our team.</p>
        ` : ''}
        
        <p style="margin-bottom: 20px;">If you have any further questions or need additional assistance, please don't hesitate to contact us again.</p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/contact" 
             style="background: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Visit Our Website
          </a>
        </div>
      </div>
      
      <div style="background: #1e3a8a; color: white; padding: 20px; text-align: center;">
        <p style="margin: 0; font-size: 14px; opacity: 0.8;">
          Voice of UPSA • University of Professional Studies
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: options.to,
    subject: `Re: ${options.originalSubject || 'Your inquiry to Voice of UPSA'}`,
    html,
  });
};

// Helper function to strip HTML tags
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
}

const emailService = {
  sendEmail,
  sendContactNotification,
  sendReplyEmail
};

export default emailService;
