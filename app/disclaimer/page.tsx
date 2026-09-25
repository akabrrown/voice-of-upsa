import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Editorial Disclaimer | Voice of UPSA",
  description: "Editorial disclaimer regarding opinions and content on Voice of UPSA.",
};

export default function EditorialDisclaimerPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
          
          <div className="mb-12 border-b border-gray-100 pb-8">
            <h1 className="text-3xl md:text-5xl font-black text-upsa-navy tracking-tight mb-4">
              Editorial Disclaimer
            </h1>
            <p className="text-gray-500 font-medium">Clarification of liability and representation.</p>
          </div>

          <div className="prose prose-lg prose-headings:text-upsa-navy prose-a:text-upsa-gold max-w-none text-gray-700">
            
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8 rounded-r-md">
              <p className="text-sm text-blue-800 m-0 font-medium">
                The Voice of UPSA is an independent, student-driven digital media platform.
              </p>
            </div>

            <h2>1. Independence and Representation</h2>
            <p>
              The <strong>Voice of UPSA</strong> is an independent platform built by and for the student community. While we focus exclusively on news, events, and academics relating to the University of Professional Studies, Accra (UPSA), we are <strong>not</strong> an official administrative mouthpiece of the University.
            </p>

            <h2>2. Opinions and Perspectives</h2>
            <p>
              All articles, editorials, opinion pieces, and comments published on this platform reflect the personal views and perspectives of the individual authors. They do not necessarily reflect the official policies, positions, or views of:
            </p>
            <ul>
              <li>The University of Professional Studies, Accra (UPSA)</li>
              <li>The UPSA Management and Administration</li>
              <li>The Voice of UPSA Editorial Board</li>
            </ul>

            <h2>3. Accuracy of Information</h2>
            <p>
              While our editorial team strives for accuracy, timeliness, and journalistic integrity, the information provided on this platform is for general informational purposes only. We make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, or suitability of the information, products, or services contained on the website.
            </p>
            <p>
              Official university dates, exam schedules, and academic policies should always be verified through official UPSA administrative channels.
            </p>

            <h2>4. Third-Party Links</h2>
            <p>
              Our articles may contain links to external websites. We have no control over the nature, content, and availability of those sites. The inclusion of any links does not necessarily imply a recommendation or endorse the views expressed within them.
            </p>

            <h2>5. Contact the Editorial Team</h2>
            <p>
              If you have concerns about the accuracy of a published article, or wish to submit a formal retraction request or right of reply, please contact the Editor-in-Chief at <strong>voice@upsamail.edu.gh</strong>.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
