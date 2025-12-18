export interface LocationData {
  id?: number;
  latitude: number;
  longitude: number;
  timestamp: string;
  address?: string;
  synced?: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'anonymous';
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

export interface Material {
  id: number;
  title: string;
  content: string;
  video_url?: string;
  poster_url?: string;
  poster_link?: string;
  description: string;
  type: 'article' | 'video_education' | 'video_podcast' | 'poster';
  status: 'draft' | 'published';
  author_id: number;
  author_name: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: number;
  content: string;
  sender: User;
  sender_id?: number;
  sender_name?: string;
  sender_role?: string;
  timestamp: Date | string;
  created_at?: string;
  room_id: string;
}

export interface ChatRoom {
  id: string;
  user_name: string;
  message_count: number;
  last_message_at: string;
  first_message_at: string;
}
