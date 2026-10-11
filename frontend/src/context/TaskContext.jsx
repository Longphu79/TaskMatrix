import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";

/* ---------- date / time helpers shared by pages ---------- */

export function toISODate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

// Parses "YYYY-MM-DD" as a local date (new Date(str) would parse as UTC).
export function parseISODate(str) {
    const [y, m, d] = str.split("-").map(Number);
    return new Date(y, m - 1, d);
}

// "HH:MM" -> decimal hours. An end time of "00:00" is treated as midnight (24).
export function timeToHours(time, { isEnd = false } = {}) {
    const [h, m] = time.split(":").map(Number);
    const hours = h + m / 60;
    return isEnd && hours === 0 ? 24 : hours;
}

export function taskHours(task) {
    return {
        start: timeToHours(task.startTime),
        end: timeToHours(task.endTime, { isEnd: true }),
    };
}

/* ---------- seed data ---------- */

function buildInitialTasks() {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const on = (offset) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + offset);
        return toISODate(d);
    };

    return [
        {
            id: "t1",
            title: "Creating Wireframe for Food Dashboard",
            project: "Food Dashboard",
            priority: "High",
            dueDate: on(0),
            startTime: "09:00",
            endTime: "11:00",
            status: "Completed",
        },
        {
            id: "t2",
            title: "Research & Development for new module",
            project: "Matrix Domain",
            priority: "Medium",
            dueDate: on(1),
            startTime: "10:00",
            endTime: "12:30",
            status: "Pending",
        },
        {
            id: "t3",
            title: "Prototype interaction states",
            project: "Project Four",
            priority: "High",
            dueDate: on(2),
            startTime: "13:00",
            endTime: "15:30",
            status: "Pending",
        },
        {
            id: "t4",
            title: "Prepare client review deck",
            project: "Project Three",
            priority: "Low",
            dueDate: on(3),
            startTime: "14:00",
            endTime: "16:00",
            status: "Pending",
        },
        {
            id: "t5",
            title: "Design QA and developer handoff",
            project: "Food Dashboard",
            priority: "Medium",
            dueDate: on(3),
            startTime: "15:00",
            endTime: "17:00",
            status: "Pending",
        },
        {
            id: "t6",
            title: "Finalize typography and color tokens",
            project: "Matrix Domain",
            priority: "Low",
            dueDate: on(4),
            startTime: "09:00",
            endTime: "11:00",
            status: "Pending",
        },
        {
            id: "t7",
            title: "Team sync and sprint planning",
            project: "Project Three",
            priority: "Medium",
            dueDate: on(4),
            startTime: "19:00",
            endTime: "20:30",
            status: "Pending",
        },
        {
            id: "t8",
            title: "Weekly retrospective",
            project: "Matrix Domain",
            priority: "Low",
            dueDate: on(-3),
            startTime: "16:00",
            endTime: "17:00",
            status: "Completed",
        },
        {
            id: "t9",
            title: "Usability testing session",
            project: "Food Dashboard",
            priority: "High",
            dueDate: on(8),
            startTime: "11:00",
            endTime: "13:00",
            status: "Pending",
        },
    ];
}

/* ---------- context ---------- */

const TaskContext = createContext(null);

export function TaskProvider({ children }) {
    const [tasks, setTasks] = useState(buildInitialTasks);

    const addTask = useCallback((input) => {
        const task = {
            id:
                globalThis.crypto?.randomUUID?.() ??
                `t${Date.now()}${Math.random()}`,
            title: input.title.trim(),
            project: input.project?.trim() || "General",
            priority: input.priority ?? "Medium",
            dueDate: input.dueDate,
            startTime: input.startTime ?? "09:00",
            endTime: input.endTime ?? "11:00",
            status: "Pending",
        };
        setTasks((prev) => [task, ...prev]);
        return task;
    }, []);

    const toggleTask = useCallback((id) => {
        setTasks((prev) =>
            prev.map((t) =>
                t.id === id
                    ? {
                          ...t,
                          status:
                              t.status === "Completed"
                                  ? "Pending"
                                  : "Completed",
                      }
                    : t,
            ),
        );
    }, []);

    const deleteTask = useCallback((id) => {
        setTasks((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const value = useMemo(
        () => ({ tasks, addTask, toggleTask, deleteTask }),
        [tasks, addTask, toggleTask, deleteTask],
    );

    return (
        <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
    );
}

export function useTasks() {
    const ctx = useContext(TaskContext);
    if (!ctx) throw new Error("useTasks must be used within a TaskProvider");
    return ctx;
}
