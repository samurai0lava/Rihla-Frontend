import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import "./LoginPage.css";
import SigninOuth from "../../../components/shared/SigninOuth";
import LoginForm from "../../../components/LoginForm";
import passportOverlay from "../../../assets/PassportOverlay.png";
import GlassCard from "../../../components/glassCard";
import { useAuth } from "../../../context/AuthContext";
import { API_BASE_URL } from "../../../lib/api";
import { needsInterestsOnboarding } from "../../../lib/interestsOnboarding";

function LoginPage() {
  const { signin } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    if (!email || !password) return;
    setSubmitting(true);
    try {
      const me = await signin({ email, password });
      if (me && needsInterestsOnboarding(me.interests)) {
        navigate("/interests", { replace: true });
      } else {
        navigate("/home", { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = (): void => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  const handleFortyTwoLogin = (): void => {
    window.location.href = `${API_BASE_URL}/auth/42`;
  };

  return (
    <main className="login-page">
      <Link to="/" className="back-arrow">
        <ArrowLeft size={28} />
      </Link>
      <div className="blob blob-card-left"></div>
      <div className="blob blob-card-center"></div>
      <div className="blob blob-card-right"></div>
      <div className="login-card">
        <GlassCard imageOverlay={passportOverlay} />
        <div className="signin-side">
          <h2>Sign in</h2>
          {error && <p className="login-error" role="alert">{error}</p>}
          <LoginForm handleSubmit={handleSubmit} submitting={submitting} />
          <div className="w-full h-px bg-gray-300 dark:bg-gray-600"></div>
          <div className="oauth-section">
            <p className="text-sm font-normal text-gray-600 dark:text-gray-400">
              Sign in with :
            </p>
            <SigninOuth onGoogleLogin={handleGoogleLogin} onFortyTwoLogin={handleFortyTwoLogin} />
          </div>
          <p className="auth-footer-switch text-center text-sm text-gray-600 dark:text-gray-400">
            You don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="auth-footer-link font-semibold text-[#FF8C42] hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default LoginPage;
