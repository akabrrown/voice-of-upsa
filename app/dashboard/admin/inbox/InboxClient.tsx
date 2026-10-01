"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, MailOpen, Mail, Archive, Reply, Loader2 } from "lucide-react";
import { updateMessageStatus } from "./actions";
import { toast } from "react-hot-toast";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "unread" | "read" | "replied" | "archived";
  admin_notes: string | null;
  created_at: string;
}

export default function InboxClient({ initialMessages }: { initialMessages: ContactMessage[] }) {
  const [messages, setMessages] = useState<ContactMessage[]>(initialMessages);
  const [filter, setFilter] = useState<"all" | "unread" | "read" | "replied" | "archived">("unread");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredMessages = messages.filter(msg => filter === "all" || msg.status === filter);

  const handleStatusChange = async (msgId: string, newStatus: any) => {
    setLoadingId(msgId);
    try {
      const result = await updateMessageStatus(msgId, newStatus);
      if (result.error) throw new Error(result.error);
      
      setMessages(messages.map(msg => msg.id === msgId ? { ...msg, status: newStatus } : msg));
      toast.success(`Message marked as ${newStatus}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    } finally {
      setLoadingId(null);
    }
  };

  const handleToggleExpand = (msgId: string, currentStatus: string) => {
    if (expandedId === msgId) {
      setExpandedId(null);
    } else {
      setExpandedId(msgId);
      if (currentStatus === "unread") {
        handleStatusChange(msgId, "read");
      }
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "unread": return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-0 shadow-none"><Mail className="w-3 h-3 mr-1"/> Unread</Badge>;
      case "read": return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-0 shadow-none"><MailOpen className="w-3 h-3 mr-1"/> Read</Badge>;
      case "replied": return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0 shadow-none"><Reply className="w-3 h-3 mr-1"/> Replied</Badge>;
      case "archived": return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 border-0 shadow-none"><Archive className="w-3 h-3 mr-1"/> Archived</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {["unread", "read", "replied", "archived", "all"].map((tab) => (
          <Button
            key={tab}
            variant={filter === tab ? "default" : "outline"}
            onClick={() => setFilter(tab as any)}
            className={`capitalize ${filter === tab ? "bg-upsa-navy text-white hover:bg-upsa-navy/90" : "text-gray-600"}`}
          >
            {tab}
            <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
              {tab === "all" ? messages.length : messages.filter(m => m.status === tab).length}
            </span>
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredMessages.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200 shadow-sm">
            <MailOpen className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No messages found for this filter.</p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isExpanded = expandedId === msg.id;
            
            return (
              <Card key={msg.id} className={`overflow-hidden transition-all duration-200 ${msg.status === 'unread' ? 'border-l-4 border-l-upsa-gold bg-white' : 'bg-gray-50/50'}`}>
                <CardContent className="p-0">
                  <div 
                    className={`p-5 cursor-pointer hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
                    onClick={() => handleToggleExpand(msg.id, msg.status)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className={`text-base truncate ${msg.status === 'unread' ? 'font-black text-upsa-navy' : 'font-bold text-gray-800'}`}>
                          {msg.name}
                        </h3>
                        <span className="text-xs text-gray-500 flex items-center shrink-0">
                          <Clock className="w-3 h-3 mr-1" />
                          {format(new Date(msg.created_at), "MMM d, h:mm a")}
                        </span>
                      </div>
                      <p className={`text-sm truncate ${msg.status === 'unread' ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                        {msg.subject}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                      <StatusBadge status={msg.status} />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-5 border-t border-gray-100 bg-white">
                      <div className="mb-4 text-sm text-gray-500">
                        <span className="font-bold text-gray-700">From:</span> {msg.email}
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-800 whitespace-pre-wrap leading-relaxed border border-gray-100">
                        {msg.message}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-gray-50">
                        <Button 
                          asChild
                          className="bg-upsa-navy text-white hover:bg-upsa-navy/90"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (msg.status !== "replied") handleStatusChange(msg.id, "replied");
                          }}
                        >
                          <a href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}>
                            <Reply className="w-4 h-4 mr-2" />
                            Reply via Email
                          </a>
                        </Button>
                        
                        {msg.status !== "archived" && (
                          <Button 
                            onClick={(e) => { e.stopPropagation(); handleStatusChange(msg.id, "archived"); }}
                            disabled={loadingId === msg.id}
                            variant="outline"
                          >
                            {loadingId === msg.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Archive className="w-4 h-4 mr-2" />}
                            Archive
                          </Button>
                        )}
                        
                        {msg.status === "archived" && (
                          <Button 
                            onClick={(e) => { e.stopPropagation(); handleStatusChange(msg.id, "read"); }}
                            disabled={loadingId === msg.id}
                            variant="outline"
                          >
                            {loadingId === msg.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MailOpen className="w-4 h-4 mr-2" />}
                            Unarchive
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
