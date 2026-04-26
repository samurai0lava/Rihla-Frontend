import "./SigninOuth.css";
import { useTheme } from "../../context/ThemeContext";
import BlackLogo42 from "../../assets/icons/42_Logo.svg.png";
import WhiteLogo42 from "../../assets/icons/white-42-logo.png";

interface SigninOuthProps {
    onGoogleLogin?: () => void;
    onFortyTwoLogin?: () => void;
}

function SigninOuth({ onGoogleLogin, onFortyTwoLogin }: SigninOuthProps) {
    const { theme } = useTheme();
    const logo42 = theme === "dark" ? WhiteLogo42 : BlackLogo42;

    return (
        <div className="oauth-buttons">
            <button
                type="button"
                className="oauth-button google-button"
                onClick={onGoogleLogin}
                aria-label="Sign in with Google"
            >
                <div className="oauth-button-content">
                    <div className="oauth-button-icon">
                        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: "block", width: "20px", height: "20px" }}>
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        </svg>
                    </div>
                    <span className="oauth-button-text">Google</span>
                </div>
            </button>
            <button
                type="button"
                className="oauth-button fortytwo-button"
                onClick={onFortyTwoLogin}
                aria-label="Sign in with 42"
            >
                <div className="oauth-button-content">
                                       <div className="oauth-button-icon">
                        <img src={logo42} alt="" width={20} height={14} className="fortytwo-logo" />
                    </div>
                    <span className="oauth-button-text">42</span>
                </div>
            </button>
        </div>
    );
}

export default SigninOuth;