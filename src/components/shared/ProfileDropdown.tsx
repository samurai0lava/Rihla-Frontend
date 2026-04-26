import { useState, useRef, useEffect, useMemo } from "react";
import "./ProfileDropdown.css";
import { useAuth } from "../../context/AuthContext";
import { toProfileAvatarUrl } from "@/lib/profilesApi";


interface ProfileDropdownProps {
  profileImage?: string;
  onProfile?: () => void;
  onSaved?: () => void;
  onSettings?: () => void;
  onLanguage?: () => void;
  onLogout?: () => void;
}

function ProfileDropdown({
  profileImage = "/profile.png",
  onProfile,
  onSaved,
  onSettings,
  onLanguage,
  onLogout,
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleMenuItemClick = (action?: () => void) => {
    setIsOpen(false);
    action?.();
  };

  const { user } = useAuth();

  /** Auth `/me` returns a path like `/uploads/avatars/...` served by profiles-service — not the SPA origin. */
  const avatarSrc = useMemo(() => {
    const resolved = toProfileAvatarUrl(user?.avatar ?? null);
    return resolved ?? profileImage;
  }, [user?.avatar, profileImage]);

  return (
    <div className="profile-dropdown" ref={dropdownRef}>
      <button
        className="profile-dropdown-btn"
        onClick={handleToggle}
        aria-label="Profile menu"
        aria-expanded={isOpen}
      >
        <img
          key={user?.avatar ?? "none"}
          src={avatarSrc}
          alt="Profile"
          className="profile-dropdown-img"
          onError={(e) => {
            const el = e.currentTarget;
            if (el.getAttribute("data-fallback-applied") === "1") return;
            el.setAttribute("data-fallback-applied", "1");
            el.src = profileImage;
          }}
        />
      </button>

      {isOpen && (
        <div className="profile-dropdown-menu">
          <button
            className="profile-dropdown-item"
            onClick={() => handleMenuItemClick(onProfile)}
          >
            <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Profile
          </button>
          <button
            className="profile-dropdown-item"
            onClick={() => handleMenuItemClick(onSaved)}
          >
            <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            Saved
          </button>
          <button
            className="profile-dropdown-item"
            onClick={() => handleMenuItemClick(onSettings)}
          >
            <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
          </button>
          <div className="profile-dropdown-divider" />
          <button
            className="profile-dropdown-item logout"
            onClick={() => handleMenuItemClick(onLogout)}
          >
            <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16,17 21,12 16,7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileDropdown;
