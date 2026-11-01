import { useState } from "react";
import { useWorkspace } from "../../../context/WorkspaceContext";
import {
    useTasks,
    parseISODate,
    taskHours,
} from "../../../context/TaskContext";
import AddTaskModal from "../../../components/AddTaskModal";
import {
    ListIcon,
    ClockIcon,
    FolderIcon,
    MoreIcon,
    SearchIcon,
} from "../../../components/icon";

/* ---------- Data & Colors ---------- */

const PRIORITY = {
    High: "bg-[#fdecec] text-[#e05656]",
    Medium: "bg-brand-soft text-[#a07a00]",
    Low: "bg-canvas text-muted",
};

const FALLBACK_COLORS = [
    "#f6c62e",
    "#1c1c1c",
    "#f7d873",
    "#9195a1",
    "#3fb27f",
    "#5b8def",
];

function projectColor(project) {
    if (!project) return "#f6c62e";
    let hash = 0;
    for (const ch of project) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}

function formatDue(iso) {
    if (!iso) return "No Due Date";
    return parseISODate(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
    });
}

function format12(time) {
    if (!time) return "--:--";
    if (typeof time === "string" && time.includes("T")) {
        const d = new Date(time);
        return d.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });
    }
    const [h, m] = time.split(":").map(Number);
    const hr = h % 12 === 0 ? 12 : h % 12;
    return `${hr}:${String(m).padStart(2, "0")} ${h % 24 < 12 ? "AM" : "PM"}`;
}

function durationLabel(task) {
    const { start, end } = taskHours(task);
    const mins = Math.round((end - start) * 60);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h && m ? `${h}h ${m}m` : h ? `${h}h` : `${m}m`;
}

/* ---------- Icons ---------- */
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
            width={15}
            height={15}
            {...p}
        >
            <rect x="3" y="4" width="18" height="17" rx="2" />
            <path d="M3 9h18M8 2v4M16 2v4" />
        </svg>
    );
}

function CheckIcon(p) {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" {...p}>
            <path
                d="m5 13 4 4L19 7"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function ClockSmallIcon(p) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            width={15}
            height={15}
            {...p}
        >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
        </svg>
    );
}

