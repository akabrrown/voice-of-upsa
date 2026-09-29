const fs = require('fs');
const path = require('path');

const filePath = path.resolve('components/layout/Navbar.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Imports
content = content.replace(
  'PhoneCall, Bell, Store } from "lucide-react";',
  'PhoneCall, Bell, Store, Bot, EyeOff, Camera, Map, BarChart3, Video, BellRing, Mic, Briefcase, Users, Beaker } from "lucide-react";'
);

// 2. Add previewFeatures array
const categoriesArray = `const categories = [`;
const previewFeaturesStr = `const previewFeatures = [
  { title: "AI Assistant", href: "/ai-assistant", description: "Your virtual campus guide.", icon: Bot },
  { title: "Anonymous", href: "/anonymous", description: "Confessions and opinions.", icon: EyeOff },
  { title: "Gallery", href: "/gallery", description: "Campus photos and memories.", icon: Camera },
  { title: "Campus Map", href: "/map", description: "Navigate the university.", icon: Map },
  { title: "Campus Mart", href: "/mart", description: "Buy and sell on campus.", icon: Store },
  { title: "Polls", href: "/polls", description: "Vote on campus issues.", icon: BarChart3 },
  { title: "Video TV", href: "/tv", description: "Campus news and shows.", icon: Video },
  { title: "Podcasts", href: "/podcasts", description: "Listen to campus voices.", icon: Mic },
  { title: "Student Services", href: "/services", description: "Access campus services.", icon: Briefcase },
  { title: "Jobs Board", href: "/jobs", description: "Find internships and jobs.", icon: Users },
];\n\n`;
content = content.replace(categoriesArray, previewFeaturesStr + categoriesArray);

// 3. Add showPreview state
content = content.replace(
  'const [showCategories, setShowCategories] = React.useState(false);',
  'const [showCategories, setShowCategories] = React.useState(false);\n  const [showPreview, setShowPreview] = React.useState(false);'
);

// 4. Update showCategories click handler
content = content.replace(
  'onClick={() => setShowCategories(!showCategories)}',
  'onClick={() => {\n                    setShowCategories(!showCategories);\n                    if (showPreview) setShowPreview(false);\n                  }}'
);

// 5. Replace Campus Mart block with Upcoming block
const martBlock = `{process.env.NODE_ENV !== "production" && (
                <NavigationMenuItem>
                  <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), "bg-transparent text-white hover:bg-upsa-gold hover:text-upsa-navy transition-colors")}>
                    <Link href="/mart">
                      <div className="flex items-center gap-1.5">
                        <Store className="h-4 w-4" />
                        Campus Mart
                      </div>
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )}`;
const upcomingBlock = `{process.env.NODE_ENV !== "production" && (
                <NavigationMenuItem>
                  <button 
                    onClick={() => {
                      setShowPreview(!showPreview);
                      if (showCategories) setShowCategories(false);
                    }}
                    className={cn(navigationMenuTriggerStyle(), "bg-transparent text-white hover:bg-upsa-gold hover:text-upsa-navy transition-colors flex items-center gap-1.5 cursor-pointer", showPreview && "bg-upsa-gold text-upsa-navy")}
                  >
                    <Beaker className="h-4 w-4" />
                    Upcoming
                  </button>
                </NavigationMenuItem>
              )}`;
content = content.replace(martBlock, upcomingBlock);

// 6. Add preview secondary bar
const categoryBarEnd = `</div>
        </div>
      )}`;
const previewBar = `

      {/* Secondary Navigation for Preview Features */}
      {showPreview && process.env.NODE_ENV !== "production" && (
        <div className="hidden lg:block w-full bg-gray-50 border-t border-gray-200 border-b shadow-sm overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] animate-in slide-in-from-top-2 duration-200">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-start md:justify-center space-x-6 h-11 min-w-max md:min-w-0 mx-auto">
              {previewFeatures.map((c) => (
                <Link 
                  key={c.href} 
                  href={c.href} 
                  className="flex items-center gap-1.5 text-[11px] font-black text-slate-800 uppercase tracking-[0.1em] whitespace-nowrap hover:text-upsa-gold transition-colors py-2"
                >
                  <c.icon className="h-3.5 w-3.5" />
                  <span>{c.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}`;
content = content.replace(categoryBarEnd, categoryBarEnd + previewBar);

// 7. Update mobile menu
const mobileMartBlock = `{process.env.NODE_ENV !== "production" && (
              <Link 
                href="/mart" 
                className="flex items-center gap-2 text-white hover:text-upsa-gold py-2 font-bold transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Store className="h-5 w-5" />
                Campus Mart
              </Link>
            )}`;
const mobileUpcomingBlock = `{process.env.NODE_ENV !== "production" && (
              <div className="space-y-1 pt-2 border-t border-white/10">
                <div className="flex items-center gap-2 text-gray-400">
                  <Beaker className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Upcoming Features</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 pl-2">
                  {previewFeatures.map((feature) => (
                    <Link
                      key={feature.title}
                      href={feature.href}
                      className="text-gray-200 hover:text-upsa-gold text-sm py-1.5 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {feature.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}`;
content = content.replace(mobileMartBlock, mobileUpcomingBlock);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched Navbar.tsx');
