import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Save } from "lucide-react";
import { fetchMyProfile, toProfileAvatarUrl, updateMyProfile, uploadAvatar } from "../../../lib/profilesApi";
import { useAuth } from "../../../context/AuthContext";
import "./EditProfilePage.css";

function EditProfilePage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [avatarReachability, setAvatarReachability] = useState<"ok" | "fail" | null>(null);

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [visibility, setVisibility] = useState(false);
  const [travelVibe, setTravelVibe] = useState("Cultural explorer");

  useEffect(() => {
    let cancelled = false;
    fetchMyProfile()
      .then((profile) => {
        if (cancelled) return;
        setUsername(profile.username || "");
        setBio(profile.bio || "");
        setAvatarPath(profile.avatar || null);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Could not load your profile. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const avatarSrc = useMemo(() => {
    return toProfileAvatarUrl(avatarPath) || "/profile.png";
  }, [avatarPath]);

  const checkAvatarReachability = async (src: string) => {
    try {
      const ok = await new Promise<boolean>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = src;
      });
      setAvatarReachability(ok ? "ok" : "fail");
    } catch {
      setAvatarReachability("fail");
    }
  };

  const onAvatarPicked = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setSuccess(null);
       try {
      const result = await uploadAvatar(file);
      setAvatarPath(result.avatarUrl || null);
      setSuccess("Profile picture updated.");
      void refreshUser();
      const uploadedSrc = toProfileAvatarUrl(result.avatarUrl || null);
      if (uploadedSrc) {
        await checkAvatarReachability(uploadedSrc);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Avatar upload failed");
      setAvatarReachability("fail");
    } finally {
      setUploading(false);
    }
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }

    setSaving(true);
    try {
      await updateMyProfile({
        name: trimmedUsername,
        description: bio.trim(),
      });
      setSuccess("Profile updated successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="edit-profile-page">
        <p>Loading profile...</p>
      </main>
    );
  }

  return (
    <main className="edit-profile-page">
      <Link to="/settings" className="back-arrow">
        <ArrowLeft size={26} />
      </Link>

      <form className="edit-profile-card" onSubmit={onSave}>
        <h1>Edit Profile</h1>
        <p className="subtitle">Customize your traveler identity.</p>

        <div className="avatar-row">
          <img src={avatarSrc} alt="Profile avatar" className="avatar-preview" />
          <label className="avatar-upload-btn dark:text-black">
            <Upload size={14} color="black"/>
            {uploading ? "Uploading..." : "Upload picture"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(e) => onAvatarPicked(e.target.files?.[0] || null)}
              disabled={uploading}
            />
          </label>
        </div>
        {avatarReachability === "ok" && (
          <p className="avatar-check ok">Avatar URL is reachable.</p>
        )}
        {avatarReachability === "fail" && (
          <p className="avatar-check fail">Avatar was uploaded but URL is not reachable.</p>
        )}

        <label className="field">
          <span>Username</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your_unique_name"
            minLength={3}
            maxLength={24}
            required
          />
          <small>Must be unique and at least 3 characters.</small>
        </label>

        <label className="field">
          <span>Bio</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell other travelers who you are..."
            rows={4}
            maxLength={300}
          />
        </label>

        <div className="two-cols">
          <label className="field">
            <span>Travel vibe</span>
            <select value={travelVibe} onChange={(e) => setTravelVibe(e.target.value)}>
              <option>Cultural explorer</option>
              <option>Food hunter</option>
              <option>Adventure seeker</option>
              <option>Slow traveler</option>
            </select>
            <small>UI preference for now (not persisted yet).</small>
          </label>


        </div>

        {error && <p className="msg error">{error}</p>}
        {success && <p className="msg success">{success}</p>}

        <div className="actions">
          <button type="button" className="ghost" onClick={() => navigate("/profile")}>
            Cancel
          </button>
          <button type="submit" className="primary" disabled={saving || uploading}>
            <Save size={14} />
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </main>
  );
}

export default EditProfilePage;

