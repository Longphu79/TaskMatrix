import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
    GridIcon,
    ChartIcon,
    ClockIcon,
    ListIcon,
    FileIcon,
    SettingsIcon,
    BellIcon,
    SearchIcon,
    ChevronDownIcon,
    MenuIcon,
} from "../assets/components/icon";
import UserDropdown from "../assets/components/UserDropdown";

/* Icon Bong bóng Chat dành riêng cho mục Chat */
function ChatIcon({ width = 20, height = 20, className = "" }) {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    );
}

const NAV = [
    {
        key: "dashboard",
        label: "Dashboard",
        path: "/dashboard",
        Icon: GridIcon,
    },
    {
        key: "analytic",
        label: "Analytics",
        path: "/analytics",
        Icon: ChartIcon,
    },
    {
        key: "timesheets",
        label: "Timesheets",
        path: "/timesheets",
        Icon: ClockIcon,
    },
    { key: "todo", label: "Todo List", path: "/todo", Icon: ListIcon },
    { key: "report", label: "Reports", path: "/report", Icon: FileIcon },
    {
        key: "chat",
        label: "Team Chat",
        path: "/chat",
        Icon: ChatIcon,
    },
    {
        key: "settings",
        label: "Settings",
        path: "/settings",
        Icon: SettingsIcon,
    },
];

function Sidebar({ open, onClose }) {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <>
            {open && (
                <div
                    className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
                    onClick={onClose}
                />
            )}
            <aside
                className={`fixed z-40 flex h-full w-64 shrink-0 flex-col overflow-hidden border-r border-hairline bg-white px-5 py-7 transition-transform dark:border-slate-800 dark:bg-slate-900 lg:static lg:translate-x-0 ${
                    open ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                {/* Logo */}
                <div className="mb-10 px-3">
                    <span className="font-display text-2xl font-bold tracking-tight text-ink dark:text-white">
                        TASK<span className="text-brand">MATRIX.</span>
                    </span>
                </div>

                {/* Danh sách Điều hướng */}
                <nav className="flex flex-1 flex-col gap-1.5">
                    {NAV.map(({ key, label, path, Icon }) => {
                        const isActive = location.pathname === path;
                        return (
                            <button
                                key={key}
                                onClick={() => {
                                    navigate(path);
                                    onClose();
                                }}
                                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                                    isActive
                                        ? "bg-ink text-white shadow-[0_10px_20px_rgba(28,28,28,0.18)] dark:bg-brand dark:text-slate-900"
                                        : "text-muted hover:bg-canvas hover:text-ink dark:hover:bg-slate-800 dark:hover:text-white"
                                }`}
                            >
                                <span
                                    className={
                                        isActive
                                            ? "text-brand dark:text-slate-900"
                                            : ""
                                    }
                                >
                                    <Icon width={20} height={20} />
                                </span>
                                {label}
                            </button>
                        );
                    })}
                </nav>

                {/* Thông tin Công ty */}
                <div className="mt-6">
                    <span className="mb-2 block px-1 text-xs font-medium text-muted">
                        Company
                    </span>
                    <button className="flex w-full items-center justify-between rounded-2xl border border-hairline px-4 py-3 text-sm font-medium text-ink transition hover:border-brand dark:border-slate-800 dark:text-white dark:hover:border-brand">
                        Matrix Domain
                        <ChevronDownIcon
                            width={16}
                            height={16}
                            className="text-muted"
                        />
                    </button>
                </div>
            </aside>
        </>
    );
}

function Topbar({ onMenu }) {
    const [query, setQuery] = useState("");
    const navigate = useNavigate();
    const location = useLocation();

    const currentNav = NAV.find((n) => n.path === location.pathname);
    const title = currentNav ? currentNav.label : "Dashboard";

    return (
        <header className="flex items-center gap-4 border-b border-hairline px-5 py-4 dark:border-slate-800 lg:px-8">
            <button
                onClick={onMenu}
                className="rounded-xl p-2 text-ink transition hover:bg-white dark:text-white dark:hover:bg-slate-800 lg:hidden"
            >
                <MenuIcon />
            </button>
            <button
                onClick={onMenu}
                className="hidden rounded-xl p-2 text-ink transition hover:bg-white dark:text-white dark:hover:bg-slate-800 lg:block"
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

            {/* Nút Thông báo */}
            <button className="relative ml-auto rounded-full bg-white p-2.5 text-ink transition hover:text-brand dark:bg-slate-800 dark:text-white sm:ml-0">
                <BellIcon width={20} height={20} />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand ring-2 ring-white dark:ring-slate-800" />
            </button>

            {/* User Dropdown */}
            <UserDropdown onNavigate={(key) => navigate(`/${key}`)} />
        </header>
    );
}

export default function MainLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen w-full overflow-hidden bg-canvas dark:bg-slate-950">
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
                <Topbar onMenu={() => setSidebarOpen((prev) => !prev)} />

                <main className="flex flex-1 flex-col overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
