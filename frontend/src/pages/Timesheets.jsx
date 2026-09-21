import { useMemo, useState } from "react";

/* ---------- date helpers ---------- */

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

// Khung giờ đã được mở rộng từ 06:00 AM đến 11:00 PM (23:00)
const SLOT_START = 6; // 06:00 AM
const SLOT_END = 23; // 11:00 PM
const SLOT_H = 56; // px per hour

function startOfWeek(date) {
    const d = new Date(date);
    const day = (d.getDay() + 6) % 7; // Monday = 0
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
}
function addDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
}
function addMonths(date, n) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + n);
    return d;
}
function sameDay(a, b) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}
function shortDate(d) {
    return `${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
}
function formatHour(h) {
    const ampm = h < 12 ? "AM" : "PM";
    const hr = h % 12 === 0 ? 12 : h % 12;
    return `${String(hr).padStart(2, "0")}:00 ${ampm}`;
}

/* ---------- event data ---------- */

const COLORS = {
    yellow: "bg-brand-soft text-ink border-brand dark:bg-brand/15 dark:text-brand dark:border-brand",
    blue: "bg-blue-50 text-blue-700 border-blue-400 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-400",
    green: "bg-emerald-50 text-emerald-700 border-emerald-400 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-400",
    purple: "bg-purple-50 text-purple-700 border-purple-400 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-400",
    rose: "bg-rose-50 text-rose-700 border-rose-400 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-400",
};

// day: 0 = Monday … 6 = Sunday
const EVENTS = [
    {
        day: 0,
        start: 9,
        end: 11,
        title: "Food Dashboard UI",
        project: "Matrix",
        color: "yellow",
    },
    {
        day: 0,
        start: 13,
        end: 15,
        title: "Wireframe Design",
        project: "Matrix",
        color: "blue",
    },
    {
        day: 1,
        start: 10,
        end: 12,
        title: "API Integration",
        project: "Northwind",
        color: "green",
    },
    {
        day: 1,
        start: 15,
        end: 17,
        title: "Team Sync",
        project: "Internal",
        color: "purple",
    },
    {
        day: 2,
        start: 8,
        end: 10,
        title: "Research",
        project: "Matrix",
        color: "rose",
    },
    {
        day: 2,
        start: 11,
        end: 13,
        title: "Food Dashboard UI",
        project: "Matrix",
        color: "yellow",
    },
    {
        day: 3,
        start: 14,
        end: 17,
        title: "Client Review",
        project: "Studio Nine",
        color: "purple",
    },
    {
        day: 3,
        start: 9,
        end: 10,
        title: "Standup",
        project: "Internal",
        color: "green",
    },
    {
        day: 4,
        start: 9,
        end: 12,
        title: "Wireframe Design",
        project: "Matrix",
        color: "blue",
    },
    {
        day: 4,
        start: 13,
        end: 14,
        title: "Retro",
        project: "Internal",
        color: "rose",
    },
];

const MONTH_TASKS = [
    "Food Dashboard UI",
    "Wireframe",
    "API Integration",
    "Client Review",
    "Research",
    "Team Sync",
];

function dayInfo(date) {
    const d = date.getDate();
    const wd = date.getDay(); // 0 Sun, 6 Sat
    if (wd === 0 || wd === 6) return { hours: 0, tasks: [] };
    const hours = 4 + ((d * 3) % 5) + (d % 2 ? 0.5 : 0);
    const n = 1 + (d % 3);
    const tasks = Array.from(
        { length: n },
        (_, i) => MONTH_TASKS[(d + i) % MONTH_TASKS.length],
    );
    return { hours, tasks };
}

/* project-tag chip colors */
const CHIP = {
    yellow: "bg-brand-soft text-ink dark:bg-brand/15 dark:text-brand",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    purple: "bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

const NOTES = [
    "Completed UI wireframes and responsive testing.",
    "Integrated REST endpoints and handled edge cases.",
    "Reviewed designs with the client and gathered feedback.",
    "Deep research session on competitor dashboards.",
    "Team alignment on sprint goals and blockers.",
    "Refined the component library and design tokens.",
];
const STATUS = [
    "Completed",
    "In Progress",
    "Completed",
    "Completed",
    "In Progress",
];

function formatTime(h, m) {
    const ampm = h < 12 ? "AM" : "PM";
    const hr = h % 12 === 0 ? 12 : h % 12;
    return `${String(hr).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
}
function fmtDuration(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h && m) return `${h}h ${m}m`;
    if (h) return `${h}h`;
    return `${m}m`;
}

