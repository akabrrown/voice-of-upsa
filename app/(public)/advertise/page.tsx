import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Check, Star, Zap, Rocket } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const defaultTiers = [
  {
    id: "basic",
    name: "Basic",
    price: 200,
    period: "per week",
    icon: Zap,
    description: "Perfect for student-led initiatives and campus clubs.",
    features: [
      "Sidebar Ad (300x250)",
      "Standard Placement",
      "Basic Analytics",
      "Up to 10,000 Impressions",
    ],
    buttonText: "Choose Basic",
    highlight: false,
  },
  {
    id: "standard",
    name: "Standard",
    price: 500,
    period: "per week",
    icon: Star,
    description: "Ideal for small businesses and service providers.",
    features: [
      "Leaderboard Ad (728x90)",
      "Premium Sidebar Placement",
      "In-feed Native Ad",
      "Detailed Analytics Report",
      "Up to 50,000 Impressions",
    ],
    buttonText: "Choose Standard",
    highlight: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: 1200,
    period: "per week",
    icon: Rocket,
    description: "Maximum exposure for corporate partners and brands.",
    features: [
      "All Standard Features",
      "Home Page Hero Banner",
      "Social Media Mention",
      "Article Sponsorship",
      "Unlimited Impressions",
      "Dedicated Account Manager",
    ],
    buttonText: "Choose Premium",
    highlight: false,
  },
];

export default async function AdvertisePage() {
  const supabase = await createClient();
  let dbTiers: any[] = [];
  
  try {
    const { data, error } = await supabase
      .from("pricing_tiers")
      .select("id, name, price, period, description, features, highlight, button_text, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (data && data.length > 0) {
      dbTiers = data;
    }
  } catch (err) {
    console.error("Error fetching pricing tiers:", err);
  }

  // Combine DB tiers with default fallbacks and icon associations
  const iconMap: Record<string, any> = {
    basic: Zap,
    standard: Star,
    premium: Rocket,
  };

  const tiers = dbTiers.length > 0
    ? dbTiers.map((tier) => {
        const defaultMatch = defaultTiers.find((d) => d.id === tier.id);
        const IconComponent = iconMap[tier.id] || (tier.highlight ? Star : Zap);
        
        let featureList = tier.features;
        if (typeof featureList === "string") {
          try {
            featureList = JSON.parse(featureList);
          } catch {
            featureList = featureList ? [featureList] : [];
          }
        }
        if (!Array.isArray(featureList) || featureList.length === 0) {
          featureList = defaultMatch?.features || ["Full Campus Reach", "Detailed Analytics"];
        }

        return {
          id: tier.id,
          name: tier.name || defaultMatch?.name || tier.id,
          price: `GH₵ ${Number(tier.price).toLocaleString()}`,
          period: tier.period || defaultMatch?.period || "per week",
          icon: IconComponent,
          description: tier.description || defaultMatch?.description || "Reach UPSA students and faculty.",
          features: featureList,
          buttonText: tier.button_text || defaultMatch?.buttonText || "Choose Plan",
          highlight: tier.highlight ?? defaultMatch?.highlight ?? false,
        };
      })
    : defaultTiers.map((tier) => ({
        ...tier,
        price: `GH₵ ${tier.price.toLocaleString()}`,
      }));

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white pb-20">
        <section className="py-20 bg-gray-50 border-b border-gray-100">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-black text-upsa-navy mb-6 tracking-tight">Advertise with Us</h1>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Reach thousands of students, faculty, and professionals within the UPSA community. Choose a package that fits your goals.
            </p>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {tiers.map((tier) => (
                <div 
                  key={tier.name}
                  className={`relative flex flex-col p-8 rounded-2xl border transition-all duration-200 ${
                    tier.highlight 
                      ? "bg-upsa-navy text-white border-upsa-gold/40 shadow-xl" 
                      : "bg-white text-upsa-navy border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className={`p-2.5 rounded-xl ${tier.highlight ? "bg-white/10" : "bg-upsa-navy/5"}`}>
                      <tier.icon className={`h-6 w-6 ${tier.highlight ? "text-upsa-gold" : "text-upsa-navy"}`} />
                    </div>
                    {tier.highlight && (
                      <span className="bg-upsa-gold text-upsa-navy font-extrabold text-[11px] uppercase tracking-wider px-3 py-1 rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>

                  <div className="mb-6">
                    <h2 className="text-xl font-bold">{tier.name}</h2>
                    <div className="mt-3 flex items-baseline">
                      <span className="text-3xl font-black">{tier.price}</span>
                      <span className={`ml-2 text-xs font-medium ${tier.highlight ? "text-gray-300" : "text-gray-500"}`}>{tier.period}</span>
                    </div>
                    <p className={`mt-3 text-xs leading-relaxed ${tier.highlight ? "text-gray-300" : "text-gray-600"}`}>
                      {tier.description}
                    </p>
                  </div>

                  <div className="border-t border-gray-100 dark:border-white/10 pt-6 mb-8 flex-1">
                    <span className={`text-[11px] font-bold uppercase tracking-wider block mb-4 ${tier.highlight ? "text-upsa-gold" : "text-gray-400"}`}>
                      Included Features
                    </span>
                    <ul className="space-y-3">
                      {tier.features.map((feature: string) => (
                        <li key={feature} className="flex items-start space-x-2.5 text-xs">
                          <div className={`mt-0.5 p-0.5 rounded-full ${tier.highlight ? "bg-upsa-gold text-upsa-navy" : "bg-upsa-navy text-white"}`}>
                            <Check className="h-3 w-3" />
                          </div>
                          <span className={tier.highlight ? "text-gray-200" : "text-gray-600"}>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button 
                    asChild 
                    className={`w-full py-5 text-sm font-bold rounded-xl cursor-pointer transition-colors ${
                      tier.highlight 
                        ? "bg-upsa-gold text-upsa-navy hover:bg-white" 
                        : "bg-upsa-navy text-white hover:bg-upsa-gold hover:text-upsa-navy"
                    }`}
                  >
                    <Link href={`/advertise/submit?tier=${tier.id}`}>{tier.buttonText}</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ad Specs */}
        <section className="py-16 bg-upsa-navy text-white rounded-2xl mx-4 lg:mx-auto lg:max-w-6xl overflow-hidden border border-white/10">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-2xl font-bold mb-8">Technical Specifications</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="p-5 bg-white/5 rounded-xl border border-white/10">
                <p className="text-[11px] uppercase tracking-wider text-upsa-gold font-bold mb-1.5">Leaderboard</p>
                <p className="text-xl font-black">728 x 90 px</p>
              </div>
              <div className="p-5 bg-white/5 rounded-xl border border-white/10">
                <p className="text-[11px] uppercase tracking-wider text-upsa-gold font-bold mb-1.5">Sidebar</p>
                <p className="text-xl font-black">300 x 250 px</p>
              </div>
              <div className="p-5 bg-white/5 rounded-xl border border-white/10">
                <p className="text-[11px] uppercase tracking-wider text-upsa-gold font-bold mb-1.5">In-feed</p>
                <p className="text-xl font-black">Native Card</p>
              </div>
              <div className="p-5 bg-white/5 rounded-xl border border-white/10">
                <p className="text-[11px] uppercase tracking-wider text-upsa-gold font-bold mb-1.5">Formats</p>
                <p className="text-xl font-black">JPG, PNG, GIF</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
