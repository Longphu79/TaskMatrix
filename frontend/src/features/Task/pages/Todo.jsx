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

// Lấy progress (nếu Done -> 100%, nếu có subtasks thì do Context tính, ko thì lấy Progress tay)
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

// 1. Icon cho Checklist
const small = {
    width: 14,
    height: 14,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round",
    strokeLinejoin: "round",
};
const ChevronIcon = (p) => (
    <svg width={16} height={16} {...{ ...small, width: 16, height: 16 }} {...p}>
        <path d="m6 9 6 6 6-6" />
    </svg>
);
const TrashSmall = (p) => (
    <svg {...small} {...p}>
        <path d="M3 6h18M8 6V4h8v2m-9 0v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V6M10 11v6M14 11v6" />
    </svg>
);

// 2. Component Checklist Mới Thêm Vào
function Checklist({ task, onAddSub, onToggleSub, onDeleteSub }) {
    const [title, setTitle] = useState("");
    const subs = task.subTasks ?? []; // Khớp với BE C# (`subTasks`)

    const submit = (e) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        if (!title.trim()) return;
        onAddSub(task.id || task._id, title);
        setTitle("");
    };

    return (
        <div
            className="mt-4 max-w-xl rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50"
            onClick={(e) => e.stopPropagation()}
        >
            <ul aria-label="Sub-tasks" className="space-y-0.5">
                {subs.map((s) => (
                    <li
                        key={s.id}
                        className="group/sub flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-white dark:hover:bg-slate-700/50"
                    >
                        <button
                            role="checkbox"
                            aria-checked={s.isCompleted}
                            onClick={() =>
                                onToggleSub(task.id || task._id, s.id)
                            }
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition ${
                                s.isCompleted
                                    ? "border-[#3fb27f] bg-[#3fb27f] text-white"
                                    : "border-slate-300 bg-white hover:border-brand dark:border-slate-600 dark:bg-slate-800"
                            }`}
                        >
                            {s.isCompleted && (
                                <CheckIcon width={12} height={12} />
                            )}
                        </button>
                        <span
                            className={`min-w-0 flex-1 text-[13px] font-medium break-words transition ${
                                s.isCompleted
                                    ? "text-slate-400 line-through"
                                    : "text-slate-700 dark:text-slate-300"
                            }`}
                        >
                            {s.title}
                        </span>
                        <button
                            onClick={() =>
                                onDeleteSub(task.id || task._id, s.id)
                            }
                            className="rounded-md p-1.5 text-slate-400 opacity-0 transition group-focus-within/sub:opacity-100 group-hover/sub:opacity-100 hover:bg-[#fdecec] hover:text-[#e05656]"
                        >
                            <TrashSmall />
                        </button>
                    </li>
                ))}
            </ul>
            <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={submit}
                placeholder="+ Add sub-task..."
                className={`w-full rounded-lg bg-transparent px-2 py-2 text-[13px] font-medium text-slate-700 outline-none placeholder:text-slate-400 focus:bg-white dark:text-slate-200 dark:focus:bg-slate-700/50 ${subs.length ? "mt-2" : ""}`}
            />
        </div>
    );
}

function Bar({ value, subTasksCount }) {
    return (
        <div>
            <div className="flex items-center gap-3">
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-hairline dark:bg-slate-800">
                    <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                            value >= 100 ? "bg-[#3fb27f]" : "bg-brand"
                        }`}
                        style={{
                            width: `${Math.min(100, Math.max(0, value))}%`,
                        }}
                    />
                </div>
                <span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-bold text-ink dark:bg-brand/20 dark:text-brand">
                    {value}% done
                </span>
            </div>
            {/* Hiển thị "1 of 3 sub-tasks" nếu có subtask giống trong ảnh */}
            {subTasksCount > 0 && (
                <div className="mt-1.5 text-[11px] font-medium text-slate-500">
                    {Math.round((value / 100) * subTasksCount)} of{" "}
                    {subTasksCount} sub-tasks
                </div>
            )}
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

// 3. Update TaskItem thêm Expand/Collapse Checklist
function TaskItem({ task, onToggle, onDelete, onVerify, onEdit, updateTask }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false); // Trạng thái mở Accordion

    if (!task) return null;

    const taskId = task.id || task._id;
    const color = projectColor(task.project || task.workspaceId);
    const done = task.status === "Completed";
    const progress = progressOf(task);
    const key = aiKey(task);
    const badge = key && AI_BADGE[key];
    const verified = task.aiStatus === "verified";
    const subTasks = task.subTasks || [];

    // --- XỬ LÝ SUB-TASKS & TỰ ĐỘNG TÍNH LẠI % CỦA TASK MẸ ---
    const calculateProgress = (newSubTasks) => {
        if (newSubTasks.length === 0)
            return task.status === "Completed" ? 100 : 0;
        const doneCount = newSubTasks.filter((s) => s.isCompleted).length;
        return Math.round((doneCount / newSubTasks.length) * 100);
    };

    const handleAddSubTask = (id, title) => {
        const generateObjectId = () =>
            [...Array(24)]
                .map(() => Math.floor(Math.random() * 16).toString(16))
                .join("");

        const newSubTasks = [
            ...subTasks,
            { id: generateObjectId(), title, isCompleted: false },
        ];

        const newProgress = calculateProgress(newSubTasks);
        updateTask(taskId, {
            subTasks: newSubTasks,
            progress: newProgress,
            status: newProgress === 100 ? "Completed" : "Pending",
        });
    };

    const handleToggleSubTask = (id, subId) => {
        const newSubTasks = subTasks.map((s) =>
            s.id === subId ? { ...s, isCompleted: !s.isCompleted } : s,
        );
        const newProgress = calculateProgress(newSubTasks);
        updateTask(taskId, {
            subTasks: newSubTasks,
            progress: newProgress,
            status: newProgress === 100 ? "Completed" : "Pending",
        });
    };

    const handleDeleteSubTask = (id, subId) => {
        const newSubTasks = subTasks.filter((s) => s.id !== subId);
        const newProgress = calculateProgress(newSubTasks);
        updateTask(taskId, {
            subTasks: newSubTasks,
            progress: newProgress,
            status: newProgress === 100 ? "Completed" : "Pending",
        });
    };

    // Khi click Check Task chính: Tick xanh toàn bộ subtask
    const handleMainToggle = () => {
        if (subTasks.length > 0) {
            const markDone = progress < 100;
            const newSubTasks = subTasks.map((s) => ({
                ...s,
                isCompleted: markDone,
            }));
            updateTask(taskId, {
                subTasks: newSubTasks,
                progress: markDone ? 100 : 0,
                status: markDone ? "Completed" : "Pending",
            });
        } else {
            onToggle(taskId); // Giữ nguyên luồng cũ nếu ko có subtask
        }
    };

    return (
        <div className="rounded-3xl border border-hairline bg-white p-5 shadow-[0_8px_30px_rgba(17,17,26,0.03)] transition hover:border-brand/60 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-4 sm:flex-nowrap">
                <button
                    onClick={handleMainToggle}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition ${
                        done
                            ? "border-[#3fb27f] bg-[#3fb27f] text-white"
                            : "border-hairline hover:border-brand dark:border-slate-700 dark:bg-slate-800"
                    }`}
                >
                    {done && <CheckIcon />}
                </button>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className={`truncate text-[15px] font-bold ${
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

                    <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-2">
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink dark:text-slate-300">
                            <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ background: color }}
                            />
                            {task.project || task.workspaceId || "General"}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted">
                            <CalendarIcon className="text-muted w-4 h-4" />
                            {formatDue(task.dueDate)}
                        </span>
                        {task.startTime && (
                            <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted">
                                <ClockSmallIcon className="text-muted w-4 h-4" />
                                {format12(task.startTime)} –{" "}
                                {format12(task.endTime)}
                                <span className="text-muted/70">
                                    ({durationLabel(task)})
                                </span>
                            </span>
                        )}
                    </div>

                    <div className="mt-3.5 max-w-md">
                        <Bar value={progress} subTasksCount={subTasks.length} />
                    </div>

                    {task.aiVerificationReason && (
                        <p className="mt-2 line-clamp-2 text-[13px] text-muted dark:text-slate-400">
                            AI: {task.aiVerificationReason}
                        </p>
                    )}
                </div>

                {!verified && (
                    <button
                        onClick={() => onVerify(taskId)}
                        className="flex h-10 shrink-0 items-center gap-2 rounded-2xl bg-brand px-4 text-[13px] font-bold text-ink transition hover:brightness-95 dark:text-slate-900"
                    >
                        <SparkleIcon width={16} height={16} /> AI Verify Proof
                    </button>
                )}

                <div className="relative flex shrink-0 items-center gap-1">
                    {/* Expand Sub-tasks Button */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`rounded-lg p-2 text-muted transition hover:bg-canvas hover:text-ink dark:hover:bg-slate-800 dark:hover:text-white ${isExpanded ? "bg-canvas dark:bg-slate-800" : ""}`}
                    >
                        <ChevronIcon
                            className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                    </button>

                    {/* Menu Button */}
                    <button
                        onClick={() => setMenuOpen((o) => !o)}
                        className="rounded-lg p-2 text-muted transition hover:bg-canvas hover:text-ink dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                        <MoreIcon width={18} height={18} />
                    </button>

                    {menuOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setMenuOpen(false)}
                            />
                            <div className="absolute right-0 top-10 z-20 w-36 overflow-hidden rounded-xl border border-hairline bg-white py-1 shadow-xl dark:bg-slate-800 dark:border-slate-700">
                                <button
                                    onClick={() => {
                                        handleMainToggle();
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

            {/* Checklist Box */}
            {isExpanded && (
                <Checklist
                    task={task}
                    onAddSub={handleAddSubTask}
                    onToggleSub={handleToggleSubTask}
                    onDeleteSub={handleDeleteSubTask}
                />
            )}
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
                            className={`rounded-full px-4 py-1.5 text-[13px] font-bold transition ${
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
                            className="pointer-events-none absolute left-4 text-muted"
                        />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search tasks..."
                            className="w-full rounded-full border border-hairline bg-white py-2.5 pl-10 pr-4 text-[13px] font-medium text-ink outline-none transition focus:border-brand dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                        />
                    </div>
                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className="rounded-full border border-hairline bg-white px-4 py-2.5 text-[13px] font-bold text-ink outline-none transition focus:border-brand dark:bg-slate-800 dark:border-slate-700 dark:text-white"
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
                <div className="space-y-4">
                    {filtered.map((task) => (
                        <TaskItem
                            key={task.id || task._id}
                            task={task}
                            onToggle={toggleTask}
                            onDelete={deleteTask}
                            updateTask={updateTask}
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
