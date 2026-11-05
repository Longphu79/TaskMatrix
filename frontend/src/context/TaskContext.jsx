import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from "react";
import { taskApi } from "../features/Task/api/taskApi"; // Chỉnh lại đường dẫn import tương ứng với thư mục của bạn
import { useWorkspace } from "./WorkspaceContext";

const TaskContext = createContext(null);

function normalizeTask(t) {
    if (!t) return null;
    return {
        id: t.id || t.Id || t._id,
        userId: t.userId || t.UserId,
        workspaceId: String(
            t.workspaceId || t.WorkspaceId || "personal",
        ).toLowerCase(),
        title: t.title || t.Title || "",
        description: t.description || t.Description || "",
        priority: t.priority || t.Priority || "Medium",
        status: t.status || t.Status || "Todo",
        progress: t.progress ?? t.Progress ?? 0,
        aiVerificationReason:
            t.aiVerificationReason || t.AiVerificationReason || "",
        proofImageUrl: t.proofImageUrl || t.ProofImageUrl || "",
        aiStatus: t.aiStatus || t.AiStatus || null,
        dueDate: t.dueDate || t.DueDate,
        startTime: t.startTime || t.StartTime,
        endTime: t.endTime || t.EndTime,
        createdAt: t.createdAt || t.CreatedAt,
    };
}

export function TaskProvider({ children }) {
    const { currentWorkspace } = useWorkspace();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    // 1. Lấy danh sách Tasks
    const fetchTasks = useCallback(async () => {
        setLoading(true);
        try {
            const res = await taskApi.getTasks();
            const rawList = Array.isArray(res) ? res : [];
            setTasks(rawList.map(normalizeTask).filter(Boolean));
        } catch (err) {
            console.error("Lỗi khi tải danh sách Tasks:", err);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks, currentWorkspace?.id]);

    // 2. Thêm Task mới
    const addTask = async (formData) => {
        try {
            // 🟢 Kiểm tra nếu đã là ISO string hoặc Date chuẩn thì lấy thẳng, tránh ghép trùng
            const dueISO = formData.dueDate
                ? typeof formData.dueDate === "string" &&
                  formData.dueDate.includes("T")
                    ? formData.dueDate
                    : new Date(formData.dueDate).toISOString()
                : new Date().toISOString();

            const startISO = formData.startTime
                ? typeof formData.startTime === "string" &&
                  formData.startTime.includes("T")
                    ? formData.startTime
                    : formData.dueDate
                      ? new Date(
                            `${formData.dueDate.split("T")[0]}T${formData.startTime}:00`,
                        ).toISOString()
                      : null
                : null;

            const endISO = formData.endTime
                ? typeof formData.endTime === "string" &&
                  formData.endTime.includes("T")
                    ? formData.endTime
                    : formData.dueDate
                      ? new Date(
                            `${formData.dueDate.split("T")[0]}T${formData.endTime}:00`,
                        ).toISOString()
                      : null
                : null;

            const payload = {
                title: formData.title,
                description:
                    formData.description ||
                    (formData.project ? `Project: ${formData.project}` : ""),
                priority: formData.priority || "Medium",
                status: "Todo",
                progress: 0,
                dueDate: dueISO,
                startTime: startISO,
                endTime: endISO,
                workspaceId:
                    formData.workspaceId || currentWorkspace?.id || "personal",
            };

            const createdData = await taskApi.createTask(payload);
            if (createdData) {
                const newTask = normalizeTask(createdData);
                setTasks((prev) => [newTask, ...prev.filter(Boolean)]);
                return newTask;
            }
        } catch (err) {
            console.error("Lỗi khi thêm Task:", err);
            throw err;
        }
    };

    // 3. Cập nhật Task
    const updateTask = async (taskId, patch) => {
        try {
            const res = await taskApi.updateTask(taskId, patch);
            const updatedTask =
                normalizeTask(res) || normalizeTask({ ...patch, id: taskId });

            setTasks((prev) =>
                prev.map((t) =>
                    t?.id === taskId ? { ...t, ...updatedTask } : t,
                ),
            );
            return updatedTask;
        } catch (err) {
            console.error("Lỗi khi cập nhật Task:", err);
            fetchTasks();
            throw err;
        }
    };

    // 4. Đổi trạng thái Hoàn thành / Chưa hoàn thành
    const toggleTask = async (taskId) => {
        const target = tasks.find((t) => t?.id === taskId);
        if (!target) return;

        const isNowCompleted = target.status !== "Completed";
        const newStatus = isNowCompleted ? "Completed" : "Todo";

        // 🟢 Khi tick thành công -> 100%. Khi bỏ tick -> Reset về 0%
        const newProgress = isNowCompleted ? 100 : 0;

        // Optimistic UI update
        setTasks((prev) =>
            prev.map((t) =>
                t?.id === taskId
                    ? { ...t, status: newStatus, progress: newProgress }
                    : t,
            ),
        );

        try {
            await taskApi.updateTask(taskId, {
                ...target,
                status: newStatus,
                progress: newProgress,
            });
        } catch (err) {
            console.error("Lỗi toggle Task:", err);
            fetchTasks();
        }
    };

    // 5. Xóa Task
    const deleteTask = async (taskId) => {
        setTasks((prev) => prev.filter((t) => t?.id !== taskId));
        try {
            await taskApi.deleteTask(taskId);
        } catch (err) {
            console.error("Lỗi xóa Task:", err);
            fetchTasks();
        }
    };

    return (
        <TaskContext.Provider
            value={{
                tasks,
                loading,
                fetchTasks,
                addTask,
                updateTask,
                toggleTask,
                deleteTask,
            }}
        >
            {children}
        </TaskContext.Provider>
    );
}

export function useTasks() {
    const context = useContext(TaskContext);
    if (!context) {
        throw new Error("useTasks must be used within TaskProvider");
    }
    return context;
}

export function parseISODate(iso) {
    if (!iso) return new Date();
    return new Date(iso);
}

export function toISODate(date) {
    if (!date) return "";

    if (typeof date === "string") {
        if (date.includes("T")) {
            const d = new Date(date);
            if (isNaN(d.getTime())) return date.split("T")[0];
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            return `${y}-${m}-${day}`;
        }
        return date.split("T")[0];
    }

    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

export function taskHours(task) {
    if (task?.startTime && task?.endTime) {
        const s = new Date(task.startTime);
        const e = new Date(task.endTime);

        if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
            const start = s.getHours() + s.getMinutes() / 60;
            let end = e.getHours() + e.getMinutes() / 60;
            if (end <= start) end = start + 1;
            return { start, end };
        }
    }
    return { start: 9, end: 11 };
}

export function timeToHours(timeStr, options = {}) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(":").map(Number);
    const total = h + (m || 0) / 60;
    return options.isEnd && total === 0 ? 24 : total;
}
