
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import {
    AuthHero,
    Spinner,
    EyeIcon,
} from "../../../components/AuthShared";

import { authApi } from "../api/authApi";

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();

    // Lấy email và token từ đường dẫn gửi qua Gmail
    const email = searchParams.get("email")?.trim() || "";
    const token = searchParams.get("token") || "";

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    // Kiểm tra mật khẩu theo yêu cầu Backend
    const isValidPassword = (value) => {
        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;

        return passwordRegex.test(value);
    };

    // Xử lý đặt lại mật khẩu
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (loading || success) return;

        setError("");

        // 1. Kiểm tra link khôi phục
        if (!email || !token) {
            setError(
                "Reset link is missing email or token. Please request a new link."
            );
            return;
        }

        // 2. Kiểm tra mật khẩu
        if (!isValidPassword(password)) {
            setError(
                "Password must contain at least 8 characters, " +
                "including uppercase, lowercase, number and special character."
            );
            return;
        }

        // 3. Kiểm tra xác nhận mật khẩu
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            // Gửi đủ 3 trường Backend yêu cầu
            await authApi.resetPassword({
                email,
                token,
                newPassword: password,
            });

            // Chỉ báo thành công khi API thành công
            setSuccess(true);

            setPassword("");
            setConfirmPassword("");

        } catch (err) {
            console.error("Reset password failed:", err);

            // apiClient hiện tại trả về error.response.data
            const message =
                err?.message ||
                err?.title ||
                "Unable to reset password. Please try again.";

            if (
                message.toLowerCase().includes("invalid") ||
                message.toLowerCase().includes("expired")
            ) {
                setError(
                    "The reset link is invalid or expired. " +
                    "Please request a new password reset link."
                );
            } else {
                setError(message);
            }

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid min-h-screen w-full bg-canvas lg:grid-cols-2">

            <AuthHero
                tagline="Restore access and get back to managing your tasks."
            />

            <div className="flex items-center justify-center px-5 py-12 sm:px-10">

                <div className="w-full max-w-md">

                    <h1 className="font-display text-3xl font-bold text-ink">
                        Reset Password
                    </h1>

                    {success ? (
                        <div className="mt-6 space-y-5">

                            <p
                                role="status"
                                className="rounded-xl bg-green-50 p-4 text-sm text-green-700"
                            >
                                Your password has been reset successfully.
                                You can now sign in with your new password.
                            </p>

                            <Link
                                to="/login"
                                className="inline-block rounded-xl bg-ink px-6 py-3 font-semibold text-white"
                            >
                                Back to Sign In
                            </Link>

                        </div>
                    ) : (
                        <>
                            <p className="mt-3 text-sm text-muted">
                                Enter and confirm your new password.
                            </p>

                            {/* Thiếu email hoặc token */}
                            {(!email || !token) && (
                                <p
                                    role="alert"
                                    className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
                                >
                                    This reset link is incomplete.
                                    Please request a new link.
                                </p>
                            )}

                            {/* Thông báo lỗi */}
                            {error && (
                                <p
                                    role="alert"
                                    className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
                                >
                                    {error}
                                </p>
                            )}

                            {/* Form Reset Password */}
                            <form
                                onSubmit={handleSubmit}
                                className="mt-8 space-y-5"
                            >

                                {/* Mật khẩu mới */}
                                <div>
                                    <label
                                        htmlFor="new-password"
                                        className="mb-2 block text-sm font-medium text-ink"
                                    >
                                        New password
                                    </label>

                                    
                                <div className="relative">
                                    <input
                                        id="new-password"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        minLength={8}
                                        autoComplete="new-password"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            setError("");
                                        }}
                                        placeholder="Enter new password"
                                        className="w-full rounded-xl border border-hairline bg-white px-4 py-3 pr-12 text-sm text-ink outline-none focus:border-brand"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted transition hover:text-ink"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        aria-pressed={showPassword}
                                    >
                                        <EyeIcon off={showPassword} />
                                    </button>
                                </div>


                                    <p className="mt-2 text-xs text-muted">
                                        At least 8 characters, including
                                        uppercase, lowercase, number and
                                        special character.
                                    </p>
                                </div>

                                {/* Xác nhận mật khẩu */}
                                <div>
                                    <label
                                        htmlFor="confirm-password"
                                        className="mb-2 block text-sm font-medium text-ink"
                                    >
                                        Confirm password
                                    </label>

                                    <input
                                        id="confirm-password"
                                        type="password"
                                        required
                                        minLength={8}
                                        autoComplete="new-password"
                                        value={confirmPassword}
                                        onChange={(e) => {
                                            setConfirmPassword(e.target.value);
                                            setError("");
                                        }}
                                        placeholder="Confirm new password"
                                        className="w-full rounded-xl border border-hairline bg-white px-4 py-3 text-sm text-ink outline-none focus:border-brand"
                                    />
                                </div>

                                {/* Nút xác nhận */}
                                <button
                                    type="submit"
                                    disabled={loading || !email || !token}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {loading ? (
                                        <>
                                            <Spinner />
                                            Resetting...
                                        </>
                                    ) : (
                                        "Reset Password"
                                    )}
                                </button>

                            </form>

                            <Link
                                to="/forgot-password"
                                className="mt-5 inline-block text-sm font-medium text-brand hover:underline"
                            >
                                Request a new reset link
                            </Link>

                            <div>
                                <Link
                                    to="/login"
                                    className="mt-3 inline-block text-sm font-medium text-brand hover:underline"
                                >
                                    Back to Sign In
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
