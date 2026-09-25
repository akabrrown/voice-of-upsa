import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Voice of UPSA",
  description: "Privacy Policy for the Voice of UPSA digital platform.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
          
          <div className="mb-12 border-b border-gray-100 pb-8">
            <h1 className="text-3xl md:text-5xl font-black text-upsa-navy tracking-tight mb-4">
              Privacy Policy
            </h1>
            <p className="text-gray-500 font-medium">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>

          <div className="prose prose-lg prose-headings:text-upsa-navy prose-a:text-upsa-gold max-w-none text-gray-700">
            
            <p>
              At Voice of UPSA ("we," "us," or "our"), we respect your privacy and are committed to protecting the personal data of our students, faculty, and platform visitors. This Privacy Policy explains how we collect, use, and safeguard your information when you use our digital platform.
            </p>

            <h2>1. Information We Collect</h2>
            <p>
              We collect information that you provide directly to us, as well as data collected automatically through your use of the platform.
            </p>
            <ul>
              <li><strong>Account Information:</strong> When you register, we collect your name, email address, and authentication credentials via Supabase.</li>
              <li><strong>Profile Data:</strong> If you apply for a seller account in Campus Mart, we collect your business name, contact number, and related business details.</li>
              <li><strong>Device & Usage Data:</strong> We collect Push Notification tokens (via Firebase) if you explicitly opt-in to receive campus news alerts on your device.</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>
              We use the data we collect solely for the operation and improvement of the Voice of UPSA platform:
            </p>
            <ul>
              <li>To provide, maintain, and authenticate your account access.</li>
              <li>To send you push notifications for breaking news, provided you have granted permission.</li>
              <li>To process advertising requests and Campus Mart seller applications.</li>
            </ul>

            <h2>3. Cookies and Tracking</h2>
            <p>
              We use strictly necessary cookies to maintain your login sessions (via Supabase Auth). We do not currently use third-party tracking cookies for targeted advertising.
            </p>

            <h2>4. Data Sharing and Third Parties</h2>
            <p>
              We do not sell or rent your personal data to third parties. We share information only with trusted service providers necessary to operate our platform:
            </p>
            <ul>
              <li><strong>Supabase:</strong> For secure database hosting and user authentication.</li>
              <li><strong>Firebase (Google):</strong> For delivering push notifications to your devices.</li>
              <li><strong>Vercel:</strong> For secure application hosting and infrastructure.</li>
            </ul>

            <h2>5. Data Retention and Deletion</h2>
            <p>
              We retain your account information for as long as your account is active. You may request the deletion of your account and associated personal data at any time by contacting our support team.
            </p>

            <h2>6. Your Rights</h2>
            <p>
              Under applicable data protection laws, including Ghana's Data Protection Act (Act 843), you have the right to access, correct, or request the deletion of your personal data. To exercise these rights, please contact us using the information below.
            </p>

            <h2>7. Contact Us</h2>
            <p>
              If you have any questions or concerns about this Privacy Policy, please contact us at:
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
