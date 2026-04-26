import { useNavigate, useLocation } from "react-router-dom";
import GlassNavBar from "./GlassNavBar";
import ProfileDropdown from "./ProfileDropdown";
import { useAuth } from "../../context/AuthContext";
import { useNavBadges } from "@/context/NavBadgesContext";
import RihlaimgOrange from "../../assets/RIHLA-orange.svg";
import "./HomeNavBar.css";

const NAV_ID_TO_PATH: Record<string, string> = {
  home: "/home",
  messages: "/webchat",
  friends: "/friends",
  notifications: "/notifications",
};

const PATH_TO_NAV_ID: Record<string, string> = {
  "/home": "home",
  "/webchat": "messages",
  "/friends": "friends",
  "/notifications": "notifications",
};

type HomeNavBarProps = {
  hideMobileGlassNav?: boolean;
};

function HomeNavBar({ hideMobileGlassNav = false }: HomeNavBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const {
    showFriendsBadge,
    showMessagesBadge,
    showNotificationsBadge,
  } = useNavBadges();
  const pathname =
    location.pathname.replace(/\/+$/, "") || "/";
  const activeId = PATH_TO_NAV_ID[pathname] ?? "home";
  const isHomeVideo = pathname === "/home" || pathname === "/planner";

  const handleNavigation = (id: string) => {
    const path = NAV_ID_TO_PATH[id];
    if (path) {
      navigate(path);
    }
  };

  const navClass = [
    "home-nav",
    isHomeVideo ? "home-nav--home-video" : "",
    hideMobileGlassNav ? "home-nav--hide-mobile-glass" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <nav className={navClass}>
      <div
        className={
          isHomeVideo
            ? "home-nav-brand home-nav-brand--on-video text-2xl font-bold transition-colors duration-300"
            : "text-[#1C1C1E] dark:text-white text-2xl font-bold transition-colors duration-300"
        }
      >
        <button
          type="button"
          className="home-nav-brand-link"
          onClick={() => navigate("/home")}
          aria-label="Go to home"
        >
          <img
            src={RihlaimgOrange}
            alt="Rihla"
            className={[
              "block h-7 sm:h-8 w-auto object-contain",
              isHomeVideo ? "drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)]" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          />
        </button>
      </div>
      <GlassNavBar
        activeId={activeId}
        handleNavigation={handleNavigation}
        surface={isHomeVideo ? "home-video" : "default"}
        badges={{
          messages: showMessagesBadge,
          friends: showFriendsBadge,
          notifications: showNotificationsBadge,
        }}
      />
      <div className="profile-dropdown-wrapper">
        <ProfileDropdown
          onProfile={() => navigate("/profile")}
          onSaved={() => navigate("/saved")}
          onSettings={() => navigate("/settings")}
          onLanguage={() => console.log("Change language")}
          onLogout={() => { logout(); navigate("/login"); }}
        />
      </div>
    </nav>
  );
}

export default HomeNavBar;
