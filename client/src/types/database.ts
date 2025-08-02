// Database types that convert null to undefined for better TypeScript handling
export interface Collection {
  id: string;
  title: string;
  description?: string;
  is_public: boolean;
  price: number;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
  creator_id: string;
  post_count?: number;
}

export interface Post {
  id: string;
  title?: string;
  content_type: string;
  thumbnail_url?: string;
  created_at: string;
}

export interface LiveStream {
  id: string;
  title: string;
  description?: string;
  creator_id?: string;
  is_active?: boolean;
  viewer_count?: number;
  scheduled_start?: string;
  actual_start?: string;
  actual_end?: string;
  max_viewers?: number;
  total_tips?: number;
  created_at?: string;
  updated_at?: string;
  thumbnail_url?: string;
  stream_key?: string;
  rtmp_url?: string;
  hls_url?: string;
}