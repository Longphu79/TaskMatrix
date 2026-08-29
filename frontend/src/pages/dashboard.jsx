import { useState } from "react";
import {
    GridIcon,
    ChartIcon,
    ClockIcon,
    ListIcon,
    FileIcon,
    SettingsIcon,
    BellIcon,
    SearchIcon,
    PlayIcon,
    PauseIcon,
    FolderIcon,
    MoreIcon,
    ChevronDownIcon,
    MenuIcon,
} from "../assets/components/icon";

const NAV = [
    { key: "dashboard", label: "Dashboard", Icon: GridIcon },
    { key: "analytic", label: "Analytic", Icon: ChartIcon },
    { key: "timesheets", label: "Timesheets", Icon: ClockIcon },
    { key: "todo", label: "Todo", Icon: ListIcon },
    { key: "report", label: "Report", Icon: FileIcon },
    { key: "settings", label: "Settings", Icon: SettingsIcon },
];

const AVATAR =
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&auto=format";
const AVATAR_2 =
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&auto=format";

const THUMBS = [
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=280&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=400&h=280&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=280&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=280&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=280&fit=crop&auto=format",
];

const PROJECTS = [
    { name: "Project one", time: "00:40:00", pct: 82 },
    { name: "Project Two", time: "00:10:00", pct: 28 },
    { name: "Project Three", time: "00:20:00", pct: 46 },
    { name: "Project Four", time: "00:30:00", pct: 64 },
];

const MEMBERS = [
    {
        name: "John Ekeler",
        role: "Food Dashboard Design",
        note: "Creating UI and Research",
        avatar: AVATAR_2,
        today: "00:40:00",
        week: "00:40:00",
    },
    {
        name: "Rubik Sans",
        role: "Project Name",
        note: "Creating UI and Research",
        avatar: AVATAR,
        today: "00:40:00",
        week: "00:40:00",
    },
];

function IconChip({ children }) {
    return (
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            {children}
        </div>
    );
}

function ProgressBar({ pct }) {
    return (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-hairline">
            <div
                className="h-full rounded-full bg-brand transition-all"
                style={{ width: `${pct}%` }}
            />
        </div>
    );
}

function CardHead({ title }) {
    return (
        <div className="mb-5 flex items-center justify-between">
            <h3 className="font-display text-[17px] font-semibold text-ink">
                {title}
            </h3>
            <button className="rounded-lg p-1 text-muted transition hover:bg-canvas hover:text-ink">
                <MoreIcon width={18} height={18} />
            </button>
        </div>
    );
}

function StatCard({ label, value, Icon }) {
    return (
        <div className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(17,17,26,0.04)]">
            <div className="mb-8 flex items-start justify-between">
                <span className="text-sm font-medium text-muted">{label}</span>
                <MoreIcon width={18} height={18} className="text-muted" />
            </div>
            <div className="flex items-end justify-between">
                <span className="font-display text-3xl font-bold text-ink">
                    {value}
                </span>
                <IconChip>
                    <Icon width={22} height={22} />
                </IconChip>
            </div>
        </div>
    );
}

