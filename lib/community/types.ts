export interface OwnCommunityProfile {
  is_public: boolean;
  comuna: string | null;
  bio: string | null;
  show_photo: boolean;
  show_level: boolean;
  show_goal: boolean;
  geo_lat: number | null;
  geo_lng: number | null;
}

export interface CommunityPerson {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  level: string | null;
  primary_goal: string | null;
  focus_areas: string[] | null;
  comuna: string | null;
  bio: string | null;
  distance_km: number | null;
}
