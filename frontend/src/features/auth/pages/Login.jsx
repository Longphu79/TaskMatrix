import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";

import {
    AuthHero,
    EyeIcon,
    Spinner,
} from "../../../components/AuthShared";

function getErrorMessage(error, fallback) {
    if (typeof error === "string") return error;

    return (
        error?.message ||
        error?.title ||
        error?.detail ||
        fallback
    );
}

export default function LoginPage() {
    const navigate = useNavigate();

    const { login, googleLogin } = useAuth();
    const { dark, toggleTheme } = useTheme();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Đăng nhập bằng Email và Password
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (loading) return;

        setError("");

        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail || !password) {
            setError("Please enter your email and password.");
            return;
        }

        setLoading(true);

        try {
            await login({
                email: normalizedEmail,
                password,
            });

            navigate("/dashboard", {
                replace: true,
                state: {
                    toast: "Welcome back to TASKMATRIX!",
                },
            });
        } catch (err) {
            console.error("Email login failed:", err);

            setError(
                getErrorMessage(
                    err,
                    "Email or password is incorrect."
                )
            );
        } finally {
            setLoading(false);
        }
    };

    // Đăng nhập bằng Google
    const handleGoogleSuccess = async (credentialResponse) => {
        if (loading) return;

        setError("");

        const idToken = credentialResponse?.credential;

        if (!idToken) {
            setError("Google authentication failed. Please try again.");
            return;
        }

        setLoading(true);

        try {
            await googleLogin(idToken);

            navigate("/dashboard", {
                replace: true,
                state: {
                    toast: "Signed in successfully with Google!",
                },
            });
        } catch (err) {
            console.error("Google login failed:", err);

            setError(
                getErrorMessage(
                    err,
                    "Unable to sign in with Google."
                )
            );
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError("Google authentication was unsuccessful. Please try again.");
    };

    return (
        <div className="grid min-h-full w-full bg-canvas lg:grid-cols-2">

            <AuthHero tagline="Manage your workspace, track time & boost team productivity." />

            <div className="relative flex items-center justify-center px-5 py-10 sm:px-10">

                {/* Theme switch */}
                <button
                    type="button"
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

                    {/* Back to home */}
                    <Link
                        to="/"
                        className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-ink"
                    >
                        <span aria-hidden>←</span>
                        Back to home
                    </Link>

                    {/* Mobile logo */}
                    <div className="mb-6 lg:hidden">
                        <span className="font-display text-2xl font-bold tracking-tight text-ink">
                            TASK<span className="text-brand">Y.</span>
                        </span>
                    </div>

                    <h1 className="font-display text-2xl font-bold text-ink">
                        Sign in to TASKMATRIX
                    </h1>

                    <p className="mt-1.5 text-sm text-muted">
                        Don't have an account?{" "}
                        <Link
                            to="/signup"
                            className="font-medium text-brand transition hover:underline"
                        >
                            Sign Up
                        </Link>
                    </p>

                    {/* Google Login */}
                    <div className="mt-7 flex justify-center">
                        <div
                            className={
                                loading
                                    ? "pointer-events-none opacity-60"
                                    : ""
                            }
                        >
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                useOneTap={false}
                                theme="outline"
                                size="large"
                                shape="rectangular"
                                text="signin_with"
                                width="320"
                            />
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="my-6 flex items-center gap-4">
                        <span className="h-px flex-1 bg-hairline" />

                        <span className="text-xs font-medium text-muted">
                            Or continue with email
                        </span>

                        <span className="h-px flex-1 bg-hairline" />
                    </div>

                    {/* Error message */}
                    {error && (
                        <div
                            role="alert"
                            className="mb-5 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                        >
                            {error}
                        </div>
                    )}

                    {/* Email Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Email */}
                        <div>
                            <label
                                htmlFor="login-email"
                                className="mb-1.5 block text-sm font-medium text-ink"
                            >
                                Email address
                            </label>

                            <input
                                id="login-email"
                                type="email"
                                required
                                autoComplete="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setError("");
                                }}
                                placeholder="you@matrixdomain.com"
                                className="w-full rounded-xl border border-hairline bg-canvas px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand focus:bg-white"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label
                                htmlFor="login-password"
                                className="mb-1.5 block text-sm font-medium text-ink"
                            >
                                Password
                            </label>

                            <div className="relative">
                                <input
                                    id="login-password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setError("");
                                    }}
                                    placeholder="Enter your password"
                                    className="w-full rounded-xl border border-hairline bg-canvas px-4 py-3 pr-12 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand focus:bg-white"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword((value) => !value)
                                    }
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
                        </div>

                        {/* Forgot Password */}
                        <div className="flex justify-end">
                            <Link
                                to="/forgot-password"
                                className="text-sm font-medium text-brand transition hover:underline"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(28,28,28,0.18)] transition hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 dark:!bg-brand dark:!text-slate-900 dark:shadow-[0_10px_25px_rgba(246,198,46,0.35)]"
                        >
                            {loading ? (
                                <>
                                    <Spinner />
                                    Signing in...
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </button>

                    </form>
                </div>
            </div>
        </div>
    );
}
