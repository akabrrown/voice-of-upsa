import { Suspense } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Package, ShoppingCart, DollarSign, TrendingUp, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SellerBadge } from "@/components/mart/seller-badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = 'force-dynamic';

async function getSellerData() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  // Get Store
  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_id", session.user.id)
    .single();

  if (!store) {
    // Check if they have applied
    const { data: profile } = await supabase.from("profiles").select("seller_status").eq("id", session.user.id).single();
    if (profile?.seller_status === 'pending_verification') {
      redirect("/mart/seller/pending");
    } else {
      redirect("/mart/sell");
    }
  }

  // Get Orders for this store
  const { data: orders } = await supabase
    .from("orders")
    .select("total, status, created_at")
    .eq("store_id", store.id)
    .order('created_at', { ascending: false });

  // Get Products
  const { count: productCount } = await supabase
    .from("products")
    .select("*", { count: 'exact', head: true })
    .eq("store_id", store.id);

  return { store, orders: orders || [], productCount: productCount || 0 };
}

export default async function SellerDashboardPage() {
  const { store, orders, productCount } = await getSellerData();

  const totalRevenue = orders.filter(o => o.status === 'delivered').reduce((acc, curr) => acc + curr.total, 0);
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;

  return (
    <div className="space-y-10 pb-20 max-w-6xl mx-auto">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-border/60 dark:border-white/10 pb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-upsa-navy dark:text-white">Dashboard</h1>
          <p className="text-lg text-gray-600 dark:text-slate-400 mt-2">Welcome back to {store.name}</p>
        </div>
        <div className="flex items-center gap-4">
          <SellerBadge status="verified" />
          <Button asChild className="rounded-none bg-upsa-navy hover:bg-upsa-gold hover:text-upsa-navy dark:bg-upsa-gold dark:text-upsa-navy dark:hover:bg-upsa-gold/90 font-bold text-white">
            <Link href="/seller/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-none border border-border/60 dark:border-white/10 dark:bg-[#0C1729] shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-upsa-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-upsa-navy dark:text-white">GHS {totalRevenue.toFixed(2)}</div>
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-1">+20.1% from last month</p>
          </CardContent>
        </Card>
        
        <Card className="rounded-none border border-border/60 dark:border-white/10 dark:bg-[#0C1729] shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pending Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-upsa-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-upsa-navy dark:text-white">{pendingOrders}</div>
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mt-1">Action required</p>
          </CardContent>
        </Card>
        
        <Card className="rounded-none border border-border/60 dark:border-white/10 dark:bg-[#0C1729] shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Active Products</CardTitle>
            <Package className="h-4 w-4 text-upsa-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-upsa-navy dark:text-white">{productCount}</div>
            <p className="text-xs font-medium text-muted-foreground mt-1">Live on marketplace</p>
          </CardContent>
        </Card>

        <Card className="rounded-none border border-border/60 dark:border-white/10 dark:bg-[#0C1729] shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-upsa-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-upsa-navy dark:text-white">12.5%</div>
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-1">+4% from last week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-full lg:col-span-4 rounded-none border border-border/60 dark:border-white/10 dark:bg-[#0C1729] shadow-none">
          <CardHeader className="border-b border-border/40 dark:border-white/10 bg-muted/20 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-upsa-navy dark:text-white">Recent Orders</CardTitle>
              <Button variant="link" asChild className="text-upsa-navy dark:text-upsa-gold h-auto p-0 font-bold">
                <Link href="/seller/orders">View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {orders.slice(0, 5).map((order) => (
                <div key={order.created_at} className="flex items-center justify-between border-b border-border/40 dark:border-white/10 pb-6 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="font-bold text-upsa-navy dark:text-white">Order Placed</p>
                    <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">{new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="font-extrabold text-lg text-upsa-navy dark:text-white">GHS {order.total.toFixed(2)}</div>
                    <div className={`text-xs px-3 py-1 font-bold uppercase tracking-widest ${
                      order.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : 
                      order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' :
                      'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-slate-300'
                    }`}>
                      {order.status}
                    </div>
                  </div>
                </div>
              ))}
              {orders.length === 0 && (
                <div className="text-center py-12 border border-dashed border-border/60 dark:border-white/10">
                  <p className="text-muted-foreground font-medium">No orders yet.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
