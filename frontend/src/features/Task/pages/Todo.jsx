import { useState } from "react";
import { useWorkspace } from "../../../context/WorkspaceContext";
import {
    useTasks,
    parseISODate,
    taskHours,
} from "../../../context/TaskContext";
import AddTaskModal from "../../../components/AddTaskModal";
import EditTaskModal from "../pages/EditTask";
import ProofModal from "../../AI-agent/pages/ProofAi";
import {
    ListIcon,
    ClockIcon,
    FolderIcon,
    MoreIcon,
    SearchIcon,
    SparkleIcon,
    PlusIcon,
    CalendarIcon,
    CheckIcon,
    ClockSmallIcon,
} from "../../../components/icon";

/* ---------- Helpers & Styles ---------- */

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
    try {
        return parseISODate(iso).toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
        });
    } catch {
        return "Invalid Date";
    }
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

const progressOf = (t) => (t.status === "Completed" ? 100 : (t.progress ?? 0));

function aiKey(task) {
    if (task.aiStatus) return task.aiStatus;
    const done = task.status === "Completed";
    return done || (task.progress ?? 0) >= 80 ? "needs" : null;
}

const AI_BADGE = {
    verified: {
        label: "AI Verified",
        cls: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800",
    },
    needs: {
        label: "Needs Proof",
        cls: "bg-brand-soft text-[#8a6a00] ring-brand/40 dark:bg-amber-950/40 dark:text-amber-300",
    },
    feedback: {
        label: "Feedback Added",
        cls: "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-950/40 dark:text-orange-300",
    },
};

/* ---------- Sub Components ---------- */

function Bar({ value }) {
    return (
        <div className="flex items-center gap-3">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-hairline dark:bg-slate-800">
                <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                        value >= 100 ? "bg-[#3fb27f]" : "bg-brand"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                />
            </div>
            <span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-bold text-ink dark:bg-brand/20 dark:text-brand">
                {value}% done
            </span>
        </div>
    );
}

