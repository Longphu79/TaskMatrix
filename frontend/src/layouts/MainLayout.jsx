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

const NAV = [
    {
        key: "dashboard",
        label: "Dashboard",
        path: "/dashboard",
        Icon: GridIcon,
    },
    { key: "analytic", label: "Analytic", path: "/analytics", Icon: ChartIcon },
    {
        key: "timesheets",
        label: "Timesheets",
        path: "/timesheets",
        Icon: ClockIcon,
    },
    { key: "todo", label: "Todo", path: "/todo", Icon: ListIcon },
    { key: "report", label: "Report", path: "/report", Icon: FileIcon },
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
                    className="fixed inset-0 z-30 bg-black/30 lg:hidden"
                    onClick={onClose}
                />
            )}
            {/* Thêm shrink-0 và overflow-hidden để cố định chiều rộng */}
            <aside
                className={`fixed z-40 flex h-full w-64 shrink-0 flex-col overflow-hidden bg-white px-5 py-7 transition-transform lg:static lg:translate-x-0 ${
                    open ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="mb-10 px-3">
                    <span className="font-display text-2xl font-bold tracking-tight text-ink">
                        TASK<span className="text-brand">Y.</span>
                    </span>
                </div>

                <nav className="flex flex-1 flex-col gap-1.5">
                    {NAV.map(({ key, label, path, Icon }) => {
                        const isActive = location.pathname === path;
                        return (
                            /* Thêm w-full để nút ôm trọn khung Sidebar */
                            <button
                                key={key}
                                onClick={() => {
                                    navigate(path);
                                    onClose();
                                }}
                                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                                    isActive
                                        ? "bg-ink text-white shadow-[0_10px_20px_rgba(28,28,28,0.18)]"
                                        : "text-muted hover:bg-canvas hover:text-ink"
                                }`}
                            >
                                <span className={isActive ? "text-brand" : ""}>
                                    <Icon width={20} height={20} />
                                </span>
                                {label}
                            </button>
                        );
                    })}
                </nav>

                <div className="mt-6">
                    <span className="mb-2 block px-1 text-xs font-medium text-muted">
                        Company
                    </span>
                    <button className="flex w-full items-center justify-between rounded-2xl border border-hairline px-4 py-3 text-sm font-medium text-ink transition hover:border-brand">
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
        <header className="flex items-center gap-4 px-5 py-5 lg:px-8">
            <button
                onClick={onMenu}
                className="rounded-xl p-2 text-ink transition hover:bg-white lg:hidden"
            >
                <MenuIcon />
            </button>
            <button className="hidden rounded-xl p-2 text-ink transition hover:bg-white lg:block">
                <MenuIcon />
            </button>
            <h1 className="font-display text-lg font-semibold text-ink">
                {title}
            </h1>

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
                    className="w-full rounded-full border border-hairline bg-white py-2.5 pl-11 pr-4 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand"
                />
            </div>

            <button className="relative ml-auto rounded-full bg-white p-2.5 text-ink transition hover:text-brand sm:ml-0">
                <BellIcon width={20} height={20} />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand ring-2 ring-white" />
            </button>

            <UserDropdown onNavigate={(key) => navigate(`/${key}`)} />
        </header>
    );
}

export default function MainLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen w-full overflow-hidden bg-canvas">
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
                <Topbar onMenu={() => setSidebarOpen(true)} />

                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
