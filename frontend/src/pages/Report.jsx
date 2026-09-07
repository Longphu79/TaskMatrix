import { useState } from "react";
import {
    ClockIcon,
    ChartIcon,
    FileIcon,
    FolderIcon,
    MoreIcon,
    ChevronDownIcon,
} from "../assets/components/icon";

/* ---------- data ---------- */

const SUMMARY = [
    {
        label: "Total Hours Billed",
        value: "142.0",
        unit: "hrs",
        accent: "brand",
        Icon: ClockIcon,
    },
    {
        label: "Project Efficiency",
        value: "87",
        unit: "%",
        accent: "ink",
        Icon: ChartIcon,
    },
    {
        label: "Reports Generated",
        value: "48",
        unit: "",
        accent: "muted",
        Icon: FileIcon,
    },
    {
        label: "Active Clients",
        value: "06",
        unit: "",
        accent: "brand",
        Icon: FolderIcon,
    },
];

const REPORT_TYPES = [
    {
        key: "attendance",
        title: "Time & Attendance Report",
        desc: "Daily clock-in/out, breaks, and total hours per member.",
        metric: "168.5 hrs",
        metricLabel: "tracked",
        accent: "#f6c62e",
    },
    {
        key: "progress",
        title: "Project Progress Summary",
        desc: "Completion rates, milestones, and burndown by project.",
        metric: "87%",
        metricLabel: "avg. complete",
        accent: "#1c1c1c",
    },
    {
        key: "utilization",
        title: "Team Utilization",
        desc: "Billable vs non-billable split across the team.",
        metric: "84%",
        metricLabel: "utilization",
        accent: "#3fb27f",
    },
];

const HISTORY = [
    {
        id: 1,
        name: "September Attendance Report",
        date: "Sep 07, 2026",
        size: "1.2 MB",
        format: "PDF",
    },
    {
        id: 2,
        name: "Matrix Domain Progress Summary",
        date: "Sep 05, 2026",
        size: "486 KB",
        format: "CSV",
    },
    {
        id: 3,
        name: "Team Utilization – Q3",
        date: "Sep 01, 2026",
        size: "2.4 MB",
        format: "PDF",
    },
    {
        id: 4,
        name: "Food Dashboard Timesheet",
        date: "Aug 28, 2026",
        size: "312 KB",
        format: "CSV",
    },
    {
        id: 5,
        name: "August Billing Export",
        date: "Aug 25, 2026",
        size: "1.8 MB",
        format: "PDF",
    },
];

const PROJECTS = [
    "All Projects",
    "Food Dashboard",
    "Matrix Domain",
    "Project Three",
    "Project Four",
];
const MEMBERS = ["All Members", "Manjay Gupta", "John Ekeler", "Rubik Sans"];

/* ---------- icons ---------- */

function DownloadIcon(p) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            width={16}
            height={16}
            {...p}
        >
            <path d="M12 3v12M7 10l5 5 5-5" />
            <path d="M4 19h16" />
        </svg>
    );
}

function CalendarIcon(p) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            width={16}
            height={16}
            {...p}
        >
            <rect x="3" y="4" width="18" height="17" rx="2" />
            <path d="M3 9h18M8 2v4M16 2v4" />
        </svg>
    );
}

/* ---------- cards ---------- */

function SummaryCard({ label, value, unit, accent, Icon }) {
    const chip =
        accent === "brand"
            ? "bg-brand-soft text-brand"
            : accent === "ink"
              ? "bg-ink text-brand"
              : "bg-canvas text-ink";
    return (
        <div className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(17,17,26,0.04)]">
            <div className="mb-6 flex items-center justify-between">
                <span
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ${chip}`}
                >
                    <Icon width={20} height={20} />
                </span>
                <MoreIcon width={18} height={18} className="text-muted" />
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

function FormatBadge({ format }) {
    const cls =
        format === "PDF"
            ? "bg-[#fdecec] text-[#e05656]"
            : "bg-[#e8f5ef] text-[#3fb27f]";
    return (
        <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${cls}`}>
            {format}
        </span>
    );
}