function SummaryCard({ label, value, accent, Icon }) {
    const chip =
        accent === "brand"
            ? "bg-brand-soft text-brand dark:bg-brand/20"
            : accent === "warn"
              ? "bg-[#fdecec] text-[#e05656] dark:bg-rose-950/30"
              : accent === "ink"
                ? "bg-ink text-brand dark:bg-slate-800"
                : "bg-canvas text-ink dark:bg-slate-800 dark:text-slate-200";
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

function TaskItem({ task, onToggle, onDelete, onVerify, onEdit }) {
    const [menuOpen, setMenuOpen] = useState(false);
    if (!task) return null;

    const taskId = task.id || task._id;
    const color = projectColor(task.project || task.workspaceId);
    const done = task.status === "Completed";
    const progress = progressOf(task);
    const key = aiKey(task);
    const badge = key && AI_BADGE[key];
    const verified = task.aiStatus === "verified";

    return (
        <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-hairline bg-white p-5 shadow-[0_8px_30px_rgba(17,17,26,0.03)] transition hover:border-brand/60 dark:bg-slate-900 dark:border-slate-800 sm:flex-nowrap">
            <button
                onClick={() => onToggle(taskId)}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition ${
                    done
                        ? "border-[#3fb27f] bg-[#3fb27f] text-white"
                        : "border-hairline hover:border-brand dark:border-slate-700"
                }`}
            >
                {done && <CheckIcon />}
            </button>

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <span
                        className={`truncate text-sm font-semibold ${
                            done
                                ? "text-muted line-through"
                                : "text-ink dark:text-white"
                        }`}
                    >
                        {task.title}
                    </span>
                    <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                            PRIORITY[task.priority] || PRIORITY.Medium
                        }`}
                    >
                        {task.priority || "Medium"}
                    </span>
                    {badge && (
                        <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${badge.cls}`}
                        >
                            {key === "verified" && (
                                <CheckIcon width={10} height={10} />
                            )}
                            {badge.label}
                        </span>
                    )}
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

                <div className="mt-3 max-w-md">
                    <Bar value={progress} />
                </div>
                {task.aiVerificationReason && (
                    <p className="mt-2 line-clamp-2 text-xs text-muted dark:text-slate-400">
                        AI: {task.aiVerificationReason}
                    </p>
                )}
            </div>

            {!verified && (
                <button
                    onClick={() => onVerify(taskId)}
                    className="flex h-10 shrink-0 items-center gap-2 rounded-2xl bg-brand px-4 text-sm font-bold text-ink transition hover:brightness-95 dark:text-slate-900"
                >
                    <SparkleIcon width={16} height={16} /> AI Verify Proof
                </button>
            )}

            <div className="relative shrink-0">
                <button
                    onClick={() => setMenuOpen((o) => !o)}
                    className="rounded-lg p-1.5 text-muted transition hover:bg-canvas hover:text-ink dark:hover:bg-slate-800 dark:hover:text-white"
                >
                    <MoreIcon width={18} height={18} />
                </button>
                {menuOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setMenuOpen(false)}
                        />
                        <div className="absolute right-0 top-9 z-20 w-36 overflow-hidden rounded-xl border border-hairline bg-white py-1 shadow-xl dark:bg-slate-800 dark:border-slate-700">
                            <button
                                onClick={() => {
                                    onToggle(taskId);
                                    setMenuOpen(false);
                                }}
                                className="block w-full px-4 py-2 text-left text-sm text-ink hover:bg-canvas dark:text-white dark:hover:bg-slate-700"
                            >
                                {done ? "Mark active" : "Mark done"}
                            </button>
                            <button
                                onClick={() => {
                                    onEdit(taskId);
                                    setMenuOpen(false);
                                }}
                                className="block w-full px-4 py-2 text-left text-sm text-ink hover:bg-canvas dark:text-white dark:hover:bg-slate-700"
                            >
                                Edit task
                            </button>
                            <button
                                onClick={() => {
                                    onDelete(taskId);
                                    setMenuOpen(false);
                                }}
                                className="block w-full px-4 py-2 text-left text-sm text-[#e05656] hover:bg-[#fdecec] dark:hover:bg-rose-950/30"
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

/* ---------- Main Page Component ---------- */

export default function TodoPage() {
    const { isPersonal } = useWorkspace();
    const {
        tasks = [],
        loading,
        toggleTask,
        updateTask,
        deleteTask,
        fetchTasks,
    } = useTasks();

    const [tab, setTab] = useState("All");
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState("priority");
    const [modalOpen, setModalOpen] = useState(false);
    const [proofId, setProofId] = useState(null);
    const [editId, setEditId] = useState(null);

    const safeTasks = (tasks || []).filter(Boolean);
    const editTask = safeTasks.find((x) => (x.id || x._id) === editId);
    const proofTask = safeTasks.find((x) => (x.id || x._id) === proofId);

    const projectOptions = [
        ...new Set([
            "personal",
            ...safeTasks.map((x) => x.workspaceId || x.project).filter(Boolean),
        ]),
    ];

    const tabs = ["All Tasks", "Pending", "Completed", "AI Verified"];
    const priorityRank = { High: 0, Medium: 1, Low: 2 };

    const filtered = safeTasks
        .filter((t) => {
            if (tab === "Pending") return t.status !== "Completed";
            if (tab === "Completed") return t.status === "Completed";
            if (tab === "AI Verified") return t.aiStatus === "verified";
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
                    className="flex items-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-black dark:!bg-brand dark:!text-slate-900"
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

            {/* Filter & Search */}
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
                            className="w-full rounded-full border border-hairline bg-white py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition focus:border-brand dark:bg-slate-800 dark:border-slate-700 dark:text-white"
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

            {/* Task List */}
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
                            onVerify={(id) => setProofId(id)}
                            onEdit={(id) => setEditId(id)}
                        />
                    ))}
                    {filtered.length === 0 && (
                        <div className="rounded-3xl bg-white p-12 text-center text-sm text-muted shadow-[0_8px_30px_rgba(17,17,26,0.04)] dark:bg-slate-900">
                            No tasks match your filters.
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            {editTask && (
                <EditTaskModal
                    task={editTask}
                    projects={projectOptions}
                    onClose={() => setEditId(null)}
                    onSave={async (id, patch) => {
                        await updateTask(id, patch);
                        // 🟢 Đã bỏ setEditId(null) tại đây để Modal tự quản lý việc đóng sau khi hiện thông báo 800ms
                    }}
                    onDelete={async (id) => {
                        await deleteTask(id);
                        setEditId(null);
                    }}
                />
            )}

            {proofTask && (
                <ProofModal
                    task={proofTask}
                    onClose={() => setProofId(null)}
                    onResult={async () => {
                        if (fetchTasks) await fetchTasks();
                    }}
                />
            )}

            {modalOpen && (
                <AddTaskModal
                    onClose={() => {
                        setModalOpen(false);
                        if (fetchTasks) fetchTasks();
                    }}
                />
            )}
        </div>
    );
}
