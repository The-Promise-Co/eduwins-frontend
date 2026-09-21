export interface ChatUser {
  id: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string | null;
  role?: string;
}

export interface ConversationParticipant extends ChatUser {
  email?: string;
  lastReadAt?: string | null;
  isMuted?: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  attachmentUrl?: string | null;
  flagged?: boolean;
  flaggedReason?: string | null;
  createdAt: string;
  updatedAt?: string;
  sender?: ChatUser;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  status: 'pending' | 'accepted' | 'declined';
  title?: string | null;
  createdAt: string;
  updatedAt: string;
  participants: ConversationParticipant[];
  lastMessage?: Message | null;
  unreadCount?: number;
}
