import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToggleGroup } from "radix-ui";
import { Check, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { needsInterestsOnboarding, type InterestsProfile } from "@/lib/interestsOnboarding";
import { patchMyInterests } from "@/lib/profilesApi";

const STEPS = [
  {
    key: "hobbies" as const,
    title: "What are your hobbies?",
    sub: "Pick everything that feels like you.",
    items: [
      { icon: "\u{1F3B8}", label: "Music" },
      { icon: "\u{1F3A8}", label: "Art & Design" },
      { icon: "\u{1F4F7}", label: "Photography" },
      { icon: "\u{270D}\u{FE0F}", label: "Writing" },
      { icon: "\u{1F3AE}", label: "Gaming" },
      { icon: "\u{1F3CB}\u{FE0F}", label: "Fitness" },
      { icon: "\u{1F9D8}", label: "Yoga" },
      { icon: "\u{1F3C4}", label: "Surfing" },
      { icon: "\u{1F6B4}", label: "Cycling" },
      { icon: "\u{1F33F}", label: "Gardening" },
      { icon: "\u{1F3AC}", label: "Filmmaking" },
      { icon: "\u{1F9E9}", label: "Puzzles" },
      { icon: "\u{1F3D5}\u{FE0F}", label: "Camping" },
      { icon: "\u{1F3AD}", label: "Theatre" },
      { icon: "\u{1F6F9}", label: "Skating" },
      { icon: "\u{1F9F6}", label: "Crafts" },
    ],
  },
  {
    key: "activities" as const,
    title: "What do you love doing?",
    sub: "Your go-to ways to spend free time.",
    items: [
      { icon: "\u{2708}\u{FE0F}", label: "Travelling" },
      { icon: "\u{1F4DA}", label: "Reading" },
      { icon: "\u{1F373}", label: "Cooking" },
      { icon: "\u{1F3A7}", label: "Listening to podcasts" },
      { icon: "\u{1F6CD}\u{FE0F}", label: "Shopping" },
      { icon: "\u{1F3B5}", label: "Going to concerts" },
      { icon: "\u{1F30D}", label: "Exploring cities" },
      { icon: "\u{1F91D}", label: "Volunteering" },
      { icon: "\u{1F3B2}", label: "Board games" },
      { icon: "\u{1F43E}", label: "Spending time with pets" },
      { icon: "\u{1F389}", label: "Hosting gatherings" },
      { icon: "\u{1F9EA}", label: "Experimenting & DIY" },
      { icon: "\u{1F3A4}", label: "Karaoke" },
      { icon: "\u{1F30A}", label: "Swimming" },
    ],
  },
  {
    key: "foods" as const,
    title: "Favourite foods?",
    sub: "Tell us what makes your taste buds happy.",
    items: [
      { icon: "\u{1F355}", label: "Pizza" },
      { icon: "\u{1F363}", label: "Sushi" },
      { icon: "\u{1F35C}", label: "Ramen" },
      { icon: "\u{1F32E}", label: "Tacos" },
      { icon: "\u{1F354}", label: "Burgers" },
      { icon: "\u{1F957}", label: "Salads" },
      { icon: "\u{1F35B}", label: "Curry" },
      { icon: "\u{1F969}", label: "Grilled meats" },
      { icon: "\u{1F9C6}", label: "Middle Eastern" },
      { icon: "\u{1F372}", label: "Stews & soups" },
      { icon: "\u{1F366}", label: "Ice cream" },
      { icon: "\u{1F950}", label: "Pastries & bakery" },
      { icon: "\u{1F371}", label: "Bento & bowl meals" },
      { icon: "\u{1F951}", label: "Healthy & clean eating" },
      { icon: "\u{1F35D}", label: "Pasta" },
      { icon: "\u{1F336}\u{FE0F}", label: "Spicy food" },
    ],
  },
  {
    key: "topics" as const,
    title: "What topics interest you?",
    sub: "Things you love to learn or talk about.",
    items: [
      { icon: "\u{1F4BB}", label: "Technology" },
      { icon: "\u{1F9EC}", label: "Science" },
      { icon: "\u{1F4B0}", label: "Finance & investing" },
      { icon: "\u{1F3AD}", label: "Culture & arts" },
      { icon: "\u{1F3DF}\u{FE0F}", label: "Sports" },
      { icon: "\u{1F331}", label: "Sustainability" },
      { icon: "\u{1F9E0}", label: "Psychology" },
      { icon: "\u{1F3DB}\u{FE0F}", label: "History" },
      { icon: "\u{1F680}", label: "Space & astronomy" },
      { icon: "\u{1F37D}\u{FE0F}", label: "Food & gastronomy" },
      { icon: "\u{1F4A1}", label: "Startups & business" },
      { icon: "\u{1F393}", label: "Education" },
      { icon: "\u{1F310}", label: "Politics & society" },
      { icon: "\u{2695}\u{FE0F}", label: "Health & wellness" },
    ],
  },
  {
    key: "travelStyle" as const,
    title: "How do you like to travel?",
    sub: "Pace, budget vibe, and what matters most on a trip.",
    items: [
      { icon: "\u{1F4B0}", label: "Budget-friendly" },
      { icon: "\u{2728}", label: "Comfort & splurge" },
      { icon: "\u{1F331}", label: "Slow travel" },
      { icon: "\u{26A1}", label: "Packed itinerary" },
      { icon: "\u{1F3E8}", label: "Boutique stays" },
      { icon: "\u{1F3EB}", label: "Hostels & social" },
      { icon: "\u{1F46A}", label: "Family-friendly" },
      { icon: "\u{1F9D6}", label: "Solo explorer" },
      { icon: "\u{1F3D4}\u{FE0F}", label: "Nature & outdoors" },
      { icon: "\u{1F3DB}\u{FE0F}", label: "Culture & museums" },
      { icon: "\u{1F37D}\u{FE0F}", label: "Food-first trips" },
      { icon: "\u{1F6CB}\u{FE0F}", label: "Plenty of downtime" },
    ],
  },
] as const;

const fontStack =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif";

function emptyProfile(): InterestsProfile {
  return { hobbies: [], activities: [], foods: [], topics: [], travelStyle: [] };
}

function skippedDefaultsProfile(): InterestsProfile {
  return {
    hobbies: [STEPS[0].items[0].label],
    activities: [STEPS[1].items[0].label],
    foods: [STEPS[2].items[0].label],
    topics: [STEPS[3].items[0].label],
    travelStyle: [STEPS[4].items[0].label],
  };
}

function InterestsPage() {
  const navigate = useNavigate();
  const { user, loading, refreshUser } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);
  const [selections, setSelections] = useState<InterestsProfile>(emptyProfile);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [done, setDone] = useState(false);
  const [celebIn, setCelebIn] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const navigatedRef = useRef(false);

  useEffect(() => {
    if (!done) { setCelebIn(false); return; }
    let cancelled = false;
    const id1 = requestAnimationFrame(() => {
      const id2 = requestAnimationFrame(() => {
        if (!cancelled) setCelebIn(true);
      });
      return () => cancelAnimationFrame(id2);
    });
    return () => { cancelled = true; cancelAnimationFrame(id1); };
  }, [done]);

  useEffect(() => {
    if (!celebIn) return;
    const t = setTimeout(() => setLeaving(true), 900);
    return () => clearTimeout(t);
  }, [celebIn]);

  useEffect(() => {
    if (!leaving || navigatedRef.current) return;
    const t = setTimeout(() => {
      navigatedRef.current = true;
      navigate("/home", { replace: true });
    }, 320);
    return () => clearTimeout(t);
  }, [leaving, navigate]);

  useEffect(() => {
    if (loading || !user || done) return;
    if (!needsInterestsOnboarding(user.interests)) {
      navigate("/home", { replace: true });
    }
  }, [loading, user, done, navigate]);

  const step = STEPS[stepIndex] ?? STEPS[0];
  const currentKey = step.key;
  const currentSelected = selections[currentKey];

  const setStepSelection = useCallback(
    (labels: string[]) => setSelections((prev) => ({ ...prev, [currentKey]: labels })),
    [currentKey],
  );

  const handleBack = () => {
    if (stepIndex <= 0) { navigate("/home", { replace: true }); return; }
    setStepIndex((i) => i - 1);
  };

  const handleSkip = async () => {
    if (saving || done) return;
    setSaving(true);
    setSaveError(null);
    try {
      await patchMyInterests(skippedDefaultsProfile());
      void refreshUser();
      navigate("/home", { replace: true });
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to skip onboarding");
    } finally {
      setSaving(false);
    }
  };

  const handleContinue = async () => {
    if (currentSelected.length < 1) return;
    if (stepIndex < STEPS.length - 1) { setStepIndex((i) => i + 1); return; }

    setSaving(true);
    setSaveError(null);
    try {
      await patchMyInterests(selections);
      void refreshUser();
      setDone(true);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save interests");
    } finally {
      setSaving(false);
    }
  };

  const canContinue = currentSelected.length >= 1;

  if (loading && !done && !user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-[#fafafa] dark:bg-[#0a0a0a] text-stone-600 dark:text-stone-400"
        style={{ fontFamily: fontStack }}
      >
        Loading…
      </div>
    );
  }

  const flat = [
    ...selections.hobbies,
    ...selections.activities,
    ...selections.foods,
    ...selections.topics,
    ...selections.travelStyle,
  ];

  return (
    <div
      className={cn(
        "relative min-h-screen overflow-hidden bg-[#fafafa] dark:bg-[#0a0a0a] text-stone-900 dark:text-stone-100",
        "transition-opacity duration-300 ease-out",
        leaving ? "opacity-0" : "opacity-100",
      )}
      style={{ fontFamily: fontStack }}
    >

      <div
        className={cn(
          "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          done
            ? "pointer-events-none opacity-0 blur-sm scale-[0.98]"
            : "opacity-100 blur-0 scale-100",
        )}
        aria-hidden={done}
      >
        <div className="mx-auto max-w-lg px-5 pt-10 pb-16 sm:pt-14">

          <div className="mb-10 flex gap-1">
            {STEPS.map((s, i) => (
              <div
                key={s.key}
                className={cn(
                  "h-[3px] flex-1 rounded-full transition-all duration-300 ease-out",
                  i < stepIndex ? "bg-black dark:bg-white" : "bg-stone-200 dark:bg-stone-700",
                )}
              />
            ))}
          </div>

          <div className="rounded-[28px] border border-black/6 dark:border-white/8 bg-white/80 dark:bg-white/5 backdrop-blur-2xl shadow-[0_12px_48px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_12px_48px_-16px_rgba(0,0,0,0.45)] px-6 py-8 sm:px-8 sm:py-10">

            <div className="mb-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1 text-[13px] font-medium text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
              <button
                type="button"
                onClick={() => void handleSkip()}
                disabled={saving || done}
                className={cn(
                  "text-[13px] font-medium transition-colors shrink-0",
                  "text-stone-400 hover:text-stone-700 dark:hover:text-stone-200",
                  "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-stone-400",
                )}
              >
                Skip for now
              </button>
            </div>

            <div key={step.key}>
              <h1 className="text-[26px] sm:text-[28px] font-semibold tracking-tight leading-tight text-balance">
                {step.title}
              </h1>
              <p className="mt-2 text-[15px] text-stone-500 dark:text-stone-400 leading-relaxed">
                {step.sub}
              </p>

              <ToggleGroup.Root
                type="multiple"
                className="mt-8 flex flex-wrap gap-2.5"
                value={currentSelected}
                onValueChange={setStepSelection}
              >
                {step.items.map((item) => (
                  <ToggleGroup.Item
                    key={item.label}
                    value={item.label}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-[14px] font-medium",
                      "outline-none transition-all duration-200",
                      "border-stone-200/90 bg-white/90 text-stone-800",
                      "dark:border-stone-600 dark:bg-white/[0.07] dark:text-stone-100",
                      "hover:border-stone-300 dark:hover:border-stone-500",
                      "focus-visible:ring-2 focus-visible:ring-black/20 dark:focus-visible:ring-white/25",
                      "data-[state=on]:border-black data-[state=on]:bg-black data-[state=on]:text-white",
                      "dark:data-[state=on]:border-white dark:data-[state=on]:bg-white dark:data-[state=on]:text-black",
                    )}
                  >
                    <span className="text-[16px] leading-none" aria-hidden>{item.icon}</span>
                    {item.label}
                  </ToggleGroup.Item>
                ))}
              </ToggleGroup.Root>
            </div>

            {saveError && (
              <p className="mt-6 text-sm text-red-600 dark:text-red-400" role="alert">
                {saveError}
              </p>
            )}

            <p className="mt-4 text-center text-[12px] text-stone-400 dark:text-stone-500">
              Skip saves light defaults; you can change them anytime in Settings.
            </p>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                disabled={!canContinue || saving}
                onClick={handleContinue}
                className={cn(
                  "rounded-full px-8 py-3 text-[15px] font-semibold transition-all duration-200",
                  "bg-black text-white dark:bg-white dark:text-black",
                  "disabled:opacity-35 disabled:cursor-not-allowed",
                  "hover:opacity-90 active:scale-[0.98]",
                )}
              >
                {saving ? "Saving…" : stepIndex >= STEPS.length - 1 ? "Save" : "Continue"}
              </button>
            </div>

          </div>
        </div>
      </div>

      {done && (
        <div
          className={cn(
            "absolute inset-0 z-10 flex flex-col items-center justify-center px-6",
            "bg-[#fafafa]/80 dark:bg-[#0a0a0a]/85 backdrop-blur-[2px]",
            "transition-opacity duration-300 ease-out",
            celebIn ? "opacity-100" : "opacity-0",
          )}
          aria-live="polite"
        >
          <div
            className={cn(
              "w-full max-w-md rounded-[28px] border border-black/5 dark:border-white/10",
              "bg-white/90 dark:bg-white/8 backdrop-blur-xl",
              "shadow-[0_8px_40px_-12px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)]",
              "px-8 py-10 text-center",
              "transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
              celebIn
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-4 scale-[0.97]",
            )}
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black">
              <Check className="h-8 w-8" strokeWidth={2.5} />
            </div>

            <h2 className="text-xl font-semibold text-stone-900 dark:text-white tracking-tight">
              You&apos;re all set
            </h2>
            <p className="mt-2 text-[15px] text-stone-500 dark:text-stone-400">
              Taking you home…
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {flat.slice(0, 12).map((label, i) => (
                <span
                  key={`${i}-${label}`}
                  className="rounded-full border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-white/5 px-3 py-1 text-[12px] font-medium text-stone-700 dark:text-stone-200"
                >
                  {label}
                </span>
              ))}
              {flat.length > 12 && (
                <span className="rounded-full px-3 py-1 text-[12px] text-stone-400">
                  +{flat.length - 12} more
                </span>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default InterestsPage;
