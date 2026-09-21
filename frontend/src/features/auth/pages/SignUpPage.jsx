import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../../assets/context/AuthContext";
import { useTheme } from "../../../assets/context/ThemeContext";
import {
    AuthHero,
    GoogleIcon,
    GitHubIcon,
    EyeIcon,
    CheckboxButton,
    SocialButton,
    Spinner,
} from "../../../assets/components/AuthShared";

function scorePassword(pw) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return Math.min(score, 3);
}

const STRENGTH = [
    { label: "Weak", color: "#e05656" },
    { label: "Fair", color: "#f6c62e" },
    { label: "Good", color: "#f6c62e" },
    { label: "Strong", color: "#3fb27f" },
];

export default function SignUpPage() {
    const navigate = useNavigate();
    const { signup } = useAuth();
    const { dark, toggleTheme } = useTheme();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [agree, setAgree] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const strength = scorePassword(password);
    const mismatch = confirm.length > 0 && confirm !== password;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        if (!agree) {
            setError("Please accept the Terms of Service to continue.");
            return;
        }
        if (password !== confirm) {
            setError("Passwords do not match.");
            return;
        }
        setError("");
        setLoading(true);
        await signup({ name, email, password });
        navigate("/dashboard", {
            state: { toast: "Account created — welcome to TASKY!" },
        });
    };

    const social = async (provider) => {
        if (loading) return;
        setLoading(true);
        await signup({ name: "", email: `you@${provider}.com` });
        navigate("/dashboard", {
            state: { toast: "Account created successfully!" },
        });
    };

    return (
        <div className="grid min-h-full w-full bg-canvas lg:grid-cols-2">
            <AuthHero tagline="Join thousands of teams shipping better work with TASKY." />

            <div className="relative flex items-center justify-center px-5 py-10 sm:px-10">
                <button
                    onClick={toggleTheme}
                    className="absolute right-5 top-5 rounded-full bg-white p-2.5 text-ink shadow-sm transition hover:text-brand"
                    aria-label="Toggle theme"
                >
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        {dark ? (
                            <circle cx="12" cy="12" r="4" />
                        ) : (
                            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                        )}
                        {dark && (
                            <path d="M12 2v2m0 16v2M2 12h2m16 0h2m-3.5-6.5-1.4 1.4M6.9 17.1l-1.4 1.4m0-12.6 1.4 1.4m10.2 10.2 1.4 1.4" />
                        )}
                    </svg>
                </button>

                <div className="w-full max-w-md">
                    <Link
                        to="/"
                        className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-ink"
                    >
                        <span aria-hidden>←</span> Back to home
                    </Link>

                    <div className="mb-6 lg:hidden">
                        <span className="font-display text-2xl font-bold tracking-tight text-ink">
                            TASK<span className="text-brand">Y.</span>
                        </span>
                    </div>

                    <h1 className="font-display text-2xl font-bold text-ink">
                        Create your account
                    </h1>
                    <p className="mt-1.5 text-sm text-muted">
                        Already have an account?{" "}
                        <Link
                            to="/login"
                            className="font-medium text-brand transition hover:underline"
                        >
                            Log In
                        </Link>
                    </p>

                    <div className="mt-7 grid grid-cols-2 gap-3">
                        <SocialButton
                            icon={<GoogleIcon />}
                            label="Google"
                            onClick={() => social("google")}
                        />
                        <SocialButton
                            icon={<GitHubIcon />}
                            label="GitHub"
                            onClick={() => social("github")}
                        />
                    </div>

                    <div className="my-6 flex items-center gap-4">
                        <span className="h-px flex-1 bg-hairline" />
                        <span className="text-xs font-medium text-muted">
                            Or sign up with email
                        </span>
                        <span className="h-px flex-1 bg-hairline" />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-ink">
                                Full name
                            </label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Manjay Gupta"
                                className="w-full rounded-xl border border-hairline bg-canvas px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand focus:bg-white"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-ink">
                                Work email
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@matrixdomain.com"
                                className="w-full rounded-xl border border-hairline bg-canvas px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand focus:bg-white"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-ink">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    placeholder="Create a strong password"
                                    className="w-full rounded-xl border border-hairline bg-canvas px-4 py-3 pr-12 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand focus:bg-white"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((s) => !s)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted transition hover:text-ink"
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                >
                                    <EyeIcon off={showPassword} />
                                </button>
                            </div>

                            {password && (
                                <div className="mt-2.5">
                                    <div className="flex gap-1.5">
                                        {[0, 1, 2, 3].map((i) => (
                                            <span
                                                key={i}
                                                className="h-1.5 flex-1 rounded-full transition-colors"
                                                style={{
                                                    background:
                                                        i <= strength
                                                            ? STRENGTH[strength]
                                                                  .color
                                                            : "var(--color-hairline)",
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <span
                                        className="mt-1.5 block text-xs font-medium"
                                        style={{
                                            color: STRENGTH[strength].color,
                                        }}
                                    >
                                        {STRENGTH[strength].label} password
                                    </span>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-ink">
                                Confirm password
                            </label>
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                placeholder="Re-enter your password"
                                className={`w-full rounded-xl border bg-canvas px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted focus:bg-white ${
                                    mismatch
                                        ? "border-[#e05656]"
                                        : "border-hairline focus:border-brand"
                                }`}
                            />
                            {mismatch && (
                                <span className="mt-1.5 block text-xs font-medium text-[#e05656]">
                                    Passwords do not match
                                </span>
                            )}
                        </div>

                        <label className="flex cursor-pointer items-start gap-2.5 text-sm font-medium text-ink">
                            <CheckboxButton
                                checked={agree}
                                onClick={() => setAgree((a) => !a)}
                            />
                            <span className="leading-snug">
                                I agree to the{" "}
                                <span className="text-brand hover:underline">
                                    Terms of Service
                                </span>{" "}
                                &{" "}
                                <span className="text-brand hover:underline">
                                    Privacy Policy
                                </span>
                            </span>
                        </label>

                        {error && (
                            <p className="text-sm font-medium text-[#e05656]">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(28,28,28,0.18)] transition hover:opacity-90 active:scale-[0.99] disabled:opacity-70 dark:!bg-brand dark:!text-slate-900 dark:shadow-[0_10px_25px_rgba(246,198,46,0.35)]"
                        >
                            {loading ? (
                                <>
                                    <Spinner /> Creating account…
                                </>
                            ) : (
                                "Create Account"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
