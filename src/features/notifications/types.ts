/** UI category derived from friends-service NOTIFY_TYPES and similar. */
export type NotificationType =
  | "friend_request"
  | "message"
  | "achievement"
  | "system";

export interface Notification {
  id: string;
  /** UI category for styling. */
  type: NotificationType;
  /** Raw type string from API (e.g. FRIEND_REQUEST_RECEIVED). */
  backendType: string;
  title: string;
  body: string;
  timestamp: Date;
  read: boolean;
  avatar?: string;
  actionUrl?: string;
}
