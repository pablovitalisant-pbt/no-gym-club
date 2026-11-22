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

// v2-23a: conexiones y chat.
export type ConnectionStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export interface CommunityConnection {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: ConnectionStatus;
  created_at: string;
  responded_at: string | null;
}

export interface CommunityMessage {
  id: string;
  connection_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

export interface ConnectionSummary {
  connection: CommunityConnection;
  otherUserId: string;
  lastMessage: CommunityMessage | null;
  unreadCount: number;
}

export interface ConnectionsOverview {
  received: ConnectionSummary[];
  sent: ConnectionSummary[];
  accepted: ConnectionSummary[];
}
