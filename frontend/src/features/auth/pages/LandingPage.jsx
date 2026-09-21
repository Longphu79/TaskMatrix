import { useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../../assets/context/ThemeContext";

const NAV_LINKS = ["Features", "Productivity", "Solutions", "Pricing", "FAQ"];

const PRODUCTIVITY = [
    {
        emoji: "⚡",
        title: "Automated Time Logs",
        desc: "Track hours spent on tasks without a single second of manual input.",
    },
    {
        emoji: "🎯",
        title: "Focus Sessions",
        desc: "Built-in Pomodoro timer and distraction blockers keep you in the zone.",
    },
    {
        emoji: "📈",
        title: "Performance Insights",
        desc: "A visual breakdown of your daily peak productivity hours.",
    },
];

const SOLUTIONS = [
    {
        tag: "For Freelancers",
        title: "Get paid for every minute",
        desc: "Invoice generation based on tracked billable hours, plus polished client reporting.",
        points: [
            "Billable-hour invoicing",
            "Client-ready reports",
            "Rate management",
        ],
    },
    {
        tag: "For Creative Agencies",
        title: "Run every project at once",
        desc: "Multi-project tracking, team capacity management, and shared client access.",
        points: [
            "Multi-project tracking",
            "Team capacity planning",
            "Client portals",
        ],
    },
    {
        tag: "For Software Teams",
        title: "Ship sprints on schedule",
        desc: "Sprint planning integration, GitHub sync, and built-in issue tracking.",
        points: ["Sprint planning", "GitHub sync", "Issue tracking"],
    },
];

const PLANS = [
    {
        name: "Starter",
        monthly: 0,
        tagline: "Everything to get going",
        features: [
            "Basic time tracking",
            "Up to 3 projects",
            "1 user",
            "7-day activity history",
        ],
        cta: "Get Started Free",
        featured: false,
    },
    {
        name: "Pro",
        monthly: 12,
        tagline: "For growing teams",
        features: [
            "Unlimited projects",
            "Advanced analytics",
            "Custom reports",
            "Team member management",
        ],
        cta: "Start Free Trial",
        featured: true,
    },
    {
        name: "Enterprise",
        monthly: 29,
        tagline: "For scaling organizations",
        features: [
            "Priority support",
            "Dedicated account manager",
            "Full API access",
            "Custom integrations",
        ],
        cta: "Contact Sales",
        featured: false,
    },
];

const TESTIMONIALS = [
    {
        quote: "TASKMATRIX cut our weekly admin in half. The automated timesheets alone pay for themselves.",
        name: "Sarah Lin",
        role: "Founder, Studio Nine",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&auto=format",
    },
    {
        quote: "I finally know exactly where my billable hours go. My invoices went out 40% faster.",
        name: "Marcus Reid",
        role: "Freelance Designer",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&auto=format",
    },
    {
        quote: "The analytics gave our team a real picture of capacity. Sprint planning is painless now.",
        name: "Priya Nair",
        role: "Eng Lead, Northwind",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop&auto=format",
    },
];

const FAQS = [
    {
        q: "Can I upgrade or cancel my plan anytime?",
        a: "Absolutely. You can upgrade, downgrade, or cancel from your billing settings at any time — changes take effect immediately and we prorate the difference automatically.",
    },
    {
        q: "Is there a free trial for the Pro plan?",
        a: "Yes. Every new account gets a 14-day free trial of Pro with full access to advanced analytics and custom reports. No credit card required to start.",
    },
    {
        q: "How does the time tracker sync across devices?",
        a: "Your timer runs in the cloud, so starting a session on your laptop and stopping it on your phone just works. Everything syncs in real time across web, desktop, and mobile.",
    },
];

const METRICS = [
    { value: "99.9%", label: "Uptime" },
    { value: "100K+", label: "Tracked Hours" },
    { value: "4.9/5", label: "Rating" },
];

const FEATURES = [
    {
        emoji: "⏱️",
        title: "Smart Time Tracking",
        desc: "One-click start/stop tracker with automated timesheets that fill themselves in.",
    },
    {
        emoji: "📁",
        title: "Project & Task Management",
        desc: "Visual progress bars, to-do lists, and balanced team workload allocation.",
    },
    {
        emoji: "📊",
        title: "Real-time Analytics",
        desc: "Detailed charts and exportable PDF/CSV activity reports at your fingertips.",
    },
    {
        emoji: "👥",
        title: "Team Collaboration",
        desc: "Member activity feeds and live status indicators — Online, Away, DND.",
    },
];

function ThemeButton() {
    const { dark, toggleTheme } = useTheme();
    return (
        <button
            onClick={toggleTheme}
            className="rounded-full bg-white p-2.5 text-ink shadow-sm transition hover:text-brand"
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
    );
}

/* Abstract dashboard mockup used inside the hero preview frame. */
function DashboardMockup() {
    return (
        <div className="rounded-2xl bg-canvas p-5">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <div className="mb-1 h-2.5 w-24 rounded-full bg-ink/80" />
                    <div className="h-2 w-16 rounded-full bg-muted/40" />
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-brand">
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <path d="M8 5v14l11-7z" />
                    </svg>
                </div>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-3">
                {["0%", "40:00", "02"].map((v, i) => (
                    <div key={i} className="rounded-xl bg-white p-3">
                        <div className="mb-2 h-1.5 w-8 rounded-full bg-muted/40" />
                        <div className="font-display text-sm font-bold text-ink">
                            {v}
                        </div>
                    </div>
                ))}
            </div>

            <div className="space-y-2.5 rounded-xl bg-white p-4">
                {[82, 46, 64].map((w, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <span className="h-6 w-6 shrink-0 rounded-lg bg-brand-soft" />
                        <div className="h-1.5 w-20 rounded-full bg-muted/30" />
                        <div className="ml-auto h-1.5 flex-1 overflow-hidden rounded-full bg-hairline">
                            <div
                                className="h-full rounded-full bg-brand"
                                style={{ width: `${w}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function FloatingBadge({ children, className, delay }) {
    return (
        <div
            className={`absolute z-20 flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-[0_12px_30px_rgba(17,17,26,0.15)] ${className}`}
            style={{
                animation: `landingFloat 3.5s ease-in-out ${delay}s infinite`,
            }}
        >
            {children}
        </div>
    );
}

function Stars() {
    return (
        <div className="flex gap-0.5 text-brand">
            {[0, 1, 2, 3, 4].map((i) => (
                <svg
                    key={i}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <path d="m12 17.3 6.18 3.7-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
            ))}
        </div>
    );
}

export default function LandingPage() {
    const [yearly, setYearly] = useState(false);
    const [openFaq, setOpenFaq] = useState(0);

    return (
        <div className="min-h-full w-full overflow-x-hidden bg-canvas">
            {/* ---------- Header ---------- */}
            <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/80 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-4 lg:px-8">
                    <span className="font-display text-2xl font-bold tracking-tight text-ink">
                        TASK<span className="text-brand">MATRIX</span>
                    </span>

                    <nav className="ml-6 hidden items-center gap-7 md:flex">
                        {NAV_LINKS.map((link) => (
                            <a
                                key={link}
                                href={`#${link.toLowerCase()}`}
                                className="text-sm font-medium text-muted transition hover:text-ink"
                            >
                                {link}
                            </a>
                        ))}
                    </nav>

                    <div className="ml-auto flex items-center gap-2.5">
                        <ThemeButton />
                        <Link
                            to="/login"
                            className="hidden rounded-full px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-white sm:block"
                        >
                            Log In
                        </Link>
                        <Link
                            to="/signup"
                            className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-ink shadow-[0_8px_20px_rgba(246,198,46,0.35)] transition hover:brightness-105"
                        >
                            Get Started Free
                        </Link>
                    </div>
                </div>
            </header>

            {/* ---------- Hero ---------- */}
            <section className="mx-auto max-w-6xl px-5 pb-10 pt-16 text-center lg:px-8 lg:pt-24">
                <span className="inline-flex items-center gap-2 rounded-full border border-hairline bg-white px-4 py-1.5 text-xs font-semibold text-muted">
                    <span className="h-2 w-2 rounded-full bg-brand" />
                    The all-in-one productivity workspace
                </span>

                <h1 className="mx-auto mt-6 max-w-3xl font-display text-4xl font-bold leading-tight text-ink sm:text-5xl lg:text-6xl">
                    Master Your Work.{" "}
                    <span className="text-brand">Track Every Second</span> with
                    Precision.
                </h1>
                <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
                    TASKMATRIX is the all-in-one workspace designed to help
                    teams and freelancers track time, manage projects, and
                    analyze performance effortlessly.
                </p>

                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Link
                        to="/signup"
                        className="w-full rounded-full bg-ink px-7 py-3.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(28,28,28,0.22)] transition hover:opacity-90 sm:w-auto dark:!bg-brand dark:!text-slate-900"
                    >
                        Start Free Trial
                    </Link>
                    <button className="flex w-full items-center justify-center gap-2 rounded-full border border-hairline bg-white px-7 py-3.5 text-sm font-semibold text-ink transition hover:border-brand sm:w-auto">
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M8 5v14l11-7z" />
                        </svg>
                        Watch Live Demo
                    </button>
                </div>

                {/* App preview mockup */}
                <div className="relative mx-auto mt-16 max-w-4xl">
                    <FloatingBadge
                        className="-left-2 top-10 sm:left-6"
                        delay={0}
                    >
                        <span>⚡</span> Live Timer Active
                    </FloatingBadge>
                    <FloatingBadge
                        className="-right-2 top-28 sm:right-6"
                        delay={1.2}
                    >
                        <span>📊</span> +40% Productivity
                    </FloatingBadge>

                    <div className="rounded-[28px] border border-hairline bg-white p-3 shadow-[0_40px_80px_rgba(17,17,26,0.18)]">
                        <div className="rounded-2xl bg-white p-2">
                            <DashboardMockup />
                        </div>
                    </div>
                </div>
            </section>

            {/* ---------- Social proof / metrics ---------- */}
            <section className="border-y border-hairline bg-white py-12">
                <div className="mx-auto max-w-6xl px-5 lg:px-8">
                    <p className="text-center text-sm font-medium text-muted">
                        Trusted by over{" "}
                        <span className="font-semibold text-ink">10,000+</span>{" "}
                        creative teams and companies worldwide.
                    </p>
                    <div className="mt-8 grid grid-cols-3 gap-6">
                        {METRICS.map((m) => (
                            <div key={m.label} className="text-center">
                                <div className="font-display text-3xl font-bold text-ink sm:text-4xl">
                                    {m.value}
                                </div>
                                <div className="mt-1 text-sm text-muted">
                                    {m.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ---------- Features ---------- */}
            <section
                id="features"
                className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20 lg:px-8"
            >
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">
                        Everything you need to ship great work
                    </h2>
                    <p className="mt-4 text-muted">
                        One workspace for time, tasks, analytics and your whole
                        team — no more juggling a dozen tools.
                    </p>
                </div>

                <div className="mt-12 grid gap-5 sm:grid-cols-2">
                    {FEATURES.map((f) => (
                        <div
                            key={f.title}
                            className="group rounded-3xl border border-hairline bg-white p-7 transition hover:-translate-y-1 hover:border-brand hover:shadow-[0_20px_45px_rgba(17,17,26,0.08)]"
                        >
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-2xl">
                                {f.emoji}
                            </div>
                            <h3 className="mt-5 font-display text-lg font-semibold text-ink">
                                {f.title}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-muted">
                                {f.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ---------- Productivity ---------- */}
            <section
                id="productivity"
                className="scroll-mt-24 border-t border-hairline bg-white py-20"
            >
                <div className="mx-auto max-w-6xl px-5 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <span className="text-sm font-semibold uppercase tracking-wide text-brand">
                            Productivity
                        </span>
                        <h2 className="mt-3 font-display text-3xl font-bold text-ink sm:text-4xl">
                            Designed for Deep Work & Maximum Focus
                        </h2>
                        <p className="mt-4 text-muted">
                            Cut the busywork and let TASKMATRIX handle the tracking,
                            so you can spend your energy on the work that
                            matters.
                        </p>
                    </div>

                    <div className="mt-12 grid gap-5 md:grid-cols-3">
                        {PRODUCTIVITY.map((f) => (
                            <div
                                key={f.title}
                                className="rounded-3xl border border-hairline bg-canvas p-7 text-center"
                            >
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-2xl">
                                    {f.emoji}
                                </div>
                                <h3 className="mt-5 font-display text-lg font-semibold text-ink">
                                    {f.title}
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-muted">
                                    {f.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ---------- Solutions ---------- */}
            <section
                id="solutions"
                className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20 lg:px-8"
            >
                <div className="mx-auto max-w-2xl text-center">
                    <span className="text-sm font-semibold uppercase tracking-wide text-brand">
                        Solutions
                    </span>
                    <h2 className="mt-3 font-display text-3xl font-bold text-ink sm:text-4xl">
                        Tailored Solutions for Every Workflow
                    </h2>
                    <p className="mt-4 text-muted">
                        However you work, TASKMATRIX molds to your process — not the
                        other way around.
                    </p>
                </div>

                <div className="mt-12 grid gap-5 lg:grid-cols-3">
                    {SOLUTIONS.map((s) => (
                        <div
                            key={s.tag}
                            className="group flex flex-col rounded-3xl border border-hairline bg-white p-7 transition hover:-translate-y-1 hover:border-brand hover:shadow-[0_20px_45px_rgba(17,17,26,0.08)]"
                        >
                            <span className="inline-flex w-fit rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-ink">
                                {s.tag}
                            </span>
                            <h3 className="mt-4 font-display text-xl font-semibold text-ink">
                                {s.title}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-muted">
                                {s.desc}
                            </p>
                            <ul className="mt-5 space-y-2.5 border-t border-hairline pt-5">
                                {s.points.map((p) => (
                                    <li
                                        key={p}
                                        className="flex items-center gap-2.5 text-sm font-medium text-ink"
                                    >
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-ink">
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
                                        </span>
                                        {p}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </section>

            {/* ---------- Pricing ---------- */}
            <section
                id="pricing"
                className="scroll-mt-24 border-t border-hairline bg-white py-20"
            >
                <div className="mx-auto max-w-6xl px-5 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <span className="text-sm font-semibold uppercase tracking-wide text-brand">
                            Pricing
                        </span>
                        <h2 className="mt-3 font-display text-3xl font-bold text-ink sm:text-4xl">
                            Simple pricing that scales with you
                        </h2>
                        <p className="mt-4 text-muted">
                            Start free, upgrade when you&apos;re ready. No
                            hidden fees.
                        </p>
                    </div>

                    {/* billing toggle */}
                    <div className="mt-8 flex items-center justify-center gap-3">
                        <span
                            className={`text-sm font-medium ${!yearly ? "text-ink" : "text-muted"}`}
                        >
                            Monthly
                        </span>
                        <button
                            onClick={() => setYearly((y) => !y)}
                            role="switch"
                            aria-checked={yearly}
                            className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors ${
                                yearly ? "bg-brand" : "bg-hairline"
                            }`}
                        >
                            <span
                                className={`h-5 w-5 rounded-full bg-white shadow-md transition-transform ${
                                    yearly ? "translate-x-5" : "translate-x-0"
                                }`}
                            />
                        </button>
                        <span
                            className={`text-sm font-medium ${yearly ? "text-ink" : "text-muted"}`}
                        >
                            Yearly
                        </span>
                        <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-ink">
                            Save 20%
                        </span>
                    </div>

                    <div className="mt-12 grid items-start gap-6 lg:grid-cols-3">
                        {PLANS.map((plan) => {
                            const price = yearly
                                ? Math.round(plan.monthly * 12 * 0.8)
                                : plan.monthly;
                            const unit = yearly ? "/yr" : "/mo";
                            return (
                                <div
                                    key={plan.name}
                                    className={`relative flex flex-col rounded-3xl p-8 transition ${
                                        plan.featured
                                            ? "border-2 border-brand bg-white shadow-[0_24px_60px_rgba(246,198,46,0.25)] lg:-mt-4 lg:mb-4"
                                            : "border border-hairline bg-canvas"
                                    }`}
                                >
                                    {plan.featured && (
                                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-4 py-1 text-xs font-bold text-ink shadow">
                                            Most Popular
                                        </span>
                                    )}
                                    <h3 className="font-display text-lg font-semibold text-ink">
                                        {plan.name}
                                    </h3>
                                    <p className="mt-1 text-sm text-muted">
                                        {plan.tagline}
                                    </p>
                                    <div className="mt-5 flex items-end gap-1">
                                        <span className="font-display text-4xl font-bold text-ink">
                                            ${price}
                                        </span>
                                        <span className="mb-1 text-sm text-muted">
                                            {unit}
                                        </span>
                                    </div>

                                    <ul className="mt-6 flex-1 space-y-3">
                                        {plan.features.map((f) => (
                                            <li
                                                key={f}
                                                className="flex items-center gap-2.5 text-sm text-ink"
                                            >
                                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-ink">
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
                                                </span>
                                                {f}
                                            </li>
                                        ))}
                                    </ul>

                                    <Link
                                        to="/signup"
                                        className={`mt-8 rounded-full py-3 text-center text-sm font-semibold transition ${
                                            plan.featured
                                                ? "bg-brand text-ink shadow-[0_8px_20px_rgba(246,198,46,0.35)] hover:brightness-105"
                                                : "bg-ink text-white hover:opacity-90 dark:!bg-brand dark:!text-slate-900"
                                        }`}
                                    >
                                        {plan.cta}
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ---------- Testimonials ---------- */}
            <section className="mx-auto max-w-6xl px-5 py-20 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <span className="text-sm font-semibold uppercase tracking-wide text-brand">
                        Loved by teams
                    </span>
                    <h2 className="mt-3 font-display text-3xl font-bold text-ink sm:text-4xl">
                        Don&apos;t just take our word for it
                    </h2>
                </div>

                <div className="mt-12 grid gap-5 lg:grid-cols-3">
                    {TESTIMONIALS.map((t) => (
                        <div
                            key={t.name}
                            className="flex flex-col rounded-3xl border border-hairline bg-white p-7"
                        >
                            <Stars />
                            <p className="mt-4 flex-1 text-sm leading-relaxed text-ink">
                                “{t.quote}”
                            </p>
                            <div className="mt-6 flex items-center gap-3 border-t border-hairline pt-5">
                                <img
                                    src={t.avatar}
                                    alt={t.name}
                                    className="h-11 w-11 rounded-full bg-canvas object-cover"
                                />
                                <div>
                                    <div className="text-sm font-semibold text-ink">
                                        {t.name}
                                    </div>
                                    <div className="text-xs text-muted">
                                        {t.role}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ---------- FAQ ---------- */}
            <section
                id="faq"
                className="scroll-mt-24 border-t border-hairline bg-white py-20"
            >
                <div className="mx-auto max-w-3xl px-5 lg:px-8">
                    <div className="text-center">
                        <span className="text-sm font-semibold uppercase tracking-wide text-brand">
                            FAQ
                        </span>
                        <h2 className="mt-3 font-display text-3xl font-bold text-ink sm:text-4xl">
                            Frequently asked questions
                        </h2>
                    </div>

                    <div className="mt-10 space-y-3">
                        {FAQS.map((item, i) => {
                            const isOpen = openFaq === i;
                            return (
                                <div
                                    key={item.q}
                                    className="overflow-hidden rounded-2xl border border-hairline bg-canvas"
                                >
                                    <button
                                        onClick={() =>
                                            setOpenFaq(isOpen ? -1 : i)
                                        }
                                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-ink"
                                    >
                                        {item.q}
                                        <span
                                            className={`shrink-0 text-muted transition-transform ${
                                                isOpen ? "rotate-45" : ""
                                            }`}
                                        >
                                            <svg
                                                width="20"
                                                height="20"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                            >
                                                <path
                                                    d="M12 5v14M5 12h14"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                        </span>
                                    </button>
                                    {isOpen && (
                                        <p className="px-5 pb-5 text-sm leading-relaxed text-muted">
                                            {item.a}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ---------- CTA banner ---------- */}
            <section className="mx-auto max-w-6xl px-5 pb-20 lg:px-8">
                <div className="relative overflow-hidden rounded-[32px] bg-ink px-8 py-14 text-center sm:py-20">
                    <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand/20 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-brand/10 blur-3xl" />
                    <div className="relative z-10">
                        <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold text-white sm:text-4xl">
                            Ready to supercharge your team&apos;s productivity?
                        </h2>
                        <p className="mx-auto mt-4 max-w-lg text-white/50">
                            Join thousands of teams already tracking smarter
                            with TASKMATRIX. No credit card required.
                        </p>
                        <Link
                            to="/signup"
                            className="mt-8 inline-block rounded-full bg-brand px-8 py-3.5 text-sm font-semibold text-ink shadow-[0_12px_30px_rgba(246,198,46,0.4)] transition hover:brightness-105"
                        >
                            Create Free Account
                        </Link>
                    </div>
                </div>
            </section>

            {/* ---------- Footer ---------- */}
            <footer className="border-t border-hairline bg-white">
                <div className="mx-auto max-w-6xl px-5 py-14 lg:px-8">
                    <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="max-w-xs">
                            <span className="font-display text-2xl font-bold tracking-tight text-ink">
                                TASK<span className="text-brand">Y.</span>
                            </span>
                            <p className="mt-4 text-sm leading-relaxed text-muted">
                                The all-in-one workspace where teams plan
                                projects, log time and analyze performance —
                                beautifully.
                            </p>

                            <form
                                onSubmit={(e) => e.preventDefault()}
                                className="mt-6"
                            >
                                <label className="mb-2 block text-sm font-semibold text-ink">
                                    Stay in the loop
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="email"
                                        required
                                        placeholder="you@email.com"
                                        className="min-w-0 flex-1 rounded-full border border-hairline bg-canvas px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand"
                                    />
                                    <button
                                        type="submit"
                                        className="shrink-0 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-ink transition hover:brightness-105"
                                    >
                                        Subscribe
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-ink">
                                Product
                            </h4>
                            <ul className="mt-4 space-y-2.5 text-sm text-muted">
                                {[
                                    "Features",
                                    "Pricing",
                                    "Integrations",
                                    "Changelog",
                                ].map((x) => (
                                    <li key={x}>
                                        <a
                                            href="#"
                                            className="transition hover:text-ink"
                                        >
                                            {x}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-ink">
                                Company
                            </h4>
                            <ul className="mt-4 space-y-2.5 text-sm text-muted">
                                {["About", "Blog", "Careers", "Contact"].map(
                                    (x) => (
                                        <li key={x}>
                                            <a
                                                href="#"
                                                className="transition hover:text-ink"
                                            >
                                                {x}
                                            </a>
                                        </li>
                                    ),
                                )}
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-ink">
                                Legal
                            </h4>
                            <ul className="mt-4 space-y-2.5 text-sm text-muted">
                                {[
                                    "Privacy Policy",
                                    "Terms of Service",
                                    "Security",
                                    "Cookies",
                                ].map((x) => (
                                    <li key={x}>
                                        <a
                                            href="#"
                                            className="transition hover:text-ink"
                                        >
                                            {x}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-hairline pt-6 sm:flex-row">
                        <p className="text-sm text-muted">
                            © 2026 TASKMATRIX. All rights reserved.
                        </p>
                        <div className="flex gap-5 text-sm text-muted">
                            <a href="#" className="transition hover:text-ink">
                                Privacy
                            </a>
                            <a href="#" className="transition hover:text-ink">
                                Terms
                            </a>
                            <a href="#" className="transition hover:text-ink">
                                Cookies
                            </a>
                        </div>
                    </div>
                </div>
            </footer>

            <style>{`
        @keyframes landingFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
        </div>
    );
}
