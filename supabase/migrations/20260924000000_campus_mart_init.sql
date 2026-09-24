-- Campus Mart Phase 1 Migration (Moved to Public Schema)

-- 1. Define Enums

-- seller_status (already in public)
DO $$ BEGIN
    CREATE TYPE public.seller_status AS ENUM ('none', 'pending_verification', 'verified', 'trusted', 'suspended', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Mart enums in public
DO $$ BEGIN
    CREATE TYPE public.seller_type AS ENUM ('student', 'student_business', 'campus_business', 'external_approved');
    CREATE TYPE public.product_condition AS ENUM ('new', 'like_new', 'good', 'fair', 'used');
    CREATE TYPE public.product_status AS ENUM ('draft', 'pending_review', 'approved', 'rejected', 'suspended');
    CREATE TYPE public.payment_method AS ENUM ('pay_on_delivery');
    CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded', 'cancelled');
    CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'processing', 'ready', 'out_for_delivery', 'delivered', 'cancelled', 'rejected', 'disputed');
    CREATE TYPE public.delivery_zone AS ENUM ('hostel', 'academic_block', 'library', 'cafeteria', 'student_centre', 'admin_block', 'business_school', 'other');
    CREATE TYPE public.report_entity AS ENUM ('product', 'store', 'order', 'review', 'message');
    CREATE TYPE public.report_reason AS ENUM ('scam', 'fraud', 'fake_product', 'counterfeit', 'inappropriate', 'misleading', 'harassment', 'suspicious', 'other');
    CREATE TYPE public.report_status AS ENUM ('open', 'investigating', 'resolved', 'dismissed');
    CREATE TYPE public.notification_type AS ENUM ('order_status_changed', 'product_approved', 'product_rejected', 'new_order', 'low_stock', 'new_review', 'new_message');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Extend profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_seller BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS seller_status public.seller_status DEFAULT 'none',
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 3. Create tables

-- 3.1 seller_details
CREATE TABLE IF NOT EXISTS public.seller_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    seller_type public.seller_type NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    index_number TEXT,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2 stores
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    logo_url TEXT,
    banner_url TEXT,
    policies JSONB DEFAULT '{}'::jsonb,
    is_paused BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.3 product_categories (renamed from categories to avoid collision with article categories)
CREATE TABLE IF NOT EXISTS public.product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.4 products
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.product_categories(id),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    price INT NOT NULL CHECK (price >= 0),
    discount_price INT CHECK (discount_price >= 0 AND discount_price < price),
    condition public.product_condition NOT NULL,
    stock_qty INT DEFAULT 0 CHECK (stock_qty >= 0),
    reserved_qty INT DEFAULT 0 CHECK (reserved_qty >= 0 AND reserved_qty <= stock_qty),
    status public.product_status DEFAULT 'pending_review',
    search_vector TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))) STORED,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS products_search_idx ON public.products USING GIN (search_vector);

-- 3.5 product_images
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.6 cart_items
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(buyer_id, product_id)
);

-- 3.7 delivery_locations
CREATE TABLE IF NOT EXISTS public.delivery_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone public.delivery_zone NOT NULL,
    label TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.8 orders
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 100000;
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL DEFAULT ('VOU-' || to_char(CURRENT_DATE, 'YYYY') || '-' || nextval('public.order_number_seq')::TEXT),
    checkout_session_id UUID NOT NULL,
    buyer_id UUID NOT NULL REFERENCES public.profiles(id),
    store_id UUID NOT NULL REFERENCES public.stores(id),
    delivery_location_id UUID NOT NULL REFERENCES public.delivery_locations(id),
    delivery_details JSONB DEFAULT '{}'::jsonb,
    subtotal INT NOT NULL,
    delivery_fee INT NOT NULL DEFAULT 0,
    discount_total INT NOT NULL DEFAULT 0,
    total INT NOT NULL,
    payment_method public.payment_method DEFAULT 'pay_on_delivery',
    payment_status public.payment_status DEFAULT 'pending',
    status public.order_status DEFAULT 'pending',
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.9 order_items
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name_snapshot TEXT NOT NULL,
    unit_price_snapshot INT NOT NULL,
    discount_snapshot INT DEFAULT 0,
    quantity INT NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.10 order_status_history
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    from_status public.order_status,
    to_status public.order_status NOT NULL,
    note TEXT,
    changed_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.11 product_reviews
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id),
    buyer_id UUID NOT NULL REFERENCES public.profiles(id),
    target_id UUID NOT NULL REFERENCES public.products(id),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    image_urls TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(order_id, buyer_id, target_id)
);

