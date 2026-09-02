import { useState } from "react";
import {
    ClockIcon,
    ChartIcon,
    ListIcon,
    FolderIcon,
    MoreIcon,
} from "../assets/components/icon.jsx";

/* ---------- data ---------- */

const METRICS = [
    {
        label: "Total Hours",
        value: "168.5",
        unit: "hrs",
        delta: "+12.4%",
        up: true,
        Icon: ClockIcon,
    },
    {
        label: "Productivity",
        value: "87",
        unit: "%",
        delta: "+5.2%",
        up: true,
        Icon: ChartIcon,
    },
    {
        label: "Tasks Completed",
        value: "142",
        unit: "",
        delta: "+8 this week",
        up: true,
        Icon: ListIcon,
    },
    {
        label: "Active Projects",
        value: "06",
        unit: "",
        delta: "-1 vs last",
        up: false,
        Icon: FolderIcon,
    },
];

const WEEK = [
    { day: "Mon", value: 5.2 },
    { day: "Tue", value: 6.8 },
    { day: "Wed", value: 4.1 },
    { day: "Thu", value: 7.5 },
    { day: "Fri", value: 6.2 },
    { day: "Sat", value: 3.4 },
    { day: "Sun", value: 2.1 },
];

const FOCUS = [
    { day: "Mon", value: 62 },
    { day: "Tue", value: 78 },
    { day: "Wed", value: 45 },
    { day: "Thu", value: 90 },
    { day: "Fri", value: 71 },
    { day: "Sat", value: 38 },
    { day: "Sun", value: 24 },
];

const DISTRIBUTION = [
    { label: "Development", value: 42, color: "#f6c62e" },
    { label: "Design", value: 26, color: "#1c1c1c" },
    { label: "Research", value: 18, color: "#f7d873" },
    { label: "Meetings", value: 14, color: "#d9dce2" },
];

const SUMMARY = [
    { label: "Avg. daily focus", value: "5h 12m" },
    { label: "Most productive day", value: "Thursday" },
    { label: "On-time completion", value: "94%" },
    { label: "Overtime logged", value: "3h 40m" },
];

/* ---------- helpers ---------- */

