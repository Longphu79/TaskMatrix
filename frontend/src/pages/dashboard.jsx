import { useEffect, useState, useMemo } from "react";
import {
    ChartIcon,
    ClockIcon,
    ListIcon,
    MoreIcon,
    PlayIcon,
    PauseIcon,
} from "../components/icon";
import { useWorkspace } from "../context/WorkspaceContext";
import { useTasks } from "../context/TaskContext";

function IconChip({ children }) {
    return (
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-brand dark:bg-brand/20">
            {children}
        </div>
    );
}

function CardHead({ title, count }) {
    return (
        <div className="mb-5 flex items-center justify-between">
            <h3 className="font-display text-[17px] font-semibold text-ink dark:text-white">
                {title}{" "}
                {count !== undefined && (
                    <span className="text-sm font-normal text-muted">
                        ({count})
                    </span>
                )}
            </h3>
            <button className="rounded-lg p-1 text-muted transition hover:bg-canvas hover:text-ink dark:hover:bg-slate-700 dark:hover:text-white">
                <MoreIcon width={18} height={18} />
            </button>
        </div>
    );
}

function StatCard({ label, value, Icon }) {
    return (
        <div className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(17,17,26,0.04)] dark:border dark:border-slate-700/50 dark:bg-slate-800/90">
            <div className="mb-6 flex items-start justify-between">
                <span className="text-sm font-medium text-muted dark:text-slate-400">
                    {label}
                </span>
                <MoreIcon
                    width={18}
                    height={18}
                    className="text-muted dark:text-slate-400"
                />
            </div>
            <div className="flex items-end justify-between">
                <span className="font-display text-3xl font-bold text-ink dark:text-white">
                    {value}
                </span>
                <IconChip>
                    <Icon width={20} height={20} />
                </IconChip>
            </div>
        </div>
    );
}

