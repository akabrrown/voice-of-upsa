"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Plus, Play, Pause, Clock, Loader2, Upload, Trash2 } from "lucide-react";
import Link from "next/link";
import { StatsShadowLoader } from "@/components/ui/shadow-loaders";
import Image from "next/image";
import { Switch } from "@/components/ui/switch";

interface Episode {
  id: string;
  title: string;
  slug: string;
  description: string;
  audio_url: string;
  duration_seconds: number;
  published_at: string;
  status: string;
  episode_number: number | null;
  season_number: number | null;
}

interface Show {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  cover_image_url: string;
  status: string;
  episodes: Episode[];
}

export default function AdminShowManagementPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  
  const [show, setShow] = useState<Show | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New episode form state
  const [showNewEpisodeForm, setShowNewEpisodeForm] = useState(false);
  const [newEp, setNewEp] = useState({
    title: "",
    description: "",
    episode_number: "",
    season_number: "",
    audio_url: "https://res.cloudinary.com/demo/video/upload/dog.mp3", // mock default for now
    duration_seconds: "120",
    status: "published"
  });

  useEffect(() => {
    fetch(`/api/admin/podcasts/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setShow(data.data);
        } else {
          toast.error("Failed to load show details");
        }
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load show details");
        setLoading(false);
      });
  }, [id]);

  const handleCreateEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch(`/api/admin/podcasts/${id}/episodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newEp,
          episode_number: newEp.episode_number ? parseInt(newEp.episode_number) : null,
          season_number: newEp.season_number ? parseInt(newEp.season_number) : null,
          duration_seconds: parseInt(newEp.duration_seconds)
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success("Episode added successfully");
        setShow(prev => prev ? {
          ...prev,
          episodes: [data.data, ...prev.episodes]
        } : null);
        setShowNewEpisodeForm(false);
        setNewEp({
          title: "",
          description: "",
          episode_number: "",
          season_number: "",
          audio_url: "https://res.cloudinary.com/demo/video/upload/dog.mp3",
          duration_seconds: "120",
          status: "published"
        });
      } else {
        toast.error(data.error || "Failed to add episode");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleShowStatus = async () => {
    if (!show) return;
    const newStatus = show.status === 'active' ? 'inactive' : 'active';
    
    try {
      const res = await fetch(`/api/admin/podcasts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (res.ok) {
        setShow({ ...show, status: newStatus });
        toast.success(`Show is now ${newStatus}`);
      } else {
        toast.error("Failed to update status");
      }
    } catch (err) {
      toast.error("Error updating status");
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="space-y-6"><StatsShadowLoader count={2} /></div>;
  }

  if (!show) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-800">Show not found</h2>
        <Button className="mt-4" onClick={() => router.push('/dashboard/admin/podcasts')}>
          Back to Podcasts
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/dashboard/admin/podcasts')} className="rounded-full">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-black text-upsa-navy tracking-tight flex items-center gap-3">
            {show.title}
          </h1>
          <p className="text-gray-500">Manage show details and episodes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Show Details */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-none shadow-md overflow-hidden">
            <div className="aspect-square relative bg-gray-100">
              {show.cover_image_url ? (
                <Image src={show.cover_image_url} alt={show.title} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">No Cover</div>
              )}
            </div>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label className="text-xs text-gray-500 uppercase font-bold">Category</Label>
                <div className="mt-1"><Badge variant="outline" className="capitalize">{show.category.replace('_', ' ')}</Badge></div>
              </div>
              
              <div>
                <Label className="text-xs text-gray-500 uppercase font-bold">Visibility Status</Label>
                <div className="flex items-center justify-between mt-1 p-3 bg-gray-50 rounded-lg border">
                  <span className="font-medium text-sm text-gray-800">
                    {show.status === 'active' ? 'Publicly Visible' : 'Hidden'}
                  </span>
                  <Switch 
                    checked={show.status === 'active'}
                    onCheckedChange={handleToggleShowStatus}
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-500 uppercase font-bold">RSS Feed URL</Label>
                <div className="mt-1 text-xs text-gray-500 bg-gray-100 p-2 rounded truncate select-all">
                  {`/podcasts/${show.slug}/feed.xml`}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Episodes */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-upsa-navy flex items-center gap-2">
              Episodes <Badge variant="secondary">{show.episodes.length}</Badge>
            </h2>
            <Button 
              onClick={() => setShowNewEpisodeForm(!showNewEpisodeForm)}
              className="bg-upsa-gold text-upsa-navy hover:bg-yellow-500 font-bold"
            >
              {showNewEpisodeForm ? 'Cancel' : <><Plus className="h-4 w-4 mr-2" /> Add Episode</>}
            </Button>
          </div>

          {showNewEpisodeForm && (
            <Card className="border-none shadow-md border-t-4 border-t-upsa-gold animate-in slide-in-from-top-4 fade-in duration-300">
              <CardHeader>
                <CardTitle className="text-lg">New Episode</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateEpisode} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Episode Title</Label>
                      <Input required value={newEp.title} onChange={e => setNewEp({...newEp, title: e.target.value})} placeholder="e.g. Navigating Finals Week" />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label>Show Notes (Description)</Label>
                      <Textarea required value={newEp.description} onChange={e => setNewEp({...newEp, description: e.target.value})} className="h-24" placeholder="Episode summary and links..." />
                    </div>

                    <div className="space-y-2">
                      <Label>Season Number (Optional)</Label>
                      <Input type="number" min="1" value={newEp.season_number} onChange={e => setNewEp({...newEp, season_number: e.target.value})} placeholder="e.g. 1" />
                    </div>

                    <div className="space-y-2">
                      <Label>Episode Number (Optional)</Label>
                      <Input type="number" min="1" value={newEp.episode_number} onChange={e => setNewEp({...newEp, episode_number: e.target.value})} placeholder="e.g. 5" />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Audio Upload (Cloudinary URL)</Label>
                      <div className="flex gap-2">
                        <Input required value={newEp.audio_url} onChange={e => setNewEp({...newEp, audio_url: e.target.value})} placeholder="https://..." />
                        <Button type="button" variant="outline" onClick={() => toast.info("Cloudinary widget would open here")}><Upload className="h-4 w-4" /></Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">For Phase 1, insert the raw Cloudinary audio URL.</p>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => setShowNewEpisodeForm(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting} className="bg-upsa-navy text-white">
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Publish Episode
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {show.episodes.length === 0 && !showNewEpisodeForm ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-500 font-medium">No episodes yet.</p>
                <Button variant="link" onClick={() => setShowNewEpisodeForm(true)} className="text-upsa-navy">Add the first episode</Button>
              </div>
            ) : (
              show.episodes.map((ep) => (
                <Card key={ep.id} className="border-gray-100 shadow-sm">
                  <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="h-12 w-12 bg-upsa-navy/10 rounded-full flex items-center justify-center shrink-0">
                      <Play className="h-5 w-5 text-upsa-navy ml-1" />
                    </div>
                    
                    <div className="grow space-y-1">
                      <h4 className="font-bold text-gray-900">{ep.title}</h4>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 font-medium">
                        <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {formatDuration(ep.duration_seconds)}</span>
                        <span>{new Date(ep.published_at).toLocaleDateString()}</span>
                        {ep.season_number && ep.episode_number && <span>S{ep.season_number} E{ep.episode_number}</span>}
                        <Badge variant="outline" className={ep.status === 'published' ? 'text-green-600 border-green-200 bg-green-50' : 'text-gray-600'}>
                          {ep.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => toast.info("Soft delete functionality to be implemented")}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
