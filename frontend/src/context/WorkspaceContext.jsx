import {
    createContext,
    useContext,
    useEffect,
    useState,
    useMemo,
    useCallback,
} from "react";
import apiClient from "../services/apiClient";
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
    UsersIcon,
} from "../components/icon";

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
    const [workspaces, setWorkspaces] = useState([]);
    const [currentId, setCurrentId] = useState("personal");
    const [loading, setLoading] = useState(true);

    // 🟢 1. Tải danh sách Workspace từ DB (Tối ưu deps [] để không bị lặp API)
    const fetchWorkspaces = useCallback(async () => {
        const token =
            localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const data = await apiClient.get("/workspaces");
            if (Array.isArray(data) && data.length > 0) {
                setWorkspaces(data);

                // 🟢 Dùng Functional Update (prevId) để không cần thêm currentId vào deps []
                setCurrentId((prevId) => {
                    const exists = data.some((w) => w.id === prevId);
                    return exists ? prevId : data[0].id;
                });
            } else {
                setWorkspaces([
                    {
                        id: "personal",
                        name: "Personal Workspace",
                        type: "personal",
                        role: "Owner",
                        members: [],
                    },
                ]);
            }
        } catch (err) {
            console.error("Lỗi khi tải danh sách Workspace từ DB:", err);
        } finally {
            setLoading(false);
        }
    }, []); // 🟢 Bỏ currentId ra khỏi deps -> Không bao giờ bị lặp re-render API!

    useEffect(() => {
        fetchWorkspaces();
    }, [fetchWorkspaces]);

    const currentWorkspace = useMemo(() => {
        return (
            workspaces.find((w) => w.id === currentId) ||
            workspaces[0] || {
                id: "personal",
                name: "Personal Workspace",
                type: "personal",
                role: "Owner",
                members: [],
            }
        );
    }, [workspaces, currentId]);

    const isPersonal = currentWorkspace.type === "personal";
    const isManager =
        !isPersonal &&
        (currentWorkspace.role === "Manager" ||
            currentWorkspace.role === "Owner");

    const switchWorkspace = (id) => {
        setCurrentId(id);
    };

    // 🟢 2. Tạo Công ty/Nhóm mới đẩy trực tiếp lên DB MongoDB
    const addCompany = async (name) => {
        try {
            const newCompany = await apiClient.post("/workspaces", { name });
            await fetchWorkspaces();
            if (newCompany?.id) setCurrentId(newCompany.id);
        } catch (err) {
            console.error("Lỗi khi tạo công ty mới:", err);
            alert(
                err?.response?.data?.message || "Không thể tạo Workspace mới.",
            );
        }
    };

    // 🟢 3. Rời khỏi Workspace Công ty
    const leaveWorkspace = async (workspaceId) => {
        try {
            await apiClient.post(`/workspaces/${workspaceId}/leave`);

            if (currentId === workspaceId) {
                setCurrentId("personal");
            }

            await fetchWorkspaces();
        } catch (err) {
            console.error("Lỗi khi rời Workspace:", err);
            alert(
                err?.response?.data?.message || "Không thể rời khỏi Workspace.",
            );
        }
    };

    // 🟢 4. Mảng Navigation cho Sidebar UI
    const navigation = useMemo(() => {
        return isPersonal
            ? [
                  { path: "/dashboard", label: "Dashboard", Icon: GridIcon },
                  { path: "/analytics", label: "Analytics", Icon: ChartIcon },
                  { path: "/timesheets", label: "Timesheets", Icon: ClockIcon },
                  { path: "/ai-agent", label: "AI Agent", Icon: RobotIcon },
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
                  { path: "/ai-agent", label: "AI Agent", Icon: RobotIcon },
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
                                label: "Project Settings",
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
                fetchWorkspaces,
                isPersonal,
                isManager,
                members: currentWorkspace.members || [],
                navigation,
                leaveWorkspace,
                loading,
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