function TrendPill({ up, children }) {
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                up ? "bg-brand-soft text-[#a07a00]" : "bg-canvas text-muted"
            }`}
        >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path
                    d={up ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6"}
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
            {children}
        </span>
    );
}

function CardHead({ title, subtitle }) {
    return (
        <div className="mb-6 flex items-start justify-between">
            <div>
                <h3 className="font-display text-[17px] font-semibold text-ink">
                    {title}
                </h3>
                {subtitle && (
                    <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
                )}
            </div>
            <button className="rounded-lg p-1 text-muted transition hover:bg-canvas hover:text-ink">
                <MoreIcon width={18} height={18} />
            </button>
        </div>
    );
}

/* ---------- charts ---------- */

function AreaChart({ data }) {
    const w = 320;
    const h = 140;
    const pad = 8;
    const max = Math.max(...data.map((d) => d.value)) * 1.15;
    const step = (w - pad * 2) / (data.length - 1);
    const pts = data.map((d, i) => ({
        x: pad + i * step,
        y: h - pad - (d.value / max) * (h - pad * 2),
    }));
    const line = pts.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ");
    const area = `${line} L${pts[pts.length - 1].x},${h} L${pts[0].x},${h} Z`;

    return (
        <div>
            <svg
                viewBox={`0 0 ${w} ${h}`}
                className="h-40 w-full"
                preserveAspectRatio="none"
            >
                <defs>
                    <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop
                            offset="0%"
                            stopColor="#f6c62e"
                            stopOpacity="0.35"
                        />
                        <stop
                            offset="100%"
                            stopColor="#f6c62e"
                            stopOpacity="0"
                        />
                    </linearGradient>
                </defs>
                <path d={area} fill="url(#areaFill)" />
                <path
                    d={line}
                    fill="none"
                    stroke="#f6c62e"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                {pts.map((p, i) => (
                    <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r="3.5"
                        fill="#fff"
                        stroke="#f6c62e"
                        strokeWidth="2.5"
                    />
                ))}
            </svg>
            <div className="mt-3 flex justify-between px-1 text-xs font-medium text-muted">
                {data.map((d) => (
                    <span key={d.day}>{d.day}</span>
                ))}
            </div>
        </div>
    );
}

function BarChart({ data }) {
    const max = Math.max(...data.map((d) => d.value));
    return (
        <div>
            <div className="flex h-40 items-end justify-between gap-2">
                {data.map((d) => (
                    <div
                        key={d.day}
                        className="group flex flex-1 flex-col items-center justify-end gap-2"
                    >
                        <span className="text-[11px] font-semibold text-muted opacity-0 transition group-hover:opacity-100">
                            {d.value}%
                        </span>
                        <div
                            className="w-full rounded-lg bg-canvas transition group-hover:bg-brand-soft"
                            style={{ height: `${(d.value / max) * 100}%` }}
                        >
                            <div
                                className="h-full w-full rounded-lg bg-ink transition group-hover:bg-brand"
                                style={{
                                    opacity: 0.12 + (d.value / max) * 0.88,
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-3 flex justify-between px-1 text-xs font-medium text-muted">
                {data.map((d) => (
                    <span key={d.day} className="flex-1 text-center">
                        {d.day}
                    </span>
                ))}
            </div>
        </div>
    );
}

function Donut({ data }) {
    const total = data.reduce((s, d) => s + d.value, 0);
    const r = 52;
    const c = 2 * Math.PI * r;
    let offset = 0;
    return (
        <svg viewBox="0 0 140 140" className="h-40 w-40 -rotate-90">
            <circle
                cx="70"
                cy="70"
                r={r}
                fill="none"
                stroke="#f4f5f7"
                strokeWidth="16"
            />
            {data.map((d) => {
                const len = (d.value / total) * c;
                const seg = (
                    <circle
                        key={d.label}
                        cx="70"
                        cy="70"
                        r={r}
                        fill="none"
                        stroke={d.color}
                        strokeWidth="16"
                        strokeDasharray={`${len} ${c - len}`}
                        strokeDashoffset={-offset}
                        strokeLinecap="butt"
                    />
                );
                offset += len;
                return seg;
            })}
        </svg>
    );
}

/* ---------- cards ---------- */

function MetricCard({ label, value, unit, delta, up, Icon }) {
    return (
        <div className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(17,17,26,0.04)]">
            <div className="mb-6 flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                    <Icon width={20} height={20} />
                </span>
                <TrendPill up={up}>{delta}</TrendPill>
            </div>
            <div className="flex items-baseline gap-1">
                <span className="font-display text-3xl font-bold text-ink">
                    {value}
                </span>
                {unit && (
                    <span className="text-sm font-medium text-muted">
                        {unit}
                    </span>
                )}
            </div>
            <p className="mt-1 text-sm font-medium text-muted">{label}</p>
        </div>
    );
}

export default function AnalyticsPage() {
    const [range, setRange] = useState("Week");
    const ranges = ["Week", "Month", "Year"];

    return (
        <div className="px-5 pb-8 lg:px-8">
            {/* header row */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="font-display text-3xl font-bold text-ink">
                        Analytics
                    </h2>
                    <p className="mt-1 text-sm font-medium text-muted">
                        Performance overview · Sep 2026
                    </p>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-white p-1">
                    {ranges.map((r) => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                                range === r
                                    ? "bg-ink text-white"
                                    : "text-muted hover:text-ink"
                            }`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            {/* key metrics */}
            <div className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {METRICS.map((m) => (
                    <MetricCard key={m.label} {...m} />
                ))}
            </div>

            {/* charts row */}
            <div className="mb-6 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
                <div className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(17,17,26,0.04)]">
                    <CardHead
                        title="Weekly Activity"
                        subtitle="Hours tracked per day"
                    />
                    <AreaChart data={WEEK} />
                </div>
                <div className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(17,17,26,0.04)]">
                    <CardHead
                        title="Focus Score"
                        subtitle="Daily focus rating"
                    />
                    <BarChart data={FOCUS} />
                </div>
            </div>

            {/* distribution + summary */}
            <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
                <div className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(17,17,26,0.04)]">
                    <CardHead
                        title="Time Distribution"
                        subtitle="By category"
                    />
                    <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
                        <div className="relative shrink-0">
                            <Donut data={DISTRIBUTION} />
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="font-display text-2xl font-bold text-ink">
                                    168h
                                </span>
                                <span className="text-xs text-muted">
                                    total
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 space-y-3">
                            {DISTRIBUTION.map((d) => (
                                <div
                                    key={d.label}
                                    className="flex items-center gap-3"
                                >
                                    <span
                                        className="h-3 w-3 shrink-0 rounded-full"
                                        style={{ background: d.color }}
                                    />
                                    <span className="flex-1 text-sm font-medium text-ink">
                                        {d.label}
                                    </span>
                                    <span className="text-sm font-semibold text-muted">
                                        {d.value}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(17,17,26,0.04)]">
                    <CardHead
                        title="Analytics Summary"
                        subtitle="Key highlights"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        {SUMMARY.map((s) => (
                            <div
                                key={s.label}
                                className="rounded-2xl bg-canvas p-4"
                            >
                                <div className="font-display text-xl font-bold text-ink">
                                    {s.value}
                                </div>
                                <div className="mt-1 text-xs font-medium text-muted">
                                    {s.label}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex items-center gap-3 rounded-2xl bg-ink p-4 text-white">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-ink">
                            <ChartIcon width={20} height={20} />
                        </span>
                        <p className="text-sm leading-tight">
                            <span className="font-semibold">
                                Productivity up 12%
                            </span>
                            <br />
                            <span className="text-white/60">
                                Your best week in the last two months.
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
