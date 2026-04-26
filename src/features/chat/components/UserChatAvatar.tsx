import ChatAvatar from "./ChatAvatar";
import type { ChatUser } from "../types";

interface UserChatAvatarProps {
  currentUser: ChatUser;
}

function UserChatAvatar({ currentUser }: UserChatAvatarProps) {
  return (
    <div className="flex shrink-0 flex-col items-center border-b border-border/40 pb-3 pt-1">
      <ChatAvatar
        src={currentUser.avatar}
        name={currentUser.name}
        size="lg"
        isOnline={currentUser.isOnline}
      />
      <h2 className="mt-2 line-clamp-2 max-w-[12rem] text-center text-sm font-bold text-foreground">
        {currentUser.name}
      </h2>
    </div>
  );
}

export default UserChatAvatar;
