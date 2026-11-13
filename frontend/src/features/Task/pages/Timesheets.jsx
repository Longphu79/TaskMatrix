import { useMemo, useState } from "react";
import {
    useTasks,
    toISODate,
    parseISODate,
    taskHours,
} from "../../../context/TaskContext";
import AddTaskModal from "../../../components/AddTaskModal";
import EditTask from "../../../features/Task/pages/EditTask";
import { useWorkspace } from "../../../context/WorkspaceContext";

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
    if (!a || !b) return false;
    return toISODate(a) === toISODate(b);
}

function shortDate(d) {
    return `${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
}

// Format giờ rút gọn 24h (HH:mm - HH:mm) vừa một dòng, không bị tràn/cắt chữ "1..."
function formatTimeShort(time) {
    if (!time) return "--:--";
    if (typeof time === "string" && time.includes("T")) {
        const d = new Date(time);
        if (isNaN(d.getTime())) return "--:--";
        return d.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
    }
    return String(time);
}

function compactRange(t) {
    if (!t.startTime || !t.endTime) return "All day";
    return `${formatTimeShort(t.startTime)} – ${formatTimeShort(t.endTime)}`;
}

function taskMinutes(task) {
    const { start, end } = taskHours(task);
    return Math.max(0, Math.round((end - start) * 60));
}

function fmtDuration(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h && m) return `${h}h ${m}m`;
    if (h) return `${h}h`;
    return `${m}m`;
}

/* ---------- colors ---------- */

const COLOR_KEYS = ["amber", "blue", "emerald", "purple", "rose"];

const DOT = {
    amber: "bg-amber-400",
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    purple: "bg-purple-500",
    rose: "bg-rose-500",
};

const CHIP = {
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    emerald:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    purple: "bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

function colorForProject(projectStr) {
    const proj = projectStr || "General";
    let hash = 0;
    for (const ch of proj) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    return COLOR_KEYS[hash % COLOR_KEYS.length];
}

/* ---------- task selectors ---------- */

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
            const { start: aStart } = taskHours(a);
            const { start: bStart } = taskHours(b);
            return aStart - bStart;
        });
    }
    return map;
}

/* ---------- icons ---------- */

const ico = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    viewBox: "0 0 24 24",
};
const CalIcon = (p) => (
    <svg width="16" height="16" {...ico} {...p}>
        <rect x="3" y="4" width="18" height="17" rx="3" />
        <path d="M3 9h18M8 2v4M16 2v4" />
    </svg>
);
const PlusIcon = (p) => (
    <svg width="14" height="14" {...ico} {...p}>
        <path d="M12 5v14M5 12h14" />
    </svg>
);
const ChevL = (p) => (
    <svg width="16" height="16" {...ico} {...p}>
        <path d="m15 18-6-6 6-6" />
    </svg>
);
const ChevR = (p) => (
    <svg width="16" height="16" {...ico} {...p}>
        <path d="m9 18 6-6-6-6" />
    </svg>
);
const EditIcon = (p) => (
    <svg width="14" height="14" {...ico} {...p}>
        <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
);
function CheckIcon() {
    return (
        <svg
            width="14"
            height="14"
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
            width="14"
            height="14"
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

const PRIORITY_TEXT = {
    High: "text-rose-600 dark:text-rose-400",
    Medium: "text-amber-600 dark:text-amber-400",
    Low: "text-slate-500 dark:text-slate-400",
};
const PRIORITY_DOT = {
    High: "bg-rose-500",
    Medium: "bg-amber-400",
    Low: "bg-slate-400",
};

const panel =
    "rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700/50 dark:bg-slate-900";

/* ---------- summary cards ---------- */

const sumMin = (list) => list.reduce((sum, t) => sum + taskMinutes(t), 0);

function SummaryCards({ tasks, prevTasks, scope }) {
    const total = sumMin(tasks);
    const done = sumMin(tasks.filter((t) => t.status === "Completed"));
    const prev = sumMin(prevTasks);
    const pct = total ? Math.round((done / total) * 100) : 0;
    const delta = prev ? Math.round(((total - prev) / prev) * 100) : null;
    const trend =
        delta === null
            ? total
                ? {
                      text: "New",
                      cls: "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
                  }
                : null
            : {
                  text: `${delta >= 0 ? "+" : ""}${delta}% vs last ${scope.toLowerCase()}`,
                  cls:
                      delta >= 0
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                          : "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
              };
    const label = "text-[13px] font-medium text-slate-500 dark:text-slate-400";
    const value =
        "mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white";

    return (
        <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <div className={`${panel} p-6`}>
                <div className="flex items-center justify-between gap-2">
                    <span className={label}>Scheduled This {scope}</span>
                    {trend && (
                        <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold whitespace-nowrap ${trend.cls}`}
                        >
                            {trend.text}
                        </span>
                    )}
                </div>
                <div className={value}>{fmtDuration(total) || "0h"}</div>
            </div>
            <div className={`${panel} p-6`}>
                <div className="flex items-center justify-between">
                    <span className={label}>Completed Hours</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {pct}%
                    </span>
                </div>
                <div className={value}>{fmtDuration(done) || "0h"}</div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                        className="h-full rounded-full bg-[#FACC15] transition-all duration-700"
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>
            <div className={`${panel} p-6`}>
                <span className={label}>Pending Hours</span>
                <div className={value}>
                    {fmtDuration(Math.max(0, total - done)) || "0h"}
                </div>
            </div>
            <div className={`${panel} p-6`}>
                <span className={label}>Tasks Scheduled</span>
                <div className={value}>
                    {tasks.length}{" "}
                    <span className="text-lg font-semibold text-slate-400">
                        {tasks.length === 1 ? "Task" : "Tasks"}
                    </span>
                </div>
            </div>
        </div>
    );
}

