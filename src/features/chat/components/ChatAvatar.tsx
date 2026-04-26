import { memo, useState } from "react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatAvatarProps {
  src?: string | undefined;
  name: string;
  size?: "sm" | "md" | "lg" | "xl" | undefined;
  isOnline?: boolean | undefined;
  className?: string | undefined;
}

const sizeClasses = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-14 w-14",
  xl: "h-24 w-24",
} as const;

const textSizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-2xl",
} as const;

const iconSizeClasses = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-7 w-7",
  xl: "h-10 w-10",
} as const;

function ChatAvatar({
  src,
  name,
  size = "md",
  className,
}: ChatAvatarProps) {
  const [imgError, setImgError] = useState(false);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const showImage = src && !imgError;

  return (
    <div className={cn("relative shrink-0", className)}>
      <div
        className={cn(
          "rounded-full overflow-hidden bg-purple-100 dark:bg-zinc-700",
          "flex items-center justify-center",
          sizeClasses[size]
        )}
      >
        {showImage ? (
          <img
            src={src}
            alt={name}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <span
            className={cn(
              "font-semibold text-purple-500 dark:text-purple-300",
              textSizeClasses[size]
            )}
          >
            {initials || <User className={iconSizeClasses[size]} />}
          </span>
        )}
      </div>
    </div>
  );
}

export default memo(ChatAvatar);