// Time Tracker Thời Gian Thực
function TimeTracker() {
    const [running, setRunning] = useState(false);
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        let interval = null;
        if (running) {
            interval = setInterval(() => {
                setSeconds((prev) => prev + 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [running]);

    const formatTime = (totalSec) => {
        const h = String(Math.floor(totalSec / 3600)).padStart(2, "0");
        const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
        const s = String(totalSec % 60).padStart(2, "0");
        return `${h}:${m}:${s}`;
    };

    return (
        <div className="flex items-center justify-between rounded-3xl bg-[#1c1c1c] p-5 pl-7 text-white shadow-[0_16px_40px_rgba(28,28,28,0.25)] dark:border dark:border-slate-700/50 dark:bg-slate-800">
            <div>
                <div className="font-display text-lg font-semibold text-white">
                    {running ? formatTime(seconds) : "Start Time Tracker"}
                </div>
                <div className="mt-0.5 text-xs text-white/60">
                    {running
                        ? "Recording your active session…"
                        : "Track your work session"}
                </div>
            </div>
            <button
                type="button"
                onClick={() => setRunning((r) => !r)}
                className={`flex h-12 w-12 items-center justify-center rounded-2xl transition hover:scale-105 active:scale-95 ${
                    running
                        ? "bg-red-500 text-white"
                        : "bg-brand text-slate-900"
                }`}
            >
                {running ? (
                    <PauseIcon width={22} height={22} />
                ) : (
                    <PlayIcon width={22} height={22} />
                )}
            </button>
        </div>
    );
}

// Danh Sách Task Chưa Làm Xong
function PendingTasksPanel() {
    const { tasks = [], toggleTaskStatus } = useTasks();

    const pendingTasks = useMemo(() => {
        return tasks.filter((t) => t.status !== "Completed");
    }, [tasks]);

    return (
        <div className="flex flex-col rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(17,17,26,0.04)] dark:border dark:border-slate-700/50 dark:bg-slate-800/90">
            <CardHead
                title="Pending & In-Progress Tasks"
                count={pendingTasks.length}
            />

            {pendingTasks.length === 0 ? (
                <div className="flex-1 py-8 text-center text-xs text-muted">
                    🎉 All tasks are completed! No pending tasks.
                </div>
            ) : (
                <div className="flex-1 space-y-3">
                    {pendingTasks.slice(0, 5).map((t, index) => {
                        const taskId = t.id || t._id || `pending-${index}`;
                        return (
                            <div
                                key={taskId}
                                className="flex items-center justify-between gap-3 rounded-2xl bg-canvas p-3 dark:bg-slate-700/40"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            toggleTaskStatus?.(taskId)
                                        }
                                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-hairline transition hover:border-brand dark:border-slate-600"
                                        title="Mark as completed"
                                    />
                                    <span className="truncate text-sm font-semibold text-ink dark:text-white">
                                        {t.title}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                                        {t.status || "Pending"}
                                    </span>
                                    <span className="text-xs text-muted dark:text-slate-400">
                                        {t.dueDate || "Today"}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// Task Ưu Tiên Cao
function HighPriorityTasksPanel() {
    const { tasks = [] } = useTasks();

    const priorityTasks = useMemo(() => {
        return tasks.filter(
            (t) => t.priority === "High" || t.priority === "Medium",
        );
    }, [tasks]);

    return (
        <div className="flex flex-col rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(17,17,26,0.04)] dark:border dark:border-slate-700/50 dark:bg-slate-800/90">
            <CardHead
                title="High Priority Tasks"
                count={priorityTasks.length}
            />

            {priorityTasks.length === 0 ? (
                <div className="flex-1 py-8 text-center text-xs text-muted">
                    No urgent or high-priority tasks right now.
                </div>
            ) : (
                <div className="flex-1 space-y-3">
                    {priorityTasks.slice(0, 5).map((t, index) => {
                        const taskId = t.id || t._id || `priority-${index}`;
                        return (
                            <div
                                key={taskId}
                                className="flex items-center justify-between gap-3 rounded-2xl bg-canvas p-3 dark:bg-slate-700/40"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 shrink-0" />
                                    <span className="truncate text-sm font-semibold text-ink dark:text-white">
                                        {t.title}
                                    </span>
                                </div>
                                <span className="rounded-md bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-500">
                                    {t.priority || "High"}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// Thành Viên Workspace
function MembersPanel() {
    const { members = [] } = useWorkspace();

    return (
        <div className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(17,17,26,0.04)] dark:border dark:border-slate-700/50 dark:bg-slate-800/90">
            <CardHead title="Team Members" count={members.length} />
            <div className="mb-3 grid grid-cols-[1fr_auto] gap-6 px-1 text-xs font-medium text-muted dark:text-slate-400">
                <span>Member Info</span>
                <span className="w-20 text-right">Role</span>
            </div>

            {members.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted">
                    No members in this workspace.
                </div>
            ) : (
                <div className="space-y-2">
                    {members.map((m, index) => {
                        const memberId = m.userId || m.id || `member-${index}`;
                        const memberName =
                            m.fullName || m.name || m.email || "Member";
                        const memberRole = m.role || m.Role || "Member";
                        const initials = memberName
                            .trim()
                            .charAt(0)
                            .toUpperCase();

                        return (
                            <div
                                key={memberId}
                                className="grid grid-cols-[1fr_auto] items-center gap-6 rounded-2xl px-1 py-2 transition hover:bg-canvas dark:hover:bg-slate-700/50"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    {m.avatar ? (
                                        <img
                                            src={m.avatar}
                                            alt={memberName}
                                            className="h-10 w-10 shrink-0 rounded-full bg-canvas object-cover"
                                        />
                                    ) : (
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-ink dark:bg-brand/15 dark:text-brand">
                                            {initials}
                                        </span>
                                    )}
                                    <div className="leading-tight min-w-0">
                                        <div className="truncate text-sm font-semibold text-ink dark:text-white">
                                            {memberName}
                                        </div>
                                        <div className="truncate text-xs text-muted dark:text-slate-400">
                                            {m.email || "active member"}
                                        </div>
                                    </div>
                                </div>
                                <span className="rounded-md bg-brand/10 px-2.5 py-1 text-right text-xs font-bold text-brand">
                                    {memberRole}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// To Do Tasks Panel
function TodoPanel() {
    const { tasks = [], toggleTaskStatus } = useTasks();

    return (
        <div className="flex flex-col rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(17,17,26,0.04)] dark:border dark:border-slate-700/50 dark:bg-slate-800/90">
            <CardHead title="To Do Tasks" count={tasks.length} />
            <div className="mb-3 flex items-center justify-between px-1 text-xs font-medium text-muted dark:text-slate-400">
                <span>Task Name</span>
                <span>Due Date</span>
            </div>

            {tasks.length === 0 ? (
                <div className="flex-1 py-8 text-center text-xs text-muted">
                    No tasks found. Create one to get started!
                </div>
            ) : (
                <div className="flex-1 space-y-3">
                    {tasks.slice(0, 5).map((t, index) => {
                        const taskId = t.id || t._id || `task-${index}`;
                        const isDone = t.status === "Completed";
                        return (
                            <div
                                key={taskId}
                                className="flex items-center justify-between gap-3"
                            >
                                <div className="flex items-center gap-3 truncate">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            toggleTaskStatus?.(taskId)
                                        }
                                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                                            isDone
                                                ? "border-brand bg-brand text-slate-900"
                                                : "border-hairline hover:border-brand dark:border-slate-600"
                                        }`}
                                    >
                                        {isDone && (
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
                                        )}
                                    </button>
                                    <span
                                        className={`truncate text-sm font-medium ${
                                            isDone
                                                ? "text-muted line-through dark:text-slate-500"
                                                : "text-ink dark:text-white"
                                        }`}
                                    >
                                        {t.title}
                                    </span>
                                </div>
                                <span className="shrink-0 text-xs text-muted dark:text-slate-400">
                                    {t.dueDate || "Today"}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function Dashboard() {
    const { isPersonal } = useWorkspace();
    const { tasks = [] } = useTasks();

    // Thống kê hiển thị số tự nhiên (Không padded 0)
    const stats = useMemo(() => {
        const total = tasks.length;
        const completed = tasks.filter((t) => t.status === "Completed").length;
        const pending = total - completed;
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
            completionRate: `${pct}%`,
            totalTasks: total,
            pendingTasks: pending,
        };
    }, [tasks]);

    const todayFormatted = new Date().toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        year: "numeric",
    });

    return (
        <div className="px-5 pb-8 lg:px-8">
            {/* Header Row */}
            <div className="mb-6 grid gap-5 lg:grid-cols-[1fr_minmax(0,360px)]">
                <div className="flex flex-col justify-center">
                    <h2 className="font-display text-3xl font-bold text-ink dark:text-white">
                        Today
                    </h2>
                    <p className="mt-1 text-sm font-medium text-muted dark:text-slate-400">
                        {todayFormatted} |{" "}
                        {new Date().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </p>
                </div>
                <TimeTracker />
            </div>

            {/* Thống kê Tổng Quan */}
            <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-3">
                <StatCard
                    label="Task Completion Rate"
                    value={stats.completionRate}
                    Icon={ChartIcon}
                />
                <StatCard
                    label="Total Workspace Tasks"
                    value={stats.totalTasks}
                    Icon={ListIcon}
                />
                <StatCard
                    label="Pending Tasks"
                    value={stats.pendingTasks}
                    Icon={ClockIcon}
                />
            </div>

            {/* Hàng giữa: Task Chưa Làm Xong + Task Ưu Tiên Cao */}
            <div className="mb-6 grid gap-5 xl:grid-cols-2">
                <PendingTasksPanel />
                <HighPriorityTasksPanel />
            </div>

            {/* Hàng dưới: Member (Công ty) + Task To Do */}
            <div
                className={`grid gap-5 ${
                    isPersonal ? "grid-cols-1" : "xl:grid-cols-2"
                }`}
            >
                {!isPersonal && <MembersPanel />}
                <TodoPanel />
            </div>
        </div>
    );
}
