import { Metadata } from "next";
import { PageStatusGate } from "@/components/shared/PageStatusGate";
import { Video, Play } from "lucide-react";

export const metadata: Metadata = {
  title: "Voice of UPSA TV | Live Campus Video Broadcasts",
  description: "Watch campus news, exclusive interviews, student shows, and live event coverage.",
};

export default function VideoTVPage() {
  return (
    <PageStatusGate pageKey="tv" fallbackTitle="Video TV">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3.5 bg-upsa-gold/20 rounded-2xl mb-4 text-upsa-navy dark:text-upsa-gold">
            <Video className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-black text-upsa-navy dark:text-white tracking-tight mb-4">
            Voice of UPSA TV
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Campus news broadcasts, documentaries, talk shows, and student life video series.
          </p>
        </div>

        <div className="aspect-video w-full max-w-4xl mx-auto bg-slate-900 rounded-3xl overflow-hidden shadow-2xl relative flex items-center justify-center border border-white/10 group">
          <div className="text-center p-8 text-white space-y-4">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto group-hover:scale-110 transition-transform cursor-pointer">
              <Play className="h-8 w-8 text-white fill-white ml-1" />
            </div>
            <h3 className="text-xl font-bold">Upcoming Broadcast Stream</h3>
            <p className="text-sm text-gray-300 max-w-md mx-auto">
              Live student debates and SRC election forum will be streamed here.
            </p>
          </div>
        </div>
      </div>
    </PageStatusGate>
  );
}
