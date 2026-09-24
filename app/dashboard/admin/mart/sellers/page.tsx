"use client";

import { useEffect, useState } from "react";
import { Check, X, ShieldAlert, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function AdminSellerModerationPage() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      const { data: rawSellers, error: rErr } = await supabase
        .from('seller_details')
        .select('*, profiles!seller_details_profile_id_fkey!inner(seller_status, full_name, avatar_url)')
        .eq('profiles.seller_status', 'pending_verification');

      if (rErr) throw rErr;
      setSellers(rawSellers || []);
    } catch (error: any) {
      console.error("Fetch sellers error:", error);
      toast.error(error.message || "Failed to load seller applications");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (profileId: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch("/api/mart/admin/sellers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: profileId, action }),
      });

      if (!res.ok) throw new Error("Action failed");

      toast.success(`Seller ${action}d successfully`);
      setSellers(prev => prev.filter(s => s.profile_id !== profileId));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading applications...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Seller Applications</h1>
        <p className="text-muted-foreground mt-1">Review and approve new sellers for Campus Mart.</p>
      </div>

      {sellers.length === 0 ? (
        <Card className="flex min-h-[300px] flex-col items-center justify-center border-dashed bg-muted/20 text-center">
          <ShieldAlert className="h-10 w-10 text-muted-foreground opacity-50 mb-4" />
          <CardTitle>No pending applications</CardTitle>
          <CardDescription className="mt-2">All caught up! No new sellers are waiting for approval.</CardDescription>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sellers.map((seller) => (
            <Card key={seller.id} className="border-border/50">
              <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Store className="h-4 w-4 text-indigo-500" />
                    {seller.full_name}
                  </CardTitle>
                  <CardDescription className="mt-1">{seller.seller_type.replace('_', ' ').toUpperCase()}</CardDescription>
                </div>
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-transparent">Pending</Badge>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 text-sm mb-6">
                  <div className="flex justify-between items-center border-b border-border/40 pb-2">
                    <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Phone</span>
                    <span className="font-extrabold text-upsa-navy">{seller.phone}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-border/40 pb-2">
                    <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Student ID No.</span>
                    <span className="font-extrabold text-upsa-navy">{seller.index_number || 'N/A'}</span>
                  </div>
                  
                  {seller.student_id_url && (
                    <div className="pt-2">
                      <span className="text-gray-500 font-bold uppercase tracking-widest text-xs block mb-2">Uploaded ID Card</span>
                      <div className="relative h-40 w-full rounded-none border-2 border-border/60 overflow-hidden group">
                        {/* Use img tag for external cloudinary unoptimized URLs to prevent Next.js config errors */}
                        <img 
                          src={seller.student_id_url} 
                          alt="Student ID" 
                          className="w-full h-full object-cover transition-transform group-hover:scale-105 cursor-pointer"
                          onClick={() => window.open(seller.student_id_url, '_blank')}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                          <span className="text-white text-xs font-bold uppercase tracking-widest">Click to view full</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button className="flex-1 rounded-none gap-2 bg-upsa-navy hover:bg-upsa-navy/90 text-white font-bold uppercase tracking-widest text-xs h-10" onClick={() => handleAction(seller.profile_id, 'approve')}>
                    <Check className="h-4 w-4" /> Approve
                  </Button>
                  <Button variant="outline" className="flex-1 rounded-none gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 font-bold uppercase tracking-widest text-xs h-10" onClick={() => handleAction(seller.profile_id, 'reject')}>
                    <X className="h-4 w-4" /> Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
