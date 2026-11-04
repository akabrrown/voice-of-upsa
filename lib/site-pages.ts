import {
  Briefcase,
  BookOpen,
  Users,
  Store,
  Map,
  Mic,
  Camera,
  EyeOff,
  BarChart3,
  Video,
  Bot,
  Megaphone,
  Info,
  PhoneCall,
  Globe,
  Layers,
  GraduationCap,
  Calendar,
  Newspaper,
  MessageSquare,
  Trophy,
  Vote,
  Star,
  type LucideIcon,
} from "lucide-react";

export type PageSection = "campus_life" | "community" | "main_nav" | "footer";

export interface SitePageConfig {
  id: string;
  title: string;
  href: string;
  section: PageSection;
  description?: string;
  icon_name?: string;
  is_active: boolean;
  show_in_nav: boolean;
  show_in_footer: boolean;
  maintenance_message?: string;
  sort_order: number;
}

export const ICON_MAP: Record<string, LucideIcon> = {
  Briefcase,
  BookOpen,
  Users,
  Store,
  Map,
  Mic,
  Camera,
  EyeOff,
  BarChart3,
  Video,
  Bot,
  Megaphone,
  Info,
  PhoneCall,
  Globe,
  Layers,
  GraduationCap,
  Calendar,
  Newspaper,
  MessageSquare,
  Trophy,
  Vote,
  Star,
};

export function getPageIcon(iconName?: string): LucideIcon {
  if (iconName && ICON_MAP[iconName]) {
    return ICON_MAP[iconName];
  }
  return Globe;
}

export const DEFAULT_SITE_PAGES: SitePageConfig[] = [
  // Campus Life
  {
    id: "services",
    title: "Student Services",
    href: "/services",
    section: "campus_life",
    description: "Access official campus services and directories.",
    icon_name: "Briefcase",
    is_active: true,
    show_in_nav: true,
    show_in_footer: true,
    maintenance_message: "Student Services directory is temporarily updating its records. Check back soon!",
    sort_order: 1,
  },
  {
    id: "handbook",
    title: "Student Handbook",
    href: "/handbook",
    section: "campus_life",
    description: "Official rules, regulations, and academic programs.",
    icon_name: "BookOpen",
    is_active: true,
    show_in_nav: true,
    show_in_footer: true,
    maintenance_message: "The student handbook is being updated with the latest academic curriculum.",
    sort_order: 2,
  },
  {
    id: "jobs",
    title: "Jobs Board",
    href: "/jobs",
    section: "campus_life",
    description: "Find internships, part-time jobs, and career opportunities.",
    icon_name: "Users",
    is_active: true,
    show_in_nav: true,
    show_in_footer: true,
    maintenance_message: "Our jobs portal is currently awaiting new verified campus postings.",
    sort_order: 3,
  },
  {
    id: "mart",
    title: "Campus Mart",
    href: "/mart",
    section: "campus_life",
    description: "Buy, sell, and trade within the campus community.",
    icon_name: "Store",
    is_active: false,
    show_in_nav: false,
    show_in_footer: false,
    maintenance_message: "Campus Mart is preparing for its official launch. Stay tuned!",
    sort_order: 4,
  },
  {
    id: "map",
    title: "Campus Map",
    href: "/map",
    section: "campus_life",
    description: "Navigate the university with an interactive map.",
    icon_name: "Map",
    is_active: false,
    show_in_nav: false,
    show_in_footer: false,
    maintenance_message: "Interactive campus map is currently under technical calibration.",
    sort_order: 5,
  },

  // Community Media
  {
    id: "podcasts",
    title: "Podcasts",
    href: "/podcasts",
    section: "community",
    description: "Listen to student voices and interviews.",
    icon_name: "Mic",
    is_active: true,
    show_in_nav: true,
    show_in_footer: true,
    maintenance_message: "New podcast series and episodes are currently in studio production!",
    sort_order: 6,
  },
  {
    id: "gallery",
    title: "Gallery",
    href: "/gallery",
    section: "community",
    description: "Explore campus photos and event memories.",
    icon_name: "Camera",
    is_active: true,
    show_in_nav: true,
    show_in_footer: true,
    maintenance_message: "The gallery is being curated with the latest campus event highlights.",
    sort_order: 7,
  },
  {
    id: "confessions",
    title: "Confessions",
    href: "/confessions",
    section: "community",
    description: "Share confessions and opinions safely.",
    icon_name: "EyeOff",
    is_active: true,
    show_in_nav: true,
    show_in_footer: true,
    maintenance_message: "The confessions portal is temporarily under moderation review.",
    sort_order: 8,
  },
  {
    id: "polls",
    title: "Polls",
    href: "/polls",
    section: "community",
    description: "Vote on pressing campus issues and debates.",
    icon_name: "BarChart3",
    is_active: true,
    show_in_nav: true,
    show_in_footer: true,
    maintenance_message: "New campus debates and voting questions are coming up soon!",
    sort_order: 9,
  },
  {
    id: "tv",
    title: "Video TV",
    href: "/tv",
    section: "community",
    description: "Watch campus news, shows, and event coverage.",
    icon_name: "Video",
    is_active: false,
    show_in_nav: false,
    show_in_footer: false,
    maintenance_message: "Voice of UPSA TV broadcasts are launching shortly.",
    sort_order: 10,
  },
  {
    id: "ai-assistant",
    title: "AI Assistant",
    href: "/ai-assistant",
    section: "community",
    description: "Your smart virtual campus guide.",
    icon_name: "Bot",
    is_active: false,
    show_in_nav: false,
    show_in_footer: false,
    maintenance_message: "The AI campus assistant is currently training on the student handbook.",
    sort_order: 11,
  },

  // Main Navigation Links
  {
    id: "advertise",
    title: "Advertise",
    href: "/advertise",
    section: "main_nav",
    description: "Advertising packages, rate cards, and ad submission.",
    icon_name: "Megaphone",
    is_active: true,
    show_in_nav: true,
    show_in_footer: true,
    maintenance_message: "Advertising bookings are temporarily closed for scheduled updates.",
    sort_order: 12,
  },
  {
    id: "about",
    title: "About",
    href: "/about",
    section: "main_nav",
    description: "About Voice of UPSA, editorial team, and our mission.",
    icon_name: "Info",
    is_active: true,
    show_in_nav: true,
    show_in_footer: true,
    maintenance_message: "Our about page is currently receiving editorial updates.",
    sort_order: 13,
  },
  {
    id: "contact",
    title: "Contact",
    href: "/contact",
    section: "main_nav",
    description: "Contact the editorial desk, news tips, and support.",
    icon_name: "PhoneCall",
    is_active: true,
    show_in_nav: true,
    show_in_footer: true,
    maintenance_message: "Contact forms are currently offline. Please email voice.of.upsa.mail@gmail.com directly.",
    sort_order: 14,
  },
];

