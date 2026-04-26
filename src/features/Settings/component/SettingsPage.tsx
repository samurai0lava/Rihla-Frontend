import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Pencil,
  Lock,
  Moon,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";
import { API_BASE_URL } from "../../../lib/api";
import "./SettingsPage.css";

const OAUTH_RETURN_PATH_KEY = "oauthReturnPath";

function GoogleLogo() {
  return (
    <svg
      className="settings-provider-svg-google"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function startOAuthConnect(route: "google" | "42") {
  sessionStorage.setItem(OAUTH_RETURN_PATH_KEY, "/settings");
  window.location.href = `${API_BASE_URL}/auth/link/${route}`;
}

const OAUTH_LINK_ERROR_MESSAGES: Record<string, string> = {
  invalid_link_state: "Connection expired or invalid. Please try Connect again.",
  account_already_linked:
    "That provider account is already linked to another profile (or you already linked a different account here).",
  link_failed: "Could not complete the connection. Please try again.",
};

function SettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  const [linkedProviders, setLinkedProviders] = useState<string[] | null>(
    null,
  );
  const [oauthLinkBanner, setOauthLinkBanner] = useState<string | null>(null);
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
    const code = new URLSearchParams(window.location.search).get(
      "oauth_link_error",
    );
    if (code) {
      setOauthLinkBanner(
        OAUTH_LINK_ERROR_MESSAGES[code] ??
          "Something went wrong connecting the account.",
      );
      const path = window.location.pathname + window.location.hash;
      window.history.replaceState({}, "", path);
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/linked-providers`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("linked-providers failed");
        const data = (await res.json()) as { providers?: string[] };
        if (!cancelled) setLinkedProviders(data.providers ?? []);
      } catch {
        if (!cancelled) setLinkedProviders([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadingLinked = linkedProviders === null;
  const hasGoogle = linkedProviders?.includes("google") ?? false;
  const has42 = linkedProviders?.includes("42") ?? false;

  return (
    <main className="settings-page">
      <Link to="/home" className="back-arrow">
        <ArrowLeft size={28} />
      </Link>

      <div className="settings-container">
        <h1 className="settings-title">Settings</h1>
        {passwordChangedBanner ? (
          <div
            className="settings-oauth-banner settings-banner-success"
            role="status"
          >
            Your password was updated successfully.
            <button
              type="button"
              className="settings-oauth-banner-dismiss"
              aria-label="Dismiss"
              onClick={() => setPasswordChangedBanner(false)}
            >
              ×
            </button>
          </div>
        ) : null}
        {oauthLinkBanner ? (
          <div className="settings-oauth-banner" role="alert">
            {oauthLinkBanner}
            <button
              type="button"
              className="settings-oauth-banner-dismiss"
              aria-label="Dismiss"
              onClick={() => setOauthLinkBanner(null)}
            >
              ×
            </button>
          </div>
        ) : null}
        <div className="settings-section">
          <p className="settings-section-title">Account</p>

          <div
            className="settings-row settings-row-clickable"
            onClick={() => navigate("/profile")}
          >
            <div className="settings-row-left">
              <span className="settings-row-icon icon-blue">
                <User />
              </span>
              <div>
                <span className="settings-row-label">Profile Info</span>
                <p className="settings-row-sublabel">Name, email, phone</p>
              </div>
            </div>
            <ChevronRight className="settings-row-chevron" />
          </div>

          <div
            className="settings-row settings-row-clickable"
            onClick={() => navigate("/profile/edit")}
          >
            <div className="settings-row-left">
              <span className="settings-row-icon icon-orange">
                <Pencil />
              </span>
              <div>
                <span className="settings-row-label">Edit Profile</span>
                <p className="settings-row-sublabel">Update your personal info</p>
              </div>
            </div>
            <ChevronRight className="settings-row-chevron" />
          </div>

          <div
            className="settings-row settings-row-clickable"
            onClick={() =>
              navigate("/profile/change-password", {
                state: { from: "/settings" },
              })
            }
          >
            <div className="settings-row-left">
              <span className="settings-row-icon icon-yellow">
                <Lock />
              </span>
              <span className="settings-row-label">Change Password</span>
            </div>
            <ChevronRight className="settings-row-chevron" />
          </div>
        </div>

        <div className="settings-section">
          <p className="settings-section-title">Connected Accounts</p>

          <div
            className={`settings-row settings-row-connected ${loadingLinked ? "settings-row-skeleton" : ""}`}
          >
            <div className="settings-row-left">
              <span className="settings-provider-icon settings-provider-icon-google">
                <GoogleLogo />
              </span>
              <div>
                <span className="settings-row-label">Google</span>
                <p className="settings-row-sublabel">Calendar &amp; sign-in</p>
              </div>
            </div>
            <div className="settings-connected-action">
              {loadingLinked ? (
                <span className="settings-skeleton-chip" aria-hidden />
              ) : hasGoogle ? (
                <span className="settings-badge-connected">Connected</span>
              ) : (
                <button
                  type="button"
                  className="settings-connect-btn"
                  onClick={() => startOAuthConnect("google")}
                >
                  Connect
                </button>
              )}
            </div>
          </div>

          <div
            className={`settings-row settings-row-connected ${loadingLinked ? "settings-row-skeleton" : ""}`}
          >
            <div className="settings-row-left">
              <span className="settings-provider-icon settings-provider-icon-42">
                42
              </span>
              <div>
                <span className="settings-row-label">42 Intra</span>
                <p className="settings-row-sublabel">Sign-in with your 42 account</p>
              </div>
            </div>
            <div className="settings-connected-action">
              {loadingLinked ? (
                <span className="settings-skeleton-chip" aria-hidden />
              ) : has42 ? (
                <span className="settings-badge-connected">Connected</span>
              ) : (
                <button
                  type="button"
                  className="settings-connect-btn"
                  onClick={() => startOAuthConnect("42")}
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="settings-section">
          <p className="settings-section-title">Preferences</p>

          <div className="settings-row">
            <div className="settings-row-left">
              <span className="settings-row-icon icon-purple">
                <Moon />
              </span>
              <span className="settings-row-label">Dark Mode</span>
            </div>
            <label className="settings-toggle">
              <input type="checkbox" checked={isDark} onChange={toggleTheme} />
              <span className="settings-toggle-track" />
            </label>
          </div>
        </div>

      </div>
    </main>
  );
}

export default SettingsPage;
