import { createContext, useContext, useEffect, useState, useMemo } from "react";
import {
    GridIcon,
    ChartIcon,
    ClockIcon,
    ListIcon,
    FileIcon,
    SettingsIcon,
    FolderIcon,
    ChatIcon,
    RobotIcon,
    UsersIcon, // Icon dùng cho Quản lý Thành viên
} from "../components/icon";

// Danh sách Workspace mặc định đơn giản hóa (Chỉ có Manager & Employee)
const DEFAULT_WORKSPACES = [
    {
        id: "personal",
        name: "Personal Workspace",
        type: "personal",
        role: "Owner",
        members: [
            {
                id: "u-1",
                name: "Alex Morgan",
                role: "Owner",
                avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
            },
        ],
    },
    {
        id: "matrix-domain",
        name: "Matrix Domain Co.",
        type: "company",
        role: "Manager",
        members: [
            {
                id: "u-1",
                name: "Alex Morgan",
                role: "Manager",
                avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
            },
            {
                id: "u-2",
                name: "Sarah Jenkins",
                role: "Employee",
                avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
            },
            {
                id: "u-3",
                name: "David Chen",
                role: "Employee",
                avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
            },
        ],
    },
    {
        id: "fpt-team",
        name: "FPT Software Team",
        type: "company",
        role: "Employee",
        members: [
            {
                id: "u-4",
                name: "Robert Vance",
                role: "Manager",
                avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
            },
            {
                id: "u-1",
                name: "Alex Morgan",
                role: "Employee",
                avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
            },
        ],
    },
];

const WorkspaceContext = createContext(null);

function readStorage(key, fallback) {
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : fallback;
    } catch {
        return fallback;
    }
}

export function WorkspaceProvider({ children }) {
    const [workspaces, setWorkspaces] = useState(() =>
        readStorage("tasky-workspaces", DEFAULT_WORKSPACES),
    );
    const [currentId, setCurrentId] = useState(() =>
        readStorage("tasky-current-workspace", "matrix-domain"),
    );

    const currentWorkspace =
        workspaces.find((w) => w.id === currentId) || workspaces[0];

    const isPersonal = currentWorkspace.type === "personal";
    const isManager = !isPersonal && currentWorkspace.role === "Manager";

    useEffect(() => {
        localStorage.setItem("tasky-workspaces", JSON.stringify(workspaces));
        localStorage.setItem(
            "tasky-current-workspace",
            JSON.stringify(currentWorkspace.id),
        );
    }, [workspaces, currentWorkspace.id]);

    const switchWorkspace = (id) => {
        if (workspaces.some((w) => w.id === id)) {
            setCurrentId(id);
        }
    };

    const addCompany = (name, mode) => {
        const newCompany = {
            id: `company-${Date.now()}`,
            name: name.trim(),
            type: "company",
            role: mode === "create" ? "Manager" : "Employee",
            members: [
                {
                    id: "u-1",
                    name: "Dung",
                    role: mode === "create" ? "Manager" : "Employee",
                },
            ],
        };
        setWorkspaces((prev) => [...prev, newCompany]);
        setCurrentId(newCompany.id);
    };

    // Bọc useMemo để cố định mảng Navigation, không gây lặp re-render vô tận
    const navigation = useMemo(() => {
        return isPersonal
            ? [
                  { path: "/dashboard", label: "Dashboard", Icon: GridIcon },
                  { path: "/analytics", label: "Analytics", Icon: ChartIcon },
                  { path: "/timesheets", label: "Timesheets", Icon: ClockIcon },
                  { path: "/ai-agent", label: "AI Agent", Icon: RobotIcon }, // AI Agent dưới Timesheets
                  { path: "/todo", label: "Todo List", Icon: ListIcon },
                  { path: "/report", label: "Reports", Icon: FileIcon },
                  { path: "/settings", label: "Settings", Icon: SettingsIcon },
              ]
            : [
                  {
                      path: "/dashboard",
                      label: "Team Dashboard",
                      Icon: GridIcon,
                  },
                  {
                      path: "/projects",
                      label: "Projects & Tasks",
                      Icon: FolderIcon,
                  },
                  { path: "/chat", label: "Team Chat", Icon: ChatIcon },
                  { path: "/ai-agent", label: "AI Agent", Icon: RobotIcon }, // AI Agent dưới Team Chat
                  {
                      path: "/timesheets",
                      label: "Team Timesheets",
                      Icon: ClockIcon,
                  },
                  { path: "/report", label: "Team Reports", Icon: FileIcon },
                  ...(isManager
                      ? [
                            {
                                path: "/members",
                                label: "Manage Members",
                                Icon: UsersIcon,
                            },
                            {
                                path: "/settings",
                                label: "Company Settings",
                                Icon: SettingsIcon,
                            },
                        ]
                      : [
                            {
                                path: "/settings",
                                label: "Settings",
                                Icon: SettingsIcon,
                            },
                        ]),
              ];
    }, [isPersonal, isManager]);

    return (
        <WorkspaceContext.Provider
            value={{
                workspaces,
                currentWorkspace,
                switchWorkspace,
                addCompany,
                isPersonal,
                isManager,
                members: currentWorkspace.members || [],
                navigation,
            }}
        >
            {children}
        </WorkspaceContext.Provider>
    );
}

export function useWorkspace() {
    const context = useContext(WorkspaceContext);
    if (!context) {
        throw new Error("useWorkspace must be used within WorkspaceProvider");
    }
    return context;
}
