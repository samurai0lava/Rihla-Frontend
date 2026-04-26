import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, KeyRound } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { changeMyPassword } from "../../../lib/authApi";
import "./EditProfilePage.css";

function ChangePasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo =
    (location.state as { from?: string } | null)?.from ?? "/settings";
  const { user, refreshUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const oauthOnly = user?.hasPassword === false;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (oauthOnly) return;

    if (currentPassword === newPassword) {
      setError("New password must be different from your current password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setSaving(true);
    try {
      await changeMyPassword({ currentPassword, newPassword });
      await refreshUser();
      navigate(returnTo, {
        replace: true,
        state: { passwordChanged: true },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="edit-profile-page">
      <Link to={returnTo} className="back-arrow" replace>
        <ArrowLeft size={26} />
      </Link>

      <form className="edit-profile-card" onSubmit={onSubmit}>
        <h1>Change password</h1>
        <p className="subtitle">Update the password for your profile account.</p>

        {oauthOnly ? (
          <p className="msg error">
            You signed up with Google or 42 and do not have a password on this account. Use
            your provider to sign in, or contact support if you need email/password access.
          </p>
        ) : null}

        <label className="field">
          <span>Current password</span>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            disabled={oauthOnly || saving}
            required={!oauthOnly}
          />
        </label>

        <label className="field">
          <span>New password</span>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            maxLength={64}
            disabled={oauthOnly || saving}
            required={!oauthOnly}
          />
          <small>At least 8 characters, with uppercase, lowercase, and a number.</small>
        </label>

        <label className="field">
          <span>Confirm new password</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            maxLength={64}
            disabled={oauthOnly || saving}
            required={!oauthOnly}
          />
        </label>

        {error && <p className="msg error">{error}</p>}

        <div className="actions">
          <button type="button" className="ghost" onClick={() => navigate("/profile")}>
            Profile
          </button>
          <button type="submit" className="primary" disabled={saving || oauthOnly}>
            <KeyRound size={14} />
            {saving ? "Updating..." : "Update password"}
          </button>
        </div>
      </form>
    </main>
  );
}

export default ChangePasswordPage;