function SummaryCard({ label, value, accent, Icon }) {
    const chip =
        accent === "brand"
            ? "bg-brand-soft text-brand"
            : accent === "warn"
              ? "bg-[#fdecec] text-[#e05656]"
              : accent === "ink"
                ? "bg-ink text-brand"
                : "bg-canvas text-ink";
    return (
        <div className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(17,17,26,0.04)] dark:bg-slate-900 dark:border dark:border-slate-700/50">
            <div className="mb-6 flex items-center justify-between">
                <span
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ${chip}`}
                >
                    <Icon width={20} height={20} />
                </span>
                <MoreIcon width={18} height={18} className="text-muted" />
            </div>
            <span className="font-display text-3xl font-bold text-ink dark:text-white">
                {value}
            </span>
            <p className="mt-1 text-sm font-medium text-muted">{label}</p>
        </div>
    );
}

/* ---------- Task Row ---------- */

function TaskItem({ task, onToggle, onDelete }) {
    const [menuOpen, setMenuOpen] = useState(false);
    if (!task) return null;

    const taskId = task.id || task._id;
    const color = projectColor(task.project || task.workspaceId);
    const done = task.status === "Completed";

    return (
        <div className="flex items-center gap-4 rounded-2xl border border-hairline p-4 transition hover:border-brand/60 hover:bg-canvas/50 dark:border-slate-800 dark:hover:bg-slate-800/50">
            <button
                onClick={() => onToggle(taskId)}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition ${
                    done
                        ? "border-[#3fb27f] bg-[#3fb27f] text-white"
                        : "border-hairline hover:border-brand dark:border-slate-700"
                }`}
                aria-label="Toggle complete"
            >
                {done && <CheckIcon />}
            </button>

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <span
                        className={`truncate text-sm font-semibold ${done ? "text-muted line-through" : "text-ink dark:text-white"}`}
                    >
                        {task.title}
                    </span>
                    <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${PRIORITY[task.priority] || PRIORITY.Medium}`}
                    >
                        {task.priority || "Medium"}
                    </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink dark:text-slate-300">
                        <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ background: color }}
                        />
                        {task.project || task.workspaceId || "General"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
                        <CalendarIcon className="text-muted" />
                        {formatDue(task.dueDate)}
                    </span>
                    {task.startTime && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
                            <ClockSmallIcon className="text-muted" />
                            {format12(task.startTime)} –{" "}
                            {format12(task.endTime)}
                            <span className="text-muted/70">
                                ({durationLabel(task)})
                            </span>
                        </span>
                    )}
                </div>
            </div>

            <div className="relative shrink-0">
                <button
                    onClick={() => setMenuOpen((o) => !o)}
                    className="rounded-lg p-1.5 text-muted transition hover:bg-canvas hover:text-ink dark:hover:bg-slate-800 dark:hover:text-white"
                    aria-label="Task menu"
                >
                    <MoreIcon width={18} height={18} />
                </button>
                {menuOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setMenuOpen(false)}
                        />
                        <div className="absolute right-0 top-9 z-20 w-36 overflow-hidden rounded-xl border border-hairline bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                            <button
                                onClick={() => {
                                    onToggle(taskId);
                                    setMenuOpen(false);
                                }}
                                className="block w-full px-4 py-2 text-left text-sm text-ink transition hover:bg-canvas dark:text-white dark:hover:bg-slate-700"
                            >
                                {done ? "Mark active" : "Mark done"}
                            </button>
                            <button
                                onClick={() => {
                                    onDelete(taskId);
                                    setMenuOpen(false);
                                }}
                                className="block w-full px-4 py-2 text-left text-sm text-[#e05656] transition hover:bg-[#fdecec] dark:hover:bg-rose-950/30"
                            >
                                Delete
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

/* ---------- Main Page ---------- */

export default function TodoPage() {
    const { isPersonal, currentWorkspace } = useWorkspace();
    const {
        tasks = [],
        loading,
        toggleTask,
        deleteTask,
        fetchTasks,
    } = useTasks();
    const [tab, setTab] = useState("All");
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState("priority");
    const [modalOpen, setModalOpen] = useState(false);

    const tabs = ["All Tasks", "Pending", "Completed"];
    const priorityRank = { High: 0, Medium: 1, Low: 2 };

    // Bỏ hẳn các phần tử null/undefined trước khi filter
    const safeTasks = (tasks || []).filter(Boolean);

    const filtered = safeTasks
        .filter((t) => {
            if (!t) return false;
            // Nếu không có workspaceId thì cho hiện
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
        })
        .filter((t) => {
            if (!t) return false;
            if (tab === "Pending") return t.status !== "Completed";
            if (tab === "Completed") return t.status === "Completed";
            return true;
        })
        .filter((t) =>
            ((t && t.title) || "").toLowerCase().includes(query.toLowerCase()),
        )
        .sort((a, b) => {
            const dueA = a?.dueDate || "";
            const dueB = b?.dueDate || "";
            const byDue = dueA.localeCompare(dueB);
            return sort === "priority"
                ? (priorityRank[a?.priority] ?? 1) -
                      (priorityRank[b?.priority] ?? 1) || byDue
                : byDue;
        });

    const stats = {
        total: safeTasks.length,
        pending: safeTasks.filter((t) => t?.status !== "Completed").length,
        completed: safeTasks.filter((t) => t?.status === "Completed").length,
        high: safeTasks.filter(
            (t) => t?.priority === "High" && t?.status !== "Completed",
        ).length,
    };

    return (
        <div className="px-5 pb-8 lg:px-8">
            {/* Header */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="font-display text-3xl font-bold text-ink dark:text-white">
                        {isPersonal ? "To Do" : "Projects & Tasks"}
                    </h2>
                    <p className="mt-1 text-sm font-medium text-muted">
                        Manage your tasks and stay on track
                    </p>
                </div>
                <button
                    onClick={() => setModalOpen(true)}
                    className="flex items-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-black dark:!bg-brand dark:!text-slate-900"
                >
                    <PlusIcon />
                    Add Task
                </button>
            </div>

            {/* Summary Cards */}
            <div className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    label="Total Tasks"
                    value={stats.total}
                    accent="ink"
                    Icon={ListIcon}
                />
                <SummaryCard
                    label="Pending"
                    value={stats.pending}
                    accent="brand"
                    Icon={ClockIcon}
                />
                <SummaryCard
                    label="Completed"
                    value={stats.completed}
                    accent="muted"
                    Icon={FolderIcon}
                />
                <SummaryCard
                    label="High Priority"
                    value={stats.high}
                    accent="warn"
                    Icon={ListIcon}
                />
            </div>

            {/* Filter controls */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white p-4 shadow-[0_8px_30px_rgba(17,17,26,0.04)] dark:bg-slate-900 dark:border dark:border-slate-700/50">
                <div className="flex items-center gap-1 rounded-full bg-canvas p-1 dark:bg-slate-800">
                    {tabs.map((t) => (
                        <button
                            key={t}
                            onClick={() =>
                                setTab(t === "All Tasks" ? "All" : t)
                            }
                            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                                (tab === "All" && t === "All Tasks") ||
                                tab === t
                                    ? "bg-ink text-white dark:bg-brand dark:text-slate-900"
                                    : "text-muted hover:text-ink dark:hover:text-white"
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
                    <div className="relative flex min-w-[180px] flex-1 items-center sm:max-w-xs">
                        <SearchIcon
                            width={16}
                            height={16}
                            className="pointer-events-none absolute left-3.5 text-muted"
                        />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search tasks..."
                            className="w-full rounded-full border border-hairline bg-white py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                        />
                    </div>
                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className="rounded-full border border-hairline bg-white px-4 py-2.5 text-sm font-medium text-ink outline-none transition focus:border-brand dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    >
                        <option value="priority">Sort: Priority</option>
                        <option value="due">Sort: Due date</option>
                    </select>
                </div>
            </div>

            {/* Task list */}
            {loading ? (
                <div className="p-12 text-center text-sm font-medium text-muted">
                    Loading tasks from database…
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((task) => (
                        <TaskItem
                            key={task.id || task._id}
                            task={task}
                            onToggle={toggleTask}
                            onDelete={deleteTask}
                        />
                    ))}
                    {filtered.length === 0 && (
                        <div className="rounded-3xl bg-white p-12 text-center text-sm text-muted shadow-[0_8px_30px_rgba(17,17,26,0.04)] dark:bg-slate-900">
                            No tasks match your filters.
                        </div>
                    )}
                </div>
            )}

            {modalOpen && (
                <AddTaskModal
                    onClose={() => {
                        setModalOpen(false);
                        fetchTasks();
                    }}
                />
            )}
        </div>
    );
}
