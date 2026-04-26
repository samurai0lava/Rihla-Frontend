import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/lib/api";
import { needsInterestsOnboarding } from "@/lib/interestsOnboarding";

const OAUTH_RETURN_PATH_KEY = "oauthReturnPath";

function takeSafeOAuthReturnPath(): string | null {
  const raw = sessionStorage.getItem(OAUTH_RETURN_PATH_KEY);
  sessionStorage.removeItem(OAUTH_RETURN_PATH_KEY);
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes(":")) {
    return null;
  }
  return raw;
}

function OAuthSuccess(): null {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, { credentials: "include" });
        if (!res.ok) {
          navigate("/login", { replace: true });
          return;
        }
        const me = (await res.json()) as { interests?: unknown };
        const returnPath = takeSafeOAuthReturnPath();
        if (needsInterestsOnboarding(me.interests)) {
          navigate("/interests", { replace: true });
        } else if (returnPath) {
          navigate(returnPath, { replace: true });
        } else {
          navigate("/home", { replace: true });
        }
      } catch {
        navigate("/login", { replace: true });
      }
    })();
  }, [navigate]);

  return null;
}

export default OAuthSuccess;
