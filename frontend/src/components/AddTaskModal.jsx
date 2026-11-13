import { useState } from "react";
import { toISODate, timeToHours, useTasks } from "../context/TaskContext";
import { useWorkspace } from "../context/WorkspaceContext";

const INPUT_CLS =
    "w-full rounded-xl border border-hairline bg-white px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand dark:bg-slate-800 dark:border-slate-700/50 dark:text-white";

function Field({ label, htmlFor, children }) {
    return (
        <div>
            <label
                htmlFor={htmlFor}
                className="mb-1.5 block text-xs font-medium text-muted"
            >
                {label}
            </label>
            {children}
        </div>
    );
}

export default function AddTaskModal({ onClose, defaultDate, onAdded }) {
    const { addTask } = useTasks();
    const { currentWorkspace } = useWorkspace();

    const [form, setForm] = useState({
        title: "",
        project: "", // Nhãn dự án (VD: Matrix Domain, Food Dashboard)
        priority: "Medium",
        dueDate: defaultDate ?? toISODate(new Date()),
        startTime: "09:00",
        endTime: "11:00",
        description: "",
        assigneeIds: [],
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const isCompanyWorkspace = currentWorkspace?.type === "company";

    const set = (key) => (e) => {
        setForm((f) => ({ ...f, [key]: e.target.value }));
        setError("");
    };

    const toggleAssignee = (userId) => {
        setForm((prev) => {
            const exists = prev.assigneeIds.includes(userId);
            return {
                ...prev,
                assigneeIds: exists
                    ? prev.assigneeIds.filter((id) => id !== userId)
                    : [...prev.assigneeIds, userId],
            };
        });
    };

    const submit = async (e) => {
        e.preventDefault();

        if (!form.title.trim()) return setError("Please enter a task title.");
        if (!form.dueDate) return setError("Please choose a due date.");
        if (!form.startTime || !form.endTime)
            return setError("Please set a start and end time.");

        const startH = timeToHours(form.startTime);
        const endH = timeToHours(form.endTime, { isEnd: true });

        if (endH <= startH) {
            return setError("End time must be after start time.");
        }

        setLoading(true);
        setError("");

        try {
            const createLocalISO = (dateStr, timeStr) => {
                if (!dateStr || !timeStr) return null;
                const [year, month, day] = dateStr.split("-").map(Number);
                const [hours, minutes] = timeStr.split(":").map(Number);
                return new Date(
                    year,
                    month - 1,
                    day,
                    hours,
                    minutes,
                    0,
                ).toISOString();
            };

            const payload = {
                title: form.title.trim(),
                workspaceId: currentWorkspace?.id || "personal", // Tự động gắn Workspace hiện tại
                project: form.project.trim(),
                priority: form.priority,
                description: form.description.trim(),
                dueDate: createLocalISO(form.dueDate, "00:00"),
                startTime: createLocalISO(form.dueDate, form.startTime),
                endTime: createLocalISO(form.dueDate, form.endTime),
                assigneeIds: isCompanyWorkspace ? form.assigneeIds : [],
            };

            const createdTask = await addTask(payload);
            onAdded?.(createdTask);
            onClose();
        } catch (err) {
            console.error("Failed to add task:", err);
            setError(
                err?.response?.data?.message || "Server connection error.",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <form
                onSubmit={submit}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-task-title"
                className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl dark:border dark:border-slate-700/50 dark:bg-slate-900"
            >
                <div className="mb-6 flex items-center justify-between">
                    <h3
                        id="add-task-title"
                        className="font-display text-xl font-bold text-ink dark:text-white"
                    >
                        Add Task
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="rounded-lg p-1 text-muted transition hover:bg-canvas hover:text-ink dark:hover:bg-slate-800 dark:hover:text-white"
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
                    {/* Task Title */}
                    <Field label="Task Title" htmlFor="task-title">
                        <input
                            id="task-title"
                            autoFocus
                            value={form.title}
                            onChange={set("title")}
                            placeholder="What needs to be done?"
                            className={INPUT_CLS}
                        />
                    </Field>

                    {/* Project & Priority */}
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Project / Tag" htmlFor="task-project">
                            <input
                                id="task-project"
                                value={form.project}
                                onChange={set("project")}
                                placeholder="e.g. Website Redesign"
                                className={INPUT_CLS}
                            />
                        </Field>

                        <Field label="Priority" htmlFor="task-priority">
                            <select
                                id="task-priority"
                                value={form.priority}
                                onChange={set("priority")}
                                className={INPUT_CLS}
                            >
                                <option>Low</option>
                                <option>Medium</option>
                                <option>High</option>
                            </select>
                        </Field>
                    </div>

                    {/* Assign Members (Chỉ hiển thị khi đang ở Workspace Công ty) */}
                    {isCompanyWorkspace && (
                        <Field label="Assign Members">
                            <div className="flex flex-wrap gap-2 rounded-xl border border-hairline bg-canvas/40 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                                {currentWorkspace.members?.length > 0 ? (
                                    currentWorkspace.members.map((member) => {
                                        const isSelected =
                                            form.assigneeIds.includes(
                                                member.userId,
                                            );
                                        return (
                                            <button
                                                key={member.userId}
                                                type="button"
                                                onClick={() =>
                                                    toggleAssignee(
                                                        member.userId,
                                                    )
                                                }
                                                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                                    isSelected
                                                        ? "bg-ink text-white dark:bg-brand dark:text-slate-900"
                                                        : "bg-white text-ink border border-hairline hover:border-brand dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                                                }`}
                                            >
                                                <span>
                                                    {member.fullName ||
                                                        member.email}
                                                </span>
                                                {isSelected && <span>✓</span>}
                                            </button>
                                        );
                                    })
                                ) : (
                                    <p className="text-xs text-muted">
                                        No members in this workspace.
                                    </p>
                                )}
                            </div>
                        </Field>
                    )}

                    {/* Due Date & Times */}
                    <Field label="Due Date" htmlFor="task-due">
                        <input
                            id="task-due"
                            type="date"
                            value={form.dueDate}
                            onChange={set("dueDate")}
                            className={INPUT_CLS}
                        />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Start Time" htmlFor="task-start">
                            <input
                                id="task-start"
                                type="time"
                                value={form.startTime}
                                onChange={set("startTime")}
                                className={INPUT_CLS}
                            />
                        </Field>
                        <Field label="End Time" htmlFor="task-end">
                            <input
                                id="task-end"
                                type="time"
                                value={form.endTime}
                                onChange={set("endTime")}
                                className={INPUT_CLS}
                            />
                        </Field>
                    </div>

                    {/* Task Description */}
                    <Field label="Task Description" htmlFor="task-desc">
                        <textarea
                            id="task-desc"
                            rows={2}
                            value={form.description}
                            onChange={set("description")}
                            placeholder="Add extra details..."
                            className="w-full resize-none rounded-xl border border-hairline bg-white px-4 py-2 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand dark:border-slate-700/50 dark:bg-slate-800 dark:text-white"
                        />
                    </Field>

                    {error && (
                        <p
                            role="alert"
                            className="text-xs font-medium text-[#e05656]"
                        >
                            {error}
                        </p>
                    )}
                </div>

                <div className="mt-7 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-hairline px-5 py-2.5 text-sm font-medium text-muted transition hover:text-ink dark:border-slate-700 dark:hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black dark:!bg-brand dark:!text-slate-900 disabled:opacity-50"
                    >
                        {loading ? "Adding..." : "Add Task"}
                    </button>
                </div>
            </form>
        </div>
    );
}
