"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Image from "next/image";

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>("");

  useEffect(() => {
    fetchCart();
    fetchLocations();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await fetch("/api/mart/cart");
      if (res.ok) {
        const data = await res.json();
        setCartItems(data.cartItems || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      setLocations([
        { id: "1", label: "UPSA Hostel 1", zone: "hostel" },
        { id: "2", label: "Main Library", zone: "library" },
        { id: "3", label: "Student Centre", zone: "student_centre" }
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  const removeItem = async (id: string) => {
    try {
      const res = await fetch(`/api/mart/cart?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setCartItems(prev => prev.filter(item => item.id !== id));
        toast.success("Item removed from cart");
      }
    } catch (err) {
      toast.error("Failed to remove item");
    }
  };

  const handleCheckout = async () => {
    if (!selectedLocation) {
      toast.error("Please select a delivery location");
      return;
    }
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/mart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delivery_location_id: "00000000-0000-0000-0000-000000000000",
          payment_method: "pay_on_delivery"
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Checkout failed");
      }

      toast.success("Order placed successfully!");
      router.push("/mart/orders");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const subtotal = cartItems.reduce((acc, item) => {
    const price = item.product.discount_price ?? item.product.price;
    return acc + price * item.quantity;
  }, 0);

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center bg-[#F9FAFB]"><Loader2 className="h-10 w-10 animate-spin text-upsa-navy" /></div>;
  }

  return (
    <div className="bg-[#F9FAFB] min-h-[100dvh]">
      <div className="container px-6 lg:px-16 xl:px-24 py-16 max-w-[1400px] mx-auto">
        <h1 className="mb-10 text-4xl font-extrabold tracking-tight text-upsa-navy uppercase">Shopping Bag</h1>
        
        {cartItems.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center border border-dashed border-border/60 bg-white py-20 text-center">
            <ShoppingBag className="h-12 w-12 text-gray-300 mb-6" />
            <h3 className="text-2xl font-bold text-upsa-navy">Your bag is empty</h3>
            <p className="mt-4 text-gray-500 max-w-sm text-balance">
              Looks like you haven't added anything yet. Explore the marketplace to find what you need.
            </p>
            <Button asChild className="mt-10 rounded-none bg-upsa-navy h-14 px-10 font-bold uppercase tracking-widest text-white hover:bg-upsa-navy/90">
              <Link href="/mart/products">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-12 lg:grid-cols-3 items-start">
            <div className="lg:col-span-2">
              <div className="border-t border-border/40">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row items-center gap-8 py-8 border-b border-border/40">
                    <div className="h-40 w-32 flex-shrink-0 bg-muted relative">
                      <Image 
                        src={item.product.images?.[0]?.url || "/images/placeholder-product.jpg"} 
                        alt={item.product.name} 
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between py-2 w-full h-full">
                      <div className="flex justify-between items-start w-full gap-4">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{item.product.store?.name}</p>
                          <h3 className="font-extrabold text-xl text-upsa-navy leading-tight">{item.product.name}</h3>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-600 transition-colors">
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-8">
                        <div className="text-sm font-bold text-gray-500">QTY: {item.quantity}</div>
                        <div className="font-extrabold text-2xl text-upsa-navy">GHS {(item.product.discount_price ?? item.product.price).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-1 sticky top-32">
              <Card className="rounded-none border border-border/60 bg-white shadow-none">
                <CardHeader className="border-b border-border/40 pb-6">
                  <CardTitle className="text-xl font-extrabold text-upsa-navy uppercase">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="flex justify-between text-sm font-medium text-gray-600">
                    <span>Subtotal</span>
                    <span>GHS {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium text-gray-600">
                    <span>Delivery (On Campus)</span>
                    <span className="text-emerald-600 font-bold">FREE</span>
                  </div>
                  
                  <div className="space-y-3 pt-6 border-t border-border/40">
                    <label className="text-xs font-bold uppercase tracking-widest text-upsa-navy">Select Delivery Location</label>
                    <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                      <SelectTrigger className="w-full rounded-none border-border/60 h-12 focus:ring-0 focus:border-upsa-navy">
                        <SelectValue placeholder="Choose campus location" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        {locations.map((loc) => (
                          <SelectItem key={loc.id} value={loc.id} className="rounded-none">
                            {loc.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-between items-end pt-6 border-t border-border/40">
                    <span className="text-sm font-bold uppercase tracking-widest text-upsa-navy">Total</span>
                    <span className="text-3xl font-extrabold text-upsa-navy">GHS {subtotal.toFixed(2)}</span>
                  </div>
                </CardContent>
                <CardFooter className="pt-2 pb-8">
                  <Button 
                    className="w-full h-14 rounded-none bg-upsa-navy text-white hover:bg-upsa-navy/90 font-bold uppercase tracking-widest"
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                  >
                    {checkoutLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing</>
                    ) : (
                      <>Checkout <ArrowRight className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                </CardFooter>
              </Card>
              
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <span className="text-emerald-700 text-xs font-bold">✓</span>
                  </div>
                  100% Secure Checkout
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <span className="text-blue-700 text-xs font-bold">✓</span>
                  </div>
                  Pay on Delivery Available
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
