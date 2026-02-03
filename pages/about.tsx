import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { FiTarget, FiUsers, FiBook, FiAward, FiHeart, FiMail, FiTwitter, FiLinkedin } from 'react-icons/fi';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { FiFileText } from 'react-icons/fi';

const PdfViewer = dynamic(() => import('@/components/PdfViewer'), {
  ssr: false,
  loading: () => <div className="h-96 w-full flex items-center justify-center bg-gray-50 rounded-xl"><p className="text-gray-500">Loading PDF Viewer...</p></div>
});

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  image_url: string | null;
}

const AboutPage: React.FC = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await fetch('/api/team');
        const data = await response.json();
        if (data.success) {
          setTeam(data.data);
        }
      } catch (error) {
        console.error('Error fetching team:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <Layout title="About Us - Voice of UPSA" description="Learn more about Voice of UPSA, our mission, values, and the team behind the news.">
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-navy py-20 text-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold mb-6"
            >
              Empowering the UPSA Community
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-300 max-w-3xl mx-auto"
            >
              The leading student-led media organization dedicated to excellence in journalism and community service.
            </motion.p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl font-bold text-navy mb-4"
              >
                Our Mission & Values
              </motion.h2>
              <div className="w-20 h-1 bg-golden mx-auto mb-6"></div>
              <p className="text-gray-600 max-w-3xl mx-auto text-lg">
                Voice of UPSA is dedicated to providing accurate, timely, and relevant news to the University of Professional Studies community. We strive to be the trusted source of information that connects students, faculty, and staff.
              </p>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Mission Content */}
              <motion.div variants={itemVariants} className="lg:col-span-2">
                <div className="bg-gray-50 rounded-2xl p-8 h-full">
                  <h3 className="text-2xl font-bold text-navy mb-6 flex items-center">
                    <div className="w-12 h-12 bg-golden/10 rounded-full flex items-center justify-center mr-4">
                      <FiTarget className="text-golden text-xl" />
                    </div>
                    Our Mission
                  </h3>
                  <div className="space-y-4 text-gray-600">
                    <p>
                      Through comprehensive coverage of campus events, academic achievements, and community stories, we aim to foster a sense of unity and pride within the UPSA ecosystem.
                    </p>
                  </div>
                  <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl p-4 text-center">
                      <div className="w-12 h-12 bg-golden/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FiTarget className="text-golden text-xl" />
                      </div>
                      <span className="block font-bold text-navy">Excellence</span>
                    </div>
                    <div className="bg-white rounded-xl p-4 text-center">
                      <div className="w-12 h-12 bg-golden/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FiAward className="text-golden text-xl" />
                      </div>
                      <span className="block font-bold text-navy">Integrity</span>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Values */}
              <motion.div variants={itemVariants}>
                <div className="bg-navy rounded-2xl p-8 text-white shadow-xl h-full">
                  <h3 className="text-2xl font-bold mb-8 flex items-center">
                    <span className="w-8 h-1 bg-golden mr-4"></span>
                    Our Values
                  </h3>
                  <div className="space-y-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <div className="flex items-start">
                        <FiHeart className="mt-1 mr-3 text-golden flex-shrink-0 text-xl" />
                        <div>
                          <span className="block font-bold mb-1">Truth & Integrity</span>
                          <span className="text-gray-300 text-sm">Honesty is at the heart of everything we do.</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <div className="flex items-start">
                        <FiUsers className="mt-1 mr-3 text-golden flex-shrink-0 text-xl" />
                        <div>
                          <span className="block font-bold mb-1">Community First</span>
                          <span className="text-gray-300 text-sm">We tell stories that matter to our community.</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <div className="flex items-start">
                        <FiBook className="mt-1 mr-3 text-golden flex-shrink-0 text-xl" />
                        <div>
                          <span className="block font-bold mb-1">Empowerment</span>
                          <span className="text-gray-300 text-sm">Providing a platform for every voice to be heard.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Reports Section */}
        <section className="py-20 bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
             <div className="text-center mb-12">
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 className="inline-block"
               >
                 <div className="bg-golden/10 rounded-full px-6 py-2 text-golden text-sm font-bold mb-4">
                   TRANSPARENCY
                 </div>
               </motion.div>
               <motion.h2 
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 className="text-3xl md:text-4xl font-bold text-navy mb-4"
               >
                 Documents & Reports
               </motion.h2>
               <div className="w-20 h-1 bg-golden mx-auto mb-6"></div>
               <p className="text-gray-600 max-w-2xl mx-auto">
                 Access our annual reports and official documents to stay informed about our progress and activities.
               </p>
             </div>

             <motion.div
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               className="bg-gray-50 rounded-2xl p-6 md:p-10 shadow-sm border border-gray-100"
             >
               <div className="flex flex-col items-center mb-8">
                  <div className="w-16 h-16 bg-navy/5 rounded-full flex items-center justify-center mb-4">
                     <FiFileText className="text-3xl text-navy" />
                  </div>
                  <h3 className="text-2xl font-bold text-navy mb-2">2025 Annual Report</h3>
                  <p className="text-gray-500 text-center max-w-xl">
                    A comprehensive overview of our achievements, financial statements, and community impact for the year 2025.
                  </p>
               </div>

               <div className="w-full">
                  <PdfViewer url="/Voice_Of_UPSA_2025_Annual_Report.pdf" />
               </div>
             </motion.div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-24 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-block"
              >
                <div className="bg-navy rounded-full px-6 py-2 text-golden text-sm font-bold mb-4">
                  MEET THE TEAM
                </div>
              </motion.div>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-5xl font-bold text-navy mb-6"
              >
                The People Behind
                <span className="text-golden"> Voice of UPSA</span>
              </motion.h2>
              <div className="w-24 h-1 bg-golden mx-auto mb-8"></div>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-gray-600 max-w-3xl mx-auto text-xl leading-relaxed"
              >
                Meet the talented and dedicated individuals working behind the scenes to bring you the best campus news experience.
              </motion.p>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-golden/20 border-t-golden"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FiUsers className="w-6 h-6 text-golden" />
                  </div>
                </div>
              </div>
            ) : (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
              >
                {team.map((member, index) => (
                  <motion.div
                    key={member.id}
                    variants={itemVariants}
                    className="group"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="bg-white rounded-3xl shadow-lg overflow-hidden transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl border border-gray-100">
                      <div className="aspect-[4/5] relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                        {member.image_url ? (
                          <Image
                            src={member.image_url}
                            alt={member.name}
                            fill
                            unoptimized
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-20 h-20 bg-navy/10 rounded-full flex items-center justify-center">
                              <FiUsers className="w-10 h-10 text-navy/30" />
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end justify-center p-6">
                          <div className="flex space-x-3 mb-2">
                            <a href="#" className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-golden hover:text-navy transition-all transform hover:scale-110">
                              <FiTwitter className="text-sm" />
                            </a>
                            <a href="#" className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-golden hover:text-navy transition-all transform hover:scale-110">
                              <FiLinkedin className="text-sm" />
                            </a>
                            <a href="#" className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-golden hover:text-navy transition-all transform hover:scale-110">
                              <FiMail className="text-sm" />
                            </a>
                          </div>
                        </div>
                      </div>
                      <div className="p-8 text-center">
                        <h3 className="text-xl font-bold text-navy mb-2 group-hover:text-golden transition-colors">{member.name}</h3>
                        <p className="text-golden font-semibold text-sm mb-4 uppercase tracking-wide">{member.role}</p>
                        {member.bio && (
                          <p className="text-gray-500 text-sm line-clamp-3 italic leading-relaxed">
                            &quot;{member.bio}&quot;
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
            
            {!loading && team.length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-dashed border-gray-200 max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiUsers className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-3">Team Coming Soon</h3>
                <p className="text-gray-500 italic">Our talented team members will be appearing here soon.</p>
              </div>
            )}
          </div>
        </section>

              </div>
    </Layout>
  );
};

export default AboutPage;
