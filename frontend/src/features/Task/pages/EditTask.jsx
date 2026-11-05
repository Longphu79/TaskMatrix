import { useEffect, useState } from "react";

const PRIORITY_PICK = {
    High: "bg-[#fdecec] text-[#e05656] ring-[#e05656]",
    Medium: "bg-brand-soft text-[#8a6a00] ring-brand",
    Low: "bg-canvas text-ink ring-muted dark:bg-slate-800 dark:text-white",
};

const inputCls =
    "mt-2 h-11 w-full rounded-2xl border border-hairline bg-white px-4 text-sm font-medium text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/20 dark:bg-slate-800 dark:border-slate-700 dark:text-white";

// 🟢 Helper 1: Chuyển Date sang YYYY-MM-DD cho <input type="date">
function formatDateForInput(iso) {
    if (!iso) return "";
    try {
        return new Date(iso).toISOString().split("T")[0];
    } catch {
        return "";
    }
}

// 🟢 Helper 2: Chuyển ISO / String sang HH:mm cho <input type="time">
function formatTimeForInput(val) {
    if (!val) return "09:00";
    if (typeof val === "string" && val.includes("T")) {
        const d = new Date(val);
        const h = String(d.getHours()).padStart(2, "0");
        const m = String(d.getMinutes()).padStart(2, "0");
        return `${h}:${m}`;
    }
    if (typeof val === "string" && val.includes(":")) {
        const parts = val.split(":");
        return `${parts[0].padStart(2, "0")}:${parts[1].slice(0, 2).padStart(2, "0")}`;
    }
    return "09:00";
}

