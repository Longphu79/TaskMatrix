/* Shared building blocks for the Login & Sign Up split-screen pages. */

export function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24">
            <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
            />
            <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
            />
            <path
                fill="#FBBC05"
                d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
            />
            <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
            />
        </svg>
    );
}

export function GitHubIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1.5A10.5 10.5 0 0 0 8.68 22c.53.1.72-.23.72-.5v-1.82c-2.92.64-3.54-1.25-3.54-1.25-.48-1.21-1.17-1.53-1.17-1.53-.95-.65.07-.64.07-.64 1.06.08 1.61 1.09 1.61 1.09.94 1.6 2.46 1.14 3.06.87.09-.68.37-1.14.66-1.4-2.33-.27-4.78-1.17-4.78-5.18 0-1.15.41-2.08 1.09-2.82-.11-.27-.47-1.35.1-2.8 0 0 .89-.29 2.9 1.08a10 10 0 0 1 5.28 0c2.01-1.37 2.9-1.08 2.9-1.08.57 1.45.21 2.53.1 2.8.68.74 1.08 1.67 1.08 2.82 0 4.02-2.45 4.9-4.79 5.16.38.33.71.97.71 1.96v2.9c0 .28.19.61.73.5A10.5 10.5 0 0 0 12 1.5Z" />
        </svg>
    );
}

export function EyeIcon({ off }) {
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

export function CheckboxButton({ checked, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                checked
                    ? "border-brand bg-brand text-ink"
                    : "border-hairline hover:border-brand"
            }`}
        >
            {checked && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
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
    );
}

export function Spinner() {
    return (
        <svg
            className="animate-spin"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
        >
            <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="3"
                strokeOpacity="0.25"
            />
            <path
                d="M21 12a9 9 0 0 0-9-9"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
            />
        </svg>
    );
}

export function SocialButton({ icon, label, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-hairline bg-white py-3 text-sm font-medium text-ink transition hover:border-brand hover:shadow-sm"
        >
            {icon}
            {label}
        </button>
    );
}

const STATS = [
    { value: "10k+", label: "Active teams" },
    { value: "99.9%", label: "Uptime" },
    { value: "4.9★", label: "User rating" },
];

/* Left hero column — dark/brand showcase with an abstract UI mockup. */
export function AuthHero({ tagline }) {
    return (
        <div className="relative hidden overflow-hidden bg-ink p-12 lg:flex lg:flex-col">
            {/* ambient glows */}
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-brand/10 blur-3xl" />

            <div className="relative z-10 flex h-full flex-col">
                <span className="font-display text-2xl font-bold tracking-tight text-white">
                    TASK<span className="text-brand">MATRIX.</span>
                </span>

                <div className="mt-14">
                    <h2 className="max-w-sm font-display text-3xl font-bold leading-tight text-white">
                        {tagline}
                    </h2>
                    <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/50">
                        The all-in-one workspace where teams plan projects, log
                        time and ship work — beautifully.
                    </p>
                </div>

                {/* abstract UI mockup preview */}
                <div className="relative mt-12 max-w-sm">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                        <div className="mb-4 flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-brand" />
                            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                        </div>
                        <div className="space-y-3">
                            {[82, 54, 68].map((w, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-3"
                                >
                                    <span className="h-8 w-8 shrink-0 rounded-lg bg-brand/20" />
                                    <div className="flex-1">
                                        <div className="mb-1.5 h-2 w-24 rounded-full bg-white/20" />
                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                                            <div
                                                className="h-full rounded-full bg-brand"
                                                style={{ width: `${w}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* animated stat badges */}
                <div className="mt-auto grid grid-cols-3 gap-3 pt-10">
                    {STATS.map((s, i) => (
                        <div
                            key={s.label}
                            className="rounded-2xl border border-white/10 bg-white/5 p-4"
                            style={{
                                animation: `authFloat 3s ease-in-out ${i * 0.4}s infinite`,
                            }}
                        >
                            <div className="font-display text-xl font-bold text-brand">
                                {s.value}
                            </div>
                            <div className="mt-0.5 text-xs text-white/50">
                                {s.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
        @keyframes authFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
        </div>
    );
}
