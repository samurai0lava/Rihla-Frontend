import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type GlassToastVariant = "default" | "success" | "error";

export interface GlassToastInput {
  title: string;
  body?: string | undefined;
  variant?: GlassToastVariant | undefined;
  /** 0 = no auto-dismiss */
  durationMs?: number | undefined;
  onClick?: (() => void) | undefined;
}

export interface GlassToastItem extends Required<Pick<GlassToastInput, "title">> {
  id: string;
  body?: string | undefined;
  variant: GlassToastVariant;
  onClick?: (() => void) | undefined;
}

interface GlassToastContextValue {
  showToast: (input: GlassToastInput) => () => void;
  dismissToast: (id: string) => void;
  toasts: GlassToastItem[];
}

const GlassToastContext = createContext<GlassToastContextValue | null>(null);

const MAX_VISIBLE = 4;
const DEFAULT_DURATION_MS = 5_000;

export function GlassToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<GlassToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (input: GlassToastInput) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const item: GlassToastItem = {
        id,
        title: input.title,
        body: input.body,
        variant: input.variant ?? "default",
        onClick: input.onClick,
      };
      const durationMs = input.durationMs ?? DEFAULT_DURATION_MS;

      setToasts((prev) => [...prev.slice(-(MAX_VISIBLE - 1)), item]);

      if (durationMs > 0) {
        window.setTimeout(() => dismissToast(id), durationMs);
      }

      return () => dismissToast(id);
    },
    [dismissToast],
  );

  const value = useMemo(
    () => ({ showToast, dismissToast, toasts }),
    [showToast, dismissToast, toasts],
  );

  return (
    <GlassToastContext.Provider value={value}>
      {children}
    </GlassToastContext.Provider>
  );
}

export function useGlassToast(): GlassToastContextValue {
  const ctx = useContext(GlassToastContext);
  if (!ctx) {
    throw new Error("useGlassToast must be used within GlassToastProvider");
  }
  return ctx;
}
