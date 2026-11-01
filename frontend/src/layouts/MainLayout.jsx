import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { BellIcon, SearchIcon, MenuIcon } from "../components/icon";
import UserDropdown from "../components/UserDropdown"; // Hoặc đường dẫn UserDropdown của bạn
import WorkspaceSwitcher from "../components/WorkspaceSwitcher"; // Hoặc đường dẫn WorkspaceSwitcher của bạn
import { useWorkspace } from "../context/WorkspaceContext"; // Hoặc đường dẫn WorkspaceContext của bạn

function Sidebar({ open, onClose }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { navigation } = useWorkspace(); // Lấy danh sách menu động theo Workspace

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

                {/* Danh sách Điều hướng Động từ Context */}
                <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
                    {navigation.map(({ path, label, Icon }) => {
                        const isActive = location.pathname === path;
                        return (
                            <button
                                key={path}
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

                {/* Bộ chuyển đổi Workspace ở góc dưới cùng */}
                <div className="mt-auto pt-4">
                    <WorkspaceSwitcher onSwitch={onClose} />
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

    // Tiêu đề trang tự động khớp theo Route hiện tại
    const currentNav = navigation.find((n) => n.path === location.pathname);
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
