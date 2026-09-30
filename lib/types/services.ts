export type ServiceCategory = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
};

export type StudentService = {
  id: string;
  slug: string;
  category_id: string;
  name: string;
  description: string | null;
  location_label: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_whatsapp: string | null;
  website_url: string | null;
  hours: Record<string, string> | null;
  logo_url: string | null;
  is_featured: boolean;
  status: "active" | "inactive";
  last_verified_at: string;
  verified_by: string | null;
  created_by: string | null;
  search_vector?: any;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  category?: ServiceCategory;
};
