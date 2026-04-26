import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import "./RegisterForm.css";
import AcceptTerms from "./shared/AcceptTerms";

interface RegisterFormProps {
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  submitting?: boolean;
}

function RegisterForm({ handleSubmit, submitting = false }: RegisterFormProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);

  return (
    <form className="register-form" onSubmit={handleSubmit}>
      <div className="name-row">
        <div className="input-wrapper">
          <input
            type="text"
            id="firstName"
            name="firstName"
            placeholder="First Name"
            required
          />
        </div>
        <div className="input-wrapper">
          <input
            type="text"
            id="lastName"
            name="lastName"
            placeholder="Last Name"
            required
          />
        </div>
      </div>

      <div className="input-wrapper">
        <Mail className="input-icon" size={20} />
        <input
          type="email"
          id="email"
          name="email"
          placeholder="Email"
          required
        />
      </div>
      <div className="input-wrapper">
        <Lock className="input-icon" size={20} />
        <input
          type="password"
          id="password"
          name="password"
          placeholder="Password"
          required
        />
      </div>


      <AcceptTerms
        id="register-accept-terms"
        checked={termsAccepted}
        onCheckedChange={setTermsAccepted}
      />
      <button
        type="submit"
        disabled={submitting || !termsAccepted}
        title={
          !termsAccepted
            ? "Please accept the Privacy Policy to continue"
            : undefined
        }
      >
        {submitting ? "Creating…" : "Create Account"}
      </button>

      <div className="w-full h-px bg-gray-300 dark:bg-gray-600"></div>

      <div className="oauth-section">
        <p className="auth-footer-switch text-center text-sm text-gray-600 dark:text-gray-400">
          You already have an account?{" "}
          <Link to="/login" className="auth-footer-link font-semibold text-[#FF8C42] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </form>
  );
}

export default RegisterForm;
