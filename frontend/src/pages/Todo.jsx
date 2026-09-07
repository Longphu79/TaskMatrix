import { useState } from "react";
import {
    ListIcon,
    ClockIcon,
    FolderIcon,
    MoreIcon,
    SearchIcon,
} from "../assets/components/icon";

/* ---------- data ---------- */

const PROJECT_COLORS = {
    "Food Dashboard": "#f6c62e",
    "Matrix Domain": "#1c1c1c",
    "Project Three": "#f7d873",
    "Project Four": "#9195a1",
};

const PRIORITY = {
    High: "bg-[#fdecec] text-[#e05656]",
    Medium: "bg-brand-soft text-[#a07a00]",
    Low: "bg-canvas text-muted",
};

const INITIAL_TASKS = [
    {
        id: 1,
        title: "Creating Wireframe for Food Dashboard",
        project: "Food Dashboard",
        priority: "High",
        progress: 78,
        due: "Sep 08, 2026",
        done: false,
    },
    {
        id: 2,
        title: "Research & Development for new module",
        project: "Matrix Domain",
        priority: "Medium",
        progress: 40,
        due: "Sep 10, 2026",
        done: false,
    },
    {
        id: 3,
        title: "Prototype interaction states",
        project: "Project Four",
        priority: "High",
        progress: 55,
        due: "Sep 09, 2026",
        done: false,
    },
    {
        id: 4,
        title: "Prepare client review deck",
        project: "Project Three",
        priority: "Low",
        progress: 100,
        due: "Sep 04, 2026",
        done: true,
    },
    {
        id: 5,
        title: "Design QA and developer handoff",
        project: "Food Dashboard",
        priority: "Medium",
        progress: 100,
        due: "Sep 03, 2026",
        done: true,
    },
    {
        id: 6,
        title: "Finalize typography and color tokens",
        project: "Matrix Domain",
        priority: "Low",
        progress: 20,
        due: "Sep 12, 2026",
        done: false,
    },
];

/* ---------- icons ---------- */

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

