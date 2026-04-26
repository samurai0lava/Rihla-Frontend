import { Link } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";

export type AcceptTermsProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Unique id when multiple forms exist on one page */
  id?: string;
};

function AcceptTerms({
  checked,
  onCheckedChange,
  id = "accept-terms",
}: AcceptTermsProps) {
  return (
    <div className="flex gap-2.5">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        className="mt-0.5 size-4 shrink-0 self-start"
      />
      {/* Native label (not shadcn Label): its flex layout broke baseline alignment with the link */}
      <label
        htmlFor={id}
        className="min-w-0 cursor-pointer select-none text-sm font-normal leading-snug text-gray-600 dark:text-gray-400"
      >
        <span className="inline leading-snug">
          I accept the{" "}
          <Link
            to="/privacy"
            className="font-medium text-primary underline decoration-primary/80 underline-offset-[3px] transition-colors hover:text-primary/90 [text-decoration-skip-ink:none]"
            onClick={(e) => e.stopPropagation()}
          >
            Privacy Policy
          </Link>
          .
        </span>
      </label>
    </div>
  );
}

export default AcceptTerms;
