export type SellerStatus = 'none' | 'pending_verification' | 'verified' | 'trusted' | 'suspended' | 'rejected';
export type SellerType = 'student' | 'student_business' | 'campus_business' | 'external_approved';
export type ProductCondition = 'new' | 'like_new' | 'good' | 'fair' | 'used';
export type ProductStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'suspended';
export type PaymentMethod = 'pay_on_delivery';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'rejected' | 'disputed';
export type DeliveryZone = 'hostel' | 'academic_block' | 'library' | 'cafeteria' | 'student_centre' | 'admin_block' | 'business_school' | 'other';
export type ReportEntity = 'product' | 'store' | 'order' | 'review' | 'message';
export type ReportReason = 'scam' | 'fraud' | 'fake_product' | 'counterfeit' | 'inappropriate' | 'misleading' | 'harassment' | 'suspicious' | 'other';
export type ReportStatus = 'open' | 'investigating' | 'resolved' | 'dismissed';
export type NotificationType = 'order_status_changed' | 'product_approved' | 'product_rejected' | 'new_order' | 'low_stock' | 'new_review' | 'new_message';

export interface SellerDetails {
  id: string;
  profile_id: string;
  seller_type: SellerType;
  full_name: string;
  phone: string;
  index_number?: string | null;
  verified_at?: string | null;
  verified_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Store {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  description?: string | null;
  location?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  policies?: Record<string, any> | null;
  is_paused: boolean;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  category_id: string;
  slug: string;
  name: string;
  description?: string | null;
  price: number;
  discount_price?: number | null;
  condition: ProductCondition;
  stock_qty: number;
  reserved_qty: number;
  status: ProductStatus;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
  
  // Relations (useful when fetching joined data)
  store?: Store;
  category?: Category;
  images?: ProductImage[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  buyer_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;

  product?: Product;
}

export interface DeliveryLocation {
  id: string;
  zone: DeliveryZone;
  label: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  checkout_session_id: string;
  buyer_id: string;
  store_id: string;
  delivery_location_id: string;
  delivery_details?: Record<string, any> | null;
  subtotal: number;
  delivery_fee: number;
  discount_total: number;
  total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  status: OrderStatus;
  idempotency_key?: string | null;
  created_at: string;
  updated_at: string;

  items?: OrderItem[];
  store?: Store;
  delivery_location?: DeliveryLocation;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string | null;
  product_name_snapshot: string;
  unit_price_snapshot: number;
  discount_snapshot: number;
  quantity: number;
  created_at: string;
  updated_at: string;
}
