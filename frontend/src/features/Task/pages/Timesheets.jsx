import { useMemo, useState } from "react";
import { useWorkspace } from "../../../context/WorkspaceContext"; // Tích hợp Workspace
import {
    useTasks,
    toISODate,
    parseISODate,
    taskHours,
} from "../../../context/TaskContext";
import AddTaskModal from "../../../components/AddTaskModal";

/* ---------- constants & date helpers ---------- */

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

const SLOT_START = 7; // 07:00 AM
const SLOT_END = 23; // 11:00 PM
const SLOT_H = 56; // px per hour

function startOfWeek(date) {
    const d = new Date(date);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday = 0
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
    d.setDate(1);
    d.setMonth(d.getMonth() + n);
    return d;
}
function sameDay(a, b) {
    return toISODate(a) === toISODate(b);
}
function shortDate(d) {
    return `${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
}
function formatHour(h) {
    const hr = h % 12 === 0 ? 12 : h % 12;
    return `${String(hr).padStart(2, "0")}:00 ${h % 24 < 12 ? "AM" : "PM"}`;
}

// Xử lý an toàn cả Time string lẫn ISO DateTime từ MongoDB
function format12(time) {
    if (!time) return "--:--";
    if (typeof time === "string" && time.includes("T")) {
        const d = new Date(time);
        return d.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });
    }
    const [h, m] = String(time).split(":").map(Number);
    if (isNaN(h)) return time;
    const hr = h % 12 === 0 ? 12 : h % 12;
    return `${String(hr).padStart(2, "0")}:${String(m || 0).padStart(2, "0")} ${h % 24 < 12 ? "AM" : "PM"}`;
}

function taskMinutes(task) {
    const { start, end } = taskHours(task);
    return Math.round((end - start) * 60);
}
function fmtDuration(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h && m) return `${h}h ${m}m`;
    if (h) return `${h}h`;
    return `${m}m`;
}

/* ---------- colors ---------- */

const COLORS = {
    yellow: "bg-brand-soft text-ink border-brand dark:bg-brand/15 dark:text-brand dark:border-brand",
    blue: "bg-blue-50 text-blue-700 border-blue-400 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-400",
    green: "bg-emerald-50 text-emerald-700 border-emerald-400 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-400",
    purple: "bg-purple-50 text-purple-700 border-purple-400 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-400",
    rose: "bg-rose-50 text-rose-700 border-rose-400 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-400",
};
const CHIP = {
    yellow: "bg-brand-soft text-ink dark:bg-brand/15 dark:text-brand",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    purple: "bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};
const COLOR_KEYS = Object.keys(COLORS);

function colorForProject(projectStr) {
    const proj = projectStr || "General";
    let hash = 0;
    for (const ch of proj) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    return COLOR_KEYS[hash % COLOR_KEYS.length];
}

/* ---------- task selectors ---------- */

// Chuẩn hóa key dueDate bằng toISODate() để khớp chính xác
function groupByDate(tasks) {
    const map = new Map();
    for (const t of tasks) {
        if (!t || !t.dueDate) continue;
        const key = toISODate(t.dueDate);
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(t);
    }
    for (const list of map.values()) {
        list.sort((a, b) => {
            const aTime = String(a.startTime || "");
            const bTime = String(b.startTime || "");
            return aTime.localeCompare(bTime);
        });
    }
    return map;
}

function layoutDay(dayTasks) {
    const items = dayTasks
        .map((task) => {
            const { start, end } = taskHours(task);
            return {
                task,
                start: Math.max(start, SLOT_START),
                end: Math.min(end, SLOT_END),
            };
        })
        .filter((i) => i.end > i.start)
        .sort((a, b) => a.start - b.start || a.end - b.end);

    const result = [];
    let cluster = [];
    let columnEnds = [];
    let clusterEnd = -1;

    const flush = () => {
        for (const item of cluster) item.cols = columnEnds.length;
        result.push(...cluster);
        cluster = [];
        columnEnds = [];
    };

    for (const item of items) {
        if (cluster.length && item.start >= clusterEnd) flush();
        let col = columnEnds.findIndex((end) => end <= item.start);
        if (col === -1) col = columnEnds.length;
        columnEnds[col] = item.end;
        item.col = col;
        cluster.push(item);
        clusterEnd = Math.max(clusterEnd, item.end);
    }
    flush();
    return result;
}

/* ---------- summary cards ---------- */

function SummaryCards({ tasks, scope }) {
    const total = tasks.reduce((sum, t) => sum + taskMinutes(t), 0);
    const done = tasks
        .filter((t) => t.status === "Completed")
        .reduce((sum, t) => sum + taskMinutes(t), 0);
    const cards = [
        { label: `Scheduled This ${scope}`, value: fmtDuration(total) || "0h" },
        { label: "Completed Hours", value: fmtDuration(done) || "0h" },
        { label: "Pending Hours", value: fmtDuration(total - done) || "0h" },
        { label: `Tasks This ${scope}`, value: tasks.length },
    ];

    return (
        <div className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((c) => (
                <div
                    key={c.label}
                    className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(17,17,26,0.04)] dark:bg-slate-900 dark:border dark:border-slate-700/50"
                >
                    <div className="text-sm font-medium text-muted">
                        {c.label}
                    </div>
                    <div className="mt-3 font-display text-3xl font-bold text-ink dark:text-white">
                        {c.value}
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ---------- week view ---------- */

function WeekView({ weekStart, byDate, onSelectDay }) {
    const today = new Date();
    const hours = [];
    for (let h = SLOT_START; h < SLOT_END; h++) hours.push(h);
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
        <div className="overflow-x-auto rounded-3xl bg-white p-4 shadow-[0_8px_30px_rgba(17,17,26,0.04)] dark:bg-slate-900 dark:border dark:border-slate-700/50 sm:p-6">
            <div className="min-w-[720px]">
                <div className="flex">
                    <div className="w-16 shrink-0" />
                    {days.map((d, i) => {
                        const isToday = sameDay(d, today);
                        return (
                            <button
                                key={i}
                                onClick={() => onSelectDay(d)}
                                className="flex-1 cursor-pointer rounded-xl px-1 pb-3 pt-1 text-center transition-all hover:bg-canvas dark:hover:bg-slate-700/40"
                            >
                                <div
                                    className={`text-xs font-medium ${isToday ? "text-brand" : "text-muted"}`}
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

                <div className="flex">
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

                    {days.map((d, i) => {
                        const isToday = sameDay(d, today);
                        const placed = layoutDay(
                            byDate.get(toISODate(d)) ?? [],
                        );
                        return (
                            <div
                                key={i}
                                className={`relative flex-1 border-l border-hairline dark:border-slate-700/50 ${
                                    isToday ? "bg-brand/10" : ""
                                }`}
                            >
                                {hours.map((h) => (
                                    <div
                                        key={h}
                                        style={{ height: SLOT_H }}
                                        className="border-b border-hairline dark:border-slate-700/50"
                                    />
                                ))}
                                {placed.map(
                                    ({ task, start, end, col, cols }) => (
                                        <button
                                            key={task.id || task._id}
                                            type="button"
                                            onClick={() => onSelectDay(d)}
                                            title={`${task.title} · ${format12(task.startTime)} – ${format12(task.endTime)}`}
                                            style={{
                                                position: "absolute",
                                                top:
                                                    (start - SLOT_START) *
                                                        SLOT_H +
                                                    3,
                                                height:
                                                    (end - start) * SLOT_H - 6,
                                                left: `calc(${(col / cols) * 100}% + 4px)`,
                                                width: `calc(${100 / cols}% - 8px)`,
                                            }}
                                            className={`overflow-hidden rounded-xl border-l-4 px-2.5 py-1.5 text-left transition hover:shadow-md ${
                                                COLORS[
                                                    colorForProject(
                                                        task.project ||
                                                            task.workspaceId,
                                                    )
                                                ]
                                            } ${task.status === "Completed" ? "opacity-60" : ""}`}
                                        >
                                            <div
                                                className={`truncate text-xs font-semibold ${task.status === "Completed" ? "line-through" : ""}`}
                                            >
                                                {task.title}
                                            </div>
                                            <div className="mt-0.5 truncate text-[10px] opacity-70">
                                                {format12(task.startTime)} –{" "}
                                                {format12(task.endTime)}
                                            </div>
                                        </button>
                                    ),
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

/* ---------- month view ---------- */

function MonthView({ anchor, byDate, onSelectDay }) {
    const today = new Date();
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const gridStart = startOfWeek(first);
    const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

    return (
        <div className="rounded-3xl bg-white p-4 shadow-[0_8px_30px_rgba(17,17,26,0.04)] dark:bg-slate-900 dark:border dark:border-slate-700/50 sm:p-6">
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
                    const dayTasks = byDate.get(toISODate(d)) ?? [];
                    const minutes = dayTasks.reduce(
                        (sum, t) => sum + taskMinutes(t),
                        0,
                    );

                    return (
                        <div
                            key={i}
                            onClick={() => onSelectDay(d)}
                            className={`min-h-[104px] cursor-pointer rounded-2xl border p-2.5 transition-all hover:border-brand hover:shadow-md ${
                                isToday
                                    ? "border-brand bg-brand/10"
                                    : "border-hairline dark:border-slate-700/50"
                            } ${inMonth ? "bg-white dark:bg-slate-900" : "bg-canvas/60 dark:bg-slate-800/40"}`}
                        >
                            <div className="flex items-center justify-between">
                                <span
                                    className={`text-sm font-semibold ${inMonth ? "text-ink dark:text-white" : "text-muted"} ${
                                        isToday
                                            ? "flex h-6 w-6 items-center justify-center rounded-full bg-brand text-ink"
                                            : ""
                                    }`}
                                >
                                    {d.getDate()}
                                </span>
                                {minutes > 0 && (
                                    <span className="rounded-md bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold text-ink dark:bg-brand/15 dark:text-brand">
                                        {fmtDuration(minutes)}
                                    </span>
                                )}
                            </div>

                            {dayTasks.length > 0 && (
                                <div className="mt-2 space-y-1">
                                    {dayTasks.slice(0, 2).map((t) => (
                                        <div
                                            key={t.id || t._id}
                                            className={`truncate rounded-md bg-canvas px-1.5 py-0.5 text-[10px] font-medium text-ink dark:bg-slate-700/50 dark:text-slate-200 ${
                                                t.status === "Completed"
                                                    ? "line-through opacity-60"
                                                    : ""
                                            }`}
                                        >
                                            {t.title}
                                        </div>
                                    ))}
                                    {dayTasks.length > 2 && (
                                        <div className="text-[10px] font-medium text-muted">
                                            +{dayTasks.length - 2} more
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

function CheckIcon() {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m5 13 4 4L19 7" />
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

function DayDetailModal({ date, tasks, onToggle, onDelete, onAdd, onClose }) {
    const totalMin = tasks.reduce((sum, t) => sum + taskMinutes(t), 0);
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
                <div className="flex items-start justify-between gap-4 border-b border-hairline p-6 dark:border-slate-700">
                    <div>
                        <h3 className="font-display text-lg font-semibold text-ink dark:text-white">
                            {fullDate}
                        </h3>
                        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-ink dark:bg-brand/15 dark:text-brand">
                            {fmtDuration(totalMin) || "0h"} scheduled
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

                <div className="flex-1 space-y-4 overflow-y-auto p-6">
                    {tasks.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-canvas text-2xl dark:bg-slate-700">
                                🗓️
                            </div>
                            <p className="mt-4 text-sm font-medium text-muted">
                                No tasks scheduled for this day.
                            </p>
                        </div>
                    ) : (
                        tasks.map((t) => {
                            const done = t.status === "Completed";
                            const taskId = t.id || t._id;
                            return (
                                <div
                                    key={taskId}
                                    className="rounded-2xl border border-hairline p-4 transition hover:border-brand dark:border-slate-700 dark:bg-slate-800"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div
                                                className={`truncate text-sm font-semibold text-ink dark:text-white ${done ? "line-through opacity-60" : ""}`}
                                            >
                                                {t.title}
                                            </div>
                                            <span
                                                className={`mt-1.5 inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${CHIP[colorForProject(t.project || t.workspaceId)]}`}
                                            >
                                                {t.project ||
                                                    t.workspaceId ||
                                                    "General"}
                                            </span>
                                        </div>
                                        <div className="flex shrink-0 gap-1">
                                            <button
                                                onClick={() => onToggle(taskId)}
                                                className="rounded-lg p-1.5 text-muted transition hover:bg-canvas hover:text-ink dark:hover:bg-slate-700 dark:hover:text-white"
                                            >
                                                <CheckIcon />
                                            </button>
                                            <button
                                                onClick={() => onDelete(taskId)}
                                                className="rounded-lg p-1.5 text-muted transition hover:bg-[#fdecec] hover:text-[#e05656] dark:hover:bg-rose-500/15"
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                                        <span className="font-medium text-ink dark:text-slate-200">
                                            {format12(t.startTime)} –{" "}
                                            {format12(t.endTime)}
                                        </span>
                                        <span>
                                            {fmtDuration(taskMinutes(t))}
                                        </span>
                                        <span>{t.priority} priority</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="border-t border-hairline p-6 dark:border-slate-700">
                    <button
                        onClick={() => onAdd(date)}
                        className="w-full rounded-xl bg-ink py-3 text-sm font-semibold text-white transition hover:bg-black dark:!bg-brand dark:!text-slate-900"
                    >
                        + Add Task to this Day
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ---------- main page ---------- */

export default function TimesheetsPage() {
    const { isPersonal, currentWorkspace } = useWorkspace(); // Lấy workspace hiện tại
    const { tasks = [], toggleTask, deleteTask } = useTasks();
    const [view, setView] = useState("week");
    const [anchor, setAnchor] = useState(() => new Date());
    const [selectedDay, setSelectedDay] = useState(null);
    const [addDate, setAddDate] = useState(null);

    // Lọc Task theo Workspace (Cá nhân vs Công ty)
    const workspaceTasks = useMemo(() => {
        return (tasks || []).filter((t) => {
            if (!t) return false;
            if (!t.workspaceId) return true;
            if (currentWorkspace?.id) {
                const targetWs = String(t.workspaceId).toLowerCase();
                const activeWs = String(currentWorkspace.id).toLowerCase();
                return (
                    targetWs === activeWs ||
                    activeWs === "personal" ||
                    targetWs === "personal"
                );
            }
            return true;
        });
    }, [tasks, currentWorkspace]);

    const weekStart = useMemo(() => startOfWeek(anchor), [anchor]);
    const byDate = useMemo(() => groupByDate(workspaceTasks), [workspaceTasks]);

    // Lọc Task nằm trong khoảng Tuần hoặc Tháng đang xem
    const rangeTasks = useMemo(() => {
        if (view === "week") {
            const from = toISODate(weekStart);
            const to = toISODate(addDays(weekStart, 6));
            return workspaceTasks.filter((t) => {
                const d = toISODate(t.dueDate);
                return d >= from && d <= to;
            });
        }
        const prefix = `${anchor.getFullYear()}-${String(anchor.getMonth() + 1).padStart(2, "0")}`;
        return workspaceTasks.filter((t) =>
            toISODate(t.dueDate).startsWith(prefix),
        );
    }, [workspaceTasks, view, weekStart, anchor]);

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
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="font-display text-3xl font-bold text-ink dark:text-white">
                        Timesheets
                    </h2>
                    <p className="mt-1 text-sm font-medium text-muted">
                        {isPersonal
                            ? "Personal Schedule"
                            : `${currentWorkspace?.name || "Project"} Schedule`}
                    </p>
                </div>
                <button
                    onClick={() => setAddDate(toISODate(new Date()))}
                    className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black dark:!bg-brand dark:!text-slate-900"
                >
                    + Log Time / Add Task
                </button>
            </div>

            <SummaryCards
                tasks={rangeTasks}
                scope={view === "week" ? "Week" : "Month"}
            />

            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => go(-1)}
                        className="rounded-xl border border-hairline bg-white px-3 py-2 text-sm font-medium text-ink transition hover:border-brand dark:bg-slate-900 dark:border-slate-700/50 dark:text-white"
                        aria-label="Previous"
                    >
                        ←
                    </button>
                    <button
                        onClick={() => setAnchor(new Date())}
                        className="rounded-xl border border-hairline bg-white px-4 py-2 text-sm font-medium text-ink transition hover:border-brand dark:bg-slate-900 dark:border-slate-700/50 dark:text-white"
                    >
                        Today
                    </button>
                    <button
                        onClick={() => go(1)}
                        className="rounded-xl border border-hairline bg-white px-3 py-2 text-sm font-medium text-ink transition hover:border-brand dark:bg-slate-900 dark:border-slate-700/50 dark:text-white"
                        aria-label="Next"
                    >
                        →
                    </button>
                    <span className="ml-2 font-display text-base font-semibold text-ink dark:text-white">
                        {title}
                    </span>
                </div>

                <div className="flex gap-1 rounded-xl bg-white p-1 shadow-[0_8px_30px_rgba(17,17,26,0.04)] dark:bg-slate-900 dark:border dark:border-slate-700/50">
                    {["week", "month"].map((v) => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${
                                view === v
                                    ? "bg-ink text-white dark:!bg-brand dark:!text-slate-900"
                                    : "text-muted hover:text-ink dark:hover:text-white"
                            }`}
                        >
                            {v}
                        </button>
                    ))}
                </div>
            </div>

            {view === "week" ? (
                <WeekView
                    weekStart={weekStart}
                    byDate={byDate}
                    onSelectDay={setSelectedDay}
                />
            ) : (
                <MonthView
                    anchor={anchor}
                    byDate={byDate}
                    onSelectDay={setSelectedDay}
                />
            )}

            {selectedDay && (
                <DayDetailModal
                    date={selectedDay}
                    tasks={byDate.get(toISODate(selectedDay)) ?? []}
                    onToggle={toggleTask}
                    onDelete={deleteTask}
                    onAdd={(d) => setAddDate(toISODate(d))}
                    onClose={() => setSelectedDay(null)}
                />
            )}

            {addDate && (
                <AddTaskModal
                    defaultDate={addDate}
                    onAdded={(task) => setAnchor(parseISODate(task.dueDate))}
                    onClose={() => setAddDate(null)}
                />
            )}
        </div>
    );
}