-- 3.12 seller_reviews
CREATE TABLE IF NOT EXISTS public.seller_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id),
    buyer_id UUID NOT NULL REFERENCES public.profiles(id),
    target_id UUID NOT NULL REFERENCES public.stores(id),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    image_urls TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(order_id, buyer_id, target_id)
);

-- 3.13 conversations
CREATE TABLE IF NOT EXISTS public.mart_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES public.profiles(id),
    store_id UUID NOT NULL REFERENCES public.stores(id),
    product_id UUID REFERENCES public.products(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.14 messages
CREATE TABLE IF NOT EXISTS public.mart_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.mart_conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id),
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.15 notifications
CREATE TABLE IF NOT EXISTS public.mart_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type public.notification_type NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.16 reports
CREATE TABLE IF NOT EXISTS public.mart_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id),
    entity_type public.report_entity NOT NULL,
    entity_id UUID NOT NULL,
    reason public.report_reason NOT NULL,
    details TEXT,
    status public.report_status DEFAULT 'open',
    resolution_note TEXT,
    resolved_by UUID REFERENCES public.profiles(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.17 audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Order status transition rule (enforced by trigger)
CREATE OR REPLACE FUNCTION public.validate_order_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- Admins overriding to disputed
    IF NEW.status = 'disputed' THEN
        RETURN NEW;
    END IF;

    IF OLD.status = 'pending' AND NEW.status IN ('confirmed', 'cancelled') THEN
        RETURN NEW;
    ELSIF OLD.status = 'confirmed' AND NEW.status IN ('processing', 'cancelled') THEN
        RETURN NEW;
    ELSIF OLD.status = 'processing' AND NEW.status = 'ready' THEN
        RETURN NEW;
    ELSIF OLD.status = 'ready' AND NEW.status = 'out_for_delivery' THEN
        RETURN NEW;
    ELSIF OLD.status = 'out_for_delivery' AND NEW.status = 'delivered' THEN
        RETURN NEW;
    END IF;

    RAISE EXCEPTION 'Invalid order status transition from % to %', OLD.status, NEW.status;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_order_status_transition ON public.orders;
CREATE TRIGGER enforce_order_status_transition
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.validate_order_status_transition();

-- 5. Enable RLS
ALTER TABLE public.seller_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mart_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mart_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mart_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mart_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 6. Basic RLS Policies

-- Helper function for admin check
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.1 seller_details
DROP POLICY IF EXISTS "Sellers can view own details" ON public.seller_details;
CREATE POLICY "Sellers can view own details" ON public.seller_details FOR SELECT USING (auth.uid() = profile_id OR public.is_admin());

DROP POLICY IF EXISTS "Sellers can update own details" ON public.seller_details;
CREATE POLICY "Sellers can update own details" ON public.seller_details FOR UPDATE USING (auth.uid() = profile_id OR public.is_admin());

DROP POLICY IF EXISTS "Sellers can insert own details" ON public.seller_details;
CREATE POLICY "Sellers can insert own details" ON public.seller_details FOR INSERT WITH CHECK (auth.uid() = profile_id OR public.is_admin());

-- 6.2 stores
DROP POLICY IF EXISTS "Stores are readable by public if not deleted" ON public.stores;
CREATE POLICY "Stores are readable by public if not deleted" ON public.stores FOR SELECT USING (deleted_at IS NULL OR auth.uid() = owner_id OR public.is_admin());

DROP POLICY IF EXISTS "Sellers can manage own stores" ON public.stores;
CREATE POLICY "Sellers can manage own stores" ON public.stores FOR ALL USING (auth.uid() = owner_id OR public.is_admin());

-- 6.3 product_categories
DROP POLICY IF EXISTS "Categories are readable by public" ON public.product_categories;
CREATE POLICY "Categories are readable by public" ON public.product_categories FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage categories" ON public.product_categories;
CREATE POLICY "Admins can manage categories" ON public.product_categories FOR ALL USING (public.is_admin());

-- 6.4 products
DROP POLICY IF EXISTS "Products are readable by public if approved" ON public.products;
CREATE POLICY "Products are readable by public if approved" ON public.products FOR SELECT USING (
  (status = 'approved' AND deleted_at IS NULL) 
  OR store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()) 
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Sellers can manage own products" ON public.products;
CREATE POLICY "Sellers can manage own products" ON public.products FOR ALL USING (
  store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()) 
  OR public.is_admin()
);

