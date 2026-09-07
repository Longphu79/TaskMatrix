import { useState } from "react";
import {
    ClockIcon,
    ChevronDownIcon,
    MoreIcon,
} from "../assets/components/icon";

/* ---------- data ---------- */

const SUMMARY = [
    {
        label: "Total Hours Logged",
        value: "168.5",
        unit: "hrs",
        accent: "brand",
    },
    { label: "Billable Hours", value: "142.0", unit: "hrs", accent: "ink" },
    { label: "Average Per Day", value: "6.7", unit: "hrs", accent: "brand" },
    { label: "Overtime", value: "12.5", unit: "hrs", accent: "warn" },
];

const INITIAL_LOGS = [
    {
        id: 1,
        date: "Sep 07, 2026",
        project: "Food Dashboard",
        task: "Creating UI Wireframe",
        start: "09:00 AM",
        end: "11:30 AM",
        duration: "02:30:00",
        billable: true,
    },
    {
        id: 2,
        date: "Sep 07, 2026",
        project: "Matrix Domain",
        task: "Research & Development",
        start: "12:00 PM",
        end: "01:20 PM",
        duration: "01:20:00",
        billable: true,
    },
    {
        id: 3,
        date: "Sep 06, 2026",
        project: "Project Three",
        task: "Client Review Meeting",
        start: "02:00 PM",
        end: "03:00 PM",
        duration: "01:00:00",
        billable: false,
    },
    {
        id: 4,
        date: "Sep 06, 2026",
        project: "Food Dashboard",
        task: "Design QA & Handoff",
        start: "03:30 PM",
        end: "06:10 PM",
        duration: "02:40:00",
        billable: true,
    },
    {
        id: 5,
        date: "Sep 05, 2026",
        project: "Project Four",
        task: "Prototype Interactions",
        start: "10:15 AM",
        end: "12:45 PM",
        duration: "02:30:00",
        billable: true,
    },
];

const PROJECT_COLORS = {
    "Food Dashboard": "#f6c62e",
    "Matrix Domain": "#1c1c1c",
    "Project Three": "#f7d873",
    "Project Four": "#9195a1",
};

/* ---------- icons ---------- */

function EditIcon(p) {
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
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
        </svg>
    );
}

function TrashIcon(p) {
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
            <path d="M3 6h18" />
            <path d="M8 6V4h8v2" />
            <path d="M6 6l1 14h10l1-14" />
            <path d="M10 11v6M14 11v6" />
        </svg>
    );
}

function PlusIcon(p) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            width={18}
            height={18}
            {...p}
        >
            <path d="M12 5v14M5 12h14" />
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
            width={18}
            height={18}
            {...p}
        >
            <rect x="3" y="4" width="18" height="17" rx="2" />
            <path d="M3 9h18M8 2v4M16 2v4" />
        </svg>
    );
}

/* ---------- cards ---------- */

