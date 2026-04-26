import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import "./ProfilePage.css";
import { useAuth } from "../../../context/AuthContext";
import { useEffect, useState } from "react";
import { fetchMyProfile, toProfileAvatarUrl } from "../../../lib/profilesApi";

function ProfilePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [profileBio, setProfileBio] = useState<string | null>(null);
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [passwordChangedBanner, setPasswordChangedBanner] = useState(false);

  useEffect(() => {
    const st = location.state as { passwordChanged?: boolean } | null;
    if (st?.passwordChanged) {
      setPasswordChangedBanner(true);
      navigate(location.pathname + location.search + location.hash, {
        replace: true,
        state: {},
      });
    }
  }, [location.state, location.pathname, location.search, location.hash, navigate]);

  useEffect(() => {
    let cancelled = false;
    fetchMyProfile()
      .then((p) => {
        if (cancelled) return;
        setProfileBio(p.bio ?? null);
        setProfileAvatar(toProfileAvatarUrl(p.avatar ?? null));
      })
      .catch(() => {
        // non-critical; fallback to auth-service user fields
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <main className="profile-page">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="profile-page">
      <Link to="/home" className="back-arrow">
        <ArrowLeft size={28} />
      </Link>

      <div className="profile-card">
        {passwordChangedBanner ? (
          <div className="profile-account-notice" role="status">
            Your password was updated successfully.
            <button
              type="button"
              className="profile-account-notice-dismiss"
              aria-label="Dismiss"
              onClick={() => setPasswordChangedBanner(false)}
            >
              ×
            </button>
          </div>
        ) : null}
        <div className="profile-header">
          <img
            src={profileAvatar || toProfileAvatarUrl(user?.avatar ?? null) || "/profile.png"}
            alt={user?.displayName || "Profile"}
            className="profile-avatar"
          />
          <h1 className="profile-name">
            {user?.displayName || user?.username || "Unknown"}
          </h1>
          <p className="profile-email">{user?.email || ""}</p>
        </div>

        <div className="profile-info">
          <div className="profile-info-item">
            <span className="profile-info-label">Display Name</span>
            <span className="profile-info-value">
              {user?.displayName || "—"}
            </span>
          </div>
          <div className="profile-info-item">
            <span className="profile-info-label">Username</span>
            <span className="profile-info-value">{user?.username || "—"}</span>
          </div>
          <div className="profile-info-item">
            <span className="profile-info-label">Email</span>
            <span className="profile-info-value">{user?.email || "—"}</span>
          </div>
          <div className="profile-info-item">
            <span className="profile-info-label">Bio</span>
            <span className="profile-info-value">{profileBio || user?.bio || "—"}</span>
          </div>
          <div className="profile-info-item">
            <span className="profile-info-label">Status</span>
            <span className="profile-info-value">
              {user?.status || "offline"}
            </span>
          </div>
        </div>

        <div className="profile-actions-row">
          <Link to="/profile/edit" className="profile-action-link">
            Edit profile
          </Link>
          <Link
            to="/profile/change-password"
            state={{ from: "/profile" }}
            className="profile-action-link"
          >
            Change password
          </Link>
        </div>
      </div>
    </main>
  );
}

export default ProfilePage;
