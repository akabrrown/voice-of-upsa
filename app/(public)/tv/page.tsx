import { Metadata } from "next";
import Link from "next/link";
import { Video, Play, Tv, Sparkles, Mic, Camera, ArrowRight, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Video TV | Voice of UPSA",
  description: "Watch campus news, shows, interviews, and live event coverage on Voice of UPSA TV.",
};

const upcomingShows = [
  {
    title: "Campus Pulse",
    category: "Weekly News",
    description: "The definitive weekly news recap covering breaking stories, university policies, and student affairs.",
    host: "VOU Newsroom",
    time: "Fridays • 6:00 PM GMT",
  },
  {
    title: "The Hotseat",
    category: "Interviews",
    description: "In-depth, unfiltered conversations with campus leaders, student politicians, and notable alumni.",
    host: "Editorial Team",
    time: "Bi-Weekly • Wednesdays",
  },
  {
    title: "SRC Live & Uncut",
    category: "Governance",
    description: "Live broadcasts and analysis of Student Representative Council proceedings and general assemblies.",
    host: "Politics Desk",
    time: "During SRC Sessions",
  },
  {
    title: "Varsity Sports Arena",
    category: "Athletics",
    description: "High-octane coverage of UPSA inter-faculty tournaments, football leagues, and sports celebrations.",
    host: "Sports Crew",
    time: "Matchdays",
  },
];

export default function VideoTVPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 pb-20">
      {/* Hero Section */}
      <section className="bg-upsa-navy text-white relative overflow-hidden py-16 lg:py-24">
        {/* Ambient glow backgrounds */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-upsa-gold/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="max-w-2xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-upsa-gold/20 border border-upsa-gold/30 text-upsa-gold text-xs font-bold uppercase tracking-wider mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Broadcasting Soon</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-6">
                Voice of UPSA <span className="text-upsa-gold">TV</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-300 leading-relaxed mb-8">
                Your campus screen. High-definition video broadcasts, investigative student documentaries, exclusive talk shows, and live event coverage from across the university.
              </p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <Button asChild size="lg" className="bg-upsa-gold text-upsa-navy hover:bg-upsa-gold/90 font-bold px-6">
                  <Link href="/podcasts">
                    <Mic className="w-4 h-4 mr-2" /> Listen to Podcasts Instead
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10 font-medium">
                  <Link href="/gallery">
                    <Camera className="w-4 h-4 mr-2" /> View Campus Gallery
                  </Link>
                </Button>
              </div>
            </div>

            {/* Video Player Preview Mockup */}
            <div className="w-full max-w-lg">
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 border-2 border-white/10 shadow-2xl group">
                <div className="aspect-video relative flex items-center justify-center bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-800">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-upsa-gold/10 via-transparent to-transparent opacity-50" />
                  
                  {/* Decorative Video Elements */}
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <Badge variant="destructive" className="bg-red-600 text-white animate-pulse">
                      TEST FEED
                    </Badge>
                    <span className="text-xs text-gray-400 font-mono">1080p60</span>
                  </div>

                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-upsa-gold/90 flex items-center justify-center text-upsa-navy shadow-lg transform group-hover:scale-110 transition-transform">
                      <Play className="w-7 h-7 ml-1 fill-current" />
                    </div>
                    <span className="text-xs font-semibold text-gray-300 uppercase tracking-widest">
                      Studio Stream Preview
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-gray-400 border-t border-white/10 pt-3">
                    <div className="flex items-center gap-2">
                      <Tv className="w-4 h-4 text-upsa-gold" />
                      <span>VOU Production Studio</span>
                    </div>
                    <span>Channel 1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Programming */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge variant="outline" className="mb-3 text-upsa-navy border-upsa-navy/20 font-bold uppercase tracking-wider">
            Programming Lineup
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-upsa-navy tracking-tight mb-4">
            Shows in Production
          </h2>
          <p className="text-gray-600 text-base sm:text-lg">
            Our student media team is currently producing inaugural seasons for these original broadcast series.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {upcomingShows.map((show) => (
            <div
              key={show.title}
              className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-upsa-navy/70 bg-upsa-navy/5 px-2.5 py-1 rounded-md">
                    {show.category}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-upsa-navy mt-3 group-hover:text-blue-900 transition-colors">
                    {show.title}
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-upsa-gold/20 group-hover:text-upsa-navy transition-colors shrink-0">
                  <Video className="w-5 h-5" />
                </div>
              </div>

              <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6">
                {show.description}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100 font-medium">
                <span>By {show.host}</span>
                <span className="text-upsa-navy font-semibold">{show.time}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="mt-16 bg-gradient-to-r from-upsa-navy to-slate-900 rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="max-w-xl text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
              Have a show idea or want to join the video crew?
            </h3>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              We welcome creative students interested in presenting, videography, audio engineering, and video editing.
            </p>
          </div>
          <Button asChild size="lg" className="bg-upsa-gold text-upsa-navy hover:bg-upsa-gold/90 font-bold shrink-0">
            <Link href="/contact">
              Get in Touch <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
