import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from "react";
import apiClient from "../services/apiClient";
import { useWorkspace } from "./WorkspaceContext";

const TaskContext = createContext(null);

// Hàm chuẩn hóa dữ liệu (xử lý cả PascalCase lẫn camelCase từ .NET)
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

    // 1. Lấy danh sách Tasks từ DB
    const fetchTasks = useCallback(async () => {
        setLoading(true);
        try {
            // apiClient đã unwrap sẵn response.data, nên res ở đây chính là Array
            const res = await apiClient.get("/tasks");
            const rawList = Array.isArray(res) ? res : [];

            const cleanTasks = rawList.map(normalizeTask).filter(Boolean);
            console.log("Tasks từ DB sau khi chuẩn hóa:", cleanTasks);
            setTasks(cleanTasks);
        } catch (err) {
            console.error("Lỗi khi tải danh sách Tasks từ DB:", err);
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
            const dueISO = formData.dueDate
                ? new Date(formData.dueDate).toISOString()
                : new Date().toISOString();

            const startISO =
                formData.startTime && formData.dueDate
                    ? new Date(
                          `${formData.dueDate}T${formData.startTime}:00Z`,
                      ).toISOString()
                    : null;

            const endISO =
                formData.endTime && formData.dueDate
                    ? new Date(
                          `${formData.dueDate}T${formData.endTime}:00Z`,
                      ).toISOString()
                    : null;

            const payload = {
                title: formData.title,
                description: formData.project
                    ? `Project: ${formData.project}`
                    : "",
                priority: formData.priority || "Medium",
                status: "Todo",
                dueDate: dueISO,
                startTime: startISO,
                endTime: endISO,
                workspaceId: currentWorkspace?.id || "personal",
            };

            // res ở đây chính là object Task vừa tạo
            const createdData = await apiClient.post("/tasks", payload);

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

    // 3. Toggle trạng thái
    const toggleTask = async (taskId) => {
        const target = tasks.find((t) => t?.id === taskId);
        if (!target) return;

        const newStatus = target.status === "Completed" ? "Todo" : "Completed";

        setTasks((prev) =>
            prev.map((t) =>
                t?.id === taskId ? { ...t, status: newStatus } : t,
            ),
        );

        try {
            await apiClient.put(`/tasks/${taskId}`, {
                ...target,
                status: newStatus,
            });
        } catch (err) {
            console.error("Lỗi cập nhật Task:", err);
            fetchTasks();
        }
    };

    // 4. Xóa Task
    const deleteTask = async (taskId) => {
        setTasks((prev) => prev.filter((t) => t?.id !== taskId));
        try {
            await apiClient.delete(`/tasks/${taskId}`);
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

export function taskHours(task) {
    if (task?.startTime && task?.endTime) {
        const s = new Date(task.startTime);
        const e = new Date(task.endTime);
        const start = s.getHours() + s.getMinutes() / 60;
        const end = e.getHours() + e.getMinutes() / 60;
        return { start, end };
    }
    return { start: 8, end: 10 };
}

export function toISODate(date) {
    if (!date) return new Date().toISOString().split("T")[0];
    const d = new Date(date);
    return d.toISOString().split("T")[0];
}

export function timeToHours(timeStr, options = {}) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(":").map(Number);
    const total = h + (m || 0) / 60;
    return options.isEnd && total === 0 ? 24 : total;
}
