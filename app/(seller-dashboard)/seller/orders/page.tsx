"use client";

import { useEffect, useState } from "react";
import { Package, Clock, CheckCircle2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: store } = await supabase.from('stores').select('id').eq('owner_id', session.user.id).single();
      if (!store) return;

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          buyer:buyer_id(full_name, phone),
          items:order_items(quantity, product_name_snapshot, unit_price_snapshot)
        `)
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      toast.error("Failed to load orders: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      toast.success(`Order marked as ${newStatus.replace('_', ' ')}`);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err: any) {
      toast.error("Failed to update status");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading orders...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground mt-1">Manage and fulfill your customer orders.</p>
      </div>

      <div className="grid gap-6">
        {orders.map((order) => (
          <Card key={order.id} className="border-border/50 bg-white/5 backdrop-blur-md overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-muted/30 pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">Order #{order.order_number || order.id.slice(0,8)}</CardTitle>
                  <Badge variant="outline" className={`capitalize ${
                    order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 
                    order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-500' : 
                    order.status === 'processing' ? 'bg-blue-500/10 text-blue-500' : 'bg-muted text-muted-foreground'
                  } border-transparent`}>
                    {order.status.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Placed on {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
              
              <div className="mt-4 sm:mt-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">Update Status</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => updateStatus(order.id, 'processing')}>
                      Mark as Processing
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateStatus(order.id, 'out_for_delivery')}>
                      Out for Delivery
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateStatus(order.id, 'delivered')} className="text-emerald-500">
                      Mark as Delivered
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateStatus(order.id, 'cancelled')} className="text-destructive">
                      Cancel Order
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pt-6 grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Customer Details</h4>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium text-muted-foreground">Name:</span> {order.buyer?.full_name}</p>
                  <p><span className="font-medium text-muted-foreground">Phone:</span> {order.buyer?.phone}</p>
                  <p><span className="font-medium text-muted-foreground">Payment:</span> {order.payment_method.replace(/_/g, ' ')}</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Order Items</h4>
                <div className="space-y-3">
                  {order.items?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-sm border-b border-border/30 pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.quantity}x</span>
                        <span>{item.product_name_snapshot}</span>
                      </div>
                      <span className="font-medium">GHS {item.unit_price_snapshot * item.quantity}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center font-bold pt-2">
                    <span>Total</span>
                    <span className="text-indigo-500">GHS {order.total}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {orders.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No orders found.
          </div>
        )}
      </div>
    </div>
  );
}
