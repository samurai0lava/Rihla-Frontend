/** Last place a friend checked in / saved (from fav-places or mock). */
export interface FriendLastVisited {
  name: string;
  image?: string;
  city: string;
}

export interface Friend {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  isOnline: boolean;
  bio?: string;
  /** Origin / home city */
  city?: string;
  email?: string;
  status?: string;
  placesVisited?: number;
  friendsCount?: number;
  lastVisited?: FriendLastVisited;
  /** Flat interest labels (same vocabulary as onboarding chips). */
  interests?: string[];
}

export interface PendingFriendRequest {
  id: string;
  name: string;
  username: string;
  avatar?: string;
}

/** Outgoing friend request (same display fields plus target user for cancel/sync). */
export interface OutgoingFriendRequest extends PendingFriendRequest {
  toUserId: string;
}

/** Discover tab suggestion (not yet a friend). */
export interface SuggestedStudent {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  city?: string;
  interests: string[];
}
