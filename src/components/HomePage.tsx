import { ChevronDown } from "lucide-react";
import VerticalNav from "./shared/VerticalNav";
import GlassSearchBar from "./shared/GlassSearchBar";
import ProfileDropdown from "./shared/ProfileDropdown";
import "./HomePage.css";
import bgvideo from "../assets/home-background.mp4";
import GlassNavBar from "./shared/GlassNavBar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNavBadges } from "../context/NavBadgesContext";
import RihlaimgOrange from "../assets/RIHLA-orange.svg";

function HomePage() {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const {
    showFriendsBadge,
    showMessagesBadge,
    showNotificationsBadge,
  } = useNavBadges();
  const handleNavigation = (id: string) => {
    console.log("Navigate to:", id);
  };

  const handleSearch = (query: string) => {
    console.log("Search query:", query);
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const userName = user?.displayName || user?.username || "Traveler";
  return (
    <div className="home-page">
      <video className="videoTag" autoPlay loop muted>
        <source src={bgvideo} type="video/mp4" />
      </video>
      <nav className="home-nav">
        <div className="text-white text-2xl font-bold">
          <button
            type="button"
            onClick={() => navigate("/home")}
            aria-label="Go to home"
            className="appearance-none bg-transparent border-0 p-0 m-0 cursor-pointer block"
          >
            <img
              src={RihlaimgOrange}
              alt="Rihla"
              className="block h-7 sm:h-8 w-auto object-contain drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)]"
            />
          </button>
        </div>
        <GlassNavBar
          handleNavigation={handleNavigation}
          surface="home-video"
          badges={{
            messages: showMessagesBadge,
            friends: showFriendsBadge,
            notifications: showNotificationsBadge,
          }}
        />
        <div className="profile-dropdown-wrapper">
          <ProfileDropdown
            onProfile={() => navigate("/profile")}
            onSettings={() => navigate("/settings")}  
            onLanguage={() => console.log("Change language")}
            onLogout={() => handleLogout()}
          />
        </div>
      </nav>
      <main className="home-content">
        <h1 className="header-home">Welcome Back, {userName} </h1>
        <div className="search-container">
          <GlassSearchBar onSearch={handleSearch} />
        </div>
      </main>
    </div>
  );
}

export default HomePage;