/* ---------- task card ---------- */

function TaskCard({ task, onOpen, onToggle, onEdit, onDelete }) {
    const taskId = task.id || task._id;
    const done = task.status === "Completed";
    const colorKey = colorForProject(task.project || task.workspaceId);
    const priority = task.priority || "Medium";
    const projectName = task.project || task.workspaceId || "General";

    const act =
        "flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-white";

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onOpen}
            onKeyDown={(e) =>
                e.key === "Enter" && e.target === e.currentTarget && onOpen()
            }
            className="group relative min-w-0 cursor-pointer rounded-xl border border-slate-100 bg-white p-2.5 shadow-xs outline-none transition hover:border-slate-300 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-amber-400 dark:border-slate-800 dark:bg-slate-800/80 dark:hover:border-slate-700"
        >
            {/* Quick Action Hover Bar */}
            <div className="absolute top-1.5 right-1.5 z-10 flex gap-0.5 rounded-lg border border-slate-100 bg-white/95 p-0.5 opacity-0 shadow-sm transition group-focus-within:opacity-100 group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-800/95">
                <button
                    aria-label="Edit task"
                    title="Edit"
                    className={act}
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(taskId);
                    }}
                >
                    <EditIcon width={12} height={12} />
                </button>
                <button
                    aria-label={done ? "Mark pending" : "Mark completed"}
                    title={done ? "Mark pending" : "Complete"}
                    className={`${act} ${done ? "!text-emerald-600 dark:!text-emerald-400" : ""}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle(taskId);
                    }}
                >
                    <CheckIcon />
                </button>
                <button
                    aria-label="Delete task"
                    title="Delete"
                    className={`${act} hover:!bg-rose-50 hover:!text-rose-600 dark:hover:!bg-rose-500/20`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(taskId);
                    }}
                >
                    <TrashIcon />
                </button>
            </div>

            {/* Header: Giờ + Thời lượng */}
            <div className="flex items-center justify-between gap-1 text-[10px] font-semibold text-slate-400 tabular-nums">
                <span className="truncate">{compactRange(task)}</span>
                <span className="shrink-0">
                    {fmtDuration(taskMinutes(task))}
                </span>
            </div>

            {/* Title */}
            <p
                className={`mt-1.5 text-xs leading-tight font-semibold break-words text-slate-800 dark:text-slate-100 ${done ? "line-through opacity-50" : ""}`}
            >
                {task.title}
            </p>

            {/* Footer: Chấm màu Project + Priority */}
            <div className="mt-2.5 flex items-center justify-between gap-1.5 border-t border-slate-100/60 pt-1.5 text-[10px] dark:border-slate-700/40">
                <span className="flex min-w-0 items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400">
                    <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT[colorKey]}`}
                    />
                    <span className="truncate">{projectName}</span>
                </span>
                <span
                    className={`inline-flex shrink-0 items-center gap-1 font-semibold capitalize ${PRIORITY_TEXT[priority]}`}
                >
                    <span
                        className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[priority]}`}
                    />
                    {priority}
                </span>
            </div>
        </div>
    );
}

/* ---------- week board ---------- */

function WeekBoard({
    weekStart,
    byDate,
    onSelectDay,
    onAdd,
    onToggle,
    onEdit,
    onDelete,
}) {
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
        <div className="w-full overflow-x-auto pb-2">
            <div className="grid min-w-[880px] min-h-[460px] grid-cols-7 divide-x divide-slate-100 rounded-3xl border border-slate-100 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
                {days.map((d, i) => {
                    const isToday = sameDay(d, today);
                    const list = byDate.get(toISODate(d)) ?? [];
                    const minutes = sumMin(list);

                    return (
                        <section
                            key={i}
                            aria-label={`${DAY_NAMES[i]} ${d.getDate()}`}
                            className="flex min-w-0 flex-col"
                        >
                            {/* Day Header */}
                            <button
                                onClick={() => onSelectDay(d)}
                                className={`flex w-full items-center justify-between gap-1 px-3 py-3 text-left transition ${
                                    isToday
                                        ? "bg-amber-400/15 text-amber-700 dark:text-amber-400"
                                        : "text-slate-800 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800/50"
                                } ${i === 0 ? "rounded-tl-3xl" : ""} ${i === 6 ? "rounded-tr-3xl" : ""}`}
                            >
                                <span className="flex items-baseline gap-1.5">
                                    <span
                                        className={`text-[11px] font-bold tracking-wider uppercase ${isToday ? "text-amber-600 dark:text-amber-400" : "text-slate-400"}`}
                                    >
                                        {DAY_NAMES[i]}
                                    </span>
                                    <span className="font-display text-lg leading-none font-bold">
                                        {d.getDate()}
                                    </span>
                                </span>
                                <span
                                    className={`text-[11px] font-semibold whitespace-nowrap tabular-nums ${isToday ? "text-amber-700 dark:text-amber-400" : "text-slate-400"}`}
                                >
                                    {minutes ? fmtDuration(minutes) : ""}
                                </span>
                            </button>

                            {/* Day Column Body */}
                            <div className="flex min-w-0 flex-1 flex-col gap-2 p-2.5">
                                {list.length === 0 ? (
                                    <button
                                        onClick={() => onAdd(d)}
                                        className="flex min-h-[100px] w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 text-xs font-medium text-slate-400 transition hover:border-amber-400 hover:bg-amber-400/10 hover:text-slate-700 dark:border-slate-800 dark:hover:border-amber-500/40 dark:hover:text-amber-300"
                                    >
                                        <PlusIcon width={12} height={12} /> Add
                                        Task
                                    </button>
                                ) : (
                                    list.map((t) => (
                                        <TaskCard
                                            key={t.id || t._id}
                                            task={t}
                                            onOpen={() => onSelectDay(d)}
                                            onToggle={onToggle}
                                            onEdit={onEdit}
                                            onDelete={onDelete}
                                        />
                                    ))
                                )}
                            </div>
                        </section>
                    );
                })}
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
        <div className="rounded-3xl bg-white p-4 shadow-[0_8px_30px_rgba(17,17,26,0.04)] dark:border dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="mb-2 grid grid-cols-7 gap-2">
                {DAY_NAMES.map((d) => (
                    <div
                        key={d}
                        className="pb-1 text-center text-xs font-semibold text-slate-400"
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
                    const minutes = sumMin(dayTasks);

                    return (
                        <div
                            key={i}
                            onClick={() => onSelectDay(d)}
                            className={`min-h-[104px] cursor-pointer rounded-2xl border p-2.5 transition-all hover:border-amber-400 hover:shadow-md ${
                                isToday
                                    ? "border-amber-400 bg-amber-400/10"
                                    : "border-slate-100 dark:border-slate-800"
                            } ${inMonth ? "bg-white dark:bg-slate-900" : "bg-slate-50/60 dark:bg-slate-800/40"}`}
                        >
                            <div className="flex items-center justify-between">
                                <span
                                    className={`text-sm font-semibold ${inMonth ? "text-slate-800 dark:text-white" : "text-slate-400"} ${
                                        isToday
                                            ? "flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-slate-900 font-bold"
                                            : ""
                                    }`}
                                >
                                    {d.getDate()}
                                </span>
                                {minutes > 0 && (
                                    <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-900 dark:bg-amber-400/15 dark:text-amber-300">
                                        {fmtDuration(minutes)}
                                    </span>
                                )}
                            </div>

                            {dayTasks.length > 0 && (
                                <div className="mt-2 space-y-1">
                                    {dayTasks.slice(0, 2).map((t) => (
                                        <div
                                            key={t.id || t._id}
                                            className={`truncate rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200 ${
                                                t.status === "Completed"
                                                    ? "line-through opacity-50"
                                                    : ""
                                            }`}
                                        >
                                            {t.title}
                                        </div>
                                    ))}
                                    {dayTasks.length > 2 && (
                                        <div className="text-[10px] font-medium text-slate-400">
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

function DayDetailModal({ date, tasks, onToggle, onDelete, onAdd, onClose }) {
    const totalMin = sumMin(tasks);
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
                className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl dark:border-l dark:border-slate-800 dark:bg-slate-900"
            >
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6 dark:border-slate-800">
                    <div>
                        <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                            {fullDate}
                        </h3>
                        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900 dark:bg-amber-400/15 dark:text-amber-300">
                            {fmtDuration(totalMin) || "0h"} scheduled
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
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

                <div className="flex-1 space-y-3 overflow-y-auto p-6">
                    {tasks.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl dark:bg-slate-800">
                                🗓️
                            </div>
                            <p className="mt-4 text-sm font-medium text-slate-400">
                                No tasks scheduled for this day.
                            </p>
                        </div>
                    ) : (
                        tasks.map((t) => {
                            const done = t.status === "Completed";
                            const taskId = t.id || t._id;
                            const colorKey = colorForProject(
                                t.project || t.workspaceId,
                            );

                            return (
                                <div
                                    key={taskId}
                                    className="rounded-2xl border border-slate-100 p-4 transition hover:border-amber-400 dark:border-slate-800 dark:bg-slate-800/60"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div
                                                className={`truncate text-sm font-semibold text-slate-900 dark:text-white ${done ? "line-through opacity-60" : ""}`}
                                            >
                                                {t.title}
                                            </div>
                                            <span
                                                className={`mt-1.5 inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${CHIP[colorKey]}`}
                                            >
                                                {t.project ||
                                                    t.workspaceId ||
                                                    "General"}
                                            </span>
                                        </div>
                                        <div className="flex shrink-0 gap-1">
                                            <button
                                                onClick={() => onToggle(taskId)}
                                                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-white"
                                                aria-label={
                                                    done
                                                        ? "Mark pending"
                                                        : "Mark completed"
                                                }
                                            >
                                                <CheckIcon />
                                            </button>
                                            <button
                                                onClick={() => onDelete(taskId)}
                                                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/15"
                                                aria-label="Delete task"
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                                        <span className="font-medium text-slate-700 dark:text-slate-200">
                                            {compactRange(t)}
                                        </span>
                                        <span>
                                            {fmtDuration(taskMinutes(t))}
                                        </span>
                                        <span className="capitalize">
                                            {t.priority || "Medium"} priority
                                        </span>
                                        <span
                                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                                done
                                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                                                    : "bg-amber-50 text-amber-900 dark:bg-amber-400/15 dark:text-amber-300"
                                            }`}
                                        >
                                            {t.status || "Pending"}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="border-t border-slate-100 p-6 dark:border-slate-800">
                    <button
                        onClick={() => onAdd(date)}
                        className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-black dark:!bg-[#FACC15] dark:!text-slate-900"
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
    const { tasks = [], toggleTask, updateTask, deleteTask } = useTasks();
    const { isPersonal, currentWorkspace } = useWorkspace();
    const [editId, setEditId] = useState(null);
    const [view, setView] = useState("week");
    const [anchor, setAnchor] = useState(() => new Date());
    const [selectedDay, setSelectedDay] = useState(null);
    const [addDate, setAddDate] = useState(null);

    // Filter Tasks theo Workspace đang chọn
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

    // Lọc Task trong tầm nhìn (Week / Month) cho các Summary Card
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

    const prevTasks = useMemo(() => {
        if (view === "week") {
            const from = toISODate(addDays(weekStart, -7));
            const to = toISODate(addDays(weekStart, -1));
            return workspaceTasks.filter((t) => {
                const d = toISODate(t.dueDate);
                return d >= from && d <= to;
            });
        }
        const p = addMonths(anchor, -1);
        const prefix = `${p.getFullYear()}-${String(p.getMonth() + 1).padStart(2, "0")}`;
        return workspaceTasks.filter((t) =>
            toISODate(t.dueDate).startsWith(prefix),
        );
    }, [workspaceTasks, view, weekStart, anchor]);

    const editTask = workspaceTasks.find((t) => (t.id || t._id) === editId);
    const projectOptions = [
        ...new Set(
            workspaceTasks
                .map((t) => t.project || t.workspaceId)
                .filter(Boolean),
        ),
    ].sort();

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
        <div className="px-5 pb-10 lg:px-8">
            {/* Header Page */}
            <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Timesheets
                    </h2>
                    <p className="mt-1.5 text-sm font-medium text-slate-500">
                        {isPersonal
                            ? "Personal Schedule"
                            : currentWorkspace?.name || "Workspace"}{" "}
                        &bull; Project Workspace
                    </p>
                </div>
                <button
                    onClick={() => setAddDate(toISODate(new Date()))}
                    className="flex h-11 items-center gap-2 rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-md shadow-slate-900/10 transition hover:bg-slate-800 dark:!bg-[#FACC15] dark:!text-slate-900"
                >
                    <PlusIcon /> Log Time / Add Task
                </button>
            </div>

            {/* Summary Cards */}
            <SummaryCards
                tasks={rangeTasks}
                prevTasks={prevTasks}
                scope={view === "week" ? "Week" : "Month"}
            />

            {/* Controller: Navigation + View Switcher */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center rounded-2xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <button
                            onClick={() => go(-1)}
                            aria-label="Previous"
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            <ChevL />
                        </button>
                        <button
                            onClick={() => setAnchor(new Date())}
                            className="h-9 rounded-xl px-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
                        >
                            Today
                        </button>
                        <button
                            onClick={() => go(1)}
                            aria-label="Next"
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            <ChevR />
                        </button>
                    </div>
                    <span className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white">
                        <CalIcon className="text-slate-400" /> {title}
                    </span>
                </div>

                <div
                    role="tablist"
                    className="relative grid grid-cols-2 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                    <span
                        aria-hidden
                        className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-xl bg-slate-900 transition-transform duration-300 ease-out dark:bg-[#FACC15] ${view === "month" ? "translate-x-full" : ""}`}
                    />
                    {["week", "month"].map((v) => (
                        <button
                            key={v}
                            role="tab"
                            aria-selected={view === v}
                            onClick={() => setView(v)}
                            className={`relative z-10 h-9 w-24 rounded-xl text-sm font-semibold capitalize transition-colors ${view === v ? "text-white dark:text-slate-900" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
                        >
                            {v}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Board (Week vs Month) */}
            {view === "week" ? (
                <WeekBoard
                    weekStart={weekStart}
                    byDate={byDate}
                    onSelectDay={setSelectedDay}
                    onAdd={(d) => setAddDate(toISODate(d))}
                    onToggle={toggleTask}
                    onEdit={setEditId}
                    onDelete={deleteTask}
                />
            ) : (
                <MonthView
                    anchor={anchor}
                    byDate={byDate}
                    onSelectDay={setSelectedDay}
                />
            )}

            {/* Edit Modal */}
            {editTask && (
                <EditTask
                    key={editTask.id || editTask._id}
                    task={editTask}
                    projects={projectOptions}
                    onClose={() => setEditId(null)}
                    onSave={(id, patch) => {
                        updateTask(id, patch);
                        setEditId(null);
                    }}
                    onDelete={(id) => {
                        deleteTask(id);
                        setEditId(null);
                    }}
                />
            )}

            {/* Day Detail Slide-Over */}
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

            {/* Add Task Modal */}
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
