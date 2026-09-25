import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin } from "lucide-react";
import { SocialMediaButtons } from "@/components/shared/SocialMediaButtons";

export function Footer() {
  return (
    <footer className="bg-upsa-navy text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-3 group mb-4">
              <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-upsa-gold/20 transition-transform group-hover:scale-105 shadow-md">
                <Image
                  src="/logo.jpg"
                  alt="Voice of UPSA"
                  fill sizes="120px"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col justify-center text-left">
                <span className="text-xs font-black tracking-widest text-upsa-gold uppercase leading-none">Voice of</span>
                <span className="text-lg font-black tracking-tight text-white uppercase leading-tight">UPSA</span>
              </div>
            </Link>
            <p className="text-sm text-gray-300 leading-relaxed">
              The official digital news and communications hub for the University of Professional Studies, Accra. 
              Bridging the gap between the campus community and the world.
            </p>
            <div className="pt-2">
              <SocialMediaButtons />
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-upsa-gold uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/categories/all" className="text-sm text-gray-300 hover:text-white transition-colors">All Articles</Link></li>
              <li><Link href="/advertise" className="text-sm text-gray-300 hover:text-white transition-colors">Advertise with Us</Link></li>
              <li><Link href="/about" className="text-sm text-gray-300 hover:text-white transition-colors">About Voice of UPSA</Link></li>
              <li><Link href="/contact" className="text-sm text-gray-300 hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="/auth/login" className="text-sm text-gray-300 hover:text-white transition-colors">Login / Register</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-upsa-gold uppercase tracking-wider">Categories</h3>
            <ul className="space-y-2">
              <li><Link href="/categories/academics" className="text-sm text-gray-300 hover:text-white transition-colors">Academics</Link></li>
              <li><Link href="/categories/events" className="text-sm text-gray-300 hover:text-white transition-colors">Events</Link></li>
              <li><Link href="/categories/news" className="text-sm text-gray-300 hover:text-white transition-colors">Campus News</Link></li>
              <li><Link href="/categories/opinions" className="text-sm text-gray-300 hover:text-white transition-colors">Opinions</Link></li>
              <li><Link href="/categories/sports" className="text-sm text-gray-300 hover:text-white transition-colors">Sports</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-upsa-gold uppercase tracking-wider">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3 text-sm text-gray-300">
                <MapPin className="h-5 w-5 text-upsa-gold shrink-0" />
                <span>University of Professional Studies, Accra (UPSA), Legon, Accra - Ghana</span>
              </li>
              <li className="flex items-center space-x-3 text-sm text-gray-300">
                <Phone className="h-5 w-5 text-upsa-gold shrink-0" />
                <span>+233 (0) 302 500 722</span>
              </li>
              <li className="flex items-center space-x-3 text-sm text-gray-300">
                <Mail className="h-5 w-5 text-upsa-gold shrink-0" />
                <span>voice@upsamail.edu.gh</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Voice of UPSA. All Rights Reserved. Prepared by Codey Dev.
          </p>
          <div className="flex items-center space-x-4 text-xs text-gray-400">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span>|</span>
            <Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
