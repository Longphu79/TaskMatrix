const TASKS_KEY = "tasky-tasks";

export const INITIAL_TASKS = [
    {
        id: 1,
        title: "Creating Wireframe for Food Dashboard",
        project: "Food Dashboard",
        priority: "High",
        progress: 78,
        due: "Sep 08, 2026",
        done: false,
        status: "To Do",
    },
    {
        id: 2,
        title: "Research & Development for new module",
        project: "Matrix Domain",
        priority: "Medium",
        progress: 40,
        due: "Sep 10, 2026",
        done: false,
        status: "In Progress",
    },
    {
        id: 3,
        title: "Prototype interaction states",
        project: "Project Four",
        priority: "High",
        progress: 55,
        due: "Sep 09, 2026",
        done: false,
        status: "In Review",
    },
    {
        id: 4,
        title: "Prepare client review deck",
        project: "Project Three",
        priority: "Low",
        progress: 100,
        due: "Sep 04, 2026",
        done: true,
        status: "Done",
    },
    {
        id: 5,
        title: "Design QA and developer handoff",
        project: "Food Dashboard",
        priority: "Medium",
        progress: 100,
        due: "Sep 03, 2026",
        done: true,
        status: "Done",
    },
    {
        id: 6,
        title: "Finalize typography and color tokens",
        project: "Matrix Domain",
        priority: "Low",
        progress: 20,
        due: "Sep 12, 2026",
        done: false,
        status: "To Do",
    },
];

export function loadTasks() {
    try {
        const stored = localStorage.getItem(TASKS_KEY);
        if (!stored) return INITIAL_TASKS;

        const tasks = JSON.parse(stored);
        if (!Array.isArray(tasks)) return INITIAL_TASKS;

        return tasks.map((task) => ({
            ...task,
            status: task.status || (task.done ? "Done" : "To Do"),
        }));
    } catch {
        return INITIAL_TASKS;
    }
}

export function saveTasks(tasks) {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}
