
import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthHero, Spinner } from "../../../components/AuthShared";
import { authApi } from "../api/authApi";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        setError("");
        setMessage("");
        setLoading(true);

        try {
            await authApi.forgotPassword(email.trim().toLowerCase());

            setMessage(
                "If an eligible account exists, a password reset link will be sent to your email."
            );
        } catch (err) {
            setError(
                err?.message ||
                "Unable to send the reset request. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid min-h-screen w-full bg-canvas lg:grid-cols-2">
            <AuthHero tagline="Securely recover access to your TaskMatrix account." />

            <div className="flex items-center justify-center px-5 py-12 sm:px-10">
                <div className="w-full max-w-md">
                    <Link
                        to="/login"
                        className="mb-8 inline-block text-sm font-medium text-muted hover:text-brand"
                    >
                        ← Back to Sign In
                    </Link>

                    <h1 className="font-display text-3xl font-bold text-ink">
                        Forgot Password?
                    </h1>

                    <p className="mt-3 text-sm text-muted">
                        Enter your registered email address.
                        We will send you a link to reset your password.
                    </p>

                    {message && (
                        <div role="status" className="mt-6 rounded-xl bg-green-50 p-4 text-sm text-green-700">
                            {message}
                        </div>
                    )}

                    {error && (
                        <div role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                        <div>
                            <label
                                htmlFor="forgot-email"
                                className="mb-2 block text-sm font-medium text-ink"
                            >
                                Email address
                            </label>

                            <input
                                id="forgot-email"
                                type="email"
                                required
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full rounded-xl border border-hairline bg-white px-4 py-3 text-sm text-ink outline-none focus:border-brand"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3 font-semibold text-white disabled:opacity-60"
                        >
                            {loading ? (
                                <>
                                    <Spinner />
                                    Sending...
                                </>
                            ) : (
                                "Send Reset Link"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