/**
 * Merges raw rows from Supabase with the default code configuration.
 * Ensures the app has full fallback resilience even before migration or if rows are missing.
 */
export function mergeWithDefaults(dbPages?: Partial<SitePageConfig>[] | null): SitePageConfig[] {
  if (!dbPages || dbPages.length === 0) {
    return DEFAULT_SITE_PAGES;
  }

  const dbMap = new Map<string, Partial<SitePageConfig>>();
  dbPages.forEach((p) => {
    if (p.id) dbMap.set(p.id, p);
    if (p.href) dbMap.set(p.href, p);
  });

  const merged = DEFAULT_SITE_PAGES.map((def) => {
    const fromDb = dbMap.get(def.id) || dbMap.get(def.href);
    if (!fromDb) return def;
    return {
      ...def,
      ...fromDb,
      is_active: typeof fromDb.is_active === "boolean" ? fromDb.is_active : def.is_active,
      show_in_nav: typeof fromDb.show_in_nav === "boolean" ? fromDb.show_in_nav : def.show_in_nav,
      show_in_footer: typeof fromDb.show_in_footer === "boolean" ? fromDb.show_in_footer : def.show_in_footer,
      maintenance_message: fromDb.maintenance_message ?? def.maintenance_message,
      sort_order: fromDb.sort_order ?? def.sort_order,
    };
  });

  // Also include any extra custom pages created by admins directly in the DB
  dbPages.forEach((item) => {
    if (item.id && !DEFAULT_SITE_PAGES.some((d) => d.id === item.id)) {
      merged.push({
        id: item.id,
        title: item.title || "Custom Page",
        href: item.href || `/${item.id}`,
        section: (item.section as PageSection) || "main_nav",
        description: item.description,
        icon_name: item.icon_name || "Globe",
        is_active: item.is_active ?? true,
        show_in_nav: item.show_in_nav ?? true,
        show_in_footer: item.show_in_footer ?? true,
        maintenance_message: item.maintenance_message,
        sort_order: item.sort_order ?? 99,
      });
    }
  });

  return merged.sort((a, b) => a.sort_order - b.sort_order);
}

