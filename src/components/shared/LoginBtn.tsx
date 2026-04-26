import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

function LoginBtn() {
  return (
    <div className="login-btn-root block">
      <Link
        to="/login"
        className={cn(
          "login-btn inline-flex h-11 min-h-[44px] items-center justify-center rounded-2xl bg-black px-5 text-lg font-bold leading-none text-white no-underline transition-colors duration-300 font-sans",
          "hover:bg-[#333333]/[0.57] dark:bg-white dark:text-black dark:hover:bg-white/80"
        )}
      >
        Login
      </Link>
    </div>
  );
}

export default LoginBtn;