-- 6.5 product_images
DROP POLICY IF EXISTS "Product images are readable by public" ON public.product_images;
CREATE POLICY "Product images are readable by public" ON public.product_images FOR SELECT USING (
  product_id IN (SELECT id FROM public.products WHERE status = 'approved' AND deleted_at IS NULL)
  OR product_id IN (SELECT p.id FROM public.products p JOIN public.stores s ON p.store_id = s.id WHERE s.owner_id = auth.uid())
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Sellers can manage own product images" ON public.product_images;
CREATE POLICY "Sellers can manage own product images" ON public.product_images FOR ALL USING (
  product_id IN (SELECT p.id FROM public.products p JOIN public.stores s ON p.store_id = s.id WHERE s.owner_id = auth.uid())
  OR public.is_admin()
);

-- 6.6 cart_items
DROP POLICY IF EXISTS "Users can manage own cart" ON public.cart_items;
CREATE POLICY "Users can manage own cart" ON public.cart_items FOR ALL USING (buyer_id = auth.uid());

-- 6.7 delivery_locations
DROP POLICY IF EXISTS "Delivery locations are readable by public" ON public.delivery_locations;
CREATE POLICY "Delivery locations are readable by public" ON public.delivery_locations FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage delivery locations" ON public.delivery_locations;
CREATE POLICY "Admins can manage delivery locations" ON public.delivery_locations FOR ALL USING (public.is_admin());

-- 6.8 orders
DROP POLICY IF EXISTS "Buyers can view own orders" ON public.orders;
CREATE POLICY "Buyers can view own orders" ON public.orders FOR SELECT USING (buyer_id = auth.uid() OR store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Buyers can create own orders" ON public.orders;
CREATE POLICY "Buyers can create own orders" ON public.orders FOR INSERT WITH CHECK (buyer_id = auth.uid());

DROP POLICY IF EXISTS "Sellers and buyers can update orders" ON public.orders;
CREATE POLICY "Sellers and buyers can update orders" ON public.orders FOR UPDATE USING (
  buyer_id = auth.uid() 
  OR store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()) 
  OR public.is_admin()
);

-- 6.9 order_items
DROP POLICY IF EXISTS "Order items are readable by buyer and seller" ON public.order_items;
CREATE POLICY "Order items are readable by buyer and seller" ON public.order_items FOR SELECT USING (
  order_id IN (SELECT id FROM public.orders WHERE buyer_id = auth.uid() OR store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()) OR public.is_admin())
);

DROP POLICY IF EXISTS "Buyers can create order items" ON public.order_items;
CREATE POLICY "Buyers can create order items" ON public.order_items FOR INSERT WITH CHECK (
  order_id IN (SELECT id FROM public.orders WHERE buyer_id = auth.uid())
);

-- 6.10 order_status_history
DROP POLICY IF EXISTS "Status history is readable by buyer and seller" ON public.order_status_history;
CREATE POLICY "Status history is readable by buyer and seller" ON public.order_status_history FOR SELECT USING (
  order_id IN (SELECT id FROM public.orders WHERE buyer_id = auth.uid() OR store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()) OR public.is_admin())
);