function SummaryCard({ label, value, unit, accent }) {
    const chip =
        accent === "brand"
            ? "bg-brand-soft text-brand"
            : accent === "warn"
              ? "bg-[#fdecec] text-[#e05656]"
              : "bg-canvas text-ink";
    return (
        <div className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(17,17,26,0.04)]">
            <div className="mb-6 flex items-center justify-between">
                <span
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ${chip}`}
                >
                    <ClockIcon width={20} height={20} />
                </span>
                <MoreIcon width={18} height={18} className="text-muted" />
            </div>
            <div className="flex items-baseline gap-1">
                <span className="font-display text-3xl font-bold text-ink">
                    {value}
                </span>
                <span className="text-sm font-medium text-muted">{unit}</span>
            </div>
            <p className="mt-1 text-sm font-medium text-muted">{label}</p>
        </div>
    );
}

function ProjectTag({ name }) {
    const color = PROJECT_COLORS[name] ?? "#9195a1";
    return (
        <span className="inline-flex items-center gap-2 text-sm font-medium text-ink">
            <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: color }}
            />
            {name}
        </span>
    );
}

/* ---------- add-time modal ---------- */

function AddTimeModal({ onClose, onSave }) {
    const [form, setForm] = useState({
        date: "",
        project: "Food Dashboard",
        task: "",
        start: "",
        end: "",
        duration: "",
    });
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const inputCls =
        "w-full rounded-xl border border-hairline bg-white px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand";

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-6 flex items-center justify-between">
                    <h3 className="font-display text-xl font-bold text-ink">
                        Add Time Log
                    </h3>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1 text-muted transition hover:bg-canvas hover:text-ink"
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                        >
                            <path
                                d="M6 6l12 12M18 6L6 18"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </svg>
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-muted">
                            Date
                        </label>
                        <input
                            type="date"
                            value={form.date}
                            onChange={set("date")}
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-muted">
                            Project
                        </label>
                        <select
                            value={form.project}
                            onChange={set("project")}
                            className={inputCls}
                        >
                            {Object.keys(PROJECT_COLORS).map((p) => (
                                <option key={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-muted">
                            Task Name
                        </label>
                        <input
                            value={form.task}
                            onChange={set("task")}
                            placeholder="What did you work on?"
                            className={inputCls}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-muted">
                                Start Time
                            </label>
                            <input
                                type="time"
                                value={form.start}
                                onChange={set("start")}
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-muted">
                                End Time
                            </label>
                            <input
                                type="time"
                                value={form.end}
                                onChange={set("end")}
                                className={inputCls}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-7 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="rounded-xl border border-hairline px-5 py-2.5 text-sm font-medium text-muted transition hover:text-ink"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave(form)}
                        className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black"
                    >
                        Save Log
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ---------- page ---------- */

export default function TimesheetsPage() {
    const [range, setRange] = useState("Week");
    const [logs, setLogs] = useState(INITIAL_LOGS);
    const [modalOpen, setModalOpen] = useState(false);
    const ranges = ["Day", "Week", "Month"];

    const handleDelete = (id) => setLogs((l) => l.filter((x) => x.id !== id));

    const handleSave = (form) => {
        const label = form.project || "Food Dashboard";
        setLogs((l) => [
            {
                id: Date.now(),
                date: form.date || "Sep 07, 2026",
                project: label,
                task: form.task || "Untitled Task",
                start: form.start || "—",
                end: form.end || "—",
                duration: "00:00:00",
                billable: true,
            },
            ...l,
        ]);
        setModalOpen(false);
    };

    return (
        <div className="px-5 pb-8 lg:px-8">
            {/* header row */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="font-display text-3xl font-bold text-ink">
                        Timesheets
                    </h2>
                    <p className="mt-1 text-sm font-medium text-muted">
                        Track and manage your logged hours
                    </p>
                </div>
                <button
                    onClick={() => setModalOpen(true)}
                    className="flex items-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-black"
                >
                    <PlusIcon />
                    Add Time Log
                </button>
            </div>

            {/* summary cards */}
            <div className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {SUMMARY.map((s) => (
                    <SummaryCard key={s.label} {...s} />
                ))}
            </div>

            {/* filters */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white p-4 shadow-[0_8px_30px_rgba(17,17,26,0.04)]">
                <button className="flex items-center gap-2 rounded-2xl border border-hairline px-4 py-2.5 text-sm font-medium text-ink transition hover:border-brand">
                    <CalendarIcon className="text-muted" />
                    Sep 01 – Sep 07, 2026
                    <ChevronDownIcon
                        width={16}
                        height={16}
                        className="text-muted"
                    />
                </button>
                <div className="flex items-center gap-1 rounded-full bg-canvas p-1">
                    {ranges.map((r) => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={`rounded-full px-5 py-1.5 text-sm font-medium transition ${
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

            {/* time logs table */}
            <div className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(17,17,26,0.04)]">
                <div className="mb-5 flex items-center justify-between">
                    <h3 className="font-display text-[17px] font-semibold text-ink">
                        Detailed Time Logs
                    </h3>
                    <span className="rounded-full bg-canvas px-3 py-1 text-xs font-medium text-muted">
                        {logs.length} entries
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] border-collapse">
                        <thead>
                            <tr className="text-left text-xs font-medium text-muted">
                                <th className="pb-3 pr-4 font-medium">Date</th>
                                <th className="pb-3 pr-4 font-medium">
                                    Project
                                </th>
                                <th className="pb-3 pr-4 font-medium">
                                    Task Name
                                </th>
                                <th className="pb-3 pr-4 font-medium">
                                    Start &amp; End
                                </th>
                                <th className="pb-3 pr-4 font-medium">
                                    Duration
                                </th>
                                <th className="pb-3 text-right font-medium">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr
                                    key={log.id}
                                    className="border-t border-hairline text-sm transition hover:bg-canvas/60"
                                >
                                    <td className="py-4 pr-4 font-medium text-ink">
                                        {log.date}
                                    </td>
                                    <td className="py-4 pr-4">
                                        <ProjectTag name={log.project} />
                                    </td>
                                    <td className="py-4 pr-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-ink">
                                                {log.task}
                                            </span>
                                            {!log.billable && (
                                                <span className="rounded-md bg-canvas px-2 py-0.5 text-[11px] font-medium text-muted">
                                                    Non-billable
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4 pr-4 text-muted">
                                        {log.start} – {log.end}
                                    </td>
                                    <td className="py-4 pr-4">
                                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-soft px-2.5 py-1 font-semibold text-[#a07a00]">
                                            <ClockIcon width={14} height={14} />
                                            {log.duration}
                                        </span>
                                    </td>
                                    <td className="py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                className="rounded-lg border border-hairline p-2 text-muted transition hover:border-brand hover:text-ink"
                                                aria-label="Edit"
                                            >
                                                <EditIcon />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleDelete(log.id)
                                                }
                                                className="rounded-lg border border-hairline p-2 text-muted transition hover:border-[#e05656] hover:text-[#e05656]"
                                                aria-label="Delete"
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="py-12 text-center text-sm text-muted"
                                    >
                                        No time logs yet. Add your first entry.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {modalOpen && (
                <AddTimeModal
                    onClose={() => setModalOpen(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}
