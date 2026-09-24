import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Ensure environment variables are loaded for the route
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Force dynamic if we're reading fresh marketplace data
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const store = searchParams.get('store');
    const q = searchParams.get('q'); // Search query
    
    // We use a regular anon client to fetch public products
    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase
      .from('products')
      .select(`
        *,
        store:store_id(*),
        category:category_id(*),
        images:product_images(*)
      `)
      .eq('status', 'approved');

    if (category) {
      query = query.eq('category_id', category);
    }
    
    if (store) {
      query = query.eq('store_id', store);
    }

    if (q) {
      // Postgres Full-Text Search on the search_vector column
      query = query.textSearch('search_vector', q, { config: 'english' });
    }

    const { data: products, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error("Products fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ products });
  } catch (error: any) {
    console.error("Unexpected error in /api/mart/products:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