function Sidebar({ active, setActive, open, onClose }) {
    return (
        <>
            {open && (
                <div
                    className="fixed inset-0 z-30 bg-black/30 lg:hidden"
                    onClick={onClose}
                />
            )}
            <aside
                className={`fixed z-40 flex h-full w-64 flex-col bg-white px-5 py-7 transition-transform lg:static lg:translate-x-0 ${
                    open ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="mb-10 px-3">
                    <span className="font-display text-2xl font-bold tracking-tight text-ink">
                        TASK<span className="text-brand">Y.</span>
                    </span>
                </div>

                <nav className="flex flex-1 flex-col gap-1.5">
                    {NAV.map(({ key, label, Icon }) => {
                        const isActive = key === active;
                        return (
                            <button
                                key={key}
                                onClick={() => {
                                    setActive(key);
                                    onClose();
                                }}
                                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
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
                Dashboard
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

            <div className="flex shrink-0 items-center gap-3 rounded-full bg-white py-1.5 pl-4 pr-1.5">
                <div className="hidden whitespace-nowrap text-right leading-tight sm:block">
                    <div className="text-sm font-semibold text-ink">
                        Manjay Gupta
                    </div>
                    <div className="text-xs text-muted">UI/UX Designer</div>
                </div>
                <img
                    src={AVATAR}
                    alt="Manjay Gupta"
                    className="h-10 w-10 shrink-0 rounded-full bg-canvas object-cover"
                />
            </div>
        </header>
    );
}

function TimeTracker() {
    const [running, setRunning] = useState(false);
    return (
        <div className="flex items-center justify-between rounded-3xl bg-ink p-5 pl-7 text-white shadow-[0_16px_40px_rgba(28,28,28,0.25)]">
            <div>
                <div className="font-display text-lg font-semibold">
                    {running ? "Stop Time Tracker" : "Start Time Tracker"}
                </div>
                <div className="mt-0.5 text-xs text-white/50">
                    {running
                        ? "Recording your session…"
                        : "Track your work session"}
                </div>
            </div>
            <button
                onClick={() => setRunning((r) => !r)}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-ink transition hover:scale-105 active:scale-95"
            >
                {running ? (
                    <PauseIcon width={22} height={22} />
                ) : (
                    <PlayIcon width={22} height={22} />
                )}
            </button>
        </div>
    );
}

function RecentActivity() {
    return (
        <div className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(17,17,26,0.04)]">
            <CardHead title="Recent Activity" />
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img
                        src={AVATAR}
                        alt="Rubik Sans"
                        className="h-9 w-9 rounded-full bg-canvas object-cover"
                    />
                    <span className="text-sm font-semibold text-ink">
                        Rubik Sans
                    </span>
                </div>
                <button className="rounded-full border border-hairline px-4 py-1.5 text-xs font-medium text-muted transition hover:border-brand hover:text-ink">
                    View All
                </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
                {THUMBS.map((src, i) => (
                    <img
                        key={i}
                        src={src}
                        alt={`Activity ${i + 1}`}
                        className={`h-24 w-full rounded-xl bg-canvas object-cover ${
                            i === 2 ? "row-span-1" : ""
                        }`}
                    />
                ))}
            </div>
        </div>
    );
}

function ProjectsPanel() {
    return (
        <div className="flex flex-col rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(17,17,26,0.04)]">
            <CardHead title="Projects" />
            <div className="flex-1 space-y-4">
                {PROJECTS.map((p) => (
                    <div key={p.name} className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand">
                            <FolderIcon width={16} height={16} />
                        </span>
                        <span className="w-28 shrink-0 text-sm font-medium text-ink">
                            {p.name}
                        </span>
                        <span className="rounded-md bg-canvas px-2.5 py-1 text-xs font-medium text-muted">
                            {p.time}
                        </span>
                        <div className="flex-1">
                            <ProgressBar pct={p.pct} />
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-6 flex justify-end">
                <button className="rounded-xl bg-ink px-5 py-2 text-xs font-medium text-white transition hover:bg-black">
                    View All
                </button>
            </div>
        </div>
    );
}

function MembersPanel() {
    return (
        <div className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(17,17,26,0.04)]">
            <CardHead title="Members" />
            <div className="mb-3 grid grid-cols-[1fr_auto_auto] gap-6 px-1 text-xs font-medium text-muted">
                <span>Member Info</span>
                <span className="w-16 text-right">Today</span>
                <span className="w-16 text-right">This Week</span>
            </div>
            <div className="space-y-1">
                {MEMBERS.map((m) => (
                    <div
                        key={m.name}
                        className="grid grid-cols-[1fr_auto_auto] items-center gap-6 rounded-2xl px-1 py-2.5 transition hover:bg-canvas"
                    >
                        <div className="flex items-center gap-3">
                            <img
                                src={m.avatar}
                                alt={m.name}
                                className="h-10 w-10 rounded-full bg-canvas object-cover"
                            />
                            <div className="leading-tight">
                                <div className="text-sm font-semibold text-ink">
                                    {m.name}
                                </div>
                                <div className="text-xs font-medium text-ink/70">
                                    {m.role}
                                </div>
                                <div className="text-[11px] text-muted">
                                    {m.note}
                                </div>
                            </div>
                        </div>
                        <span className="w-16 text-right text-xs font-medium text-ink">
                            {m.today}
                        </span>
                        <span className="w-16 text-right text-xs font-medium text-ink">
                            {m.week}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

const INITIAL_TODOS = [
    { name: "Creating Wireframe", time: "00:40:00", pct: 78, done: false },
    { name: "Research Development", time: "00:20:00", pct: 40, done: false },
];

function TodoPanel() {
    const [todos, setTodos] = useState(INITIAL_TODOS);
    const toggle = (i) =>
        setTodos((t) =>
            t.map((item, idx) =>
                idx === i ? { ...item, done: !item.done } : item,
            ),
        );
    return (
        <div className="flex flex-col rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(17,17,26,0.04)]">
            <CardHead title="To Do" />
            <div className="mb-3 flex items-center justify-between px-1 text-xs font-medium text-muted">
                <span>To Dos</span>
                <span>Time</span>
            </div>
            <div className="flex-1 space-y-4">
                {todos.map((t, i) => (
                    <div key={t.name} className="flex items-center gap-3">
                        <button
                            onClick={() => toggle(i)}
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                                t.done
                                    ? "border-brand bg-brand text-ink"
                                    : "border-hairline hover:border-brand"
                            }`}
                        >
                            {t.done && (
                                <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <path
                                        d="m5 13 4 4L19 7"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            )}
                        </button>
                        <span
                            className={`w-40 shrink-0 text-sm font-medium ${
                                t.done ? "text-muted line-through" : "text-ink"
                            }`}
                        >
                            {t.name}
                        </span>
                        <div className="flex-1">
                            <ProgressBar pct={t.done ? 100 : t.pct} />
                        </div>
                        <span className="text-xs font-medium text-muted">
                            {t.time}
                        </span>
                    </div>
                ))}
            </div>
            <div className="mt-6 flex justify-end">
                <button className="rounded-xl bg-ink px-5 py-2 text-xs font-medium text-white transition hover:bg-black">
                    View Reports
                </button>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const [active, setActive] = useState("dashboard");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-full w-full bg-canvas">
            <Sidebar
                active={active}
                setActive={setActive}
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
                <Topbar onMenu={() => setSidebarOpen(true)} />

                <main className="flex-1 overflow-y-auto px-5 pb-8 lg:px-8">
                    {/* Header row */}
                    <div className="mb-6 grid gap-5 lg:grid-cols-[1fr_minmax(0,380px)]">
                        <div className="flex flex-col justify-center">
                            <h2 className="font-display text-3xl font-bold text-ink">
                                Today
                            </h2>
                            <p className="mt-1 text-sm font-medium text-muted">
                                Mon 22, 2021 | 10:00 AM
                            </p>
                        </div>
                        <TimeTracker />
                    </div>

                    {/* Stat cards */}
                    <div className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                        <StatCard
                            label="Weekly Activity"
                            value="0%"
                            Icon={ChartIcon}
                        />
                        <StatCard
                            label="Worked This Week"
                            value="40:00:05"
                            Icon={ClockIcon}
                        />
                        <StatCard
                            label="Project Worked"
                            value="02"
                            Icon={FolderIcon}
                        />
                    </div>

                    {/* Row: Recent Activity + Projects */}
                    <div className="mb-6 grid gap-5 xl:grid-cols-2">
                        <RecentActivity />
                        <ProjectsPanel />
                    </div>

                    {/* Row: Members + To Do */}
                    <div className="grid gap-5 xl:grid-cols-2">
                        <MembersPanel />
                        <TodoPanel />
                    </div>
                </main>
            </div>
        </div>
    );
}
