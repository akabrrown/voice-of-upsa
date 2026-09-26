import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy | Voice of UPSA",
  description: "Cookie Policy for the Voice of UPSA digital platform.",
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
          
          <div className="mb-12 border-b border-gray-100 pb-8">
            <h1 className="text-3xl md:text-5xl font-black text-upsa-navy tracking-tight mb-4">
              Cookie Policy
            </h1>
            <p className="text-gray-500 font-medium">How we use cookies to improve your experience.</p>
          </div>

          <div className="prose prose-lg prose-headings:text-upsa-navy prose-a:text-upsa-gold max-w-none text-gray-700">
            
            <p>
              This Cookie Policy explains how Voice of UPSA uses cookies and similar technologies to recognize you when you visit our digital platform. It explains what these technologies are and why we use them, as well as your rights to control our use of them.
            </p>

            <h2>1. What are cookies?</h2>
            <p>
              Cookies are small data files that are placed on your computer or mobile device when you visit a website. They are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.
            </p>

            <h2>2. How do we use cookies?</h2>
            <p>
              Currently, Voice of UPSA uses <strong>only "Strictly Necessary" cookies</strong>. 
            </p>
            <ul>
              <li><strong>Authentication (Supabase):</strong> We use secure, HTTP-only cookies to remember your login session. Without these cookies, you would have to log in every time you navigate to a new page.</li>
              <li><strong>Security:</strong> We use cookies to prevent Cross-Site Request Forgery (CSRF) attacks and ensure that form submissions (like comments or article submissions) are secure.</li>
            </ul>

            <h2>3. Do we use tracking or advertising cookies?</h2>
            <p>
              <strong>No.</strong> We currently do not use third-party tracking cookies, analytics pixels (like Google Analytics or Meta Pixel), or targeted advertising cookies. We respect your privacy and do not track your browsing habits across other websites.
            </p>

            <h2>4. Managing Cookies</h2>
            <p>
              Because the cookies we use are strictly necessary for the technical operation of the website (such as logging in), you cannot opt-out of them while using authenticated features of the site. If you block all cookies in your browser settings, you will not be able to log in, submit articles, or use the Campus Mart.
            </p>
            <p>
              You can control or delete cookies at the browser level at any time. For more information on how to manage cookies, please visit the help pages of your respective web browser (Chrome, Safari, Firefox, Edge).
            </p>

            <h2>5. Updates to this Policy</h2>
            <p>
              If we ever decide to integrate third-party analytics or advertising cookies in the future, we will update this policy and provide a clear consent banner asking for your permission before any such cookies are placed on your device.
            </p>

            <h2>6. Contact Us</h2>
            <p>
              If you have any questions about our use of cookies or other technologies, please email us at <strong>voice.of.upsa.mail@gmail.com</strong>.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