export default function EditTask({
    task,
    projects,
    onClose,
    onSave,
    onDelete,
}) {
    const taskId = task.id || task._id;

    const [formData, setFormData] = useState({
        title: task.title || "",
        workspaceId: task.workspaceId || task.project || "personal",
        priority: task.priority || "Medium",
        dueDate: formatDateForInput(task.dueDate),
        startTime: formatTimeForInput(task.startTime),
        endTime: formatTimeForInput(task.endTime),
        progress: task.status === "Completed" ? 100 : (task.progress ?? 0),
        description: task.description || "",
    });

    const [confirmDelete, setConfirmDelete] = useState(false);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const [successMsg, setSuccessMsg] = useState("");
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title.trim())
            return setError("Please enter a task title.");

        setError("");
        setSubmitting(true);

        const progressNum = Number(formData.progress);

        // 🟢 Hàm tạo ISO String chuẩn múi giờ Local
        const toLocalISO = (dateStr, timeStr) => {
            if (!dateStr || !timeStr) return null;
            const d = new Date(`${dateStr}T${timeStr}:00`);
            return isNaN(d.getTime()) ? null : d.toISOString();
        };

        const patch = {
            ...formData,
            title: formData.title.trim(),
            description: formData.description.trim(),
            dueDate: formData.dueDate
                ? new Date(formData.dueDate).toISOString()
                : null,
            startTime: toLocalISO(formData.dueDate, formData.startTime),
            endTime: toLocalISO(formData.dueDate, formData.endTime),
            progress: progressNum,
            status:
                progressNum >= 100
                    ? "Completed"
                    : progressNum > 0
                      ? "InProgress"
                      : "Todo",
        };

        try {
            await onSave(taskId, patch);
            setSuccessMsg("Task updated successfully!"); // 🟢 Ghi nhận thông báo

            // 🟢 Đợi 800ms để hiển thị thông báo xanh cho người dùng thấy rồi mới đóng modal
            setTimeout(() => {
                onClose();
            }, 800);
        } catch (err) {
            console.error("Update task error:", err);
            setError("Failed to update task. Please try again.");
            setSubmitting(false); // Chỉ tắt submitting khi lỗi để nút Save không bị bấm liên tục khi thành công
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm"
            onMouseDown={onClose}
        >
            <form
                role="dialog"
                onSubmit={handleSubmit}
                onMouseDown={(e) => e.stopPropagation()}
                className="my-auto w-full max-w-2xl rounded-3xl bg-white p-7 shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-700"
            >
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <h3 className="font-display text-2xl font-bold text-ink dark:text-white">
                            Edit Task Details
                        </h3>
                        <p className="mt-1 text-sm text-muted">
                            Update schedule, priority, and progress for this
                            task.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-hairline text-lg text-ink hover:bg-canvas dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
                    >
                        &times;
                    </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-semibold text-ink dark:text-slate-200 sm:col-span-2">
                        Task Title
                        <input
                            autoFocus
                            value={formData.title}
                            onChange={(e) =>
                                handleChange("title", e.target.value)
                            }
                            className={inputCls}
                        />
                    </label>

                    <label className="block text-sm font-semibold text-ink dark:text-slate-200">
                        Project / Workspace
                        <select
                            value={formData.workspaceId}
                            onChange={(e) =>
                                handleChange("workspaceId", e.target.value)
                            }
                            className={inputCls}
                        >
                            {projects.map((p) => (
                                <option key={p} value={p}>
                                    {p}
                                </option>
                            ))}
                        </select>
                    </label>

                    <div className="text-sm font-semibold text-ink dark:text-slate-200">
                        Priority
                        <div className="mt-2 flex gap-2">
                            {["High", "Medium", "Low"].map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => handleChange("priority", p)}
                                    className={`h-11 flex-1 rounded-2xl text-xs font-bold transition ${
                                        PRIORITY_PICK[p]
                                    } ${
                                        formData.priority === p
                                            ? "ring-2"
                                            : "opacity-60 hover:opacity-100"
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="text-sm font-semibold text-ink dark:text-slate-200 sm:col-span-2">
                        Due Date &amp; Time
                        <div className="grid grid-cols-[3fr_2fr_2fr] gap-2">
                            <input
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) =>
                                    handleChange("dueDate", e.target.value)
                                }
                                className={inputCls}
                            />
                            <input
                                type="time"
                                value={formData.startTime}
                                onChange={(e) =>
                                    handleChange("startTime", e.target.value)
                                }
                                className={inputCls}
                            />
                            <input
                                type="time"
                                value={formData.endTime}
                                onChange={(e) =>
                                    handleChange("endTime", e.target.value)
                                }
                                className={inputCls}
                            />
                        </div>
                    </div>

                    <label className="block text-sm font-semibold text-ink dark:text-slate-200 sm:col-span-2">
                        <span className="flex items-center justify-between">
                            Completion Percentage
                            <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-bold dark:bg-brand/20 dark:text-brand">
                                {formData.progress}%
                            </span>
                        </span>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={formData.progress}
                            onChange={(e) =>
                                handleChange("progress", Number(e.target.value))
                            }
                            className="mt-3 w-full accent-[#F6C62E]"
                        />
                    </label>

                    <label className="block text-sm font-semibold text-ink dark:text-slate-200 sm:col-span-2">
                        Task Description
                        <textarea
                            rows={3}
                            value={formData.description}
                            onChange={(e) =>
                                handleChange("description", e.target.value)
                            }
                            placeholder="Add details or notes..."
                            className="mt-2 w-full resize-none rounded-2xl border border-hairline bg-white px-4 py-3 text-sm font-medium text-ink outline-none transition placeholder:text-muted focus:border-brand focus:ring-4 focus:ring-brand/20 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                        />
                    </label>
                </div>

                {error && (
                    <p className="mt-4 rounded-2xl bg-[#fdecec] px-4 py-2.5 text-sm font-medium text-[#e05656]">
                        {error}
                    </p>
                )}
                {/* 🟢 Hiển thị thông báo thành công */}
                {successMsg && (
                    <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                        ✓ {successMsg}
                    </p>
                )}

                <div className="mt-7 flex flex-wrap items-center gap-3">
                    {confirmDelete ? (
                        <span className="mr-auto flex items-center gap-3 text-sm font-semibold text-[#e05656]">
                            Delete this task?
                            <button
                                type="button"
                                onClick={() => onDelete(taskId)}
                                className="rounded-xl bg-[#e05656] px-3 py-1.5 text-xs font-bold text-white"
                            >
                                Yes, delete
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfirmDelete(false)}
                                className="text-xs font-semibold text-muted hover:text-ink dark:hover:text-white"
                            >
                                Keep
                            </button>
                        </span>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setConfirmDelete(true)}
                            className="mr-auto text-sm font-semibold text-[#e05656] hover:underline"
                        >
                            Delete Task
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={onClose}
                        className="h-11 rounded-2xl border border-hairline px-6 text-sm font-semibold text-ink hover:bg-canvas dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="h-11 rounded-2xl bg-ink px-6 text-sm font-semibold text-white hover:bg-black disabled:opacity-50 dark:!bg-brand dark:!text-slate-900"
                    >
                        {submitting ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </form>
        </div>
    );
}
