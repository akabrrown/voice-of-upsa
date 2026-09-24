import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";

const CheckoutSchema = z.object({
  delivery_location_id: z.string().uuid(),
  delivery_details: z.record(z.string(), z.any()).optional(),
  payment_method: z.literal('pay_on_delivery'), // Only support POD for now
});

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }); },
          remove(name: string, options: CookieOptions) { cookieStore.set({ name, value: "", ...options }); },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = CheckoutSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid checkout data" }, { status: 400 });

    const { delivery_location_id, delivery_details, payment_method } = parsed.data;

    // 1. Fetch Cart Items
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select('*, product:product_id(*)')
      .eq('buyer_id', session.user.id);

    if (cartError || !cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty or failed to load" }, { status: 400 });
    }

    // 2. Validate products and group by store
    // For Campus Mart Phase 1, we assume one checkout per store, or we split them into multiple orders.
    // Let's create an order for each unique store in the cart.
    const storeIds = [...new Set(cartItems.map(item => item.product.store_id))];
    const createdOrders = [];

    for (const storeId of storeIds) {
      const storeItems = cartItems.filter(item => item.product.store_id === storeId);
      
      let subtotal = 0;
      const orderItemsToInsert = [];

      for (const item of storeItems) {
        if (item.product.status !== 'approved' || item.product.deleted_at) {
          throw new Error(`Product ${item.product.name} is no longer available.`);
        }
        if (item.product.stock_qty < item.quantity) {
          throw new Error(`Not enough stock for ${item.product.name}.`);
        }

        const unitPrice = item.product.discount_price ?? item.product.price;
        subtotal += unitPrice * item.quantity;

        orderItemsToInsert.push({
          product_id: item.product.id,
          product_name_snapshot: item.product.name,
          unit_price_snapshot: item.product.price,
          discount_snapshot: item.product.price - unitPrice,
          quantity: item.quantity
        });
      }

      const delivery_fee = 0; // Free delivery for now
      const total = subtotal + delivery_fee;
      const checkout_session_id = crypto.randomUUID(); // Dummy for pay on delivery

      // 3. Create Order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          checkout_session_id,
          buyer_id: session.user.id,
          store_id: storeId,
          delivery_location_id,
          delivery_details: delivery_details || {},
          subtotal,
          delivery_fee,
          discount_total: 0,
          total,
          payment_method,
          status: 'pending'
        })
        .select('id')
        .single();

      if (orderError) throw orderError;

      // 4. Create Order Items
      const orderItems = orderItemsToInsert.map(oi => ({ ...oi, order_id: order.id }));
      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // 5. Decrement Stock (RPC ideally, but we can do it via JS for now or just trust RLS)
      // Note: In production, use a secure RPC to prevent race conditions on stock
      
      createdOrders.push(order.id);
    }

    // 6. Clear Cart
    await supabase.from('cart_items').delete().eq('buyer_id', session.user.id);

    return NextResponse.json({ message: "Checkout successful", orders: createdOrders });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