DROP POLICY IF EXISTS "Insert-only for status history" ON public.order_status_history;
CREATE POLICY "Insert-only for status history" ON public.order_status_history FOR INSERT WITH CHECK (
  order_id IN (SELECT id FROM public.orders WHERE buyer_id = auth.uid() OR store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()) OR public.is_admin())
);

-- 6.11 product_reviews / seller_reviews
DROP POLICY IF EXISTS "Reviews are public" ON public.product_reviews;
CREATE POLICY "Reviews are public" ON public.product_reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Buyers can create reviews" ON public.product_reviews;
CREATE POLICY "Buyers can create reviews" ON public.product_reviews FOR INSERT WITH CHECK (buyer_id = auth.uid());

DROP POLICY IF EXISTS "Seller Reviews are public" ON public.seller_reviews;
CREATE POLICY "Seller Reviews are public" ON public.seller_reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Buyers can create seller reviews" ON public.seller_reviews;
CREATE POLICY "Buyers can create seller reviews" ON public.seller_reviews FOR INSERT WITH CHECK (buyer_id = auth.uid());

-- 6.12 conversations / messages
DROP POLICY IF EXISTS "Conversations readable by participants" ON public.mart_conversations;
CREATE POLICY "Conversations readable by participants" ON public.mart_conversations FOR SELECT USING (buyer_id = auth.uid() OR store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Participants can create conversations" ON public.mart_conversations;
CREATE POLICY "Participants can create conversations" ON public.mart_conversations FOR INSERT WITH CHECK (buyer_id = auth.uid() OR store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Messages readable by participants" ON public.mart_messages;
CREATE POLICY "Messages readable by participants" ON public.mart_messages FOR SELECT USING (
  conversation_id IN (SELECT id FROM public.mart_conversations WHERE buyer_id = auth.uid() OR store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()) OR public.is_admin())
);

DROP POLICY IF EXISTS "Participants can send messages" ON public.mart_messages;
CREATE POLICY "Participants can send messages" ON public.mart_messages FOR INSERT WITH CHECK (sender_id = auth.uid());

-- 6.13 notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.mart_notifications;
CREATE POLICY "Users can view own notifications" ON public.mart_notifications FOR SELECT USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON public.mart_notifications;
CREATE POLICY "Users can update own notifications" ON public.mart_notifications FOR UPDATE USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "System can insert notifications" ON public.mart_notifications;
CREATE POLICY "System can insert notifications" ON public.mart_notifications FOR INSERT WITH CHECK (public.is_admin());

-- 6.14 reports
DROP POLICY IF EXISTS "Users can view own reports" ON public.mart_reports;
CREATE POLICY "Users can view own reports" ON public.mart_reports FOR SELECT USING (reporter_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users can create reports" ON public.mart_reports;
CREATE POLICY "Users can create reports" ON public.mart_reports FOR INSERT WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS "Admins can update reports" ON public.mart_reports;
CREATE POLICY "Admins can update reports" ON public.mart_reports FOR UPDATE USING (public.is_admin());

-- 6.15 audit_logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- 7. Seeds
INSERT INTO public.delivery_locations (zone, label) VALUES 
('hostel', 'UPSA Hostel 1'),
('hostel', 'UPSA Hostel 2'),
('academic_block', 'LBS Block'),
('library', 'Main Library'),
('cafeteria', 'Student Cafeteria'),
('student_centre', 'Student Centre'),
('admin_block', 'Admin Block'),
('other', 'Other Campus Location')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_categories (name, slug, sort_order) VALUES 
('Books & Supplies', 'books-supplies', 1),
('Electronics', 'electronics', 2),
('Food & Drinks', 'food-drinks', 3),
('Clothing', 'clothing', 4),
('Services', 'services', 5),
('Other', 'other', 6)
ON CONFLICT (slug) DO NOTHING;
