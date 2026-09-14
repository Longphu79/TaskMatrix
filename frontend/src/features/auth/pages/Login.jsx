import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../../assets/components/ThemeContext";

function EyeIcon({ off }) {
    return (
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
            {off ? (
                <>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 8 10 8a9.74 9.74 0 0 0 5.39-1.61" />
                    <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
                    <path d="m2 2 20 20" />
                </>
            ) : (
                <>
                    <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8Z" />
                    <circle cx="12" cy="12" r="3" />
                </>
            )}
        </svg>
    );
}

export default function Login() {
    const navigate = useNavigate();
    const { dark, toggleTheme } = useTheme();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(true);

    const handleSubmit = (e) => {
        e.preventDefault();
        localStorage.setItem("isAuthenticated", "true");
        navigate("/dashboard");
    };

    return (
        <div className="flex min-h-full w-full items-center justify-center bg-canvas px-5 py-10">
            <button
                onClick={toggleTheme}
                className="fixed right-5 top-5 rounded-full bg-white p-2.5 text-ink shadow-sm transition hover:text-brand"
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
                {/* logo */}
                <div className="mb-8 text-center">
                    <span className="font-display text-3xl font-bold tracking-tight text-ink">
                        TASK<span className="text-brand">Y.</span>
                    </span>
                </div>

                <div className="rounded-3xl bg-white p-8 shadow-[0_20px_60px_rgba(17,17,26,0.08)] sm:p-10">
                    <h1 className="font-display text-2xl font-bold text-ink">
                        Welcome back
                    </h1>
                    <p className="mt-1.5 text-sm text-muted">
                        Enter your credentials to access your account
                    </p>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-ink">
                                Email
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
                                    placeholder="Enter your password"
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
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ink">
                                <button
                                    type="button"
                                    onClick={() => setRemember((r) => !r)}
                                    className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
                                        remember
                                            ? "border-brand bg-brand text-ink"
                                            : "border-hairline hover:border-brand"
                                    }`}
                                >
                                    {remember && (
                                        <svg
                                            width="12"
                                            height="12"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                        >
                                            <path
                                                d="m5 13 4 4L19 7"
                                                stroke="currentColor"
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    )}
                                </button>
                                Remember me
                            </label>
                            <button
                                type="button"
                                className="text-sm font-medium text-brand transition hover:underline"
                            >
                                Forgot Password?
                            </button>
                        </div>

                        <button
                            type="submit"
                            className="w-full rounded-xl bg-ink py-3 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(28,28,28,0.18)] transition hover:opacity-90 active:scale-[0.99] dark:!bg-brand dark:!text-slate-900 dark:shadow-[0_10px_25px_rgba(246,198,46,0.35)]"
                        >
                            Sign In
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-muted">
                        Don&apos;t have an account?{" "}
                        <button className="font-medium text-brand transition hover:underline">
                            Sign up
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
