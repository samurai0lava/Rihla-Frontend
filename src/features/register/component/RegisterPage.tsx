import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import "./RegisterPage.css";
import SigninOuth from "../../../components/shared/SigninOuth";
import passportOverlay from '../../../assets/PassportOverlay.png';
import RegisterForm from '../../../components/RegisterForm';
import GlassCard from '../../../components/glassCard';
import BackArrow from '../../../components/shared/BackArrow';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../lib/api';
import { needsInterestsOnboarding } from '../../../lib/interestsOnboarding';

function RegisterPage() {
    const { signup } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        const formData = new FormData(e.currentTarget);
        const firstName = formData.get('firstName') as string;
        const lastName = formData.get('lastName') as string;
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        if (!firstName || !lastName || !email || !password) return;
        setSubmitting(true);
        try {
            const me = await signup({ firstName, lastName, email, password });
            if (me && needsInterestsOnboarding(me.interests)) {
              navigate('/interests', { replace: true });
            } else {
              navigate('/home', { replace: true });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
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
        <main className="register-page">
            <BackArrow />
            <div className="blob blob-card-left"></div>
            <div className="blob blob-card-center"></div>
            <div className="blob blob-card-right"></div>
            <div className="register-card">
                <div className="register-side">
                    <h2>Register</h2>
                    {error && <p className="register-error" role="alert">{error}</p>}
                    <RegisterForm handleSubmit={handleSubmit} submitting={submitting} />
                    <div className="oauth-section">
                        <p className="text-sm font-normal text-gray-600 dark:text-gray-400">
                            Or sign up with :
                        </p>
                        <SigninOuth onGoogleLogin={handleGoogleLogin} onFortyTwoLogin={handleFortyTwoLogin} />
                    </div>
                </div>
                <GlassCard imageOverlay={passportOverlay} />
            </div>
        </main>
    );
}

export default RegisterPage;