/* ---------- cards ---------- */

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
        <div className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(17,17,26,0.04)]">
            <div className="mb-6 flex items-center justify-between">
                <span
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ${chip}`}
                >
                    <Icon width={20} height={20} />
                </span>
                <MoreIcon width={18} height={18} className="text-muted" />
            </div>
            <span className="font-display text-3xl font-bold text-ink">
                {value}
            </span>
            <p className="mt-1 text-sm font-medium text-muted">{label}</p>
        </div>
    );
}

function ProgressBar({ pct, done }) {
    return (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-hairline">
            <div
                className={`h-full rounded-full transition-all ${done ? "bg-[#3fb27f]" : "bg-brand"}`}
                style={{ width: `${pct}%` }}
            />
        </div>
    );
}

/* ---------- add-task modal ---------- */

function AddTaskModal({ onClose, onSave }) {
    const [form, setForm] = useState({
        title: "",
        project: "Food Dashboard",
        priority: "Medium",
        due: "",
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
                        Add Task
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
                            Task Title
                        </label>
                        <input
                            value={form.title}
                            onChange={set("title")}
                            placeholder="What needs to be done?"
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
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-muted">
                                Priority
                            </label>
                            <select
                                value={form.priority}
                                onChange={set("priority")}
                                className={inputCls}
                            >
                                <option>High</option>
                                <option>Medium</option>
                                <option>Low</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-muted">
                                Due Date
                            </label>
                            <input
                                type="date"
                                value={form.due}
                                onChange={set("due")}
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
                        Add Task
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ---------- task row ---------- */

function TaskItem({ task, onToggle, onDelete }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const color = PROJECT_COLORS[task.project] ?? "#9195a1";

    return (
        <div className="flex items-center gap-4 rounded-2xl border border-hairline p-4 transition hover:border-brand/60 hover:bg-canvas/50">
            <button
                onClick={() => onToggle(task.id)}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition ${
                    task.done
                        ? "border-[#3fb27f] bg-[#3fb27f] text-white"
                        : "border-hairline hover:border-brand"
                }`}
                aria-label="Toggle complete"
            >
                {task.done && <CheckIcon />}
            </button>

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <span
                        className={`truncate text-sm font-semibold ${
                            task.done ? "text-muted line-through" : "text-ink"
                        }`}
                    >
                        {task.title}
                    </span>
                    <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${PRIORITY[task.priority]}`}
                    >
                        {task.priority}
                    </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink">
                        <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ background: color }}
                        />
                        {task.project}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
                        <CalendarIcon className="text-muted" />
                        {task.due}
                    </span>
                    <div className="flex min-w-[140px] flex-1 items-center gap-2">
                        <ProgressBar pct={task.progress} done={task.done} />
                        <span className="text-xs font-semibold text-muted">
                            {task.progress}%
                        </span>
                    </div>
                </div>
            </div>

            <div className="relative shrink-0">
                <button
                    onClick={() => setMenuOpen((o) => !o)}
                    className="rounded-lg p-1.5 text-muted transition hover:bg-canvas hover:text-ink"
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
                        <div className="absolute right-0 top-9 z-20 w-36 overflow-hidden rounded-xl border border-hairline bg-white py-1 shadow-xl">
                            <button
                                onClick={() => {
                                    onToggle(task.id);
                                    setMenuOpen(false);
                                }}
                                className="block w-full px-4 py-2 text-left text-sm text-ink transition hover:bg-canvas"
                            >
                                {task.done ? "Mark active" : "Mark done"}
                            </button>
                            <button className="block w-full px-4 py-2 text-left text-sm text-ink transition hover:bg-canvas">
                                Edit task
                            </button>
                            <button
                                onClick={() => {
                                    onDelete(task.id);
                                    setMenuOpen(false);
                                }}
                                className="block w-full px-4 py-2 text-left text-sm text-[#e05656] transition hover:bg-[#fdecec]"
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

/* ---------- page ---------- */

export default function TodoPage() {
    const [tasks, setTasks] = useState(INITIAL_TASKS);
    const [tab, setTab] = useState("All");
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState("priority");
    const [modalOpen, setModalOpen] = useState(false);

    const tabs = ["All Tasks", "In Progress", "Completed"];

    const toggle = (id) =>
        setTasks((t) =>
            t.map((x) =>
                x.id === id
                    ? {
                          ...x,
                          done: !x.done,
                          progress: !x.done ? 100 : x.progress,
                      }
                    : x,
            ),
        );
    const remove = (id) => setTasks((t) => t.filter((x) => x.id !== id));

    const save = (form) => {
        setTasks((t) => [
            {
                id: Date.now(),
                title: form.title || "Untitled Task",
                project: form.project,
                priority: form.priority,
                progress: 0,
                due: form.due || "No due date",
                done: false,
            },
            ...t,
        ]);
        setModalOpen(false);
    };

    const priorityRank = { High: 0, Medium: 1, Low: 2 };
    const filtered = tasks
        .filter((t) => {
            if (tab === "In Progress") return !t.done;
            if (tab === "Completed") return t.done;
            return true;
        })
        .filter((t) => t.title.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) =>
            sort === "priority"
                ? priorityRank[a.priority] - priorityRank[b.priority]
                : b.progress - a.progress,
        );

    const stats = {
        total: tasks.length,
        inProgress: tasks.filter((t) => !t.done).length,
        completed: tasks.filter((t) => t.done).length,
        high: tasks.filter((t) => t.priority === "High" && !t.done).length,
    };

    return (
        <div className="px-5 pb-8 lg:px-8">
            {/* header row */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="font-display text-3xl font-bold text-ink">
                        To Do
                    </h2>
                    <p className="mt-1 text-sm font-medium text-muted">
                        Manage your tasks and stay on track
                    </p>
                </div>
                <button
                    onClick={() => setModalOpen(true)}
                    className="flex items-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-black"
                >
                    <PlusIcon />
                    Add Task
                </button>
            </div>

            {/* summary cards */}
            <div className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    label="Total Tasks"
                    value={stats.total}
                    accent="ink"
                    Icon={ListIcon}
                />
                <SummaryCard
                    label="In Progress"
                    value={stats.inProgress}
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

            {/* filter + controls */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white p-4 shadow-[0_8px_30px_rgba(17,17,26,0.04)]">
                <div className="flex items-center gap-1 rounded-full bg-canvas p-1">
                    {tabs.map((t) => (
                        <button
                            key={t}
                            onClick={() =>
                                setTab(t === "All Tasks" ? "All" : t)
                            }
                            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                                (tab === "All" && t === "All Tasks") ||
                                tab === t
                                    ? "bg-ink text-white"
                                    : "text-muted hover:text-ink"
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
                            className="w-full rounded-full border border-hairline bg-white py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand"
                        />
                    </div>
                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className="rounded-full border border-hairline bg-white px-4 py-2.5 text-sm font-medium text-ink outline-none transition focus:border-brand"
                    >
                        <option value="priority">Sort: Priority</option>
                        <option value="progress">Sort: Progress</option>
                    </select>
                </div>
            </div>

            {/* task list */}
            <div className="space-y-3">
                {filtered.map((task) => (
                    <TaskItem
                        key={task.id}
                        task={task}
                        onToggle={toggle}
                        onDelete={remove}
                    />
                ))}
                {filtered.length === 0 && (
                    <div className="rounded-3xl bg-white p-12 text-center text-sm text-muted shadow-[0_8px_30px_rgba(17,17,26,0.04)]">
                        No tasks match your filters.
                    </div>
                )}
            </div>

            {modalOpen && (
                <AddTaskModal
                    onClose={() => setModalOpen(false)}
                    onSave={save}
                />
            )}
        </div>
    );
}
