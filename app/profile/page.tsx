"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { User as UserIcon, Settings, Bookmark, Bell, Shield, LogOut, Eye, EyeOff, Lock, ExternalLink, CheckCheck, ArrowLeft, Home, Trash2 } from "lucide-react";
import Image from "next/image";
import { User as SupabaseUser } from "@supabase/supabase-js";
import Link from "next/link";
import { ProfileShadowLoader } from "@/components/ui/shadow-loaders";

interface Profile {
  id: string;
  full_name: string;
  username: string;
  avatar_url?: string;
  role: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

type TabType = 'personal' | 'bookmarks' | 'notifications' | 'security';

export default function ProfilePage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('personal');
  
  // Security Tab State
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Data state
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as TabType;
      if (tabParam && ['personal', 'bookmarks', 'notifications', 'security'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }
      setUser(user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      setProfile(profileData);

      // Fetch Bookmarks
      const { data: bData } = await supabase
        .from("bookmarks")
        .select("created_at, articles(id, title, slug, excerpt, cover_image_url)")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false });
      
      if (bData) setBookmarks(bData);

      // Fetch Notifications
      const { data: nData } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (nData) setNotifications(nData);

      setIsLoading(false);
    };

    fetchData();
  }, [supabase, router]);

  const handleNotificationClick = async (notif: any) => {
    if (!notif.is_read) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
    }
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (!error) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        toast.success("All notifications marked as read");
      }
    } catch (err) {
      console.error("Error marking notifications as read:", err);
    }
  };

  const handleDeleteNotification = async (notifId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase.from("notifications").delete().eq("id", notifId);
      if (!error) {
        setNotifications((prev) => prev.filter((n) => n.id !== notifId));
        toast.success("Notification removed");
      } else {
        toast.error("Failed to delete notification");
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const handleClearReadNotifications = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id)
        .eq("is_read", true);

      if (!error) {
        setNotifications((prev) => prev.filter((n) => !n.is_read));
        toast.success("Read notifications cleared");
      } else {
        toast.error("Failed to clear read notifications");
      }
    } catch (err) {
      console.error("Error clearing read notifications:", err);
    }
  };

  const handleTestNotification = async () => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && typeof Notification !== "undefined") {
      if (Notification.permission === "granted") {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            registration.showNotification("Voice of UPSA", {
              body: "Your device is ready to receive push alerts! 🎉",
              icon: "/icon-192.png",
            });
            toast.success("Test alert sent to your device.");
          } else {
            toast.error("Service worker not active. Try reloading the page.");
          }
        } catch (e) {
          toast.error("Failed to trigger test alert.");
        }
      } else {
        toast.error("You need to enable notification permissions first using the bell icon.");
      }
    } else {
      toast.error("Your browser doesn't support notifications.");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;
    setIsSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        username: profile.username,
        bio: profile.bio,
        avatar_url: profile.avatar_url || null,
      })
      .eq("id", user.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Profile updated successfully!");
    }
    setIsSaving(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }
    setIsUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully!");
      setNewPassword("");
    }
    setIsUpdatingPassword(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50 py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <ProfileShadowLoader />
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-[#060D1A] py-12 transition-colors">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Navigation / Back Button */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-upsa-navy dark:hover:text-upsa-gold bg-white dark:bg-[#0C1729] hover:bg-gray-50 dark:hover:bg-white/10 px-4 py-2 rounded-xl border border-gray-200/90 dark:border-white/10 shadow-sm transition-all group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 text-gray-500 dark:text-gray-400 group-hover:text-upsa-navy dark:group-hover:text-upsa-gold" />
            <span>Back</span>
          </button>
          <Link
            href="/"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-gray-500 dark:text-gray-300 hover:text-upsa-navy dark:hover:text-upsa-gold transition-colors bg-white/80 dark:bg-[#0C1729] hover:bg-white dark:hover:bg-white/10 px-3 py-1.5 rounded-lg border border-gray-200/70 dark:border-white/10 shadow-sm"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Homepage</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-white dark:bg-[#0C1729] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 text-center transition-colors">
              <div className="relative w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-upsa-gold/20">
                {profile?.avatar_url ? (
                  <Image src={profile.avatar_url} alt={profile.full_name} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-upsa-navy flex items-center justify-center text-white text-3xl font-bold">
                    {profile?.full_name?.charAt(0)}
                  </div>
                )}
              </div>
              <h3 className="font-bold text-upsa-navy dark:text-white text-lg">{profile?.full_name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">@{profile?.username}</p>
              <div className="mt-4 pt-4 border-t border-gray-50 dark:border-white/10">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-upsa-gold/10 dark:bg-upsa-gold/20 text-upsa-navy dark:text-upsa-gold uppercase tracking-wider">
                  {profile?.role}
                </span>
              </div>
            </div>

            <nav className="bg-white dark:bg-[#0C1729] rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden flex flex-col transition-colors">
              <button 
                onClick={() => setActiveTab('personal')}
                className={`w-full flex items-center space-x-3 px-6 py-4 text-sm font-semibold transition-colors ${activeTab === 'personal' ? 'bg-upsa-navy dark:bg-upsa-gold text-white dark:text-upsa-navy font-bold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}
              >
                <UserIcon className="h-4 w-4" />
                <span>Personal Info</span>
              </button>
              <button 
                onClick={() => setActiveTab('bookmarks')}
                className={`w-full flex items-center justify-between px-6 py-4 text-sm font-semibold transition-colors ${activeTab === 'bookmarks' ? 'bg-upsa-navy dark:bg-upsa-gold text-white dark:text-upsa-navy font-bold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}
              >
                <div className="flex items-center space-x-3">
                  <Bookmark className="h-4 w-4" />
                  <span>My Bookmarks</span>
                </div>
                {bookmarks.length > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'bookmarks' ? 'bg-white text-upsa-navy' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-300'}`}>
                    {bookmarks.length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center justify-between px-6 py-4 text-sm font-semibold transition-colors ${activeTab === 'notifications' ? 'bg-upsa-navy dark:bg-upsa-gold text-white dark:text-upsa-navy font-bold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}
              >
                <div className="flex items-center space-x-3">
                  <Bell className="h-4 w-4" />
                  <span>Notifications</span>
                </div>
                {unreadCount > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'notifications' ? 'bg-red-500 text-white' : 'bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400'}`}>
                    {unreadCount}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center space-x-3 px-6 py-4 text-sm font-semibold transition-colors ${activeTab === 'security' ? 'bg-upsa-navy dark:bg-upsa-gold text-white dark:text-upsa-navy font-bold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}
              >
                <Shield className="h-4 w-4" />
                <span>Security</span>
              </button>
              <button 
                onClick={() => supabase.auth.signOut().then(() => router.push("/"))}
                className="w-full flex items-center space-x-3 px-6 py-4 text-sm font-semibold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3 space-y-6">
            
            {activeTab === 'personal' && (
              <>
                <div className="bg-white dark:bg-[#0C1729] p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 transition-colors">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-black text-upsa-navy dark:text-white">Personal Information</h2>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Update your profile details and campus identity</p>
                    </div>
                    <Settings className="h-6 w-6 text-gray-300 dark:text-gray-600" />
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="full_name" className="text-gray-900 dark:text-gray-200">Full Name</Label>
                        <Input 
                          id="full_name"
                          value={profile?.full_name || ""} 
                          onChange={(e) => setProfile(prev => prev ? {...prev, full_name: e.target.value} : null)}
                          placeholder="Your full name"
                          className="dark:bg-[#060D1A] dark:border-white/10 dark:text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-gray-900 dark:text-gray-200">Username</Label>
                        <Input 
                          id="username"
                          value={profile?.username || ""} 
                          onChange={(e) => setProfile(prev => prev ? {...prev, username: e.target.value} : null)}
                          placeholder="unique_username"
                          className="dark:bg-[#060D1A] dark:border-white/10 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="avatar_url" className="text-gray-900 dark:text-gray-200">Profile Picture / Avatar URL</Label>
                      <Input 
                        id="avatar_url"
                        value={profile?.avatar_url || ""} 
                        onChange={(e) => setProfile(prev => prev ? {...prev, avatar_url: e.target.value} : null)}
                        placeholder="https://images.unsplash.com/... or direct image link"
                        className="dark:bg-[#060D1A] dark:border-white/10 dark:text-white"
                      />
                      <p className="text-xs text-gray-400 dark:text-gray-500">Direct image URL to customize your campus profile picture.</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio" className="text-gray-900 dark:text-gray-200">Professional Bio</Label>
                      <Textarea 
                        id="bio"
                        rows={4}
                        value={profile?.bio || ""} 
                        onChange={(e) => setProfile(prev => prev ? {...prev, bio: e.target.value} : null)}
                        placeholder="Tell us a bit about yourself..."
                        className="resize-none dark:bg-[#060D1A] dark:border-white/10 dark:text-white"
                      />
                    </div>

                    <div className="pt-4 flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={isSaving}
                        className="bg-upsa-navy dark:bg-upsa-gold text-white dark:text-upsa-navy hover:bg-upsa-gold dark:hover:bg-white hover:text-upsa-navy font-bold px-8 py-6 rounded-xl transition-all shadow-lg shadow-upsa-navy/10"
                      >
                        {isSaving ? "Saving Changes..." : "Save Profile Settings"}
                      </Button>
                    </div>
                  </form>
                </div>
                
                {/* Account Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-[#0C1729] p-6 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm flex items-center space-x-4 transition-colors">
                    <div className="h-10 w-10 bg-blue-50 dark:bg-blue-950/40 rounded-lg flex items-center justify-center">
                      <Bookmark className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Saved</p>
                      <p className="text-xl font-black text-upsa-navy dark:text-white">{bookmarks.length}</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-[#0C1729] p-6 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm flex items-center space-x-4 transition-colors">
                    <div className="h-10 w-10 bg-amber-50 dark:bg-amber-950/40 rounded-lg flex items-center justify-center">
                      <Bell className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Alerts</p>
                      <p className="text-xl font-black text-upsa-navy dark:text-white">{unreadCount}</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-[#0C1729] p-6 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm flex items-center space-x-4 transition-colors">
                    <div className="h-10 w-10 bg-green-50 dark:bg-emerald-950/40 rounded-lg flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-green-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Member Since</p>
                      <p className="text-sm font-black text-upsa-navy dark:text-white">
                        {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'bookmarks' && (
              <div className="bg-white dark:bg-[#0C1729] p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 min-h-[400px] transition-colors">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-upsa-navy dark:text-white">My Bookmarks</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Articles you have saved for later</p>
                  </div>
                  <Bookmark className="h-6 w-6 text-gray-300 dark:text-gray-600" />
                </div>
                
                {bookmarks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-16 w-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                      <Bookmark className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">No saved articles yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm">When you find an interesting article, click the bookmark icon to save it here.</p>
                    <Link href="/">
                      <Button className="mt-6 bg-upsa-navy dark:bg-upsa-gold text-white dark:text-upsa-navy hover:bg-upsa-gold dark:hover:bg-white hover:text-upsa-navy font-bold transition-colors">
                        Browse Articles
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookmarks.map((b) => {
                      const article = b.articles;
                      if (!article) return null;
                      return (
                        <div key={article.id} className="flex items-center p-4 border border-gray-100 dark:border-white/10 bg-white dark:bg-[#060D1A] rounded-xl hover:border-upsa-gold/30 transition-colors group">
                          {article.cover_image_url && (
                            <div className="relative h-16 w-16 rounded-lg overflow-hidden flex-shrink-0 mr-4">
                              <Image src={article.cover_image_url} alt={article.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover" />
                            </div>
                          )}
                          <div className="flex-grow min-w-0">
                            <Link href={`/articles/${article.slug}`}>
                              <h4 className="font-bold text-upsa-navy dark:text-white truncate group-hover:text-upsa-gold transition-colors">{article.title}</h4>
                            </Link>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{article.excerpt}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-white dark:bg-[#0C1729] p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 min-h-[400px] transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-upsa-navy dark:text-white">Notifications</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Stay updated with system activity, ad submissions, and alerts</p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTestNotification}
                      className="border-upsa-gold text-xs font-bold text-upsa-navy dark:text-upsa-gold hover:bg-upsa-gold/10 gap-1.5 rounded-xl cursor-pointer"
                    >
                      <Bell className="h-4 w-4 text-upsa-gold" />
                      Test Alert
                    </Button>
                    {notifications.some(n => !n.is_read) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMarkAllAsRead}
                        className="border-gray-200 dark:border-white/10 text-xs font-bold text-upsa-navy dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/10 gap-1.5 rounded-xl cursor-pointer"
                      >
                        <CheckCheck className="h-4 w-4 text-upsa-gold" />
                        Mark all as read
                      </Button>
                    )}
                    {notifications.some(n => n.is_read) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearReadNotifications}
                        className="border-gray-200 dark:border-white/10 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 gap-1.5 rounded-xl cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Clear Read
                      </Button>
                    )}
                  </div>
                </div>
                
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-16 w-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                      <Bell className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">You're all caught up!</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">You don't have any notifications right now.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-4 rounded-xl border ${
                          notif.is_read ? 'border-gray-100 dark:border-white/10 bg-white dark:bg-[#060D1A]' : 'border-amber-200/80 dark:border-amber-500/30 bg-amber-50/20 dark:bg-amber-950/20 shadow-sm'
                        } flex items-start justify-between gap-4 transition-all hover:border-upsa-navy/30 dark:hover:border-upsa-gold/40 cursor-pointer group`}
                      >
                        <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                          <div className={`mt-1.5 h-2.5 w-2.5 rounded-full flex-shrink-0 ${notif.is_read ? 'bg-transparent' : 'bg-amber-500 ring-4 ring-amber-100 dark:ring-amber-900/40'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-upsa-navy dark:group-hover:text-upsa-gold transition-colors">{notif.title}</h4>
                              {!notif.is_read && (
                                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white px-2 py-0.2 rounded-full">
                                   New
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">{notif.message}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(notif.created_at).toLocaleString()}</p>
                              {notif.link && (
                                <span className="text-xs font-bold text-upsa-navy dark:text-upsa-gold group-hover:underline flex items-center gap-1 transition-colors">
                                  Review Action <ExternalLink className="h-3 w-3" />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteNotification(notif.id, e)}
                          className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors shrink-0"
                          title="Delete notification"
                          aria-label="Delete notification"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="bg-white dark:bg-[#0C1729] p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 min-h-[400px] transition-colors">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-upsa-navy dark:text-white">Security Settings</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your password and account security</p>
                  </div>
                  <Shield className="h-6 w-6 text-gray-300 dark:text-gray-600" />
                </div>
                
                <div className="max-w-md">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Change Password</h3>
                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new_password" className="text-gray-900 dark:text-gray-200">New Password</Label>
                      <div className="relative">
                        <Input
                          id="new_password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="dark:bg-[#060D1A] dark:border-white/10 dark:text-white"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-upsa-navy dark:hover:text-upsa-gold"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Must be at least 8 characters long.</p>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={isUpdatingPassword || !newPassword}
                      className="bg-upsa-navy dark:bg-upsa-gold text-white dark:text-upsa-navy hover:bg-upsa-gold dark:hover:bg-white hover:text-upsa-navy font-bold transition-all w-full sm:w-auto"
                    >
                      {isUpdatingPassword ? "Updating..." : (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Update Password
                        </>
                      )}
                    </Button>
                  </form>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
