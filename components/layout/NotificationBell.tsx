"use client";

import { useEffect, useState, useMemo } from "react";
import { Bell, Check, Info } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { markNotificationAsRead, markAllNotificationsAsRead } from "@/app/actions/notifications";
import Link from "next/link";
import { toast } from "react-hot-toast";

type Notification = {
  id: string;
  type: string;
  category: string;
  payload: any;
  read_at: string | null;
  created_at: string;
};

export function NotificationBell({ user }: { user: any }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    // Initial fetch
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && data) {
        setNotifications(data);
      }
    };

    fetchNotifications();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("public:notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => 
            prev.map(n => n.id === payload.new.id ? (payload.new as Notification) : n)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read_at).length;
  }, [notifications]);

  const displayCount = unreadCount > 9 ? "9+" : unreadCount;

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    
    await markNotificationAsRead(id);
  };

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
    
    await markAllNotificationsAsRead();
  };

  // Determines the destination URL and basic text from a notification type
  const getNotificationDetails = (notification: Notification) => {
    const defaultDetails = {
      title: "New Notification",
      link: "#",
      text: "You have a new update."
    };
    
    // Attempt to extract reasonable fallback text from payload
    const title = notification.payload?.title || defaultDetails.title;
    const message = notification.payload?.message || defaultDetails.text;
    const link = notification.payload?.link || defaultDetails.link;

    return { title, message, link };
  };

  if (!user) return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="text-white hover:bg-upsa-gold hover:text-upsa-navy relative px-3">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white shadow-sm ring-2 ring-upsa-navy">
              {displayCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden shadow-lg border-gray-100">
        <div className="bg-[#1B2A4A] px-4 py-3 flex items-center justify-between text-white">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllRead}
              className="text-xs text-white/80 hover:text-white flex items-center gap-1 transition-colors"
            >
              <Check className="h-3 w-3" />
              Mark all read
            </button>
          )}
        </div>
        
        <div className="max-h-[350px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center flex flex-col items-center">
              <div className="bg-gray-50 p-3 rounded-full mb-3">
                <Bell className="h-6 w-6 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-700">You're all caught up!</p>
              <p className="text-xs text-gray-500 mt-1">No new notifications right now.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification) => {
                const details = getNotificationDetails(notification);
                const isUnread = !notification.read_at;
                
                return (
                  <div key={notification.id} className="relative group">
                    <DropdownMenuItem 
                      asChild
                      className={`flex flex-col items-start p-4 cursor-pointer focus:bg-gray-50 rounded-none border-b border-gray-50 last:border-0 ${
                        isUnread ? "bg-teal-50/30" : ""
                      }`}
                    >
                      <Link 
                        href={details.link}
                        onClick={() => {
                          if (isUnread) markNotificationAsRead(notification.id);
                          setIsOpen(false);
                        }}
                        className="w-full"
                      >
                        <div className="flex w-full gap-3">
                          <div className="mt-0.5 flex-shrink-0">
                            {/* Fallback Icon */}
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                              isUnread ? "bg-[#1F7A6C]/10 text-[#1F7A6C]" : "bg-gray-100 text-gray-500"
                            }`}>
                              <Info className="h-4 w-4" />
                            </div>
                          </div>
                          
                          <div className="flex-1 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm line-clamp-1 ${isUnread ? 'font-semibold text-[#1B2A4A]' : 'font-medium text-gray-700'}`}>
                                {details.title}
                              </p>
                              {isUnread && (
                                <span className="h-2 w-2 rounded-full bg-[#1F7A6C] flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                            
                            <p className={`text-xs line-clamp-2 ${isUnread ? 'text-gray-700' : 'text-gray-500'}`}>
                              {details.message}
                            </p>
                            
                            <p className="text-[10px] text-gray-400 font-medium">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="p-2 border-t border-gray-100 bg-gray-50">
          <Link href="/dashboard/user/notifications">
            <Button variant="ghost" className="w-full text-xs h-8 text-gray-600 hover:text-[#1B2A4A]">
              Notification Preferences
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