function Field({ label, children }) {
    return (
        <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">
                {label}
            </label>
            {children}
        </div>
    );
}

/* ---------- preview mini-visual ---------- */

function MiniVisual({ accent, type }) {
    if (type === "progress") {
        return (
            <svg viewBox="0 0 120 48" className="h-12 w-full">
                {[10, 34, 22, 44, 30, 40].map((v, i) => (
                    <rect
                        key={i}
                        x={i * 20 + 4}
                        y={48 - v}
                        width="12"
                        height={v}
                        rx="3"
                        fill={accent}
                        opacity={0.35 + i * 0.11}
                    />
                ))}
            </svg>
        );
    }
    if (type === "utilization") {
        return (
            <svg viewBox="0 0 48 48" className="h-12 w-12 -rotate-90">
                <circle
                    cx="24"
                    cy="24"
                    r="18"
                    fill="none"
                    stroke="#f4f5f7"
                    strokeWidth="8"
                />
                <circle
                    cx="24"
                    cy="24"
                    r="18"
                    fill="none"
                    stroke={accent}
                    strokeWidth="8"
                    strokeDasharray={`${0.84 * 2 * Math.PI * 18} ${2 * Math.PI * 18}`}
                    strokeLinecap="round"
                />
            </svg>
        );
    }
    return (
        <svg
            viewBox="0 0 120 48"
            className="h-12 w-full"
            preserveAspectRatio="none"
        >
            <path
                d="M4 40 L24 26 L44 32 L64 14 L84 22 L104 8 L116 16"
                fill="none"
                stroke={accent}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

/* ---------- page ---------- */

export default function ReportPage() {
    const [format, setFormat] = useState("PDF");
    const [project, setProject] = useState(PROJECTS[0]);
    const [member, setMember] = useState(MEMBERS[0]);
    const [selected, setSelected] = useState("attendance");

    const selectCls =
        "w-full appearance-none rounded-xl border border-hairline bg-white px-4 py-2.5 pr-9 text-sm font-medium text-ink outline-none transition focus:border-brand";

    return (
        <div className="px-5 pb-8 lg:px-8">
            {/* header */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="font-display text-3xl font-bold text-ink">
                        Report &amp; Export
                    </h2>
                    <p className="mt-1 text-sm font-medium text-muted">
                        Generate, preview, and download performance reports
                    </p>
                </div>
            </div>

            {/* summary cards */}
            <div className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {SUMMARY.map((s) => (
                    <SummaryCard key={s.label} {...s} />
                ))}
            </div>

            {/* report generator */}
            <div className="mb-6 rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(17,17,26,0.04)]">
                <h3 className="mb-6 font-display text-[17px] font-semibold text-ink">
                    Report Generator
                </h3>
                <div className="grid gap-4 lg:grid-cols-4">
                    <Field label="Date Range">
                        <button className="flex w-full items-center justify-between rounded-xl border border-hairline px-4 py-2.5 text-sm font-medium text-ink transition hover:border-brand">
                            <span className="flex items-center gap-2">
                                <CalendarIcon className="text-muted" />
                                Sep 01 – Sep 07
                            </span>
                            <ChevronDownIcon
                                width={16}
                                height={16}
                                className="text-muted"
                            />
                        </button>
                    </Field>
                    <Field label="Project">
                        <div className="relative">
                            <select
                                value={project}
                                onChange={(e) => setProject(e.target.value)}
                                className={selectCls}
                            >
                                {PROJECTS.map((p) => (
                                    <option key={p}>{p}</option>
                                ))}
                            </select>
                            <ChevronDownIcon
                                width={16}
                                height={16}
                                className="pointer-events-none absolute right-3 top-3 text-muted"
                            />
                        </div>
                    </Field>
                    <Field label="Team Member">
                        <div className="relative">
                            <select
                                value={member}
                                onChange={(e) => setMember(e.target.value)}
                                className={selectCls}
                            >
                                {MEMBERS.map((m) => (
                                    <option key={m}>{m}</option>
                                ))}
                            </select>
                            <ChevronDownIcon
                                width={16}
                                height={16}
                                className="pointer-events-none absolute right-3 top-3 text-muted"
                            />
                        </div>
                    </Field>
                    <Field label="Format">
                        <div className="flex h-[42px] items-center gap-1 rounded-xl bg-canvas p-1">
                            {["PDF", "CSV"].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFormat(f)}
                                    className={`flex-1 rounded-lg py-1.5 text-sm font-semibold transition ${
                                        format === f
                                            ? "bg-white text-ink shadow-sm"
                                            : "text-muted hover:text-ink"
                                    }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </Field>
                </div>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-muted">
                        Generating a{" "}
                        <span className="font-semibold text-ink">{format}</span>{" "}
                        report for{" "}
                        <span className="font-semibold text-ink">
                            {project}
                        </span>{" "}
                        ·{" "}
                        <span className="font-semibold text-ink">{member}</span>
                    </p>
                    <button className="flex items-center gap-2 rounded-2xl bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-black">
                        <DownloadIcon />
                        Generate Report
                    </button>
                </div>
            </div>

            {/* report preview cards */}
            <h3 className="mb-4 font-display text-[17px] font-semibold text-ink">
                Report Preview
            </h3>
            <div className="mb-6 grid gap-5 lg:grid-cols-3">
                {REPORT_TYPES.map((r) => {
                    const active = selected === r.key;
                    return (
                        <button
                            key={r.key}
                            onClick={() => setSelected(r.key)}
                            className={`rounded-3xl bg-white p-6 text-left shadow-[0_8px_30px_rgba(17,17,26,0.04)] transition hover:-translate-y-0.5 ${
                                active
                                    ? "ring-2 ring-brand"
                                    : "ring-1 ring-transparent"
                            }`}
                        >
                            <div className="mb-5 flex items-start justify-between">
                                <span
                                    className="flex h-11 w-11 items-center justify-center rounded-2xl"
                                    style={{
                                        background: `${r.accent}22`,
                                        color: r.accent,
                                    }}
                                >
                                    <FileIcon width={20} height={20} />
                                </span>
                                {active && (
                                    <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-[#a07a00]">
                                        Selected
                                    </span>
                                )}
                            </div>
                            <h4 className="font-display text-base font-semibold text-ink">
                                {r.title}
                            </h4>
                            <p className="mt-1 text-xs leading-relaxed text-muted">
                                {r.desc}
                            </p>

                            <div className="my-4 flex items-center gap-3">
                                <MiniVisual accent={r.accent} type={r.key} />
                            </div>

                            <div className="flex items-end justify-between border-t border-hairline pt-4">
                                <div>
                                    <div className="font-display text-xl font-bold text-ink">
                                        {r.metric}
                                    </div>
                                    <div className="text-xs text-muted">
                                        {r.metricLabel}
                                    </div>
                                </div>
                                <span className="flex items-center gap-1.5 text-sm font-semibold text-ink transition hover:text-brand">
                                    <DownloadIcon /> Export
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* export history */}
            <div className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(17,17,26,0.04)]">
                <div className="mb-5 flex items-center justify-between">
                    <h3 className="font-display text-[17px] font-semibold text-ink">
                        Export History
                    </h3>
                    <span className="rounded-full bg-canvas px-3 py-1 text-xs font-medium text-muted">
                        {HISTORY.length} files
                    </span>
                </div>
                <div className="space-y-2">
                    {HISTORY.map((h) => (
                        <div
                            key={h.id}
                            className="flex flex-wrap items-center gap-4 rounded-2xl border border-hairline p-4 transition hover:border-brand/60 hover:bg-canvas/50"
                        >
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                                <FileIcon width={20} height={20} />
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-semibold text-ink">
                                    {h.name}
                                </div>
                                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                                    <CalendarIcon width={13} height={13} />
                                    {h.date}
                                    <span className="text-hairline">•</span>
                                    {h.size}
                                </div>
                            </div>
                            <FormatBadge format={h.format} />
                            <button className="flex items-center gap-2 rounded-xl border border-hairline px-4 py-2 text-sm font-medium text-ink transition hover:border-brand hover:bg-brand-soft">
                                <DownloadIcon />
                                Download
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
