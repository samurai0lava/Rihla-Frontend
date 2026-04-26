import "./HeroSection.css";
import DiscoverBtn from "./shared/DiscoverBtn";
import RihlaLogo from "../assets/white-logo-rihla.svg";
import { ShieldCheck, Zap, Headset, Code2 } from "lucide-react";
import { useEffect, useRef } from "react";

function HeroSection() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    let raf = 0;
    const getScrollParent = (node: HTMLElement) => {
      let cur: HTMLElement | null = node.parentElement;
      while (cur) {
        const style = window.getComputedStyle(cur);
        const overflowY = style.overflowY;
        const canScroll =
          (overflowY === "auto" || overflowY === "scroll") &&
          cur.scrollHeight > cur.clientHeight;
        if (canScroll) return cur;
        cur = cur.parentElement;
      }
      return window;
    };

    const scrollParent = getScrollParent(el);

    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;

      const raw = (vh - rect.bottom) / vh;
      const progress = Math.max(0, Math.min(1, raw));

      const shiftPx = Math.round(progress * 48);
      el.style.setProperty("--hero-fade-shift", `${shiftPx}px`);
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    update();
    if (scrollParent === window) {
      window.addEventListener("scroll", onScroll, { passive: true });
    } else {
      scrollParent.addEventListener("scroll", onScroll, { passive: true });
    }
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      if (scrollParent === window) {
        window.removeEventListener("scroll", onScroll);
      } else {
        scrollParent.removeEventListener("scroll", onScroll);
      }
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section ref={sectionRef} className="hero-section">
      <div className="hero-overlay" />
      <div className="hero-bottom-fade" aria-hidden="true" />

      <div className="hero-shell">
        <div className="hero-top">
          <div className="hero-logo-wrap" aria-hidden="true">
            <img src={RihlaLogo} alt="" className="hero-logo" />
          </div>

          <div className="hero-copy">
            <h1 className="hero-title">
              Make your next trip feel effortless,
              <br />
              with <span className="hero-accent">RIHLA</span>.
            </h1>

            <p className="hero-subtitle">
              Discover cities, build itineraries, and connect with travelers—everything in one place.
            </p>

            <div className="hero-actions">
              <DiscoverBtn />
            </div>
          </div>
        </div>

        <div className="hero-cards" role="list" aria-label="Highlights">
          <div className="hero-card" role="listitem">
            <div className="hero-card-icon" aria-hidden="true">
              <ShieldCheck size={22} />
            </div>
            <div className="hero-card-title">Safe planning</div>
            <div className="hero-card-text">
              Save places, keep your itinerary organized, and share it when you’re ready.
            </div>
          </div>

          <div className="hero-card" role="listitem">
            <div className="hero-card-icon" aria-hidden="true">
              <Zap size={22} />
            </div>
            <div className="hero-card-title">Fast discovery</div>
            <div className="hero-card-text">
              Find activities and spots quickly with clean search and smart suggestions.
            </div>
          </div>

          <div className="hero-card" role="listitem">
            <div className="hero-card-icon" aria-hidden="true">
              <Headset size={22} />
            </div>
            <div className="hero-card-title">Travel together</div>
            <div className="hero-card-text">
              Meet travelers, chat, and plan trips with friends or new companions.
            </div>
          </div>

          <div className="hero-card" role="listitem">
            <div className="hero-card-icon" aria-hidden="true">
              <Code2 size={22} />
            </div>
            <div className="hero-card-title">Modern experience</div>
            <div className="hero-card-text">
              Smooth UI, dark mode support, and a design that stays consistent across pages.
            </div>
          </div>
        </div>
      </div>

      <div className="hero-scroll" aria-hidden="true">
        <div className="hero-scroll-mouse">
          <div className="hero-scroll-dot" />
        </div>
      </div>
    </section>
  );
}

export default HeroSection;