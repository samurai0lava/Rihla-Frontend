import { useRef, useState, useEffect, useCallback } from "react";
import { Home, Users, Bell, MessageCircle } from "lucide-react";
import gsap from "gsap";
import "./GlassNavBar.css";

interface NavItem {
    id: string;
    icon: React.ReactNode;
    label: string;
}

export type GlassNavBadgeKey = "home" | "messages" | "friends" | "notifications";

function GlassNavBar({
    activeId = "home",
    handleNavigation,
    surface = "default",
    badges,
}: {
    activeId?: string;
    handleNavigation?: (id: string) => void;
    /** Dark frost + white icons on busy backdrops (e.g. /home video). Light & dark theme. */
    surface?: "default" | "home-video";
    /** Orange activity dots (e.g. unread / pending). */
    badges?: Partial<Record<GlassNavBadgeKey, boolean>> | undefined;
}) {
    const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const [activeIndex, setActiveIndex] = useState<number>(0);

    const navItems: NavItem[] = [
        { id: "home", icon: <Home size={28} />, label: "Home" },
        { id: "messages", icon: <MessageCircle size={28} />, label: "Messages" },
        { id: "friends", icon: <Users size={28} />, label: "Friends" },
        { id: "notifications", icon: <Bell size={28} />, label: "Notification" },
    ];

    const expandLabel = useCallback((index: number) => {
        const label = labelRefs.current[index];
        if (label) {
            gsap.killTweensOf(label);
            gsap.to(label, {
                width: "auto",
                opacity: 1,
                marginLeft: "0.5rem",
                duration: 0.4,
                ease: "power3.out",
            });
        }
    }, []);

    const collapseLabel = useCallback((index: number) => {
        const label = labelRefs.current[index];
        if (label) {
            gsap.killTweensOf(label);
            gsap.to(label, {
                width: 0,
                opacity: 0,
                marginLeft: 0,
                duration: 0.35,
                ease: "power2.inOut",
            });
        }
    }, []);

    useEffect(() => {
        const idx = navItems.findIndex((item) => item.id === activeId);
        if (idx !== -1) {
            setActiveIndex(idx);
        }
    }, [activeId]);

    useEffect(() => {
        navItems.forEach((_, i) => {
            if (i === activeIndex) expandLabel(i);
            else collapseLabel(i);
        });
    }, [activeIndex, expandLabel, collapseLabel]);

    const handleClick = (index: number) => {
        if (index === activeIndex) return;

        collapseLabel(activeIndex);
        setActiveIndex(index);
        expandLabel(index);

        const navItem = navItems[index];
        if (navItem && handleNavigation) {
            handleNavigation(navItem.id);
        }
    };

    return (
        <nav className={`glass-nav-bar${surface === "home-video" ? " glass-nav-bar--home-video" : ""}`}>
            {navItems.map((item, index) => (
                <button
                    key={item.id}
                    className={`glass-nav-item${index === activeIndex ? " active" : ""}`}
                    onClick={() => handleClick(index)}
                    aria-label={item.label}
                >
                    <span className="glass-nav-icon-wrap">
                        {item.icon}
                        {badges?.[item.id as GlassNavBadgeKey] ? (
                            <span className="glass-nav-badge" aria-hidden />
                        ) : null}
                    </span>
                    <span
                        className="nav-label"
                        ref={(el) => { labelRefs.current[index] = el; }}
                    >
                        {item.label}
                    </span>
                </button>
            ))}
        </nav>
    );
}

export default GlassNavBar; 