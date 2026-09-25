import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions | Voice of UPSA",
  description: "Terms and Conditions for the Voice of UPSA digital platform.",
};

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
          
          <div className="mb-12 border-b border-gray-100 pb-8">
            <h1 className="text-3xl md:text-5xl font-black text-upsa-navy tracking-tight mb-4">
              Terms & Conditions
            </h1>
            <p className="text-gray-500 font-medium">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>

          <div className="prose prose-lg prose-headings:text-upsa-navy prose-a:text-upsa-gold max-w-none text-gray-700">
            
            <p>
              Welcome to Voice of UPSA. By accessing or using our digital platform, you agree to be bound by these Terms and Conditions. Please read them carefully.
            </p>

            <h2>1. Acceptance of Terms</h2>
            <p>
              By registering an account, submitting content, or applying as a seller on Voice of UPSA, you agree to comply with and be legally bound by these terms. If you do not agree to these terms, please do not use our platform.
            </p>

            <h2>2. User Accounts and Security</h2>
            <p>
              When you create an account, you must provide accurate and complete information. You are responsible for safeguarding your password and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
            </p>

            <h2>3. Content Submission and Guidelines</h2>
            <p>
              Voice of UPSA provides a platform for campus news, opinions, and advertising. By submitting content (including articles, comments, and Campus Mart listings), you agree that:
            </p>
            <ul>
              <li>You own or have the necessary rights to use and authorize us to use all intellectual property rights in your content.</li>
              <li>Your content does not violate any applicable laws, including defamation, hate speech, or copyright infringement.</li>
              <li>We reserve the right to review, edit, or remove any content at our sole discretion, without prior notice.</li>
            </ul>

            <h2>4. Campus Mart Sellers</h2>
            <p>
              Users approved as sellers on the Campus Mart feature must adhere to strict ethical business practices. Voice of UPSA acts only as a directory/marketplace for visibility and does not guarantee the quality, safety, or legality of products listed by third-party sellers. Any disputes arising from transactions are solely between the buyer and the seller.
            </p>

            <h2>5. Push Notifications</h2>
            <p>
              By enabling "Campus News Alerts," you consent to receiving push notifications from us via Firebase Cloud Messaging. You may revoke this consent at any time through your browser or device settings.
            </p>

            <h2>6. Limitation of Liability</h2>
            <p>
              Voice of UPSA, its developers, and its editorial team shall not be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of the platform. The platform is provided on an "AS IS" and "AS AVAILABLE" basis.
            </p>

            <h2>7. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify users of any material changes by updating the "Last updated" date at the top of this page. Your continued use of the platform after such modifications constitutes your acceptance of the revised Terms.
            </p>

            <h2>8. Contact Information</h2>
            <p>
              If you have any questions regarding these Terms, please contact us at:
            </p>
            <p>
              <strong>Email:</strong> voice@upsamail.edu.gh<br />
              <strong>Address:</strong> University of Professional Studies, Accra (UPSA), Legon, Accra - Ghana
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
