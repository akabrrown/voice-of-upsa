"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Settings, Save, Globe, MessageSquare, ShieldAlert, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [siteName, setSiteName] = useState("Voice of UPSA");
  const [tagline, setTagline] = useState("The Professional Student's Perspective");
  const [contactEmail, setContactEmail] = useState("editor@voiceofupsa.com");
  const [requireCommentApproval, setRequireCommentApproval] = useState(true);
  const [allowAnonComments, setAllowAnonComments] = useState(false);
  const [enableRegistration, setEnableRegistration] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Load persisted settings from localStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem("vou_site_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.siteName) setSiteName(parsed.siteName);
        if (parsed.tagline) setTagline(parsed.tagline);
        if (parsed.contactEmail) setContactEmail(parsed.contactEmail);
        if (parsed.requireCommentApproval !== undefined) setRequireCommentApproval(parsed.requireCommentApproval);
        if (parsed.allowAnonComments !== undefined) setAllowAnonComments(parsed.allowAnonComments);
        if (parsed.enableRegistration !== undefined) setEnableRegistration(parsed.enableRegistration);
        if (parsed.maintenanceMode !== undefined) setMaintenanceMode(parsed.maintenanceMode);
      }
    } catch (e) {
      // Ignore fallback
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      localStorage.setItem("vou_site_settings", JSON.stringify({
        siteName,
        tagline,
        contactEmail,
        requireCommentApproval,
        allowAnonComments,
        enableRegistration,
        maintenanceMode,
        updatedAt: new Date().toISOString()
      }));
      setTimeout(() => {
        setIsSaving(false);
        toast.success("Site configuration saved successfully!");
      }, 600);
    } catch (e) {
      setIsSaving(false);
      toast.error("Failed to save settings locally.");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-upsa-navy dark:text-white tracking-tight">Site Settings</h1>
        <p className="text-gray-500 dark:text-slate-400">Configure global settings, identity, and moderation preferences</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
        {/* Site Identity */}
        <Card className="border-none shadow-md bg-white dark:bg-[#0C1729] dark:border dark:border-white/10">
          <CardHeader className="flex flex-row items-center space-x-4 pb-4 border-b border-gray-50 dark:border-white/10">
            <div className="p-2 bg-upsa-navy/5 dark:bg-upsa-gold/10 rounded-xl">
              <Globe className="h-5 w-5 text-upsa-navy dark:text-upsa-gold" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-upsa-navy dark:text-white">Site Identity</CardTitle>
              <CardDescription className="dark:text-slate-400">Global branding and communication details</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="site_name" className="text-gray-700 dark:text-slate-300">Site Name</Label>
                <Input 
                  id="site_name" 
                  value={siteName} 
                  onChange={(e) => setSiteName(e.target.value)} 
                  className="bg-white dark:bg-[#060D1A] border-gray-200 dark:border-white/10 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email" className="text-gray-700 dark:text-slate-300">Support / Contact Email</Label>
                <Input 
                  id="contact_email" 
                  type="email" 
                  value={contactEmail} 
                  onChange={(e) => setContactEmail(e.target.value)} 
                  className="bg-white dark:bg-[#060D1A] border-gray-200 dark:border-white/10 dark:text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline" className="text-gray-700 dark:text-slate-300">Site Tagline</Label>
              <Input 
                id="tagline" 
                value={tagline} 
                onChange={(e) => setTagline(e.target.value)} 
                className="bg-white dark:bg-[#060D1A] border-gray-200 dark:border-white/10 dark:text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Comments & Moderation */}
        <Card className="border-none shadow-md bg-white dark:bg-[#0C1729] dark:border dark:border-white/10">
          <CardHeader className="flex flex-row items-center space-x-4 pb-4 border-b border-gray-50 dark:border-white/10">
            <div className="p-2 bg-upsa-navy/5 dark:bg-upsa-gold/10 rounded-xl">
              <MessageSquare className="h-5 w-5 text-upsa-navy dark:text-upsa-gold" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-upsa-navy dark:text-white">Comments & Moderation</CardTitle>
              <CardDescription className="dark:text-slate-400">Configure reader interaction and comments filter</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-50 dark:border-white/10">
              <div className="space-y-0.5">
                <Label className="text-base font-bold text-upsa-navy dark:text-white">Require Approval</Label>
                <p className="text-xs text-gray-400 dark:text-slate-400">Comments must be checked by an admin before publication</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={requireCommentApproval} 
                  onChange={(e) => setRequireCommentApproval(e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-upsa-navy dark:peer-checked:bg-upsa-gold"></div>
              </label>
            </div>

            <div className="flex items-center justify-between pb-4 border-b border-gray-50 dark:border-white/10">
              <div className="space-y-0.5">
                <Label className="text-base font-bold text-upsa-navy dark:text-white">Allow Anonymous Comments</Label>
                <p className="text-xs text-gray-400 dark:text-slate-400">Non-registered users can post comments on public articles</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={allowAnonComments} 
                  onChange={(e) => setAllowAnonComments(e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-upsa-navy dark:peer-checked:bg-upsa-gold"></div>
              </label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="blocked_words" className="text-gray-700 dark:text-slate-300">Blocked Words / Keywords Filter</Label>
              <Textarea 
                id="blocked_words"
                placeholder="List words separated by commas to auto-flag or block..."
                rows={3}
                className="bg-white dark:bg-[#060D1A] border-gray-200 dark:border-white/10 dark:text-white resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Security & System */}
        <Card className="border-none shadow-md bg-white dark:bg-[#0C1729] dark:border dark:border-white/10">
          <CardHeader className="flex flex-row items-center space-x-4 pb-4 border-b border-gray-50 dark:border-white/10">
            <div className="p-2 bg-upsa-navy/5 dark:bg-upsa-gold/10 rounded-xl">
              <ShieldAlert className="h-5 w-5 text-upsa-navy dark:text-upsa-gold" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-upsa-navy dark:text-white">Security & Operations</CardTitle>
              <CardDescription className="dark:text-slate-400">Site access, sign-up rules, and operational mode</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-50 dark:border-white/10">
              <div className="space-y-0.5">
                <Label className="text-base font-bold text-upsa-navy dark:text-white">Allow New Registrations</Label>
                <p className="text-xs text-gray-400 dark:text-slate-400">Enables the registration page for new users and readers</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={enableRegistration} 
                  onChange={(e) => setEnableRegistration(e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-upsa-navy dark:peer-checked:bg-upsa-gold"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-bold text-upsa-navy dark:text-white">Maintenance Mode</Label>
                <p className="text-xs text-gray-400 dark:text-slate-400">Display a placeholder page to all public visitors during updates</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={maintenanceMode} 
                  onChange={(e) => setMaintenanceMode(e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-upsa-navy dark:peer-checked:bg-upsa-gold"></div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            disabled={isSaving}
            className="bg-upsa-navy text-white hover:bg-upsa-gold hover:text-upsa-navy dark:bg-upsa-gold dark:text-upsa-navy dark:hover:bg-upsa-gold/90 font-bold px-8 py-6 rounded-xl transition-all shadow-lg"
          >
            <Save className="mr-2 h-4.5 w-4.5" /> 
            {isSaving ? "Saving Settings..." : "Save Configuration"}
          </Button>
        </div>
      </form>
    </div>
  );
}
