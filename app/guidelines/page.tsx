import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Guidelines | Voice of UPSA",
  description: "Review Voice of UPSA community guidelines, code of conduct for article comments, student discussions, and anonymous campus submissions.",
  alternates: {
    canonical: "/guidelines",
  },
};

export default function CommunityGuidelinesPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-[#060D1A] py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white dark:bg-[#0C1729] rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 p-8 md:p-12">
          
          <div className="mb-12 border-b border-gray-100 dark:border-white/10 pb-8">
            <h1 className="text-3xl md:text-5xl font-black text-upsa-navy dark:text-white tracking-tight mb-4">
              Community Guidelines
            </h1>
            <p className="text-gray-500 dark:text-slate-400 font-medium">Fostering a respectful digital campus environment.</p>
          </div>

          <div className="prose prose-lg prose-headings:text-upsa-navy dark:prose-headings:text-white prose-a:text-upsa-gold max-w-none text-gray-700 dark:text-slate-300 dark:prose-invert">
            
            <p>
              The Voice of UPSA is a digital platform designed to amplify student voices, share campus news, and foster intellectual discussion. To maintain a safe, respectful, and constructive environment, all users must adhere to the following Community Guidelines when interacting, commenting, or submitting content.
            </p>

            <h2>1. Respect and Civility</h2>
            <p>
              We encourage open discussion and debate, but it must be done respectfully. We strictly prohibit:
            </p>
            <ul>
              <li><strong>Hate Speech:</strong> Any content that attacks or demeans individuals or groups based on race, ethnicity, religion, gender, sexual orientation, or disability.</li>
              <li><strong>Harassment and Bullying:</strong> Targeted abuse, threats, or sustained harassment against any student, lecturer, or staff member.</li>
              <li><strong>Defamation:</strong> Publishing false statements that harm the reputation of individuals or the University.</li>
            </ul>

            <h2>2. Academic and Journalistic Integrity</h2>
            <p>
              Authors and contributors must uphold the highest standards of integrity:
            </p>
            <ul>
              <li><strong>No Plagiarism:</strong> Do not copy content from other news sources, academic papers, or students without proper attribution.</li>
              <li><strong>Fact-Checking:</strong> Ensure that news reports and campus updates are factually accurate before submission.</li>
              <li><strong>Misinformation:</strong> Deliberately spreading false rumors about campus events, exams, or university administration policies is strictly forbidden.</li>
            </ul>

            <h2>3. Spam and Self-Promotion</h2>
            <p>
              Unless you are using the official Campus Mart or advertising features, do not use the comment sections or article submissions for unsolicited commercial advertising, spam, or repetitive self-promotion.
            </p>

            <h2>4. Enforcement and Penalties</h2>
            <p>
              The Voice of UPSA editorial and administrative team reserves the right to enforce these guidelines at our sole discretion. Violations may result in:
            </p>
            <ul>
              <li>Removal of the offending comment or article without notice.</li>
              <li>Temporary suspension of your account privileges.</li>
              <li>Permanent ban from the platform for severe or repeated violations.</li>
            </ul>

            <h2>5. Reporting Violations</h2>
            <p>
              If you encounter content that violates these guidelines, please report it immediately to the editorial team at <strong>voice.of.upsa.mail@gmail.com</strong>.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
