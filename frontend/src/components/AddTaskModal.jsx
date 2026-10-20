import { useMemo, useState } from "react";
import { toISODate, timeToHours, useTasks } from "../context/TaskContext";

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
    const { tasks, addTask } = useTasks();
    const [form, setForm] = useState({
        title: "",
        project: "",
        priority: "Medium",
        dueDate: defaultDate ?? toISODate(new Date()),
        startTime: "09:00",
        endTime: "11:00",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const projects = useMemo(
        () =>
            [...new Set(tasks.map((t) => t.project || t.workspaceId))]
                .filter(Boolean)
                .sort(),
        [tasks],
    );

    const set = (key) => (e) => {
        setForm((f) => ({ ...f, [key]: e.target.value }));
        setError("");
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) return setError("Please enter a task title.");
        if (!form.dueDate) return setError("Please choose a due date.");
        if (!form.startTime || !form.endTime)
            return setError("Please set a start and end time.");
        if (
            timeToHours(form.endTime, { isEnd: true }) <=
            timeToHours(form.startTime)
        ) {
            return setError("End time must be after start time.");
        }

        setLoading(true);
        try {
            // Gọi hàm addTask từ TaskContext (Đã dùng Axios gửi API POST)
            const createdTask = await addTask(form);
            onAdded?.(createdTask);
            onClose();
        } catch (err) {
            console.error("Failed to add task:", err);
            setError("Lỗi kết nối Server hoặc không thể tạo task.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
            onClick={onClose}
        >
            <form
                onSubmit={submit}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-task-title"
                className="max-h-full w-full max-w-md overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl dark:border dark:border-slate-700/50 dark:bg-slate-900"
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

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Project" htmlFor="task-project">
                            <input
                                id="task-project"
                                list="task-projects"
                                value={form.project}
                                onChange={set("project")}
                                placeholder="e.g. Matrix Domain"
                                className={INPUT_CLS}
                            />
                            <datalist id="task-projects">
                                {projects.map((p) => (
                                    <option key={p} value={p} />
                                ))}
                            </datalist>
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
