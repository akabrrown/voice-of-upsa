"use client";

import { useState, useEffect } from "react";
import { 
  CalendarHeart, 
  Church, 
  Moon, 
  Award, 
  Send, 
  Eye, 
  Edit3, 
  Check, 
  AlertCircle, 
  RefreshCw,
  Save,
  X
} from "lucide-react";
import { toast } from "react-hot-toast";
import { ComputedHoliday, DBHolidayWish, HolidayThemeAccent } from "@/lib/holidays/types";
import { HolidayGreetingModal } from "@/components/holidays/HolidayGreetingModal";

export default function AdminHolidaysPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [holidays, setHolidays] = useState<ComputedHoliday[]>([]);
  const [dbRecords, setDbRecords] = useState<DBHolidayWish[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editingHoliday, setEditingHoliday] = useState<ComputedHoliday | null>(null);
  const [editForm, setEditForm] = useState<{
    custom_date_override: string;
    headline: string;
    body_message: string;
    academic_status: string;
    theme_accent: HolidayThemeAccent;
    featured_article_slug: string;
    send_push_notification: boolean;
    broadcast_push_now: boolean;
  }>({
    custom_date_override: "",
    headline: "",
    body_message: "",
    academic_status: "",
    theme_accent: "gold",
    featured_article_slug: "",
    send_push_notification: true,
    broadcast_push_now: false,
  });
  const [saving, setSaving] = useState(false);

  // Live Preview Modal
  const [previewHoliday, setPreviewHoliday] = useState<ComputedHoliday | null>(null);

  const loadHolidays = async (year: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/holidays?year=${year}`);
      if (!res.ok) throw new Error("Failed to fetch holidays");
      const data = await res.json();
      if (data.success) {
        setHolidays(data.computedHolidays || []);
        setDbRecords(data.dbRecords || []);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Could not load holiday records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHolidays(selectedYear);
  }, [selectedYear]);

  const handleOpenEdit = (h: ComputedHoliday) => {
    const dbItem = dbRecords.find((r) => r.holiday_key === h.key);
    setEditingHoliday(h);
    setEditForm({
      custom_date_override: dbItem?.custom_date_override || "",
      headline: h.headline,
      body_message: h.bodyMessage,
      academic_status: h.academicStatus,
      theme_accent: h.themeAccent,
      featured_article_slug: h.featuredArticleSlug || "",
      send_push_notification: dbItem ? dbItem.send_push_notification : true,
      broadcast_push_now: false,
    });
  };

  const handleSaveHoliday = async () => {
    if (!editingHoliday) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          holiday_key: editingHoliday.key,
          title: editingHoliday.title,
          ...editForm,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          editForm.broadcast_push_now 
            ? "Saved and broadcasted push notification!" 
            : "Holiday wishes configuration updated!"
        );
        setEditingHoliday(null);
        loadHolidays(selectedYear);
      } else {
        toast.error(data.error || "Failed to update holiday.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save holiday changes.");
    } finally {
      setSaving(false);
    }
  };

  const renderThemeIcon = (theme: HolidayThemeAccent) => {
    switch (theme) {
      case "ghana_flag":
        return <span className="text-base">🇬🇭</span>;
      case "crescent":
        return <Moon className="h-4 w-4 text-emerald-600 fill-emerald-600" />;
      case "laurel":
        return <Award className="h-4 w-4 text-upsa-gold" />;
      case "festive":
        return <Church className="h-4 w-4 text-amber-500 fill-amber-500" />;
      default:
        return <CalendarHeart className="h-4 w-4 text-upsa-gold" />;
    }
  };

  return (
    <div className="space-y-8 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-upsa-gold bg-upsa-gold/10 px-3 py-1 rounded-full mb-2">
            <CalendarHeart className="h-3.5 w-3.5" />
            <span>Ghana Statutory Holidays Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-upsa-navy tracking-tight">
            Holiday Wishes & Gazette CMS
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Automated calendar calculations for movable dates with Ministry of the Interior gazette overrides and OneSignal broadcast triggers.
          </p>
        </div>

        {/* Year Selector */}
        <div className="flex items-center space-x-2">
          <label htmlFor="year-select" className="text-xs font-bold text-gray-500 uppercase">Year:</label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="px-4 py-2 border border-gray-300 rounded-xl bg-white text-sm font-bold text-upsa-navy focus:ring-2 focus:ring-upsa-gold focus:border-transparent outline-none"
          >
            <option value={currentYear - 1}>{currentYear - 1}</option>
            <option value={currentYear}>{currentYear} (Active)</option>
            <option value={currentYear + 1}>{currentYear + 1}</option>
            <option value={currentYear + 2}>{currentYear + 2}</option>
          </select>
          <button
            onClick={() => loadHolidays(selectedYear)}
            aria-label="Refresh holidays"
            className="p-2 border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Overview Notice */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 sm:p-5 flex items-start space-x-3 text-xs sm:text-sm text-blue-900">
        <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-blue-950">Statutory Rollover & Variable Dates Active</p>
          <p className="text-blue-800 leading-relaxed">
            Holidays falling on weekends are automatically rolled over to Monday in accordance with the Ghana Public Holidays Act (Act 601).
            When the Ministry gazettes the physical moon sighting for <strong>Eid-ul-Fitr</strong> or <strong>Eid-ul-Adha</strong>, tap <em>Edit</em> to confirm the gazetted date.
          </p>
        </div>
      </div>

      {/* Holidays Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-upsa-navy border-t-transparent" />
          <p className="text-sm text-gray-400 mt-2 font-medium">Computing statutory holiday calendar...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {holidays.map((h) => {
            const isOverridden = dbRecords.some((r) => r.holiday_key === h.key && r.custom_date_override);
            const dateObj = new Date(h.observedDate + "T00:00:00Z");
            const readableDate = dateObj.toLocaleDateString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
              timeZone: "UTC",
            });

            return (
              <div 
                key={h.key}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="p-5 space-y-3">
                  {/* Top Bar: Icon + Date */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-gray-100 rounded-xl">
                        {renderThemeIcon(h.themeAccent)}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-upsa-navy leading-tight">
                          {h.title}
                        </h3>
                        <span className="text-[11px] text-gray-500 font-medium">
                          {readableDate}
                        </span>
                      </div>
                    </div>

                    {isOverridden ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        Gazetted
                      </span>
                    ) : h.isRollover ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                        Rollover
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                        Auto
                      </span>
                    )}
                  </div>

                  {/* Headline & Body Message */}
                  <div className="space-y-1 pt-1">
                    <p className="text-xs font-bold text-gray-900 leading-snug">
                      &ldquo;{h.headline}&rdquo;
                    </p>
                    <p className="text-[11px] text-gray-500 line-clamp-3 leading-relaxed">
                      {h.bodyMessage}
                    </p>
                  </div>

                  {/* Campus Status */}
                  <div className="pt-2 border-t border-gray-100 text-[11px] text-gray-600 flex items-center space-x-1.5">
                    <span className="font-semibold text-upsa-navy">Notice:</span>
                    <span className="truncate">{h.academicStatus}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setPreviewHoliday(h)}
                    className="flex-1 py-1.5 px-3 bg-white border border-gray-200 hover:border-upsa-gold rounded-lg text-xs font-bold text-upsa-navy flex items-center justify-center space-x-1.5 transition-colors shadow-2xs"
                  >
                    <Eye className="h-3.5 w-3.5 text-upsa-gold" />
                    <span>Preview Card</span>
                  </button>

                  <button
                    onClick={() => handleOpenEdit(h)}
                    className="py-1.5 px-3 bg-upsa-navy hover:bg-upsa-dark-navy rounded-lg text-xs font-bold text-white flex items-center justify-center space-x-1.5 transition-colors shadow-2xs"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Holiday Modal */}
      {editingHoliday && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-gray-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 sm:p-6 bg-upsa-navy text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-upsa-gold">Configure Statutory Holiday</span>
                <h2 className="text-xl font-black">{editingHoliday.title}</h2>
              </div>
              <button
                onClick={() => setEditingHoliday(null)}
                className="p-1.5 text-gray-300 hover:text-white rounded-full hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
              {/* Date Override Field */}
              <div>
                <label className="block font-bold text-gray-800 mb-1">
                  Custom Gazette Date Override (Optional)
                </label>
                <p className="text-[11px] text-gray-500 mb-2">
                  Leave blank to use the statutory engine calculation ({editingHoliday.actualDate}). Set an explicit date when the Ministry announces physical moon sightings or presidential declarations.
                </p>
                <input
                  type="date"
                  value={editForm.custom_date_override}
                  onChange={(e) => setEditForm({ ...editForm, custom_date_override: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-upsa-gold"
                />
              </div>

              {/* Theme Accent */}
              <div>
                <label className="block font-bold text-gray-800 mb-1">Theme Accent</label>
                <select
                  value={editForm.theme_accent}
                  onChange={(e) => setEditForm({ ...editForm, theme_accent: e.target.value as HolidayThemeAccent })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-upsa-gold"
                >
                  <option value="gold">UPSA Gold (Christian / General)</option>
                  <option value="ghana_flag">Ghana National Flag (Independence / Republic / Founder)</option>
                  <option value="crescent">Islamic Crescent & Star (Eid-ul-Fitr / Eid-ul-Adha)</option>
                  <option value="laurel">Agricultural Sheaf (Farmers’ Day)</option>
                  <option value="festive">Festive Celebration (New Year / Christmas)</option>
                </select>
              </div>

              {/* Headline */}
              <div>
                <label className="block font-bold text-gray-800 mb-1">Celebration Headline</label>
                <input
                  type="text"
                  value={editForm.headline}
                  onChange={(e) => setEditForm({ ...editForm, headline: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-upsa-gold"
                  placeholder="e.g. Happy Independence Day, Ghana!"
                />
              </div>

              {/* Body Greeting Message */}
              <div>
                <label className="block font-bold text-gray-800 mb-1">Official Greeting Message</label>
                <textarea
                  rows={3}
                  value={editForm.body_message}
                  onChange={(e) => setEditForm({ ...editForm, body_message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-upsa-gold resize-none"
                  placeholder="Official message to students, faculty, and readers..."
                />
              </div>

              {/* Academic & Campus Status */}
              <div>
                <label className="block font-bold text-gray-800 mb-1">Campus Academic Notice</label>
                <input
                  type="text"
                  value={editForm.academic_status}
                  onChange={(e) => setEditForm({ ...editForm, academic_status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-upsa-gold"
                  placeholder="e.g. University offices, faculties, and lecture halls closed."
                />
              </div>

              {/* OneSignal Push Trigger */}
              <div className="pt-2 border-t border-gray-100 space-y-3">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.broadcast_push_now}
                    onChange={(e) => setEditForm({ ...editForm, broadcast_push_now: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-upsa-navy focus:ring-upsa-gold"
                  />
                  <span className="font-bold text-gray-900 text-xs sm:text-sm flex items-center space-x-1">
                    <Send className="h-3.5 w-3.5 text-upsa-gold" />
                    <span>Broadcast Web Push Notification immediately</span>
                  </span>
                </label>
                {editForm.broadcast_push_now && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    ⚠️ This will dispatch a live push notification to all OneSignal subscribers now.
                  </p>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end space-x-3">
              <button
                onClick={() => setEditingHoliday(null)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveHoliday}
                disabled={saving}
                className="px-5 py-2 bg-upsa-navy hover:bg-upsa-dark-navy text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{saving ? "Saving..." : "Save Configuration"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Preview Modal */}
      {previewHoliday && (
        <HolidayGreetingModal
          forcePreviewHoliday={previewHoliday}
          onClosePreview={() => setPreviewHoliday(null)}
        />
      )}
    </div>
  );
}
