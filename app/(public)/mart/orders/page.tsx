import { Suspense } from "react";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Package, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

async function getOrders() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      store:store_id(name),
      items:order_items(
        id, quantity, product_name_snapshot, unit_price_snapshot
      )
    `)
    .eq("buyer_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch orders error:", error);
    return [];
  }
  return data;
}

export default async function BuyerOrdersPage() {
  const orders = await getOrders();

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'pending': return { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
      case 'delivered': return { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
      case 'cancelled': return { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' };
      default: return { icon: Package, color: 'text-indigo-500', bg: 'bg-indigo-500/10' };
    }
  };

  return (
    <div className="container py-16 min-h-[70vh]">
      <h1 className="mb-10 text-3xl font-bold tracking-tight">Your Orders</h1>

      {orders.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-dashed border-border/50 bg-muted/20 py-20 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Package className="h-8 w-8 text-muted-foreground opacity-50" />
          </div>
          <h3 className="text-xl font-semibold">No orders yet</h3>
          <p className="mt-2 text-muted-foreground">When you place an order, it will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {orders.map((order: any) => {
            const statusConfig = getStatusConfig(order.status);
            const StatusIcon = statusConfig.icon;

            return (
              <Card key={order.id} className="border-white/10 bg-white/5 backdrop-blur-md overflow-hidden">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-muted/30 pb-4">
                  <div>
                    <CardTitle className="text-lg">Order {order.order_number}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(order.created_at).toLocaleDateString()} • {order.store.name}
                    </p>
                  </div>
                  <Badge variant="outline" className={`mt-4 sm:mt-0 gap-1.5 px-3 py-1 text-sm ${statusConfig.bg} ${statusConfig.color} border-transparent`}>
                    <StatusIcon className="h-4 w-4" />
                    <span className="capitalize">{order.status.replace(/_/g, ' ')}</span>
                  </Badge>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {order.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.quantity}x</span>
                          <span className="text-muted-foreground">{item.product_name_snapshot}</span>
                        </div>
                        <span className="font-medium">GHS {item.unit_price_snapshot * item.quantity}</span>
                      </div>
                    ))}
                    
                    <div className="my-4 border-t border-border/50" />
                    
                    <div className="flex justify-between items-center font-bold">
                      <span>Total (Pay on Delivery)</span>
                      <span>GHS {order.total}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
