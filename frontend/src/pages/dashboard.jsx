import { useState } from "react";
import {
    ChartIcon,
    ClockIcon,
    FolderIcon,
    MoreIcon,
    PlayIcon,
    PauseIcon,
} from "../components/icon";
import { useWorkspace } from "../context/WorkspaceContext"; // Kết nối Workspace
import { useTasks } from "../context/TaskContext"; // Kết nối Task dùng chung

const THUMBS = [
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=280&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=400&h=280&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=280&fit=crop&auto=format",
];

const PROJECTS = [
    { name: "Food Dashboard", time: "00:40:00", pct: 82 },
    { name: "Matrix Domain", time: "00:10:00", pct: 28 },
    { name: "Northwind API", time: "00:20:00", pct: 46 },
];

function IconChip({ children }) {
    return (
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-brand dark:bg-brand/20">
            {children}
        </div>
    );
}

function ProgressBar({ pct }) {
    return (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-hairline dark:bg-slate-700">
            <div
                className="h-full rounded-full bg-brand transition-all"
                style={{ width: `${pct}%` }}
            />
        </div>
    );
}

function CardHead({ title }) {
    return (
        <div className="mb-5 flex items-center justify-between">
            <h3 className="font-display text-[17px] font-semibold text-ink dark:text-white">
                {title}
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

function TimeTracker() {
    const [running, setRunning] = useState(false);
    return (
        <div className="flex items-center justify-between rounded-3xl bg-[#1c1c1c] p-5 pl-7 text-white shadow-[0_16px_40px_rgba(28,28,28,0.25)] dark:border dark:border-slate-700/50 dark:bg-slate-800">
            <div>
                <div className="font-display text-lg font-semibold text-white">
                    {running ? "Stop Time Tracker" : "Start Time Tracker"}
                </div>
                <div className="mt-0.5 text-xs text-white/60">
                    {running
                        ? "Recording your session…"
                        : "Track your work session"}
                </div>
            </div>
            <button
                onClick={() => setRunning((r) => !r)}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-slate-900 transition hover:scale-105 active:scale-95"
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

function RecentActivity() {
    return (
        <div className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(17,17,26,0.04)] dark:border dark:border-slate-700/50 dark:bg-slate-800/90">
            <CardHead title="Recent Activity" />
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img
                        src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop"
                        alt="Lê Long Phú"
                        className="h-9 w-9 rounded-full bg-canvas object-cover"
                    />
                    <span className="text-sm font-semibold text-ink dark:text-white">
                        Lê Long Phú
                    </span>
                </div>
                <button className="rounded-full border border-hairline px-4 py-1.5 text-xs font-medium text-muted transition hover:border-brand hover:text-ink dark:border-slate-700 dark:hover:border-brand dark:hover:text-white">
                    View All
                </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
                {THUMBS.map((src, i) => (
                    <img
                        key={i}
                        src={src}
                        alt={`Activity ${i + 1}`}
                        className="h-24 w-full rounded-xl bg-canvas object-cover"
                    />
                ))}
            </div>
        </div>
    );
}

function ProjectsPanel() {
    return (
        <div className="flex flex-col rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(17,17,26,0.04)] dark:border dark:border-slate-700/50 dark:bg-slate-800/90">
            <CardHead title="Projects" />
            <div className="flex-1 space-y-4">
                {PROJECTS.map((p) => (
                    <div key={p.name} className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand dark:bg-brand/20">
                            <FolderIcon width={16} height={16} />
                        </span>
                        <span className="w-28 shrink-0 text-sm font-medium text-ink dark:text-white">
                            {p.name}
                        </span>
                        <span className="rounded-md bg-canvas px-2.5 py-1 text-xs font-medium text-muted dark:bg-slate-700 dark:text-slate-300">
                            {p.time}
                        </span>
                        <div className="flex-1">
                            <ProgressBar pct={p.pct} />
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-6 flex justify-end">
                <button className="rounded-xl bg-[#1c1c1c] px-5 py-2 text-xs font-medium text-white transition hover:bg-black dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
                    View All
                </button>
            </div>
        </div>
    );
}

// Lấy danh sách thành viên thực tế từ WorkspaceContext
function MembersPanel() {
    const { members } = useWorkspace();

    return (
        <div className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(17,17,26,0.04)] dark:border dark:border-slate-700/50 dark:bg-slate-800/90">
            <CardHead title="Team Members" />
            <div className="mb-3 grid grid-cols-[1fr_auto] gap-6 px-1 text-xs font-medium text-muted dark:text-slate-400">
                <span>Member Info</span>
                <span className="w-20 text-right">Role</span>
            </div>
            <div className="space-y-2">
                {members.map((m) => (
                    <div
                        key={m.id || m.name}
                        className="grid grid-cols-[1fr_auto] items-center gap-6 rounded-2xl px-1 py-2 transition hover:bg-canvas dark:hover:bg-slate-700/50"
                    >
                        <div className="flex items-center gap-3">
                            <img
                                src={
                                    m.avatar ||
                                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"
                                }
                                alt={m.name}
                                className="h-10 w-10 rounded-full bg-canvas object-cover"
                            />
                            <div className="leading-tight">
                                <div className="text-sm font-semibold text-ink dark:text-white">
                                    {m.name}
                                </div>
                                <div className="text-xs text-muted dark:text-slate-400">
                                    {m.email || "active member"}
                                </div>
                            </div>
                        </div>
                        <span className="rounded-md bg-brand/10 px-2.5 py-1 text-right text-xs font-bold text-brand">
                            {m.role || "Member"}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Đồng bộ danh sách Task với TaskContext
function TodoPanel() {
    const { tasks, toggleTaskStatus } = useTasks();

    return (
        <div className="flex flex-col rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(17,17,26,0.04)] dark:border dark:border-slate-700/50 dark:bg-slate-800/90">
            <CardHead title="To Do Tasks" />
            <div className="mb-3 flex items-center justify-between px-1 text-xs font-medium text-muted dark:text-slate-400">
                <span>Task Name</span>
                <span>Due Date</span>
            </div>
            <div className="flex-1 space-y-3">
                {tasks.slice(0, 4).map((t) => (
                    <div
                        key={t.id}
                        className="flex items-center justify-between gap-3"
                    >
                        <div className="flex items-center gap-3 truncate">
                            <button
                                onClick={() => toggleTaskStatus(t.id)}
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                                    t.status === "Completed"
                                        ? "border-brand bg-brand text-slate-900"
                                        : "border-hairline hover:border-brand dark:border-slate-600"
                                }`}
                            >
                                {t.status === "Completed" && (
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
                                    t.status === "Completed"
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
                ))}
            </div>
        </div>
    );
}

export default function Dashboard() {
    const { isPersonal } = useWorkspace();

    // Lấy ngày tháng thực tế
    const todayFormatted = new Date().toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        year: "numeric",
    });

    return (
        <div className="px-5 pb-8 lg:px-8">
            {/* Header row */}
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

            {/* Stat cards - 3 cột */}
            <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-3">
                <StatCard
                    label="Weekly Activity"
                    value="78%"
                    Icon={ChartIcon}
                />
                <StatCard
                    label="Worked This Week"
                    value="40:00:05"
                    Icon={ClockIcon}
                />
                <StatCard label="Project Worked" value="03" Icon={FolderIcon} />
            </div>

            {/* Row: Recent Activity + Projects */}
            <div className="mb-6 grid gap-5 xl:grid-cols-2">
                <RecentActivity />
                <ProjectsPanel />
            </div>

            {/* Row: Members (chỉ hiện khi là Công ty) + To Do */}
            <div
                className={`grid gap-5 ${isPersonal ? "grid-cols-1" : "xl:grid-cols-2"}`}
            >
                {!isPersonal && <MembersPanel />}
                <TodoPanel />
            </div>
        </div>
    );
}
