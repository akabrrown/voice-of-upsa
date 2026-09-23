"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { 
  CalendarHeart, Loader2, Save, Send, AlertTriangle, PlayCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ComputedHoliday, HolidayThemeAccent } from "@/lib/holidays/types";
import { HolidayGreetingModal } from "@/components/holidays/HolidayGreetingModal";

export default function AdminHolidaysPage() {
  const [holidays, setHolidays] = useState<ComputedHoliday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Selection & Edit State
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editingHoliday, setEditingHoliday] = useState<Partial<ComputedHoliday> & { isActive?: boolean; customDateOverride?: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [previewHoliday, setPreviewHoliday] = useState<ComputedHoliday | null>(null);
  const [broadcastPushNow, setBroadcastPushNow] = useState(false);

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/holidays");
      const data = await res.json();
      if (data.success) {
        setHolidays(data.computedHolidays);
        
        // Match existing selected holiday with updated data
        if (selectedKey) {
          const updated = data.computedHolidays.find((h: ComputedHoliday) => h.key === selectedKey);
          if (updated) handleSelectHoliday(updated, data.dbRecords);
        }
      } else {
        toast.error("Failed to load holidays: " + data.error);
      }
    } catch (err) {
      toast.error("An error occurred while fetching holidays.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHoliday = (holiday: ComputedHoliday, dbRecords?: any[]) => {
    setSelectedKey(holiday.key);
    
    // Find if it has a db override for isActive
    // Since computedHoliday doesn't have is_active, we should ideally fetch the db record or assume true if we just clicked edit
    let isActive = false;
    let customDateOverride = "";
    
    if (dbRecords) {
      const dbRecord = dbRecords.find((r: any) => r.holiday_key === holiday.key);
      if (dbRecord) {
        isActive = dbRecord.is_active;
        customDateOverride = dbRecord.custom_date_override || "";
      }
    }

    setEditingHoliday({
      ...holiday,
      isActive,
      customDateOverride
    });
    setBroadcastPushNow(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKey) return;

    setIsSaving(true);
    try {
      const payload = {
        holiday_key: selectedKey,
        title: editingHoliday.title,
        custom_date_override: editingHoliday.customDateOverride || null,
        headline: editingHoliday.headline,
        body_message: editingHoliday.bodyMessage,
        theme_accent: editingHoliday.themeAccent,
        academic_status: editingHoliday.academicStatus,
        is_active: editingHoliday.isActive,
        broadcast_push_now: broadcastPushNow,
      };

      const res = await fetch("/api/admin/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(broadcastPushNow ? "Holiday saved & push notification sent!" : "Holiday settings saved successfully!");
        fetchHolidays();
      } else {
        toast.error("Failed to save: " + data.error);
      }
    } catch (err) {
      toast.error("An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    if (!selectedKey) return;
    setPreviewHoliday(editingHoliday as ComputedHoliday);
  };

  if (isLoading && holidays.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-upsa-navy">Holiday & Events Manager</h1>
          <p className="text-sm text-gray-500 mt-1">Configure pop-ups, greetings, and push notifications for statutory public holidays.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: List of Holidays */}
        <div className="md:col-span-4 space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
          {holidays.map((holiday) => {
            const isSelected = selectedKey === holiday.key;
            return (
              <Card 
                key={holiday.key}
                className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'border-upsa-navy ring-1 ring-upsa-navy bg-upsa-navy/5' : 'hover:border-upsa-gold/50'}`}
                onClick={() => handleSelectHoliday(holiday)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-upsa-navy mb-1">{holiday.title}</h4>
                      <p className="text-xs text-gray-500 font-medium">Observed: {new Date(holiday.observedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    {holiday.isRollover && (
                      <span className="bg-amber-100 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Rollover</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Right Column: Editor */}
        <div className="md:col-span-8">
          {!selectedKey ? (
            <Card className="h-full flex flex-col items-center justify-center p-12 border-dashed bg-gray-50/50">
              <CalendarHeart className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-400 mb-2">Select a Holiday</h3>
              <p className="text-sm text-gray-400 text-center max-w-md">
                Choose a statutory holiday from the list to customize the greeting message, academic status, and activate the modal pop-up for visitors.
              </p>
            </Card>
          ) : (
            <Card className="shadow-lg border-upsa-gold/20">
              <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl text-upsa-navy">{editingHoliday.title}</CardTitle>
                    <CardDescription className="mt-1">
                      Customize the appearance and messaging for this holiday.
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handlePreview} className="text-upsa-navy font-bold">
                    <PlayCircle className="h-4 w-4 mr-2 text-upsa-gold" /> Preview Modal
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <form id="holiday-form" onSubmit={handleSave} className="space-y-6">
                  
                  {/* Status Toggle */}
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">Activate Pop-up Modal</h4>
                      <p className="text-xs text-gray-500 mt-1">When active, this greeting will display to all visitors on the site.</p>
                    </div>
                    <Switch 
                      checked={editingHoliday.isActive || false}
                      onCheckedChange={(val) => setEditingHoliday({...editingHoliday, isActive: val})}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Headline / Main Greeting</Label>
                      <Input 
                        value={editingHoliday.headline || ""}
                        onChange={(e) => setEditingHoliday({...editingHoliday, headline: e.target.value})}
                        placeholder="e.g. Merry Christmas from Voice of UPSA!"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Theme Accent</Label>
                      <Select 
                        value={editingHoliday.themeAccent}
                        onValueChange={(val: HolidayThemeAccent) => setEditingHoliday({...editingHoliday, themeAccent: val})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gold">Classic Gold</SelectItem>
                          <SelectItem value="ghana_flag">Ghana Flag (National)</SelectItem>
                          <SelectItem value="crescent">Crescent Moon (Islamic)</SelectItem>
                          <SelectItem value="festive">Festive (Christmas)</SelectItem>
                          <SelectItem value="laurel">Laurel (Achievement)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Greeting Body Message</Label>
                    <Textarea 
                      value={editingHoliday.bodyMessage || ""}
                      onChange={(e) => setEditingHoliday({...editingHoliday, bodyMessage: e.target.value})}
                      placeholder="Write your well wishes here..."
                      className="min-h-[100px]"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Official Campus Notice (Academic Status)</Label>
                    <Input 
                      value={editingHoliday.academicStatus || ""}
                      onChange={(e) => setEditingHoliday({...editingHoliday, academicStatus: e.target.value})}
                      placeholder="e.g. Statutory public holiday — Lectures suspended."
                      required
                    />
                  </div>

                  <div className="space-y-2 pt-4 border-t border-gray-100">
                    <Label className="flex items-center text-amber-600">
                      <AlertTriangle className="h-4 w-4 mr-1" /> Custom Date Override (Optional)
                    </Label>
                    <p className="text-xs text-gray-500 mb-2">Only use this if the government gazettes a different observation date. Format: YYYY-MM-DD</p>
                    <Input 
                      type="date"
                      value={editingHoliday.customDateOverride || ""}
                      onChange={(e) => setEditingHoliday({...editingHoliday, customDateOverride: e.target.value})}
                    />
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">Broadcast Web Push Notification immediately</h4>
                      <p className="text-xs text-gray-500 mt-1">Send a push notification to all subscribers right now when you save.</p>
                    </div>
                    <Switch 
                      checked={broadcastPushNow}
                      onCheckedChange={setBroadcastPushNow}
                      disabled={!editingHoliday.isActive}
                    />
                  </div>
                  
                  <div className="pt-6 flex justify-end border-t border-gray-100">
                    <Button 
                      type="submit" 
                      className="bg-upsa-navy hover:bg-upsa-navy/90"
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Save Configuration
                    </Button>
                  </div>

                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {previewHoliday && (
        <HolidayGreetingModal 
          forcePreviewHoliday={previewHoliday} 
          onClosePreview={() => setPreviewHoliday(null)} 
        />
      )}
    </div>
  );
}
