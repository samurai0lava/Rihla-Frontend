import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import GlassSearchBar from "../components/shared/GlassSearchBar";
import TripPlannerBar from "../components/shared/TripPlannerBar";
import HomeNavBar from "../components/shared/HomeNavBar";
import CityResults from "../components/shared/CityResults";
import "./HomePage.css";
import bgvideo from "../assets/home-background.mp4";
import { useAuth } from "@/context/AuthContext";
import { needsInterestsOnboarding } from "@/lib/interestsOnboarding";

type SearchState =
  | { mode: "query"; q: string }
  | { mode: "city"; city: string }
  | null;

function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"explore" | "plan">("explore");
  const [searchState, setSearchState] = useState<SearchState>(null);

  const handleSearch = (query: string) => {
    if (query.trim()) setSearchState({ mode: "query", q: query.trim() });
  };
  const handleSelect = (city: string) => {
    if (city.trim()) setSearchState({ mode: "city", city: city.trim() });
  };

  const { user, loading } = useAuth();
  const userName = user ? user.displayName : "";
  const firstName = userName ? userName.split(" ")[0] : "";

  useEffect(() => {
    if (loading || !user) return;
    if (needsInterestsOnboarding(user.interests)) {
      navigate("/interests", { replace: true });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    const st = location.state as { openPlanTab?: boolean } | null | undefined;
    if (st?.openPlanTab) {
      setActiveTab("plan");
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  const hasResults = searchState !== null;

  return (
    <div className={`home-page${!hasResults ? " home-page--hero" : ""}`}>
      <video className="videoTag" autoPlay loop muted>
        <source src={bgvideo} type="video/mp4" />
      </video>
      <HomeNavBar />
      <main className="home-content">
        <h1 className="header-home">Welcome Back, {firstName} </h1>
        <div className="search-container">
          <div className="tab-switcher">
            <button
              type="button"
              className={`tab-btn${activeTab === "explore" ? " tab-btn--active" : ""}`}
              onClick={() => setActiveTab("explore")}
            >
              Explore
            </button>
            <button
              type="button"
              className={`tab-btn${activeTab === "plan" ? " tab-btn--active" : ""}`}
              onClick={() => setActiveTab("plan")}
            >
              Plan a Trip
            </button>
          </div>
          <div className="tab-bar-surface">
            <div className={`tab-panel${activeTab === "explore" ? " tab-panel--active" : ""}`}>
              <GlassSearchBar onSearch={handleSearch} onSelect={handleSelect} />
            </div>
            <div className={`tab-panel${activeTab === "plan" ? " tab-panel--active" : ""}`}>
              <TripPlannerBar onPlanGenerated={p => navigate(`/planner?id=${p.id}`)} />
            </div>
          </div>
        </div>
      </main>

      {hasResults && searchState.mode === "query" && (
        <CityResults query={searchState.q} />
      )}
      {hasResults && searchState.mode === "city" && (
        <CityResults city={searchState.city} />
      )}
    </div>
  );
}

export default HomePage;
