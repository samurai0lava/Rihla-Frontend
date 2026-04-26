import { Bell } from "lucide-react";

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="h-16 w-16 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-4">
        <Bell className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">
        No notifications yet
      </h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">
        When you get notifications, they'll show up here.
      </p>
    </div>
  );
}

export default EmptyState;
