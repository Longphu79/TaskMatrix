import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { SearchIcon, MenuIcon } from "../components/icon";
import NotificationBell from "../features/Notification/components/NotificationBell";
import UserDropdown from "../components/UserDropdown";
import WorkspaceSwitcher from "../components/WorkspaceSwitcher";
import { useWorkspace } from "../context/WorkspaceContext";
import AllCallListener from "../components/AllCallListener";

function Sidebar({ open, onClose, collapsed }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { navigation } = useWorkspace();

    return (
        <>
            {open && (
                <div
                    className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
                    onClick={onClose}
                />
            )}
            <aside
                className={`fixed z-40 flex h-full shrink-0 flex-col border-r border-hairline bg-white py-7 transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 lg:static lg:translate-x-0 ${
                    open ? "translate-x-0" : "-translate-x-full"
                } ${collapsed ? "w-64 px-5 lg:w-20 lg:px-3" : "w-64 px-5"}`}
            >
                {/* Logo */}
                <div
                    className={`mb-10 transition-all ${
                        collapsed ? "px-3 lg:px-0 lg:text-center" : "px-3"
                    }`}
                >
                    <span
                        className={`font-display text-2xl font-bold tracking-tight text-ink dark:text-white ${
                            collapsed ? "lg:hidden" : ""
                        }`}
                    >
                        TASK<span className="text-brand">MATRIX.</span>
                    </span>
                    {collapsed && (
                        <span className="hidden font-display text-2xl font-bold tracking-tight text-ink dark:text-white lg:inline">
                            T<span className="text-brand">M.</span>
                        </span>
                    )}
                </div>

                {/* Danh sách Điều hướng Động từ Context */}
                <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
                    {navigation.map(({ path, label, Icon }) => {
                        const isActive = location.pathname === path;
                        return (
                            <button
                                key={path}
                                title={collapsed ? label : undefined}
                                onClick={() => {
                                    navigate(path);
                                    onClose();
                                }}
                                className={`flex w-full items-center gap-3 rounded-2xl py-3 text-sm font-medium transition ${
                                    collapsed
                                        ? "px-4 lg:justify-center lg:px-0"
                                        : "px-4"
                                } ${
                                    isActive
                                        ? "bg-ink text-white shadow-[0_10px_20px_rgba(28,28,28,0.18)] dark:bg-brand dark:text-slate-900"
                                        : "text-muted hover:bg-canvas hover:text-ink dark:hover:bg-slate-800 dark:hover:text-white"
                                }`}
                            >
                                <span
                                    className={`shrink-0 ${
                                        isActive
                                            ? "text-brand dark:text-slate-900"
                                            : ""
                                    }`}
                                >
                                    <Icon width={20} height={20} />
                                </span>
                                <span
                                    className={`truncate ${
                                        collapsed ? "lg:hidden" : ""
                                    }`}
                                >
                                    {label}
                                </span>
                            </button>
                        );
                    })}
                </nav>

                {/* Bộ chuyển đổi Workspace ở góc dưới cùng */}
                <div className="mt-auto pt-4">
                    <WorkspaceSwitcher
                        onSwitch={onClose}
                        collapsed={collapsed}
                    />
                </div>
            </aside>
        </>
    );
}

function Topbar({ onMenu }) {
    const [query, setQuery] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const { navigation } = useWorkspace();

    const currentNav = navigation.find((n) => n.path === location.pathname);
    const title = currentNav ? currentNav.label : "Dashboard";

    return (
        <header className="flex items-center gap-4 border-b border-hairline px-5 py-4 dark:border-slate-800 lg:px-8">
            <button
                onClick={onMenu}
                aria-label="Toggle sidebar"
                className="rounded-xl p-2 text-ink transition hover:bg-white dark:text-white dark:hover:bg-slate-800"
            >
                <MenuIcon />
            </button>
            <h1 className="font-display text-lg font-semibold text-ink dark:text-white">
                {title}
            </h1>

            {/* Ô Tìm kiếm */}
            <div className="relative ml-auto hidden w-full max-w-sm items-center sm:flex">
                <SearchIcon
                    width={18}
                    height={18}
                    className="pointer-events-none absolute left-4 text-muted"
                />
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search Project..."
                    className="w-full rounded-full border border-hairline bg-white py-2.5 pl-11 pr-4 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
            </div>

            {/* Chuông Thông báo (Workspace + AI Briefing) */}
            <NotificationBell className="ml-auto sm:ml-0" />

            {/* User Dropdown */}
            <UserDropdown onNavigate={(key) => navigate(`/${key}`)} />
        </header>
    );
}

export default function MainLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    const handleToggleSidebar = () => {
        if (window.innerWidth >= 1024) {
            setCollapsed((prev) => !prev);
        } else {
            setSidebarOpen((prev) => !prev);
        }
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-canvas dark:bg-slate-950">
            <AllCallListener />
            <Sidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                collapsed={collapsed}
            />

            <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
                <Topbar onMenu={handleToggleSidebar} />

                <main className="flex flex-1 flex-col overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
