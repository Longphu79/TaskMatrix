import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from "react";
import apiClient from "../services/apiClient";
import { useWorkspace } from "./WorkspaceContext";
import { useAuth } from "./AuthContext";

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
        project: t.project || t.Project,
        priority: t.priority || t.Priority || "Medium",
        status: t.status || t.Status || "Todo",
        dueDate: t.dueDate || t.DueDate,
        startTime: t.startTime || t.StartTime,
        endTime: t.endTime || t.EndTime,
        createdAt: t.createdAt || t.CreatedAt,
        updatedAt: t.updatedAt || t.UpdatedAt,
        completedAt: t.completedAt || t.CompletedAt,
        actualMinutes: t.actualMinutes ?? t.ActualMinutes ?? 0,
        isLocalOnly: Boolean(t.isLocalOnly || t.IsLocalOnly),
    };
}

function readStoredTasks(key) {
    try {
        const stored = localStorage.getItem(key);
        const parsed = stored ? JSON.parse(stored) : [];
        return Array.isArray(parsed)
            ? parsed.map(normalizeTask).filter(Boolean)
            : [];
    } catch (error) {
        console.error("Could not read locally saved tasks:", error);
        return [];
    }
}

function backendUnavailable(error) {
    // 401 là lỗi xác thực, không phải mất kết nối
    if (error?.response) {
        return error.response.status >= 500;
    }

    // Chỉ coi là offline khi không thể kết nối Backend
    return Boolean(
        error?.request ||
        error?.code === "ERR_NETWORK"
    );
}

export function TaskProvider({ children }) {
    const { currentWorkspace } = useWorkspace();
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [storageMode, setStorageMode] = useState("online");

    const storageKey = `taskmatrix:tasks:${user?.id || user?.email || "guest"}:${currentWorkspace?.id || "personal"}`;

    const saveTasksLocally = useCallback(
        (nextTasks) => {
            localStorage.setItem(storageKey, JSON.stringify(nextTasks));
        },
        [storageKey],
    );

    // 1. Lấy danh sách Tasks từ DB
    const fetchTasks = useCallback(async () => {
        setLoading(true);
        try {
            // apiClient đã unwrap sẵn response.data, nên res ở đây chính là Array
            const res = await apiClient.get("/tasks");
            const rawList = Array.isArray(res) ? res : [];

            const serverTasks = rawList.map(normalizeTask).filter(Boolean);
            const localOnlyTasks = readStoredTasks(storageKey).filter(
                (task) => task.isLocalOnly,
            );
            const serverTaskIds = new Set(serverTasks.map((task) => task.id));
            const cleanTasks = [
                ...serverTasks,
                ...localOnlyTasks.filter((task) => !serverTaskIds.has(task.id)),
            ];
            saveTasksLocally(cleanTasks);
            setTasks(cleanTasks);
            setStorageMode("online");
        } catch (err) {
            console.error("Lỗi khi tải danh sách Tasks từ DB:", err);

            setTasks(readStoredTasks(storageKey));

            if (backendUnavailable(err)) {
                setStorageMode("offline");
            } else {
                setStorageMode("online");
            }
        }finally {
            setLoading(false);
        }
    }, [saveTasksLocally, storageKey]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks, currentWorkspace?.id]);

    // 2. Thêm Task mới
    const addTask = async (formData) => {
        try {
            // const dueISO = formData.dueDate
            //     ? new Date(formData.dueDate).toISOString()
            //     : new Date().toISOString();

            // const startISO =
            //     formData.startTime && formData.dueDate
            //         ? new Date(
            //               `${formData.dueDate}T${formData.startTime}:00`,
            //           ).toISOString()
            //         : null;

            // const endISO =
            //     formData.endTime && formData.dueDate
            //         ? new Date(
            //               `${formData.dueDate}T${formData.endTime}:00`,
            //           ).toISOString()
            //         : null;

            // Giữ nguyên ngày theo giờ địa phương, tránh lệch ngày UTC
                const dueISO = formData.dueDate
                    ? `${formData.dueDate}T00:00:00`
                    : null;

                const startISO =
                    formData.startTime && formData.dueDate
                        ? `${formData.dueDate}T${formData.startTime}:00`
                        : null;

                const endISO =
                    formData.endTime && formData.dueDate
                        ? `${formData.dueDate}T${formData.endTime}:00`
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

            try {
                const createdData = await apiClient.post("/tasks", payload);
                const newTask = normalizeTask(createdData);
                if (!newTask?.id) {
                    throw new Error("The server did not return the created task.");
                }

                const nextTasks = [newTask, ...tasks.filter(Boolean)];
                saveTasksLocally(nextTasks);
                setTasks(nextTasks);
                setStorageMode("online");
                return newTask;
            } catch (err) {
                if (!backendUnavailable(err)) throw err;

                const newTask = normalizeTask({
                    ...payload,
                    id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                    project: formData.project?.trim() || "",
                    isLocalOnly: true,
                    createdAt: new Date().toISOString(),
                });
                const nextTasks = [newTask, ...tasks.filter(Boolean)];
                saveTasksLocally(nextTasks);
                setTasks(nextTasks);
                setStorageMode("offline");
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
        const updatedAt = new Date().toISOString();
        const completedAt =
            newStatus === "Completed" ? updatedAt : null;

        const nextTasks = tasks.map((task) =>
            task?.id === taskId
                ? { ...task, status: newStatus, completedAt, updatedAt }
                : task,
        );
        saveTasksLocally(nextTasks);
        setTasks(nextTasks);

        if (String(taskId).startsWith("local-")) return;

        try {
            await apiClient.put(`/tasks/${taskId}`, {
                ...target,
                status: newStatus,
                completedAt,
            });
        } catch (err) {
            console.error("Lỗi cập nhật Task:", err);
            if (backendUnavailable(err)) {
                setStorageMode("offline");
            } else {
                fetchTasks();
            }
        }
    };

    // 4. Xóa Task
    const deleteTask = async (taskId) => {
        const nextTasks = tasks.filter((task) => task?.id !== taskId);
        saveTasksLocally(nextTasks);
        setTasks(nextTasks);

        if (String(taskId).startsWith("local-")) return;

        try {
            await apiClient.delete(`/tasks/${taskId}`);
        } catch (err) {
            console.error("Lỗi xóa Task:", err);
            if (backendUnavailable(err)) {
                setStorageMode("offline");
            } else {
                fetchTasks();
            }
        }
    };

    return (
        <TaskContext.Provider
            value={{
                tasks,
                loading,
                storageMode,
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

// export function toISODate(date) {
//     if (!date) return new Date().toISOString().split("T")[0];
//     const d = new Date(date);
//     return d.toISOString().split("T")[0];
// }

export function toISODate(date) {
    if (!date) {
        const now = new Date();
        return [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, "0"),
            String(now.getDate()).padStart(2, "0"),
        ].join("-");
    }

    const d = new Date(date);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


export function timeToHours(timeStr, options = {}) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(":").map(Number);
    const total = h + (m || 0) / 60;
    return options.isEnd && total === 0 ? 24 : total;
}
