"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";
import { Settings, Save, Globe, MessageSquare, ShieldAlert } from "lucide-react";

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [siteName, setSiteName] = useState("Voice of UPSA");
  const [tagline, setTagline] = useState("The Professional Student's Perspective");
  const [contactEmail, setContactEmail] = useState("editor@voiceofupsa.com");
  const [requireCommentApproval, setRequireCommentApproval] = useState(true);
  const [allowAnonComments, setAllowAnonComments] = useState(false);
  const [enableRegistration, setEnableRegistration] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Site settings updated successfully!");
    }, 1500);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-upsa-navy tracking-tight">Site Settings</h1>
        <p className="text-gray-500">Configure global settings, identity, and moderation preferences</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
        {/* Site Identity */}
        <Card className="border-none shadow-md">
          <CardHeader className="flex flex-row items-center space-x-4 pb-4 border-b border-gray-50">
            <div className="p-2 bg-upsa-navy/5 rounded-xl">
              <Globe className="h-5 w-5 text-upsa-navy" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-upsa-navy">Site Identity</CardTitle>
              <CardDescription>Global branding and communication details</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="site_name">Site Name</Label>
                <Input 
                  id="site_name" 
                  value={siteName} 
                  onChange={(e) => setSiteName(e.target.value)} 
                  className="bg-white border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email">Support / Contact Email</Label>
                <Input 
                  id="contact_email" 
                  type="email" 
                  value={contactEmail} 
                  onChange={(e) => setContactEmail(e.target.value)} 
                  className="bg-white border-gray-200"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">Site Tagline</Label>
              <Input 
                id="tagline" 
                value={tagline} 
                onChange={(e) => setTagline(e.target.value)} 
                className="bg-white border-gray-200"
              />
            </div>
          </CardContent>
        </Card>

        {/* Comments & Moderation */}
        <Card className="border-none shadow-md">
          <CardHeader className="flex flex-row items-center space-x-4 pb-4 border-b border-gray-50">
            <div className="p-2 bg-upsa-navy/5 rounded-xl">
              <MessageSquare className="h-5 w-5 text-upsa-navy" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-upsa-navy">Comments & Moderation</CardTitle>
              <CardDescription>Configure reader interaction and comments filter</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-50">
              <div className="space-y-0.5">
                <Label className="text-base font-bold text-upsa-navy">Require Approval</Label>
                <p className="text-xs text-gray-400">Comments must be checked by an admin before publication</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={requireCommentApproval} 
                  onChange={(e) => setRequireCommentApproval(e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-upsa-navy"></div>
              </label>
            </div>

            <div className="flex items-center justify-between pb-4 border-b border-gray-50">
              <div className="space-y-0.5">
                <Label className="text-base font-bold text-upsa-navy">Allow Anonymous Comments</Label>
                <p className="text-xs text-gray-400">Non-registered users can post comments on public articles</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={allowAnonComments} 
                  onChange={(e) => setAllowAnonComments(e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-upsa-navy"></div>
              </label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="blocked_words">Blocked Words / Keywords Filter</Label>
              <Textarea 
                id="blocked_words"
                placeholder="List words separated by commas to auto-flag or block..."
                rows={3}
                className="bg-white border-gray-200 resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Security & System */}
        <Card className="border-none shadow-md">
          <CardHeader className="flex flex-row items-center space-x-4 pb-4 border-b border-gray-50">
            <div className="p-2 bg-upsa-navy/5 rounded-xl">
              <ShieldAlert className="h-5 w-5 text-upsa-navy" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-upsa-navy">Security & Operations</CardTitle>
              <CardDescription>Site access, sign-up rules, and operational mode</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-50">
              <div className="space-y-0.5">
                <Label className="text-base font-bold text-upsa-navy">Allow New Registrations</Label>
                <p className="text-xs text-gray-400">Enables the registration page for new users and readers</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={enableRegistration} 
                  onChange={(e) => setEnableRegistration(e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-upsa-navy"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-bold text-upsa-navy">Maintenance Mode</Label>
                <p className="text-xs text-gray-400">Display a placeholder page to all public visitors during updates</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={maintenanceMode} 
                  onChange={(e) => setMaintenanceMode(e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-upsa-navy"></div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            disabled={isSaving}
            className="bg-upsa-navy text-white hover:bg-upsa-gold hover:text-upsa-navy font-bold px-8 py-6 rounded-xl transition-all shadow-lg"
          >
            <Save className="mr-2 h-4.5 w-4.5" /> 
            {isSaving ? "Saving Settings..." : "Save Configuration"}
          </Button>
        </div>
      </form>
    </div>
  );
}
