"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { 
  Users, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  UploadCloud, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Mail, 
  ArrowUpDown,
  RefreshCw,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { toast } from "react-hot-toast";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio?: string | null;
  image_url: string;
  email?: string | null;
  social_links?: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  display_order: number;
  is_active: boolean;
  created_at?: string;
}

const DEFAULT_IMAGE = "/logo.jpg";

export default function AdminEditorialTeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [imageUrl, setImageUrl] = useState(DEFAULT_IMAGE);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [twitterHandle, setTwitterHandle] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  // Upload states
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Delete modal
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await fetch("/api/admin/editorial-team");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch members");
      setMembers(data.members || []);
    } catch (err: any) {
      console.error("Error fetching editorial team:", err);
      toast.error(err.message || "Could not load team members");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleOpenAddDialog = () => {
    setEditingMember(null);
    setName("");
    setRole("");
    setBio("");
    setEmail("");
    setImageUrl(DEFAULT_IMAGE);
    setDisplayOrder(members.length + 1);
    setIsActive(true);
    setTwitterHandle("");
    setLinkedinUrl("");
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (member: TeamMember) => {
    setEditingMember(member);
    setName(member.name);
    setRole(member.role);
    setBio(member.bio || "");
    setEmail(member.email || "");
    setImageUrl(member.image_url || DEFAULT_IMAGE);
    setDisplayOrder(member.display_order ?? 0);
    setIsActive(member.is_active ?? true);
    setTwitterHandle(member.social_links?.twitter || "");
    setLinkedinUrl(member.social_links?.linkedin || "");
    setIsDialogOpen(true);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a valid image file (PNG, JPG, WebP)");
      return;
    }

    // 10MB client check
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image file size exceeds 10MB limit");
      return;
    }

    setIsUploadingImage(true);
    const toastId = toast.loading("Uploading image to Cloudinary...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setImageUrl(data.secure_url);
      toast.success("Photo uploaded successfully!", { id: toastId });
    } catch (err: any) {
      console.error("Image upload error:", err);
      toast.error(err.message || "Failed to upload image. Please try again.", { id: toastId });
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Member full name is required");
      return;
    }
    if (!role.trim()) {
      toast.error("Role or position is required");
      return;
    }

    setIsSaving(true);

    const payload = {
      id: editingMember?.id,
      name: name.trim(),
      role: role.trim(),
      bio: bio.trim() || null,
      email: email.trim() || null,
      image_url: imageUrl || DEFAULT_IMAGE,
      display_order: Number(displayOrder) || 0,
      is_active: isActive,
      social_links: {
        twitter: twitterHandle.trim() || undefined,
        linkedin: linkedinUrl.trim() || undefined,
      },
    };

    try {
      const method = editingMember ? "PUT" : "POST";
      const res = await fetch("/api/admin/editorial-team", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save team member");

      toast.success(editingMember ? "Team member updated!" : "New team member added!");
      setIsDialogOpen(false);
      fetchTeamMembers(true);
    } catch (err: any) {
      console.error("Save team member error:", err);
      toast.error(err.message || "Failed to save team member");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!memberToDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/editorial-team?id=${memberToDelete.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete member");

      toast.success("Member removed from editorial team");
      setMemberToDelete(null);
      fetchTeamMembers(true);
    } catch (err: any) {
      console.error("Delete team member error:", err);
      toast.error(err.message || "Failed to delete member");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (member: TeamMember) => {
    try {
      const updatedStatus = !member.is_active;
      const res = await fetch("/api/admin/editorial-team", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...member,
          is_active: updatedStatus,
        }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, is_active: updatedStatus } : m))
      );
      toast.success(updatedStatus ? "Member marked as active" : "Member hidden from public site");
    } catch (err: any) {
      toast.error("Failed to toggle status");
    }
  };

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.email && m.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-upsa-navy tracking-tight">Editorial Team CMS</h1>
            <span className="bg-upsa-gold/15 text-upsa-navy text-xs font-black uppercase px-2.5 py-0.5 rounded-full">
              Live Directory
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Manage public staff profiles, editors-in-chief, investigative reporters, and authors shown on the About page.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTeamMembers(true)}
            disabled={isRefreshing}
            className="rounded-xl border-gray-200 text-xs font-bold text-gray-600 gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            onClick={handleOpenAddDialog}
            className="bg-upsa-navy text-white hover:bg-upsa-gold hover:text-upsa-navy font-bold rounded-xl text-xs gap-2 py-5 shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" /> Add Team Member
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Members</span>
            <div className="p-2 bg-upsa-navy/5 rounded-xl text-upsa-navy">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-upsa-navy mt-2">{members.length}</div>
          <span className="text-[11px] text-gray-400 font-medium">In CMS directory</span>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Publicly Active</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            {members.filter((m) => m.is_active).length}
          </div>
          <span className="text-[11px] text-gray-400 font-medium">Visible on About page</span>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Hidden / Draft</span>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <XCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            {members.filter((m) => !m.is_active).length}
          </div>
          <span className="text-[11px] text-gray-400 font-medium">Not visible publicly</span>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Editorial Desks</span>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-upsa-navy mt-2">
            {new Set(members.map((m) => m.role.trim().toLowerCase())).size}
          </div>
          <span className="text-[11px] text-gray-400 font-medium">Distinct newsroom roles</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center gap-3">
        <Search className="h-4 w-4 text-gray-400 shrink-0 ml-2" />
        <Input
          type="text"
          placeholder="Search team by name, role (e.g. Editor-in-Chief), or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-none shadow-none focus-visible:ring-0 text-xs bg-transparent h-8"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery("")}
            className="text-xs text-gray-400 hover:text-gray-600 h-7 px-2"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Member Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4 animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-gray-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-12 bg-gray-50 rounded-xl" />
              <div className="h-8 bg-gray-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 p-8 space-y-4">
          <Users className="h-12 w-12 text-gray-300 mx-auto" />
          <h3 className="text-lg font-bold text-upsa-navy">No Editorial Team Members Found</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            {searchQuery 
              ? `No members matching "${searchQuery}". Try clearing your search.` 
              : "There are currently no team members in the system. Click 'Add Team Member' to create the first profile."}
          </p>
          <Button onClick={handleOpenAddDialog} className="bg-upsa-navy text-white hover:bg-upsa-gold hover:text-upsa-navy font-bold rounded-xl text-xs gap-2">
            <Plus className="h-4 w-4" /> Add Team Member
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className={`bg-white rounded-3xl p-6 border transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between ${
                member.is_active ? "border-gray-100" : "border-gray-200 opacity-75 bg-gray-50/50"
              }`}
            >
              <div>
                {/* Header: Photo, Status, Order */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-upsa-gold shadow-sm shrink-0 bg-gray-100">
                    <Image
                      src={member.image_url || DEFAULT_IMAGE}
                      alt={member.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <button
                      onClick={() => handleToggleActive(member)}
                      title="Click to toggle visibility on public website"
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors ${
                        member.is_active
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${member.is_active ? "bg-emerald-500" : "bg-gray-400"}`} />
                      {member.is_active ? "Active" : "Hidden"}
                    </button>
                    <span className="text-[10px] font-bold text-gray-400">
                      Order: #{member.display_order}
                    </span>
                  </div>
                </div>

                {/* Member Info */}
                <h3 className="text-lg font-bold text-upsa-navy line-clamp-1">{member.name}</h3>
                <p className="text-xs font-bold text-upsa-gold uppercase tracking-wider mt-0.5 line-clamp-1">
                  {member.role}
                </p>

                {member.bio && (
                  <p className="text-xs text-gray-500 mt-3 line-clamp-3 leading-relaxed">
                    {member.bio}
                  </p>
                )}

                {member.email && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-3">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{member.email}</span>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-4 mt-5 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[10px] text-gray-400">
                  {member.image_url === DEFAULT_IMAGE ? (
                    <span className="text-amber-600 font-medium">Using default logo</span>
                  ) : (
                    <span className="text-emerald-600 font-medium">Custom photo</span>
                  )}
                </span>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Edit ${member.name}`}
                    onClick={() => handleOpenEditDialog(member)}
                    className="h-8 w-8 p-0 rounded-xl hover:bg-upsa-navy/10 text-upsa-navy cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Delete ${member.name}`}
                    onClick={() => setMemberToDelete(member)}
                    className="h-8 w-8 p-0 rounded-xl hover:bg-red-50 text-red-600 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl rounded-2xl p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-upsa-navy">
              {editingMember ? "Edit Team Member" : "Add New Team Member"}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Provide member information and upload a profile photo. The photo is automatically saved and optimized via Cloudinary.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveMember} className="space-y-4 pt-2">
            {/* Direct Image Upload Feature */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-upsa-navy">
                Profile Photo (Image File Upload)
              </Label>
              
              <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl bg-gray-50/50">
                {/* Photo Thumbnail */}
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-upsa-gold shadow-md shrink-0 bg-white">
                  <Image
                    src={imageUrl || DEFAULT_IMAGE}
                    alt="Preview"
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                  {isUploadingImage && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  )}
                </div>

                {/* Upload Control */}
                <div className="flex-1 space-y-1.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                    id="team_member_image_upload"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="rounded-xl text-xs font-bold border-gray-200 gap-1.5 h-8 bg-white hover:bg-upsa-gold hover:text-upsa-navy"
                    >
                      <UploadCloud className="h-3.5 w-3.5" />
                      {imageUrl && imageUrl !== DEFAULT_IMAGE ? "Change Photo" : "Upload Photo"}
                    </Button>

                    {imageUrl && imageUrl !== DEFAULT_IMAGE && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setImageUrl(DEFAULT_IMAGE)}
                        className="rounded-xl text-xs font-bold text-gray-400 hover:text-red-600 h-8"
                      >
                        Reset to Default
                      </Button>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 leading-normal">
                    {imageUrl === DEFAULT_IMAGE 
                      ? "Currently using default placeholder: /logo.jpg. Upload a PNG, JPG, or WebP photo to replace." 
                      : "Photo uploaded and ready to save."}
                  </p>
                </div>
              </div>
            </div>

            {/* Name & Role */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="member_name" className="text-xs font-bold text-upsa-navy">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="member_name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Kwesi Amponsah"
                  required
                  className="rounded-xl text-xs border-gray-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="member_role" className="text-xs font-bold text-upsa-navy">
                  Role / Position <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="member_role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Editor-in-Chief"
                  required
                  className="rounded-xl text-xs border-gray-200"
                />
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <Label htmlFor="member_bio" className="text-xs font-bold text-upsa-navy">
                Short Biography
              </Label>
              <Textarea
                id="member_bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Brief summary of duties, journalistic background, or editorial coverage..."
                className="rounded-xl text-xs border-gray-200"
              />
            </div>

            {/* Email & Display Order */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="member_email" className="text-xs font-bold text-upsa-navy">
                  Email Address
                </Label>
                <Input
                  id="member_email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="editor@voiceofupsa.com"
                  className="rounded-xl text-xs border-gray-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="member_order" className="text-xs font-bold text-upsa-navy">
                  Display Order Priority
                </Label>
                <Input
                  id="member_order"
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(Number(e.target.value))}
                  placeholder="1"
                  className="rounded-xl text-xs border-gray-200"
                />
                <span className="text-[10px] text-gray-400">Lower numbers appear first (e.g. 1 for Editor-in-Chief).</span>
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between p-3 border border-gray-100 rounded-2xl bg-gray-50/50">
              <div className="space-y-0.5">
                <Label htmlFor="member_active_toggle" className="text-xs font-bold text-upsa-navy cursor-pointer">
                  Show on Public About Page
                </Label>
                <p className="text-[10px] text-gray-400">
                  When enabled, this member is visible in &quot;The Editorial Team&quot; section.
                </p>
              </div>
              <input
                id="member_active_toggle"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-upsa-navy focus:ring-upsa-gold"
              />
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-xl text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving || isUploadingImage}
                className="bg-upsa-navy text-white hover:bg-upsa-gold hover:text-upsa-navy font-bold rounded-xl text-xs gap-2"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {editingMember ? "Save Changes" : "Create Team Member"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(memberToDelete)} onOpenChange={(open) => !open && setMemberToDelete(null)}>
        <DialogContent className="max-w-md rounded-3xl p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" /> Remove Team Member?
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Are you sure you want to remove <strong className="text-upsa-navy">{memberToDelete?.name}</strong> from the editorial team? This action will remove them from the public About page.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMemberToDelete(null)}
              className="rounded-xl text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteMember}
              disabled={isDeleting}
              className="rounded-xl text-xs font-bold gap-1.5"
            >
              {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Yes, Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