function getDayTasks(date) {
    const wd = (date.getDay() + 6) % 7; // Monday = 0
    return EVENTS.filter((e) => e.day === wd).map((e, i) => {
        const startMin = i % 2 === 0 ? 0 : 30;
        const endMin = i % 2 === 0 ? 30 : 0;
        const totalMin = e.end * 60 + endMin - (e.start * 60 + startMin);
        return {
            ...e,
            startLabel: formatTime(e.start, startMin),
            endLabel: formatTime(e.end, endMin),
            duration: fmtDuration(totalMin),
            minutes: totalMin,
            note: NOTES[(wd + i) % NOTES.length],
            status: STATUS[(wd + i) % STATUS.length],
        };
    });
}

/* ---------- summary cards ---------- */

const SUMMARY = [
    { label: "Total Hours Logged", value: "38.5h" },
    { label: "Billable Hours", value: "31.0h" },
    { label: "Average Per Day", value: "7.7h" },
    { label: "Overtime", value: "2.5h" },
];

function SummaryCards() {
    return (
        <div className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {SUMMARY.map((s) => (
                <div
                    key={s.label}
                    className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(17,17,26,0.04)] dark:border dark:border-slate-700/50"
                >
                    <div className="text-sm font-medium text-muted">
                        {s.label}
                    </div>
                    <div className="mt-3 font-display text-3xl font-bold text-ink">
                        {s.value}
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ---------- week view (Cập nhật cuộn dọc + Sticky Header) ---------- */

/* ---------- week view (Đã sửa lỗi tràn viền khi cuộn) ---------- */

function WeekView({ weekStart, onSelectDay }) {
    const today = new Date();
    const hours = [];
    for (let h = SLOT_START; h < SLOT_END; h++) hours.push(h);
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
        <div className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_30px_rgba(17,17,26,0.04)] dark:border dark:border-slate-700/50">
            {/* Khung chứa cuộn - Đã xóa padding ở đây để tránh lọt thẻ task lên mép trên */}
            <div className="max-h-[650px] overflow-x-auto overflow-y-auto">
                <div className="min-w-[720px]">
                    {/* Header dính ở top-0, chuyển padding vào trong header */}
                    <div className="sticky top-0 z-30 flex border-b border-hairline bg-white px-4 pb-3 pt-4 dark:border-slate-700/50 dark:bg-slate-800 sm:px-6">
                        <div className="w-16 shrink-0" />
                        {days.map((d, i) => {
                            const isToday = sameDay(d, today);
                            return (
                                <button
                                    key={i}
                                    onClick={() => onSelectDay(d)}
                                    className="flex-1 cursor-pointer rounded-xl px-1 pb-1 pt-1 text-center transition-all hover:bg-canvas dark:hover:bg-slate-700/40"
                                >
                                    <div
                                        className={`text-xs font-medium ${
                                            isToday
                                                ? "text-brand"
                                                : "text-muted"
                                        }`}
                                    >
                                        {DAY_NAMES[i]}
                                    </div>
                                    <div
                                        className={`mx-auto mt-1 flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                                            isToday
                                                ? "bg-brand text-ink"
                                                : "text-ink dark:text-white"
                                        }`}
                                    >
                                        {d.getDate()}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Lưới thời gian */}
                    <div className="flex px-4 pb-4 pt-2 sm:px-6">
                        {/* Cột hiển thị giờ */}
                        <div className="w-16 shrink-0">
                            {hours.map((h) => (
                                <div
                                    key={h}
                                    style={{ height: SLOT_H }}
                                    className="relative -top-2 pr-2 text-right text-[11px] font-medium text-muted"
                                >
                                    {formatHour(h)}
                                </div>
                            ))}
                        </div>

                        {/* Các cột ngày */}
                        {days.map((d, i) => {
                            const isToday = sameDay(d, today);
                            const dayEvents = EVENTS.filter((e) => e.day === i);
                            return (
                                <div
                                    key={i}
                                    className={`relative flex-1 border-l border-hairline dark:border-slate-700/50 ${
                                        isToday ? "bg-brand/10" : ""
                                    }`}
                                >
                                    {/* Đường kẻ ngang */}
                                    {hours.map((h) => (
                                        <div
                                            key={h}
                                            style={{ height: SLOT_H }}
                                            className="border-b border-hairline dark:border-slate-700/50"
                                        />
                                    ))}

                                    {/* Các thẻ Task */}
                                    {dayEvents.map((e, idx) => (
                                        <div
                                            key={idx}
                                            style={{
                                                position: "absolute",
                                                top:
                                                    (e.start - SLOT_START) *
                                                        SLOT_H +
                                                    3,
                                                height:
                                                    (e.end - e.start) * SLOT_H -
                                                    6,
                                                left: 4,
                                                right: 4,
                                            }}
                                            className={`z-10 overflow-hidden rounded-xl border-l-4 px-2.5 py-1.5 text-left shadow-sm ${COLORS[e.color]}`}
                                        >
                                            <div className="truncate text-xs font-semibold">
                                                {e.title}
                                            </div>
                                            <div className="mt-0.5 truncate text-[10px] opacity-70">
                                                {formatHour(e.start)} –{" "}
                                                {formatHour(e.end)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ---------- month view ---------- */

function MonthView({ anchor, onSelectDay }) {
    const today = new Date();
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const gridStart = startOfWeek(first);
    const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

    return (
        <div className="rounded-3xl bg-white p-4 shadow-[0_8px_30px_rgba(17,17,26,0.04)] dark:border dark:border-slate-700/50 sm:p-6">
            <div className="mb-2 grid grid-cols-7 gap-2">
                {DAY_NAMES.map((d) => (
                    <div
                        key={d}
                        className="pb-1 text-center text-xs font-semibold text-muted"
                    >
                        {d}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
                {cells.map((d, i) => {
                    const inMonth = d.getMonth() === anchor.getMonth();
                    const isToday = sameDay(d, today);
                    const { hours, tasks } = dayInfo(d);
                    return (
                        <div
                            key={i}
                            onClick={() => onSelectDay(d)}
                            className={`min-h-[104px] cursor-pointer rounded-2xl border p-2.5 transition-all hover:border-brand hover:shadow-md ${
                                isToday
                                    ? "border-brand bg-brand/10"
                                    : "border-hairline dark:border-slate-700/50"
                            } ${inMonth ? "bg-white" : "bg-canvas/60 dark:bg-slate-800/40"}`}
                        >
                            <div className="flex items-center justify-between">
                                <span
                                    className={`text-sm font-semibold ${
                                        inMonth ? "text-ink" : "text-muted"
                                    } ${isToday ? "flex h-6 w-6 items-center justify-center rounded-full bg-brand text-ink" : ""}`}
                                >
                                    {d.getDate()}
                                </span>
                                {hours > 0 && inMonth && (
                                    <span className="rounded-md bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold text-ink dark:bg-brand/15 dark:text-brand">
                                        {hours} hrs
                                    </span>
                                )}
                            </div>

                            {inMonth && (
                                <div className="mt-2 space-y-1">
                                    {tasks.slice(0, 2).map((t, idx) => (
                                        <div
                                            key={idx}
                                            className="truncate rounded-md bg-canvas px-1.5 py-0.5 text-[10px] font-medium text-ink dark:bg-slate-700/50 dark:text-slate-200"
                                        >
                                            {t}
                                        </div>
                                    ))}
                                    {tasks.length > 2 && (
                                        <div className="text-[10px] font-medium text-muted">
                                            +{tasks.length - 2} more
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ---------- day detail slide-over ---------- */

function EditIcon() {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
    );
}
function TrashIcon() {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 6h18M8 6V4h8v2m-9 0v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V6" />
            <path d="M10 11v6M14 11v6" />
        </svg>
    );
}

function DayDetailModal({ date, onClose }) {
    const [tasks, setTasks] = useState(() => getDayTasks(date));
    const totalMin = tasks.reduce((sum, t) => sum + t.minutes, 0);
    const fullDate = date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <div
            className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl dark:bg-slate-800 dark:border-l dark:border-slate-700"
            >
                {/* header */}
                <div className="flex items-start justify-between gap-4 border-b border-hairline p-6 dark:border-slate-700">
                    <div>
                        <h3 className="font-display text-lg font-semibold text-ink dark:text-white">
                            {fullDate}
                        </h3>
                        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-ink dark:bg-brand/15 dark:text-brand">
                            {fmtDuration(totalMin) || "0h"} logged
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="shrink-0 rounded-lg p-1.5 text-muted transition hover:bg-canvas hover:text-ink dark:hover:bg-slate-700 dark:hover:text-white"
                        aria-label="Close"
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* timeline list */}
                <div className="flex-1 space-y-4 overflow-y-auto p-6">
                    {tasks.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-canvas text-2xl dark:bg-slate-700">
                                🗓️
                            </div>
                            <p className="mt-4 text-sm font-medium text-muted">
                                No time logged on this day.
                            </p>
                        </div>
                    ) : (
                        tasks.map((t, i) => (
                            <div
                                key={i}
                                className="rounded-2xl border border-hairline p-4 transition hover:border-brand dark:border-slate-700 dark:bg-slate-800"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-semibold text-ink dark:text-white">
                                            {t.title}
                                        </div>
                                        <span
                                            className={`mt-1.5 inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${CHIP[t.color]}`}
                                        >
                                            {t.project}
                                        </span>
                                    </div>
                                    <div className="flex shrink-0 gap-1">
                                        <button
                                            className="rounded-lg p-1.5 text-muted transition hover:bg-canvas hover:text-ink dark:hover:bg-slate-700 dark:hover:text-white"
                                            aria-label="Edit entry"
                                        >
                                            <EditIcon />
                                        </button>
                                        <button
                                            onClick={() =>
                                                setTasks((l) =>
                                                    l.filter(
                                                        (_, idx) => idx !== i,
                                                    ),
                                                )
                                            }
                                            className="rounded-lg p-1.5 text-muted transition hover:bg-[#fdecec] hover:text-[#e05656] dark:hover:bg-rose-500/15"
                                            aria-label="Delete entry"
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                                    <span className="font-medium text-ink dark:text-slate-200">
                                        {t.startLabel} – {t.endLabel}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <svg
                                            width="13"
                                            height="13"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <circle cx="12" cy="12" r="9" />
                                            <path d="M12 7v5l3 2" />
                                        </svg>
                                        {t.duration}
                                    </span>
                                    <span
                                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                            t.status === "Completed"
                                                ? "bg-[#e8f5ef] text-[#3fb27f] dark:bg-emerald-500/15 dark:text-emerald-300"
                                                : "bg-brand-soft text-ink dark:bg-brand/15 dark:text-brand"
                                        }`}
                                    >
                                        {t.status}
                                    </span>
                                </div>

                                <p className="mt-3 border-t border-hairline pt-3 text-xs leading-relaxed text-muted dark:border-slate-700">
                                    {t.note}
                                </p>
                            </div>
                        ))
                    )}
                </div>

                {/* footer */}
                <div className="border-t border-hairline p-6 dark:border-slate-700">
                    <button className="w-full rounded-xl bg-ink py-3 text-sm font-semibold text-white transition hover:bg-black dark:!bg-brand dark:!text-slate-900">
                        + Add Task Log to this Day
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ---------- add modal ---------- */

function AddModal({ onClose }) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:border dark:border-slate-700/50 sm:p-8"
            >
                <h3 className="font-display text-lg font-semibold text-ink">
                    Log Time / Add Task
                </h3>
                <p className="mt-1 text-sm text-muted">
                    Add a new session to your schedule.
                </p>

                <div className="mt-6 space-y-4">
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-muted">
                            Task name
                        </label>
                        <input
                            placeholder="e.g. Wireframe Design"
                            className="w-full rounded-xl border border-hairline bg-white px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand dark:bg-slate-800 dark:border-slate-700/50 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-muted">
                            Project
                        </label>
                        <input
                            placeholder="e.g. Matrix Domain"
                            className="w-full rounded-xl border border-hairline bg-white px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand dark:bg-slate-800 dark:border-slate-700/50 dark:text-white"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-muted">
                                Start
                            </label>
                            <input
                                type="time"
                                defaultValue="09:00"
                                className="w-full rounded-xl border border-hairline bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-brand dark:bg-slate-800 dark:border-slate-700/50 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-muted">
                                End
                            </label>
                            <input
                                type="time"
                                defaultValue="11:00"
                                className="w-full rounded-xl border border-hairline bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-brand dark:bg-slate-800 dark:border-slate-700/50 dark:text-white"
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
                        onClick={onClose}
                        className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black dark:!bg-brand dark:!text-slate-900"
                    >
                        Save Entry
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ---------- page main ---------- */

export default function TimesheetsPage() {
    const [view, setView] = useState("week");
    const [anchor, setAnchor] = useState(new Date());
    const [showModal, setShowModal] = useState(false);
    const [selectedDay, setSelectedDay] = useState(null);

    const weekStart = useMemo(() => startOfWeek(anchor), [anchor]);

    const title = useMemo(() => {
        if (view === "week") {
            const end = addDays(weekStart, 6);
            return `${shortDate(weekStart)} – ${shortDate(end)}, ${end.getFullYear()}`;
        }
        return `${MONTH_NAMES[anchor.getMonth()]} ${anchor.getFullYear()}`;
    }, [view, weekStart, anchor]);

    const go = (dir) => {
        if (view === "week") setAnchor((a) => addDays(a, dir * 7));
        else setAnchor((a) => addMonths(a, dir));
    };

    return (
        <div className="px-5 pb-8 lg:px-8">
            {/* header */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="font-display text-3xl font-bold text-ink">
                        Timesheets
                    </h2>
                    <p className="mt-1 text-sm font-medium text-muted">
                        Your weekly and monthly schedule at a glance
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black dark:!bg-brand dark:!text-slate-900"
                >
                    + Log Time / Add Task
                </button>
            </div>

            <SummaryCards />

            {/* toolbar */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                {/* navigation */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => go(-1)}
                        className="rounded-xl border border-hairline bg-white px-3 py-2 text-sm font-medium text-ink transition hover:border-brand dark:border-slate-700/50"
                        aria-label="Previous"
                    >
                        ←
                    </button>
                    <button
                        onClick={() => setAnchor(new Date())}
                        className="rounded-xl border border-hairline bg-white px-4 py-2 text-sm font-medium text-ink transition hover:border-brand dark:border-slate-700/50"
                    >
                        Today
                    </button>
                    <button
                        onClick={() => go(1)}
                        className="rounded-xl border border-hairline bg-white px-3 py-2 text-sm font-medium text-ink transition hover:border-brand dark:border-slate-700/50"
                        aria-label="Next"
                    >
                        →
                    </button>
                    <span className="ml-2 font-display text-base font-semibold text-ink">
                        {title}
                    </span>
                </div>

                {/* view switcher */}
                <div className="flex gap-1 rounded-xl bg-white p-1 shadow-[0_8px_30px_rgba(17,17,26,0.04)] dark:border dark:border-slate-700/50">
                    {["week", "month"].map((v) => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${
                                view === v
                                    ? "bg-ink text-white dark:!bg-brand dark:!text-slate-900"
                                    : "text-muted hover:text-ink"
                            }`}
                        >
                            {v}
                        </button>
                    ))}
                </div>
            </div>

            {view === "week" ? (
                <WeekView weekStart={weekStart} onSelectDay={setSelectedDay} />
            ) : (
                <MonthView anchor={anchor} onSelectDay={setSelectedDay} />
            )}

            {showModal && <AddModal onClose={() => setShowModal(false)} />}
            {selectedDay && (
                <DayDetailModal
                    date={selectedDay}
                    onClose={() => setSelectedDay(null)}
                />
            )}
        </div>
    );
}
