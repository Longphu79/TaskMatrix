import { useMemo, useState } from "react";
import {
    CalendarDays,
    CheckSquare,
    Layers3,
    Search,
    SlidersHorizontal,
    TriangleAlert,
} from "lucide-react";
import { useTasks } from "../context/TaskContext";

const COLUMNS = [
    { id: "Pending", label: "To Do", color: "bg-slate-400" },
    { id: "In Progress", label: "In Progress", color: "bg-blue-500" },
    { id: "In Review", label: "In Review", color: "bg-violet-500" },
    { id: "Completed", label: "Done", color: "bg-emerald-500" },
];

const PRIORITIES = ["All", "High", "Medium", "Low"];

function columnStatus(task) {
    const status = String(task.status || "Pending").toLowerCase().replace(/[-_]/g, " ");
    if (status === "completed" || status === "done") return "Completed";
    if (status === "in progress" || status === "inprogress") return "In Progress";
    if (status === "in review" || status === "review") return "In Review";
    return "Pending";
}

function formatDueDate(value) {
    if (!value) return "No due date";
    const dueDate = new Date(value);
    if (Number.isNaN(dueDate.getTime())) return "No due date";
    return dueDate.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function isOverdue(task) {
    if (!task.dueDate || columnStatus(task) === "Completed") return false;
    const dueDate = new Date(task.dueDate);
    if (Number.isNaN(dueDate.getTime())) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
}

function TaskCard({ task, onDragStart, onDragEnd, isDragging }) {
    const overdue = isOverdue(task);

    return (
        <article
            draggable
            onDragStart={(event) => onDragStart(event, task)}
            onDragEnd={onDragEnd}
            className={`cursor-grab rounded-xl border border-hairline bg-canvas p-4 text-ink shadow-sm transition active:cursor-grabbing ${
                isDragging
                    ? "opacity-35"
                    : "hover:border-slate-300 hover:bg-slate-100 dark:hover:border-slate-600 dark:hover:bg-[#182131]"
            }`}
        >
            <h3 className="text-sm font-medium leading-5 text-ink">{task.title}</h3>

            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                <CalendarDays size={14} aria-hidden="true" />
                <span>{formatDueDate(task.dueDate)}</span>
                {overdue && (
                    <span
                        role="status"
                        aria-label="Overdue"
                        className="inline-flex items-center gap-1 font-medium text-red-600 dark:text-red-400"
                    >
                        <TriangleAlert size={14} aria-hidden="true" />
                        Overdue
                    </span>
                )}
            </div>

            {task.project && (
                <div className="mt-3">
                    <span className="inline-flex max-w-full items-center gap-1.5 truncate rounded-md border border-blue-300 bg-blue-50 px-2 py-1 text-xs text-blue-800 dark:border-blue-400/60 dark:bg-blue-500/15 dark:text-blue-200">
                        <span
                            className="h-2.5 w-2.5 shrink-0 rounded-sm bg-current opacity-70"
                            aria-hidden="true"
                        />
                        <span className="truncate">{task.project}</span>
                    </span>
                </div>
            )}

            <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3">
                <span className="flex items-center gap-2 text-xs text-muted">
                    <CheckSquare size={15} className="text-blue-400" aria-hidden="true" />
                    TM-{String(task.id).slice(-4)}
                </span>
                {task.priority && (
                    <span
                        className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            task.priority === "High"
                                ? "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-300"
                                : task.priority === "Medium"
                                  ? "bg-amber-50 text-amber-800 dark:bg-amber-300/10 dark:text-amber-200"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-400/10 dark:text-slate-300"
                        }`}
                    >
                        {task.priority}
                    </span>
                )}
            </div>
        </article>
    );
}

export default function BoardPage() {
    const { tasks, loading, updateTask } = useTasks();
    const [query, setQuery] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [filterOpen, setFilterOpen] = useState(false);
    const [groupByPriority, setGroupByPriority] = useState(false);
    const [dragging, setDragging] = useState(null);
    const [dropTarget, setDropTarget] = useState("");
    const [error, setError] = useState("");

    const filteredTasks = useMemo(
        () =>
            tasks.filter((task) => {
                const searchable = `${task.title} ${task.project || ""} ${task.id}`;
                const matchesQuery = searchable.toLowerCase().includes(query.trim().toLowerCase());
                const matchesPriority = priorityFilter === "All" || task.priority === priorityFilter;
                return matchesQuery && matchesPriority;
            }),
        [tasks, query, priorityFilter],
    );

    const startDrag = (event, task) => {
        setDragging({ id: task.id, status: columnStatus(task) });
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(task.id));
    };

    const endDrag = () => {
        setDragging(null);
        setDropTarget("");
    };

    const moveTask = async (event, status) => {
        event.preventDefault();
        const id = event.dataTransfer.getData("text/plain");
        const task = tasks.find((item) => String(item.id) === id);
        if (!task || columnStatus(task) === status) {
            endDrag();
            return;
        }

        setError("");
        try {
            await updateTask(task.id, {
                status,
                progress:
                    status === "Completed"
                        ? 100
                        : Math.min(task.progress || 0, 99),
            });
        } catch (moveError) {
            setError(
                moveError?.message ||
                    moveError?.response?.data?.message ||
                    "Could not move this task. Please try again.",
            );
        } finally {
            endDrag();
        }
    };

    return (
        <div className="flex min-h-full flex-col bg-canvas text-ink">
            <div className="flex flex-wrap items-center gap-3 border-b border-hairline px-5 py-4 lg:px-8">
                <label className="relative min-w-[190px] max-w-xs flex-1">
                    <Search
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                        aria-hidden="true"
                    />
                    <input
                        aria-label="Search board"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search board"
                        className="w-full rounded-lg border border-hairline bg-white py-2 pl-9 pr-3 text-sm text-ink outline-none placeholder:text-muted focus:border-blue-400 dark:bg-[#111827]"
                    />
                </label>

                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setFilterOpen((open) => !open)}
                        aria-expanded={filterOpen}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                            priorityFilter !== "All"
                                ? "border-blue-400/60 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200"
                                : "border-hairline bg-white text-ink hover:bg-canvas"
                        }`}
                    >
                        <SlidersHorizontal size={16} aria-hidden="true" />
                        Filter{priorityFilter !== "All" ? `: ${priorityFilter}` : ""}
                    </button>
                    {filterOpen && (
                        <div className="absolute left-0 top-full z-20 mt-2 w-40 rounded-lg border border-hairline bg-white p-2 shadow-xl dark:bg-[#111827]">
                            <p className="px-2 py-1 text-xs font-medium text-muted">Priority</p>
                            {PRIORITIES.map((priority) => (
                                <button
                                    key={priority}
                                    type="button"
                                    onClick={() => {
                                        setPriorityFilter(priority);
                                        setFilterOpen(false);
                                    }}
                                    className={`w-full rounded-md px-2 py-1.5 text-left text-sm ${
                                        priorityFilter === priority
                                            ? "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200"
                                            : "text-ink hover:bg-canvas"
                                    }`}
                                >
                                    {priority}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => setGroupByPriority((grouped) => !grouped)}
                    aria-pressed={groupByPriority}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                        groupByPriority
                            ? "border-blue-400/60 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200"
                            : "border-hairline bg-white text-ink hover:bg-canvas"
                    }`}
                >
                    <Layers3 size={16} aria-hidden="true" />
                    {groupByPriority ? "Grouped by priority" : "Group"}
                </button>
                <span className="ml-auto text-xs text-muted">
                    {loading ? "Loading tasks..." : `${tasks.length} tasks`}
                </span>
            </div>

            {error && (
                <p className="px-5 pt-3 text-sm text-red-600 lg:px-8" role="alert">
                    {error}
                </p>
            )}

            <div className="flex flex-1 items-start gap-3 overflow-x-auto px-4 py-5 lg:px-6">
                {COLUMNS.map((column) => {
                    const columnTasks = filteredTasks.filter(
                        (task) => columnStatus(task) === column.id,
                    );
                    const isSourceColumn = dragging?.status === column.id;
                    const title =
                        dragging && !isSourceColumn
                            ? `${dragging.status} → ${column.label}`
                            : column.label;
                    const visiblePriorities = groupByPriority
                        ? PRIORITIES.slice(1).filter((priority) =>
                              columnTasks.some((task) => task.priority === priority),
                          )
                        : [];

                    return (
                        <section
                            key={column.id}
                            aria-label={`${column.label} column`}
                            onDragOver={(event) => {
                                event.preventDefault();
                                setDropTarget(column.id);
                            }}
                            onDragLeave={(event) => {
                                if (
                                    dropTarget === column.id &&
                                    !event.currentTarget.contains(event.relatedTarget)
                                ) {
                                    setDropTarget("");
                                }
                            }}
                            onDrop={(event) => moveTask(event, column.id)}
                            className={`w-[300px] min-w-[300px] rounded-xl bg-white p-2 shadow-[0_8px_30px_rgba(17,17,26,0.04)] transition dark:bg-[#111827] ${
                                dropTarget === column.id ? "ring-1 ring-blue-400/70" : ""
                            }`}
                        >
                            <header className="flex min-h-11 items-center gap-2 px-2">
                                <span
                                    className={`h-2.5 w-2.5 rounded-full ${column.color}`}
                                    aria-hidden="true"
                                />
                                <h2 className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                                    {title}
                                </h2>
                                <span className="text-xs text-muted">{columnTasks.length}</span>
                            </header>

                            <div className="min-h-24 space-y-2 pb-1">
                                {groupByPriority
                                    ? visiblePriorities.map((priority) => (
                                          <div key={priority}>
                                              <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
                                                  {priority}
                                              </p>
                                              <div className="space-y-2">
                                                  {columnTasks
                                                      .filter((task) => task.priority === priority)
                                                      .map((task) => (
                                                          <TaskCard
                                                              key={task.id}
                                                              task={task}
                                                              onDragStart={startDrag}
                                                              onDragEnd={endDrag}
                                                              isDragging={
                                                                  String(dragging?.id) ===
                                                                  String(task.id)
                                                              }
                                                          />
                                                      ))}
                                              </div>
                                          </div>
                                      ))
                                    : columnTasks.map((task) => (
                                          <TaskCard
                                              key={task.id}
                                              task={task}
                                              onDragStart={startDrag}
                                              onDragEnd={endDrag}
                                              isDragging={
                                                  String(dragging?.id) === String(task.id)
                                              }
                                          />
                                      ))}
                            </div>
                        </section>
                    );
                })}
            </div>
        </div>
    );
}
