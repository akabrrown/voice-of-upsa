export type GalleryAlbumCategory = 'events' | 'sports' | 'academics' | 'campus_life' | 'clubs_societies';
export type GalleryAlbumStatus = 'draft' | 'published';
export type GalleryPhotoSource = 'admin' | 'submission';
export type GalleryPhotoStatus = 'pending_review' | 'approved' | 'rejected' | 'withdrawn';

export interface GalleryAlbum {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: GalleryAlbumCategory;
  event_date: string | null;
  cover_photo_id: string | null;
  submissions_open: boolean;
  status: GalleryAlbumStatus;
  is_featured: boolean;
  created_by: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GalleryPhoto {
  id: string;
  album_id: string;
  image_url: string;
  caption: string | null;
  source: GalleryPhotoSource;
  submitted_by: string | null;
  consent_confirmed: boolean;
  status: GalleryPhotoStatus;
  sort_order: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlbumWithCover extends GalleryAlbum {
  cover_photo?: {
    image_url: string;
  } | null;
  photos?: { count: number }[];
}

export interface PhotoWithAuthor extends GalleryPhoto {
  profiles?: {
    full_name: string;
    avatar_url: string | null;
  } | null;
}
